// S2.5 模擬器測試（α 部分）：決定性、SimSummary 結構正確、100 場 hard×hard 合理性。
// 註：β 「逐場精確等於 v3 神諭」屬另案（需 tests/fixtures/v3-oracle.mjs），本檔不涉入。
import { describe, it, expect } from 'vitest';
import { simulate, simulateOne } from '../src/core/simulation/runner';

describe('S2.5 simulator：決定性', () => {
  it('simulateOne 同 seed → 完全相同結果', () => {
    const a = simulateOne({ p1: 'hard', p2: 'hard', seed: 42 });
    const b = simulateOne({ p1: 'hard', p2: 'hard', seed: 42 });
    expect(a).toEqual(b);
  });

  it('simulate 同 opts → 完全相同 SimSummary', () => {
    const a = simulate({ p1: 'hard', p2: 'hard', games: 10, seed: 7 });
    const b = simulate({ p1: 'hard', p2: 'hard', games: 10, seed: 7 });
    expect(a).toEqual(b);
  });
});

describe('S2.5 simulator：SimSummary 結構', () => {
  it('小規模 5 場跑得通且機率和 ≈ 1', () => {
    const s = simulate({ p1: 'hard', p2: 'medium', games: 5, seed: 1 });
    expect(s.games).toBe(5);
    expect(s.p1WinRate + s.p2WinRate + s.drawRate).toBeCloseTo(1, 10);
    expect(s.closeRate).toBeGreaterThanOrEqual(0);
    expect(s.closeRate).toBeLessThanOrEqual(1);
    expect(s.blowoutRate).toBeGreaterThanOrEqual(0);
    expect(s.blowoutRate).toBeLessThanOrEqual(1);
  });

  it('cardUsageRate 各項 ∈ [0,1] 且總和 ≈ 1', () => {
    const s = simulate({ p1: 'hard', p2: 'hard', games: 10, seed: 1 });
    const rates = Object.values(s.cardUsageRate);
    for (const r of rates) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
    const sum = rates.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
  });
});

describe('S2.5 simulator：100 場合理性（hard×hard）', () => {
  it('勝率合理（兩邊都 >0.3 且 <0.7），平均分數差距合理', () => {
    const s = simulate({ p1: 'hard', p2: 'hard', games: 100, seed: 1 });
    // 不檢查嚴格 50/50（NOTES 已說 v3 基準也只有 50.5/48.4，且 D2「先求對等」並非嚴格平衡）
    expect(s.p1WinRate).toBeGreaterThan(0.3);
    expect(s.p1WinRate).toBeLessThan(0.7);
    expect(s.p2WinRate).toBeGreaterThan(0.3);
    expect(s.p2WinRate).toBeLessThan(0.7);
    // 平均分數差距 ≤ 10（D2 對等容差）
    expect(Math.abs(s.avgScoreDiff)).toBeLessThan(10);
  });

  it('cardUsage 涵蓋 ≥ 10 張不同卡（基本多樣性）', () => {
    const s = simulate({ p1: 'hard', p2: 'hard', games: 100, seed: 1 });
    expect(Object.keys(s.cardUsage).length).toBeGreaterThanOrEqual(10);
  });

  it('總出牌次數 > 0（AI 不會全程保留）', () => {
    const s = simulate({ p1: 'hard', p2: 'hard', games: 20, seed: 1 });
    const total = Object.values(s.cardUsage).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0);
  });
});
