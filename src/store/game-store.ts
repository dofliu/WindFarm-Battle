// ============================================================
// Sprint 5 Zustand store：包裝核心 GameState + UI 動作。
//
// 流程設計：
//   1. newGame() → 建立初始狀態，跑回合 1 的 startRound（風骰/抽牌/begin P0）
//   2. 使用者 playCard / endTurn → 觸發本地 mutate + 推進回合
//   3. endTurn(P0) → _repairFaults + _periodicRepair → AI turn → repair → endRound
//      → 下一回合 startRound（直到 round > 12 → gameOver）
//
// 為什麼不直接用 runGame：runGame 跑滿 12 回合無暫停點；UI 需要在玩家每個 turn 暫停等輸入。
// 因此這裡組合 rules-engine 的 internal mutate 函式，自行控制流程。
// ============================================================
import { create } from 'zustand';
import type { GameState, GameMode, Difficulty } from '../core/types';
import type { GameEvent } from '../core/events';
import type { Rng } from '../core/rng';
import { createRng } from '../core/rng';
import { createInitialState, cloneState } from '../core/game-state';
import {
  rollWind,
  _drawCard,
  _beginTurn,
  _tickFaults,
  _scoreRound,
  _applySalt,
  _periodicRepair,
  _repairFaults,
  _unpredictableShuffle,
  _tickWeather,
  _checkContracts,
  UI_RICH_CONFIG,
  determineWinner,
} from '../core/rules-engine';
import { _applyActionMutate, canPlayCard, effectiveCost } from '../core/actions';
import { aiTakeTurn } from '../core/ai';
import { CARDS } from '../core/cards';

const HUMAN: 0 | 1 = 0;
const AI: 0 | 1 = 1;
const EVENT_LOG_LIMIT = 200; // 防 store 無限長

/** 從事件列表提取回合結算摘要（供 UI toast 顯示）*/
type RoundScore = NonNullable<GameStore['lastRoundScore']>;
function _extractRoundScore(events: GameEvent[], completedRound: number, p0Total: number, p1Total: number): RoundScore | null {
  const p0 = events.find(e => e.kind === 'round-scored' && (e as { player: number }).player === 0);
  const p1 = events.find(e => e.kind === 'round-scored' && (e as { player: number }).player === 1);
  if (!p0 || !p1 || p0.kind !== 'round-scored' || p1.kind !== 'round-scored') return null;
  return { round: completedRound, p0Mwh: p0.mwh, p1Mwh: p1.mwh, p0Total, p1Total };
}

/** UI 動畫特效（故障/修復一次性閃光）。由 store 自動清掃 */
export interface UiEffect {
  readonly id: string;
  readonly type: 'fault' | 'repair';
  /** side: 0=玩家 / 1=AI；slot: 該玩家機組陣列索引 */
  readonly target: { side: 0 | 1; slot: number; cardId?: string };
  readonly time: number;
}

interface GameStore {
  // 設定
  readonly mode: GameMode;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;

  // 遊戲狀態
  state: GameState;
  events: GameEvent[];
  /** 玩家正在挑選 fault 目標時，記住要出哪張手牌 idx；否則 null */
  pendingFaultHandIdx: number | null;
  /** 玩家正在挑選 turbine 替換目標時，記住要出哪張手牌 idx；否則 null */
  pendingReplaceHandIdx: number | null;
  /** 當前 rng（mutable）— Zustand store 內部使用，不公開 */
  rng: Rng;
  /**
   * AI 正在思考中（UI 顯示動畫用）。
   * 玩家結束回合後，先顯示此旗標 ~700ms，再跑 AI 動作並清除。
   */
  isAiThinking: boolean;

  // ── UI 動畫狀態（不影響規則邏輯）──────────────────────────────
  /** 一次性視覺特效佇列（故障/修復閃光），UI 自動移除 */
  effects: UiEffect[];
  pushEffect: (
    type: 'fault' | 'repair',
    target: { side: 0 | 1; slot: number; cardId?: string },
    durationMs?: number,
  ) => void;
  removeEffect: (id: string) => void;
  /** 風速骰動畫旗標（純 UI；新回合切換時設為 true 1.2s） */
  windRolling: boolean;
  setWindRolling: (rolling: boolean) => void;
  /**
   * 上一回合結算結果（UI 回合摘要 toast 用）。
   * 新回合開始或玩家出牌後自動清除。
   */
  lastRoundScore: {
    round: number;
    p0Mwh: number;
    p1Mwh: number;
    p0Total: number;
    p1Total: number;
  } | null;

