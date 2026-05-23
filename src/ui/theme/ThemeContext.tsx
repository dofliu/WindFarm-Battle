// ============================================================
// ThemeContext：讓所有元件以 useTheme() 取得目前的 theme 物件。
// 切換主題會即時生效並寫入 localStorage（鍵：wfb-theme）。
// ============================================================
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Theme, ThemeKey } from '../styles/themes';
import { getTheme } from '../styles/themes';

interface ThemeContextValue {
  readonly themeKey: ThemeKey;
  readonly theme: Theme;
  readonly setTheme: (k: ThemeKey) => void;
  readonly toggleTheme: () => void;
}

const STORAGE_KEY = 'wfb-theme';
const DEFAULT_THEME: ThemeKey = 'cumulus';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeKey {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'cumulus' || v === 'tideboard') return v;
  } catch {
    /* ignore SSR / privacy mode */
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => readStoredTheme());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, themeKey);
    } catch {
      /* ignore */
    }
  }, [themeKey]);

  const setTheme = useCallback((k: ThemeKey) => setThemeKey(k), []);
  const toggleTheme = useCallback(
    () => setThemeKey((k) => (k === 'cumulus' ? 'tideboard' : 'cumulus')),
    [],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ themeKey, theme: getTheme(themeKey), setTheme, toggleTheme }),
    [themeKey, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme 必須在 <ThemeProvider> 內呼叫');
  return ctx;
}
