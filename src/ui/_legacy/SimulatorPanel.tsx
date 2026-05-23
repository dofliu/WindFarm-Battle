// 模擬器面板：在瀏覽器內執行 N 場 AI 對戰，顯示平衡指標。
// 教育用途：讓 Dof 和學生直觀理解遊戲的平衡性設計。
// 注意：simulate() 為同步函式，使用 setTimeout(fn, 0) 讓「執行中…」狀態先渲染。
import { useState } from 'react';
import { simulate, type SimSummary } from '../../core/simulation/runner';
import type { Difficulty } from '../../core/types';
import { cardName } from '../../i18n';

interface Props {
  readonly onClose: () => void;
}

// 合格門檻（與 scripts/simulate.ts 一致）
const T = { winMin: 0.42, winMax: 0.58, gap: 0.12, close: 0.25, blowout: 0.20 };
const tag = (pass: boolean) => pass ? '✅' : '❌';

export default function SimulatorPanel({ onClose }: Props) {
  const [games,   setGames]   = useState<200 | 500 | 1000>(200);
  const [p1,      setP1]      = useState<Difficulty>('hard');
  const [p2,      setP2]      = useState<Difficulty>('hard');
  const [running, setRunning] = useState(false);
  const [result,  setResult]  = useState<SimSummary | null>(null);

  function run() {
    setRunning(true);
    setResult(null);
    // yield to UI thread so "執行中…" button renders before blocking compute
    setTimeout(() => {
      setResult(simulate({ p1, p2, games }));
      setRunning(false);
    }, 0);
  }

  const diffLabel = (d: Difficulty) => d === 'easy' ? '😊入門' : d === 'medium' ? '😐中級' : '😈高手';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        {/* 標題 */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-100">📊 平衡模擬器</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 active:scale-95">✕</button>
        </div>

        {/* 設定列 */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {([200, 500, 1000] as const).map((n) => (
            <button key={n} onClick={() => setGames(n)}
              className={`rounded-lg px-2 py-1 ${games === n ? 'bg-sky-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
              {n}場
            </button>
          ))}
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button key={`p1-${d}`} onClick={() => setP1(d)}
              className={`rounded-lg px-2 py-1 ${p1 === d ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
              P1:{diffLabel(d)}
            </button>
          ))}
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button key={`p2-${d}`} onClick={() => setP2(d)}
              className={`rounded-lg px-2 py-1 ${p2 === d ? 'bg-violet-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
              P2:{diffLabel(d)}
            </button>
          ))}
          <button onClick={run} disabled={running}
            className="ml-auto rounded-lg bg-emerald-700 px-4 py-1 font-semibold text-white disabled:opacity-50 hover:bg-emerald-600 active:scale-95">
            {running ? '執行中…' : '▶ 執行'}
          </button>
        </div>

        {/* 結果 */}
        {result && (() => {
          const gap = Math.abs(result.p1WinRate - result.p2WinRate);
          const p1ok = result.p1WinRate >= T.winMin && result.p1WinRate <= T.winMax;
          const gapOk = gap <= T.gap;
          const closeOk = result.closeRate >= T.close;
          const blowOk = result.blowoutRate <= T.blowout;
          const allPass = p1ok && gapOk && closeOk && blowOk;
          // 排序卡牌使用率
          const sorted = Object.entries(result.cardUsageRate).sort((a, b) => b[1] - a[1]);
          const hot = sorted.slice(0, 5);
          const cold = sorted.slice(-5).reverse();
          return (
            <div className="space-y-2 text-xs">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-bold ${allPass ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'}`}>
                {allPass ? '🎉 全部合格' : '⚠️ 未達標準'} ({result.games} 場)
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-slate-300">
                <div className="rounded-lg bg-slate-800/60 p-2">
                  {tag(p1ok)} P1 {(result.p1WinRate*100).toFixed(1)}% / P2 {(result.p2WinRate*100).toFixed(1)}%
                </div>
                <div className="rounded-lg bg-slate-800/60 p-2">
                  {tag(gapOk)} 差距 {(gap*100).toFixed(1)}pp（≤12）
                </div>
                <div className="rounded-lg bg-slate-800/60 p-2">
                  {tag(closeOk)} 勢均力敵 {(result.closeRate*100).toFixed(1)}%（≥25）
                </div>
                <div className="rounded-lg bg-slate-800/60 p-2">
                  {tag(blowOk)} 一面倒 {(result.blowoutRate*100).toFixed(1)}%（≤20）
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg bg-slate-800/40 p-2">
                  <div className="mb-1 font-semibold text-amber-300">🔥 熱門</div>
                  {hot.map(([id, r]) => <div key={id} className="truncate text-slate-400">{cardName(id)} <span className="text-slate-300">{(r*100).toFixed(1)}%</span></div>)}
                </div>
                <div className="flex-1 rounded-lg bg-slate-800/40 p-2">
                  <div className="mb-1 font-semibold text-slate-400">🧊 冷門</div>
                  {cold.map(([id, r]) => <div key={id} className="truncate text-slate-500">{cardName(id)} <span className="text-slate-400">{(r*100).toFixed(1)}%</span></div>)}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
