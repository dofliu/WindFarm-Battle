// CLI 平衡驗證腳本：接受 --games / --p1 / --p2 / --seed 參數
// 用法：npx vite-node scripts/simulate.ts -- --games 1000 --p1 hard --p2 hard
//       npm run simulate -- --games 200 --p1 medium --p2 hard
import { simulate } from '../src/core/simulation/runner';
import { deckCardIds } from '../src/core/cards';
import type { Difficulty } from '../src/core/types';

// 只檢查真正在抽牌池中的卡（排除 OS8/OS10/OS12 開局艦隊）
const DECK_SET = new Set(deckCardIds);

// ── 解析 CLI 參數（process.argv = [node, script, ...args]）
const args = process.argv.slice(2);
function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const games = parseInt(getArg('games', '100'), 10);
const p1 = getArg('p1', 'hard') as Difficulty;
const p2 = getArg('p2', 'hard') as Difficulty;
const seed = parseInt(getArg('seed', '1'), 10);

// ── 合格門檻（對應 CLAUDE.md 平衡標準，已針對 Route B 開局艦隊校準）
//
// 勝率：先手玩家有天然微弱優勢（P1 先行動），最大差距 ≤12pp（pp = 百分點）
//   → 改為 |p1WinRate - p2WinRate| ≤ 0.12，比逐個絕對值合理
// 卡牌使用率：39 張抽牌池，均勻分佈約 2.56% / 張
//   → 冷門門檻從 3% 降至 1.5%（避免均勻分佈本身觸發警示）
const PASS_WIN_GAP    = 0.12;  // P1 vs P2 勝率差距 ≤ 12pp
const PASS_WIN_RANGE  = { min: 0.42, max: 0.58 }; // 個別勝率上下限
const PASS_CLOSE      = 0.25;
const PASS_BLOWOUT    = 0.20;
const PASS_MIN_USAGE  = 0.015; // 1.5%（39 張均勻≈2.56%，此為 ~60% 下限）

// eslint-disable-next-line no-console
const log = (...a: unknown[]) => console.log(...a);

log(`\n🎮 WindFarm Battle — 平衡驗證 (${games} 場, P1=${p1} vs P2=${p2}, seed=${seed})`);
log('─'.repeat(60));

const s = simulate({ p1, p2, games, seed });

// winOK：雙方勝率都在合理範圍 + 差距不超過 12pp
const winGap = Math.abs(s.p1WinRate - s.p2WinRate);
const winOK = winGap <= PASS_WIN_GAP
           && s.p1WinRate >= PASS_WIN_RANGE.min
           && s.p1WinRate <= PASS_WIN_RANGE.max
           && s.p2WinRate >= PASS_WIN_RANGE.min
           && s.p2WinRate <= PASS_WIN_RANGE.max;
const closeOK = s.closeRate >= PASS_CLOSE;
const blowOK = s.blowoutRate <= PASS_BLOWOUT;

log(`\n📊 勝率`);
log(`  P1 (${p1.padEnd(6)}) ${(s.p1WinRate * 100).toFixed(1)}%  ${s.p1WinRate >= PASS_WIN_RANGE.min && s.p1WinRate <= PASS_WIN_RANGE.max ? '✅' : '❌'}（範圍 42–58%）`);
log(`  P2 (${p2.padEnd(6)}) ${(s.p2WinRate * 100).toFixed(1)}%  ${s.p2WinRate >= PASS_WIN_RANGE.min && s.p2WinRate <= PASS_WIN_RANGE.max ? '✅' : '❌'}（範圍 42–58%）`);
log(`  平局         ${(s.drawRate * 100).toFixed(1)}%`);
log(`  勝率差距     ${(winGap * 100).toFixed(1)}pp  ${winGap <= PASS_WIN_GAP ? '✅' : '❌'}（門檻 ≤12pp）`);

log(`\n📈 分數`);
log(`  P1 平均 ${s.avgP1.toFixed(1)} MWh`);
log(`  P2 平均 ${s.avgP2.toFixed(1)} MWh`);
log(`  差距    ${s.avgScoreDiff.toFixed(2)} MWh`);

log(`\n🎯 緊湊度`);
log(`  勢均力敵率（相對差≤3%）  ${(s.closeRate * 100).toFixed(1)}%  ${closeOK ? '✅' : '❌'}（門檻 ≥25%）`);
log(`  一面倒率（相對差≥12%）   ${(s.blowoutRate * 100).toFixed(1)}%  ${blowOK ? '✅' : '❌'}（門檻 ≤20%）`);

// 情境性卡牌豁免：只在特定風況/局勢下才有策略價值，不計入冷門警示
// - M07：傳說卡（rarity=5），設計上強力但低頻；aura 已補入評估
// - M12：儲能機組（no-wind-power），僅在低風況下比 OS8 有優勢（教育意義）
// - W02：全場停機，理性 AI 除非落後才使用（教育意義：天氣對稱傷害）
const EXEMPT_SITUATIONAL = new Set(['M07', 'M12', 'W02']);

// 冷門卡（使用率 < 1.5%，只看抽牌池內卡，排除開局艦隊 + 情境性豁免卡）
// 同時列出「完全未出現」的牌（可能 AI 策略盲點）
const deckColdCards = deckCardIds
  .filter(id => !EXEMPT_SITUATIONAL.has(id) && (s.cardUsageRate[id] ?? 0) < PASS_MIN_USAGE)
  .sort();
const coldCards = deckColdCards; // alias for display
const usageOK = coldCards.length === 0;

// Top 10 使用率卡
const top10 = Object.entries(s.cardUsageRate)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([id, r]) => `${id}=${(r * 100).toFixed(1)}%`)
  .join(' ');

// 抽牌池中哪些卡完全沒出現（可能 AI 策略盲點）
const neverPlayed = deckCardIds.filter(id => !s.cardUsage[id]).sort();

log(`\n🃏 卡牌涵蓋`);
log(`  出牌涵蓋 ${Object.keys(s.cardUsage).length} 種卡（其中抽牌池 ${deckCardIds.length} 張）`);
log(`  Top 10：${top10}`);
if (usageOK) {
  log(`  抽牌池全部卡使用率 ≥1.5% ✅`);
} else {
  log(`  冷門（<1.5%，抽牌池）：${coldCards.join(', ')}`);
}
if (neverPlayed.length > 0) {
  log(`  ⚠️ 從未出手（抽牌池）：${neverPlayed.join(', ')}`);
}

log(`\n${'─'.repeat(60)}`);
const allPass = winOK && closeOK && blowOK && usageOK;
log(`\n${allPass ? '🎉 全部合格！' : '⚠️  部分指標未達門檻（見 ❌）'}`);
log('');
