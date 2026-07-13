import type { GameState, PlayerState, GameEvent, DeployedTech, ActiveContract } from './types';
import { getCard } from './cards';
import { applySkill } from './skills';
import { Rng } from './rng';

export type Action =
  | { kind: 'play-card'; player: 0 | 1; handIdx: number; targetTurbineIdx?: number; targetTechIdx?: number }
  | { kind: 'retreat'; player: 0 | 1; benchIdx: number }
  | { kind: 'promote-tech'; player: 0 | 1; benchIdx: number }
  | { kind: 'use-skill'; player: 0 | 1; targetTurbineIdx?: number }
  | { kind: 'end-turn'; player: 0 | 1 };

/** 檢查是否可以執行某動作 */
export function canPlayCard(
  state: GameState,
  playerIdx: 0 | 1,
  handIdx: number,
  targetTurbineIdx?: number,
  targetTechIdx?: number
): boolean {
  if (state.gameOver) return false;
  if (state.currentPlayer !== playerIdx) return false;

  const player = state.players[playerIdx];
  if (handIdx < 0 || handIdx >= player.hand.length) return false;

  const cardId = player.hand[handIdx];
  const card = getCard(cardId);

  // 1. 技師卡限制：每回合限出 1 張（寶可夢 TCG 支援者式節奏），場上至多 4 名（主力 1 + 備戰 3）
  if (card.type === 'tech') {
    if (player.techPlayedThisTurn) return false;
    const techCountOnField = (player.field.active ? 1 : 0) + player.field.bench.length;
    if (techCountOnField >= 4) return false;
  }

  // 2. 工具卡限制：每回合限裝備 1 張，且必須有技師在場
  if (card.type === 'tool') {
    if (player.toolPlayedThisTurn) return false;
    if (targetTechIdx === undefined) return false;
    const allTechs = getDeployedTechs(player);
    if (targetTechIdx < 0 || targetTechIdx >= allTechs.length) return false;
    const targetTech = allTechs[targetTechIdx];
    if (targetTech.attachedToolId) return false; // 該技師已有工具
  }

  // 3. 合約卡限制：每回合限 1 張
  if (card.type === 'contract') {
    if (player.contractPlayedThisTurn) return false;
  }

  // 4. 道具卡：無次數限制，但需要合法目標
  if (card.type === 'item') {
    if (card.oncePerGame && player.usedOncePerGame.includes(card.id)) return false;

    // IT01, IT02, IT04, IT05, IT06, IT08 需要指定風機
    if (['quick-repair-worst', 'temp-mw-boost', 'recover-shutdown', 'fault-shield', 'permanent-mw-boost', 'restore-avail'].includes(card.effect ?? '')) {
      if (targetTurbineIdx === undefined) return false;
      if (targetTurbineIdx < 0 || targetTurbineIdx >= player.windFarm.length) return false;
    }
  }

  return true;
}

/** 取得當前玩家場上所有存活技師列表（先主力，後備戰） */
function getDeployedTechs(player: PlayerState): DeployedTech[] {
  const list: DeployedTech[] = [];
  if (player.field.active) list.push(player.field.active);
  list.push(...player.field.bench);
  return list;
}

