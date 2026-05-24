// 牌庫瀏覽器（主題化）— 顯示全部卡牌，可依類別篩選。
import { useState } from 'react';
import { allCardIds, CARDS } from '../../core/cards';
import { Card } from './Card';
import { useTheme } from '../theme/ThemeContext';
import type { CardType } from '../styles/themes';
import { t } from '../../i18n';
import { useLocale } from '../locale/LocaleContext';

interface Props {
  readonly onClose: () => void;
}

const FILTER_KEYS: ReadonlyArray<CardType | 'all'> = ['all', 'turbine', 'tech', 'fault', 'func', 'weather', 'contract'];

export function LibraryModal({ onClose }: Props) {
  const { theme, themeKey } = useTheme();
  useLocale(); // 訂閱語言切換，觸發重新渲染
  const [filter, setFilter] = useState<CardType | 'all'>('all');
  const filtered = filter === 'all' ? allCardIds : allCardIds.filter((id) => CARDS[id].type === filter);

  const filterLabel = (k: CardType | 'all'): string => {
    if (k === 'all') return t('category.all');
    return t(`category.${k}` as Parameters<typeof t>[0]);
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
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(960px, 95%)',
          maxHeight: '85%',
          background: themeKey === 'tideboard' ? 'linear-gradient(180deg, #3d2a1e, #2a1810)' : '#fff',
          border: themeKey === 'tideboard' ? '3px solid #c89848' : '1px solid rgba(28,42,58,0.1)',
          borderRadius: themeKey === 'tideboard' ? 0 : 16,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: theme.textPrimary,
          fontFamily: theme.fontUI,
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: themeKey === 'tideboard' ? '2px solid #c89848' : '1px solid rgba(28,42,58,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: themeKey === 'tideboard' ? '"Cinzel", Georgia, serif' : theme.fontUI,
                letterSpacing: themeKey === 'tideboard' ? '0.1em' : 0,
                color: themeKey === 'tideboard' ? '#f4d68a' : '#1c2a3a',
              }}
            >
              {themeKey === 'tideboard' ? t('library.title.tideboard') : t('library.title.cumulus')}
            </span>
            <span style={{ fontSize: 11, color: theme.textSecondary }}>{t('library.count', { n: filtered.length })}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: theme.textPrimary,
              fontSize: 22,
              padding: '4px 10px',
              fontFamily: 'inherit',
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            padding: '10px 24px',
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            borderBottom: themeKey === 'tideboard' ? '1px solid #6e4a18' : '1px solid rgba(28,42,58,0.06)',
          }}
        >
          {FILTER_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              style={{
                padding: '4px 12px',
                background:
                  filter === k
                    ? themeKey === 'tideboard'
                      ? '#c89848'
                      : '#1c2a3a'
                    : themeKey === 'tideboard'
                      ? 'transparent'
                      : 'rgba(28,42,58,0.05)',
                color:
                  filter === k
                    ? themeKey === 'tideboard'
                      ? '#3d2a1e'
                      : '#fff'
                    : theme.textPrimary,
                border: themeKey === 'tideboard' ? '1px solid #c89848' : 'none',
                borderRadius: themeKey === 'tideboard' ? 0 : 999,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {filterLabel(k)}
            </button>
          ))}
        </div>
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 18,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 14,
            alignContent: 'start',
          }}
        >
          {filtered.map((id) => (
            <div key={id} style={{ display: 'flex', justifyContent: 'center' }}>
              <Card cardId={id} size={146} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
