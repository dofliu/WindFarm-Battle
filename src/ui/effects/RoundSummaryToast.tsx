// 回合結算 toast — 從上方滑入，3 秒後消失（呼叫者控制）。
import { useTheme } from '../theme/ThemeContext';
import { CountUp } from './CountUp';

interface Props {
  readonly round: number;
  readonly myMwh: number;
  readonly aiMwh: number;
  readonly myTotal: number;
  readonly aiTotal: number;
}

export function RoundSummaryToast({ round, myMwh, aiMwh, myTotal, aiTotal }: Props) {
  const { theme, themeKey } = useTheme();
  return (
    <div
      style={{
        position: 'absolute',
        top: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        animation: 'wf-toast-in 0.4s ease-out both',
        padding: '12px 22px',
        background: themeKey === 'tideboard' ? 'linear-gradient(180deg, #3d2a1e, #2a1810)' : 'rgba(28,42,58,0.95)',
        border: themeKey === 'tideboard' ? '2px solid #c89848' : '1px solid rgba(255,255,255,0.15)',
        borderRadius: 14,
        color: '#fff',
        boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        fontFamily: theme.fontUI,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.05em', color: theme.secondary }}>回合 {round} 結算</div>
      <div style={{ height: 32, width: 1, background: 'rgba(255,255,255,0.15)' }} />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>你</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: myMwh >= aiMwh ? '#88e8a8' : '#fff' }}>
            +<CountUp from={0} to={myMwh} duration={1000} />
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>vs</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: aiMwh > myMwh ? '#e88a7a' : '#fff' }}>
            +<CountUp from={0} to={aiMwh} duration={1000} />
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>AI</span>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
          總計 {myTotal} vs {aiTotal} MWh
        </div>
      </div>
      <div style={{ fontSize: 28 }}>{myMwh > aiMwh ? '🏆' : myMwh < aiMwh ? '😬' : '🤝'}</div>
    </div>
  );
}
