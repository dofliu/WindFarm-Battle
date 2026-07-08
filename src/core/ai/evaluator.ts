// ============================================================
// AI 行動評分函式（對齊 v3 evaluate*Play 的全部係數）。
// 純函式、無副作用、不消耗 RNG（AI 隨機性集中於 difficulty.ts 的選牌階段）。
//
// 難度差異化（v4.7 新增）：
//   - easy：攻擊評分 ×0.5、修復評分 ×0.5、部署評分 ×0.7（不積極攻擊也不積極修復）
//   - medium：攻擊評分 ×0.85、修復評分 ×1.0、部署評分 ×1.0（稍保守）
//   - hard：攻擊評分 ×1.2（優先攻擊最高 MW 機組）、修復評分 ×1.3、部署評分 ×1.1
//
// 重要對齊：
//   - 估算用 AI_AVG_WIND_COEFF=0.65；結算用 state.wind.coeff（兩者語義不同，勿混用）
//   - 所有「魔法數字」逐字對齊 v3：×1.5、cost×4、0.75^len、early×1.4、late×0.4 等
//   - 不在此檔處理難度／RNG／合法性過濾，那些屬 difficulty.ts / generateActions
// ============================================================
import type { Card, DeployedTurbine, GameState, PlayerState, ResourceType } from '../types';
import type { Difficulty } from '../types';
import { CARDS } from '../cards';
import { hasNoSlot, NO_WIND_POWER_COEFF } from '../abilities';
import type { Strategy } from './strategy';

/**
 * 難度評分係數：讓 Easy/Medium/Hard 的評分本身就有差異，而不僅靠選牌階段的隨機性。
 * - attackMult：影響故障卡評分（攻擊傾向）
 * - repairMult：影響技師卡評分（修復傾向）
 * - deployMult：影響風機卡評分（部署傾向）
 */
export interface DifficultyMultipliers {
  readonly attackMult: number;
  readonly repairMult: number;
  readonly deployMult: number;
  /** Hard 專屬：是否優先攻擊對手最高 MW 機組（而非最高 drop） */
  readonly targetHighestMW: boolean;
}

export function getDifficultyMultipliers(difficulty: Difficulty): DifficultyMultipliers {
  switch (difficulty) {
    case 'easy':
      return { attackMult: 0.5, repairMult: 0.5, deployMult: 0.7, targetHighestMW: false };
    case 'medium':
      return { attackMult: 0.85, repairMult: 1.0, deployMult: 1.0, targetHighestMW: false };
    case 'hard':
      return { attackMult: 1.2, repairMult: 1.3, deployMult: 1.1, targetHighestMW: true };
    default:
      return { attackMult: 1.0, repairMult: 1.0, deployMult: 1.0, targetHighestMW: false };
  }
}

/** Card 是否有 no-wind-power 標籤（M12 儲能：永遠額定出力，不受風速影響）*/
function cardHasNoWindPower(card: Card): boolean {
  return card.abilities.some((a) => a.tag === 'no-wind-power');
}

export const AI_AVG_WIND_COEFF = 0.65;
/** v3 doAITurn：若選到的最佳動作 score < RESERVE_THRESHOLD → 保留行動，跳過剩餘出牌。 */
export const RESERVE_THRESHOLD = -10;
/**
 * 撤退門檻（設計決定）：主力有效可用率低於此值時，AI 傾向撤退換血。
 * 計分口徑修正後（見 rules-engine._scoreRound 說明：全艦隊計分，主力只是「暴露在故障
 * 攻擊範圍內」的那一台），撤退的價值變成純防禦——把已經傷得重的機組換下火線，讓它
 * 不再被繼續疊加故障，同時技師修復仍可對其施術；不再是「維持誰在計分」的問題。
 */
export const RETREAT_AVAIL_THRESHOLD = 55;

function turbineMW(t: DeployedTurbine): number {
  return (CARDS[t.cardId].stats?.mw ?? 0) + t.mwBonus;
}

/**
 * 找備戰區（排除主力）中 MW 最低的機組，供部署/收回評分估算「值不值得換」。
 * 寶可夢式規則：主力受保護，不會被部署/FN01 自動選中替換，AI 的評分邏輯要跟規則一致，
 * 否則 AI 會誤判「打出更強機組可以替換主力」而選到一個實際上不會發生的動作。
 */
