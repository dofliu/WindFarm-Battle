// ============================================================
// LocaleContext — 全域語言切換 React Context
//
// 使用方式：
//   const { locale, setLocale } = useLocale();
//
// 注意：切換語言後，所有使用 t() 的元件需重新渲染才能看到效果。
// 本 Context 提供 locale state，讓元件可以訂閱語言變化。
// ============================================================
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { setLocale as i18nSetLocale, getLocale, type Locale } from '../../i18n';

interface LocaleContextValue {
  readonly locale: Locale;
  readonly setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'zh-TW',
  setLocale: () => undefined,
});

export function LocaleProvider({ children }: { readonly children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  const setLocale = useCallback((next: Locale) => {
    i18nSetLocale(next);
    setLocaleState(next);
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
