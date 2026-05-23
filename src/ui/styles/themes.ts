// ============================================================
// Theme tokens（從 proto/themes.js 轉 TS）— 雙主題：Cumulus 雲海 / Tideboard 潮板
// 兩個主題共用同一份遊戲版面，只是色彩、字體、卡片造型不同。
// ============================================================

export type ThemeKey = 'cumulus' | 'tideboard';
export type CardType = 'turbine' | 'tech' | 'fault' | 'func' | 'weather' | 'contract';

export interface Theme {
  readonly key: ThemeKey;
  readonly name: string;
  // 背景 / 面板
  readonly bgRoot: string;
  readonly bgPanel: string;
  readonly bgPanelStrong: string;
  readonly bgPanelDeep: string;
  readonly bgOpponent: string;
  readonly bgPlayer: string;
  // 文字
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly textOnAccent: string;
  // 強調色
  readonly primary: string;
  readonly primaryDeep: string;
  readonly secondary: string;
  readonly danger: string;
  readonly success: string;
  readonly warning: string;
  readonly enemy: string;
  // 邊框與陰影
  readonly border: string;
  readonly borderStrong: string;
  readonly shadow: string;
  readonly shadowLifted: string;
  readonly shadowDragged: string;
  // 字體
  readonly fontUI: string;
  readonly fontDisplay: string;
  readonly fontMono: string;
  // 卡片
  readonly cardBg: string;
  readonly cardBorder: string;
  readonly cardRadius: number;
  readonly cardBackBg: string;
  // 特效
  readonly sparkColor: string;
  readonly faultFlash: string;
  readonly repairFlash: string;
}

export const THEMES: Readonly<Record<ThemeKey, Theme>> = {
  cumulus: {
    key: 'cumulus',
    name: 'Cumulus · 雲海',
    bgRoot: 'linear-gradient(180deg, #d8ecf4 0%, #e9f1ee 35%, #f4e9dc 70%, #f0d8c3 100%)',
    bgPanel: 'rgba(255,255,255,0.55)',
    bgPanelStrong: 'rgba(255,255,255,0.85)',
    bgPanelDeep: 'rgba(255,255,255,0.4)',
    bgOpponent: 'linear-gradient(180deg, rgba(168,91,74,0.06) 0%, transparent 100%)',
    bgPlayer: 'linear-gradient(180deg, transparent 0%, rgba(58,167,200,0.08) 100%)',
    textPrimary: '#1c2a3a',
    textSecondary: '#6a7888',
    textMuted: 'rgba(28,42,58,0.45)',
    textOnAccent: '#fff',
    primary: '#3aa7c8',
    primaryDeep: '#1c5c80',
    secondary: '#d9a85a',
    danger: '#d96c5a',
    success: '#5db58c',
    warning: '#d9a85a',
    enemy: '#a85b4a',
    border: 'rgba(28,42,58,0.1)',
    borderStrong: 'rgba(28,42,58,0.2)',
    shadow: '0 4px 16px rgba(28,42,58,0.08)',
    shadowLifted: '0 16px 40px rgba(28,42,58,0.2)',
    shadowDragged: '0 24px 50px rgba(28,42,58,0.35)',
    fontUI: '"Manrope", "Inter", system-ui, sans-serif',
    fontDisplay: '"Manrope", "Inter", system-ui, sans-serif',
    fontMono: 'ui-monospace, "SF Mono", monospace',
    cardBg: 'linear-gradient(180deg, #ffffff 0%, #f8f5ef 100%)',
    cardBorder: 'rgba(28,42,58,0.12)',
    cardRadius: 16,
    cardBackBg: 'linear-gradient(135deg, #a85b4a 0%, #8a4538 100%)',
    sparkColor: '#d9a85a',
    faultFlash: '#d96c5a',
    repairFlash: '#5db58c',
  },
  tideboard: {
    key: 'tideboard',
    name: 'Tideboard · 潮板',
    bgRoot: 'radial-gradient(ellipse at center, #d8c5a8 0%, #b5997a 50%, #6b5240 100%)',
    bgPanel: 'linear-gradient(180deg, rgba(40,25,15,0.85) 0%, rgba(40,25,15,0.5) 100%)',
    bgPanelStrong: 'linear-gradient(180deg, #3d2a1e 0%, #2a1810 100%)',
    bgPanelDeep: 'linear-gradient(180deg, rgba(30,18,8,0.9) 0%, rgba(30,18,8,0.95) 100%)',
    bgOpponent: 'linear-gradient(180deg, rgba(168,69,58,0.15) 0%, transparent 100%)',
    bgPlayer: 'linear-gradient(180deg, transparent 0%, rgba(232,200,120,0.12) 100%)',
    textPrimary: '#f4e8d0',
    textSecondary: '#c89848',
    textMuted: 'rgba(244,232,208,0.5)',
    textOnAccent: '#3d2a1e',
    primary: '#c89848',
    primaryDeep: '#6e4a18',
    secondary: '#e8c878',
    danger: '#d96c5a',
    success: '#a8d878',
    warning: '#f4d68a',
    enemy: '#a8453a',
    border: 'rgba(200,152,72,0.4)',
    borderStrong: 'rgba(200,152,72,0.7)',
    shadow: '0 4px 16px rgba(0,0,0,0.4)',
    shadowLifted: '0 16px 40px rgba(0,0,0,0.5)',
    shadowDragged: '0 24px 50px rgba(0,0,0,0.6)',
    fontUI: '"Cormorant Garamond", "Source Serif Pro", Georgia, serif',
    fontDisplay: '"Cinzel", Georgia, serif',
    fontMono: 'ui-monospace, "SF Mono", monospace',
    cardBg: 'linear-gradient(180deg, #f0e0c0 0%, #d8c098 100%)',
    cardBorder: '#3d2a1e',
    cardRadius: 4,
    cardBackBg: 'linear-gradient(135deg, #6e4a18 0%, #3d2a1e 100%)',
    sparkColor: '#f4d68a',
    faultFlash: '#f4886a',
    repairFlash: '#a8d878',
  },
};

