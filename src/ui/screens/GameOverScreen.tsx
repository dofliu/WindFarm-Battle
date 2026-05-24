// 遊戲結束畫面（兩主題）
import { useTheme } from '../theme/ThemeContext';
import { ThemeBackground } from '../effects/ThemeBackground';
import { CountUp } from '../effects/CountUp';
import { Compass } from '../icons';
import type { GameState } from '../../core/types';
import { t } from '../../i18n';
import { useLocale } from '../locale/LocaleContext';

interface Props {
  readonly state: GameState;
  readonly onRestart: () => void;
  readonly onTitle: () => void;
}

export function GameOverScreen({ state, onRestart, onTitle }: Props) {
  const { theme, themeKey } = useTheme();
  useLocale(); // 訂閱語言切換，觸發重新渲染
  const me = state.players[0];
  const opp = state.players[1];
  const winner = me.score > opp.score ? 'me' : me.score < opp.score ? 'ai' : 'draw';
  const label = winner === 'me' ? t('gameover.win') : winner === 'ai' ? t('gameover.lose') : t('gameover.draw');
  const subLabel =
    winner === 'me' ? t('gameover.winSub') : winner === 'ai' ? t('gameover.loseSub') : t('gameover.drawSub');
  const accent = winner === 'me' ? theme.success : winner === 'ai' ? theme.danger : theme.warning;

  const stats: ReadonlyArray<[string, number]> = [
    [t('gameover.stat.turbines'), me.turbines.length],
    [t('gameover.stat.techs'), me.techs.length],
    [t('gameover.stat.faults'), opp.turbines.reduce((s, tu) => s + tu.faults.length, 0)],
    [t('gameover.stat.rounds'), state.round],
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: theme.bgRoot,
        color: theme.textPrimary,
        fontFamily: theme.fontUI,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ThemeBackground />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 560 }}>
        <div style={{ animation: 'wf-fade-in 0.6s ease-out both' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 96,
              height: 96,
              borderRadius: '50%',
              background:
                themeKey === 'tideboard'
                  ? 'radial-gradient(circle at 30% 30%, #f4d68a, #c89848 60%, #6e4a18)'
                  : '#fff',
              border: themeKey === 'tideboard' ? '3px solid #3d2a1e' : `4px solid ${accent}`,
              boxShadow: `0 0 32px ${accent}66`,
              color: accent,
              fontSize: 44,
              fontWeight: 800,
              fontFamily: themeKey === 'tideboard' ? '"Cinzel", Georgia, serif' : theme.fontDisplay,
            }}
          >
            {winner === 'me' ? '♛' : winner === 'ai' ? '✗' : '='}
          </div>
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 56,
            fontWeight: 800,
            color: theme.textPrimary,
            letterSpacing: '0.1em',
            fontFamily: themeKey === 'tideboard' ? '"Cinzel", Georgia, serif' : theme.fontDisplay,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 16, color: theme.textSecondary, marginTop: 6, animation: 'wf-fade-in 1s ease-out both' }}>
          {subLabel}
        </div>

        <div
          style={{
            marginTop: 36,
            padding: themeKey === 'tideboard' ? '20px 32px' : '24px 36px',
            background:
              themeKey === 'tideboard'
                ? 'linear-gradient(180deg, rgba(40,25,15,0.92), rgba(30,18,8,0.95))'
                : 'rgba(255,255,255,0.85)',
            border: themeKey === 'tideboard' ? '2px solid #c89848' : '1px solid rgba(28,42,58,0.1)',
            borderRadius: themeKey === 'tideboard' ? 0 : 16,
            boxShadow: themeKey === 'tideboard' ? '0 12px 32px rgba(0,0,0,0.4)' : '0 12px 32px rgba(28,42,58,0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 20 }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: themeKey === 'tideboard' ? '#c89848' : '#6a7888',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}
              >
                {t('gameover.you')}
              </div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: winner === 'me' ? theme.success : themeKey === 'tideboard' ? '#f4d68a' : '#1c2a3a',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <CountUp from={0} to={me.score} duration={1500} />
              </div>
              <div style={{ fontSize: 11, color: themeKey === 'tideboard' ? '#c89848' : '#6a7888' }}>MWh</div>
            </div>
            <div style={{ fontSize: 20, color: theme.textMuted, paddingBottom: 14 }}>vs</div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: themeKey === 'tideboard' ? '#c89848' : '#6a7888',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}
              >
                AI
              </div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: winner === 'ai' ? theme.danger : themeKey === 'tideboard' ? '#f4d68a' : '#1c2a3a',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <CountUp from={0} to={opp.score} duration={1500} />
              </div>
              <div style={{ fontSize: 11, color: themeKey === 'tideboard' ? '#c89848' : '#6a7888' }}>MWh</div>
            </div>
          </div>
          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: themeKey === 'tideboard' ? '1px solid rgba(200,152,72,0.3)' : '1px solid rgba(28,42,58,0.08)',
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {stats.map(([lab, value]) => (
              <div key={lab} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 10,
                    color: themeKey === 'tideboard' ? '#c89848' : '#6a7888',
                    letterSpacing: '0.1em',
                  }}
                >
                  {lab}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: themeKey === 'tideboard' ? '#f4d68a' : '#1c2a3a',
                    fontVariantNumeric: 'tabular-nums',
                    marginTop: 2,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: 28,
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            animation: 'wf-fade-in 1.5s ease-out both',
          }}
        >
          <button
            type="button"
            onClick={onRestart}
            style={{
              padding: '12px 28px',
              background:
                themeKey === 'tideboard'
                  ? 'linear-gradient(180deg, #e8c878, #c89848 50%, #8a6028)'
                  : 'linear-gradient(180deg, #d9a85a, #b8893f)',
              color: themeKey === 'tideboard' ? '#3d2a1e' : '#fff',
              border: themeKey === 'tideboard' ? '2px solid #3d2a1e' : 'none',
              borderRadius: themeKey === 'tideboard' ? 4 : 12,
              fontFamily: themeKey === 'tideboard' ? '"Cinzel", Georgia, serif' : theme.fontUI,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Compass size={16} stroke="currentColor" />
            {t('gameover.restart')}
          </button>
          <button
            type="button"
            onClick={onTitle}
            style={{
              padding: '12px 28px',
              background: 'transparent',
              color: theme.textPrimary,
              border: `1.5px solid ${theme.borderStrong}`,
              borderRadius: themeKey === 'tideboard' ? 4 : 12,
              fontFamily: themeKey === 'tideboard' ? '"Cinzel", Georgia, serif' : theme.fontUI,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.1em',
              cursor: 'pointer',
            }}
          >
            {t('gameover.title')}
          </button>
        </div>
      </div>
    </div>
  );
}
