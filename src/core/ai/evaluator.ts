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
import type { Card, DeployedTurbine, GameState, PlayerState } from '../types';
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

function turbineMW(t: DeployedTurbine): number {
  return (CARDS[t.cardId].stats?.mw ?? 0) + t.mwBonus;
}

function findWeakestTurbine(p: PlayerState): DeployedTurbine {
  let weakest = p.turbines[0];
  let weakestMW = turbineMW(weakest);
  for (const t of p.turbines) {
    const mw = turbineMW(t);
    if (mw < weakestMW) {
      weakestMW = mw;
      weakest = t;
    }
  }
  return weakest;
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

  // M10 no-slot：部署後不佔機組格，可疊加在 3 台上限之上——跳過「替換最弱」邏輯
  if (hasNoSlot(card.id)) {
    // 純增加 1 MW 的價值（不替換），邊際係數仍適用
    score *= Math.pow(0.75, me.turbines.length);
  } else if (me.turbines.length >= 3) {
    const weakest = findWeakestTurbine(me);
    const weakestMW = turbineMW(weakest);
    if (mw <= weakestMW) return -50; // 不值得替換
    const upgrade = (mw - weakestMW) * windCoeff * strategy.roundsLeft;
    score = upgrade * 1.5 - card.cost * 4;
  } else {
    score *= Math.pow(0.75, me.turbines.length); // 邊際遞減
  }

  // M07 aura-mw：場上每台機組 +1 MW bonus——計入全艦隊增益
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

  score -= card.cost * 4;
  if (strategy.phase === 'late') score *= 0.5;
  score *= repairMult; // 難度修復係數
  return score;
}

// ---------------- evaluateFaultPlay ----------------
export function evaluateFaultPlay(
  card: Card,
  target: DeployedTurbine,
  state: GameState,
  player: 0 | 1,
  strategy: Strategy,
  difficulty: Difficulty = 'hard',
): number {
  const { attackMult, targetHighestMW } = getDifficultyMultipliers(difficulty);
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

  if (card.cascade && opp.turbines.length > 1) {
    const others = opp.turbines.filter((t) => t !== target);
    if (others.length > 0) {
      const avgOtherMW = others.reduce((s, t) => s + turbineMW(t), 0) / others.length;
      const cascadeDamage = avgOtherMW * AI_AVG_WIND_COEFF * (drop / 200) * rounds;
      score += cascadeDamage * card.cascade * 1.5;
    }
  }

  if (card.spreading) score += 6;
  if (target.faults.length > 0) score *= Math.pow(0.6, target.faults.length); // 同目標疊故障邊際遞減
  score -= card.cost * 4;
  if (strategy.phase === 'early') score *= 0.7;
  if (strategy.phase === 'late') score *= 1.3;
  if (strategy.position === 'losing') score *= 1.4;
  if (strategy.position === 'winning') score *= 0.85;
  // Hard 專屬：目標是對手最高 MW 機組時額外加分（讓 Hard AI 更有针對性）
  if (targetHighestMW && opp.turbines.length > 0) {
    const maxMW = Math.max(...opp.turbines.map(turbineMW));
    if (turbineMW(target) === maxMW) score += 10;
  }
  score *= attackMult; // 難度攻擊係數
  return score;
}

// ---------------- evaluateFuncPlay ----------------
export function evaluateFuncPlay(card: Card, state: GameState, player: 0 | 1, strategy: Strategy): number {
  const me = state.players[player];
  let score = 0;

  switch (card.effect) {
    case 'returnTurbine': {
      if (me.turbines.length === 0) return -1000;
      const weakest = findWeakestTurbine(me);
      const weakestMW = turbineMW(weakest);
      const biggerInHand = me.hand.some((cId) => {
        const c = CARDS[cId];
        return c.type === 'turbine' && (c.stats?.mw ?? 0) > weakestMW;
      });
      if (me.turbines.length >= 3 && biggerInHand) score = 25 + (8 - weakestMW) * 2;
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
      // FN07/FN08 屬 B 區，無原型基準；S2.4 不評估，分數 0 仍可被 hard 選為次優之選
      break;
  }
  return score;
}
