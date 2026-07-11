import type { CSSProperties } from 'react';

interface StaminaBarProps {
  readonly stamina: number;
  readonly maxStamina: number;
  readonly style?: CSSProperties;
}

export function StaminaBar({ stamina, maxStamina, style }: StaminaBarProps) {
  const safeMax = Math.max(1, maxStamina);
  const fatigue = Math.max(0, safeMax - stamina);
  const fatiguePct = Math.max(0, Math.min(100, (fatigue / safeMax) * 100));
  const staminaPct = Math.max(0, Math.min(100, (stamina / safeMax) * 100));

  // 疲勞度取代傳統 HP：越紅代表越接近力竭下場。
  let fatigueColor = 'bg-emerald-500';
  if (fatiguePct >= 70) {
    fatigueColor = 'bg-rose-500 animate-pulse';
  } else if (fatiguePct >= 40) {
    fatigueColor = 'bg-amber-500';
  }

  return (
    <div className="w-full flex flex-col gap-1" style={style}>
      <div className="flex justify-between items-center text-xs font-semibold px-0.5">
        <span className="text-rose-200 font-black tracking-wide">疲勞度</span>
        <span className="text-gray-100 font-mono font-black">
          {fatigue}/{safeMax}
        </span>
      </div>
      <div className="w-full h-3.5 bg-gray-950/80 rounded-full border border-gray-700/60 p-0.5 overflow-hidden flex shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-300 ${fatigueColor}`}
          style={{ width: `${fatiguePct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-gray-500 font-mono px-0.5">
        <span>剩餘體力</span>
        <span>{staminaPct.toFixed(0)}%</span>
      </div>
    </div>
  );
}
