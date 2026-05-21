// ============================================================
// 可重現的偽隨機數產生器（seeded PRNG，演算法：mulberry32）。
// 用途：
//   1. 對齊測試（同 seed → 同結果，可比對 v3 黃金樣本）
//   2. 1000 場平衡模擬（決定性、可重跑）
//   3. D7「天氣對抗同題競賽」（同 seed = 同一道題目）
// core/ 一律透過注入的 Rng 取隨機，不直接呼叫 Math.random。
// ============================================================

export interface Rng {
  /** 回傳 [0, 1) 浮點數 */
  next(): number;
  /** 回傳 [min, max] 含兩端的整數 */
  int(min: number, max: number): number;
  /** 從陣列隨機取一個元素 */
  pick<T>(arr: readonly T[]): T;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

/** Fisher-Yates 洗牌（對齊 v3：j = int(0, i)）。回傳新陣列，不改入參。 */
export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
