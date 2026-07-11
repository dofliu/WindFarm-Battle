import type { DeployedTurbine } from '../../core/types';
import { cardName } from '../../i18n';
import { CARDS } from '../../core/cards';

interface WindFarmPanelProps {
  readonly turbines: DeployedTurbine[];
  readonly isPlayer: boolean;
  readonly isTargeting: boolean; // 是否正處於選取機組作為目標的狀態
  readonly onSelectTarget?: (idx: number) => void;
}

export function WindFarmPanel({
  turbines,
  isPlayer,
  isTargeting,
  onSelectTarget,
}: WindFarmPanelProps) {
  return (
    <div className="flex flex-col gap-3 bg-gray-900/40 rounded-2xl border border-gray-800/50 p-4 shadow-xl">
      <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
        <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">
          {isPlayer ? '我的風場機組' : '對手的風場機組'}
        </span>
        <span className="text-[10px] text-gray-500 font-mono">
          Avg Avail: {Math.round(turbines.reduce((s, t) => s + t.avail, 0) / 3)}%
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {turbines.map((turbine, idx) => {
          const name = cardName(turbine.id) || turbine.id;
          const capacity = turbine.mw + turbine.mwBonus;

          // 計算可用率條寬度
          const availPct = Math.max(0, Math.min(100, turbine.avail));
          const maxAvailPct = Math.max(0, Math.min(100, turbine.originalAvail));

          // 決定可用率顏色
          let barColor = 'bg-sky-500';
          if (turbine.shutdown) {
            barColor = 'bg-rose-600 animate-pulse';
          } else if (availPct <= 40) {
            barColor = 'bg-rose-500';
          } else if (availPct <= 75) {
            barColor = 'bg-amber-500';
          }

          return (
            <div
              key={turbine.id}
              className={`relative bg-gray-950/45 rounded-xl border p-3 flex flex-col gap-2 transition-all duration-300 ${
                isTargeting
                  ? 'border-rose-500/80 cursor-pointer hover:bg-rose-950/20 ring-1 ring-rose-500/30 scale-102 hover:scale-104 shadow-lg shadow-rose-950/20'
                  : 'border-gray-800/80 hover:border-gray-700'
              }`}
              onClick={() => {
                if (isTargeting) {
                  onSelectTarget?.(idx);
                }
              }}
            >
              {/* 頂部名稱與容量 */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-200 truncate">{name}</span>
                <span className="text-[10px] font-bold text-sky-400 font-mono bg-sky-950/50 border border-sky-900/50 px-1.5 py-0.5 rounded">
                  ⚡{capacity}MW
                </span>
              </div>

              {/* 停機或免疫標籤 */}
              {turbine.shutdown ? (
                <div className="bg-rose-950/80 border border-rose-800/50 text-rose-300 text-[10px] font-bold text-center py-0.5 rounded animate-pulse">
                  ⚠️ 停機 SHUTDOWN
                </div>
              ) : turbine.faultImmuneRounds > 0 ? (
                <div className="bg-indigo-950/80 border border-indigo-800/50 text-indigo-300 text-[9px] font-semibold text-center py-0.5 rounded">
                  🛡️ 故障免疫 ({turbine.faultImmuneRounds}R)
                </div>
              ) : null}

              {/* 可用率長條圖 (包含最大可用率標示) */}
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold font-mono">
                  <span>Avail</span>
                  <span>
                    {availPct}% <span className="text-gray-600">/ {maxAvailPct}%</span>
                  </span>
                </div>
                {/* 可用率條背景 */}
                <div className="relative w-full h-3 bg-gray-900/80 rounded border border-gray-800/60 overflow-hidden">
                  {/* 最大可用率界線 (灰色底) */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-gray-800 rounded-l"
                    style={{ width: `${maxAvailPct}%` }}
                  />
                  {/* 目前可用率條 */}
                  <div
                    className={`absolute top-0 bottom-0 left-0 rounded-l transition-all duration-300 ${barColor}`}
                    style={{ width: `${availPct}%` }}
                  />
                </div>
                {/* 顯示永久損害量 */}
                {maxAvailPct < 100 && (
                  <span className="text-[9px] text-rose-400/80 font-mono font-medium self-end">
                    永久損失: -{100 - maxAvailPct}%
                  </span>
                )}
              </div>

              {/* 活躍故障列表 */}
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-[9px] font-extrabold text-gray-500 tracking-wider uppercase">
                  故障事件 ({turbine.faults.length})
                </span>
                {turbine.faults.length > 0 ? (
                  <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-0.5">
                    {turbine.faults.map((fault) => {
                      const faultCard = CARDS[fault.cardId];
                      const faultName = faultCard ? cardName(fault.cardId) : fault.cardId;
                      return (
                        <div
                          key={fault.cardId}
                          className="flex justify-between items-center bg-rose-950/20 border border-rose-900/30 rounded px-1.5 py-0.5 text-[9px] text-rose-300 font-medium"
                        >
                          <div className="flex items-center gap-1 truncate max-w-[80px]">
                            <span>{faultCard?.icon || '❌'}</span>
                            <span className="truncate">{faultName}</span>
                          </div>
                          <span className="text-[8px] text-rose-400 font-mono">
                            -{fault.drop}% ({fault.roundsLeft}R)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[9px] text-gray-500 italic py-1 pl-0.5">運行正常 ✅</div>
                )}
              </div>

              {/* 選取目標之十字準星 */}
              {isTargeting && (
                <div className="absolute inset-0 bg-rose-950/10 border-2 border-rose-500 rounded-xl flex items-center justify-center animate-pulse z-10 pointer-events-none">
                  <div className="w-8 h-8 rounded-full border-2 border-rose-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
