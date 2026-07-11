import type { CSSProperties } from 'react';

interface StaminaBarProps {
  readonly stamina: number;
  readonly maxStamina: number;
  readonly style?: CSSProperties;
}

export function StaminaBar({ stamina, maxStamina, style }: StaminaBarProps) {
  const pct = Math.max(0, Math.min(100, (stamina / maxStamina) * 100));
  
  // 決定條的顏色
  let barColor = 'bg-emerald-500';
  if (pct <= 30) {
    barColor = 'bg-rose-500 animate-pulse';
  } else if (pct <= 60) {
    barColor = 'bg-amber-500';
  }

  return (
    <div className="w-full flex flex-col gap-1" style={style}>
      <div className="flex justify-between items-center text-xs font-semibold px-0.5">
        <span className="text-gray-400 font-mono">Stamina</span>
        <span className="text-gray-200 font-mono font-bold">
          {stamina}/{maxStamina}
        </span>
      </div>
      <div className="w-full h-2.5 bg-gray-900/60 rounded-full border border-gray-700/50 p-0.5 overflow-hidden flex">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
