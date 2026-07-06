// ============================================================
// AI 出牌迴圈（對齊 v3 generateActions + aiChoose + doAITurn）。
//   - generateActions：對手牌每張呼叫對應 evaluator；fault 對每個對手機組各產生一個動作。
//   - aiChoose：策略 + 候選 + pickByDifficulty。
//   - aiTakeTurn：返回 runGame 用的 TakeTurn；while actionsLeft>0 → aiChoose →
//     score < RESERVE_THRESHOLD 視為保留行動；否則 _applyActionMutate 直接套用。
// 注意：本檔依設計直接 mutate 工作副本（透過 _applyActionMutate），與其他 core 純函式
// 不同；這是 takeTurn 設計的必要妥協（runGame 不便對每張卡 clone 一次）。
// ============================================================
import type { GameState, Difficulty } from '../types';
import type { Rng } from '../rng';
import type { GameEvent } from '../events';
import { CARDS } from '../cards';
import { canPlayCard, _applyActionMutate } from '../actions';
import { type RulesConfig, DEFAULT_CONFIG, type TakeTurn, techSkill } from '../rules-engine';
import { getStrategy, type Strategy } from './strategy';
import {
  evaluateTurbinePlay,
  evaluateTechPlay,
  evaluateFaultPlay,
  evaluateFuncPlay,
  evaluateSkillPlay,
  evaluateResourceGrab,
  RESERVE_THRESHOLD,
} from './evaluator';
import {
  type ScoredAction,
  type AIChoice,
  pickByDifficulty,
} from './difficulty';

/** 對齊 v3 generateActions：對所有合法手牌產生候選動作。 */
export function generateActions(
  state: GameState,
  player: 0 | 1,
  difficulty: Difficulty = 'hard',
): { actions: ScoredAction[]; strategy: Strategy } {
  const me = state.players[player];
  const opp = state.players[1 - player];
  const strategy = getStrategy(state, player);
  const actions: ScoredAction[] = [];

  for (let i = 0; i < me.hand.length; i++) {
    if (!canPlayCard(state, player, i)) continue;
    const cardId = me.hand[i];
    const card = CARDS[cardId];
    if (card.type === 'turbine') {
      actions.push({
        action: { kind: 'play-card', player, handIdx: i },
        score: evaluateTurbinePlay(card, state, player, strategy, difficulty),
        desc: me.turbines.length >= 3 ? `${cardId}（替換）` : `部署 ${cardId}`,
      });
    } else if (card.type === 'tech') {
      actions.push({
        action: { kind: 'play-card', player, handIdx: i },
        score: evaluateTechPlay(card, state, player, strategy, difficulty),
        desc: `派遣 ${cardId}`,
      });
    } else if (card.type === 'fault') {
      for (let t = 0; t < opp.turbines.length; t++) {
        actions.push({
          action: { kind: 'play-card', player, handIdx: i, target: t },
          score: evaluateFaultPlay(card, opp.turbines[t], state, player, strategy, difficulty),
          desc: `${cardId} → 對手機組#${t}`,
        });
      }
    } else if (card.type === 'func') {
      actions.push({
        action: { kind: 'play-card', player, handIdx: i },
        score: evaluateFuncPlay(card, state, player, strategy),
        desc: `${cardId}`,
      });
    } else if (card.type === 'weather') {
      // S3.6：weather 卡用簡化估計分數。AI 看見 wind-boost/mwh-double 給高分；
      // shutdown-all 視為「對自己也有害」給低分；wind-penalty 看局勢（落後時加分）。
      const tags = card.abilities.map((a) => a.tag);
      let score = -card.cost * 4;
      if (tags.includes('wind-boost') || tags.includes('mwh-double')) score += 18;
      if (tags.includes('wind-penalty')) score += strategy.position === 'losing' ? 8 : -3;
      if (tags.includes('shutdown-all')) score += strategy.position === 'losing' ? 15 : -10;
      actions.push({
        action: { kind: 'play-card', player, handIdx: i },
        score,
        desc: `🌬️ ${cardId}`,
      });
    } else if (card.type === 'contract') {
      // S3.7：合約卡 cost=0，價值 = reward × 達成機率估計。AI 簡化：reward 折半當作期望值；
      // 落後時略加碼，因為合約是逆風時的彎道超車手段。
      const reward = card.target?.reward ?? 0;
      let score = reward * 0.5 - card.cost * 4;
      if (strategy.position === 'losing') score += 5;
      if (strategy.phase === 'late') score *= 0.4; // 終局簽合約來不及達成
      actions.push({
        action: { kind: 'play-card', player, handIdx: i },
        score,
        desc: `📋 ${cardId}`,
      });
    }
  }

  // P2：技師專屬招式候選——依招式目標種類產生（無目標一個候選；有目標每台機組一個）
  for (const techId of me.techs) {
    if (me.usedSkillThisRound.includes(techId)) continue;
    const { targetKind } = techSkill(techId);
    if (targetKind === 'none') {
      actions.push({
        action: { kind: 'use-skill', player, techId },
        score: evaluateSkillPlay(techId, undefined, state, player, strategy, difficulty),
        desc: `${techId} 出招`,
      });
    } else {
      for (let ti = 0; ti < me.turbines.length; ti++) {
        const tu = me.turbines[ti];
        if (targetKind === 'ownFault' && tu.faults.length === 0) continue;
        actions.push({
          action: { kind: 'use-skill', player, techId, turbineIdx: ti },
          score: evaluateSkillPlay(techId, tu, state, player, strategy, difficulty),
          desc: `${techId} 出招 → 機組#${ti}`,
        });
      }
    }
  }

  // R3：搶共享資源候選（需 ≥1 動作）
  if (state.actionsLeft >= 1) {
    for (const res of state.roundResources) {
      if (res.claimedBy !== undefined) continue;
      if (res.type === 'grid-priority') {
        actions.push({
          action: { kind: 'grab-resource', player, resourceId: res.id },
          score: evaluateResourceGrab('grid-priority', undefined, state, player, strategy, difficulty),
          desc: `搶 併網優先`,
        });
      } else {
        for (let ti = 0; ti < me.turbines.length; ti++) {
          if (me.turbines[ti].faults.length === 0) continue;
          actions.push({
            action: { kind: 'grab-resource', player, resourceId: res.id, turbineIdx: ti },
            score: evaluateResourceGrab(res.type, me.turbines[ti], state, player, strategy, difficulty),
            desc: `搶 ${res.type} → 機組#${ti}`,
          });
        }
      }
    }
  }

  return { actions, strategy };
}

