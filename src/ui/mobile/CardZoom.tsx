// ============================================================
// CardZoom — 點卡後的滿版大卡檢視（Pokemon TCG Pocket 式資訊揭露）。
//
// 桌面平常保持乾淨（卡面只有照片+數字），所有說明文字集中在這裡：
// 大照片、效果/技能說明、疲勞、專長、IEC 小標。
// 底部是「情境動作鈕」（出牌/使用技能/換上場/取消），由呼叫端注入。
// ============================================================
import { useState } from 'react';
import type { DeployedTech } from '../../core/types';
import { CARDS } from '../../core/cards';
import { cardName, cardFlavor, t } from '../../i18n';

export interface ZoomAction {
  readonly label: string;
  readonly onPress: () => void;
  /** primary=綠色大鈕；danger=紅；ghost=描邊 */
  readonly variant?: 'primary' | 'danger' | 'ghost';
  readonly disabled?: boolean;
}

interface Props {
  readonly cardId: string;
  /** 場上技師時傳入：顯示疲勞/Lv/當前等級技能 */
  readonly tech?: DeployedTech | null;
  readonly actions: readonly ZoomAction[];
  readonly onClose: () => void;
  /** 額外提示（例：「請選擇目標機組」） */
  readonly hint?: string;
}

const SPEC_ICON: Record<string, string> = {
  mechanical: '⚙️', blade: '🪂', electrical: '⚡', sensor: '📡', hydraulic: '💧',
};