function findWeakestTurbine(p: PlayerState): DeployedTurbine | undefined {
  let weakest: DeployedTurbine | undefined;
  let weakestMW = Infinity;
  for (let i = 0; i < p.turbines.length; i++) {
    if (i === p.activeTurbineIdx) continue;
    const mw = turbineMW(p.turbines[i]);
    if (mw < weakestMW) {
      weakestMW = mw;
      weakest = p.turbines[i];
    }
  }
  return weakest;
}

/** 有效可用率（base - 所有故障 drop 加總，最低 0）。供撤退評分估算目前主力/備戰機組的健康度。 */
function effectiveAvailPct(t: DeployedTurbine): number {
  return Math.max(0, t.avail - t.faults.reduce((s, f) => s + f.drop, 0));
}

// ---------------- evaluateTurbinePlay ----------------
export function evaluateTurbinePlay(
  card: Card,
  state: GameState,
  player: 0 | 1,
  strategy: Strategy,
  difficulty: Difficulty = 'hard',
): number {
  const { deployMult } = getDifficultyMultipliers(difficulty);
  const me = state.players[player];
  const mw = card.stats?.mw ?? 0;
  const avail = card.stats?.avail ?? 0;

  // M12 no-wind-power：永遠以係數 1.0 出力，不受風速影響——使用真實係數估算
  const windCoeff = cardHasNoWindPower(card) ? NO_WIND_POWER_COEFF : AI_AVG_WIND_COEFF;
  const expectedMWh = mw * windCoeff * (avail / 100) * strategy.roundsLeft;
  let score = expectedMWh * 1.5;
  score -= card.cost * 4;

  // M10 no-slot：部署後不佔機組格，可疊加在 3 台上限之上——跳過主力/備戰邏輯
  if (hasNoSlot(card.id)) {
    // 純增加 1 MW 的價值（不替換），邊際係數仍適用
    score *= Math.pow(0.75, me.turbines.length);
  } else if (me.activeTurbineIdx === null) {
    // 尚無主力：這張立即成為主力（其實部署到哪一格都全額計分——見 rules-engine._scoreRound
    // 說明；主力/備戰的差別只在「誰暴露在故障攻擊範圍內」），維持 expectedMWh 原值
  } else {
    // 主力+備戰區共上限 4 台（1 主力＋3 備戰）；滿了才需要比較「值不值得替換最弱備戰」。
    // 計分口徑修正後全艦隊都計分，這裡不再套用備戰折價。
    const benchFull = me.turbines.reduce(
      (n, t, i) => (i !== me.activeTurbineIdx && !hasNoSlot(t.cardId) ? n + 1 : n),
      0,
    ) >= 3;
    if (benchFull) {
      const weakest = findWeakestTurbine(me);
      const weakestMW = weakest ? turbineMW(weakest) : 0;
      if (mw <= weakestMW) return -50; // 不值得替換
      const upgrade = (mw - weakestMW) * windCoeff * strategy.roundsLeft;
      score = upgrade * 1.5 - card.cost * 4;
    } else {
      score *= Math.pow(0.75, me.turbines.length); // 邊際遞減（多一台機組的邊際價值遞減，非備戰折價）
    }
  }

  // M07 aura-mw：場上每台機組都 +auraMw MW（player-level 光環，見 rules-engine.getAuraMwBonus）
  // ——全艦隊計分下，光環價值會隨在場機組數量疊加。
  if (card.abilities.some((a) => a.tag === 'aura-mw' && a.value !== undefined)) {
    const auraMw = card.abilities.find((a) => a.tag === 'aura-mw')!.value ?? 1;
    const auraBonus = me.turbines.length * auraMw * AI_AVG_WIND_COEFF * strategy.roundsLeft * 1.5;
    score += auraBonus;
  }
  // M07 card-draw-trigger：打出時抽一張牌，估算為 ~8 分
  if (card.abilities.some((a) => a.tag === 'card-draw-trigger')) score += 8;

  if (strategy.phase === 'early') score *= 1.4;
  if (strategy.phase === 'late') score *= 0.4;
  if (strategy.roundsLeft <= 2) score *= 0.15;
  if (card.special === 'big-fail') score -= 8;
  if (card.special === 'storm-vulnerable') score -= 3;
  if (strategy.position === 'losing') score *= 1.2;
  score *= deployMult; // 難度部署係數
  return score;
}

