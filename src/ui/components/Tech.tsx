// 在場上的技師徽章（兩主題）。P3：多招式鈕 + 傳奇 ex 特性徽章。
// v5.18：加入卡牌插畫顯示（Tideboard 小卡片 / Cumulus 圓形頭像）。
import { CARDS } from '../../core/cards';
import { cardName, t } from '../../i18n';
import { useTheme } from '../theme/ThemeContext';
import { pickIcon } from '../icons';

export interface SkillBtn {
  readonly tag: string;
  readonly label: string;
  readonly ready: boolean;
  readonly onUse: () => void;
}

interface Props {
  readonly techId: string;
  /** 此技師的招式鈕（1-2 個）；不給＝對手唯讀技師 */
  readonly skills?: readonly SkillBtn[];
  /** 此技師本回合已出過招（整個技師一回合只出一招） */
  readonly skillUsed?: boolean;
  /** 傳奇 ex 技師的「特性」名稱（常態被動，徽章顯示） */
  readonly abilityLabel?: string;
}

/** 技師卡牌插畫路徑（有 card.image 時使用，否則 fallback 到 SVG 圖示）。 */
function techImageSrc(techId: string): string | undefined {
  const card = CARDS[techId];
  return card?.image;
}

export function Tech({ techId, skills, skillUsed, abilityLabel }: Props) {
  const { themeKey } = useTheme();
  const card = CARDS[techId];
  if (!card) return null;
  const IconComp = pickIcon(card.icon, card.type);
  const name = cardName(techId) || techId;
  const legendary = !!card.legendary;
  const hasSkills = !!skills && skills.length > 0;
  const imgSrc = techImageSrc(techId);

  if (themeKey === 'tideboard') {
    // Tideboard：小卡片式（64×84px），上方插畫圓角矩形，下方名稱 + 招式
    const CARD_W = 64;
    const ART_H = 72;
    return (
      <div style={{ position: 'relative', width: CARD_W, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        {/* 卡牌框 */}
        <div
          style={{
            width: CARD_W,
            borderRadius: 8,
            overflow: 'hidden',
            border: legendary ? '2px solid #f4d68a' : '1.5px solid #6e4a18',
            boxShadow: legendary
              ? '0 0 10px rgba(244,214,138,0.5), 0 2px 8px rgba(0,0,0,0.4)'
              : '0 2px 8px rgba(0,0,0,0.35)',
            background: '#2a1e0e',
            position: 'relative',
          }}
        >
          {/* 插畫區 */}
          <div style={{ width: CARD_W, height: ART_H, position: 'relative', overflow: 'hidden', background: '#1a2e1e' }}>
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 20%',
                  display: 'block',
                }}
                loading="lazy"
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconComp size={28} stroke="#a8d878" />
              </div>
            )}
            {/* 傳奇金光邊 */}
            {legendary && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 50%, rgba(244,214,138,0.25) 100%)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
          {/* 名稱列 */}
          <div
            style={{
              padding: '3px 4px',
              background: legendary
                ? 'linear-gradient(180deg, #3d2a1e, #2a1e0e)'
                : 'rgba(20,35,25,0.95)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 8,
                fontWeight: 800,
                color: legendary ? '#f4d68a' : '#a8d878',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: 'Georgia, serif',
                letterSpacing: '0.05em',
              }}
            >
              {name}
            </div>
          </div>
        </div>
        {/* 特性徽章 */}
        {abilityLabel && <AbilityBadge label={abilityLabel} tide />}
        {/* 招式按鈕 */}
        {hasSkills && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            {skillUsed ? (
              <UsedChip tide />
            ) : (
              skills!.map((sk) => <SkillPill key={sk.tag} sk={sk} tide />)
            )}
          </div>
        )}
      </div>
    );
  }

  // Cumulus：膠囊橫條，左側改為圓形插畫頭像（36×36px）
  const AVATAR = 36;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '5px 11px 5px 5px',
        background: legendary
          ? 'linear-gradient(135deg, rgba(255,248,220,0.95), rgba(255,235,170,0.9))'
          : 'rgba(255,255,255,0.88)',
        border: legendary ? '1.5px solid #d9a85a' : '1.5px solid rgba(93,181,140,0.45)',
        borderRadius: 999,
        boxShadow: legendary
          ? '0 2px 10px rgba(217,168,90,0.3)'
          : '0 2px 6px rgba(28,42,58,0.07)',
        flexWrap: 'wrap',
      }}
    >
      {/* 圓形插畫頭像 */}
      <div
        style={{
          width: AVATAR,
          height: AVATAR,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          border: legendary ? '2px solid #d9a85a' : '2px solid rgba(93,181,140,0.6)',
          boxShadow: legendary ? '0 0 6px rgba(217,168,90,0.5)' : '0 1px 4px rgba(0,0,0,0.12)',
          background: legendary ? '#d9a85a' : '#5db58c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 15%',
              display: 'block',
            }}
            loading="lazy"
          />
        ) : (
          <IconComp size={18} stroke="#fff" />
        )}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#1c2a3a' }}>{name}</span>
      {abilityLabel && <AbilityBadge label={abilityLabel} />}
      {hasSkills && (skillUsed ? <UsedChip /> : skills!.map((sk) => <SkillPill key={sk.tag} sk={sk} />))}
    </div>
  );
}

