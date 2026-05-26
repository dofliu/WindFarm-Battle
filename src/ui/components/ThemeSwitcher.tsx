// 主題切換小面板（modal）。
import { useTheme } from '../theme/ThemeContext';
import { THEMES } from '../styles/themes';
import type { ThemeKey } from '../styles/themes';
import { t } from '../../i18n';
import { useLocale } from '../locale/LocaleContext';

interface Props {
  readonly onClose: () => void;
}

export function ThemeSwitcher({ onClose }: Props) {
  useLocale(); // 訂閱語言切換，觸發重新渲染
  const { themeKey, setTheme } = useTheme();
  const select = (k: ThemeKey) => {
    setTheme(k);
    onClose();
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 500,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          color: '#1c2a3a',
          borderRadius: 16,
          padding: 24,
          minWidth: 360,
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, marginBottom: 4 }}>{t('theme.title')}</h2>
        <p style={{ fontSize: 12, color: '#6a7888', margin: 0, marginBottom: 16 }}>{t('theme.subtitle')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {(['cumulus', 'tideboard'] as const).map((k) => {
            const theme = THEMES[k];
            const active = themeKey === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => select(k)}
                style={{
                  position: 'relative',
                  padding: 16,
                  borderRadius: 12,
                  border: active ? '2px solid #3aa7c8' : '1px solid rgba(28,42,58,0.1)',
                  background: k === 'cumulus' ? 'linear-gradient(180deg,#d8ecf4,#f4e9dc)' : 'linear-gradient(180deg,#b5997a,#6b5240)',
                  color: k === 'cumulus' ? '#1c2a3a' : '#f4e8d0',
                  fontFamily: theme.fontUI,
                  textAlign: 'left',
                  cursor: 'pointer',
                  minHeight: 120,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{theme.name}</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>
                  {k === 'cumulus' ? t('theme.cumulus.desc') : t('theme.tideboard.desc')}
                </div>
                {active && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: '#3aa7c8',
                      color: '#fff',
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {t('theme.active')}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              border: '1px solid rgba(28,42,58,0.15)',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: '#1c2a3a',
            }}
          >
            {t('theme.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