/** 執行動作並回傳新狀態與事件流 */
export function applyAction(
  state: GameState,
  action: Action,
  rng: Rng
): { state: GameState; events: GameEvent[] } {
  const nextState = structuredClone(state);
  const events: GameEvent[] = [];

  const playerIdx = action.player;
  const player = nextState.players[playerIdx];

  if (action.kind === 'end-turn') {
    events.push({ kind: 'turn-ended', player: playerIdx });
    return { state: nextState, events };
  }

  if (action.kind === 'retreat') {
    const active = player.field.active;
    const benchTech = player.field.bench[action.benchIdx];
    if (!active || !benchTech) {
      throw new Error('撤退無效：主力或備戰技師不存在');
    }
    if (player.retreatedThisTurn) {
      throw new Error('每回合只能撤退一次');
    }

    // 交換主力與備戰區技師
    player.field.active = benchTech;
    player.field.bench[action.benchIdx] = active;
    player.retreatedThisTurn = true;

    events.push({
      kind: 'retreat',
      player: playerIdx,
      benchIdx: action.benchIdx,
    });
    return { state: nextState, events };
  }

  if (action.kind === 'promote-tech') {
    const active = player.field.active;
    if (active) {
      throw new Error('主力區已有技師，無法直接晉升');
    }
    const benchTech = player.field.bench[action.benchIdx];
    if (!benchTech) {
      throw new Error('該備戰位置無技師');
    }

    player.field.active = benchTech;
    player.field.bench.splice(action.benchIdx, 1);

    events.push({
      kind: 'tech-promoted',
      player: playerIdx,
      cardId: benchTech.cardId,
      benchIdx: action.benchIdx,
    });
    return { state: nextState, events };
  }

  if (action.kind === 'use-skill') {
    // 執行主力技能
    applySkill(nextState, playerIdx, action.targetTurbineIdx, events, rng);
    return { state: nextState, events };
  }

  if (action.kind === 'play-card') {
    const cardId = player.hand[action.handIdx];
    const card = getCard(cardId);

    // 扣除手牌
    player.hand.splice(action.handIdx, 1);

    events.push({
      kind: 'card-played',
      player: playerIdx,
      cardId: card.id,
    });

    // 1. 技師卡部署
    if (card.type === 'tech') {
      player.techPlayedThisTurn = true;
      const newTech: DeployedTech = {
        cardId: card.id,
        level: 1,
        stamina: 10,
        maxStamina: 10,
        roundsOnField: 0,
        attachedToolId: null,
        usedSkillThisTurn: false,
      };

      if (!player.field.active) {
        player.field.active = newTech;
        events.push({
          kind: 'tech-deployed',
          player: playerIdx,
          cardId: card.id,
          position: 'active',
        });
      } else {
        player.field.bench.push(newTech);
        events.push({
          kind: 'tech-deployed',
          player: playerIdx,
          cardId: card.id,
          position: 'bench',
        });
      }
    }

    // 2. 工具卡裝備
    if (card.type === 'tool' && action.targetTechIdx !== undefined) {
      const allTechs = getDeployedTechs(player);
      const targetTech = allTechs[action.targetTechIdx];
      targetTech.attachedToolId = card.id;
      player.toolPlayedThisTurn = true;

      events.push({
        kind: 'tool-attached',
        player: playerIdx,
        toolId: card.id,
        techCardId: targetTech.cardId,
      });
    }

    // 3. 合約卡打出
    if (card.type === 'contract') {
      const newContract: ActiveContract = {
        cardId: card.id,
        player: playerIdx,
        durationLeft: card.duration ?? 1,
        multiplier: card.multiplier ?? 1.0,
      };
      player.activeContracts.push(newContract);
      player.contractPlayedThisTurn = true;

      events.push({
        kind: 'contract-played',
        player: playerIdx,
        cardId: card.id,
      });
    }

    // 4. 道具卡使用
    if (card.type === 'item') {
      if (card.oncePerGame) {
        player.usedOncePerGame.push(card.id);
      }

      const targetTurbine =
        action.targetTurbineIdx !== undefined ? player.windFarm[action.targetTurbineIdx] : null;

      if (card.effect === 'quick-repair-worst' && targetTurbine) {
        // 完全修復最嚴重的故障 (無永久損失)
        if (targetTurbine.faults.length > 0) {
          const sorted = [...targetTurbine.faults].sort((a, b) => b.drop - a.drop);
          const worst = sorted[0];
          targetTurbine.avail = Math.min(targetTurbine.originalAvail, targetTurbine.avail + worst.drop);
          targetTurbine.faults = targetTurbine.faults.filter(f => f.cardId !== worst.cardId);

          events.push({
            kind: 'fault-repaired',
            player: playerIdx,
            turbineId: targetTurbine.id,
            cardId: worst.cardId,
            quality: 'full',
          });
        }
      } else if (card.effect === 'temp-mw-boost' && targetTurbine) {
        targetTurbine.mwBonus += card.value ?? 3;
        events.push({
          kind: 'turbine-upgraded',
          player: playerIdx,
          cardId: card.id,
          bonus: card.value ?? 3,
        });
      } else if (card.effect === 'draw-cards') {
        // 抽 2 張牌
        const drawCount = card.value ?? 2;
        for (let i = 0; i < drawCount; i++) {
          if (player.deck.length > 0) {
            const drawn = player.deck.shift()!;
            player.hand.push(drawn);
            events.push({
              kind: 'card-drawn',
              player: playerIdx,
              cardId: drawn,
            });
          }
        }
      } else if (card.effect === 'recover-shutdown' && targetTurbine) {
        targetTurbine.shutdown = false;
        targetTurbine.avail = Math.max(20, targetTurbine.avail); // 恢復基本可用
        events.push({
          kind: 'turbine-restart',
          player: playerIdx,
          turbineId: targetTurbine.id,
        });
      } else if (card.effect === 'fault-shield' && targetTurbine) {
        targetTurbine.faultImmuneRounds = (card.value ?? 2) + 1; // 當前與後續回合
        events.push({
          kind: 'turbine-shielded',
          player: playerIdx,
          turbineId: targetTurbine.id,
          cardId: card.id,
          shieldCount: 1,
        });
      } else if (card.effect === 'permanent-mw-boost' && targetTurbine) {
        // 永久 MW +1
        const upgradeVal = card.value ?? 1;
        targetTurbine.mwBonus += upgradeVal;
        events.push({
          kind: 'turbine-upgraded',
          player: playerIdx,
          cardId: card.id,
          bonus: upgradeVal,
        });
      } else if (card.effect === 'all-avail-boost') {
        // 全機組可用率 +5%
        player.windFarm.forEach((t) => {
          t.avail = Math.min(t.originalAvail, t.avail + (card.value ?? 5));
        });
      } else if (card.effect === 'restore-avail' && targetTurbine) {
        // 保險理賠：將可用率與最大可用率全部回復至 100%
        targetTurbine.originalAvail = 100;
        targetTurbine.avail = 100;
        targetTurbine.shutdown = false;
        events.push({
          kind: 'turbine-restart',
          player: playerIdx,
          turbineId: targetTurbine.id,
        });
      } else if (card.effect === 'clean-all-faults') {
        // 大修排程：清除所有風機的所有故障與停機
        player.windFarm.forEach((t) => {
          t.faults = [];
          t.shutdown = false;
          t.avail = t.originalAvail;
        });
        events.push({
          kind: 'turbine-restart',
          player: playerIdx,
          turbineId: 'ALL',
        });
      }

      events.push({
        kind: 'item-played',
        player: playerIdx,
        cardId: card.id,
        targetTurbineId: targetTurbine?.id,
      });
    }
  }

  return { state: nextState, events };
}

