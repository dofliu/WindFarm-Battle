// ============================================================
// 卡牌平衡性分析腳本：跑 N 場 AI 對局，統計每張卡牌的「使用者勝率」
// （使用過該卡的玩家最終勝率），找出可能過強或過弱的卡牌。
//
// 用法：npx vite-node scripts/balance-report.ts -- --games 200 --seed 1
//       npm run balance-report
//
// 輸出：Markdown 格式的平衡報告（stdout）
// ============================================================
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import { runGame, DEFAULT_CONFIG } from '../src/core/rules-engine';
import { aiTakeTurn } from '../src/core/ai';
import { CARDS, deckCardIds } from '../src/core/cards';
import type { GameState } from '../src/core/types';
import type { Rng } from '../src/core/rng';

// ── CLI 參數 ──────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}
const GAMES = parseInt(getArg('games', '200'), 10);
const SEED  = parseInt(getArg('seed', '42'), 10);

// ── 統計結構 ──────────────────────────────────────────────────
interface CardStat {
  uses: number;       // 被使用次數（玩家維度）
  userWins: number;   // 使用過此卡的玩家最終獲勝次數
  userLosses: number; // 使用過此卡的玩家最終落敗次數
}

const stats: Record<string, CardStat> = {};
for (const id of deckCardIds) {
  stats[id] = { uses: 0, userWins: 0, userLosses: 0 };
}

// ── 模擬 ──────────────────────────────────────────────────────
const p1AI = aiTakeTurn('hard', DEFAULT_CONFIG);
const p2AI = aiTakeTurn('hard', DEFAULT_CONFIG);
const takeTurn = (state: GameState, player: 0 | 1, rng: Rng) =>
  (player === 0 ? p1AI : p2AI)(state, player, rng);

let p1Wins = 0, p2Wins = 0, draws = 0;

for (let i = 0; i < GAMES; i++) {
  const seed = SEED + i;
  const initial = createInitialState(createRng(seed));
  const r = runGame(initial, createRng(seed), takeTurn, DEFAULT_CONFIG);

  const p1Score = r.state.players[0].score;
  const p2Score = r.state.players[1].score;
  const winner = p1Score > p2Score ? 0 : p2Score > p1Score ? 1 : -1;
  if (winner === 0) p1Wins++; else if (winner === 1) p2Wins++; else draws++;

  // 記錄每位玩家使用過哪些卡
  const usedByPlayer: [Set<string>, Set<string>] = [new Set(), new Set()];
  for (const ev of r.events) {
    if (ev.kind === 'card-played') {
      usedByPlayer[ev.player].add(ev.cardId);
    }
  }

  // 統計：使用過此卡的玩家是否獲勝
  for (let p = 0; p < 2; p++) {
    const pWon = winner === p;
    const pLost = winner === (1 - p);
    for (const cardId of usedByPlayer[p]) {
      if (!stats[cardId]) continue; // 開局艦隊卡跳過
      stats[cardId].uses++;
      if (pWon) stats[cardId].userWins++;
      if (pLost) stats[cardId].userLosses++;
    }
  }
}

// ── 計算勝率 ──────────────────────────────────────────────────
interface CardReport {
  id: string;
  type: string;
  uses: number;
  winRate: number; // 使用者勝率（排除平局）
  usageRate: number; // 使用次數 / (GAMES * 2)（雙方玩家）
}

const reports: CardReport[] = [];
const totalPlayerGames = GAMES * 2;

for (const [id, stat] of Object.entries(stats)) {
  if (stat.uses === 0) continue;
  const decided = stat.userWins + stat.userLosses;
  const winRate = decided > 0 ? stat.userWins / decided : 0.5;
  const usageRate = stat.uses / totalPlayerGames;
  reports.push({
    id,
    type: CARDS[id]?.type ?? '?',
    uses: stat.uses,
    winRate,
    usageRate,
  });
}

// ── 輸出 Markdown 報告 ────────────────────────────────────────
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const log = (...a: unknown[]) => console.log(...a);

log(`# WindFarm Battle — 卡牌平衡性報告`);
log(`\n> 模擬 ${GAMES} 場 hard×hard（seed=${SEED}）`);
log(`> P1 勝率 ${pct(p1Wins / GAMES)} | P2 勝率 ${pct(p2Wins / GAMES)} | 平局 ${pct(draws / GAMES)}\n`);

