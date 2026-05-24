// 語言切換按鈕（ZH ↔ EN）
import { useLocale } from '../locale/LocaleContext';

interface Props {
  readonly style?: React.CSSProperties;
}

export function LocaleSwitcher({ style }: Props) {
  const { locale, setLocale } = useLocale();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'zh-TW' ? 'en' : 'zh-TW')}
      title={locale === 'zh-TW' ? 'Switch to English' : '切換為中文'}
      style={{
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.25)',
        color: 'inherit',
        padding: '4px 12px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        cursor: 'pointer',
        fontFamily: 'inherit',
        ...style,
      }}
    >
      {locale === 'zh-TW' ? 'EN' : '中文'}
    </button>
  );
}
