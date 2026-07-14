import type { GameState, Card, DeployedTech, DeployedTurbine, Difficulty } from '../types';
import type { Strategy } from './strategy';
import { CARDS } from '../cards';

export const RESERVE_THRESHOLD = -10;
export const AI_AVG_WIND_COEFF = 0.65;

export interface DifficultyMultipliers {
  readonly repairMult: number;
  readonly playMult: number;
}

export function getDifficultyMultipliers(difficulty: Difficulty): DifficultyMultipliers {
  switch (difficulty) {
    case 'easy':
      return { repairMult: 0.5, playMult: 0.6 };
    case 'medium':
      return { repairMult: 1.0, playMult: 1.0 };
    case 'hard':
      return { repairMult: 1.3, playMult: 1.2 };
    default:
      return { repairMult: 1.0, playMult: 1.0 };
  }
}

/** 評估部署技師 */
export function evaluateTechPlay(
  card: Card,
  state: GameState,
  playerIdx: 0 | 1,
  strategy: Strategy,
  difficulty: Difficulty
): number {
  void strategy;
  const { playMult } = getDifficultyMultipliers(difficulty);
  const player = state.players[playerIdx];

  let score = 10; // 基礎值

  // 1. 如果主力為空，部署技師價值極高
  if (!player.field.active) {
    score += 25;
  }

  // 2. 如果場上有故障，且技師專長匹配，加分
  const faultsOnFarm = player.windFarm.flatMap((t) => t.faults);
  const matchCount = faultsOnFarm.filter((f) => f.faultCategory === card.specialty).length;
  score += matchCount * 12;

  // 3. 通用高稀有度技師加分
  if (card.legendary) {
    score += 15;
  }

  // 4. 重複技師扣分 (避免場上都部署一樣的技師，增加專長多樣性)
  const deployedIds = [
    player.field.active?.cardId,
    ...player.field.bench.map((t) => t.cardId),
  ].filter(Boolean);
  if (deployedIds.includes(card.id)) {
    score -= 15;
  }

  return score * playMult;
}

/** 評估裝備工具 */
export function evaluateToolPlay(
  card: Card,
  targetTech: DeployedTech,
  state: GameState,
  playerIdx: 0 | 1,
  difficulty: Difficulty
): number {
  const { playMult } = getDifficultyMultipliers(difficulty);
  let score = 8; // 基礎值

  // TL08 大師認證給極高分
  if (card.effect === 'master-cert') {
    score += 18;
  }

  // 根據環境狀況加分
  if (card.effect === 'wave-immune' && state.waveHeight >= 3) {
    score += 12;
  }
  if (card.effect === 'wind-immune' && state.wind.speed >= 20) {
    score += 12;
  }

  // 給主力裝備比備戰區高分
  const player = state.players[playerIdx];
  if (player.field.active && player.field.active.cardId === targetTech.cardId) {
    score += 5;
  }

  return score * playMult;
}

/** 評估使用道具 */
export function evaluateItemPlay(
  card: Card,
  targetTurbine: DeployedTurbine | null,
  state: GameState,
  playerIdx: 0 | 1,
  strategy: Strategy,
  difficulty: Difficulty,
  targetTech: DeployedTech | null = null
): number {
  const { playMult } = getDifficultyMultipliers(difficulty);
  let score = 5;

  if (card.effect === 'quick-repair-worst' && targetTurbine) {
    if (targetTurbine.faults.length > 0) {
      const maxDrop = Math.max(...targetTurbine.faults.map((f) => f.drop));
      score += maxDrop * 1.5;
    } else {
      return -50; // 沒有故障不需要使用
    }
  } else if (card.effect === 'temp-mw-boost' && targetTurbine) {
    score += (card.value ?? 3) * AI_AVG_WIND_COEFF * 2;
  } else if (card.effect === 'draw-cards') {
    score += 10;
  } else if (card.effect === 'recover-shutdown' && targetTurbine) {
    if (targetTurbine.shutdown) {
      score += 40;
    } else {
      // 次效（吊裝保養 +10% avail）：依實際可回復量計，滿血則不值得
      const healable = Math.min(10, targetTurbine.originalAvail - targetTurbine.avail);
      if (healable <= 2) return -50;
      score += healable * 1.1;
    }
  } else if (card.effect === 'fault-shield' && targetTurbine) {
    score += strategy.roundsLeft > 3 ? 12 : 3;
  } else if (card.effect === 'permanent-mw-boost' && targetTurbine) {
    score += (card.value ?? 1) * AI_AVG_WIND_COEFF * strategy.roundsLeft * 1.5;
  } else if (card.effect === 'all-avail-boost') {
    const player = state.players[playerIdx];
    const totalAvailLoss = player.windFarm.reduce((sum, t) => sum + (t.originalAvail - t.avail), 0);
    score += Math.min(25, totalAvailLoss * 0.8);
  } else if (card.effect === 'restore-avail' && targetTurbine) {
    const loss = 100 - targetTurbine.avail;
    score += loss * 1.2;
  } else if (card.effect === 'clean-all-faults') {
    const player = state.players[playerIdx];
    const totalFaults = player.windFarm.flatMap((t) => t.faults).length;
    score += totalFaults * 15;
  } else if (card.effect === 'restore-stamina' || card.effect === 'restore-stamina-big') {
    // 補血：目標技師疲勞缺口越大越值得（實際回復量 = min(value, 缺口)）
    if (targetTech) {
      const gap = targetTech.maxStamina - targetTech.stamina;
      const healed = Math.min(card.value ?? 5, gap);
      if (healed <= 1) return -50; // 幾乎滿血不浪費
      score += healed * 2.2;
      // 主力瀕臨力竭（≤4）時救場價值極高
      const player = state.players[playerIdx];
      if (player.field.active?.cardId === targetTech.cardId && targetTech.stamina <= 4) score += 12;
    } else {
      return -50;
    }
  } else if (card.effect === 'restore-stamina-all') {
    // 全隊補給：按全隊實際可回復量計
    const player = state.players[playerIdx];
    const squad = [player.field.active, ...player.field.bench].filter((x): x is DeployedTech => x !== null);
    const totalHealed = squad.reduce((sum, x) => sum + Math.min(card.value ?? 3, x.maxStamina - x.stamina), 0);
    if (totalHealed <= 2) return -50;
    score += totalHealed * 1.8;
  } else if (card.effect === 'stamina-shield') {
    // 護盾：疲勞越低越值得保（省下的是即將發生的消耗）
    if (targetTech) {
      score += targetTech.stamina <= 6 ? 14 : 6;
    } else {
      return -50;
    }
  }

  return score * playMult;
}

