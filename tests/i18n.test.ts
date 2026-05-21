import { describe, it, expect } from 'vitest';
import { allCardIds } from '../src/core/cards';
import { cardName, cardFlavor, abilityDesc } from '../src/i18n';

describe('i18n 卡牌文案抽取（S2.0）', () => {
  it('卡名正確解析（抽取後仍可取得）', () => {
    expect(cardName('M07')).toBe('天鯨 12MW');
    expect(cardName('F07')).toBe('主軸承故障');
    expect(cardFlavor('M01')).toBe('入門陸域，可靠耐用');
  });

  it('能力描述正確解析', () => {
    expect(abilityDesc('M07', 0)).toContain('+1MW');
  });

  it('每張卡都有對應卡名（無漏抽）', () => {
    for (const id of allCardIds) {
      const name = cardName(id);
      expect(name).not.toBe(`cards.${id}.name`); // 未命中會原樣回傳 key
      expect(name.length).toBeGreaterThan(0);
    }
  });
});