// ---------------- evaluateTechPlay ----------------
export function evaluateTechPlay(
  card: Card,
  state: GameState,
  player: 0 | 1,
  strategy: Strategy,
  difficulty: Difficulty = 'hard',
): number {
  const { repairMult } = getDifficultyMultipliers(difficulty);
  const me = state.players[player];
  const opp = state.players[1 - player];
  if (me.techs.includes(card.id)) return -1000; // 已派遣不可重複

  let score = 5;

  // 自家有故障且此 tech 能修 → 估算被避免的損失
  for (const turbine of me.turbines) {
    for (const fault of turbine.faults) {
      if (card.counters?.includes(fault.cardId)) {
        const damageInRounds =
          (fault.drop * turbineMW(turbine) * AI_AVG_WIND_COEFF) / 100 * fault.roundsLeft;
        score += damageInRounds * 2;
      }
    }
  }

  // T06 出場立即修最高 sev≤3 故障
  if (card.special === 'free-repair') {
    let worstDrop = 0;
    for (const t of me.turbines) {
      for (const f of t.faults) {
        if ((CARDS[f.cardId].stats?.sev ?? 0) <= 3 && f.drop > worstDrop) worstDrop = f.drop;
      }
    }
    score += worstDrop * 0.8 + 8;
  }

  if (card.special === 'extra-action') score += 25 + strategy.roundsLeft * 4;
  if (card.special === 'predict') score += strategy.roundsLeft * 0.8;

  if (opp.turbines.length > 0 && card.counters && card.counters.length > 0) {
    score += card.counters.length * 2;
    if (strategy.phase !== 'early') {
      score += (card.stats?.repairsUpTo ?? 0) * 2;
    }
  }

  // R4：招募能「新增專長」的技師 → 推進/解鎖組合(團隊互補/全能小組)，加分
  if (card.specialty) {
    const specs = new Set(me.techs.map((id) => CARDS[id].specialty).filter(Boolean));
    if (!specs.has(card.specialty)) {
      const next = specs.size + 1;
      score += next === 2 ? 10 : next === 3 ? 14 : 4;
    }
  }

  score -= card.cost * 4;
  if (strategy.phase === 'late') score *= 0.5;
  score *= repairMult; // 難度修復係數
  return score;
}

// ---------------- evaluateFaultPlay ----------------
/**
 * 寶可夢式主力/備戰區規則：故障卡唯一合法目標＝對手主力機組（呼叫端 generateActions 已只會
 * 傳入對手主力當 target，這裡不需要再比較「哪台最強」——備戰區機組已不是候選）。
 */
