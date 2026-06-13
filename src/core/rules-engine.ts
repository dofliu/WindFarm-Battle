// ============================================================
// 規則引擎（純函式，零 UI 依賴）。
//   - S2.1：風速骰、發電結算、動作經濟、鹽霧、12 回合流程、勝負（對齊 v3）
//   - S2.2：故障「施加 / cascade / 克制修復」（對齊 v3 playCardFromHand+processAutoRepair）
//   - 玩家動作 playCard 在 S2.3；AI 在 S2.4
// 內部以 mutate 工作副本求效率，對外一律回傳新狀態（cloneState）。
// ============================================================
import type { GameState, PlayerState, Wind } from './types';
import type { Rng } from './rng';
import { shuffle } from './rng';
import type { GameEvent, ApplyResult } from './events';
import { CARDS, deckCardIds } from './cards';
import { cloneState } from './game-state';
import {
  getAuraMwBonus, effectiveCoeff, isFaultImmune, isFragile, FRAGILE_DROP_MULT, hasPeriodicRepair,
  isStormAmplifyFault, STORM_AMPLIFY_MULT, isUnpredictableFault, isDisableScadaFault, UNPREDICTABLE_PROB,
  applyWeatherToWind, isShutdownAllActive, isMwhDoubleActive, WEATHER_MWH_DOUBLE_MULT,
  isSelfImmuneShutdown, isSelfImmuneWindPenalty, isSelfBoostWind,
  WEATHER_SELF_BOOST_MULT,
  evaluateContractCondition,
  hasFaultWarning,
} from './abilities';

/** 計算機組有效可用率（base - 所有故障 drop 加總，最低 0）。 */
function effectiveAvail(t: import('./types').DeployedTurbine): number {
  return Math.max(0, t.avail - t.faults.reduce((s, f) => s + f.drop, 0));
}

/** legacyV3=true 用於 β 逐場精確重現（含 v3 bug）；預設為修正後的正式版。 */
export interface RulesConfig {
  readonly legacyV3: boolean;
  /** 開局發給每位玩家的初始手牌張數（v3=0；UI MVP 用 3 增加選擇空間）。預設 0 對齊 v3 */
  readonly initialDraws?: number;
  /** 每回合 startRound 每位玩家抽幾張（v3=1）。預設 1 對齊 v3 */
  readonly drawsPerRound?: number;
  /**
   * 每位玩家回合開始時自動補牌到此張數（手牌不足時才補；手牌已達或超過則不動）。
   * 0 或 undefined = 不啟用自動補牌（對齊 v3 預設行為）。
   * UI_RICH_CONFIG 設為 4，防止手牌耗盡只能結束回合的無聊體驗。
   */
  readonly refillHandTo?: number;
}
export const DEFAULT_CONFIG: RulesConfig = { legacyV3: false, initialDraws: 0, drawsPerRound: 1 };
/** UI MVP 用的較豐富設定：開局 3 張 + 每回合 2 張 + 每回合補牌到 4 張（手牌上限仍 7） */
export const UI_RICH_CONFIG: RulesConfig = { legacyV3: false, initialDraws: 3, drawsPerRound: 2, refillHandTo: 4 };

/** 一個玩家的「行動函式」：在傳入狀態上行動並回傳事件。S2.1 用 no-op；S2.4 接 AI。 */
export type TakeTurn = (state: GameState, player: 0 | 1, rng: Rng) => GameEvent[];
const noopTurn: TakeTurn = () => [];

// ---------- 風速骰（對齊 v3 rollWind）----------
export function rollWind(rng: Rng): Wind {
  const r = rng.int(1, 6);
  if (r === 1) return { roll: 1, speed: 0, coeff: 0, label: '無風停機' };
  if (r === 2 || r === 3) return { roll: r, speed: 5, coeff: 0.4, label: '低風' };
  if (r === 4 || r === 5) return { roll: r, speed: 10, coeff: 1.0, label: '額定' };
  const r2 = rng.int(1, 6);
  if (r2 === 6) return { roll: '6+6', speed: 25, coeff: 0, label: '颱風', typhoon: true };
  return { roll: 6, speed: 20, coeff: 0.7, label: '高風' };
}