function ZoomPhoto({ cardId }: { readonly cardId: string }) {
  const card = CARDS[cardId];
  const candidates = [card?.image, `/cards/${cardId}.jpg`].filter(Boolean) as string[];
  const [idx, setIdx] = useState(0);
  if (idx >= candidates.length) {
    return (
      <div style={{ height: '38vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 96, background: '#12202f' }}>
        {card?.icon ?? '🃏'}
      </div>
    );
  }
  return (
    <img
      src={candidates[idx]}
      alt={cardName(cardId) || cardId}
      style={{ width: '100%', height: '38vh', objectFit: 'cover', display: 'block' }}
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

/** 依卡類組出效果說明（沿用 i18n 既有鍵） */
function effectText(cardId: string, tech?: DeployedTech | null): { title: string; body: string }[] {
  const card = CARDS[cardId];
  const out: { title: string; body: string }[] = [];

  if (card.type === 'tech') {
    const level = tech?.level ?? 1;
    const levelKey = level === 3 ? 'lv3' : level === 2 ? 'lv2' : 'lv1';
    const skill = card.skills?.[levelKey];
    if (skill) {
      const skillName = t(`skills.${skill.tag}.name`);
      const fallbackName = skill.tag.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const parts: string[] = [];
      if (skill.repairPower) parts.push(t('mobile.skill.repair', { n: skill.repairPower }));
      if (skill.availBoost) parts.push(t('mobile.skill.avail', { n: skill.availBoost }));
      if (skill.mwBoost) parts.push(t('mobile.skill.mw', { n: skill.mwBoost }));
      const descKey = `skills.${skill.tag}.desc`;
      const desc = t(descKey);
      out.push({
        title: `${t('mobile.zoom.skill')} Lv.${level}：${skillName !== `skills.${skill.tag}.name` ? skillName : fallbackName}（⚡${skill.staminaCost}）`,
        body: desc !== descKey ? desc : parts.join('，') || t('mobile.skill.support'),
      });
    }
  } else if (card.type === 'tool' && card.effect) {
    out.push({ title: t('mobile.zoom.toolEffect'), body: t(`tool.effect.${card.effect}`) });
  } else if (card.type === 'item' && card.effect) {
    out.push({ title: t('mobile.zoom.itemEffect'), body: t(`item.effect.${card.effect}`) });
  } else if (card.type === 'contract' && card.effect) {
    out.push({
      title: t('mobile.zoom.contractEffect'),
      body: t(`contract.effect.${card.effect}`, { m: card.multiplier ?? 1, d: card.duration ?? 1, v: card.value ?? 0 }),
    });
  }
  return out;
}

export function CardZoom({ cardId, tech, actions, onClose, hint }: Props) {
  const card = CARDS[cardId];
  const name = cardName(cardId) || cardId;
  const flavor = cardFlavor(cardId);
  const flavorOk = flavor && flavor !== `cards.${cardId}.flavor`;
  const specLabel = card.specialty ? t(`category.${card.specialty}`) : card.type === 'tech' ? t('category.general') : null;
  const specIcon = card.specialty ? SPEC_ICON[card.specialty] ?? '🔧' : null;
  const typeLabel = t(`category.${card.type}`);
  const sections = effectText(cardId, tech);
  const staminaPct = tech ? Math.max(0, Math.min(1, tech.stamina / tech.maxStamina)) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={name}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 600,
        background: 'rgba(4,8,16,0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(14px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom))',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(400px, 100%)',
          maxHeight: '100%',
          overflowY: 'auto',
          borderRadius: 22,
          background: 'linear-gradient(180deg, #1c2c42, #0e1a2a)',
          border: '1.5px solid rgba(148,180,220,0.4)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'wf-zoom-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {/* 照片 + 頂部徽章 */}
        <div style={{ position: 'relative' }}>
          <ZoomPhoto cardId={cardId} />
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
            <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.7)', color: '#c8d8ea', fontSize: 11, fontWeight: 800 }}>
              {typeLabel}
            </span>
            {tech && (
              <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.7)', color: '#fcd34d', fontSize: 11, fontWeight: 900 }}>
                Lv.{tech.level}
              </span>
            )}
          </div>
          {card.cost !== undefined && !tech && (
            <span
              style={{
                position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%',
                background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 900, border: '2px solid rgba(255,255,255,0.85)',
              }}
            >
              {card.cost}
            </span>
          )}
          {/* 名稱壓在照片下緣 */}
          <div
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              padding: '26px 16px 10px',
              background: 'linear-gradient(180deg, transparent, rgba(10,18,30,0.92))',
              display: 'flex', alignItems: 'baseline', gap: 10,
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 900, color: '#f2f7fd' }}>{name}</span>
            {specLabel && (
              <span style={{ fontSize: 13, color: '#8fb3d9', fontWeight: 700 }}>
                {specIcon} {specLabel}
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 疲勞（場上技師） */}
          {tech && staminaPct !== null && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#9fc0e2' }}>{t('mobile.zoom.stamina')}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: staminaPct > 0.5 ? '#34d399' : staminaPct > 0.25 ? '#fbbf24' : '#f87171' }}>
                  {tech.stamina} / {tech.maxStamina}
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                <div style={{ width: `${staminaPct * 100}%`, height: '100%', borderRadius: 999, background: staminaPct > 0.5 ? '#34d399' : staminaPct > 0.25 ? '#fbbf24' : '#f87171' }} />
              </div>
            </div>
          )}

          {/* 效果 / 技能說明 */}
          {sections.map((s) => (
            <div key={s.title} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(148,180,220,0.2)' }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#7dd3fc', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#dbe7f4' }}>{s.body}</div>
            </div>
          ))}

          {flavorOk && (
            <div style={{ fontSize: 12, lineHeight: 1.5, color: '#7d95b3', fontStyle: 'italic' }}>{flavor}</div>
          )}

          {card.iec && (
            <span style={{ fontSize: 10.5, color: '#5f7a99', fontWeight: 700 }}>📘 IEC {card.iec}</span>
          )}

          {hint && (
            <div style={{ padding: '9px 12px', borderRadius: 10, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.4)', color: '#6ee7b7', fontSize: 13, fontWeight: 800, textAlign: 'center' }}>
              {hint}
            </div>
          )}

          {/* 動作鈕 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                disabled={a.disabled}
                onClick={a.onPress}
                style={{
                  padding: '13px 16px',
                  borderRadius: 14,
                  border: a.variant === 'ghost' ? '1.5px solid rgba(148,180,220,0.45)' : 'none',
                  background: a.disabled
                    ? 'rgba(120,140,160,0.25)'
                    : a.variant === 'danger'
                      ? 'linear-gradient(180deg, #f43f5e, #be123c)'
                      : a.variant === 'ghost'
                        ? 'transparent'
                        : 'linear-gradient(180deg, #34d399, #059669)',
                  color: a.disabled ? 'rgba(220,230,240,0.5)' : a.variant === 'ghost' ? '#c8d8ea' : '#04121f',
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  cursor: a.disabled ? 'not-allowed' : 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
