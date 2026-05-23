// 頂部資訊條：回合進度條 / 風速視覺 / 動作點 / 雙方分數 / 本回合 MWh 預覽。
import type { GameState } from '../../core/types';
import { uiPreviewMwh } from '../../store/game-store';

interface Props {
  readonly state: GameState;
}

/** 風速 label → 配色與 icon */
function windStyle(label: string): { bg: string; text: string; icon: string } {
  if (label.includes('颱') || label.includes('暴')) return { bg: 'bg-rose-900/60', text: 'text-rose-200', icon: '🌪️' };
  if (label.includes('強') || label.includes('疾')) return { bg: 'bg-amber-900/60', text: 'text-amber-200', icon: '💨' };
  if (label.includes('微') || label.includes('弱')) return { bg: 'bg-sky-900/60', text: 'text-sky-300', icon: '🌤️' };
  return { bg: 'bg-teal-900/60', text: 'text-teal-200', icon: '🌬️' };
}

export default function GameHeader({ state }: Props) {
  const ws = windStyle(state.wind.label);
  const roundPct = (state.round / state.maxRounds) * 100;
  const isPlayerTurn = state.currentPlayer === 0;
  const previewP0 = uiPreviewMwh(state, 0);
  const previewP1 = uiPreviewMwh(state, 1);

  const currentLabel = state.gameOver
    ? '🏁 遊戲結束'
    : isPlayerTurn
      ? '⚔️ 你的回合'
      : '🤖 AI 回合';

  return (
    <header className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 shadow">
      {/* 第一列：回合 + 風 + 動作 + 當前玩家 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* 左：回合 & 風速 */}
        <div className="flex items-center gap-3">
          {/* 回合 */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400">回合</span>
            <span className="text-2xl font-bold tabular-nums leading-none text-slate-100">
              {state.round}
              <span className="ml-0.5 text-sm font-normal text-slate-500">/{state.maxRounds}</span>
            </span>
          </div>

          {/* 風速 */}
          <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold ${ws.bg} ${ws.text}`}>
            <span className="text-base">{ws.icon}</span>
            <span>{state.wind.label}</span>
            <span className="text-xs font-normal opacity-70">×{state.wind.coeff.toFixed(2)}</span>
          </div>

          {/* 動作點：圓點視覺化（最多顯示 max(4, actionsLeft) 顆，T07+FN04 最多 5） */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400">動作</span>
            <div className="flex gap-0.5 pt-0.5">
              {Array.from({ length: Math.max(4, state.actionsLeft) }, (_, i) => (
                <span
                  key={i}
                  className={`h-3.5 w-3.5 rounded-full border transition-all ${
                    i < state.actionsLeft
                      ? 'border-amber-400 bg-amber-400 shadow-[0_0_4px_1px_rgba(251,191,36,0.5)]'
                      : 'border-slate-700 bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 中：當前回合 label */}
        <div
          className={`rounded-lg px-3 py-1 text-sm font-bold ${
            state.gameOver
              ? 'bg-slate-700 text-slate-200'
              : isPlayerTurn
                ? 'bg-amber-900/60 text-amber-200 ring-1 ring-amber-500/60'
                : 'bg-slate-800/60 text-slate-300'
          }`}
        >
          {currentLabel}
        </div>

        {/* 右：雙方分數 */}
        <div className="flex gap-3">
          <ScoreBadge
            label="🧑 你"
            score={state.players[0].score}
            preview={previewP0}
            active={isPlayerTurn && !state.gameOver}
          />
          <ScoreBadge
            label="🤖 AI"
            score={state.players[1].score}
            preview={previewP1}
            active={!isPlayerTurn && !state.gameOver}
          />
        </div>
      </div>

      {/* 第二列：回合進度條 */}
      <div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-600 to-amber-500 transition-all duration-700"
            style={{ width: `${roundPct}%` }}
          />
        </div>
      </div>
    </header>
  );
}

function ScoreBadge({ label, score, preview, active }: { label: string; score: number; preview: number; active: boolean }) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl px-3 py-1.5 transition-all ${
        active ? 'bg-amber-900/50 ring-1 ring-amber-500 shadow-[0_0_8px_1px_rgba(245,158,11,0.3)]' : 'bg-slate-800/70'
      }`}
    >
      <span className="text-[10px] text-slate-400">{label}</span>
      <span className="text-xl font-bold tabular-nums text-slate-100">{score}</span>
      <span className="text-[9px] text-slate-500">MWh</span>
      {/* 本回合預覽：+N */}
      {preview > 0 && (
        <span className="mt-0.5 text-[9px] font-medium text-emerald-400 tabular-nums">+{preview}↗</span>
      )}
    </div>
  );
}
