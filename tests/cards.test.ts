import { describe, it, expect } from 'vitest';
import { allCardIds, cardsByType, getCard, CARD_COUNT } from '../src/core/cards';

describe('卡牌資料載入', () => {
  it('共 51 張卡（含 OS8/OS10/OS12 開局艦隊）', () => {
    expect(CARD_COUNT).toBe(51);
  });

  it('六大類別數量正確（15/9/9/9/5/4，turbine 含 3 張開局艦隊）', () => {
    expect(cardsByType('turbine')).toHaveLength(15);
    expect(cardsByType('tech')).toHaveLength(9);
    expect(cardsByType('fault')).toHaveLength(9);
    expect(cardsByType('func')).toHaveLength(9);
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