// ---------- 小工具 ----------
function hasActionAura(p: PlayerState): boolean {
  // 資料驅動：任何在場技師帶 aura-action（目前為 T07）→ +1 動作
  return p.techs.some((id) => CARDS[id].abilities.some((a) => a.tag === 'aura-action'));
}

function turbineMW(cardId: string, mwBonus: number): number {
  return (CARDS[cardId].stats?.mw ?? 0) + mwBonus;
}

/** 對手最高 MW 非停機機組之索引（v3 fault 預設目標）。無可攻擊目標回 -1。 */
function highestMwIndex(p: PlayerState): number {
  // 優先選非停機機組；若全停機也不該到這裡（canPlayCard 已擋）
  const candidates = p.turbines
    .map((t, i) => ({ i, mw: turbineMW(t.cardId, t.mwBonus), shutdown: t.shutdown }))
    .filter((c) => !c.shutdown);
  if (candidates.length === 0) return p.turbines.length > 0 ? 0 : -1; // fallback
  return candidates.reduce((best, c) => (c.mw > best.mw ? c : best)).i;
}

/** 該技師是否帶 auto-repair-low 標籤（D4：每回合 1 次上限的判定依據）。 */
function isLowLevelAutoRepair(techId: string): boolean {
  return CARDS[techId].abilities.some((a) => a.tag === 'auto-repair-low');
}

/**
 * Route B 知識-效能模型：技師的 specialty 是否與故障的 faultCategory 相符。
 * 相符 → 100% 修復（完全移除故障，無 avail 損失）。
 * 不符（包含一方無 specialty/faultCategory）→ 50% 修復（故障移除但 avail 永久下修）。
 */
function doesTechMatchFault(techCardId: string, faultCardId: string): boolean {
  const tech = CARDS[techCardId];
  const fault = CARDS[faultCardId];
  return !!(tech.specialty && fault.faultCategory && tech.specialty === fault.faultCategory);
}

// ---------- 內部 mutate 版（runGame 內使用單一工作副本；actions.ts 共用）----------
/** @internal 給 actions.ts 共用；外部請改用 drawCard() 純函式版。 */
export function _drawCard(s: GameState, player: 0 | 1, rng: Rng, _config: RulesConfig): void {
  const p = s.players[player];
  // Route B：牌庫空則以 deckCardIds（可抽卡池）重洗，排除開局艦隊和汰除升級牌
  if (p.deck.length === 0) p.deck = shuffle(deckCardIds as string[], rng);
  const cardId = p.deck.pop();
  if (cardId !== undefined && p.hand.length < 7) p.hand.push(cardId); // 手牌上限 7（對齊 v3）
}

/** @internal 給 actions.ts 共用；外部請改用 beginTurn() 純函式版。 */
export function _beginTurn(s: GameState, player: 0 | 1): GameEvent[] {
  const events: GameEvent[] = [];
  const p = s.players[player];
  s.currentPlayer = player;
  s.actionsLeft = 2 + (hasActionAura(p) ? 1 : 0) + p.pendingExtraActions;
  p.pendingExtraActions = 0;
  p.techPlayedThisRound = false; // 每回合開始重置技師卡出牌限制

  // T05 fault-warning：若對手場上有 T05（且 SCADA 未被 F09 停用），
  // 從當前玩家手牌中隨機選 1 張 fault 卡預警（不消耗手牌，僅揭示）。
  // SCADA 停用判斷：futureWind 被 F09 清空後，disable-scada 效果持續到本回合結束；
  // 此處以「對手 techs 中是否有 T05」為主要條件，F09 的 disable-scada 在施加時清空 futureWind，
  // 但不持久標記 scadaDisabled，故此處不做額外停用判斷（估計：F09 清空 futureWind 已是懲罰）。
  const opp = s.players[(1 - player) as 0 | 1];
  if (hasFaultWarning(opp)) {
    const faultCardsInHand = p.hand.filter((id) => CARDS[id].type === 'fault');
    if (faultCardsInHand.length > 0) {
      // 選第一張 fault（不消耗 RNG，確保 RNG 順序固定；揭示是確定性的）
      const warnedFaultId = faultCardsInHand[0];
      events.push({ kind: 'fault-warning', warnedPlayer: player, faultCardId: warnedFaultId });
    }
  }

  return events;
}

