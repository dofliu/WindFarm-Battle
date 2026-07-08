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

/**
 * 估算某玩家「每回合預期 MWh」。
 * 寶可夢式主力/備戰區規則：只有主力機組會實際計分（見 rules-engine._scoreRound），
 * 備戰區機組雖在場但不產電，因此估算只看主力那一台——board 局勢判斷才會跟真正的結算邏輯一致。
 */
function playerMWhPerRound(p: PlayerState): number {
  if (p.activeTurbineIdx === null) return 0;
  const t = p.turbines[p.activeTurbineIdx];
  if (!t) return 0;
  const card = CARDS[t.cardId];
  // S3.1：M07 aura-mw 計入 AI 估算（讓 AI 知道光環的價值；只反映在主力這一次結算裡）
  const auraMw = getAuraMwBonus(p);
  const totalDrop = t.faults.reduce((s, f) => s + f.drop, 0);
  const avail = Math.max(0, t.avail - totalDrop);
  return ((card.stats?.mw ?? 0) + t.mwBonus + auraMw) * AI_AVG_WIND_COEFF * (avail / 100);
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