export function evaluateFaultPlay(
  card: Card,
  target: DeployedTurbine,
  state: GameState,
  player: 0 | 1,
  strategy: Strategy,
  difficulty: Difficulty = 'hard',
): number {
  const { attackMult } = getDifficultyMultipliers(difficulty);
  const opp = state.players[1 - player];
  const targetCard = CARDS[target.cardId];
  let score = 0;

  // required 命中（對手無對應 tech）→ 大幅加分；無 required 且會被反制 → 扣分
  if (card.required) {
    const hasRequired = card.required.some((t) => opp.techs.includes(t));
    if (!hasRequired) score += 35;
  } else {
    const willBeCountered = opp.techs.some((techId) =>
      CARDS[techId].counters?.includes(card.id),
    );
    if (willBeCountered) score -= 25;
  }

  let drop = card.stats?.drop ?? 0;
  if (targetCard.special === 'big-fail') drop += 5;

  const cardRounds = card.stats?.rounds ?? 1;
  const rounds = Math.min(cardRounds, strategy.roundsLeft);
  const targetMW = turbineMW(target);
  const damagePerRound = targetMW * AI_AVG_WIND_COEFF * (drop / 100);
  const totalDamage = damagePerRound * rounds;
  score += totalDamage * 2.5;

  // 寶可夢式規則：備戰區免疫故障，cascade 命中的「另一台機組」不存在，連鎖傷害估算已無意義（移除）。

  if (card.spreading) score += 6;
  if (target.faults.length > 0) score *= Math.pow(0.6, target.faults.length); // 同目標疊故障邊際遞減
  score -= card.cost * 4;
  if (strategy.phase === 'early') score *= 0.7;
  if (strategy.phase === 'late') score *= 1.3;
  if (strategy.position === 'losing') score *= 1.4;
  if (strategy.position === 'winning') score *= 0.85;
  // 舊版 Hard「targetHighestMW」加分邏輯已移除：新規則下對手只有 1 台合法目標（主力），
  // 「挑最高 MW」的差異化已無意義（getDifficultyMultipliers 仍保留該欄位供難度資訊查詢/測試使用）。
  score *= attackMult; // 難度攻擊係數

  // T08 peek-hand 感知：場上有 T08（peek-hand tag）時，AI 已知道對手手牌，攻擊評分 +5（更有信心出故障）
  if (state.players[player].techs.some((id) => CARDS[id].abilities.some((a) => a.tag === 'peek-hand'))) {
    score += 5;
  }

  return score;
}

// ---------------- evaluateSkillPlay（輕模式：技師出招／快修）----------------
/**
 * 評估「技師對自家某機組出招快修」的價值。
 * 立即修復 drop 最高的故障 → 本回合起恢復發電，價值 ≈ 被挽回的發電量。
 * Route B：技師專長與故障不符時為部分修復（永久 avail 損耗）→ 扣分，讓 AI 傾向用對的人。
 */
/**
 * P2：評估技師專屬招式的價值。依 techSkill(techId).tag 分派。
 * target 對「無目標」招式(scada-scan/field-diagnosis/dispatch)為 undefined。
 */
export function evaluateSkillPlay(
  techId: string,
  tag: string,
  target: DeployedTurbine | undefined,
  state: GameState,
  player: 0 | 1,
  strategy: Strategy,
  difficulty: Difficulty = 'hard',
): number {
  const { repairMult } = getDifficultyMultipliers(difficulty);
  const roundsLeft = Math.max(1, strategy.roundsLeft);
  const me = state.players[player];
  const recoveredFor = (t: DeployedTurbine, drop: number): number =>
    ((drop * turbineMW(t) * AI_AVG_WIND_COEFF) / 100) * roundsLeft;

  switch (tag) {
    case 'dispatch':
      return 8; // +1 動作
    case 'scada-scan': {
      const total = me.turbines.reduce((n, t) => n + t.faults.length, 0);
      return total > 0 ? total * 3 : -1000;
    }
    case 'field-diagnosis': {
      const total = me.turbines.reduce((n, t) => n + t.faults.length, 0);
      return total > 0 ? total * 4 * repairMult : -1000;
    }
    case 'rnd-upgrade':
      return target ? 2 * AI_AVG_WIND_COEFF * roundsLeft * 1.5 - 2 : -1000;
    case 'drone-sweep': {
      if (!target || target.faults.length === 0) return -1000;
      const val = target.faults.reduce((s, f) => s + recoveredFor(target, f.drop), 0);
      return val * 2 * repairMult;
    }
    default: {
      // quick-repair / blade-repair / mech-overhaul / elec-reset：修一個故障
      if (!target || target.faults.length === 0) return -1000;
      let worst = target.faults[0];
      for (const f of target.faults) if (f.drop > worst.drop) worst = f;
      let score = recoveredFor(target, worst.drop) * 2;
      // 僅 quick-repair 走 Route B（專科招式必完全修復，無 mismatch 懲罰）
      if (tag === 'quick-repair') {
        const tech = CARDS[techId];
        const fc = CARDS[worst.cardId];
        const match = !!(tech.specialty && fc.faultCategory && tech.specialty === fc.faultCategory);
        if (!match) score -= (Math.floor(worst.drop * 0.5) * turbineMW(target) * AI_AVG_WIND_COEFF) / 100 * roundsLeft * 1.2;
      }
      return score * repairMult;
    }
  }
}