export function _tickFaults(s: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  s.players.forEach((p, pi) => {
    p.turbines.forEach((t, ti) => {
      for (const f of t.faults) {
        if (CARDS[f.cardId].spreading && f.roundsLeft > 1) f.drop += 5; // 擴散：未修每回合 -5%
      }
      t.faults = t.faults.filter((f) => {
        f.roundsLeft -= 1;
        if (f.roundsLeft <= 0) {
          events.push({ kind: 'fault-repaired', player: pi as 0 | 1, targetIdx: ti, cardId: f.cardId });
          return false;
        }
        return true;
      });
    });
  });
  return events;
}

export function _scoreRound(s: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  // S3.6：套用 W 卡風況修飾（wind-boost / wind-penalty）到 base wind
  const effectiveWind = applyWeatherToWind(s.wind, s.activeWeather);
  // S3.6：W02 shutdown-all 生效時，所有機組計分跳過（duration 內持續）
  const shutdownAll = isShutdownAllActive(s.activeWeather);
  // S3.5：F05 storm-amplify 觸發條件（用修飾後的 effectiveWind）— 颱風 OR 高風 0.7
  const stormAmplifyActive = effectiveWind.typhoon === true || effectiveWind.coeff === 0.7;
  s.players.forEach((p, pi) => {
    const player = pi as 0 | 1;
    let mwh = 0;
    // W02 shutdown-all：打出者免疫全場停機（self-immune-shutdown）
    const immuneShutdown = isSelfImmuneShutdown(s.activeWeather, player);
    // W03/W05 wind-penalty：打出者不受風速懲罰（self-immune-wind-penalty）
    const immuneWindPenalty = isSelfImmuneWindPenalty(s.activeWeather, player);
    // 若打出者免疫風速懲罰，對該玩家用不含 penalty 的風況
    const playerWind = immuneWindPenalty
      ? applyWeatherToWind(s.wind, s.activeWeather.filter((w) => !CARDS[w.cardId].abilities.some((a) => a.tag === 'wind-penalty')))
      : effectiveWind;
    if (!shutdownAll || immuneShutdown) {
      // S3.1：M07 aura-mw 是 player-level 光環（自家所有機組共享 +value MW，含自身）
      const auraMw = getAuraMwBonus(p);
      for (const t of p.turbines) {
        // S3.5：對每個 fault 計算 effDrop（storm-amplify 在風暴/高風時 ×2）
        const totalDrop = t.faults.reduce((sum, f) => {
          const effDrop = stormAmplifyActive && isStormAmplifyFault(f.cardId)
            ? f.drop * STORM_AMPLIFY_MULT
            : f.drop;
          return sum + effDrop;
        }, 0);
        const avail = Math.max(0, t.avail - totalDrop);
        // S3.1 + S3.2：weather-immune / lowwind-resist / storm-vulnerable / offshore-delay 一次套用
        // 用 playerWind（已考慮打出者免疫風速懲罰）
        // 停機機組不計分（但打出 W02 的玩家免疫停機）
        if (t.shutdown && !immuneShutdown) continue;
        const { coeff, skip } = effectiveCoeff(t, playerWind, s.round);
        if (skip) continue;
        mwh += (turbineMW(t.cardId, t.mwBonus) + auraMw) * coeff * (avail / 100);
      }
    }
    // S3.6：FN06 mwhBoost ×1.5 與 W04 mwh-double ×2 互斥取大（兩者同時 active 時 ×2）
    // W01 self-boost-wind：打出者額外 ×1.1（在 mwh-double/mwhBoost 之外疊加）
    const boostMult = isMwhDoubleActive(s.activeWeather)
      ? WEATHER_MWH_DOUBLE_MULT
      : p.mwhBoostActive ? 1.5 : 1.0;
    const selfBoostMult = isSelfBoostWind(s.activeWeather, player) ? WEATHER_SELF_BOOST_MULT : 1.0;
    mwh *= boostMult * selfBoostMult;
    mwh = Math.round(mwh);
    p.score += mwh;
    events.push({ kind: 'round-scored', player: pi as 0 | 1, mwh, total: p.score });
  });
  return events;
}

