// ============================================================
// AI 局勢判斷（對齊 v3 evaluateBoard + getStrategy）。
//   phase：round ≤4 early / ≤8 mid / 9–12 late
//   position：futureScoreDiff = scoreDiff + (myMWh − oppMWh) × roundsLeft
//             >15 winning / <−15 losing / 其餘 even
//   myMWhPerRound / oppMWhPerRound 估算使用 AI_AVG_WIND_COEFF = 0.65（與結算的實際 wind.coeff 不同）。
// 純函式、零副作用。
// ============================================================
import type { GameState, PlayerState } from '../types';
import { CARDS } from '../cards';
import { AI_AVG_WIND_COEFF } from './evaluator';
import { getAuraMwBonus } from '../abilities';

export type Phase = 'early' | 'mid' | 'late';
export type Position = 'winning' | 'even' | 'losing';

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

function playerMWhPerRound(p: PlayerState): number {
  let total = 0;
  // S3.1：M07 aura-mw 計入 AI 估算（讓 AI 知道光環的價值）
  const auraMw = getAuraMwBonus(p);
  for (const t of p.turbines) {
    const card = CARDS[t.cardId];
    const totalDrop = t.faults.reduce((s, f) => s + f.drop, 0);
    const avail = Math.max(0, t.avail - totalDrop);
    total += ((card.stats?.mw ?? 0) + t.mwBonus + auraMw) * AI_AVG_WIND_COEFF * (avail / 100);
  }
  return total;
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
