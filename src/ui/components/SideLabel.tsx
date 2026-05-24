// 玩家身分標籤（我/AI + 手牌/牌庫/MW/故障）
import { useTheme } from '../theme/ThemeContext';
import { FaultLightning, Compass } from '../icons';
import { t } from '../../i18n';
import { useLocale } from '../locale/LocaleContext';

interface Props {
  readonly side: 'me' | 'opp';
  readonly hand: number;
  readonly deck: number;
  readonly mw: number;
  readonly faulted?: boolean;
  readonly active?: boolean;
  readonly aiThinking?: boolean;
}

export function SideLabel({ side, hand, deck, mw, faulted, active, aiThinking }: Props) {
  const { themeKey } = useTheme();
  useLocale(); // 訂閱語言切換，觸發重新渲染

  if (themeKey === 'tideboard') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 14px',
          background: 'linear-gradient(180deg, #3d2a1e, #2a1810)',
          border: `1.5px solid ${active ? '#f4d68a' : '#6e4a18'}`,
          boxShadow: active ? '0 0 12px rgba(244,214,138,0.3)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: side === 'opp' ? '#a85b4a' : '#6e4a18',
              border: '1px solid #c89848',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f4d68a',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'Georgia, serif',
            }}
          >
            {side === 'opp' ? t('side.ai') : t('side.you')}
          </div>
          <div style={{ color: '#f4d68a', fontFamily: 'Georgia, serif' }}>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{side === 'opp' ? t('side.aiOpponent') : t('side.yourField')}</div>
            <div style={{ fontSize: 9, color: '#c89848' }}>
              {t('side.hand')}{hand} · {t('side.deck')}{deck}
            </div>
          </div>
        </div>
        <div style={{ height: 24, width: 1, background: '#6e4a18' }} />
        <div style={{ color: '#f4d68a', fontFamily: 'Georgia, serif' }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{mw}</span>
          <span style={{ fontSize: 9, color: '#c89848', marginLeft: 2 }}>MW</span>
        </div>
        {faulted && (
          <>
            <div style={{ height: 24, width: 1, background: '#6e4a18' }} />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                color: '#f4886a',
                fontSize: 10,
                fontWeight: 600,
                fontFamily: 'Georgia, serif',
              }}
            >
              <FaultLightning size={12} stroke="#f4886a" />
              {t('side.fault')}
            </div>
          </>
        )}
        {(active || aiThinking) && (
          <>
            <div style={{ height: 24, width: 1, background: '#6e4a18' }} />
            <div
              style={{
                fontSize: 10,
                color: aiThinking ? '#f4886a' : '#a8d878',
                fontWeight: 700,
                fontFamily: 'Georgia, serif',
                animation: aiThinking ? 'wf-thinking-pulse 1.4s ease-in-out infinite' : 'none',
              }}
            >
              {aiThinking ? t('side.aiThinking') : side === 'me' ? t('side.yourTurn') : t('side.calculating')}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '8px 16px',
        background: 'rgba(255,255,255,0.6)',
        borderRadius: 14,
        border: `1px solid ${active ? 'rgba(58,167,200,0.4)' : 'rgba(28,42,58,0.08)'}`,
        backdropFilter: 'blur(8px)',
        boxShadow: active ? '0 0 16px rgba(58,167,200,0.18)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: side === 'opp' ? '#a85b4a' : '#1c2a3a',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {side === 'opp' ? t('side.ai') : t('side.you')}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1c2a3a' }}>{side === 'opp' ? t('side.aiOpponent') : t('side.yourField')}</div>
          <div style={{ fontSize: 9, color: '#6a7888' }}>
            {hand} {t('side.hand')} · {deck} {t('side.deck')}
          </div>
        </div>
      </div>
      <div style={{ height: 24, width: 1, background: 'rgba(28,42,58,0.1)' }} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1c2a3a' }}>{mw}</span>
        <span style={{ fontSize: 9, color: '#6a7888' }}>MW</span>
      </div>
      {faulted && (
        <>
          <div style={{ height: 24, width: 1, background: 'rgba(28,42,58,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#a8453a', fontWeight: 600 }}>
            <FaultLightning size={12} stroke="#a8453a" />
            {t('side.faulting')}
          </div>
        </>
      )}
      {(active || aiThinking) && (
        <>
          <div style={{ height: 24, width: 1, background: 'rgba(28,42,58,0.1)' }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              color: aiThinking ? '#a85b4a' : '#3aa7c8',
              fontWeight: 700,
              animation: aiThinking ? 'wf-thinking-pulse 1.4s ease-in-out infinite' : 'none',
            }}
          >
            <Compass size={12} stroke="currentColor" />
            {aiThinking ? t('side.aiThinking') : side === 'me' ? t('side.yourTurn') : t('side.calculating')}
          </div>
        </>
      )}
    </div>
  );
}
