import { describe, it, expect } from 'vitest';
import { createRng } from '../src/core/rng';
import { rollWind } from '../src/core/rules-engine';

describe('風速骰（對齊 v3）', () => {
  it('效率係數只會是合法值 {0, 0.4, 1.0, 0.7}', () => {
    const r = createRng(999);
    const allowed = new Set([0, 0.4, 1.0, 0.7]);
    for (let i = 0; i < 1000; i++) {
      expect(allowed.has(rollWind(r).coeff)).toBe(true);
    }
  });

  it('相同 seed 產生相同的風速序列（可重現＝同題基礎）', () => {
    const labelsA = (() => {
      const r = createRng(2024);
      return Array.from({ length: 12 }, () => rollWind(r).label);
    })();
    const labelsB = (() => {
      const r = createRng(2024);
      return Array.from({ length: 12 }, () => rollWind(r).label);
    })();
    expect(labelsA).toEqual(labelsB);
  });
});
