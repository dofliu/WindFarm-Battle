// 背面（對手手牌數呈現）
import type { CSSProperties } from 'react';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  readonly size?: number;
  readonly style?: CSSProperties;
}

export function CardBack({ size = 42, style }: Props) {
  const { theme, themeKey } = useTheme();
  if (themeKey === 'tideboard') {
    return (
      <svg width={size} height={size * 1.43} viewBox={`0 0 ${size} ${size * 1.43}`} style={style}>
        <defs>
          <linearGradient id={`tideback-${size}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#6e4a18" />
            <stop offset="1" stopColor="#3d2a1e" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width={size - 4} height={size * 1.43 - 4} rx="2" fill={`url(#tideback-${size})`} stroke="#c89848" strokeWidth="1" />
        <circle cx={size / 2} cy={size * 0.7} r={size * 0.22} fill="none" stroke="#c89848" strokeWidth="0.8" />
        <circle cx={size / 2} cy={size * 0.7} r={size * 0.1} fill="none" stroke="#c89848" strokeWidth="0.6" />
        <circle cx={size / 2} cy={size * 0.7} r="1.5" fill="#c89848" />
      </svg>
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size * 1.43,
        borderRadius: 6,
        background: theme.cardBackBg,
        border: '1.5px solid rgba(255,255,255,0.5)',
        boxShadow: '0 2px 8px rgba(28,42,58,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <div
        style={{
          width: size * 0.42,
          height: size * 0.42,
          borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.5)',
        }}
      />
    </div>
  );
}
