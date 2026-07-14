// ============================================================
// AI 出牌與決策迴圈。
// ============================================================
import type { GameState, Difficulty } from '../types';
import type { Rng } from '../rng';
import type { GameEvent } from '../events';
import { CARDS } from '../cards';
import { legalActions, applyAction } from '../actions';
import { getStrategy, type Strategy } from './strategy';
import {
  evaluateTechPlay,
  evaluateToolPlay,
  evaluateItemPlay,
  evaluateContractPlay,
  evaluatePromote,
  evaluateRetreat,
  evaluateSkill,
  RESERVE_THRESHOLD
} from './evaluator';
import {
  type ScoredAction,
  type AIChoice,
  pickByDifficulty
} from './difficulty';

/** 列出所有合法候選動作並評分 */
export function generateActions(
  state: GameState,
  player: 0 | 1,
  difficulty: Difficulty = 'hard'
): { actions: ScoredAction[]; strategy: Strategy } {
  const me = state.players[player];
  const strategy = getStrategy(state, player);
  const actionsList = legalActions(state, player);
  const scoredActions: ScoredAction[] = [];

  for (const action of actionsList) {
    let score = 0;
    let desc = '';

    if (action.kind === 'end-turn') {
      score = 0.1; // 微小正分，作為保底動作
      desc = '結束回合';
    } else if (action.kind === 'promote-tech') {
      const tech = me.field.bench[action.benchIdx];
      score = evaluatePromote(tech, state, player);
      desc = `晉升備戰區技師 ${tech.cardId}`;
    } else if (action.kind === 'retreat') {
      const active = me.field.active!;
      const bench = me.field.bench[action.benchIdx];
      score = evaluateRetreat(active, bench, state, player);
      desc = `撤退主力 ${active.cardId}，換上 ${bench.cardId}`;
    } else if (action.kind === 'use-skill') {
      const active = me.field.active!;
      const targetTurbine = action.targetTurbineIdx !== undefined ? me.windFarm[action.targetTurbineIdx] : null;
      score = evaluateSkill(active, targetTurbine, state, player, strategy, difficulty);
      const skillName = CARDS[active.cardId].skills?.[active.level === 3 ? 'lv3' : active.level === 2 ? 'lv2' : 'lv1'].tag ?? 'skill';
      desc = `主力 ${active.cardId} 使用技能 ${skillName}${targetTurbine ? ` 於 ${targetTurbine.id}` : ''}`;
    } else if (action.kind === 'play-card') {
      const cardId = me.hand[action.handIdx];
      const card = CARDS[cardId];
      
      if (card.type === 'tech') {
        score = evaluateTechPlay(card, state, player, strategy, difficulty);
        desc = `派遣技師 ${cardId}`;
      } else if (card.type === 'tool' && action.targetTechIdx !== undefined) {
        const allTechs = [me.field.active, ...me.field.bench].filter((t): t is DeployedTech => t !== null);
        const targetTech = allTechs[action.targetTechIdx];
        score = evaluateToolPlay(card, targetTech, state, player, difficulty);
        desc = `裝備工具 ${cardId} 於 ${targetTech.cardId}`;
      } else if (card.type === 'item') {
        const targetTurbine = action.targetTurbineIdx !== undefined ? me.windFarm[action.targetTurbineIdx] : null;
        const allTechs = [me.field.active, ...me.field.bench].filter((t): t is DeployedTech => t !== null);
        const targetTech = action.targetTechIdx !== undefined ? allTechs[action.targetTechIdx] ?? null : null;
        score = evaluateItemPlay(card, targetTurbine, state, player, strategy, difficulty, targetTech);
        desc = `使用道具 ${cardId}${targetTurbine ? ` 於 ${targetTurbine.id}` : ''}${targetTech ? ` 於 ${targetTech.cardId}` : ''}`;
      } else if (card.type === 'contract') {
        score = evaluateContractPlay(card, state, strategy, difficulty);
        desc = `簽訂合約 ${cardId}`;
      }
    }

    scoredActions.push({ action, score, desc });
  }

  return { actions: scoredActions, strategy };
}

/** AI 選擇最佳動作 */
export function aiChoose(
  state: GameState,
  player: 0 | 1,
  difficulty: Difficulty,
  rng: Rng
): AIChoice | null {
  const { actions, strategy } = generateActions(state, player, difficulty);
  if (actions.length === 0) return null;

  const chosen = pickByDifficulty(actions, difficulty, rng);
  if (!chosen) return null;

  return {
    chosen,
    considered: actions,
    strategy,
  };
}

// 用於 DeployedTech 的 type 宣告
type DeployedTech = import('../types').DeployedTech;

/** 執行 AI 的完整回合 */
export function aiTakeTurn(
  state: GameState,
  difficulty: Difficulty,
  rng: Rng
): { state: GameState; events: GameEvent[] } {
  let currState = structuredClone(state);
  const events: GameEvent[] = [];
  const activePlayer = currState.currentPlayer;

  let steps = 0;
  const HARD_CAP = 30;

  while (steps < HARD_CAP && !currState.gameOver) {
    steps++;
    const choice = aiChoose(currState, activePlayer, difficulty, rng);
    if (!choice) break;

    const { action, score } = choice.chosen;
    
    // 如果最佳動作小於保留閾值，或者決定結束回合，則退出循環
    if (score < RESERVE_THRESHOLD || action.kind === 'end-turn') {
      events.push({ kind: 'turn-ended', player: activePlayer });
      break;
    }

    // 執行動作並累積事件
    const result = applyAction(currState, action, rng);
    currState = result.state;
    events.push(...result.events);

    // 寶可夢規則：使用技能會立即結束回合
    if (action.kind === 'use-skill') {
      break;
    }
  }

  // 確保一定有結束事件，避免呼叫端陷入無窮迴圈
  const hasEnded = events.some(
    (e) => e.kind === 'turn-ended' || e.kind === 'skill-used'
  );
  if (!hasEnded && !currState.gameOver) {
    events.push({ kind: 'turn-ended', player: activePlayer });
  }

  return { state: currState, events };
}