/** 對齊 v3 aiChoose：依難度選一個候選動作。無候選時回 null。 */
export function aiChoose(
  state: GameState,
  player: 0 | 1,
  difficulty: Difficulty,
  rng: Rng,
): AIChoice | null {
  const { actions, strategy } = generateActions(state, player, difficulty);
  if (actions.length === 0) return null;
  const chosen = pickByDifficulty(actions, difficulty, rng);
  if (!chosen) return null;
  return { chosen, considered: actions, strategy };
}

/**
 * 對齊 v3 doAITurn：把整個玩家回合包成 TakeTurn（runGame 接此 factory）。
 * 終止條件：actionsLeft<=0 / 無合法動作 / 最佳 score < RESERVE_THRESHOLD（保留行動）。
 */
export function aiTakeTurn(difficulty: Difficulty, config: RulesConfig = DEFAULT_CONFIG): TakeTurn {
  return (state: GameState, player: 0 | 1, rng: Rng): GameEvent[] => {
    const events: GameEvent[] = [];
    // 安全網：出牌受 actionsLeft 限制、出招受「每技師每回合一次」限制 → 有限步數；仍設上限避免異常 ability 拖死。
    // 輕模式後技師出招不消耗 actionsLeft，故迴圈條件改為「有進展就繼續」，不再只看 actionsLeft。
    const HARD_CAP = 30;
    let steps = 0;
    while (!state.gameOver && steps++ < HARD_CAP) {
      const choice = aiChoose(state, player, difficulty, rng);
      if (!choice || choice.chosen.score < RESERVE_THRESHOLD) break;
      const beforeActions = state.actionsLeft;
      const beforeSkills = state.players[player].usedSkillThisRound.length;
      events.push(..._applyActionMutate(state, choice.chosen.action, rng, config));
      // 進展判定：出牌消耗 actionsLeft，或技師出招使 usedSkillThisRound 增加。皆無 → 跳出避免死迴圈。
      const progressed =
        state.actionsLeft < beforeActions ||
        state.players[player].usedSkillThisRound.length > beforeSkills;
      if (!progressed) break;
    }
    return events;
  };
}

// re-export 給外部單一入口
export { pickByDifficulty } from './difficulty';
export type { ScoredAction, AIChoice } from './difficulty';
export type { Strategy, Phase, Position, BoardEval } from './strategy';
export { getStrategy, evaluateBoard } from './strategy';
export { RESERVE_THRESHOLD, AI_AVG_WIND_COEFF, getDifficultyMultipliers } from './evaluator';
export type { DifficultyMultipliers } from './evaluator';