  /**
   * AI 上一個 turn 所做動作的事件列表（教學用：讓玩家看到 AI 在做什麼）。
   * endTurn Phase 2 完成後設置；玩家出牌 / 棄牌 / newGame 時清除。
   */
  lastAiActions: GameEvent[];
  clearLastAiActions: () => void;

  /** 本局開始時間（遙測用） */
  gameStartedAt: Date;

  // 動作
  newGame: (seed?: number) => void;
  /** 嘗試出牌；fault 卡若未指定 target 會切到「挑目標」模式 */
  playCard: (handIdx: number, options?: { target?: number; replaceIdx?: number }) => void;
  /** 玩家挑選 fault 目標後完成出牌 */
  selectFaultTarget: (targetIdx: number) => void;
  selectReplaceTarget: (replaceIdx: number) => void;
  cancelPending: () => void;
  /** 玩家主動棄牌（不花費動作，但每回合只能用一次） */
  discardCard: (handIdx: number) => void;
  hasDiscarded: boolean;
  /** 結束玩家回合 → 顯示 AI 思考動畫（~700ms）→ AI 跑完 → 結算 → 進入下一回合 */
  endTurn: () => void;
  /** 清除回合結算摘要（UI toast 消失後呼叫） */
  clearLastRoundScore: () => void;
}

/** 啟動新回合：rollWind + tickFaults + unpredictable + drawCard×N + beginTurn(firstPlayer) */
function startRound(s: GameState, rng: Rng): GameEvent[] {
  const events: GameEvent[] = [];
  // FN05 D4 修正：futureWind 優先消費
  if (s.futureWind.length > 0) {
    s.wind = s.futureWind.shift() as GameState['wind'];
  } else {
    s.wind = rollWind(rng);
  }
  events.push({ kind: 'round-start', round: s.round, windLabel: s.wind.label });

  events.push(..._tickFaults(s));
  events.push(..._unpredictableShuffle(s, rng));
  s.players.forEach((p) => {
    p.mwhBoostActive = false;
  });
  // 每回合抽 drawsPerRound 張（UI_RICH_CONFIG = 2，讓手牌更豐富）
  const draws = UI_RICH_CONFIG.drawsPerRound ?? 1;
  for (let i = 0; i < draws; i++) {
    _drawCard(s, 0, rng, UI_RICH_CONFIG);
    _drawCard(s, 1, rng, UI_RICH_CONFIG);
  }

  // 先手玩家：(round - 1) % 2
  s.firstPlayer = ((s.round - 1) % 2) as 0 | 1;
  _beginTurn(s, s.firstPlayer);
  // 自動補牌：先手玩家手牌不足 refillHandTo 張時補到目標張數
  const refillTo = UI_RICH_CONFIG.refillHandTo ?? 0;
  if (refillTo > 0) {
    while (s.players[s.firstPlayer].hand.length < refillTo) {
      _drawCard(s, s.firstPlayer, rng, UI_RICH_CONFIG);
    }
  }
  return events;
}

/** 結算 + 下回合準備（或結束遊戲） */
function endRound(s: GameState, rng: Rng): GameEvent[] {
  const events: GameEvent[] = [];
  events.push(..._scoreRound(s));
  _applySalt(s);
  events.push(..._checkContracts(s));
  events.push(..._tickWeather(s));

  if (s.round >= s.maxRounds) {
    s.gameOver = true;
    events.push({ kind: 'game-over', winner: determineWinner(s) });
    return events;
  }
  s.round += 1;
  events.push(...startRound(s, rng));
  return events;
}

/** 玩家完成 turn → repair + periodic-repair；若還有下一玩家就 beginTurn；否則 endRound */
function advanceAfterTurn(s: GameState, finishedPlayer: 0 | 1, rng: Rng): GameEvent[] {
  const events: GameEvent[] = [];
  events.push(..._repairFaults(s, finishedPlayer, UI_RICH_CONFIG));
  events.push(..._periodicRepair(s, finishedPlayer));
  const nextPlayer = (1 - finishedPlayer) as 0 | 1;
  // 已經輪過兩位玩家？比較 firstPlayer
  if (finishedPlayer === s.firstPlayer) {
    // 還有對手玩家要動
    _beginTurn(s, nextPlayer);
    // 自動補牌：手牌不足 refillHandTo 張時補到目標張數
    const refillTo = UI_RICH_CONFIG.refillHandTo ?? 0;
    if (refillTo > 0) {
      while (s.players[nextPlayer].hand.length < refillTo) {
        _drawCard(s, nextPlayer, rng, UI_RICH_CONFIG);
      }
    }
  } else {
    // 兩位都動過了 → endRound
    events.push(...endRound(s, rng));
  }
  return events;
}