export interface TypeColor {
  readonly hue: number;
  readonly accent: string;
  readonly soft: string;
}

export const TYPE_COLORS: Readonly<Record<ThemeKey, Readonly<Record<CardType, TypeColor>>>> = {
  cumulus: {
    turbine: { hue: 200, accent: '#3aa7c8', soft: '#dbeef4' },
    tech: { hue: 160, accent: '#5db58c', soft: '#dcefe4' },
    fault: { hue: 8, accent: '#d96c5a', soft: '#f4dcd6' },
    func: { hue: 330, accent: '#d97a9c', soft: '#f4dce4' },
    weather: { hue: 40, accent: '#d9a85a', soft: '#f4e8d0' },
    contract: { hue: 270, accent: '#9d7fc8', soft: '#e6dcf4' },
  },
  tideboard: {
    turbine: { hue: 200, accent: '#5cb8d8', soft: '#1a2c38' },
    tech: { hue: 100, accent: '#a8d878', soft: '#2a3c20' },
    fault: { hue: 8, accent: '#e88a7a', soft: '#3c1c18' },
    func: { hue: 330, accent: '#e8a8c8', soft: '#3c1c2c' },
    weather: { hue: 40, accent: '#f4d68a', soft: '#3c2c18' },
    contract: { hue: 270, accent: '#bda8e8', soft: '#2c2440' },
  },
};

export interface TypeMeta {
  readonly name: string;
  readonly short: string;
}

export const TYPE_META: Readonly<Record<CardType, TypeMeta>> = {
  turbine: { name: '機組', short: 'MW' },
  tech: { name: '技師', short: 'TECH' },
  fault: { name: '故障', short: 'FAULT' },
  func: { name: '功能', short: 'FUNC' },
  weather: { name: '天氣', short: 'WX' },
  contract: { name: '合約', short: 'PACT' },
};

export function getTheme(key: ThemeKey): Theme {
  return THEMES[key];
}

export function getTypeColor(themeKey: ThemeKey, type: CardType): TypeColor {
  return TYPE_COLORS[themeKey][type];
}
