// ============================================================
// AI 局勢判斷
// ============================================================
import type { GameState, PlayerState } from '../types';

export type Phase = 'early' | 'mid' | 'late';
export type Position = 'winning' | 'even' | 'losing';

export const AI_AVG_WIND_COEFF = 0.65;

export interface BoardEval {
  readonly myMWhPerRound: number;
  readonly oppMWhPerRound: number;
  readonly scoreDiff: number;
  readonly roundsLeft: number;
}

export interface Strategy extends BoardEval {
  readonly phase: Phase;
  readonly position: Position;
}

/** 估算某玩家「每回合預期 MWh」 */
function playerMWhPerRound(p: PlayerState): number {
  return p.windFarm.reduce((sum, turbine) => {
    if (turbine.shutdown) return sum;
    const mw = turbine.mw + turbine.mwBonus;
    const avail = turbine.avail;
    return sum + mw * AI_AVG_WIND_COEFF * (avail / 100);
  }, 0);
}

export function evaluateBoard(state: GameState, player: 0 | 1): BoardEval {
  const me = state.players[player];
  const opp = state.players[1 - player];
  return {
    myMWhPerRound: playerMWhPerRound(me),
    oppMWhPerRound: playerMWhPerRound(opp),
    scoreDiff: me.score - opp.score,
    roundsLeft: state.maxRounds - state.round + 1,
  };
}

export function getStrategy(state: GameState, player: 0 | 1): Strategy {
  const board = evaluateBoard(state, player);
  const phase: Phase = state.round <= 4 ? 'early' : state.round <= 8 ? 'mid' : 'late';
  const futureScoreDiff = board.scoreDiff + (board.myMWhPerRound - board.oppMWhPerRound) * board.roundsLeft;
  const position: Position =
    futureScoreDiff > 15 ? 'winning' : futureScoreDiff < -15 ? 'losing' : 'even';
  return { ...board, phase, position };
}
