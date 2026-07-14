import type { PlayerState, DeployedTech, GameEvent } from './types';
import { CARDS } from './cards';

/** 計算某技師本回合技能的實際耐久消耗 */
export function getEffectiveSkillCost(tech: DeployedTech): number {
  const card = CARDS[tech.cardId];
  const levelKey = tech.level === 3 ? 'lv3' : tech.level === 2 ? 'lv2' : 'lv1';
  const baseCost = card.skills?.[levelKey].staminaCost ?? 5;

  let costReduction = 0;

  // 1. 檢查裝備的工具
  if (tech.attachedToolId) {
    const tool = CARDS[tech.attachedToolId];
    if (tool.effect === 'stamina-save') {
      costReduction += tool.value ?? 1;
    }
  }

  // 2. 確保消耗不小於 1
  return Math.max(1, baseCost - costReduction);
}

/** TL10 智慧監測手環：每回合結算後自動回充（消耗結算之後、力竭判定之前） */
function _applyAutoRecharge(tech: DeployedTech, playerIdx: 0 | 1, events: GameEvent[]): void {
  if (!tech.attachedToolId) return;
  const tool = CARDS[tech.attachedToolId];
  if (tool.effect !== 'auto-recharge') return;
  const amount = Math.min(tool.value ?? 1, tech.maxStamina - tech.stamina);
  if (amount <= 0 || tech.stamina <= 0) return; // 已力竭者不救（避免免死金牌）
  tech.stamina += amount;
  events.push({ kind: 'stamina-restored', player: playerIdx, techId: tech.cardId, amount });
}

/** 結算玩家場上所有技師的耐久消耗 */
export function tickStamina(
  player: PlayerState,
  playerIdx: 0 | 1,
  events: GameEvent[]
): void {
  const { active, bench } = player.field;

  // 判斷 T14 運維總監是否在場 (主力或備戰區) 提供全域消耗減免
  let globalStaminaSave = 0;
  const isT14Present =
    active?.cardId === 'T14' || bench.some((t) => t.cardId === 'T14');
  if (isT14Present) {
    const t14Card = CARDS['T14'];
    const ability = t14Card.abilities.find((a) => a.tag === 'global-stamina-save');
    globalStaminaSave += ability?.value ?? 1;
  }

  // 1. 主力技師結算
  if (active) {
    if ((active.staminaShieldRounds ?? 0) > 0) {
      // IT13 安全講習：本回合免疲勞消耗
      active.staminaShieldRounds = (active.staminaShieldRounds ?? 0) - 1;
    } else {
      let cost = 3; // 預設一般檢修 -3
      if (active.usedSkillThisTurn) {
        cost = getEffectiveSkillCost(active); // 使用技能
      }

      // 檢查主力是否裝備 TL08 大師認證 (每回合消耗 -2)
      if (active.attachedToolId) {
        const tool = CARDS[active.attachedToolId];
        if (tool.effect === 'master-cert') {
          cost -= tool.value ?? 2;
        }
      }

      // 應用 T14 全域減免
      cost = Math.max(1, cost - globalStaminaSave);
      active.stamina -= cost;
    }

    _applyAutoRecharge(active, playerIdx, events);
    // 重置技能標記
    active.usedSkillThisTurn = false;
  }

  // 2. 備戰區技師結算
  for (const tech of bench) {
    if ((tech.staminaShieldRounds ?? 0) > 0) {
      tech.staminaShieldRounds = (tech.staminaShieldRounds ?? 0) - 1;
    } else {
      let cost = 3; // 備戰區例行巡檢 -3

      // 檢查是否裝備 TL08 大師認證
      if (tech.attachedToolId) {
        const tool = CARDS[tech.attachedToolId];
        if (tool.effect === 'master-cert') {
          cost -= tool.value ?? 2;
        }
      }

      cost = Math.max(1, cost - globalStaminaSave);
      tech.stamina -= cost;
    }
    _applyAutoRecharge(tech, playerIdx, events);
    tech.usedSkillThisTurn = false;
  }

  // 3. 處理力竭下場 (stamina <= 0)
  if (active && active.stamina <= 0) {
    events.push({
      kind: 'stamina-depleted',
      player: playerIdx,
      techId: active.cardId,
    });
    player.retired.push(active.cardId);
    player.field.active = null;
  }

  const remainingBench: DeployedTech[] = [];
  for (const tech of bench) {
    if (tech.stamina <= 0) {
      events.push({
        kind: 'stamina-depleted',
        player: playerIdx,
        techId: tech.cardId,
      });
      player.retired.push(tech.cardId);
    } else {
      remainingBench.push(tech);
    }
  }
  player.field.bench = remainingBench;
}

/** 檢查並執行技師的升級/進化 */
export function tickEvolution(
  player: PlayerState,
  playerIdx: 0 | 1,
  events: GameEvent[]
): void {
  const { active, bench } = player.field;
  const allTechs = [active, ...bench].filter((t): t is DeployedTech => t !== null);

  for (const tech of allTechs) {
    tech.roundsOnField += 1;
    const oldLevel = tech.level;

    if (tech.roundsOnField === 3 && oldLevel === 1) {
      // 升級至 Lv.2 高級
      const damage = tech.maxStamina - tech.stamina;
      tech.level = 2;
      tech.maxStamina = 15;
      tech.stamina = Math.max(1, tech.maxStamina - damage);
      events.push({
        kind: 'tech-evolved',
        player: playerIdx,
        techId: tech.cardId,
        level: 2,
      });
    } else if (tech.roundsOnField === 6 && oldLevel === 2) {
      // 升級至 Lv.3 資深
      const damage = tech.maxStamina - tech.stamina;
      tech.level = 3;
      tech.maxStamina = 20;
      tech.stamina = Math.max(1, tech.maxStamina - damage);
      events.push({
        kind: 'tech-evolved',
        player: playerIdx,
        techId: tech.cardId,
        level: 3,
      });
    }
  }
}
