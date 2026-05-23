// 分數徽章（兩主題：銅扣 vs 玻璃膠囊）
import { useTheme } from '../theme/ThemeContext';
import { TechWrench, Crosshair } from '../icons';

interface Props {
  readonly side: 'me' | 'opp';
  readonly label: string;
  readonly score: number;
  readonly preview?: number;
  readonly active?: boolean;
}

export function ScoreBadge({ side, label, score, preview = 0, active }: Props) {
  const { themeKey } = useTheme();
  if (themeKey === 'tideboard') {
    return (
      <div style={{ position: 'relative', width: 130, height: 90 }}>
        <svg width="130" height="90" viewBox="0 0 130 90" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id={`score-tide-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e8c878" />
              <stop offset="100%" stopColor="#8a6028" />
            </linearGradient>
          </defs>
          <path
            d="M8 4 L122 4 L126 18 L126 76 L122 86 L8 86 L4 76 L4 18 Z"
            fill={`url(#score-tide-${side})`}
            stroke="#3d2a1e"
            strokeWidth="1.5"
          />
          <rect x="12" y="18" width="106" height="56" fill="#2a1810" />
        </svg>
        <div style={{ position: 'relative', padding: '14px 18px', textAlign: 'center', color: '#f4d68a' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', opacity: 0.85, fontFamily: '"Cinzel", serif' }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1, fontFamily: 'Georgia, serif' }}>{score}</div>
          {preview > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                right: 18,
                fontSize: 11,
                color: '#a8d878',
                fontWeight: 700,
                fontFamily: 'Georgia, serif',
              }}
            >
              +{preview}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        borderRadius: 14,
        background: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)',
        boxShadow: active ? '0 4px 20px rgba(28,42,58,0.12)' : '0 1px 4px rgba(28,42,58,0.05)',
        border: active ? '1px solid rgba(28,42,58,0.15)' : '1px solid rgba(28,42,58,0.06)',
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          background: side === 'me' ? '#1c2a3a' : '#a85b4a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        {side === 'me' ? <TechWrench size={17} stroke="#fff" /> : <Crosshair size={17} stroke="#fff" />}
      </div>
      <div>
        <div style={{ fontSize: 10, color: '#6a7888', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#1c2a3a' }}>{score}</span>
          <span style={{ fontSize: 9, color: '#6a7888' }}>MWh</span>
          {preview > 0 && <span style={{ fontSize: 10, color: '#3a8a5e', fontWeight: 600 }}>+{preview}</span>}
        </div>
      </div>
    </div>
  );
}
