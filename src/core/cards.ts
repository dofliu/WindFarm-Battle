// 卡牌資料載入與查詢介面。資料來源＝src/data/cards-v2.json。
import cardsJson from '../data/cards-v2.json';
import type { Card, CardType } from './types';

interface CardsFile {
  readonly version: string;
  readonly totalCards: number;
  readonly categories: Readonly<Record<string, { count: number; color: string }>>;
  readonly rarity: Readonly<Record<string, string>>;
  readonly cards: Readonly<Record<string, Card>>;
}

const file = cardsJson as unknown as CardsFile;

export const CARDS: Readonly<Record<string, Card>> = file.cards;
export const allCardIds: readonly string[] = Object.keys(CARDS);
export const CARD_COUNT = allCardIds.length;

/**
 * 玩家牌組中可抽取的 35 張牌 ID 列表 (包含 tech, tool, item, contract)
 */
export const deckCardIds: readonly string[] = allCardIds.filter((id) => {
  const card = CARDS[id];
  return (
    card.type === 'tech' ||
    card.type === 'tool' ||
    card.type === 'item' ||
    card.type === 'contract'
  );
});

// coopDeckCardIds 在新版中與 deckCardIds 相同
export const coopDeckCardIds: readonly string[] = deckCardIds;

/** 環境事件引擎可抽用的故障卡 ID */
export const INCIDENT_FAULT_IDS: readonly string[] = allCardIds.filter(
  (id) => CARDS[id].type === 'fault'
);

export function getCard(id: string): Card {
  const card = CARDS[id];
  if (!card) throw new Error(`未知卡牌 ID：${id}`);
  return card;
}

export function cardsByType(type: CardType): Card[] {
  return allCardIds.map((id) => CARDS[id]).filter((c) => c.type === type);
}
