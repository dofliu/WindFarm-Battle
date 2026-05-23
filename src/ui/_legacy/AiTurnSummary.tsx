// AI 回合摘要面板：玩家結束回合後顯示，讓學生了解 AI 的策略意圖。
// 教學重點：清楚說明 AI 部署了什麼、施加了什麼故障，幫助學生反思應對。
import type { GameEvent } from '../../core/events';
import { cardName } from '../../i18n';

interface Props {
  readonly actions: GameEvent[];
}

/** 把 AI 動作事件轉換成一行中文描述 */
function describeAction(ev: GameEvent): string | null {
  switch (ev.kind) {
    case 'turbine-deployed':
      return `⛵ 部署 ${cardName(ev.cardId)}`;
    case 'turbine-replaced':
      return `🔄 替換 ${cardName(ev.oldCardId)} → ${cardName(ev.newCardId)}`;
    case 'tech-deployed':
      return `🛠️ 派遣 ${cardName(ev.cardId)}`;
    case 'fault-applied': {
      const drop = ev.drop > 0 ? `（-${ev.drop}%）` : '';
      return `💥 施加 ${cardName(ev.cardId)}${drop}`;
    }
    case 'fault-cascaded':
      return `🔥 連鎖故障 ${cardName(ev.cardId)}`;
    case 'func-played':
      return `✨ 使用 ${cardName(ev.cardId)}`;
    case 'weather-applied':
      return `🌬️ 施放天氣 ${cardName(ev.cardId)}（${ev.duration} 回）`;
    case 'contract-applied':
      return `📋 簽下合約 ${cardName(ev.cardId)}`;
    case 'mwh-boost':
      return `⚡ 緊急投標 MWh×1.5`;
    case 'extra-action-banked':
      return `🎯 儲備額外動作`;
    case 'turbine-shutdown':
      return `🔴 ${cardName(ev.cardId)} 故障停機`;
    default:
      return null;
  }
}

/** 事件種類 → 左邊彩色指示條 */
function eventColor(ev: GameEvent): string {
  if (ev.kind === 'fault-applied' || ev.kind === 'fault-cascaded' || ev.kind === 'turbine-shutdown') {
    return 'border-l-2 border-rose-500/70 bg-rose-950/30';
  }
  if (ev.kind === 'turbine-deployed' || ev.kind === 'turbine-replaced') {
    return 'border-l-2 border-sky-500/70 bg-sky-950/30';
  }
  if (ev.kind === 'tech-deployed') {
    return 'border-l-2 border-emerald-500/70 bg-emerald-950/30';
  }
  if (ev.kind === 'weather-applied') {
    return 'border-l-2 border-amber-500/70 bg-amber-950/30';
  }
  if (ev.kind === 'contract-applied') {
    return 'border-l-2 border-violet-500/70 bg-violet-950/30';
  }
  return 'border-l-2 border-slate-600/50 bg-slate-900/30';
}

export default function AiTurnSummary({ actions }: Props) {
  if (actions.length === 0) return null;

  // 收集故障統計：AI 對玩家施加了幾次
  const faultCount = actions.filter(e => e.kind === 'fault-applied' || e.kind === 'fault-cascaded').length;

  // 卡名去重（同一張卡可能被打出多次，顯示一次即可，但保留順序）
  const lines: { text: string; color: string }[] = [];
  for (const ev of actions) {
    const text = describeAction(ev);
    if (text) {
      lines.push({ text, color: eventColor(ev) });
    }
  }

  return (
    <div className="mb-2 rounded-xl border border-rose-800/40 bg-rose-950/20 px-3 py-2.5">
      {/* 標題列 */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400/80">
          🤖 AI 上一回合動作
        </span>
        {faultCount > 0 && (
          <span className="rounded-full bg-rose-900/60 px-2 py-0.5 text-[9px] font-semibold text-rose-300 ring-1 ring-rose-600/40">
            ⚠️ 施加了 {faultCount} 個故障
          </span>
        )}
      </div>

      {/* 動作列表 */}
      <div className="flex flex-col gap-1">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`rounded px-2 py-0.5 text-[11px] text-slate-200 ${line.color}`}
          >
            {line.text}
          </div>
        ))}
      </div>

      {/* 提示：點任意牌或結束回合可關閉 */}
      <div className="mt-1.5 text-[9px] text-slate-600">出牌或棄牌後自動隱藏</div>
    </div>
  );
}