/**
 * S2.2：施加故障（對齊 v3 playCardFromHand 的 fault 分支）。
 * - 目標預設＝對手最高 MW 機組；options.targetIdx 可指定。
 * - drop = card.stats.drop；目標 special==='big-fail' 再 +5（v4 資料目前無 big-fail，留作 parity）。
 * - cascade：rng.next() < card.cascade 且對手機組>1 → 另一台 +floor(drop/2)，發 fault-cascaded。
 * 重要：rng 消耗順序固定為「先 cascade 機率擲骰」，β 對齊（legacyV3）依此一致。
 */
/** @internal 給 actions.ts 共用；外部請改用 applyFault() 純函式版。 */
export function _applyFault(
  s: GameState,
  attacker: 0 | 1,
  cardId: string,
  rng: Rng,
  targetIdx?: number,
): GameEvent[] {
  const events: GameEvent[] = [];
  const oppId = (1 - attacker) as 0 | 1;
  const opponent = s.players[oppId];
  if (opponent.turbines.length === 0) return events;

  const card = CARDS[cardId];
  if (card.type !== 'fault') return events;

  const tIdx = targetIdx ?? highestMwIndex(opponent);
  if (tIdx < 0 || tIdx >= opponent.turbines.length) return events;

  const target = opponent.turbines[tIdx];

  // S3.3：fault-immune（M10）/ immune-hydraulic（M09，F03）→ 主目標完全短路，不發 fault-applied。
  // 仍照常擲 cascade rng（保證 RNG 順序固定，β 對齊不受目標免疫影響）。
  const targetImmune = isFaultImmune(target, cardId);

  let drop = card.stats?.drop ?? 0;
  if (CARDS[target.cardId].special === 'big-fail') drop += 5;
  // S3.3：fragile（M08）→ drop ×1.5（受傷加重）
  if (isFragile(target)) drop = Math.floor(drop * FRAGILE_DROP_MULT);

  const rounds = card.stats?.rounds ?? 1;
  const sev = card.stats?.sev ?? 1;

  if (!targetImmune) {
    // FN08 insurance-shield：若機組有保護盾，消耗一層並短路故障
    if ((target.shieldCount ?? 0) > 0) {
      target.shieldCount = (target.shieldCount ?? 0) - 1;
      events.push({ kind: 'shield-absorbed', player: oppId, turbineIdx: tIdx, faultCardId: cardId, shieldLeft: target.shieldCount });
      // 保護盾吸收後仍要撲擲 cascade rng（保護 RNG 順序固定）
      if (card.cascade && card.cascade > 0 && opponent.turbines.length > 1) {
        rng.next(); // 消耗 cascade rng slot，但不施加故障
      }
      return events;
    }
    // 故障數量上限：同台風機最多 2 個故障。
    // 若已有 2 個故障，第 3 個故障不疊加，改為直接觸發停機（防止無限疊加的不合理情況）。
    if (target.faults.length >= 2) {
      // 第 3 個故障直接觸發停機（不疊加故障）
      if (!target.shutdown) {
        target.shutdown = true;
        events.push({ kind: 'turbine-shutdown', player: oppId, turbineIdx: tIdx, cardId: target.cardId });
      }
    } else {
      target.faults.push({ cardId, roundsLeft: rounds, sev, drop });
      events.push({ kind: 'fault-applied', player: oppId, targetIdx: tIdx, cardId, drop });
    }
  }

  // S3.5：F09 disable-scada — 施加時清空 state.futureWind（雙方共享預測佇列；攻擊者本來也看不到對手）
  // 沿用 v3「能放就有效」邏輯，即便目標 fault-immune 仍清空（標 estimate）
  if (isDisableScadaFault(cardId)) {
    s.futureWind.length = 0;
  }

  if (card.cascade && card.cascade > 0 && opponent.turbines.length > 1) {
    const hit = rng.next() < card.cascade;
    if (hit) {
      const otherIdx = opponent.turbines.findIndex((_, i) => i !== tIdx);
      if (otherIdx !== -1) {
        const otherTurbine = opponent.turbines[otherIdx];
        // S3.3：cascade 目標也檢查 fault-immune / fragile
        if (!isFaultImmune(otherTurbine, cardId)) {
          let cascadeDrop = Math.floor(drop / 2);
          if (isFragile(otherTurbine)) cascadeDrop = Math.floor(cascadeDrop * FRAGILE_DROP_MULT);
          // 故障數量上限：連鎖目標也遵守最多 2 個故障規則
          if (otherTurbine.faults.length >= 2) {
            // 連鎖第 3 個故障直接觸發停機
            if (!otherTurbine.shutdown) {
              otherTurbine.shutdown = true;
              events.push({ kind: 'turbine-shutdown', player: oppId, turbineIdx: otherIdx, cardId: otherTurbine.cardId });
            }
          } else {
            otherTurbine.faults.push({
              cardId,
              roundsLeft: rounds,
              sev,
              drop: cascadeDrop,
            });
            events.push({ kind: 'fault-cascaded', player: oppId, targetIdx: otherIdx, cardId });
            // 連鎖也觸發停機檢查
            if (!otherTurbine.shutdown && effectiveAvail(otherTurbine) <= 0) {
              otherTurbine.shutdown = true;
              events.push({ kind: 'turbine-shutdown', player: oppId, turbineIdx: otherIdx, cardId: otherTurbine.cardId });
            }
          }
        }
      }
    }
  }

  // 主目標：施加故障後若有效可用率 ≤ 0 → 緊急停機
  if (!targetImmune && !target.shutdown && effectiveAvail(target) <= 0) {
    target.shutdown = true;
    events.push({ kind: 'turbine-shutdown', player: oppId, turbineIdx: tIdx, cardId: target.cardId });
  }

  return events;
}