/** 跑 AI 玩家的整個 turn */
function runAiTurn(s: GameState, difficulty: Difficulty, rng: Rng): GameEvent[] {
  const takeTurn = aiTakeTurn(difficulty, UI_RICH_CONFIG);
  return takeTurn(s, AI, rng);
}

// ============================================================
// Store factory
// ============================================================
function makeInitialStoreState(seed: number, difficulty: Difficulty) {
  const rng = createRng(seed);
  const state = createInitialState(rng);
  // 開局手牌：initialDraws 張（UI_RICH_CONFIG = 3，讓玩家一開始就有選擇）
  const initialDraws = UI_RICH_CONFIG.initialDraws ?? 0;
  for (let i = 0; i < initialDraws; i++) {
    _drawCard(state, 0, rng, UI_RICH_CONFIG);
    _drawCard(state, 1, rng, UI_RICH_CONFIG);
  }
  // 進入回合 1（再抽 drawsPerRound 張）
  const events = startRound(state, rng);
  // 若 AI 先手（round=1 firstPlayer=0，AI 不會先手），但保險起見：
  if (state.currentPlayer === AI && !state.gameOver) {
    const aiEvents = runAiTurn(state, difficulty, rng);
    events.push(...aiEvents);
    events.push(...advanceAfterTurn(state, AI, rng));
  }
  return { state, events, rng };
}

/**
 * 從 events 推導出該觸發哪些一次性視覺特效（fault / repair）。
 * - fault-applied/cascaded：在目標機組上播放故障閃光
 * - fault-repaired：在被修復的機組上播放修復星光
 *
 * 注意：rules-engine 中 fault-applied.player = oppId（受害者的 side = 1 - attacker），
 * 因此這裡直接用 e.player 作為 targetSide，不需再做 1- 翻轉。
 * 若再翻轉一次，特效會出現在攻擊者自己的卡牌上（bug）。
 */
function _deriveEffects(events: GameEvent[]): Array<{ type: 'fault' | 'repair'; side: 0 | 1; slot: number; cardId?: string }> {
  const out: Array<{ type: 'fault' | 'repair'; side: 0 | 1; slot: number; cardId?: string }> = [];
  for (const e of events) {
    if (e.kind === 'fault-applied' || e.kind === 'fault-cascaded') {
      // fault-applied.player = oppId（受害者），直接用作 targetSide
      out.push({ type: 'fault', side: e.player as 0 | 1, slot: e.targetIdx, cardId: e.cardId });
    } else if (e.kind === 'fault-repaired') {
      // 修復對象 = 該玩家自己的機組
      out.push({ type: 'repair', side: e.player, slot: e.targetIdx, cardId: e.cardId });
    }
  }
  return out;
}

let _effectIdCounter = 0;
function _nextEffectId(): string {
  _effectIdCounter += 1;
  return `fx-${Date.now()}-${_effectIdCounter}`;
}

