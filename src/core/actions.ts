// ============================================================
// 動作層（純函式）。S2.3：把 v3 playCardFromHand / endHumanTurn 的副作用重寫成
//   applyAction(state, action, rng) → { state, events }，零 mutate 對外。
// 範圍：對齊 v3 機制（turbine/tech/fault 派遣 + FN01–06；T07 tech-discount）。
//   v4 新 tag（T09 func-discount、M07 aura-mw…）屬 S3，本檔不處理。
// 重要：所有 mutate 都在 cloneState 後的工作副本上做，與 rules-engine 共用內部 mutate。
// ============================================================
import type { GameState, PlayerState, Card, Wind } from './types';
import type { Rng } from './rng';
import type { GameEvent, ApplyResult } from './events';
import { CARDS } from './cards';
import { cloneState } from './game-state';
import {
  DEFAULT_CONFIG,
  rollWind,
  _drawCard,
  _applyFault,
  type RulesConfig,
} from './rules-engine';
import { hasCardDrawTrigger, hasNoSlot } from './abilities';

// ---------- Action 型別 ----------
export type Action =
  | {
      readonly kind: 'play-card';
      readonly player: 0 | 1;
      readonly handIdx: number;
      /** fault：對手機組索引；func returnTurbine / upgradeMW：自己機組索引 */
      readonly target?: number;
      /** turbine：3 台已滿時的替換索引（不指定預設替換最弱） */
      readonly replaceIdx?: number;
    }
  | { readonly kind: 'end-turn'; readonly player: 0 | 1 };

// ---------- 純查詢輔助 ----------
function hasTechDiscount(p: PlayerState): boolean {
  // T07 tech-discount：派遣 tech 卡 cost -1，下限 1（對齊 v3 hasSeniorManager）
  return p.techs.some((id) => CARDS[id].abilities.some((a) => a.tag === 'tech-discount'));
}

function hasFuncDiscount(p: PlayerState): boolean {
  // S3.4：T09 func-discount：出 func 卡 cost -1，下限 0（DESIGN「最低 0」）
  return p.techs.some((id) => CARDS[id].abilities.some((a) => a.tag === 'func-discount'));
}

function turbineMW(t: { cardId: string; mwBonus: number }): number {
  return (CARDS[t.cardId].stats?.mw ?? 0) + t.mwBonus;
}

function findWeakestTurbineIdx(p: PlayerState): number {
  // S3.3：M10 no-slot 不算入「可被替換」的對象（不佔格的卡不能被擠掉）
  let weakestIdx = -1;
  let weakestMW = Infinity;
  for (let i = 0; i < p.turbines.length; i++) {
    if (hasNoSlot(p.turbines[i].cardId)) continue;
    const mw = turbineMW(p.turbines[i]);
    if (mw < weakestMW) {
      weakestMW = mw;
      weakestIdx = i;
    }
  }
  // fallback：若全是 no-slot（罕見邊界）→ 退回 0
  return weakestIdx === -1 ? 0 : weakestIdx;
}

/** S3.3：場上「佔格」機組數（M10 no-slot 不算）。用於 3 台上限判定。 */
function slottedCount(p: PlayerState): number {
  return p.turbines.reduce((n, t) => (hasNoSlot(t.cardId) ? n : n + 1), 0);
}