/** 評估打出合約 */
export function evaluateContractPlay(
  card: Card,
  state: GameState,
  strategy: Strategy,
  difficulty: Difficulty
): number {
  void card;
  void state;
  const { playMult } = getDifficultyMultipliers(difficulty);
  let score = 10;

  if (strategy.phase === 'late') {
    // 終局不需要簽合約
    score -= 15;
  }

  return score * playMult;
}

/** 評估晉升備戰區技師 */
export function evaluatePromote(
  tech: DeployedTech,
  state: GameState,
  playerIdx: 0 | 1
): number {
  let score = 10;
  
  // 挑選 stamina 較高且有匹配故障專長的技師晉升
  const player = state.players[playerIdx];
  const faults = player.windFarm.flatMap((t) => t.faults);
  const card = CARDS[tech.cardId];
  if (card && card.specialty && faults.some((f) => f.faultCategory === card.specialty)) {
    score += 15;
  }
  score += tech.stamina;

  return score;
}

/** 評估撤退/更換主力 */
export function evaluateRetreat(
  active: DeployedTech,
  bench: DeployedTech,
  state: GameState,
  playerIdx: 0 | 1
): number {
  let score = 0;

  // 1. 如果主力耐久度極低，強制換人下場休息
  if (active.stamina <= 3) {
    score += 30;
  }

  // 2. 如果備戰區的技師專長更匹配當前的故障
  const player = state.players[playerIdx];
  const faults = player.windFarm.flatMap((t) => t.faults);
  const benchCard = CARDS[bench.cardId];
  const activeCard = CARDS[active.cardId];

  if (benchCard && benchCard.specialty && faults.some((f) => f.faultCategory === benchCard.specialty)) {
    score += 15;
  }
  if (activeCard && activeCard.specialty && faults.some((f) => f.faultCategory === activeCard.specialty)) {
    score -= 10; // 主力已經匹配，不急著撤退
  }

  return score;
}

/** 評估使用技師技能 */
export function evaluateSkill(
  tech: DeployedTech,
  targetTurbine: DeployedTurbine | null,
  state: GameState,
  playerIdx: 0 | 1,
  strategy: Strategy,
  difficulty: Difficulty
): number {
  void playerIdx;
  const { repairMult } = getDifficultyMultipliers(difficulty);
  const card = CARDS[tech.cardId];
  const levelKey = tech.level === 3 ? 'lv3' : tech.level === 2 ? 'lv2' : 'lv1';
  const skill = card.skills?.[levelKey];

  if (!skill) return -100;

  let score = 10; // 技能基礎使用分

  if (skill.repairPower && targetTurbine) {
    if (targetTurbine.faults.length > 0) {
      const sorted = [...targetTurbine.faults].sort((a, b) => b.drop - a.drop);
      const worst = sorted[0];
      
      let isMatch = false;
      if (skill.specialtyMatchesOnly === false || card.specialty === worst.faultCategory) {
        isMatch = true;
      }
      
      let repairVal = skill.repairPower;
      if (isMatch) {
        repairVal = Math.floor(repairVal * 1.5);
      } else {
        repairVal = Math.floor(repairVal * 0.7);
      }

      // 限制條件評估
      if (state.waveHeight === 4 && card.id !== 'T08' && !tech.attachedToolId?.includes('TL03')) {
        return -100; // 海上受阻不能工作
      }

      const actualRepair = Math.min(worst.drop, repairVal);
      score += actualRepair * 1.5;

      // 專長匹配加分
      if (isMatch) {
        score += 8;
      } else {
        score -= 5; // 專長不匹配會造成永久損害，扣分
      }
    } else {
      return -20; // 無故障不使用修復
    }
  }

  if (skill.availBoost && targetTurbine) {
    const gain = Math.min(skill.availBoost, targetTurbine.originalAvail - targetTurbine.avail);
    score += gain * 1.2;
  }

  if (skill.mwBoost && targetTurbine) {
    score += skill.mwBoost * AI_AVG_WIND_COEFF * strategy.roundsLeft * 1.5;
  }

  if (skill.special) {
    if (skill.special.includes('predict')) {
      score += 8;
    }
    if (skill.special.includes('draw-item')) {
      score += 8;
    }
    if (skill.special.includes('prevent-fault')) {
      score += 10;
    }
  }

  return score * repairMult;
}
