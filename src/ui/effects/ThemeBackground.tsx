// 兩個主題各自的背景畫面（雲海風光 / 木紋潮板）。
import { useTheme } from '../theme/ThemeContext';

export function ThemeBackground() {
  const { themeKey } = useTheme();
  if (themeKey === 'tideboard') {
    return (
      <svg
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bw-wood" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8a6a4a" />
            <stop offset="50%" stopColor="#a07d5a" />
            <stop offset="100%" stopColor="#6b5240" />
          </linearGradient>
          <radialGradient id="bw-vignette" cx="50%" cy="50%" r="80%">
            <stop offset="40%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
          </radialGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#bw-wood)" />
        {Array.from({ length: 5 }, (_, i) => (
          <line key={i} x1="0" y1={i * 180} x2="1440" y2={i * 180} stroke="rgba(40,25,15,0.4)" strokeWidth="2" />
        ))}
        {Array.from({ length: 80 }, (_, i) => (
          <path
            key={i}
            d={`M 0 ${i * 12 + 4} Q 80 ${i * 12 + 2} 160 ${i * 12 + 4} T 320 ${i * 12 + 4} T 480 ${i * 12 + 4} T 640 ${i * 12 + 4} T 800 ${i * 12 + 4} T 960 ${i * 12 + 4} T 1120 ${i * 12 + 4} T 1280 ${i * 12 + 4} T 1440 ${i * 12 + 4}`}
            fill="none"
            stroke="rgba(60,40,25,0.08)"
            strokeWidth="0.6"
          />
        ))}
        <rect width="1440" height="900" fill="url(#bw-vignette)" />
      </svg>
    );
  }
  // Cumulus
  return (
    <>
      <svg
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="bw-sun" cx="80%" cy="20%" r="50%">
            <stop offset="0%" stopColor="#ffe4c4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffe4c4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#bw-sun)" opacity="0.5" />
        <g fill="#ffffff" opacity="0.5" style={{ animation: 'wf-wind-bg-drift 60s linear infinite' }}>
          <ellipse cx="180" cy="100" rx="140" ry="22" />
          <ellipse cx="220" cy="120" rx="110" ry="18" />
          <ellipse cx="1100" cy="80" rx="180" ry="26" />
          <ellipse cx="1180" cy="100" rx="120" ry="18" />
          <ellipse cx="560" cy="140" rx="160" ry="20" />
          <ellipse cx="80" cy="260" rx="100" ry="14" />
          <ellipse cx="1350" cy="300" rx="120" ry="16" />
        </g>
        <rect x="0" y="445" width="1440" height="1.5" fill="#9fb6bd" opacity="0.3" />
      </svg>
      <svg
        width="100%"
        height="120"
        preserveAspectRatio="none"
        viewBox="0 0 1440 120"
        style={{ position: 'absolute', bottom: 0, left: 0, opacity: 0.35, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <path d="M0 80 Q 120 40 240 80 T 480 80 T 720 80 T 960 80 T 1200 80 T 1440 80 L 1440 120 L 0 120 Z" fill="#c5a888" />
        <path d="M0 100 Q 100 70 200 100 T 400 100 T 600 100 T 800 100 T 1000 100 T 1200 100 T 1440 100 L 1440 120 L 0 120 Z" fill="#b39476" />
      </svg>
    </>
  );
}
