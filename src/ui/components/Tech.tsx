// 在場上的技師徽章（兩主題）。輕模式：可顯示「快修」出招鈕。
import { CARDS } from '../../core/cards';
import { cardName, t } from '../../i18n';
import { useTheme } from '../theme/ThemeContext';
import { pickIcon } from '../icons';

interface Props {
  readonly techId: string;
  /** 輕模式：此技師本回合可否出招（玩家回合、尚未出招、且有可修故障） */
  readonly skillReady?: boolean;
  /** 輕模式：此技師本回合已出過招 */
  readonly skillUsed?: boolean;
  /** P2：此技師招式的顯示名稱 */
  readonly skillLabel?: string;
  /** 輕模式：點出招鈕 */
  readonly onUseSkill?: () => void;
}

export function Tech({ techId, skillReady, skillUsed, skillLabel, onUseSkill }: Props) {
  const { themeKey } = useTheme();
  const card = CARDS[techId];
  if (!card) return null;
  const IconComp = pickIcon(card.icon, card.type);
  const name = cardName(techId) || techId;
  const legendary = !!card.legendary;
  const showSkill = skillReady || skillUsed;
  const label = skillLabel ?? t('skill.quickRepair');

  if (themeKey === 'tideboard') {
    return (
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
        <div
          style={{
            position: 'absolute',
            bottom: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 9,
            color: '#f4d68a',
            whiteSpace: 'nowrap',
            fontFamily: 'Georgia, serif',
            fontWeight: 700,
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          {name}
        </div>
        {showSkill && (
          <button
            type="button"
            onClick={skillReady ? onUseSkill : undefined}
            disabled={!skillReady}
            style={{
              position: 'absolute',
              bottom: -32,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '2px 8px',
              fontSize: 9,
              fontWeight: 700,
              border: `1px solid ${skillReady ? '#a8d878' : '#6e4a18'}`,
              borderRadius: 4,
              cursor: skillReady ? 'pointer' : 'default',
              background: skillReady ? 'linear-gradient(180deg, #2a8a5a, #1a5a3a)' : 'rgba(40,25,15,0.6)',
              color: skillReady ? '#f4d68a' : 'rgba(244,214,138,0.4)',
              fontFamily: 'Georgia, serif',
              whiteSpace: 'nowrap',
            }}
          >
            {skillUsed ? t('skill.used') : label}
          </button>
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
      {showSkill && (
        <button
          type="button"
          onClick={skillReady ? onUseSkill : undefined}
          disabled={!skillReady}
          style={{
            marginLeft: 2,
            padding: '3px 9px',
            fontSize: 10,
            fontWeight: 700,
            border: 'none',
            borderRadius: 999,
            cursor: skillReady ? 'pointer' : 'default',
            background: skillReady ? 'linear-gradient(180deg, #5db58c, #2a8a5a)' : 'rgba(28,42,58,0.12)',
            color: skillReady ? '#fff' : 'rgba(28,42,58,0.4)',
            boxShadow: skillReady ? '0 2px 8px rgba(42,138,90,0.35)' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {skillUsed ? t('skill.used') : `⚡ ${label}`}
        </button>
      )}
    </div>
  );
}