// ---------------- evaluateResourceGrab（R3：搶共享資源）----------------
/**
 * 評估「搶一項共享資源」的價值（花 1 動作）。
 * grid-priority：本回合 +5 MWh；spare-part/crane：完全修復目標機組最嚴重故障(挽回發電)。
 * 額外加一點「掠奪價值」——搶到即剝奪對手。
 */
export function evaluateResourceGrab(
  resType: ResourceType,
  target: DeployedTurbine | undefined,
  _state: GameState,
  _player: 0 | 1,
  strategy: Strategy,
  difficulty: Difficulty = 'hard',
): number {
  const { repairMult } = getDifficultyMultipliers(difficulty);
  const roundsLeft = Math.max(1, strategy.roundsLeft);
  let value: number;
  if (resType === 'grid-priority') {
    value = 5 * 2; // +5 MWh，估值 ×2
  } else if (target && target.faults.length > 0) {
    let worst = target.faults[0];
    for (const f of target.faults) {
      const better = resType === 'crane' ? f.sev > worst.sev : f.drop > worst.drop;
      if (better) worst = f;
    }
    const mw = turbineMW(target);
    value = ((worst.drop * mw * AI_AVG_WIND_COEFF) / 100) * roundsLeft * 2 * repairMult;
  } else {
    return -1000;
  }
  return value + 3 /* 掠奪價值 */ - 4 /* 1 動作成本 */;
}

// ---------------- evaluateFuncPlay ----------------
export function evaluateFuncPlay(card: Card, state: GameState, player: 0 | 1, strategy: Strategy): number {
  const me = state.players[player];
  let score = 0;

  switch (card.effect) {
    case 'returnTurbine': {
      // 寶可夢式規則：主力受保護，FN01 只能收回備戰區機組；備戰區為空時無合法目標。
      const weakest = findWeakestTurbine(me);
      if (!weakest) return -1000;
      const weakestMW = turbineMW(weakest);
      const biggerInHand = me.hand.some((cId) => {
        const c = CARDS[cId];
        return c.type === 'turbine' && (c.stats?.mw ?? 0) > weakestMW;
      });
      const benchFull = me.turbines.reduce(
        (n, t, i) => (i !== me.activeTurbineIdx && !hasNoSlot(t.cardId) ? n + 1 : n),
        0,
      ) >= 3;
      if (benchFull && biggerInHand) score = 25 + (8 - weakestMW) * 2;
      else if (biggerInHand) score = 10;
      else score = -5;
      break;
    }
    case 'draw2': {
      score = 8 + (5 - me.hand.length) * 3;
      if (me.hand.length >= 6) score = -5;
      if (strategy.phase === 'late') score *= 0.7;
      break;
    }
    case 'upgradeMW': {
      const canUpgrade = me.turbines.some((t) => t.mwBonus === 0);
      if (!canUpgrade) return -1000;
      score = 2 * AI_AVG_WIND_COEFF * 0.9 * strategy.roundsLeft * 1.5;
      score -= card.cost * 4;
      break;
    }
    case 'extraAction': {
      if (me.pendingExtraActions >= 2) return -1000;
      score = 7;
      break;
    }
    case 'searchTurbine': {
      // FN07 tutor-turbine：從牌庫搜最高 MW 的風機加入手牌
      const hasTurbineInDeck = me.deck.some((id) => CARDS[id].type === 'turbine');
      if (!hasTurbineInDeck) return -1000;
      score = 12 + strategy.roundsLeft * 0.5;
      if (strategy.phase === 'late') score *= 0.4;
      break;
    }
    case 'insurance': {
      // FN08 insurance-shield：對最多故障的機組加保護盾
      const hasFaultedTurbine = me.turbines.some((t) => t.faults.length > 0);
      score = hasFaultedTurbine ? 10 : 3;
      score -= card.cost * 4;
      break;
    }
    case 'massRepair': {
      // FN09 緊急大修：每場限用 1 次，有多個故障時才高分
      if (me.usedOncePerGame.includes(card.id)) return -1000;
      const totalFaults = me.turbines.reduce((s, t) => s + t.faults.length, 0);
      if (totalFaults === 0) return -5;
      score = totalFaults * 8 + 10;
      break;
    }
    case 'evolveTurbine': {
      // UP01-UP04 風機升級進化卡
      const tier = card.abilities.find((a) => a.tag.startsWith('evolve-'))?.tag;
      // 進化路徑 MW 增益對映：升級後的 MW - 升級前的 MW
      const EVOLVE_MW_GAIN: Record<string, number> = {
        'evolve-tier1': 2,  // M01(2)→M03(4) or M02(3)→M04(5) or OS8(8)→M09(10)  avg +2
        'evolve-tier2': 2,  // M03(4)→M05(6) or M04(5)→M06(8) or OS10(10)→M11(11)  avg +2
        'evolve-tier3': 3,  // M05(6)→M09(10) or M06(8)→M07(12) avg +4.5
        'evolve-universal': 3, // +3MW bonus
      };
      const mwGain = EVOLVE_MW_GAIN[tier ?? ''] ?? 0;
      if (mwGain === 0) { score = -1000; break; }
      // 有符合條件的機組才給分（否則 canPlayCard 已經排除）
      const expectedGain = mwGain * AI_AVG_WIND_COEFF * strategy.roundsLeft * 1.5;
      score = expectedGain - card.cost * 4;
      if (strategy.phase === 'late') score *= 0.4; // 終局升級來不及
      if (strategy.phase === 'early') score *= 1.2; // 早期升級效益高
      break;
    }
    case 'predictWind': {
      score = 4 + strategy.roundsLeft * 0.5;
      break;
    }
    case 'mwhBoost': {
      score = strategy.myMWhPerRound * 0.5 * 1.8;
      score -= card.cost * 4;
      if (state.wind.coeff >= 0.7) score *= 1.3;
      if (state.wind.coeff === 0) return -10;
      break;
    }
    default:
      break;
  }

  // T09 func-bonus 感知：場上有 T09 且本回合尚未累積到上限（funcBonusThisRound < 2）時，出 func 卡額外 +8 分
  // （這讓 AI 在有 T09 時更積極出 func 卡以觸發 +1 動作）
  if (me.techs.some((id) => CARDS[id].abilities.some((a) => a.tag === 'func-bonus'))) {
    if (me.funcBonusThisRound < 2) {
      score += 8;
    }
  }

  return score;
}