/** 傳奇 ex 特性徽章（金色，常態被動）。 */
function AbilityBadge({ label, tide }: { readonly label: string; readonly tide?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: tide ? '1px 6px' : '2px 8px',
        borderRadius: 999,
        fontSize: tide ? 8 : 9,
        fontWeight: 800,
        color: '#3d2a1e',
        background: 'linear-gradient(180deg, #f4d68a, #d9a85a)',
        boxShadow: '0 1px 4px rgba(217,168,90,0.4)',
        whiteSpace: 'nowrap',
        fontFamily: tide ? 'Georgia, serif' : 'inherit',
      }}
      title={label}
    >
      ✦ {t('skill.ability')}：{label}
    </span>
  );
}

function UsedChip({ tide }: { readonly tide?: boolean }) {
  return (
    <span
      style={{
        padding: tide ? '2px 8px' : '3px 9px',
        fontSize: tide ? 9 : 10,
        fontWeight: 700,
        borderRadius: tide ? 4 : 999,
        background: tide ? 'rgba(40,25,15,0.6)' : 'rgba(28,42,58,0.12)',
        color: tide ? 'rgba(244,214,138,0.5)' : 'rgba(28,42,58,0.4)',
        whiteSpace: 'nowrap',
        border: tide ? '1px solid #6e4a18' : 'none',
        fontFamily: tide ? 'Georgia, serif' : 'inherit',
      }}
    >
      {t('skill.used')}
    </span>
  );
}

function SkillPill({ sk, tide }: { readonly sk: SkillBtn; readonly tide?: boolean }) {
  if (tide) {
    return (
      <button
        type="button"
        onClick={sk.ready ? sk.onUse : undefined}
        disabled={!sk.ready}
        style={{
          padding: '2px 8px',
          fontSize: 9,
          fontWeight: 700,
          border: `1px solid ${sk.ready ? '#a8d878' : '#6e4a18'}`,
          borderRadius: 4,
          cursor: sk.ready ? 'pointer' : 'default',
          background: sk.ready ? 'linear-gradient(180deg, #2a8a5a, #1a5a3a)' : 'rgba(40,25,15,0.6)',
          color: sk.ready ? '#f4d68a' : 'rgba(244,214,138,0.4)',
          fontFamily: 'Georgia, serif',
          whiteSpace: 'nowrap',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {sk.label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={sk.ready ? sk.onUse : undefined}
      disabled={!sk.ready}
      style={{
        padding: '3px 9px',
        fontSize: 10,
        fontWeight: 700,
        border: 'none',
        borderRadius: 999,
        cursor: sk.ready ? 'pointer' : 'default',
        background: sk.ready ? 'linear-gradient(180deg, #5db58c, #2a8a5a)' : 'rgba(28,42,58,0.12)',
        color: sk.ready ? '#fff' : 'rgba(28,42,58,0.4)',
        boxShadow: sk.ready ? '0 2px 8px rgba(42,138,90,0.35)' : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      ⚡ {sk.label}
    </button>
  );
}