export const useGameStore = create<GameStore>((set, get) => ({
  mode: 'versus',
  difficulty: 'hard',
  setDifficulty: (d) => set({ difficulty: d }),

  ...makeInitialStoreState(20260521, 'hard'),
  pendingFaultHandIdx: null,
  pendingReplaceHandIdx: null,
  hasDiscarded: false,
  isAiThinking: false,
  lastRoundScore: null,
  lastAiActions: [],
  effects: [],
  windRolling: false,
  gameStartedAt: new Date(),

  pushEffect: (type, target, durationMs = 900) => {
    const id = _nextEffectId();
    const fx: UiEffect = { id, type, target, time: Date.now() };
    set((s) => ({ effects: [...s.effects, fx] }));
    window.setTimeout(() => {
      set((s) => ({ effects: s.effects.filter((e) => e.id !== id) }));
    }, durationMs);
  },

  removeEffect: (id) => set((s) => ({ effects: s.effects.filter((e) => e.id !== id) })),

  setWindRolling: (rolling) => set({ windRolling: rolling }),

  newGame: (seed = Date.now() & 0xffffffff) => {
    const { difficulty } = get();
    const fresh = makeInitialStoreState(seed, difficulty);
    set({ ...fresh, pendingFaultHandIdx: null, pendingReplaceHandIdx: null, hasDiscarded: false, isAiThinking: false, lastRoundScore: null, lastAiActions: [], effects: [], windRolling: false, gameStartedAt: new Date() });
  },

  playCard: (handIdx, options) => {
    const { state, events, rng } = get();
    if (state.gameOver || state.currentPlayer !== HUMAN) return;
    if (!canPlayCard(state, HUMAN, handIdx)) return;

    const cardId = state.players[HUMAN].hand[handIdx];
    const card = CARDS[cardId];

    // Fault 卡需指定目標：非停機對手機組 > 1 台時讓玩家選；否則自動鎖定
    if (card.type === 'fault' && options?.target === undefined) {
      const validTargets = state.players[AI].turbines.filter((t) => !t.shutdown);
      if (validTargets.length > 1) {
        set({ pendingFaultHandIdx: handIdx, pendingReplaceHandIdx: null });
        return;
      }
    }

    // Turbine 滿格替換（M10 no-slot 除外，actions 內部已處理）
    if (card.type === 'turbine' && options?.replaceIdx === undefined) {
      // 簡化：交由 actions._deployTurbine 用 findWeakest 替；不強制讓使用者選
    }

    // 套用動作
    const s = cloneState(state);
    const eventsNew = _applyActionMutate(
      s,
      { kind: 'play-card', player: HUMAN, handIdx, target: options?.target, replaceIdx: options?.replaceIdx },
      rng,
      UI_RICH_CONFIG,
    );
    set({
      state: s,
      events: [...events, ...eventsNew].slice(-EVENT_LOG_LIMIT),
      pendingFaultHandIdx: null,
      pendingReplaceHandIdx: null,
      lastAiActions: [],   // 玩家開始動作 → 清除 AI 摘要
    });
    // 觸發一次性視覺特效（故障/修復）
    for (const fx of _deriveEffects(eventsNew)) {
      get().pushEffect(fx.type, { side: fx.side, slot: fx.slot, cardId: fx.cardId });
    }
  },

  selectFaultTarget: (targetIdx) => {
    const { pendingFaultHandIdx, playCard, state } = get();
    if (pendingFaultHandIdx === null) return;
    // 停機中的機組不可作為 fault 目標
    const targetTurbine = state.players[AI].turbines[targetIdx];
    if (targetTurbine?.shutdown) return;
    playCard(pendingFaultHandIdx, { target: targetIdx });
  },

  selectReplaceTarget: (replaceIdx) => {
    const { pendingReplaceHandIdx, playCard } = get();
    if (pendingReplaceHandIdx === null) return;
    playCard(pendingReplaceHandIdx, { replaceIdx });
  },

  cancelPending: () => set({ pendingFaultHandIdx: null, pendingReplaceHandIdx: null }),

  discardCard: (handIdx) => {
    const { state, events, hasDiscarded } = get();
    // 每回合只能棄一張，且必須是玩家回合
    if (state.gameOver || state.currentPlayer !== HUMAN) return;
    if (hasDiscarded) return;
    const s = cloneState(state);
    const hand = s.players[HUMAN].hand;
    if (handIdx < 0 || handIdx >= hand.length) return;
    const discarded = hand.splice(handIdx, 1)[0];
    const discardEvent: GameEvent = { kind: 'card-discarded', player: HUMAN, cardId: discarded };
    set({
      state: s,
      events: [...events, discardEvent].slice(-EVENT_LOG_LIMIT),
      hasDiscarded: true,
      pendingFaultHandIdx: null,
      pendingReplaceHandIdx: null,
      lastAiActions: [],   // 玩家棄牌 → 清除 AI 摘要
    });
  },

  endTurn: () => {
    const { state, events, rng } = get();
    if (state.gameOver || state.currentPlayer !== HUMAN) return;
    // 防止 AI 思考期間重複觸發
    if (get().isAiThinking) return;

    const s = cloneState(state);
    const ev1: GameEvent[] = [{ kind: 'turn-ended', player: HUMAN }];
    ev1.push(..._repairFaults(s, HUMAN, UI_RICH_CONFIG));
    ev1.push(..._periodicRepair(s, HUMAN));

    if (HUMAN === s.firstPlayer) {
      // ── 玩家先手 → AI 接著動 ──
      // Phase 1（同步）：先切換到 AI、顯示「思考中」旗標
      _beginTurn(s, AI);
      set({
        state: s,
        events: [...events, ...ev1].slice(-EVENT_LOG_LIMIT),
        pendingFaultHandIdx: null,
        pendingReplaceHandIdx: null,
        hasDiscarded: false,
        isAiThinking: true,
      });

      // Phase 2（非同步）：AI 思考延遲後跑 AI 動作
      setTimeout(() => {
        const { state: s2, events: ev2, difficulty: diff } = get();
        const s3 = cloneState(s2);
        const ev3: GameEvent[] = [];
        ev3.push(...runAiTurn(s3, diff, rng));
        ev3.push(..._repairFaults(s3, AI, UI_RICH_CONFIG));
        ev3.push(..._periodicRepair(s3, AI));
        const completedRound = s3.round;
        ev3.push(...endRound(s3, rng));
        // 回合結算摘要
        const roundScore = _extractRoundScore(ev3, completedRound, s3.players[0].score, s3.players[1].score);

        // 新回合若 AI 先手 → 同步跑（不再延遲，避免複雜度）
        if (!s3.gameOver && s3.currentPlayer === AI) {
          ev3.push(...runAiTurn(s3, diff, rng));
          ev3.push(..._repairFaults(s3, AI, UI_RICH_CONFIG));
          ev3.push(..._periodicRepair(s3, AI));
          _beginTurn(s3, HUMAN);
        }

        // 提取 AI 動作事件（只保留有意義的行動，排除 repair / round-scoring / weather-tick 等）
        const INTERESTING_AI_KINDS = new Set([
          'card-played', 'turbine-deployed', 'turbine-replaced', 'turbine-returned',
          'tech-deployed', 'fault-applied', 'fault-cascaded', 'func-played',
          'weather-applied', 'contract-applied', 'mwh-boost', 'extra-action-banked',
          'turbine-shutdown',
        ]);
        const aiSummary = ev3.filter(e => INTERESTING_AI_KINDS.has(e.kind) && 'player' in e && (e as { player: number }).player === AI);

        set({
          state: s3,
          events: [...ev2, ...ev3].slice(-EVENT_LOG_LIMIT),
          isAiThinking: false,
          lastRoundScore: roundScore,
          lastAiActions: aiSummary,
        });
        // 觸發 AI 動作 + 回合結算所產生的視覺特效
        for (const fx of _deriveEffects(ev3)) {
          get().pushEffect(fx.type, { side: fx.side, slot: fx.slot, cardId: fx.cardId });
        }
      }, 650 + Math.floor(Math.random() * 350)); // 650–1000ms 隨機思考時間
    } else {
      // ── AI 先手（本回合 AI 已動完）→ 直接結算 ──
      const completedRound = s.round;
      ev1.push(...endRound(s, rng));
      const roundScore = _extractRoundScore(ev1, completedRound, s.players[0].score, s.players[1].score);

      // 新回合若 AI 先手（偶爾發生），同步跑
      if (!s.gameOver && s.currentPlayer === AI) {
        const { difficulty: diff } = get();
        ev1.push(...runAiTurn(s, diff, rng));
        ev1.push(..._repairFaults(s, AI, UI_RICH_CONFIG));
        ev1.push(..._periodicRepair(s, AI));
        _beginTurn(s, HUMAN);
      }

      set({
        state: s,
        events: [...events, ...ev1].slice(-EVENT_LOG_LIMIT),
        pendingFaultHandIdx: null,
        pendingReplaceHandIdx: null,
        hasDiscarded: false,
        isAiThinking: false,
        lastRoundScore: roundScore,
        lastAiActions: [],  // AI 先手時，AI 已在前一回合動完，不重複顯示
      });
      for (const fx of _deriveEffects(ev1)) {
        get().pushEffect(fx.type, { side: fx.side, slot: fx.slot, cardId: fx.cardId });
      }
    }
  },

  clearLastRoundScore: () => set({ lastRoundScore: null }),
  clearLastAiActions: () => set({ lastAiActions: [] }),
}));

