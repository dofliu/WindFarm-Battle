// 在場上的技師徽章（兩主題）。P3：多招式鈕 + 傳奇 ex 特性徽章。
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

export function Tech({ techId, skills, skillUsed, abilityLabel }: Props) {
  const { themeKey } = useTheme();
  const card = CARDS[techId];
  if (!card) return null;
  const IconComp = pickIcon(card.icon, card.type);
  const name = cardName(techId) || techId;
  const legendary = !!card.legendary;
  const hasSkills = !!skills && skills.length > 0;

  if (themeKey === 'tideboard') {
    return (
      <div style={{ position: 'relative', width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="56" height="56" viewBox="0 0 56 56" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <radialGradient id={`tide-med-${techId}`} cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor={legendary ? '#f8e094' : '#e8c878'} />
                <stop offset="60%" stopColor={legendary ? '#d8a838' : '#c89848'} />
                <stop offset="100%" stopColor="#6e4a18" />
              </radialGradient>
            </defs>
            <circle cx="28" cy="28" r="26" fill={`url(#tide-med-${techId})`} stroke="#3d2a1e" strokeWidth="1.5" />
            <circle cx="28" cy="28" r="20" fill="#2a4838" stroke="rgba(0,0,0,0.5)" />
          </svg>
          <IconComp size={22} stroke="#a8d878" />
        </div>
        <div style={{ fontSize: 9, color: '#f4d68a', whiteSpace: 'nowrap', fontFamily: 'Georgia, serif', fontWeight: 700, marginTop: 2 }}>
          {name}
        </div>
        {abilityLabel && <AbilityBadge label={abilityLabel} tide />}
        {hasSkills && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 3 }}>
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

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 11px 5px 7px',
        background: 'rgba(255,255,255,0.85)',
        border: legendary ? '1px solid #d9a85a' : '1px solid rgba(93,181,140,0.4)',
        borderRadius: 999,
        boxShadow: '0 2px 6px rgba(28,42,58,0.06)',
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: legendary ? '#d9a85a' : '#5db58c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconComp size={14} stroke="#fff" />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#1c2a3a' }}>{name}</span>
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