function findStrongestNoBonusIdx(p: PlayerState): number {
  // FN03 upgradeMW：選最強且 mwBonus===0 的機組
  let bestIdx = -1;
  let bestMW = 0;
  for (let i = 0; i < p.turbines.length; i++) {
    if (p.turbines[i].mwBonus !== 0) continue;
    const mw = CARDS[p.turbines[i].cardId].stats?.mw ?? 0;
    if (mw > bestMW) {
      bestMW = mw;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function findBestRepairableFaultIdx(
  p: PlayerState,
  maxSev: number,
): { tIdx: number; fIdx: number } | null {
  // T06 free-repair：選 sev 最高（≤ maxSev）的故障即時修復
  let bestT = -1;
  let bestF = -1;
  let bestSev = 0;
  for (let i = 0; i < p.turbines.length; i++) {
    const faults = p.turbines[i].faults;
    for (let j = 0; j < faults.length; j++) {
      const sev = faults[j].sev;
      if (sev <= maxSev && sev > bestSev) {
        bestSev = sev;
        bestT = i;
        bestF = j;
      }
    }
  }
  return bestT >= 0 ? { tIdx: bestT, fIdx: bestF } : null;
}

/** 計算實際花費的動作數（含 T07 tech-discount 下限 1 / S3.4 T09 func-discount 下限 0）。 */
export function effectiveCost(state: GameState, player: 0 | 1, cardId: string): number {
  const card = CARDS[cardId];
  if (!card) return Infinity;
  let cost = card.cost;
  const p = state.players[player];
  if (card.type === 'tech' && hasTechDiscount(p)) {
    cost = Math.max(1, cost - 1);
  }
  if (card.type === 'func' && hasFuncDiscount(p)) {
    cost = Math.max(0, cost - 1); // S3.4：T09 func-discount，下限 0
  }
  return cost;
}

/**
 * 對齊 v3 canPlayCard：當前玩家、cost、各卡類前置條件。
 * （turbine 滿 3 台仍可玩，因為 v3 允許在當下替換。）
 */
export function canPlayCard(state: GameState, player: 0 | 1, handIdx: number): boolean {
  if (state.gameOver) return false;
  if (player !== state.currentPlayer) return false;
  const p = state.players[player];
  const cardId = p.hand[handIdx];
  if (cardId === undefined) return false;
  const card = CARDS[cardId];
  if (effectiveCost(state, player, cardId) > state.actionsLeft) return false;

  if (card.type === 'tech' && p.techs.includes(cardId)) return false; // 不可重複派遣
  if (card.type === 'tech' && p.techPlayedThisRound) return false; // 一回合只能出一張技師卡
  // 故障卡：對手無機組 或 所有機組都在停機中（已無攻擊目標）→ 不可出牌
  if (card.type === 'fault') {
    const oppTurbines = state.players[1 - player].turbines;
    if (oppTurbines.length === 0 || oppTurbines.every((t) => t.shutdown)) return false;
  }
  if (card.type === 'func') {
    if (card.effect === 'returnTurbine' && p.turbines.length === 0) return false;
    if (card.effect === 'upgradeMW' && findStrongestNoBonusIdx(p) < 0) return false;
    // S3.6：FN07 searchTurbine 需要牌庫中至少有一張 turbine
    if (card.effect === 'searchTurbine' && !p.deck.some((id) => CARDS[id].type === 'turbine')) return false;
    // FN09 once-per-game：若卡牌有 mass-repair-once tag 且已在 usedOncePerGame 清單中 → 不可出
    if (card.abilities.some((a) => a.tag === 'mass-repair-once') && p.usedOncePerGame.includes(cardId)) return false;
    // UP01-UP04 evolveTurbine：需要場上有符合條件的機組可升級
    if (card.effect === 'evolveTurbine') {
      const tier = card.abilities.find((a) => a.tag.startsWith('evolve-'))?.tag;
      if (tier === 'evolve-tier1' && !p.turbines.some((t) => ['M01', 'M02'].includes(t.cardId))) return false;
      if (tier === 'evolve-tier2' && !p.turbines.some((t) => ['M03', 'M04'].includes(t.cardId))) return false;
      if (tier === 'evolve-tier3' && !p.turbines.some((t) => ['M05', 'M06', 'M07', 'M09'].includes(t.cardId))) return false;
      if (tier === 'evolve-universal' && p.turbines.length === 0) return false;
    }
  }
  // S3.6：weather 卡無前置條件（隨時可施加全局事件）
  return true;
}

/** 列出當前玩家所有合法動作（含 end-turn）。S2.4 AI 用。 */
export function legalActions(state: GameState, player: 0 | 1): Action[] {
  const actions: Action[] = [{ kind: 'end-turn', player }];
  if (state.gameOver || player !== state.currentPlayer) return actions;
  const p = state.players[player];
  for (let i = 0; i < p.hand.length; i++) {
    if (canPlayCard(state, player, i)) {
      actions.push({ kind: 'play-card', player, handIdx: i });
    }
  }
  return actions;
}

// ---------- 內部 mutate：play-card 派發 ----------
function _deployTurbine(
  s: GameState,
  player: 0 | 1,
  cardId: string,
  replaceIdx: number | undefined,
): GameEvent[] {
  const events: GameEvent[] = [];
  const p = s.players[player];
  const card = CARDS[cardId];
  const avail = card.stats?.avail ?? 95;

  // S3.3：M10 no-slot 不佔格；其他機組只在「佔格數 ≥ 3」時替換
  const deployingNoSlot = hasNoSlot(cardId);
  if (!deployingNoSlot && slottedCount(p) >= 3) {
    const idx = replaceIdx !== undefined ? replaceIdx : findWeakestTurbineIdx(p);
    if (idx >= 0 && p.turbines[idx]) {
      const old = p.turbines[idx];
      p.turbines.splice(idx, 1);
      events.push({ kind: 'turbine-replaced', player, oldCardId: old.cardId, newCardId: cardId });
    }
  }
  // S3.2：記錄部署回合（供 M05 offshore-delay 判定「當回合不結算」）
  // originalAvail 記錄初始值，用於 Route B 教育 UI：顯示部分修復造成的永久損耗
  p.turbines.push({ cardId, avail, originalAvail: avail, mwBonus: 0, faults: [], deployedRound: s.round });
  events.push({ kind: 'turbine-deployed', player, cardId });
  return events;
}

function _deployTech(s: GameState, player: 0 | 1, cardId: string, rng?: Rng): GameEvent[] {
  const events: GameEvent[] = [];
  const p = s.players[player];
  p.techs.push(cardId);
  events.push({ kind: 'tech-deployed', player, cardId });

  // T06 free-repair：派遣即時修復一個 sev ≤ 3 的故障
  if (CARDS[cardId].special === 'free-repair') {
    const target = findBestRepairableFaultIdx(p, 3);
    if (target) {
      const removed = p.turbines[target.tIdx].faults.splice(target.fIdx, 1)[0];
      events.push({
        kind: 'fault-repaired',
        player,
        targetIdx: target.tIdx,
        cardId: removed.cardId,
        by: cardId,
      });
    }
  }

  // S3.4：T05 predict-wind 部署觸發（與 FN05 同邏輯：填 3 個未來風骰）
  // 與 FN05 不同處：T05 是技師被動，但仍消耗 3 次 RNG。runGame 內 futureWind 佇列先消費。
  if (rng && CARDS[cardId].abilities.some((a) => a.tag === 'predict-wind')) {
    const future: Wind[] = [rollWind(rng), rollWind(rng), rollWind(rng)];
    s.futureWind.push(...future);
    events.push({ kind: 'predict-wind', player, labels: future.map((w) => w.label) });
  }
  return events;
}

function _executeFunc(
  s: GameState,
  player: 0 | 1,
  cardId: string,
  target: number | undefined,
  rng: Rng,
  config: RulesConfig,
): GameEvent[] {
  const events: GameEvent[] = [];
  const p = s.players[player];
  const card = CARDS[cardId];
  const effect = card.effect ?? '';
  events.push({ kind: 'func-played', player, cardId, effect });

  switch (effect) {
    case 'returnTurbine': {
      // FN01：把指定（或最弱）機組收回手牌（fresh，不保留 avail / faults / mwBonus）
      const idx = target !== undefined ? target : findWeakestTurbineIdx(p);
      if (idx >= 0 && p.turbines[idx]) {
        const removed = p.turbines.splice(idx, 1)[0];
        if (p.hand.length < 7) p.hand.push(removed.cardId);
        events.push({ kind: 'turbine-returned', player, cardId: removed.cardId });
      }
      break;
    }
    case 'draw2': {
      // FN02：抽 2 張（會消耗 rng；牌庫空可能觸發重洗 → 1 次 Fisher-Yates）
      _drawCard(s, player, rng, config);
      _drawCard(s, player, rng, config);
      break;
    }
    case 'upgradeMW': {
      // FN03：場上最強且未升級的機組 +2 MW
      const idx = findStrongestNoBonusIdx(p);
      if (idx >= 0) {
        p.turbines[idx].mwBonus = 2;
        events.push({ kind: 'turbine-upgraded', player, cardId: p.turbines[idx].cardId, bonus: 2 });
      }
      break;
    }
    case 'extraAction': {
      // FN04：下回合 +1 動作（pendingExtraActions 累積上限 2）
      p.pendingExtraActions = Math.min(2, p.pendingExtraActions + 1);
      events.push({ kind: 'extra-action-banked', player, pending: p.pendingExtraActions });
      break;
    }
    case 'predictWind': {
      // FN05：預羅 3 次風骰存入 futureWind（D4：legacyV3=false 時 runGame 會優先消費此佇列）
      const future: Wind[] = [rollWind(rng), rollWind(rng), rollWind(rng)];
      s.futureWind.push(...future);
      events.push({ kind: 'predict-wind', player, labels: future.map((w) => w.label) });
      break;
    }
    case 'mwhBoost': {
      // FN06：本回合自己 MWh ×1.5（在 _scoreRound 套用後清除，已在 runGame 的回合初清零）
      p.mwhBoostActive = true;
      events.push({ kind: 'mwh-boost', player });
      break;
    }
    case 'searchTurbine': {
      // S3.6 FN07 tutor-turbine：從牌庫搜最高 MW 的 turbine 加入手牌（DESIGN.md 估計值）
      let bestIdx = -1;
      let bestMw = -1;
      for (let i = 0; i < p.deck.length; i++) {
        const dc = CARDS[p.deck[i]];
        if (dc.type !== 'turbine') continue;
        const mw = dc.stats?.mw ?? 0;
        if (mw > bestMw) {
          bestMw = mw;
          bestIdx = i;
        }
      }
      if (bestIdx >= 0 && p.hand.length < 7) {
        const drawn = p.deck.splice(bestIdx, 1)[0];
        p.hand.push(drawn);
        events.push({ kind: 'tutor-turbine', player, cardId: drawn });
      }
      break;
    }
    case 'insurance': {
      // FN08 insurance-shield 重實作：緊急搶修卡。
      // 選自家受損最重的機組（優先停機機組），清除所有故障 + 若停機則復機（avail 恢復 20%）。
      const p2 = s.players[player];
      // 優先找停機機組；若無則找故障最多的
      let repairIdx = p2.turbines.findIndex((t) => t.shutdown);
      if (repairIdx === -1) {
        repairIdx = p2.turbines.reduce((best, t, i) => {
          const drop = t.faults.reduce((s, f) => s + f.drop, 0);
          const bestDrop = best === -1 ? -1 : p2.turbines[best].faults.reduce((s, f) => s + f.drop, 0);
          return drop > bestDrop ? i : best;
        }, -1);
      }
      if (repairIdx !== -1) {
        const t = p2.turbines[repairIdx];
        // 清除所有故障
        for (const fault of t.faults) {
          events.push({ kind: 'fault-repaired', player, targetIdx: repairIdx, cardId: fault.cardId });
        }
        t.faults = [];
        // 停機復機：avail 恢復到 20%（緊急狀態仍有損耗）
        if (t.shutdown) {
          t.shutdown = false;
          t.avail = Math.max(t.avail, 20);
          events.push({ kind: 'turbine-restart', player, turbineIdx: repairIdx, cardId: t.cardId });
        }
        events.push({ kind: 'func-played', player, cardId, effect: 'emergency-repair' });
      } else {
        events.push({ kind: 'func-played', player, cardId, effect: 'insurance-noop' });
      }
      break;
    }
    case 'massRepair': {
      // FN09 緊急大修：清除自家所有機組的所有故障，停機機組同時復機（avail 恢復 20%）。每場限用 1 次。
      let repairedAny = false;
      for (let i = 0; i < p.turbines.length; i++) {
        const t = p.turbines[i];
        if (t.faults.length > 0 || t.shutdown) {
          for (const fault of t.faults) {
            events.push({ kind: 'fault-repaired', player, targetIdx: i, cardId: fault.cardId, by: cardId });
          }
          t.faults = [];
          if (t.shutdown) {
            t.shutdown = false;
            t.avail = Math.max(t.avail, 20);
            events.push({ kind: 'turbine-restart', player, turbineIdx: i, cardId: t.cardId });
          }
          repairedAny = true;
        }
      }
      // 標記本局已使用
      p.usedOncePerGame.push(cardId);
      events.push({ kind: 'func-played', player, cardId, effect: repairedAny ? 'mass-repair' : 'mass-repair-noop' });
      break;
    }
    case 'evolveTurbine': {
      // UP01-UP04 風機升級進化卡
      // 升級路徑映射表：基礎機組 → 進化目標
      const EVOLVE_MAP: Record<string, string> = {
        // tier1：M01/M02 → M03/M04
        'M01': 'M03',
        'M02': 'M04',
        // tier2：M03/M04 → M05/M06
        'M03': 'M05',
        'M04': 'M06',
        // tier3：M05/M06 → M09/M07
        'M05': 'M09',
        'M06': 'M07',
      };
      const tier = card.abilities.find((a) => a.tag.startsWith('evolve-'))?.tag;

      if (tier === 'evolve-universal') {
        // UP04：通用升級，對最強且 mwBonus===0 的機組加 +3MW
        const idx = findStrongestNoBonusIdx(p);
        if (idx >= 0) {
          p.turbines[idx].mwBonus = 3;
          events.push({ kind: 'turbine-upgraded', player, cardId: p.turbines[idx].cardId, bonus: 3 });
        }
      } else {
        // UP01-UP03：找符合條件的機組，替換為進化後的機組（保留 avail/faults/mwBonus）
        const eligibleIds: string[] = [];
        if (tier === 'evolve-tier1') eligibleIds.push('M01', 'M02');
        else if (tier === 'evolve-tier2') eligibleIds.push('M03', 'M04');
        else if (tier === 'evolve-tier3') eligibleIds.push('M05', 'M06', 'M07', 'M09');

        // 選最高 MW 的符合機組（目標參數可覆蓋）
        let evolveIdx = target !== undefined ? target : -1;
        if (evolveIdx === -1) {
          let bestMW = -1;
          for (let i = 0; i < p.turbines.length; i++) {
            if (!eligibleIds.includes(p.turbines[i].cardId)) continue;
            const mw = (CARDS[p.turbines[i].cardId].stats?.mw ?? 0) + p.turbines[i].mwBonus;
            if (mw > bestMW) { bestMW = mw; evolveIdx = i; }
          }
        }

        if (evolveIdx >= 0 && p.turbines[evolveIdx]) {
          const t = p.turbines[evolveIdx];
          const fromId = t.cardId;
          const toId = EVOLVE_MAP[fromId];
          if (toId) {
            const newAvail = CARDS[toId].stats?.avail ?? t.avail;
            // 保留現有故障和 mwBonus，但更新 cardId 和 avail
            (p.turbines[evolveIdx] as unknown as Record<string, unknown>)['cardId'] = toId;
            p.turbines[evolveIdx].avail = Math.min(t.avail, newAvail); // 取較小値（故障已降低可用率）
            p.turbines[evolveIdx].deployedRound = s.round; // 重置部署回合（offshore-delay 重新計算）
            events.push({ kind: 'turbine-evolved', player, fromCardId: fromId, toCardId: toId, turbineIdx: evolveIdx });
          }
        }
      }
      break;
    }
    default:
      break;
  }
  return events;
}

/**
 * S3.6：施加天氣卡 — push 進 state.activeWeather，duration = card.duration（預設 1）。
 * 不消耗 RNG。雙方共享生效。
 */
function _applyWeather(s: GameState, player: 0 | 1, cardId: string): GameEvent[] {
  const card = CARDS[cardId];
  const duration = card.duration ?? 1;
  s.activeWeather.push({ cardId, duration, appliedBy: player });
  return [{ kind: 'weather-applied', player, cardId, duration }];
}

/**
 * S3.7：施加合約卡 — push 進 state.activeContracts，progress=0, fulfilled=false。
 * 每回合結算後由 rules-engine._checkContracts 評估是否達成。
 */
function _applyContract(s: GameState, player: 0 | 1, cardId: string): GameEvent[] {
  s.activeContracts.push({ cardId, player, progress: 0, fulfilled: false });
  return [{ kind: 'contract-applied', player, cardId }];
}

/**
 * @internal 對 runGame 工作副本直接 mutate；供 aiTakeTurn 連續出牌共用。
 * 外部請改用 applyAction()（clone 後再呼叫此函式）。
 * RNG 消耗：fault.cascade（1 次）/ FN02 draw2（最多 2 次，可能再加 1 次重洗）/ FN05 predictWind（3 次）。
 */
export function _applyActionMutate(
  s: GameState,
  action: Action,
  rng: Rng,
  config: RulesConfig,
): GameEvent[] {
  const events: GameEvent[] = [];

  if (action.kind === 'end-turn') {
    events.push({ kind: 'turn-ended', player: action.player });
    return events;
  }

  if (!canPlayCard(s, action.player, action.handIdx)) return events;

  const p = s.players[action.player];
  const cardId = p.hand[action.handIdx];
  const card: Card = CARDS[cardId];
  const cost = effectiveCost(s, action.player, cardId);

  p.hand.splice(action.handIdx, 1);
  s.actionsLeft -= cost;
  events.push({ kind: 'card-played', player: action.player, cardId });

  switch (card.type) {
    case 'turbine':
      events.push(..._deployTurbine(s, action.player, cardId, action.replaceIdx));
      break;
    case 'tech':
      events.push(..._deployTech(s, action.player, cardId, rng));
      p.techPlayedThisRound = true; // 標記本回合已出技師卡
      break;
    case 'fault':
      events.push(..._applyFault(s, action.player, cardId, rng, action.target));
      break;
    case 'func':
      events.push(..._executeFunc(s, action.player, cardId, action.target, rng, config));
      break;
    case 'weather':
      events.push(..._applyWeather(s, action.player, cardId));
      break;
    case 'contract':
      events.push(..._applyContract(s, action.player, cardId));
      break;
    default:
      break;
  }

  // S3.1：M07 card-draw-trigger — 出 tech/func 卡後，若該玩家場上有此 tag → 抽 1 張。
  // 注意：trigger 後抽的牌不會再 trigger（避免循環）；放在 type switch 後、RNG 順序在 fault.cascade 之後（如有）。
  if ((card.type === 'tech' || card.type === 'func') && hasCardDrawTrigger(p)) {
    _drawCard(s, action.player, rng, config);
  }
  return events;
}

/** 對外純函式：套用一個動作。clone 後派發；不會更動傳入 state。 */
export function applyAction(
  state: GameState,
  action: Action,
  rng: Rng,
  config: RulesConfig = DEFAULT_CONFIG,
): ApplyResult {
  const s = cloneState(state);
  const events = _applyActionMutate(s, action, rng, config);
  return { state: s, events };
}
