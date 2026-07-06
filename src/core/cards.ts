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

/**
 * Route B：可入牌組的卡牌 ID 列表（排除開局艦隊 OS8/OS10/OS12 及已汰除的低 MW 升級牌）。
 * 這是遊戲開始時用來建構玩家牌組的卡池，也是牌庫耗盡時重洗的基準。
 *
 * 排除清單：
 *   - OS8/OS10/OS12：開局預部署，不進牌組
 *   - M01–M06, M08, M11：低 MW 陸域機組（≤8MW），對離岸固定艦隊無升級意義
 */
const STARTING_FLEET_IDS = new Set(['OS8', 'OS10', 'OS12']);
// M01-M04 已從此清單移出，作為升級卡（UP01-UP03）的基礎機組進入牌組
// M05、M06、M08、M11 仍保留在排除清單（對離岸固定艦隊無升級意義）
const RETIRED_UPGRADE_IDS = new Set(['M05', 'M06', 'M08', 'M11']);
export const deckCardIds: readonly string[] = allCardIds.filter(
  (id) => !STARTING_FLEET_IDS.has(id) && !RETIRED_UPGRADE_IDS.has(id),
);

/**
 * 同題競賽模式（weather-challenge）的抽牌池。
 * 在 deckCardIds 基礎上再排除：
 *   - 故障卡（type='fault'）：改由「環境事件引擎」共享施加，不再是玩家手牌武器
 *   - 新風機部署（type='turbine'，即 M01–M04）：風場固定為開局艦隊，僅可升級
 * 保留：技師 / 功能(含 UP 升級) / 天氣 / 合約。
 */
export const coopDeckCardIds: readonly string[] = deckCardIds.filter((id) => {
  const type = CARDS[id].type;
  return type !== 'fault' && type !== 'turbine';
});

/** 環境事件引擎可抽用的故障卡 ID（同題模式：同一事件同時砸向雙方）。 */
export const INCIDENT_FAULT_IDS: readonly string[] = allCardIds.filter((id) => CARDS[id].type === 'fault');

export function getCard(id: string): Card {
  const card = CARDS[id];
  if (!card) throw new Error(`未知卡牌 ID：${id}`);
  return card;
}

export function cardsByType(type: CardType): Card[] {
  return allCardIds.map((id) => CARDS[id]).filter((c) => c.type === type);
}
