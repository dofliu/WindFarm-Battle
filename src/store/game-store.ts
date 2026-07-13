// ============================================================
// Sprint 5 Zustand store：包裝核心 GameState + UI 動作。
// ============================================================
import { create } from 'zustand';
import type { GameState, GameMode, Difficulty } from '../core/types';
import type { GameEvent } from '../core/events';
import { createRng, Rng } from '../core/rng';
import { createInitialState, cloneState } from '../core/game-state';
import {
  startRound,
  endRound,
  _beginTurn,
} from '../core/rules-engine';
import { applyAction, canPlayCard } from '../core/actions';
import { aiChoose } from '../core/ai';
import { RESERVE_THRESHOLD } from '../core/ai/evaluator';
import { CARDS } from '../core/cards';

const HUMAN: 0 | 1 = 0;
const AI: 0 | 1 = 1;
const EVENT_LOG_LIMIT = 200;

export interface UiEffect {
  readonly id: string;
  readonly type: 'fault' | 'repair';
  readonly target: { side: 0 | 1; slot: number; cardId?: string };
  readonly time: number;
}

interface GameStore {
  mode: GameMode;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;

  state: GameState;
  events: GameEvent[];
  pendingFaultHandIdx: number | null; // 借用為道具施放的 turbine 選擇狀態
  pendingReplaceHandIdx: number | null;
  rng: Rng;
  isAiThinking: boolean;

  effects: UiEffect[];
  pushEffect: (
    type: 'fault' | 'repair',
    target: { side: 0 | 1; slot: number; cardId?: string },
    durationMs?: number
  ) => void;
  removeEffect: (id: string) => void;
  windRolling: boolean;
  setWindRolling: (rolling: boolean) => void;
  
  lastRoundScore: {
    round: number;
    p0Mwh: number;
    p1Mwh: number;
    p0Total: number;
    p1Total: number;
  } | null;

  lastAiActions: GameEvent[];
  clearLastAiActions: () => void;
  aiCurrentAction: string | null;
  gameStartedAt: Date;

  newGame: (seed?: number) => void;
  playCard: (handIdx: number, options?: { targetTurbineIdx?: number; targetTechIdx?: number }) => void;
  selectFaultTarget: (targetIdx: number) => void; // 點擊風機時調用 (用來對應道具卡或修復目標)
  selectReplaceTarget: (replaceIdx: number) => void;
  
  pendingSkillTechId: string | null;
  pendingSkillTag: string | null;
  activateSkill: (techId: string, skillTag: string, turbineIdx?: number) => void;
  selectSkillTarget: (turbineIdx: number) => void;
  
  pendingResourceId: string | null;
  grabResource: (resourceId: string, turbineIdx?: number) => void;
  selectResourceTarget: (turbineIdx: number) => void;
  
  retreat: (benchIdx: number) => void;
  promoteTech: (benchIdx: number) => void;
  cancelPending: () => void;
  discardCard: (handIdx: number) => void;
  hasDiscarded: boolean;
  clearLastRoundScore: () => void;
  endTurn: () => void;
}

function _deriveEffects(events: GameEvent[]): Array<{ type: 'fault' | 'repair'; side: 0 | 1; slot: number; cardId?: string }> {
  const out: Array<{ type: 'fault' | 'repair'; side: 0 | 1; slot: number; cardId?: string }> = [];
  for (const e of events) {
    if (e.kind === 'fault-applied') {
      const turbineIdx = e.turbineId === 'OS8' ? 0 : e.turbineId === 'OS10' ? 1 : 2;
      out.push({ type: 'fault', side: e.player as 0 | 1, slot: turbineIdx, cardId: e.cardId });
    } else if (e.kind === 'fault-repaired') {
      const turbineIdx = e.turbineId === 'OS8' ? 0 : e.turbineId === 'OS10' ? 1 : 2;
      out.push({ type: 'repair', side: e.player, slot: turbineIdx, cardId: e.cardId });
    }
  }
  return out;
}