// 按類型分組
const byType: Record<string, CardReport[]> = {};
for (const r of reports) {
  if (!byType[r.type]) byType[r.type] = [];
  byType[r.type].push(r);
}

const TYPE_ORDER = ['turbine', 'tech', 'fault', 'func', 'weather', 'contract'];
const TYPE_LABEL: Record<string, string> = {
  turbine: '⛵ 風機卡',
  tech: '🛠️ 技師卡',
  fault: '⚡ 故障卡',
  func: '✨ 功能卡',
  weather: '🌬️ 天氣卡',
  contract: '📋 合約卡',
};

// 全域統計
const allWinRates = reports.map((r) => r.winRate);
const avgWinRate = allWinRates.reduce((s, v) => s + v, 0) / allWinRates.length;
const STRONG_THRESHOLD = avgWinRate + 0.10; // 高於均值 +10pp → 可能過強
const WEAK_THRESHOLD   = avgWinRate - 0.10; // 低於均值 -10pp → 可能過弱
const LOW_USAGE_THRESHOLD = 0.05; // 使用率 < 5% → 冷門

log(`## 📊 各類型卡牌使用者勝率\n`);
log(`> 均值勝率 ${pct(avgWinRate)}，過強門檻 ${pct(STRONG_THRESHOLD)}，過弱門檻 ${pct(WEAK_THRESHOLD)}\n`);

for (const type of TYPE_ORDER) {
  const group = byType[type];
  if (!group || group.length === 0) continue;
  group.sort((a, b) => b.winRate - a.winRate);

  log(`### ${TYPE_LABEL[type] ?? type}\n`);
  log(`| 卡牌 | 使用率 | 使用者勝率 | 狀態 |`);
  log(`|---|---|---|---|`);

  for (const r of group) {
    let status = '✅ 正常';
    if (r.winRate >= STRONG_THRESHOLD) status = '🔴 可能過強';
    else if (r.winRate <= WEAK_THRESHOLD) status = '🔵 可能過弱';
    else if (r.usageRate < LOW_USAGE_THRESHOLD) status = '⚪ 冷門';
    log(`| ${r.id} | ${pct(r.usageRate)} | ${pct(r.winRate)} | ${status} |`);
  }
  log('');
}

// ── 警示摘要 ──────────────────────────────────────────────────
const strong = reports.filter((r) => r.winRate >= STRONG_THRESHOLD).sort((a, b) => b.winRate - a.winRate);
const weak   = reports.filter((r) => r.winRate <= WEAK_THRESHOLD).sort((a, b) => a.winRate - b.winRate);
const cold   = reports.filter((r) => r.usageRate < LOW_USAGE_THRESHOLD && r.winRate > WEAK_THRESHOLD && r.winRate < STRONG_THRESHOLD).sort((a, b) => a.usageRate - b.usageRate);

log(`## ⚠️ 平衡警示摘要\n`);

if (strong.length > 0) {
  log(`### 🔴 可能過強（使用者勝率 ≥ ${pct(STRONG_THRESHOLD)}）\n`);
  for (const r of strong) {
    log(`- **${r.id}**（${r.type}）：使用者勝率 ${pct(r.winRate)}，使用率 ${pct(r.usageRate)}`);
  }
  log('');
}

if (weak.length > 0) {
  log(`### 🔵 可能過弱（使用者勝率 ≤ ${pct(WEAK_THRESHOLD)}）\n`);
  for (const r of weak) {
    log(`- **${r.id}**（${r.type}）：使用者勝率 ${pct(r.winRate)}，使用率 ${pct(r.usageRate)}`);
  }
  log('');
}

if (cold.length > 0) {
  log(`### ⚪ 冷門卡（使用率 < ${pct(LOW_USAGE_THRESHOLD)}）\n`);
  for (const r of cold) {
    log(`- **${r.id}**（${r.type}）：使用率 ${pct(r.usageRate)}，使用者勝率 ${pct(r.winRate)}`);
  }
  log('');
}

if (strong.length === 0 && weak.length === 0 && cold.length === 0) {
  log(`✅ 所有卡牌均在正常範圍內，無平衡警示。\n`);
}

log(`---`);
log(`_報告生成時間：${new Date().toISOString()}_`);
