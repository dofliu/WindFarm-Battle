import type { PlayerState, DeployedTech, GameEvent, GameState } from './types';
import { CARDS, getCard } from './cards';
import { rollWind } from './environment';
import { Rng } from './rng';

/** 檢查技師是否對浪高免疫 */
export function hasWaveImmunity(tech: DeployedTech): boolean {
  const card = CARDS[tech.cardId];
  if (card.abilities && card.abilities.some((a) => a.tag === 'wave-immune')) {
    return true;
  }
  if (tech.attachedToolId) {
    const tool = CARDS[tech.attachedToolId];
    if (tool.effect === 'wave-immune' || tool.effect === 'master-cert') {
      return true;
    }
  }
  return false;
}

/** 檢查技師是否對強風免疫 */
export function hasWindImmunity(tech: DeployedTech): boolean {
  if (tech.attachedToolId) {
    const tool = CARDS[tech.attachedToolId];
    if (tool.effect === 'wind-immune' || tool.effect === 'master-cert') {
      return true;
    }
  }
  return false;
}

/** 執行主力技師的技能 */
export function applySkill(
  state: GameState,
  playerIdx: 0 | 1,
  targetTurbineIdx: number | undefined,
  events: GameEvent[],
  rng: Rng
): void {
  const player = state.players[playerIdx];
  const tech = player.field.active;
  if (!tech) {
    throw new Error('場上沒有主力技師，無法使用技能');
  }

  const card = getCard(tech.cardId);
  const levelKey = tech.level === 3 ? 'lv3' : tech.level === 2 ? 'lv2' : 'lv1';
  const skill = card.skills?.[levelKey];

  if (!skill) {
    throw new Error(`該技師等級 ${tech.level} 沒有對應的技能`);
  }

  // 1. 大浪限制：浪高等於 4 時，除了有波浪免疫的技師/工具外，無法工作
  if (state.waveHeight === 4 && !hasWaveImmunity(tech)) {
    throw new Error('大浪限制！海上交通受阻，技師無法執行任務（需要防浪裝備或水下專長）');
  }

  // 標記本回合已使用技能
  tech.usedSkillThisTurn = true;
  events.push({
    kind: 'skill-used',
    player: playerIdx,
    techId: tech.cardId,
    skillTag: skill.tag,
    turbineId: targetTurbineIdx !== undefined ? player.windFarm[targetTurbineIdx].id : undefined,
  });

  // 2. 處理特定技能效果
  const targetTurbine = targetTurbineIdx !== undefined ? player.windFarm[targetTurbineIdx] : null;

  // 2A. 處理修復類技能
  if (skill.repairPower && targetTurbine) {
    const basePower = skill.repairPower;
    
    // 如果有故障，挑選最嚴重的故障 (drop 最高)
    if (targetTurbine.faults.length > 0) {
      // 依 drop 降序排序，選第一個
      const sortedFaults = [...targetTurbine.faults].sort((a, b) => b.drop - a.drop);
      const targetFault = sortedFaults[0];
      
      // 計算實際修復力 (power)
      let power = basePower;
      
      // 判斷是否專長匹配
      let isMatch = false;
      if (skill.specialtyMatchesOnly === false) {
        isMatch = true; // 免除專長懲罰 (例如 T15 首席工程師)
      } else if (card.specialty && card.specialty === targetFault.faultCategory) {
        isMatch = true;
      }

      if (isMatch) {
        power = Math.floor(power * 1.5);
      } else {
        power = Math.floor(power * 0.7);
      }

      // 檢查工具加成
      if (tech.attachedToolId) {
        const tool = CARDS[tech.attachedToolId];
        if (tool.effect === 'repair-boost' || tool.effect === 'master-cert') {
          power += tool.value ?? 2;
        }
      }

      // 浪高環境修損：中浪 (waveHeight >= 3) 且無波浪免疫 -> 效率減半
      if (state.waveHeight >= 3 && !hasWaveImmunity(tech)) {
        power = Math.floor(power * 0.5);
      }

      // 風速限制：強風 (wind.speed >= 20) 且專長是 blade 且無強風免疫 -> 效率減半
      if (state.wind.speed >= 20 && card.specialty === 'blade' && !hasWindImmunity(tech)) {
        power = Math.floor(power * 0.5);
      }

      power = Math.max(1, power);

      // 執行修復與永久損失計算
      let repairedAvail = 0;
      if (power >= targetFault.drop) {
        repairedAvail = targetFault.drop;
        // 移除該故障
        targetTurbine.faults = targetTurbine.faults.filter(f => f.cardId !== targetFault.cardId);
      } else {
        repairedAvail = power;
        // 部分修復，更新故障的 drop
        const updatedFault = {
          ...targetFault,
          drop: targetFault.drop - power
        };
        targetTurbine.faults = targetTurbine.faults.map(f => f.cardId === targetFault.cardId ? updatedFault : f);
      }

      // 計算永久損失：如果不匹配，永久損失為修復量的 50%
      let permanentLoss = 0;
      if (!isMatch) {
        permanentLoss = Math.floor(repairedAvail * 0.5);
      }

      targetTurbine.originalAvail = Math.max(10, targetTurbine.originalAvail - permanentLoss);
      targetTurbine.avail = Math.min(
        targetTurbine.originalAvail,
        targetTurbine.avail + repairedAvail - permanentLoss
      );

      // 解除停機 (若可用率回升至 20% 以上且無嚴重故障)
      if (targetTurbine.shutdown && targetTurbine.avail >= 20) {
        targetTurbine.shutdown = false;
        events.push({
          kind: 'turbine-restart',
          player: playerIdx,
          turbineId: targetTurbine.id,
        });
      }

      events.push({
        kind: 'fault-repaired',
        player: playerIdx,
        turbineId: targetTurbine.id,
        cardId: targetFault.cardId,
        byTechCardId: tech.cardId,
        quality: isMatch ? 'full' : 'partial',
        availLost: permanentLoss > 0 ? permanentLoss : undefined,
      });
    }
  }

  // 2B. 處理其他特殊技能效果
  if (skill.availBoost && targetTurbine) {
    // 直接提升可用率
    targetTurbine.avail = Math.min(targetTurbine.originalAvail, targetTurbine.avail + skill.availBoost);
  }

  if (skill.mwBoost && targetTurbine) {
    // 提升發電機 MW (永久)
    targetTurbine.mwBonus += skill.mwBoost;
    events.push({
      kind: 'turbine-upgraded',
      player: playerIdx,
      cardId: tech.cardId,
      bonus: skill.mwBoost,
    });
  }

  // 檢查特別的效果 tag (如 predict-wind, draw-item)
  const special: string | undefined = skill.special;
  if (special) {
    if (special === 'predict-wind') {
      // 預見下一回合的風速
      const nextWind = rollWind(rng);
      events.push({
        kind: 'predict-wind',
        player: playerIdx,
        labels: [nextWind.label],
      });
    } else if (special === 'predict-all') {
      // 預見未來三回合的風速
      const nextWinds = [rollWind(rng), rollWind(rng), rollWind(rng)];
      events.push({
        kind: 'predict-wind',
        player: playerIdx,
        labels: nextWinds.map(w => w.label),
      });
    } else if (special === 'all-turbines-diag') {
      // 全機組診斷：對其他機組也進行微小修復 (+2%)
      player.windFarm.forEach((turbine, idx) => {
        if (idx !== targetTurbineIdx) {
          turbine.avail = Math.min(turbine.originalAvail, turbine.avail + 2);
        }
      });
    } else if (special === 'block-next-fault' && targetTurbine) {
      // 免疫下一回合的故障
      targetTurbine.faultImmuneRounds = 2; // 當前與下一回合
      events.push({
        kind: 'turbine-shielded',
        player: playerIdx,
        turbineId: targetTurbine.id,
        cardId: tech.cardId,
        shieldCount: 1,
      });
    } else if (special === 'draw-item') {
      // 抽取 1 張道具卡
      drawCardByType(player, playerIdx, 'item', 1, events);
    } else if (special === 'draw-item-double') {
      // 抽取 2 張道具卡
      drawCardByType(player, playerIdx, 'item', 2, events);
    } else if (special.startsWith('prevent-fault') && targetTurbine) {
      // 設置故障免疫 rounds
      targetTurbine.faultImmuneRounds = 2;
      events.push({
        kind: 'turbine-shielded',
        player: playerIdx,
        turbineId: targetTurbine.id,
        cardId: tech.cardId,
        shieldCount: 1,
      });
    } else if (special.startsWith('self-recharge-')) {
      // 老練節能（T01 Lv3）：出招後自回疲勞——資深維修工懂得保存體力
      const n = parseInt(special.slice('self-recharge-'.length), 10) || 3;
      const amount = Math.min(n, tech.maxStamina - tech.stamina);
      if (amount > 0) {
        tech.stamina += amount;
        events.push({ kind: 'stamina-restored', player: playerIdx, techId: tech.cardId, amount });
      }
    } else if (special.startsWith('team-recharge-')) {
      // 團隊照護（T12 風場經理 Lv3）：全隊回復疲勞——經理的價值是讓團隊走得遠
      const n = parseInt(special.slice('team-recharge-'.length), 10) || 2;
      const squad = [player.field.active, ...player.field.bench].filter((x): x is DeployedTech => x !== null);
      for (const mate of squad) {
        const amount = Math.min(n, mate.maxStamina - mate.stamina);
        if (amount > 0) {
          mate.stamina += amount;
          events.push({ kind: 'stamina-restored', player: playerIdx, techId: mate.cardId, amount });
        }
      }
    } else if (special.startsWith('overdrive-')) {
      // 過載重構（T15 總工程師 Lv3）：risk/reward——修復力已在技能數值反映，代價是額外疲勞
      const extra = parseInt(special.slice('overdrive-'.length), 10) || 4;
      tech.stamina -= extra;
    }
  }

  // 2C. 處理葉片重建等特殊技能中帶有的 originalAvail 恢復
  if (skill.tag === 'blade-rebuild' || skill.tag === 'shaft-rebuild' || skill.tag === 'sys-reset' || skill.tag === 'pipe-rebuild') {
    if (targetTurbine) {
      targetTurbine.originalAvail = Math.min(100, targetTurbine.originalAvail + 2);
      targetTurbine.avail = Math.min(targetTurbine.originalAvail, targetTurbine.avail + 2);
    }
  }
}

/** 從牌庫中抽取指定類型的卡牌 */
function drawCardByType(
  player: PlayerState,
  playerIdx: 0 | 1,
  type: string,
  count: number,
  events: GameEvent[]
): void {
  let drawn = 0;
  const newDeck: string[] = [];
  
  for (const cardId of player.deck) {
    if (drawn < count && CARDS[cardId].type === type) {
      player.hand.push(cardId);
      events.push({
        kind: 'card-drawn',
        player: playerIdx,
        cardId: cardId,
      });
      drawn++;
    } else {
      newDeck.push(cardId);
    }
  }
  player.deck = newDeck;
}
