import { describe, it, expect } from 'vitest';
import { allCardIds, getCard } from '../src/core/cards';

describe('卡牌資料載入 v2.0', () => {
  it('每張卡 id 一致且有數字 cost', () => {
    for (const id of allCardIds) {
      const c = getCard(id);
      expect(c.id).toBe(id);
      expect(typeof c.cost).toBe('number');
    }
  });

  it('未知 ID 會丟錯', () => {
    expect(() => getCard('ZZZ')).toThrow();
  });
});
