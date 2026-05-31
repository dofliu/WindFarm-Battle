// ============================================================
// 場上機組牌位（兩主題）：
//   - Cumulus：圓角矩形卡 + 可用率血量條
//   - Tideboard：六角黃銅徽章 + 名牌
// 故障 / 修復 / 目標鎖定的視覺也在這裡。
// ============================================================
import { useState } from 'react';
import { CARDS } from '../../core/cards';
import { cardName, t } from '../../i18n';
import { useLocale } from '../locale/LocaleContext';
import type { DeployedTurbine } from '../../core/types';
import { useTheme } from '../theme/ThemeContext';
import { pickIcon, StripedPlaceholder, PowerBolt, TurbineOnshore, Crosshair } from '../icons';

// ── TurbineHoverTooltip ──────────────────────────────────────────────────────────────────────────────
interface TooltipProps {
  readonly turbine: DeployedTurbine;
  readonly themeKey: string;
  readonly fontUI: string;
}

function TurbineHoverTooltip({ turbine, themeKey, fontUI }: TooltipProps) {
  const card = CARDS[turbine.cardId];
  if (!card) return null;
  const baseMW = (card.stats?.mw ?? 0) + turbine.mwBonus;
  const dropTotal = turbine.faults.reduce((s, f) => s + f.drop, 0);
  const eff = Math.max(0, turbine.avail - dropTotal);
  const name = cardName(turbine.cardId) || turbine.cardId;
  const hasFaults = turbine.faults.length > 0;
  const shutdown = !!turbine.shutdown;
  const effColor = eff > 70 ? '#3a8a5e' : eff > 40 ? '#a87a2a' : '#a8453a';

  if (themeKey === 'tideboard') {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 10px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 220,
          padding: 12,
          zIndex: 200,
          background: 'linear-gradient(180deg, #f0e0c0, #d8c098)',
          border: '2px solid #c89848',
          boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
          color: '#3d2a1e',
          fontFamily: 'Georgia, serif',
          pointerEvents: 'none',
          animation: 'wf-fade-in 0.15s ease-out both',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, borderBottom: '1px solid rgba(110,74,24,0.4)', paddingBottom: 6 }}>
          {name}
        </div>
        {shutdown && (
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a8453a', marginBottom: 6, letterSpacing: '0.08em' }}>
            ⚠ {t('turbine.shutdown')}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
          <span style={{ color: '#6e4a18' }}>{t('turbine.effAvail')}</span>
          <span style={{ fontWeight: 700, color: effColor }}>{eff}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8 }}>
          <span style={{ color: '#6e4a18' }}>{t('turbine.mw')}</span>
          <span style={{ fontWeight: 700 }}>{baseMW}</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6e4a18', marginBottom: 4 }}>
          {hasFaults ? t('turbine.faultLabel') : t('turbine.noFaults')}
        </div>
        {hasFaults && turbine.faults.map((f, i) => {
          const fc = CARDS[f.cardId];
          const FIcon = pickIcon(fc?.icon, 'fault');
          const fName = cardName(f.cardId) || f.cardId;
          return (
            <div
              key={`${f.cardId}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 6px',
                marginBottom: 3,
                background: 'rgba(217,108,90,0.15)',
                border: '1px solid rgba(217,108,90,0.3)',
              }}
            >
              <FIcon size={10} stroke="#a8453a" />
              <span style={{ flex: 1, fontSize: 10 }}>{fName}</span>
              <span style={{ fontSize: 10, color: '#a8453a', fontWeight: 700 }}>
                {t('turbine.drop').replace('{n}', String(f.drop))}
              </span>
              <span style={{ fontSize: 9, color: '#6e4a18' }}>
                {t('turbine.roundsLeft').replace('{n}', String(f.roundsLeft))}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Cumulus tooltip
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 220,
        padding: 12,
        zIndex: 200,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 16px 40px rgba(28,42,58,0.22)',
        border: '1px solid rgba(28,42,58,0.08)',
        color: '#1c2a3a',
        fontFamily: fontUI,
        pointerEvents: 'none',
        animation: 'wf-fade-in 0.15s ease-out both',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, borderBottom: '1px solid rgba(28,42,58,0.08)', paddingBottom: 6 }}>
        {name}
      </div>
      {shutdown && (
        <div style={{ fontSize: 11, fontWeight: 700, color: '#a8453a', marginBottom: 6 }}>
          ⚠ {t('turbine.shutdown')}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: '#6a7888' }}>{t('turbine.effAvail')}</span>
        <span style={{ fontWeight: 700, color: effColor }}>{eff}%</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8 }}>
        <span style={{ color: '#6a7888' }}>{t('turbine.mw')}</span>
        <span style={{ fontWeight: 700 }}>{baseMW}</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#6a7888', marginBottom: 4 }}>
        {hasFaults ? t('turbine.faultLabel') : t('turbine.noFaults')}
      </div>
      {hasFaults && turbine.faults.map((f, i) => {
        const fc = CARDS[f.cardId];
        const FIcon = pickIcon(fc?.icon, 'fault');
        const fName = cardName(f.cardId) || f.cardId;
        return (
          <div
            key={`${f.cardId}-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              marginBottom: 3,
              borderRadius: 6,
              background: 'rgba(217,108,90,0.08)',
              border: '1px solid rgba(217,108,90,0.18)',
            }}
          >
            <FIcon size={10} stroke="#a8453a" />
            <span style={{ flex: 1, fontSize: 10 }}>{fName}</span>
            <span style={{ fontSize: 10, color: '#a8453a', fontWeight: 700 }}>
              {t('turbine.drop').replace('{n}', String(f.drop))}
            </span>
            <span style={{ fontSize: 9, color: '#8a98a8' }}>
              {t('turbine.roundsLeft').replace('{n}', String(f.roundsLeft))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  readonly turbine?: DeployedTurbine | null;
  readonly empty?: boolean;
  readonly targeted?: boolean;
  readonly slotIdx?: number;
  readonly onClick?: () => void;
}

export function Turbine({ turbine, empty, targeted, onClick }: Props) {
  const { theme, themeKey } = useTheme();
  useLocale(); // 訂閱語言切換，觸發重新渲染
  const [hovered, setHovered] = useState(false);

  if (empty || !turbine) {
    if (themeKey === 'tideboard') {
      return (
        <div style={{ width: 120, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
          <svg width="120" height="150" viewBox="0 0 120 150">
            <ellipse cx="60" cy="135" rx="42" ry="6" fill="rgba(0,0,0,0.3)" />
            <circle cx="60" cy="80" r="50" fill="none" stroke="rgba(200,152,72,0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>
        </div>
      );
    }
    return (
      <div
        style={{
          width: 168,
          height: 200,
          borderRadius: 22,
          border: '1.5px dashed rgba(28,42,58,0.18)',
          background: 'rgba(255,255,255,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 6,
          color: 'rgba(28,42,58,0.35)',
        }}
      >
        <TurbineOnshore size={28} stroke="currentColor" strokeWidth={1.2} />
        <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' }}>空缺</span>
      </div>
    );
  }

  const card = CARDS[turbine.cardId];
  if (!card) return null;
  const IconComp = pickIcon(card.icon, card.type);
  const baseMW = (card.stats?.mw ?? 0) + turbine.mwBonus;
  const dropTotal = turbine.faults.reduce((s, f) => s + f.drop, 0);
  const eff = Math.max(0, turbine.avail - dropTotal);
  const isLegendary = !!card.legendary;
  const hasFaults = turbine.faults.length > 0;
  const name = cardName(turbine.cardId) || turbine.cardId;
  const shutdown = !!turbine.shutdown;

  if (themeKey === 'tideboard') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          all: 'unset',
          position: 'relative',
          width: 120,
          height: 160,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: onClick ? 'pointer' : 'default',
          transform: targeted ? 'scale(1.05)' : 'none',
          transition: 'transform 0.3s cubic-bezier(.2,.7,.3,1.4)',
          opacity: shutdown ? 0.55 : 1,
        }}
      >
        {hovered && (
          <TurbineHoverTooltip turbine={turbine} themeKey={themeKey} fontUI={theme.fontUI} />
        )}
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 90,
            height: 14,
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
          }}
        />
        <svg width="120" height="150" viewBox="0 0 120 150" style={{ position: 'absolute', top: 0 }}>
          <defs>
            <radialGradient id={`tt-brass-${turbine.cardId}`} cx="50%" cy="30%" r="80%">
              <stop offset="0%" stopColor={isLegendary ? '#f8e094' : '#e8c878'} />
              <stop offset="50%" stopColor={isLegendary ? '#d8a838' : '#c89848'} />
              <stop offset="100%" stopColor="#6e4a18" />
            </radialGradient>
          </defs>
          <path
            d="M60 8 L102 30 L102 90 L60 112 L18 90 L18 30 Z"
            fill={`url(#tt-brass-${turbine.cardId})`}
            stroke={targeted ? '#d96c5a' : '#3d2a1e'}
            strokeWidth={targeted ? 3 : 1.5}
          />
          <path d="M60 14 L97 33 L97 87 L60 106 L23 87 L23 33 Z" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
          <path d="M60 24 L88 39 L88 76 L60 91 L32 76 L32 39 Z" fill="#3d2a1e" />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle, rgba(58,167,200,0.4) 0%, #3d2a1e 100%)',
            borderRadius: '50%',
          }}
        >
          <IconComp size={36} stroke="#e8c878" strokeWidth={1.3} />
        </div>
        {/* MW 寶石 */}
        <div
          style={{
            position: 'absolute',
            top: -4,
            left: -4,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #f4d68a, #c89848 60%, #6e4a18)',
            border: '2px solid #3d2a1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3d2a1e',
            fontSize: 13,
            fontWeight: 800,
            fontFamily: 'Georgia, serif',
          }}
        >
          {baseMW}
        </div>
        {/* 可用率寶石 */}
        <div
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background:
              eff > 70
                ? 'radial-gradient(circle at 30% 30%, #b5d68a, #5db58c 60%, #2a5a3c)'
                : eff > 40
                  ? 'radial-gradient(circle at 30% 30%, #f4c878, #d9a85a 60%, #6e4a18)'
                  : 'radial-gradient(circle at 30% 30%, #f4886a, #d96c5a 60%, #6e2818)',
            border: '2px solid #3d2a1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            fontFamily: 'Georgia, serif',
          }}
        >
          {eff}
        </div>
        {/* 名牌 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, #3d2a1e 0%, #2a1810 100%)',
            border: '1px solid #c89848',
            padding: '2px 12px',
            borderRadius: 4,
            color: '#e8c878',
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            fontFamily: 'Georgia, serif',
            maxWidth: 130,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </div>
        {isLegendary && (
          <div
            style={{
              position: 'absolute',
              top: -16,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 14,
              color: '#f8e094',
              textShadow: '0 0 8px #d8a838, 0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            ♛
          </div>
        )}
        {hasFaults && (
          <div
            style={{
              position: 'absolute',
              inset: '20px 16px 26px 16px',
              border: '2px solid #d96c5a',
              borderRadius: 4,
              background: 'radial-gradient(circle, rgba(217,108,90,0) 30%, rgba(217,108,90,0.3) 100%)',
              pointerEvents: 'none',
              animation: 'wf-fault-pulse 1.5s ease-in-out infinite',
            }}
          />
        )}
        {targeted && <TargetReticle />}
      </button>
    );
  }

  // Cumulus
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #c5dde8 100%)',
        border: targeted ? '3px solid #d96c5a' : isLegendary ? '3px solid #d9a85a' : '2.5px solid #2a5a78',
        padding: 10,
        margin: 0,
        font: 'inherit',
        color: 'inherit',
        textAlign: 'inherit',
        position: 'relative',
        width: 168,
        height: 200,
        borderRadius: 22,
        boxShadow: targeted
          ? '0 0 0 6px rgba(217,108,90,0.18), 0 14px 36px rgba(217,108,90,0.35)'
          : isLegendary
            ? '0 14px 36px rgba(217,168,90,0.4), 0 0 0 4px rgba(217,168,90,0.18)'
            : '0 12px 28px rgba(28,90,120,0.28), 0 1px 0 rgba(255,255,255,0.9) inset',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        cursor: onClick ? 'pointer' : 'default',
        transform: targeted ? 'scale(1.03)' : 'none',
        transition: 'transform 0.3s cubic-bezier(.2,.7,.3,1.4)',
        opacity: shutdown ? 0.55 : 1,
      }}
    >
      {hovered && (
        <TurbineHoverTooltip turbine={turbine} themeKey={themeKey} fontUI={theme.fontUI} />
      )}
      {/* 藝術區 */}
      <div
        style={{
          position: 'relative',
          height: 96,
          borderRadius: 12,
          background: 'linear-gradient(180deg, hsl(200, 40%, 92%) 0%, hsl(200, 30%, 82%) 100%)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <StripedPlaceholder width={144} height={96} stripe="hsla(200, 30%, 50%, 0.15)" />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconComp size={56} stroke="#3aa7c8" strokeWidth={1.2} />
        </div>
        {isLegendary && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: '#d9a85a',
              color: '#fff',
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.1em',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            傳奇
          </div>
        )}
        {shutdown && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(28,42,58,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.18em',
            }}
          >
            停機
          </div>
        )}
      </div>
      {/* 名稱 */}
      <div style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, fontFamily: theme.fontUI }}>{name}</div>
      {/* 數值 + 可用率條 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PowerBolt size={11} stroke="#3aa7c8" fill="#3aa7c8" />
          <span style={{ fontWeight: 700, color: theme.textPrimary }}>{baseMW}</span>
        </div>
        <div style={{ flex: 1, height: 4, background: 'rgba(28,42,58,0.08)', borderRadius: 999, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.max(4, eff)}%`,
              background: eff > 70 ? '#5db58c' : eff > 40 ? '#d9a85a' : '#d96c5a',
              borderRadius: 999,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: eff > 70 ? '#3a8a5e' : eff > 40 ? '#a87a2a' : '#a8453a',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {eff}%
        </span>
      </div>
      {/* 故障標籤 */}
      {hasFaults && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {turbine.faults.map((f, i) => {
            const fc = CARDS[f.cardId];
            const FIcon = pickIcon(fc?.icon, 'fault');
            return (
              <div
                key={`${f.cardId}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '2px 6px',
                  background: 'rgba(217,108,90,0.12)',
                  border: '1px solid rgba(217,108,90,0.25)',
                  borderRadius: 6,
                  fontSize: 9,
                  fontWeight: 600,
                  color: '#a8453a',
                }}
              >
                <FIcon size={10} stroke="#a8453a" />
                <span>-{f.drop}%</span>
              </div>
            );
          })}
        </div>
      )}
      {targeted && <TargetReticle />}
    </button>
  );
}

function TargetReticle() {
  return (
    <div style={{ position: 'absolute', inset: -8, pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="22"
          fill="none"
          stroke="#d96c5a"
          strokeWidth="2"
          strokeDasharray="6 4"
          style={{ animation: 'wf-target-spin 4s linear infinite' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: -22,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#d96c5a',
          color: '#fff',
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 9px',
          borderRadius: 6,
          letterSpacing: '0.1em',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Crosshair size={11} stroke="#fff" />
        目標
      </div>
    </div>
  );
}
