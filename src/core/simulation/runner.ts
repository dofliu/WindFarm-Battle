// ============================================================
// 模擬器：跑 N 場 AI 對戰並彙整統計（α 對齊與平衡驗證共用）。
//   - simulateOne(opts) → 單場結果（決定性，seed 控制）
//   - simulate(opts)    → SimSummary（勝率/平均分數/勢均/一面倒/卡牌使用率）
// 注意：β「逐場精確重現 v3 神諭」屬另案，需 tests/fixtures/v3-oracle.mjs 與
//       tests/golden/v3-baseline.json，本檔不涉入。
// ============================================================
import type { Difficulty, GameState } from '../types';
import type { Rng } from '../rng';
import { createRng } from '../rng';
import { createInitialState } from '../game-state';
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
  /**
   * |p1 − p2| / (p1 + p2) ≤ 3% 的場次比例（勢均力敵率，合格門檻 ≥0.25）
   * 改用相對差而非絕對差，避免開局艦隊造成分數基準跳升後門檻過緊
   */
  readonly closeRate: number;
  /**
   * |p1 − p2| / (p1 + p2) ≥ 12% 的場次比例（一面倒率，合格門檻 ≤0.20）
   * 同上，使用相對差
   */
  readonly blowoutRate: number;
  /** 各卡 ID 出現在 card-played 事件的次數總和 */
  readonly cardUsage: Readonly<Record<string, number>>;
  /** 各卡使用次數 ÷ 總出牌次數 */
  readonly cardUsageRate: Readonly<Record<string, number>>;
}

export interface SimOptions {
  readonly p1: Difficulty;
  readonly p2: Difficulty;
  readonly games: number;
  /** 基底 seed；第 i 場使用 baseSeed + i，便於重現與平行擴展 */
  readonly seed?: number;
  readonly config?: RulesConfig;
}

function makeTakeTurn(p1: Difficulty, p2: Difficulty, config: RulesConfig) {
  const p1AI = aiTakeTurn(p1, config);
  const p2AI = aiTakeTurn(p2, config);
  return (state: GameState, player: 0 | 1, rng: Rng) =>
    (player === 0 ? p1AI : p2AI)(state, player, rng);
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
  const initial = createInitialState(createRng(opts.seed));
  const r = runGame(initial, createRng(opts.seed), makeTakeTurn(opts.p1, opts.p2, config), config);
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

  const takeTurn = makeTakeTurn(opts.p1, opts.p2, config);
  for (let i = 0; i < opts.games; i++) {
    const seed = baseSeed + i;
    const initial = createInitialState(createRng(seed));
    const r = runGame(initial, createRng(seed), takeTurn, config);

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
    // 相對差：避免開局艦隊使分數基準跳升後，絕對門檻比例失真
    const combined = p1Score + p2Score;
    const relDiff = combined > 0 ? diff / combined : 0;
    if (relDiff <= 0.03) close++;    // ≤3% → 勢均力敵
    if (relDiff >= 0.12) blowout++;  // ≥12% → 一面倒

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
