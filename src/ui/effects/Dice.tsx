// ============================================================
// 風速骰子（1d6 × 2 顆，含颱風光環）。
// 動畫狀態由 store.windRolling 控制；rolling 為 true 時面點高速旋轉。
// ============================================================
import type { ThemeKey } from '../styles/themes';

const DOTS: Readonly<Record<number, ReadonlyArray<readonly [number, number]>>> = {
  1: [[0.5, 0.5]],
  2: [
    [0.3, 0.3],
    [0.7, 0.7],
  ],
  3: [
    [0.3, 0.3],
    [0.5, 0.5],
    [0.7, 0.7],
  ],
  4: [
    [0.3, 0.3],
    [0.7, 0.3],
    [0.3, 0.7],
    [0.7, 0.7],
  ],
  5: [
    [0.3, 0.3],
    [0.7, 0.3],
    [0.5, 0.5],
    [0.3, 0.7],
    [0.7, 0.7],
  ],
  6: [
    [0.3, 0.3],
    [0.7, 0.3],
    [0.3, 0.5],
    [0.7, 0.5],
    [0.3, 0.7],
    [0.7, 0.7],
  ],
};

interface DiceFaceProps {
  readonly value: number;
  readonly size?: number;
  readonly theme: ThemeKey;
  readonly spinning?: boolean;
}

export function DiceFace({ value, size = 56, theme, spinning }: DiceFaceProps) {
  const dots = DOTS[value] ?? [];
  const bg = theme === 'tideboard' ? '#f4e8d0' : '#fff';
  const fg = theme === 'tideboard' ? '#3d2a1e' : '#1c2a3a';
  const stroke = theme === 'tideboard' ? '#3d2a1e' : 'rgba(28,42,58,0.2)';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.18,
        background: bg,
        border: `2px solid ${stroke}`,
        boxShadow:
          theme === 'tideboard'
            ? '0 4px 12px rgba(0,0,0,0.5), inset 0 -3px 6px rgba(0,0,0,0.15)'
            : '0 4px 12px rgba(28,42,58,0.25), inset 0 -3px 6px rgba(28,42,58,0.05)',
        position: 'relative',
        animation: spinning ? 'wf-dice-spin 0.2s linear infinite' : 'wf-dice-settle 0.4s ease-out',
      }}
    >
      {dots.map(([x, y], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: size * 0.16,
            height: size * 0.16,
            borderRadius: '50%',
            background: fg,
          }}
        />
      ))}
    </div>
  );
}

interface DiceRollerProps {
  readonly dice: readonly [number | null, number | null];
  readonly rolling: boolean;
  readonly typhoon?: boolean;
  readonly theme: ThemeKey;
  readonly size?: number;
}

export function DiceRoller({ dice, rolling, typhoon, theme, size = 56 }: DiceRollerProps) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', position: 'relative' }}>
      {dice[0] != null && <DiceFace value={dice[0]} size={size} theme={theme} spinning={rolling} />}
      {dice[1] != null && <DiceFace value={dice[1]} size={size} theme={theme} spinning={rolling} />}
      {typhoon && (
        <div
          style={{
            position: 'absolute',
            inset: -16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <svg
            width={size * 3}
            height={size * 3}
            viewBox="0 0 200 200"
            style={{ animation: 'wf-spin 1.2s linear infinite' }}
          >
            <circle cx="100" cy="100" r="80" fill="none" stroke="#d96c5a" strokeWidth="2" strokeDasharray="10 4" opacity="0.7" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="#d96c5a" strokeWidth="1.5" strokeDasharray="4 8" opacity="0.5" />
          </svg>
        </div>
      )}
    </div>
  );
}
