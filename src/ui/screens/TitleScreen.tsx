// 標題畫面（兩主題）
import { useTheme } from '../theme/ThemeContext';
import { ThemeBackground } from '../effects/ThemeBackground';
import { Compass, TurbineFloat } from '../icons';
import { LocaleSwitcher } from '../components/LocaleSwitcher';

interface Props {
  readonly onStart: () => void;
  readonly onTheme?: () => void;
}

export function TitleScreen({ onStart, onTheme }: Props) {
  const { theme, themeKey } = useTheme();

  if (themeKey === 'tideboard') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: theme.bgRoot,
          color: theme.textPrimary,
          fontFamily: theme.fontDisplay,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ThemeBackground />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ animation: 'wf-fade-in 0.8s ease-out both' }}>
            <Compass size={88} stroke="#f4d68a" strokeWidth={1.2} style={{ filter: 'drop-shadow(0 0 20px rgba(244,214,138,0.5))' }} />
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 64,
              fontWeight: 700,
              color: '#f4d68a',
              letterSpacing: '0.15em',
              textShadow: '0 4px 12px rgba(0,0,0,0.5), 0 0 28px rgba(244,214,138,0.3)',
            }}
          >
            WINDFARM
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: '#e8c878',
              letterSpacing: '0.3em',
              marginTop: -8,
              textShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            BATTLE
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 16,
              color: '#c89848',
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
            }}
          >
            風場運維策略卡牌 · 12 回合決勝負
          </div>

          <button
            type="button"
            onClick={onStart}
            style={{
              marginTop: 48,
              padding: '16px 48px',
              background: 'linear-gradient(180deg, #e8c878 0%, #c89848 50%, #8a6028 100%)',
              border: '3px solid #3d2a1e',
              borderRadius: 6,
              color: '#3d2a1e',
              fontSize: 18,
              fontWeight: 800,
              fontFamily: '"Cinzel", Georgia, serif',
              letterSpacing: '0.3em',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Compass size={20} stroke="#3d2a1e" />
            開始航行
          </button>
          {onTheme && (
            <div style={{ marginTop: 18 }}>
              <button
                type="button"
                onClick={onTheme}
                style={{
                  background: 'transparent',
                  border: '1px solid #c89848',
                  color: '#c89848',
                  padding: '6px 16px',
                  fontFamily: 'Georgia, serif',
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  cursor: 'pointer',
                }}
              >
                切換主題
              </button>
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <LocaleSwitcher style={{ color: '#c89848', borderColor: '#c89848', background: 'transparent' }} />
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 11,
              color: '#c89848',
              letterSpacing: '0.3em',
              opacity: 0.7,
            }}
          >
            DOF LAB · 國立勤益科技大學
          </div>
        </div>
      </div>
    );
  }

  // Cumulus
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: theme.bgRoot,
        color: theme.textPrimary,
        fontFamily: theme.fontDisplay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ThemeBackground />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ display: 'inline-block' }}>
          <TurbineFloat size={104} stroke="#1c2a3a" strokeWidth={1.2} />
        </div>
        <div style={{ marginTop: 16, fontSize: 72, fontWeight: 800, color: '#1c2a3a', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
          風場大戰
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: '#6a7888',
            letterSpacing: '0.4em',
            marginTop: 4,
          }}
        >
          WINDFARM · BATTLE
        </div>
        <div style={{ marginTop: 16, fontSize: 14, color: '#3a4858' }}>風場運維策略卡牌 · 12 回合決勝負</div>

        <button
          type="button"
          onClick={onStart}
          style={{
            marginTop: 44,
            padding: '16px 44px',
            background: 'linear-gradient(180deg, #1c2a3a 0%, #0d1924 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: '0.15em',
            border: 'none',
            borderRadius: 999,
            boxShadow: '0 12px 32px rgba(28,42,58,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Compass size={18} stroke="#fff" />
          開始對戰
        </button>
        {onTheme && (
          <div style={{ marginTop: 18 }}>
            <button
              type="button"
              onClick={onTheme}
              style={{
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(28,42,58,0.12)',
                color: '#3a4858',
                padding: '6px 18px',
                borderRadius: 999,
                fontFamily: 'inherit',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              🎨 切換主題
            </button>
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <LocaleSwitcher style={{ color: '#6a7888', borderColor: 'rgba(28,42,58,0.2)', background: 'rgba(255,255,255,0.5)' }} />
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: '#6a7888',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}
        >
          DOF LAB · 國立勤益科技大學
        </div>
      </div>
    </div>
  );
}
