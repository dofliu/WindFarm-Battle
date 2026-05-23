// Theme tokens — Cumulus (sky) and Tideboard (wood/brass).
// Used by all card / turbine / battlefield components.

const WF_THEMES = {
  cumulus: {
    name: "Cumulus · 雲海",
    // Background
    bgRoot: "linear-gradient(180deg, #d8ecf4 0%, #e9f1ee 35%, #f4e9dc 70%, #f0d8c3 100%)",
    bgPanel: "rgba(255,255,255,0.55)",
    bgPanelStrong: "rgba(255,255,255,0.85)",
    bgPanelDeep: "rgba(255,255,255,0.4)",
    bgOpponent: "linear-gradient(180deg, rgba(168,91,74,0.06) 0%, transparent 100%)",
    bgPlayer: "linear-gradient(180deg, transparent 0%, rgba(58,167,200,0.08) 100%)",
    // Text
    textPrimary: "#1c2a3a",
    textSecondary: "#6a7888",
    textMuted: "rgba(28,42,58,0.45)",
    textOnAccent: "#fff",
    // Accents
    primary: "#3aa7c8",        // sky blue
    primaryDeep: "#1c5c80",
    secondary: "#d9a85a",      // sand gold
    danger: "#d96c5a",
    success: "#5db58c",
    warning: "#d9a85a",
    enemy: "#a85b4a",
    // Borders + shadows
    border: "rgba(28,42,58,0.1)",
    borderStrong: "rgba(28,42,58,0.2)",
    shadow: "0 4px 16px rgba(28,42,58,0.08)",
    shadowLifted: "0 16px 40px rgba(28,42,58,0.2)",
    shadowDragged: "0 24px 50px rgba(28,42,58,0.35)",
    // Fonts
    fontUI: '"Manrope", "Inter", system-ui, sans-serif',
    fontDisplay: '"Manrope", "Inter", system-ui, sans-serif',
    fontMono: 'ui-monospace, "SF Mono", monospace',
    // Card-specific
    cardBg: "linear-gradient(180deg, #ffffff 0%, #f8f5ef 100%)",
    cardBorder: "rgba(28,42,58,0.12)",
    cardRadius: 16,
    cardBackBg: "linear-gradient(135deg, #a85b4a 0%, #8a4538 100%)",
    // Effects
    sparkColor: "#d9a85a",
    faultFlash: "#d96c5a",
    repairFlash: "#5db58c",
  },
  tideboard: {
    name: "Tideboard · 潮板",
    bgRoot: "radial-gradient(ellipse at center, #d8c5a8 0%, #b5997a 50%, #6b5240 100%)",
    bgPanel: "linear-gradient(180deg, rgba(40,25,15,0.85) 0%, rgba(40,25,15,0.5) 100%)",
    bgPanelStrong: "linear-gradient(180deg, #3d2a1e 0%, #2a1810 100%)",
    bgPanelDeep: "linear-gradient(180deg, rgba(30,18,8,0.9) 0%, rgba(30,18,8,0.95) 100%)",
    bgOpponent: "linear-gradient(180deg, rgba(168,69,58,0.15) 0%, transparent 100%)",
    bgPlayer: "linear-gradient(180deg, transparent 0%, rgba(232,200,120,0.12) 100%)",
    textPrimary: "#f4e8d0",
    textSecondary: "#c89848",
    textMuted: "rgba(244,232,208,0.5)",
    textOnAccent: "#3d2a1e",
    primary: "#c89848",        // brass
    primaryDeep: "#6e4a18",
    secondary: "#e8c878",
    danger: "#d96c5a",
    success: "#a8d878",
    warning: "#f4d68a",
    enemy: "#a8453a",
    border: "rgba(200,152,72,0.4)",
    borderStrong: "rgba(200,152,72,0.7)",
    shadow: "0 4px 16px rgba(0,0,0,0.4)",
    shadowLifted: "0 16px 40px rgba(0,0,0,0.5)",
    shadowDragged: "0 24px 50px rgba(0,0,0,0.6)",
    fontUI: '"Cormorant Garamond", "Source Serif Pro", Georgia, serif',
    fontDisplay: '"Cinzel", Georgia, serif',
    fontMono: 'ui-monospace, "SF Mono", monospace',
    cardBg: "linear-gradient(180deg, #f0e0c0 0%, #d8c098 100%)",
    cardBorder: "#3d2a1e",
    cardRadius: 4,
    cardBackBg: "linear-gradient(135deg, #6e4a18 0%, #3d2a1e 100%)",
    sparkColor: "#f4d68a",
    faultFlash: "#f4886a",
    repairFlash: "#a8d878",
  },
};

// Per-type color overrides (consistent across themes via hue rotation)
const WF_TYPE_THEME_COLORS = {
  cumulus: {
    turbine:  { hue: 200, accent: "#3aa7c8", soft: "#dbeef4" },
    tech:     { hue: 160, accent: "#5db58c", soft: "#dcefe4" },
    fault:    { hue: 8,   accent: "#d96c5a", soft: "#f4dcd6" },
    func:     { hue: 330, accent: "#d97a9c", soft: "#f4dce4" },
    weather:  { hue: 40,  accent: "#d9a85a", soft: "#f4e8d0" },
    contract: { hue: 270, accent: "#9d7fc8", soft: "#e6dcf4" },
  },
  tideboard: {
    turbine:  { hue: 200, accent: "#5cb8d8", soft: "#1a2c38" },
    tech:     { hue: 100, accent: "#a8d878", soft: "#2a3c20" },
    fault:    { hue: 8,   accent: "#e88a7a", soft: "#3c1c18" },
    func:     { hue: 330, accent: "#e8a8c8", soft: "#3c1c2c" },
    weather:  { hue: 40,  accent: "#f4d68a", soft: "#3c2c18" },
    contract: { hue: 270, accent: "#bda8e8", soft: "#2c2440" },
  },
};

// Themed icons stroke color for cards
const wfThemeOf = (themeKey) => WF_THEMES[themeKey] || WF_THEMES.cumulus;
const wfTypeColors = (themeKey, type) => (WF_TYPE_THEME_COLORS[themeKey] || WF_TYPE_THEME_COLORS.cumulus)[type];

Object.assign(window, { WF_THEMES, WF_TYPE_THEME_COLORS, wfThemeOf, wfTypeColors });
