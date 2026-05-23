// 一次性測量腳本：跑 1000 場 hard×hard，輸出 S2.5 平衡基準（給 NOTES 參考用）。
// 用法：npx vite-node scripts/measure-1000.ts
import { simulate } from '../src/core/simulation/runner';

const s = simulate({ p1: 'hard', p2: 'hard', games: 1000, seed: 1 });
const top10 = Object.entries(s.cardUsageRate)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([id, r]) => `${id}=${(r * 100).toFixed(2)}%`)
  .join(' ');
const low = Object.entries(s.cardUsageRate)
  .filter(([, r]) => r < 0.03)
  .sort((a, b) => a[1] - b[1])
  .map(([id]) => id)
  .join(',');

// eslint-disable-next-line no-console
console.log(
  JSON.stringify(
    {
      games: s.games,
      p1WinRate: s.p1WinRate.toFixed(3),
      p2WinRate: s.p2WinRate.toFixed(3),
      drawRate: s.drawRate.toFixed(3),
      avgP1: s.avgP1.toFixed(1),
      avgP2: s.avgP2.toFixed(1),
      avgScoreDiff: s.avgScoreDiff.toFixed(2),
      closeRate: s.closeRate.toFixed(3),
      blowoutRate: s.blowoutRate.toFixed(3),
      cardsPlayed: Object.keys(s.cardUsage).length,
      top10,
      underused_lt_3pct: low,
    },
    null,
    2,
  ),
);