/** 列舉所有合法動作 */
export function legalActions(state: GameState, playerIdx: 0 | 1): Action[] {
  const actions: Action[] = [];
  if (state.gameOver) return actions;
  if (state.currentPlayer !== playerIdx) return actions;

  const player = state.players[playerIdx];

  // 1. 結束回合
  actions.push({ kind: 'end-turn', player: playerIdx });

  // 2. 出手牌中的卡牌
  player.hand.forEach((cardId, handIdx) => {
    const card = getCard(cardId);

    if (card.type === 'tech') {
      if (canPlayCard(state, playerIdx, handIdx)) {
        actions.push({ kind: 'play-card', player: playerIdx, handIdx });
      }
    }

    if (card.type === 'tool') {
      const allTechs = getDeployedTechs(player);
      allTechs.forEach((_, techIdx) => {
        if (canPlayCard(state, playerIdx, handIdx, undefined, techIdx)) {
          actions.push({
            kind: 'play-card',
            player: playerIdx,
            handIdx,
            targetTechIdx: techIdx,
          });
        }
      });
    }

    if (card.type === 'contract') {
      if (canPlayCard(state, playerIdx, handIdx)) {
        actions.push({ kind: 'play-card', player: playerIdx, handIdx });
      }
    }

    if (card.type === 'item') {
      // 需要指定機組的道具
      if (['quick-repair-worst', 'temp-mw-boost', 'recover-shutdown', 'fault-shield', 'permanent-mw-boost', 'restore-avail'].includes(card.effect ?? '')) {
        player.windFarm.forEach((_, turbineIdx) => {
          if (canPlayCard(state, playerIdx, handIdx, turbineIdx)) {
            actions.push({
              kind: 'play-card',
              player: playerIdx,
              handIdx,
              targetTurbineIdx: turbineIdx,
            });
          }
        });
      } else {
        // 不需指定機組的道具
        if (canPlayCard(state, playerIdx, handIdx)) {
          actions.push({ kind: 'play-card', player: playerIdx, handIdx });
        }
      }
    }
  });

  // 3. 晉升或撤退
  const active = player.field.active;
  if (!active) {
    // 晉升備戰區任何一名技師
    player.field.bench.forEach((_, idx) => {
      actions.push({ kind: 'promote-tech', player: playerIdx, benchIdx: idx });
    });
  } else {
    // 可以撤退 (每回合限一次)
    if (!player.retreatedThisTurn) {
      player.field.bench.forEach((_, idx) => {
        actions.push({ kind: 'retreat', player: playerIdx, benchIdx: idx });
      });
    }

    // 主力技師使用技能 (如果本回合還沒出招且主力存在)
    if (!active.usedSkillThisTurn) {
      // 大浪浪高等於 4 時，如果主力不能工作，則此動作不合法
      const cardDef = getCard(active.cardId);
      const levelKey = active.level === 3 ? 'lv3' : active.level === 2 ? 'lv2' : 'lv1';
      const skill = cardDef.skills?.[levelKey];
      
      const waveHeight = state.waveHeight;
      const isWaveRestricted = waveHeight === 4 && !active.attachedToolId?.includes('TL03') && cardDef.id !== 'T08';
      
      if (!isWaveRestricted && skill) {
        if (skill.repairPower || skill.availBoost || skill.mwBoost || skill.special?.includes('prevent-fault')) {
          // 修復或提升類技能，需要指定目標機組
          player.windFarm.forEach((_, turbineIdx) => {
            actions.push({ kind: 'use-skill', player: playerIdx, targetTurbineIdx: turbineIdx });
          });
        } else {
          // 其他無目標技能
          actions.push({ kind: 'use-skill', player: playerIdx });
        }
      }
    }
  }

  return actions;
}
