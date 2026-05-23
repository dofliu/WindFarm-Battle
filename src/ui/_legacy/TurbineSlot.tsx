// 單台機組顯示卡：MW、可用率血量條、故障 badge（含 faultCategory）、（玩家攻擊時）可點擊目標。
import { CARDS } from '../../core/cards';
import { cardName } from '../../i18n';
import type { DeployedTurbine, FaultCategory } from '../../core/types';

/** Route B：故障分類對應的圖示與標籤（教育用途：讓學生知道對症下藥） */
const FAULT_CAT_LABEL: Record<FaultCategory, { icon: string; label: string; color: string }> = {
  mechanical: { icon: '⚙️', label: '機械', color: 'text-orange-300' },
  blade:      { icon: '🪂', label: '葉片', color: 'text-sky-300' },
  electrical: { icon: '⚡', label: '電氣', color: 'text-yellow-300' },
  sensor:     { icon: '📡', label: '感測', color: 'text-cyan-300' },
  hydraulic:  { icon: '💧', label: '液壓', color: 'text-blue-300' },
};

interface Props {
  readonly turbine: DeployedTurbine;
  readonly idx: number;
  readonly selectable?: boolean;
  readonly onSelect?: (idx: number) => void;
}

/** 根據可用率回傳配色 */
function availColor(pct: number) {
  if (pct >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-300' };
  if (pct >= 50) return { bar: 'bg-amber-500', text: 'text-amber-300' };
  return { bar: 'bg-rose-500', text: 'text-rose-300' };
}

export default function TurbineSlot({ turbine, idx, selectable, onSelect }: Props) {
  const card = CARDS[turbine.cardId];
  const baseMw = (card.stats?.mw ?? 0);
  const totalMw = baseMw + turbine.mwBonus;
  const totalDrop = turbine.faults.reduce((s, f) => s + f.drop, 0);
  const effAvail = Math.max(0, turbine.avail - totalDrop);
  const { bar: barColor, text: textColor } = availColor(effAvail);
  const hasFaults = turbine.faults.length > 0;
  const isLegendary = card.legendary === true || card.rarity === 5;
  // Route B 教育指標：若 avail 低於初始值，代表發生過部分修復或腐蝕的永久損耗
  const permDamage = turbine.originalAvail !== undefined && turbine.originalAvail > turbine.avail
    ? turbine.originalAvail - turbine.avail
    : 0;

  // 停機機組不可作為故障目標（已無作用，再攻擊是浪費動作）
  const effectiveSelectable = selectable && !turbine.shutdown;
  const handleClick = effectiveSelectable && onSelect ? () => onSelect(idx) : undefined;

  const isShutdown = turbine.shutdown === true;

  return (
    <button
      type="button"
      disabled={!effectiveSelectable}
      onClick={handleClick}
      className={[
        'flex w-32 flex-col gap-1.5 rounded-xl border-2 px-2 py-2 text-left transition-all duration-150',
        isShutdown
          ? 'border-slate-600 bg-slate-900/80 opacity-70 grayscale cursor-not-allowed'
          : effectiveSelectable
            ? 'cursor-pointer border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/50 hover:bg-amber-900/50 hover:scale-105'
            : isLegendary
              ? 'border-yellow-500/70 bg-gradient-to-b from-sky-950/60 to-slate-950/60 shadow-[0_0_8px_1px_rgba(234,179,8,0.2)]'
              : hasFaults
                ? 'border-rose-700/70 bg-gradient-to-b from-rose-950/40 to-slate-950/60'
                : 'border-sky-700/50 bg-gradient-to-b from-sky-950/50 to-slate-950/60',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* 停機標示 */}
      {isShutdown && (
        <div className="flex items-center justify-center rounded bg-slate-700 py-0.5 text-[9px] font-bold text-slate-300">
          🔴 緊急停機
        </div>
      )}

      {/* 機組圖示 + 卡名 */}
      <div className="flex items-center gap-1.5">
        <span className={`text-xl leading-none ${isShutdown ? 'grayscale' : ''}`}>{card.icon}</span>
        <span className="truncate text-[10px] font-semibold text-sky-200 leading-tight">
          {cardName(turbine.cardId)}
        </span>
      </div>

      {/* MW 輸出 */}
      <div className="flex items-baseline gap-1">
        <span className="text-base font-bold tabular-nums text-sky-100">⚡{totalMw}</span>
        <span className="text-[9px] text-slate-400">MW</span>
        {turbine.mwBonus > 0 && (
          <span className="text-[9px] text-pink-300">+{turbine.mwBonus}</span>
        )}
      </div>

      {/* 可用率血量條 */}
      <div>
        <div className="mb-0.5 flex items-center justify-between text-[9px]">
          <span className="text-slate-400">可用率</span>
          <span className={`font-bold tabular-nums ${textColor}`}>{effAvail}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.max(2, effAvail)}%` }}
          />
        </div>
        {/* Route B：永久損傷警示（部分修復 / 腐蝕造成的 avail 損耗） */}
        {permDamage > 0 && (
          <div
            title={`Route B 部分修復損耗：可用率永久降低 ${permDamage}%（原始 ${turbine.originalAvail}%）`}
            className="mt-0.5 flex items-center gap-0.5 text-[8px] text-orange-400/80"
          >
            <span>⬇</span>
            <span className="tabular-nums">−{permDamage}% 永久</span>
          </div>
        )}
      </div>

      {/* 故障 badges（含 faultCategory 教育標籤） */}
      {hasFaults && (
        <div className="flex flex-wrap gap-0.5">
          {turbine.faults.map((f, i) => {
            const faultCard = CARDS[f.cardId];
            const catInfo = faultCard.faultCategory ? FAULT_CAT_LABEL[faultCard.faultCategory] : null;
            return (
              <span
                key={i}
                title={`${cardName(f.cardId)}（${catInfo?.label ?? '?'}類故障，-${f.drop}%，剩 ${f.roundsLeft} 回）`}
                className="flex items-center gap-0.5 rounded bg-rose-900/80 px-1 py-0.5 text-[8px] text-rose-200 ring-1 ring-rose-700/50"
              >
                <span>{faultCard.icon}</span>
                {catInfo && (
                  <span className={`${catInfo.color} font-medium`}>{catInfo.label}</span>
                )}
                <span className="tabular-nums">-{f.drop}%</span>
                <span className="text-rose-400/70">×{f.roundsLeft}</span>
              </span>
            );
          })}
        </div>
      )}
    </button>
  );
}
