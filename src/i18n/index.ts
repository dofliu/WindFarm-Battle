import { zhTW } from './zh-TW';
import type { MessageKey } from './zh-TW';
import { cardsZhTW } from './cards.zh-TW';

// UI 字串 + 卡牌文案合併為單一查詢表
const messages: Record<string, string> = { ...zhTW, ...cardsZhTW };

/** 取字串並做 {param} 插值。key 容許動態字串（例 category.<type>）。 */
export function t(key: MessageKey | string, params?: Record<string, string | number>): string {
  const template = messages[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_match, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  );
}

// 卡牌文案輔助（UI/測試用）
export const cardName = (id: string): string => t(`cards.${id}.name`);
export const cardFlavor = (id: string): string => t(`cards.${id}.flavor`);
export const abilityName = (id: string, i: number): string => t(`cards.${id}.ability.${i}.name`);
export const abilityDesc = (id: string, i: number): string => t(`cards.${id}.ability.${i}.desc`);
