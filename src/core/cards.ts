// 卡牌資料載入與查詢介面。資料來源＝src/data/cards.json（v4，47 張）。
import cardsJson from '../data/cards.json';
import type { Card, CardType } from './types';

interface CardsFile {
  readonly version: string;
  readonly totalCards: number;
  readonly categories: Readonly<Record<string, { count: number; color: string; label: string }>>;
  readonly rarity: Readonly<Record<string, string>>;
  readonly cards: Readonly<Record<string, Card>>;
}

const file = cardsJson as unknown as CardsFile;

export const CARDS: Readonly<Record<string, Card>> = file.cards;
export const allCardIds: readonly string[] = Object.keys(CARDS);
export const CARD_COUNT = allCardIds.length;

export function getCard(id: string): Card {
  const card = CARDS[id];
  if (!card) throw new Error(`未知卡牌 ID：${id}`);
  return card;
}

export function cardsByType(type: CardType): Card[] {
  return allCardIds.map((id) => CARDS[id]).filter((c) => c.type === type);
}
