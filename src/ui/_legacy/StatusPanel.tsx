// 全域狀態面板：天氣效果 / 合約進度 / 風能預測 / 下回合加成。
// 這些資訊對遊戲決策至關重要，但原 UI 完全沒有呈現。
import { CARDS } from '../../core/cards';
import { cardName } from '../../i18n';
import type { GameState } from '../../core/types';

interface Props {
  readonly state: GameState;
}

/** 合約目標的中文說明 */
function contractDesc(cardId: string, progress: number): string {
  const card = CARDS[cardId];
  const t = card.target;
  if (!t) return '';
  switch (t.type) {
    case 'highAvail':
      return `保持可用率≥${t.threshold}% 連${t.rounds}回（已達 ${progress}/${t.rounds}）`;
    case 'totalMW':
      return `裝機達${t.threshold}MW（進行中）`;
    case 'techCount':
      return `累積${t.threshold}名技師（進行中）`;
    case 'killOpponent':
      return `對手全機組故障 連${t.rounds}回（已達 ${progress}/${t.rounds}）`;
    default:
      return `目標 ${t.type}`;
  }
}

/** 天氣效果的中文說明（對齊 abilities.ts 實際效果） */
function weatherEffect(cardId: string): string {
  switch (cardId) {
    case 'W01': return '風速加成 +0.3（本回合 MWh 提升）';
    case 'W02': return '強風全停：本回合所有機組不發電';
    case 'W03': return '風速懲罰 -0.3（本回合 MWh 降低）';
    case 'W04': return '本回合 MWh 收益 ×2（適時出手！）';
    case 'W05': return '持續低壓：風速懲罰 -0.3（持續多回）';
    default: return '';
  }
}

export default function StatusPanel({ state }: Props) {
  const hasWeather = state.activeWeather.length > 0;
  const hasContracts = state.activeContracts.length > 0;
  const hasFutureWind = state.futureWind.length > 0;
  const p0ExtraActions = state.players[0].pendingExtraActions;
  const p1ExtraActions = state.players[1].pendingExtraActions;
  const p0Boost = state.players[0].mwhBoostActive;

  // 若沒有任何特殊狀態就不渲染
  if (!hasWeather && !hasContracts && !hasFutureWind && !p0ExtraActions && !p1ExtraActions && !p0Boost) {
    return null;
  }

  return (
    <section className="flex flex-wrap gap-2 rounded-xl border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-xs">
      {/* 天氣效果 */}
      {state.activeWeather.map((aw, i) => {
        const card = CARDS[aw.cardId];
        const byWho = aw.appliedBy === 0 ? '🧑' : '🤖';
        return (
          <div
            key={i}
            title={weatherEffect(aw.cardId)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-600/50 bg-amber-950/50 px-2 py-1 text-amber-200"
          >
            <span className="text-base">{card.icon}</span>
            <span className="font-medium">{cardName(aw.cardId)}</span>
            <span className="text-amber-400 tabular-nums">×{aw.duration}回</span>
            <span className="opacity-60">{byWho}</span>
          </div>
        );
      })}

      {/* 合約進度 */}
      {state.activeContracts
        .filter((ac) => !ac.fulfilled)
        .map((ac, i) => {
          const card = CARDS[ac.cardId];
          const byWho = ac.player === 0 ? '🧑' : '🤖';
          const reward = card.target?.reward ?? 0;
          return (
            <div
              key={i}
              title={contractDesc(ac.cardId, ac.progress)}
              className="flex items-center gap-1.5 rounded-lg border border-violet-600/50 bg-violet-950/50 px-2 py-1 text-violet-200"
            >
              <span className="text-base">{card.icon}</span>
              <span className="font-medium">{byWho} {cardName(ac.cardId)}</span>
              <span className="text-violet-400">+{reward}</span>
              {ac.progress > 0 && (
                <span className="rounded bg-violet-900/60 px-1 tabular-nums text-[10px]">
                  {ac.progress}進度
                </span>
              )}
            </div>
          );
        })}

      {/* 風能預測（T05 已激活） */}
      {hasFutureWind && (
        <div className="flex items-center gap-1.5 rounded-lg border border-cyan-600/50 bg-cyan-950/50 px-2 py-1 text-cyan-200">
          <span>🔮</span>
          <span className="font-medium">預見</span>
          {state.futureWind.map((w, i) => (
            <span key={i} className="rounded bg-cyan-900/50 px-1.5 text-[10px]">
              {w.label}
            </span>
          ))}
        </div>
      )}

      {/* 下回合加碼動作 */}
      {p0ExtraActions > 0 && (
        <div className="flex items-center gap-1 rounded-lg border border-pink-600/50 bg-pink-950/50 px-2 py-1 text-pink-200">
          <span>⚡🧑</span>
          <span>下回合 +{p0ExtraActions} 動作</span>
        </div>
      )}
      {p1ExtraActions > 0 && (
        <div className="flex items-center gap-1 rounded-lg border border-pink-600/50 bg-pink-950/50 px-2 py-1 text-pink-200">
          <span>⚡🤖</span>
          <span>下回合 +{p1ExtraActions} 動作</span>
        </div>
      )}

      {/* 緊急投標 MWh×1.5 */}
      {p0Boost && (
        <div className="flex items-center gap-1 rounded-lg border border-yellow-500/50 bg-yellow-950/50 px-2 py-1 text-yellow-200">
          <span>💰</span>
          <span>🧑 本回合 MWh×1.5</span>
        </div>
      )}
    </section>
  );
}