/**
 * S2.2：克制修復（對齊 v3 processAutoRepair，並套上 D4 + Route B 修正）。
 * 條件：tech.counters 含此 faultId 且（fault.required 不存在 或 含此 techId）。
 * D4：帶 auto-repair-low 標籤的技師（T01）每回合最多修 1 次（legacyV3=false 才生效；
 *      legacyV3=true 不限，重現 v3 過強行為）。其他技師沿用 v3 不限次數。
 *
 * Route B 知識-效能模型：
 *   - tech.specialty === fault.faultCategory → 100% 修復（移除故障，avail 不受損）
 *   - 不符或其中一方無對應欄位 → 50% 修復（故障移除，但 turbine.avail 永久下修 ⌊drop/2⌋）
 */
/** @internal 給 actions.ts / runGame 共用；外部請改用 repairFaults() 純函式版。 */
export function _repairFaults(s: GameState, player: 0 | 1, config: RulesConfig): GameEvent[] {
  const events: GameEvent[] = [];
  const p = s.players[player];
  const lowLevelUsed = new Set<string>(); // 以 techId 為鍵；若手上有多張 T01，每張各算一次
  for (let ti = 0; ti < p.turbines.length; ti++) {
    const t = p.turbines[ti];
    t.faults = t.faults.filter((fault) => {
      const faultCard = CARDS[fault.cardId];
      for (const techId of p.techs) {
        const tech = CARDS[techId];
        if (!tech.counters?.includes(faultCard.id)) continue;
        if (faultCard.required && !faultCard.required.includes(techId)) continue;
        if (!config.legacyV3 && isLowLevelAutoRepair(techId)) {
          if (lowLevelUsed.has(techId)) continue;
          lowLevelUsed.add(techId);
        }
        // Route B：專長相符 → 完全修復；不符 → 部分修復（avail 永久損失 50% drop）
        const fullRepair = doesTechMatchFault(techId, fault.cardId);
        let availLost = 0;
        if (!fullRepair) {
          // 部分修復：機組 avail 永久下修半個 drop（代表維修品質不足的長期影響）
          availLost = Math.floor(fault.drop * 0.5);
          t.avail = Math.max(0, t.avail - availLost);
        }
        events.push({
          kind: 'fault-repaired',
          player,
          targetIdx: ti,
          cardId: fault.cardId,
          by: techId,
          quality: fullRepair ? 'full' : 'partial',
          ...(availLost > 0 ? { availLost } : {}),
        });
        return false; // 無論修復品質，故障均從列表移除
      }
      return true;
    });
    // 停機復機檢查：修復後若有效可用率 > 0 且之前停機 → 恢復運轉
    if (t.shutdown && effectiveAvail(t) > 0) {
      t.shutdown = false;
      events.push({ kind: 'turbine-restart', player, turbineIdx: ti, cardId: t.cardId });
    }
  }
  return events;
}