// 給測試使用的 helpers（不對 UI 公開）
export const _internalForTest = {
  startRound,
  endRound,
  advanceAfterTurn,
  runAiTurn,
};

// 計算手牌的「實際 cost」給 UI 顯示用
export function uiEffectiveCost(state: GameState, player: 0 | 1, cardId: string): number {
  return effectiveCost(state, player, cardId);
}

/**
 * 快速估算本回合結算可得 MWh（UI 用預覽，近似值）。
 * 不跑完整 _scoreRound（忽略 W 卡光環、F05 storm-amplify 加乘等特效），
 * 但對一般情況已足夠準確，讓玩家理解風速與可用率的關係。
 */
export function uiPreviewMwh(state: GameState, player: 0 | 1): number {
  const p = state.players[player];
  const coeff = state.wind.coeff;
  let mwh = 0;
  for (const t of p.turbines) {
    const card = CARDS[t.cardId];
    const mw = (card.stats?.mw ?? 0) + t.mwBonus;
    const drop = t.faults.reduce((s, f) => s + f.drop, 0);
    const avail = Math.max(0, t.avail - drop);
    mwh += mw * coeff * (avail / 100);
  }
  const boost = p.mwhBoostActive ? 1.5 : 1.0;
  return Math.round(mwh * boost);
}
