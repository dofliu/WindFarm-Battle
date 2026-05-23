// ============================================================
// AI 難度系統（對齊 v3 aiChoose）。
//   - easy：50% 機率取 top3 隨機；否則取 top1（RNG 消耗：1 次擲骰 + 可能 1 次 index 取整）
//   - medium：25% 機率取次優 actions[1]；否則 top1（RNG：1 次擲骰）
//   - hard：永遠 top1（不消耗 RNG）
//   score < RESERVE_THRESHOLD（−10）時呼叫端應保留行動。
// 注意：v3 用 Math.random，新版用注入 rng 以利重現；rng.next() 消耗順序固定。
// ============================================================
import type { Rng } from '../rng';
import type { Difficulty } from '../types';
import type { Strategy } from './strategy';
import type { Action } from '../actions';

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];

export interface ScoredAction {
  readonly action: Action;
  readonly score: number;
  readonly desc: string;
}

export interface AIChoice {
  readonly chosen: ScoredAction;
  readonly considered: readonly ScoredAction[];
  readonly strategy: Strategy;
}

/**
 * 從候選動作中依難度選一個。actions 不可為空，否則回 null。
 * 對齊 v3：先排序、過濾 score>0；無正分時用全部。
 */
export function pickByDifficulty(
  actions: readonly ScoredAction[],
  difficulty: Difficulty,
  rng: Rng,
): ScoredAction | null {
  if (actions.length === 0) return null;
  const sorted = [...actions].sort((a, b) => b.score - a.score);
  const positive = sorted.filter((a) => a.score > 0);
  const valid = positive.length > 0 ? positive : sorted;

  if (difficulty === 'easy') {
    const roll = rng.next();
    if (roll < 0.5 && valid.length > 1) {
      const top3 = valid.slice(0, Math.min(3, valid.length));
      const idx = Math.floor(rng.next() * top3.length);
      return top3[idx];
    }
    return valid[0];
  }
  if (difficulty === 'medium') {
    const roll = rng.next();
    if (roll < 0.25 && valid.length > 1) return valid[1];
    return valid[0];
  }
  return valid[0]; // hard
}