// ---------------- evaluateRetreatPlay（寶可夢式撤退）----------------
/**
 * 評估「把主力換成 benchIdx 指定備戰區機組」的價值。
 * 計分口徑修正後（見 rules-engine._scoreRound）：全艦隊都計分，主力/備戰的差別只在
 * 「誰暴露在故障卡攻擊範圍內」——retreat 不再是「維持誰在計分」，是純防禦：
 * 主力越不健康（有效可用率低、甚至停機），越該把它換下火線，避免對手繼續疊加故障；
 * 換上健康的候選能立刻降低下一波攻擊的風險。換血本身花 1 動作（與其他動作一致，
 * 扣 cost×4＝4 分），終局（roundsLeft≤1）換血意義不大要打折。
 */
export function evaluateRetreatPlay(
  state: GameState,
  player: 0 | 1,
  benchIdx: number,
  strategy: Strategy,
): number {
  const me = state.players[player];
  const activeIdx = me.activeTurbineIdx;
  if (activeIdx === null) return -1000;
  const active = me.turbines[activeIdx];
  const bench = me.turbines[benchIdx];
  if (!active || !bench) return -1000;

  const activeEff = effectiveAvailPct(active);
  const benchEff = effectiveAvailPct(bench);

  let score = 0;
  if (active.shutdown) score += 20; // 主力停機 → 強烈建議換下火線，避免繼續被疊加故障
  if (activeEff < RETREAT_AVAIL_THRESHOLD) score += (RETREAT_AVAIL_THRESHOLD - activeEff) * 0.8;
  score += (benchEff - activeEff) * 0.35; // 換上更健康的機組加分；換更差的會倒扣
  score -= 4; // 1 動作成本，與其他動作估值一致（cost×4）
  if (strategy.roundsLeft <= 1) score *= 0.3; // 終局換血來不及回本

  return score;
}
