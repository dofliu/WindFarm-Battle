// ============================================================
// 模擬器：跑 N 場 AI 對戰並彙整統計
// ============================================================
import type { Difficulty, GameState } from '../types';
import { createRng } from '../rng';
import { createInitialState } from '../game-state';
import type { GameMode } from '../types';
import { runGame, type RulesConfig, DEFAULT_CONFIG } from '../rules-engine';
import { aiTakeTurn } from '../ai';

export interface SimGameResult {
  readonly seed: number;
  readonly p1Score: number;
  readonly p2Score: number;
  readonly winner: 0 | 1 | -1;
}

export interface SimSummary {
  readonly games: number;
  readonly p1WinRate: number;
  readonly p2WinRate: number;
  readonly drawRate: number;
  readonly avgP1: number;
  readonly avgP2: number;
  readonly avgScoreDiff: number;
  readonly closeRate: number;
  readonly blowoutRate: number;
  readonly cardUsage: Readonly<Record<string, number>>;
  readonly cardUsageRate: Readonly<Record<string, number>>;
}

export interface SimOptions {
  readonly p1: Difficulty;
  readonly p2: Difficulty;
  readonly games: number;
  readonly seed?: number;
  readonly config?: RulesConfig;
  readonly mode?: GameMode;
}

function determineWinner(p1: number, p2: number): 0 | 1 | -1 {
  return p1 > p2 ? 0 : p2 > p1 ? 1 : -1;
}

export function simulateOne(opts: {
  p1: Difficulty;
  p2: Difficulty;
  seed: number;
  config?: RulesConfig;
}): SimGameResult {
  const config = opts.config ?? DEFAULT_CONFIG;
  const rng = createRng(opts.seed);
  const initial = createInitialState(rng);
  
  const takeTurn = (state: GameState) => {
    const diff = state.currentPlayer === 0 ? opts.p1 : opts.p2;
    return aiTakeTurn(state, diff, rng);
  };

  const r = runGame(initial, config, takeTurn, rng);
  const p1Score = r.state.players[0].score;
  const p2Score = r.state.players[1].score;
  return { seed: opts.seed, p1Score, p2Score, winner: determineWinner(p1Score, p2Score) };
}

export function simulate(opts: SimOptions): SimSummary {
  const baseSeed = opts.seed ?? 1;
  const config = opts.config ?? DEFAULT_CONFIG;
  const cardUsage: Record<string, number> = {};
  let cardPlays = 0;

  let p1Wins = 0;
  let p2Wins = 0;
  let draws = 0;
  let sumP1 = 0;
  let sumP2 = 0;
  let close = 0;
  let blowout = 0;

  const mode: GameMode = opts.mode ?? 'versus';
  for (let i = 0; i < opts.games; i++) {
    const seed = baseSeed + i;
    const rng = createRng(seed);
    const initial = createInitialState(rng, mode);
    
    const takeTurn = (state: GameState) => {
      const diff = state.currentPlayer === 0 ? opts.p1 : opts.p2;
      return aiTakeTurn(state, diff, rng);
    };

    const r = runGame(initial, config, takeTurn, rng);

    for (const ev of r.events) {
      if (ev.kind === 'card-played') {
        cardUsage[ev.cardId] = (cardUsage[ev.cardId] ?? 0) + 1;
        cardPlays++;
      }
    }

    const p1Score = r.state.players[0].score;
    const p2Score = r.state.players[1].score;
    sumP1 += p1Score;
    sumP2 += p2Score;
    const diff = Math.abs(p1Score - p2Score);
    const combined = p1Score + p2Score;
    const relDiff = combined > 0 ? diff / combined : 0;
    if (relDiff <= 0.03) close++;
    if (relDiff >= 0.12) blowout++;

    const winner = determineWinner(p1Score, p2Score);
    if (winner === 0) p1Wins++;
    else if (winner === 1) p2Wins++;
    else draws++;
  }

  const cardUsageRate: Record<string, number> = {};
  if (cardPlays > 0) {
    for (const [k, v] of Object.entries(cardUsage)) {
      cardUsageRate[k] = v / cardPlays;
    }
  }

  return {
    games: opts.games,
    p1WinRate: p1Wins / opts.games,
    p2WinRate: p2Wins / opts.games,
    drawRate: draws / opts.games,
    avgP1: sumP1 / opts.games,
    avgP2: sumP2 / opts.games,
    avgScoreDiff: (sumP1 - sumP2) / opts.games,
    closeRate: close / opts.games,
    blowoutRate: blowout / opts.games,
    cardUsage,
    cardUsageRate,
  };
}
