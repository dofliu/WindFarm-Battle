// ============================================================
// 教學知識對應（純函式，core 層）。
//
// 把卡牌資料中的教學欄位（faultCategory / specialty / iec）整理成
// 查詢介面，供「學習複盤」分析（learning.ts）與 UI 教學解說使用。
//
// 內容鐵則（DESIGN.md Part 1）：教學情境真實——故障類別、修復流程、
// IEC 標準都對應實際風電運維。文案（真實情境描述、IEC 標題）抽到 i18n（D3），
// 本檔只留「結構對應」，不含任何顯示字串。
// ============================================================
import type { FaultCategory } from './types';
import { CARDS } from './cards';

/** 五種故障分類（Route B 知識-效能模型的核心維度）。 */
export const FAULT_CATEGORIES: readonly FaultCategory[] = [
  'mechanical',
  'blade',
  'electrical',
  'sensor',
  'hydraulic',
] as const;

/** 故障卡的分類；非故障卡或未標註 → undefined。 */
export function categoryOf(faultId: string): FaultCategory | undefined {
  return CARDS[faultId]?.faultCategory;
}

/** 技師卡的專長分類；通用技師（T01/T07/T09）或非技師 → undefined。 */
export function specialtyOf(techId: string): FaultCategory | undefined {
  return CARDS[techId]?.specialty;
}

/** 卡牌對應的 IEC 61400 系列標準碼（例 "61400-4"）；未標註 → undefined。 */
export function iecOf(cardId: string): string | undefined {
  return CARDS[cardId]?.iec;
}

/** 該 ID 是否為技師卡（用來判斷 fault-repaired.by 是技師還是共享資源）。 */
export function isTechCard(id: string): boolean {
  return CARDS[id]?.type === 'tech';
}

/**
 * 專長是否對應故障類別（知識-效能模型：相符＝完全修復）。
 * 注意：實際修復品質以 rules-engine 產生的 fault-repaired.quality 為準，
 * 此函式僅供 UI 教學解說「若換對專長會如何」的推演。
 */
export function specialtyMatchesFault(techId: string, faultId: string): boolean {
  const sp = specialtyOf(techId);
  const cat = categoryOf(faultId);
  return !!(sp && cat && sp === cat);
}

/**
 * 找出能「完全修復」某故障類別的技師卡 ID（specialty 相符）。
 * 供教學解說推薦「這種故障該找誰」。
 */
export function specialistsFor(category: FaultCategory): string[] {
  return Object.keys(CARDS).filter((id) => CARDS[id].type === 'tech' && CARDS[id].specialty === category);
}