let _effectIdCounter = 0;
function _nextEffectId(): string {
  _effectIdCounter += 1;
  return `fx-${Date.now()}-${_effectIdCounter}`;
}

function makeInitialStoreState(seed: number, difficulty: Difficulty) {
  void difficulty;
  const rng = createRng(seed);
  const state = createInitialState(rng, 'weather-challenge');
  
  // 開局抽 4 張牌
  for (let i = 0; i < 4; i++) {
    if (state.players[0].deck.length > 0) {
      state.players[0].hand.push(state.players[0].deck.shift()!);
    }
    if (state.players[1].deck.length > 0) {
      state.players[1].hand.push(state.players[1].deck.shift()!);
    }
  }
  
  // 啟動第一回合
  const events = startRound(state, rng);
  return { state, events, rng };
}

export const useGameStore = create<GameStore>((set, get) => ({
  mode: 'weather-challenge',
  difficulty: 'hard',
  setDifficulty: (d) => set({ difficulty: d }),

  ...makeInitialStoreState(Date.now() & 0xffffffff, 'hard'),
  pendingFaultHandIdx: null,
  pendingReplaceHandIdx: null,
  isAiThinking: false,
  effects: [],
  windRolling: false,
  lastRoundScore: null,
  lastAiActions: [],
  aiCurrentAction: null,
  gameStartedAt: new Date(),
  pendingSkillTechId: null,
  pendingSkillTag: null,
  pendingResourceId: null,
  hasDiscarded: false,

  pushEffect: (type, target, durationMs = 1000) => {
    const id = _nextEffectId();
    const effect: UiEffect = { id, type, target, time: Date.now() };
    set((s) => ({ effects: [...s.effects, effect] }));
    setTimeout(() => get().removeEffect(id), durationMs);
  },

  removeEffect: (id) => set((s) => ({ effects: s.effects.filter((e) => e.id !== id) })),
  setWindRolling: (rolling) => set({ windRolling: rolling }),

  newGame: (seed = Date.now() & 0xffffffff) => {
    const { difficulty } = get();
    const fresh = makeInitialStoreState(seed, difficulty);
    set({
      ...fresh,
      pendingFaultHandIdx: null,
      pendingReplaceHandIdx: null,
      pendingSkillTechId: null,
      pendingSkillTag: null,
      pendingResourceId: null,
      hasDiscarded: false,
      isAiThinking: false,
      lastRoundScore: null,
      lastAiActions: [],
      aiCurrentAction: null,
      effects: [],
      windRolling: false,
      gameStartedAt: new Date(),
    });
  },

  playCard: (handIdx, options) => {
    const { state, events, rng } = get();
    if (state.gameOver || state.currentPlayer !== HUMAN) return;
    if (!canPlayCard(state, HUMAN, handIdx, options?.targetTurbineIdx, options?.targetTechIdx)) return;

    const cardId = state.players[HUMAN].hand[handIdx];
    const card = CARDS[cardId];

    // 道具卡如果需要指定機組，且點擊時尚未指定，則進入 turbine 選擇狀態
    if (
      card.type === 'item' &&
      ['quick-repair-worst', 'temp-mw-boost', 'recover-shutdown', 'fault-shield', 'permanent-mw-boost', 'restore-avail'].includes(card.effect ?? '') &&
      options?.targetTurbineIdx === undefined
    ) {
      set({ pendingFaultHandIdx: handIdx });
      return;
    }

    // 工具卡自動裝備到主力技師（若主力不存在，則裝備到備戰第一個）
    let finalTargetTechIdx = options?.targetTechIdx;
    if (card.type === 'tool' && finalTargetTechIdx === undefined) {
      if (state.players[HUMAN].field.active) {
        finalTargetTechIdx = 0;
      } else if (state.players[HUMAN].field.bench.length > 0) {
        finalTargetTechIdx = 1; // 備戰區第一個在 DeployedTechs 列表中索引是 1 (因為 active 是 0)
      } else {
        return; // 沒有技師無法裝備工具
      }
    }

    // 執行 play-card
    const s = cloneState(state);
    const actionResult = applyAction(
      s,
      {
        kind: 'play-card',
        player: HUMAN,
        handIdx,
        targetTurbineIdx: options?.targetTurbineIdx,
        targetTechIdx: finalTargetTechIdx,
      },
      rng
    );

    set({
      state: actionResult.state,
      events: [...events, ...actionResult.events].slice(-EVENT_LOG_LIMIT),
      pendingFaultHandIdx: null,
      pendingReplaceHandIdx: null,
      pendingSkillTechId: null,
      lastAiActions: [],
    });

    for (const fx of _deriveEffects(actionResult.events)) {
      get().pushEffect(fx.type, { side: fx.side, slot: fx.slot, cardId: fx.cardId });
    }
  },

  selectFaultTarget: (targetIdx) => {
    const { pendingFaultHandIdx, playCard } = get();
    if (pendingFaultHandIdx === null) return;
    playCard(pendingFaultHandIdx, { targetTurbineIdx: targetIdx });
  },

  selectReplaceTarget: (replaceIdx) => {
    const { pendingReplaceHandIdx, playCard } = get();
    if (pendingReplaceHandIdx === null) return;
    playCard(pendingReplaceHandIdx, { targetTurbineIdx: replaceIdx });
  },

  activateSkill: (techId, skillTag, turbineIdx) => {
    const { state, events, rng } = get();
    if (state.gameOver || state.currentPlayer !== HUMAN) return;
    const activeTech = state.players[HUMAN].field.active;
    if (!activeTech || activeTech.cardId !== techId || activeTech.usedSkillThisTurn) return;

    const card = CARDS[techId];
    const levelKey = activeTech.level === 3 ? 'lv3' : activeTech.level === 2 ? 'lv2' : 'lv1';
    const skill = card.skills?.[levelKey];
    if (!skill || skill.tag !== skillTag) return;

    // 判定是否需要選擇目標機組
    const target = turbineIdx;
    const needsTarget = !!(skill.repairPower || skill.availBoost || skill.mwBoost || skill.special?.includes('prevent-fault') || skill.special?.includes('block-next-fault'));
    
    if (needsTarget && target === undefined) {
      set({
        pendingSkillTechId: techId,
        pendingSkillTag: skillTag,
        pendingFaultHandIdx: null,
        pendingReplaceHandIdx: null,
      });
      return;
    }

    const s = cloneState(state);
    const actionResult = applyAction(
      s,
      {
        kind: 'use-skill',
        player: HUMAN,
        targetTurbineIdx: target,
      },
      rng
    );

    set({
      state: actionResult.state,
      events: [...events, ...actionResult.events].slice(-EVENT_LOG_LIMIT),
      pendingSkillTechId: null,
      pendingSkillTag: null,
      pendingFaultHandIdx: null,
      lastAiActions: [],
    });

    for (const fx of _deriveEffects(actionResult.events)) {
      get().pushEffect(fx.type, { side: fx.side, slot: fx.slot, cardId: fx.cardId });
    }

    // 寶可夢 TCG 規則：出招後自動結束回合！
    setTimeout(() => {
      get().endTurn();
    }, 600);
  },

  selectSkillTarget: (turbineIdx) => {
    const { pendingSkillTechId, pendingSkillTag, activateSkill } = get();
    if (pendingSkillTechId === null || pendingSkillTag === null) return;
    activateSkill(pendingSkillTechId, pendingSkillTag, turbineIdx);
  },

  retreat: (benchIdx) => {
    const { state, events, rng } = get();
    if (state.gameOver || state.currentPlayer !== HUMAN) return;
    const s = cloneState(state);
    try {
      const actionResult = applyAction(s, { kind: 'retreat', player: HUMAN, benchIdx }, rng);
      set({
        state: actionResult.state,
        events: [...events, ...actionResult.events].slice(-EVENT_LOG_LIMIT),
        lastAiActions: [],
      });
    } catch (e) {
      console.warn(e);
    }
  },

  promoteTech: (benchIdx) => {
    const { state, events, rng } = get();
    if (state.gameOver || state.currentPlayer !== HUMAN) return;
    const s = cloneState(state);
    try {
      const actionResult = applyAction(s, { kind: 'promote-tech', player: HUMAN, benchIdx }, rng);
      set({
        state: actionResult.state,
        events: [...events, ...actionResult.events].slice(-EVENT_LOG_LIMIT),
        lastAiActions: [],
      });
    } catch (e) {
      console.warn(e);
    }
  },

  grabResource: () => {}, // 新版無此機制，保留 stub
  selectResourceTarget: () => {},

  cancelPending: () =>
    set({
      pendingFaultHandIdx: null,
      pendingReplaceHandIdx: null,
      pendingSkillTechId: null,
      pendingSkillTag: null,
    }),

  discardCard: (handIdx) => {
    const { state, events, hasDiscarded } = get();
    if (state.gameOver || state.currentPlayer !== HUMAN) return;
    if (hasDiscarded) return;

    const s = cloneState(state);
    const hand = s.players[HUMAN].hand;
    if (handIdx < 0 || handIdx >= hand.length) return;

    const discarded = hand.splice(handIdx, 1)[0];
    const discardEvent: GameEvent = {
      kind: 'card-discarded',
      player: HUMAN,
      cardId: discarded,
    };

    set({
      state: s,
      events: [...events, discardEvent].slice(-EVENT_LOG_LIMIT),
      hasDiscarded: true,
      pendingFaultHandIdx: null,
      pendingReplaceHandIdx: null,
      pendingSkillTechId: null,
      lastAiActions: [],
    });
  },

  endTurn: () => {
    const { state, events, rng } = get();
    if (state.gameOver || state.currentPlayer !== HUMAN) return;
    if (get().isAiThinking) return;

    const s = cloneState(state);
    const ev1: GameEvent[] = [{ kind: 'turn-ended', player: HUMAN }];

    // 玩家結束 turn → 換 AI 上場。
    // 注意：這裡「不可」呼叫 startRound——startRound 是回合開頭的初始化（骰風/環境事件），
    // 且會把 currentPlayer 硬設回 0，導致 AI 的 legalActions 全數不合法（先前 AI 癱瘓的根因）。
    // 換人只需 _beginTurn：重置回合旗標 + 補牌到 4 張。
    s.currentPlayer = AI;
    _beginTurn(s, AI, ev1);

    set({
      state: s,
      events: [...events, ...ev1].slice(-EVENT_LOG_LIMIT),
      pendingFaultHandIdx: null,
      pendingReplaceHandIdx: null,
      pendingSkillTechId: null,
      hasDiscarded: false,
      isAiThinking: true,
    });

    // 2. AI 逐步執行
    const AI_STEP_DELAY = 1000;

    const runNextAiStep = (stepState: GameState, stepEvents: GameEvent[]) => {
      setTimeout(() => {
        const { difficulty } = get();
        const choice = aiChoose(stepState, AI, difficulty, rng);

        if (choice && choice.chosen.score >= RESERVE_THRESHOLD && choice.chosen.action.kind !== 'end-turn') {
          // 執行 AI 的一個動作。
          // 注意：applyAction 回傳「新 state」（內部 structuredClone），必須以 result.state 續跑；
          // 先前用舊的 stepState 續跑導致 AI 每步都打空氣（動作永遠套不上，第二個癱瘓根因）。
          const result = applyAction(stepState, choice.chosen.action, rng);
          const nextState = result.state;
          const newEvents = [...stepEvents, ...result.events];

          for (const fx of _deriveEffects(result.events)) {
            get().pushEffect(fx.type, { side: fx.side, slot: fx.slot, cardId: fx.cardId });
          }

          const { events: currentEvents } = get();
          set({
            state: nextState,
            events: [...currentEvents, ...result.events].slice(-EVENT_LOG_LIMIT),
            aiCurrentAction: choice.chosen.desc,
          });

          // 如果 AI 使用了技能，其回合自動結束（與玩家同一條規則）
          if (choice.chosen.action.kind === 'use-skill') {
            finalizeRound(cloneState(nextState), newEvents);
          } else {
            runNextAiStep(cloneState(nextState), newEvents);
          }
        } else {
          // AI 無動作或選擇結束，結算回合
          const endTurnEvent: GameEvent = { kind: 'turn-ended', player: AI };
          finalizeRound(stepState, [...stepEvents, endTurnEvent]);
        }
      }, AI_STEP_DELAY);
    };

    const finalizeRound = (stepState: GameState, allAiEvents: GameEvent[]) => {
      // 執行結算
      const roundEndEvents = endRound(stepState, rng);
      const completedRound = stepState.round - 1; // endRound 內會 round + 1
      
      const combinedEvents = [...allAiEvents, ...roundEndEvents];
      
      // 計算 lastRoundScore
      const p0Sc = combinedEvents.find(e => e.kind === 'round-scored' && e.player === 0);
      const p1Sc = combinedEvents.find(e => e.kind === 'round-scored' && e.player === 1);
      const roundScore = p0Sc && p1Sc && p0Sc.kind === 'round-scored' && p1Sc.kind === 'round-scored'
        ? {
            round: completedRound,
            p0Mwh: p0Sc.mwh,
            p1Mwh: p1Sc.mwh,
            p0Total: p0Sc.total,
            p1Total: p1Sc.total,
          }
        : null;

      // 若遊戲未結束，則開啟下一回合
      if (!stepState.gameOver) {
        stepState.currentPlayer = HUMAN;
        const newRoundEvents = startRound(stepState, rng);
        combinedEvents.push(...newRoundEvents);
      }

      const { events: currentEvents } = get();
      set({
        state: stepState,
        events: [...currentEvents, ...combinedEvents].slice(-EVENT_LOG_LIMIT),
        isAiThinking: false,
        aiCurrentAction: null,
        lastRoundScore: roundScore,
        lastAiActions: allAiEvents.filter(e => e.kind === 'card-played' || e.kind === 'skill-used'),
      });
    };

    const { state: s2 } = get();
    runNextAiStep(cloneState(s2), []);
  },

  clearLastRoundScore: () => set({ lastRoundScore: null }),
  clearLastAiActions: () => set({ lastAiActions: [] }),
}));

export const _internalForTest = {
  startRound,
  endRound,
};

export function uiEffectiveCost(state: GameState, player: 0 | 1, cardId: string): number {
  void state;
  void player;
  return CARDS[cardId]?.cost ?? 1;
}

// DEV-only：把 store 掛到 window 方便手動測試 / 截圖（production build 會被 import.meta.env.DEV 剝除）
if (import.meta.env.DEV) {
  (window as unknown as { __wfStore?: typeof useGameStore }).__wfStore = useGameStore;
}

export function uiPreviewMwh(state: GameState, player: 0 | 1): number {
  const p = state.players[player];
  const coeff = state.wind.coeff;
  let mwh = 0;
  p.windFarm.forEach((t) => {
    if (t.shutdown) return;
    const mw = t.mw + t.mwBonus;
    mwh += mw * coeff * (t.avail / 100);
  });
  
  let activeMultiplier = 1.0;
  p.activeContracts.forEach((c) => {
    activeMultiplier *= c.multiplier;
  });
  
  return Math.round(mwh * activeMultiplier * 100) / 100;
}