/**
 * S3.4：T06 periodic-repair — 每回合（玩家回合結束後）自動修復 1 個 sev≤3 故障。
 * 與 T06 部署時的 'free-repair'（一次性）不同：這是「持續性」效果。
 * 估計值：選 drop 最高的 sev≤3 故障；若無可修則跳過。
 */
export function _periodicRepair(s: GameState, player: 0 | 1): GameEvent[] {
  const events: GameEvent[] = [];
  const p = s.players[player];
  if (!hasPeriodicRepair(p)) return events;
  // 找 sev≤3 且 drop 最高的故障（與 _deployTech 的 findBestRepairableFaultIdx 同邏輯，但內聯避免循環依賴）
  let bestT = -1;
  let bestF = -1;
  let bestDrop = -1;
  for (let ti = 0; ti < p.turbines.length; ti++) {
    const t = p.turbines[ti];
    for (let fi = 0; fi < t.faults.length; fi++) {
      const f = t.faults[fi];
      if ((CARDS[f.cardId].stats?.sev ?? 99) > 3) continue;
      if (f.drop > bestDrop) {
        bestDrop = f.drop;
        bestT = ti;
        bestF = fi;
      }
    }
  }
  if (bestT >= 0) {
    const removed = p.turbines[bestT].faults.splice(bestF, 1)[0];
    // by 標記用「periodic」標籤型字串，與技師 id 區隔（事件型別仍是 by?: string）
    events.push({ kind: 'fault-repaired', player, targetIdx: bestT, cardId: removed.cardId, by: 'periodic-repair' });
  }
  return events;
}

/**
 * S3.5：F08 unpredictable — 回合開始時，對每個 unpredictable 故障 50% 機率 swap 到對手另一台機組。
 * RNG 消耗：每個 unpredictable 故障 1 次（決定是否 shuffle）+ 1 次（決定 swap 到哪台，只在多台時）。
 * 注意：本函式被 runGame 在 _tickFaults 之後呼叫；β 對齊需確保 RNG 順序穩定。
 */
export function _unpredictableShuffle(s: GameState, rng: Rng): GameEvent[] {
  const events: GameEvent[] = [];
  for (let pi = 0; pi < 2; pi++) {
    const p = s.players[pi];
    if (p.turbines.length < 2) continue; // 少於 2 台無處 swap
    for (let ti = 0; ti < p.turbines.length; ti++) {
      const t = p.turbines[ti];
      // 從尾向前找，以便 splice 不影響 index
      for (let fi = t.faults.length - 1; fi >= 0; fi--) {
        const f = t.faults[fi];
        if (!isUnpredictableFault(f.cardId)) continue;
        if (rng.next() >= UNPREDICTABLE_PROB) continue;
        // 從其他機組挑一台
        const others = p.turbines.map((_, i) => i).filter((i) => i !== ti);
        const newIdx = others[Math.floor(rng.next() * others.length)];
        const moved = t.faults.splice(fi, 1)[0];
        p.turbines[newIdx].faults.push(moved);
        events.push({
          kind: 'fault-applied', player: pi as 0 | 1, targetIdx: newIdx, cardId: moved.cardId, drop: moved.drop,
        });
      }
    }
  }
  return events;
}

/**
 * S3.6：天氣倒數 — duration -= 1，0 時移除並發 weather-expired 事件。
 * 在 _tickFaults 後、套用 weather 風況前呼叫；確保新施加的天氣（duration=1）本回合就生效後再倒數。
 * 邏輯：先「本回合使用」→ 結算結束後 → 下回合開頭 tick。實際接點放在 runGame 結算後。
 */
export function _tickWeather(s: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  s.activeWeather = s.activeWeather.filter((w) => {
    w.duration -= 1;
    if (w.duration <= 0) {
      events.push({ kind: 'weather-expired', cardId: w.cardId });
      return false;
    }
    return true;
  });
  return events;
}

