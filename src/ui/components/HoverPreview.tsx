// 手牌 hover 預覽：在卡片上方顯示能力描述（從 i18n 抓中文文案）。
import { CARDS } from '../../core/cards';
import { cardName, cardFlavor, abilityName, abilityDesc, t } from '../../i18n';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../locale/LocaleContext';
import { getTypeColor } from '../styles/themes';
import { pickIcon } from '../icons';
import type { CardType } from '../styles/themes';

interface Props {
  readonly cardId: string;
}

export function HoverPreview({ cardId }: Props) {
  useLocale(); // 訂閱語言切換，觸發重新渲染
  const card = CARDS[cardId];
  const { theme, themeKey } = useTheme();
  if (!card) return null;
  const cardType = card.type as CardType;
  const tc = getTypeColor(themeKey, cardType);
  const IconComp = pickIcon(card.icon, cardType);
  const name = cardName(cardId) || cardId;
  const flavor = cardFlavor(cardId);

  if (themeKey === 'tideboard') {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 240,
          padding: 14,
          zIndex: 100,
          background: 'linear-gradient(180deg, #f0e0c0, #d8c098)',
          border: '2px solid #c89848',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          color: '#3d2a1e',
          fontFamily: 'Georgia, serif',
          pointerEvents: 'none',
          animation: 'wf-fade-in 0.2s ease-out both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconComp size={24} stroke="#3d2a1e" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{name}</div>
            <div style={{ fontSize: 10, color: '#6e4a18', fontStyle: 'italic' }}>
              {card.iec
                ? t('card.iecCost').replace('{iec}', String(card.iec)).replace('{n}', String(card.cost))
                : t('card.cost').replace('{n}', String(card.cost))}
            </div>
          </div>
        </div>
        {card.abilities.length > 0 &&
          card.abilities.map((_ab, i) => (
            <div
              key={i}
              style={{
                marginTop: 8,
                padding: '6px 8px',
                background: 'rgba(245,225,180,0.6)',
                border: '1px solid rgba(110,74,24,0.3)',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a8453a' }}>{abilityName(cardId, i)}</div>
              <div style={{ fontSize: 10, marginTop: 2, lineHeight: 1.4 }}>{abilityDesc(cardId, i)}</div>
            </div>
          ))}
        {flavor && (
          <div
            style={{
              marginTop: 8,
              fontSize: 10,
              color: '#6e4a18',
              fontStyle: 'italic',
              borderTop: '1px solid rgba(110,74,24,0.3)',
              paddingTop: 6,
            }}
          >
            {flavor}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 240,
        padding: 14,
        zIndex: 100,
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 16px 40px rgba(28,42,58,0.2)',
        border: '1px solid rgba(28,42,58,0.08)',
        color: '#1c2a3a',
        fontFamily: theme.fontUI,
        pointerEvents: 'none',
        animation: 'wf-fade-in 0.2s ease-out both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `hsl(${tc.hue}, 35%, 92%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComp size={20} stroke={tc.accent} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{name}</div>
          <div style={{ fontSize: 10, color: '#6a7888' }}>
            {card.iec
              ? t('card.iecCost').replace('{iec}', String(card.iec)).replace('{n}', String(card.cost))
              : t('card.cost').replace('{n}', String(card.cost))}
          </div>
        </div>
      </div>
      {card.abilities.length > 0 &&
        card.abilities.map((_ab, i) => (
          <div key={i} style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, background: '#f7f5f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: tc.accent }}>{abilityName(cardId, i)}</div>
            <div style={{ fontSize: 10, color: '#3a4858', marginTop: 2, lineHeight: 1.4 }}>{abilityDesc(cardId, i)}</div>
          </div>
        ))}
      {flavor && (
        <div
          style={{
            marginTop: 8,
            fontSize: 10,
            color: '#8a98a8',
            fontStyle: 'italic',
            borderTop: '1px solid rgba(28,42,58,0.06)',
            paddingTop: 6,
          }}
        >
          {flavor}
        </div>
      )}
    </div>
  );
}
