// 玩家區：機組列 + 技師列 + 總 MW 統計 + 對手手牌背面
import { CARDS } from '../../core/cards';
import { cardName } from '../../i18n';
import type { FaultCategory, PlayerState } from '../../core/types';

/** Route B：技師專長對應顯示標籤 */
const SPECIALTY_LABEL: Record<FaultCategory, { short: string; color: string }> = {
  mechanical: { short: '⚙️', color: 'text-orange-300' },
  blade:      { short: '🪂', color: 'text-sky-300' },
  electrical: { short: '⚡', color: 'text-yellow-300' },
  sensor:     { short: '📡', color: 'text-cyan-300' },
  hydraulic:  { short: '💧', color: 'text-blue-300' },
};
import TurbineSlot from './TurbineSlot';

interface Props {
  readonly label: string;
  readonly icon: string;
  readonly player: PlayerState;
  readonly isOpponent: boolean;
  readonly targetableTurbines?: boolean;
  readonly onSelectTarget?: (idx: number) => void;
}

/** 計算玩家場上當前有效 MW（不含故障扣減，純裝機量） */
function totalMW(player: PlayerState): number {
  return player.turbines.reduce((sum, t) => {
    const card = CARDS[t.cardId];
    return sum + (card.stats?.mw ?? 0) + t.mwBonus;
  }, 0);
}

/** 計算加權有效可用率 */
function avgAvail(player: PlayerState): number {
  if (player.turbines.length === 0) return 0;
  const effList = player.turbines.map((t) => {
    const drop = t.faults.reduce((s, f) => s + f.drop, 0);
    return Math.max(0, t.avail - drop);
  });
  return Math.round(effList.reduce((a, b) => a + b, 0) / effList.length);
}

export default function PlayerArea({ label, icon, player, isOpponent, targetableTurbines, onSelectTarget }: Props) {
  const mw = totalMW(player);
  const avail = avgAvail(player);
  const hasFaults = player.turbines.some((t) => t.faults.length > 0);

  return (
    <section
      className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors ${
        isOpponent
          ? 'border-slate-700/70 bg-slate-900/30'
          : 'border-slate-600/80 bg-slate-900/50 shadow-inner'
      }`}
    >
      {/* 標題列：玩家名稱 + 總 MW + 平均可用率 + 手牌/牌庫 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-bold text-slate-100">{label}</span>
          {hasFaults && <span className="text-xs text-rose-400">⚠️故障中</span>}
        </div>
        <div className="flex items-center gap-3 text-xs">
          {/* 總裝機 MW */}
          {mw > 0 && (
            <span className="flex items-center gap-0.5 font-semibold text-sky-300">
              ⚡<span className="tabular-nums">{mw}</span>
              <span className="text-slate-500">MW</span>
            </span>
          )}
          {/* 平均可用率 */}
          {player.turbines.length > 0 && (
            <span
              className={`tabular-nums font-medium ${
                avail >= 80 ? 'text-emerald-400' : avail >= 50 ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {avail}%
            </span>
          )}
          {/* 手牌/牌庫 */}
          <span className="text-slate-500">
            手{player.hand.length} 庫{player.deck.length}
          </span>
        </div>
      </div>

      {/* 機組列 */}
      <div className="flex flex-wrap gap-2">
        {player.turbines.length === 0 ? (
          <span className="rounded-lg border border-dashed border-slate-700 px-3 py-2 text-xs text-slate-600">
            尚無機組
          </span>
        ) : (
          player.turbines.map((t, i) => (
            <TurbineSlot
              key={i}
              turbine={t}
              idx={i}
              selectable={targetableTurbines}
              onSelect={onSelectTarget}
            />
          ))
        )}
      </div>

      {/* 技師列 */}
      {player.techs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {player.techs.map((id, i) => {
            const tech = CARDS[id];
            const specLabel = tech.specialty ? SPECIALTY_LABEL[tech.specialty] : null;
            return (
              <span
                key={i}
                title={`${cardName(id)}${specLabel ? ` — 專長：${tech.specialty}` : ''}`}
                className="flex items-center gap-1 rounded-lg border border-emerald-700/60 bg-emerald-950/50 px-2 py-0.5 text-xs text-emerald-200 shadow-sm"
              >
                <span>{tech.icon}</span>
                <span>{cardName(id)}</span>
                {/* Route B：專長圖示（幫學生快速辨認修復對象） */}
                {specLabel && (
                  <span className={`${specLabel.color} text-[10px]`}>{specLabel.short}</span>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* 對手手牌背面（張數指示） */}
      {isOpponent && player.hand.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500">對手手牌</span>
          <div className="flex gap-0.5">
            {player.hand.map((_, i) => (
              <div
                key={i}
                className="flex h-8 w-6 items-center justify-center rounded-md border border-slate-600 bg-gradient-to-b from-slate-700 to-slate-800 text-xs shadow"
              >
                🂠
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