/**
 * S3.7：合約評估 — 每回合結算後對每個未達成合約檢查條件。
 * - 一次性條件（C02 totalMW / C03 techCount）：達標立即 +reward 並 fulfilled=true
 * - 持續條件（C01 highAvail / C04 killOpponent，target.rounds 存在）：達標 progress++；
 *   progress >= target.rounds → +reward + fulfilled；未達標時 progress 不重置（estimate；
 *   v3 無基準。若未來要嚴格「連續」，可在未達標時 progress=0）
 * Fulfilled 的合約留在清單但不再評估；下一步在 runGame 結束時可選擇移除（目前保留作 audit 紀錄）。
 */
export function _checkContracts(s: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  for (const c of s.activeContracts) {
    if (c.fulfilled) continue;
    const card = CARDS[c.cardId];
    const target = card.target;
    if (!target) continue;

    const owner = c.player;
    const opp = (1 - owner) as 0 | 1;

    // S3.7 雙方攻防：同時檢查打出者和對手是否達成合約目標
    const ownerMeets = evaluateContractCondition(c.cardId, owner, s);
    const oppMeets = evaluateContractCondition(c.cardId, opp, s);

    if (!ownerMeets && !oppMeets) continue;

    if (target.rounds && target.rounds > 1) {
      // 連續条件合約（C01 highAvail / C04 killOpponent）
      if (ownerMeets) {
        c.progress += 1;
        events.push({ kind: 'contract-progress', player: owner, cardId: c.cardId, progress: c.progress });
        if (c.progress >= target.rounds) {
          // 打出者達成
          s.players[owner].score += target.reward;
          c.fulfilled = true;
          events.push({ kind: 'contract-fulfilled', player: owner, cardId: c.cardId, reward: target.reward });
        }
      } else if (oppMeets) {
        // 對手搶先達成（打出者進度中斷）：對手拿獎勵，合約封閉
        s.players[opp].score += target.reward;
        c.fulfilled = true;
        events.push({ kind: 'contract-fulfilled', player: opp, cardId: c.cardId, reward: target.reward });
        events.push({ kind: 'contract-stolen', stolenBy: opp, cardId: c.cardId });
      }
    } else {
      // 一次性条件合約（C02 totalMW / C03 techCount）
      if (ownerMeets) {
        // 打出者達成（即使對手同回合也達成，打出者優先）
        s.players[owner].score += target.reward;
        c.fulfilled = true;
        events.push({ kind: 'contract-fulfilled', player: owner, cardId: c.cardId, reward: target.reward });
      } else {
        // 對手搶先達成
        s.players[opp].score += target.reward;
        c.fulfilled = true;
        events.push({ kind: 'contract-fulfilled', player: opp, cardId: c.cardId, reward: target.reward });
        events.push({ kind: 'contract-stolen', stolenBy: opp, cardId: c.cardId });
      }
    }
  }
  return events;
}

export function _applySalt(s: GameState): void {
  if (s.round % 4 !== 0) return;
  for (const p of s.players) {
    for (const t of p.turbines) {
      if (CARDS[t.cardId].special === 'salt') t.avail = Math.max(0, t.avail - 2); // M04 鹽霧腐蝕
    }
  }
}

// ---------- 對外純函式（clone 後呼叫內部版）----------
export function drawCard(
  state: GameState, player: 0 | 1, rng: Rng, config: RulesConfig = DEFAULT_CONFIG,
): ApplyResult {
  const s = cloneState(state);
  _drawCard(s, player, rng, config);
  return { state: s, events: [] };
}

export function beginTurn(state: GameState, player: 0 | 1): ApplyResult {
  const s = cloneState(state);
  const events = _beginTurn(s, player);
  return { state: s, events };
}

export function tickFaults(state: GameState): ApplyResult {
  const s = cloneState(state);
  return { state: s, events: _tickFaults(s) };
}

export function scoreRound(state: GameState): ApplyResult {
  const s = cloneState(state);
  return { state: s, events: _scoreRound(s) };
}

export function applySalt(state: GameState): GameState {
  const s = cloneState(state);
  _applySalt(s);
  return s;
}

