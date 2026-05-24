import { zhTW } from './zh-TW';
import type { MessageKey } from './zh-TW';
import { cardsZhTW } from './cards.zh-TW';
import { en } from './en';
import { cardsEn } from './cards.en';

// ── 支援的語言 ────────────────────────────────────────────
export type Locale = 'zh-TW' | 'en';

const MESSAGES: Record<Locale, Record<string, string>> = {
  'zh-TW': { ...zhTW, ...cardsZhTW },
  'en':    { ...en,   ...cardsEn   },
};

// ── 當前語言（模組級單例，可透過 setLocale 切換）────────────────
let _locale: Locale = 'zh-TW';

/** 取得目前語言代碼 */
export function getLocale(): Locale {
  return _locale;
}

/** 切換語言（'zh-TW' | 'en'） */
export function setLocale(locale: Locale): void {
  _locale = locale;
}

/** 取字串並做 {param} 插値。key 容許動態字串（例 category.<type>）。 */
export function t(key: MessageKey | string, params?: Record<string, string | number>): string {
  const messages = MESSAGES[_locale] ?? MESSAGES['zh-TW'];
  // 若當前語言找不到，回退到中文
  const template = messages[key] ?? MESSAGES['zh-TW'][key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_match, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  );
}

// 卡牌文案輔助（UI/測試用）
export const cardName   = (id: string): string => t(`cards.${id}.name`);
export const cardFlavor = (id: string): string => t(`cards.${id}.flavor`);
export const abilityName = (id: string, i: number): string => t(`cards.${id}.ability.${i}.name`);
export const abilityDesc = (id: string, i: number): string => t(`cards.${id}.ability.${i}.desc`);
