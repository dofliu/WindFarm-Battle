import { describe, it, expect } from 'vitest';
import { allCardIds, cardsByType, getCard, CARD_COUNT } from '../src/core/cards';

describe('卡牌資料載入', () => {
  it('共 47 張卡', () => {
    expect(CARD_COUNT).toBe(47);
  });

  it('六大類別數量正確（12/9/9/8/5/4）', () => {
    expect(cardsByType('turbine')).toHaveLength(12);
    expect(cardsByType('tech')).toHaveLength(9);
    expect(cardsByType('fault')).toHaveLength(9);
    expect(cardsByType('func')).toHaveLength(8);
    expect(cardsByType('weather')).toHaveLength(5);
    expect(cardsByType('contract')).toHaveLength(4);
  });

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
