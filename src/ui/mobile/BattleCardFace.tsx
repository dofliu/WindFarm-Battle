// ============================================================
// BattleCardFace — 場上技師的「真卡面」（Pokemon TCG Pocket 式）。
//
// 設計哲學：卡牌本身就是 UI——照片為主體、疲勞條（=HP 條）在卡頂、
// Lv 徽章疊照片、底部只留卡名與專長。說明文字一律不放卡面（點卡放大看）。
// 手機直向主戰場元件；主力大卡 / 備戰小卡共用，尺寸由 width 控制。
// ============================================================
import { useState } from 'react';
import type { DeployedTech } from '../../core/types';
import { CARDS } from '../../core/cards';
import { cardName, t } from '../../i18n';

const SPEC_ICON: Record<string, string> = {
  mechanical: '⚙️',
  blade: '🪂',
  electrical: '⚡',
  sensor: '📡',
  hydraulic: '💧',
};

/** 卡照片（image → {id}.jpg fallback；全失敗顯示 icon） */
function CardPhoto({ cardId, height }: { readonly cardId: string; readonly height: number }) {
  const card = CARDS[cardId];
  const candidates = [card?.image, `/cards/${cardId}.jpg`].filter(Boolean) as string[];
  const [idx, setIdx] = useState(0);
  if (idx >= candidates.length) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: height * 0.45, background: '#12202f' }}>
        {card?.icon ?? '🔧'}
      </div>
    );
  }
  return (
    <img
      src={candidates[idx]}
      alt={cardName(cardId) || cardId}
      style={{ width: '100%', height, objectFit: 'cover', display: 'block' }}
      loading="lazy"
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

interface Props {
  readonly tech: DeployedTech;
  readonly width: number;
  /** 主力卡：綠色氣場框 */
  readonly isActive?: boolean;
  /** 這回合已出招：右上灰標 */
  readonly dimUsed?: boolean;
  readonly onClick?: () => void;
}

export function BattleCardFace({ tech, width, isActive, dimUsed, onClick }: Props) {
  const card = CARDS[tech.cardId];
  const name = cardName(tech.cardId) || tech.cardId;
  const height = width * 1.4;
  const photoH = height * 0.56;
  const staminaPct = Math.max(0, Math.min(1, tech.stamina / tech.maxStamina));
  const staminaColor = staminaPct > 0.5 ? '#34d399' : staminaPct > 0.25 ? '#fbbf24' : '#f87171';
  const specIcon = card.specialty ? SPEC_ICON[card.specialty] ?? '🔧' : '🔧';
  const specLabel = card.specialty ? t(`category.${card.specialty}`) : t('category.general');
  const big = width >= 120;
  const toolIcon = tech.attachedToolId ? CARDS[tech.attachedToolId]?.icon ?? '🧰' : null;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        width,
        height,
        borderRadius: width * 0.075,
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(180deg, #1b2a3d, #101c2b)',
        border: isActive ? '2.5px solid #34d399' : '1.5px solid rgba(148,180,220,0.35)',
        boxShadow: isActive
          ? '0 0 18px rgba(52,211,153,0.45), 0 8px 20px rgba(0,0,0,0.5)'
          : '0 6px 16px rgba(0,0,0,0.45)',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* 卡頂：疲勞條（=HP） */}
      <div style={{ padding: `${width * 0.045}px ${width * 0.06}px 0`, display: 'flex', alignItems: 'center', gap: width * 0.04 }}>
        <div style={{ flex: 1, height: Math.max(5, width * 0.055), borderRadius: 999, background: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${staminaPct * 100}%`,
              height: '100%',
              borderRadius: 999,
              background: staminaColor,
              transition: 'width 0.4s ease, background 0.4s',
            }}
          />
        </div>
        <span style={{ fontSize: Math.max(10, width * 0.1), fontWeight: 900, color: staminaColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {tech.stamina}
        </span>
      </div>

      {/* 照片 + 徽章 */}
      <div style={{ position: 'relative', marginTop: width * 0.04 }}>
        <CardPhoto cardId={tech.cardId} height={photoH} />
        <span
          style={{
            position: 'absolute',
            top: width * 0.04,
            left: width * 0.04,
            padding: `${width * 0.015}px ${width * 0.05}px`,
            borderRadius: 6,
            background: 'rgba(0,0,0,0.72)',
            color: '#fcd34d',
            fontSize: Math.max(9, width * 0.085),
            fontWeight: 900,
            lineHeight: 1.3,
          }}
        >
          Lv.{tech.level}
        </span>
        {toolIcon && (
          <span
            style={{
              position: 'absolute',
              top: width * 0.04,
              right: width * 0.04,
              width: width * 0.19,
              height: width * 0.19,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.72)',
              border: '1.5px solid rgba(251,191,36,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: width * 0.1,
            }}
          >
            {toolIcon}
          </span>
        )}
        {dimUsed && (
          <span
            style={{
              position: 'absolute',
              bottom: width * 0.04,
              right: width * 0.04,
              padding: `${width * 0.012}px ${width * 0.04}px`,
              borderRadius: 5,
              background: 'rgba(120,30,40,0.85)',
              color: '#fecaca',
              fontSize: Math.max(8, width * 0.07),
              fontWeight: 800,
            }}
          >
            {t('mobile.usedSkill')}
          </span>
        )}
      </div>

      {/* 底部：卡名 + 專長 */}
      <div style={{ padding: `${width * 0.045}px ${width * 0.06}px`, display: 'flex', flexDirection: 'column', gap: width * 0.02 }}>
        <span
          style={{
            fontSize: Math.max(10, width * (big ? 0.1 : 0.11)),
            fontWeight: 800,
            color: '#eef4fb',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.25,
          }}
        >
          {name}
        </span>
        <span style={{ fontSize: Math.max(9, width * 0.08), color: '#8fb3d9', fontWeight: 700 }}>
          {specIcon} {specLabel}
        </span>
      </div>
    </button>
  );
}

/** 空位框（備戰空格 / 無主力） */
export function EmptyCardSlot({ width, label, onClick, highlight }: {
  readonly width: number;
  readonly label: string;
  readonly onClick?: () => void;
  readonly highlight?: boolean;
}) {
  const height = width * 1.4;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        width,
        height,
        borderRadius: width * 0.075,
        border: `2px dashed ${highlight ? 'rgba(52,211,153,0.8)' : 'rgba(148,180,220,0.3)'}`,
        background: highlight ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: highlight ? '#6ee7b7' : 'rgba(148,180,220,0.55)',
        fontSize: Math.max(9, width * 0.085),
        fontWeight: 700,
        textAlign: 'center',
        padding: width * 0.06,
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}
