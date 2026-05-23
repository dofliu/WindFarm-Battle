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
import { type RulesConfig, DEFAULT_CONFIG, type TakeTurn } from '../rules-engine';
import { getStrategy, type Strategy } from './strategy';
import {
  evaluateTurbinePlay,
  evaluateTechPlay,
  evaluateFaultPlay,
  evaluateFuncPlay,
  RESERVE_THRESHOLD,
} from './evaluator';
import {
  type ScoredAction,
  type AIChoice,
  pickByDifficulty,
} from './difficulty';

/** 對齊 v3 generateActions：對所有合法手牌產生候選動作。 */
export function generateActions(state: GameState, player: 0 | 1): { actions: ScoredAction[]; strategy: Strategy } {
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
        score: evaluateTurbinePlay(card, state, player, strategy),
        desc: me.turbines.length >= 3 ? `${cardId}（替換）` : `部署 ${cardId}`,
      });
    } else if (card.type === 'tech') {
      actions.push({
        action: { kind: 'play-card', player, handIdx: i },
        score: evaluateTechPlay(card, state, player, strategy),
        desc: `派遣 ${cardId}`,
      });
    } else if (card.type === 'fault') {
      for (let t = 0; t < opp.turbines.length; t++) {
        actions.push({
          action: { kind: 'play-card', player, handIdx: i, target: t },
          score: evaluateFaultPlay(card, opp.turbines[t], state, player, strategy),
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
  return { actions, strategy };
}

/** 對齊 v3 aiChoose：依難度選一個候選動作。無候選時回 null。 */
export function aiChoose(
  state: GameState,
  player: 0 | 1,
  difficulty: Difficulty,
  rng: Rng,
): AIChoice | null {
  const { actions, strategy } = generateActions(state, player);
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
    // 安全網：手牌最多 7 張，每張最多 1 動作 → 不會無限迴圈，但仍設上限避免異常 ability 拖死
    const HARD_CAP = 20;
    let steps = 0;
    while (state.actionsLeft > 0 && !state.gameOver && steps++ < HARD_CAP) {
      const choice = aiChoose(state, player, difficulty, rng);
      if (!choice || choice.chosen.score < RESERVE_THRESHOLD) break;
      const before = state.actionsLeft;
      events.push(..._applyActionMutate(state, choice.chosen.action, rng, config));
      // 若 action 因合法性檢查失敗未實際消耗動作，跳出避免死迴圈
      if (state.actionsLeft === before) break;
    }
    return events;
  };
}

// re-export 給外部單一入口
export { pickByDifficulty } from './difficulty';
export type { ScoredAction, AIChoice } from './difficulty';
export type { Strategy, Phase, Position, BoardEval } from './strategy';
export { getStrategy, evaluateBoard } from './strategy';
export { RESERVE_THRESHOLD, AI_AVG_WIND_COEFF } from './evaluator';