/** S2.2：對外純函式，施加故障（cascade 機率擲骰會消耗 1 次 rng.next）。 */
export function applyFault(
  state: GameState,
  attacker: 0 | 1,
  cardId: string,
  rng: Rng,
  targetIdx?: number,
): ApplyResult {
  const s = cloneState(state);
  const events = _applyFault(s, attacker, cardId, rng, targetIdx);
  return { state: s, events };
}

/** S2.2：對外純函式，結束回合時的克制修復。 */
export function repairFaults(
  state: GameState,
  player: 0 | 1,
  config: RulesConfig = DEFAULT_CONFIG,
): ApplyResult {
  const s = cloneState(state);
  const events = _repairFaults(s, player, config);
  return { state: s, events };
}

export function determineWinner(state: GameState): 0 | 1 | -1 {
  const a = state.players[0].score;
  const b = state.players[1].score;
  return a > b ? 0 : b > a ? 1 : -1;
}

// ---------- 12 回合主迴圈（結構對齊 v3 simulateOneGame）----------
// 注意：β 的「逐場精確重現」需與 v3 完全相同的 RNG 消耗順序，於 S2.5 以 legacyV3 處理。
export function runGame(
  initial: GameState,
  rng: Rng,
  takeTurn: TakeTurn = noopTurn,
  config: RulesConfig = DEFAULT_CONFIG,
): ApplyResult {
  const s = cloneState(initial);
  const events: GameEvent[] = [];

  // S5.X：開局發 initialDraws 張（v3 預設 0；UI MVP 用 3）
  const initialDraws = config.initialDraws ?? 0;
  for (let i = 0; i < initialDraws; i++) {
    _drawCard(s, 0, rng, config);
    _drawCard(s, 1, rng, config);
  }

  const drawsPerRound = config.drawsPerRound ?? 1;

  for (let r = 1; r <= s.maxRounds; r++) {
    s.round = r;
    // FN05 D4 修正：若 futureWind 有預存，優先消費（legacyV3=true 時忽略以重現 v3 bug）
    if (!config.legacyV3 && s.futureWind.length > 0) {
      s.wind = s.futureWind.shift() as Wind;
    } else {
      s.wind = rollWind(rng);
    }
    events.push({ kind: 'round-start', round: r, windLabel: s.wind.label });

    events.push(..._tickFaults(s));
    // S3.5：F08 unpredictable 隨機 shuffle（_tickFaults 之後、抽牌前；保持 RNG 順序穩定）
    events.push(..._unpredictableShuffle(s, rng));
    s.players.forEach((p) => {
      p.mwhBoostActive = false;
    });
    for (let i = 0; i < drawsPerRound; i++) {
      _drawCard(s, 0, rng, config);
      _drawCard(s, 1, rng, config);
    }

    s.firstPlayer = ((r - 1) % 2) as 0 | 1;
    const refillTo = config.refillHandTo ?? 0;
    for (let turn = 0; turn < 2; turn++) {
      const p = ((s.firstPlayer + turn) % 2) as 0 | 1;
      events.push(..._beginTurn(s, p));
      // 自動補牌：手牌張數 < refillHandTo 時補到目標張數（手牌上限 7 由 _drawCard 內部控制）
      if (refillTo > 0) {
        const player = s.players[p];
        while (player.hand.length < refillTo) {
          _drawCard(s, p, rng, config);
        }
      }
      events.push(...takeTurn(s, p, rng));
      // S2.2：每位玩家結束回合後處理克制修復（對齊 v3 endHumanTurn → processAutoRepair）
      events.push(..._repairFaults(s, p, config));
      // S3.4：T06 periodic-repair 在 _repairFaults 之後追加修一張 sev≤3 故障（持續性效果）
      events.push(..._periodicRepair(s, p));
    }

    events.push(..._scoreRound(s));
    _applySalt(s);
    // S3.7：合約評估（每回合結算後檢查條件、累積 progress、發 reward）
    events.push(..._checkContracts(s));
    // S3.6：結算後 tick 天氣（duration -= 1；0 移除並發 weather-expired）
    // 接在結算後是因為新施加的天氣（duration=1）應於本回合生效後才倒數
    events.push(..._tickWeather(s));
  }

  s.gameOver = true;
  events.push({ kind: 'game-over', winner: determineWinner(s) });
  return { state: s, events };
}
