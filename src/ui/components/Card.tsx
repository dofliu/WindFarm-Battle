// ============================================================
// 主題化手牌卡片（Cumulus 圓潤 / Tideboard 木質羊皮）。
// 元件只吃資料 → 出視覺（CLAUDE.md §視覺與資料分離）。
// 中央 60% 為「藝術區」：目前用 StripedPlaceholder + SVG icon 佔位，
// 之後直接把藝術區換成 <img src="/cards/<id>.png" /> 即可，其餘不用動。
// ============================================================
import { forwardRef } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { CARDS } from '../../core/cards';
import { cardName } from '../../i18n';
import { useTheme } from '../theme/ThemeContext';
import { pickIcon, StripedPlaceholder } from '../icons';
import { getTypeColor, TYPE_META } from '../styles/themes';
import type { CardType } from '../styles/themes';

export interface CardProps {
  readonly cardId: string;
  readonly lifted?: boolean;
  readonly dragging?: boolean;
  readonly faded?: boolean;
  readonly size?: number;
  readonly style?: CSSProperties;
  readonly onMouseEnter?: () => void;
  readonly onMouseLeave?: () => void;
  readonly onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  readonly onClick?: () => void;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(props, ref) {
  const { cardId, lifted, dragging, faded, size = 138, style, onMouseEnter, onMouseLeave, onPointerDown, onClick } = props;
  const card = CARDS[cardId];
  const { theme, themeKey } = useTheme();
  if (!card) return null;
  const cardType = card.type as CardType;
  const IconComp = pickIcon(card.icon, cardType);
  const tc = getTypeColor(themeKey, cardType);
  const isLegendary = !!card.legendary;
  const name = cardName(cardId) || cardId;
  const mw = card.stats?.mw;
  const drop = card.stats?.drop;
  const duration = card.duration;
  const rarity = card.rarity ?? 1;
  const stripeId = `wf-card-${cardId}-${size}`;

  if (themeKey === 'tideboard') {
    return (
      <div
        ref={ref}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onPointerDown={onPointerDown}
        onClick={onClick}
        style={{
          width: size,
          height: size * 1.4,
          position: 'relative',
          opacity: faded ? 0.4 : 1,
          transform: dragging
            ? 'scale(1.12) rotate(-6deg)'
            : lifted
              ? 'translateY(-32px) scale(1.1)'
              : 'none',
          transition: dragging ? 'none' : 'transform 0.2s ease, opacity 0.2s',
          filter:
            lifted || dragging
              ? 'drop-shadow(0 14px 28px rgba(0,0,0,0.45))'
              : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
          cursor: onPointerDown || onClick ? 'pointer' : 'default',
          ...style,
        }}
      >
        <svg
          width={size}
          height={size * 1.4}
          viewBox={`0 0 ${size} ${size * 1.4}`}
          style={{ position: 'absolute', inset: 0 }}
        >
          <defs>
            <linearGradient id={`${stripeId}-parch`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f0e0c0" />
              <stop offset="100%" stopColor="#d8c098" />
            </linearGradient>
          </defs>
          <path
            d={`M 6 4 L ${size - 8} 6 L ${size - 4} ${size * 1.4 - 4} L 4 ${size * 1.4 - 6} Z`}
            fill={`url(#${stripeId}-parch)`}
            stroke="#3d2a1e"
            strokeWidth="1"
          />
          <rect
            x="8"
            y="8"
            width={size - 16}
            height={size * 1.4 - 16}
            fill="none"
            stroke={isLegendary ? '#d8a838' : '#c89848'}
            strokeWidth={2.5}
            opacity="0.9"
          />
          <rect x="11" y="11" width={size - 22} height={size * 1.4 - 22} fill="none" stroke="rgba(60,40,25,0.4)" strokeWidth="0.5" />
        </svg>
        {/* cost 圓寶石 */}
        <div
          style={{
            position: 'absolute',
            top: -6,
            left: -6,
            zIndex: 2,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #f4d68a, #c89848 50%, #6e4a18)',
            border: '2px solid #3d2a1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3d2a1e',
            fontSize: 15,
            fontWeight: 800,
            fontFamily: 'Georgia, serif',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          {card.cost}
        </div>
        {/* 卡名 */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 30,
            right: 12,
            zIndex: 1,
            fontSize: size * 0.085,
            fontWeight: 700,
            textAlign: 'center',
            color: '#3d2a1e',
            fontFamily: 'Georgia, serif',
          }}
        >
          {name}
        </div>
        {/* 藝術區 */}
        <div
          style={{
            position: 'absolute',
            top: size * 0.22,
            left: 12,
            right: 12,
            height: size * 0.6,
            zIndex: 1,
            background: '#3d2a1e',
            border: '1px solid #6e4a18',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <StripedPlaceholder width={size - 24} height={size * 0.6} stripe="rgba(232,200,120,0.15)" />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconComp size={size * 0.32} stroke={isLegendary ? '#f4d68a' : '#e8c878'} strokeWidth={1.3} />
          </div>
        </div>
        {/* 數值 */}
        <div
          style={{
            position: 'absolute',
            top: size * 0.86,
            left: 0,
            right: 0,
            zIndex: 1,
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            fontSize: size * 0.07,
            fontWeight: 700,
            fontFamily: 'Georgia, serif',
            color: '#3d2a1e',
          }}
        >
          {mw !== undefined && <span>⚡{mw}MW</span>}
          {drop !== undefined && <span style={{ color: '#a8453a' }}>-{drop}%</span>}
          {duration !== undefined && <span style={{ color: '#6e4a18' }}>{duration}回</span>}
        </div>
        {/* 稀有度 */}
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            left: 0,
            right: 0,
            zIndex: 1,
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          {Array.from({ length: rarity }, (_, i) => (
            <div
              key={i}
              style={{
                width: 5,
                height: 5,
                transform: 'rotate(45deg)',
                background: isLegendary ? '#d8a838' : '#c89848',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Cumulus
  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPointerDown={onPointerDown}
      onClick={onClick}
      style={{
        width: size,
        height: size * 1.43,
        borderRadius: 16,
        background: 'linear-gradient(180deg, #ffffff 0%, #e8eef2 100%)',
        border: isLegendary ? '2.5px solid #d9a85a' : '1.5px solid rgba(28,42,58,0.22)',
        boxShadow: lifted
          ? theme.shadowLifted
          : dragging
            ? theme.shadowDragged
            : '0 8px 22px rgba(28,42,58,0.18), 0 1px 0 rgba(255,255,255,0.7) inset',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        opacity: faded ? 0.4 : 1,
        transform: dragging
          ? 'scale(1.12) rotate(-4deg)'
          : lifted
            ? 'translateY(-32px) scale(1.1)'
            : 'none',
        transition: dragging ? 'none' : 'transform 0.2s ease, opacity 0.2s',
        cursor: onPointerDown || onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {/* cost 氣泡 */}
      <div
        style={{
          position: 'absolute',
          top: -6,
          left: -6,
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: tc.accent,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 800,
          fontFamily: theme.fontUI,
          boxShadow: '0 3px 10px rgba(28,42,58,0.2)',
          border: '2px solid #fff',
        }}
      >
        {card.cost}
      </div>
      {/* 卡類短標 */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 10,
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: tc.accent,
        }}
      >
        {TYPE_META[cardType].short}
      </div>
      {/* 藝術區 */}
      <div
        style={{
          marginTop: 14,
          height: size * 0.65,
          borderRadius: 10,
          background: `linear-gradient(180deg, hsl(${tc.hue}, 35%, 94%) 0%, hsl(${tc.hue}, 30%, 86%) 100%)`,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <StripedPlaceholder width={size - 20} height={size * 0.65} stripe={`hsla(${tc.hue}, 30%, 50%, 0.15)`} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconComp size={size * 0.36} stroke={tc.accent} strokeWidth={1.3} />
        </div>
      </div>
      {/* 卡名 */}
      <div style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, textAlign: 'center', marginTop: 6, fontFamily: theme.fontUI }}>
        {name}
      </div>
      {/* 數值 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, fontSize: 10, marginTop: 4 }}>
        {mw !== undefined && <span style={{ color: '#3aa7c8', fontWeight: 700 }}>⚡{mw}MW</span>}
        {drop !== undefined && <span style={{ color: '#a8453a', fontWeight: 700 }}>-{drop}%</span>}
        {duration !== undefined && <span style={{ color: '#a87a2a', fontWeight: 600 }}>{duration}回</span>}
      </div>
      {/* 稀有度（最多 5 顆，傳奇用金色）*/}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 1, marginTop: 'auto', fontSize: 9 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} style={{ color: i < rarity ? (isLegendary ? '#d9a85a' : '#1c2a3a') : 'rgba(28,42,58,0.15)' }}>
            ★
          </span>
        ))}
      </div>
    </div>
  );
});
