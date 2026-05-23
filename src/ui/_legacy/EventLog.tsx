// 事件 log：把 GameEvent 用中文描述顯示，最新在最上方，可捲動。
import { useEffect, useRef } from 'react';
import { cardName } from '../../i18n';
import type { GameEvent } from '../../core/events';

interface Props {
  readonly events: readonly GameEvent[];
  readonly limit?: number;
}

const KIND_COLOR: Record<string, string> = {
  'round-start': 'text-amber-300 font-semibold',
  'round-scored': 'text-yellow-300',
  'game-over': 'text-amber-200 font-bold',
  'fault-applied': 'text-rose-300',
  'fault-cascaded': 'text-rose-400 font-semibold',
  'fault-repaired': 'text-emerald-400',
  'turbine-deployed': 'text-sky-300',
  'turbine-replaced': 'text-sky-300',
  'turbine-upgraded': 'text-pink-300',
  'tech-deployed': 'text-emerald-300',
  'predict-wind': 'text-cyan-300',
  'weather-applied': 'text-amber-300',
  'weather-expired': 'text-amber-600',
  'contract-fulfilled': 'text-violet-200 font-bold',
  'contract-applied': 'text-violet-300',
  'mwh-boost': 'text-pink-300 font-semibold',
  default: 'text-slate-400',
};

function describe(ev: GameEvent): { text: string; colorKey: string } {
  const who = (p: 0 | 1) => (p === 0 ? '🧑' : '🤖');
  switch (ev.kind) {
    case 'round-start':
      return { text: `── 回合 ${ev.round} 開始（${ev.windLabel}）──`, colorKey: 'round-start' };
    case 'card-played':
      return { text: `${who(ev.player)} 打出 ${cardName(ev.cardId)}`, colorKey: 'default' };
    case 'card-drawn':
      return { text: `${who(ev.player)} 抽到 ${cardName(ev.cardId)}`, colorKey: 'default' };
    case 'card-discarded':
      return { text: `${who(ev.player)} 棄掉 ${cardName(ev.cardId)}`, colorKey: 'default' };
    case 'turbine-shutdown':
      return { text: `🔴 ${who(ev.player)} ${cardName(ev.cardId)} 緊急停機！`, colorKey: 'fault-cascaded' };
    case 'turbine-restart':
      return { text: `🟢 ${who(ev.player)} ${cardName(ev.cardId)} 恢復運轉`, colorKey: 'fault-repaired' };
    case 'turbine-deployed':
      return { text: `${who(ev.player)} ⛵ 部署 ${cardName(ev.cardId)}`, colorKey: 'turbine-deployed' };
    case 'turbine-replaced':
      return { text: `${who(ev.player)} 替換 ${cardName(ev.oldCardId)} → ${cardName(ev.newCardId)}`, colorKey: 'turbine-replaced' };
    case 'turbine-returned':
      return { text: `${who(ev.player)} 收回 ${cardName(ev.cardId)}`, colorKey: 'default' };
    case 'turbine-upgraded':
      return { text: `${who(ev.player)} ${cardName(ev.cardId)} 升級 +${ev.bonus}MW`, colorKey: 'turbine-upgraded' };
    case 'tech-deployed':
      return { text: `${who(ev.player)} 🛠️ 派遣 ${cardName(ev.cardId)}`, colorKey: 'tech-deployed' };
    case 'fault-applied':
      return { text: `${who(ev.player)} 機組#${ev.targetIdx} ← ${cardName(ev.cardId)}(-${ev.drop}%)`, colorKey: 'fault-applied' };
    case 'fault-cascaded':
      return { text: `🔥 連鎖！機組#${ev.targetIdx} ${cardName(ev.cardId)}`, colorKey: 'fault-cascaded' };
    case 'fault-repaired': {
      // Route B：顯示修復品質（完全 vs 部分）——教育重點
      const qualityTag = ev.quality === 'partial'
        ? `⚠️部分（-${ev.availLost ?? 0}%可用率）`
        : ev.quality === 'full' ? '✅完全' : '';
      const byName = ev.by ? `（${cardName(ev.by)}）` : '';
      return { text: `🔧 ${qualityTag}修復 ${cardName(ev.cardId)}${byName}`, colorKey: 'fault-repaired' };
    }
    case 'func-played':
      return { text: `${who(ev.player)} ✨ ${cardName(ev.cardId)}`, colorKey: 'default' };
    case 'predict-wind':
      return { text: `🔮 預見 ${ev.labels.join('、')}`, colorKey: 'predict-wind' };
    case 'extra-action-banked':
      return { text: `${who(ev.player)} 下回合 +1 動作（累積${ev.pending}）`, colorKey: 'default' };
    case 'mwh-boost':
      return { text: `⚡ ${who(ev.player)} 緊急投標 MWh×1.5`, colorKey: 'mwh-boost' };
    case 'turn-ended':
      return { text: `${who(ev.player)} 結束回合`, colorKey: 'default' };
    case 'weather-applied':
      return { text: `🌬️ ${who(ev.player)} 施放 ${cardName(ev.cardId)}（${ev.duration}回）`, colorKey: 'weather-applied' };
    case 'weather-expired':
      return { text: `🌬️ ${cardName(ev.cardId)} 效果結束`, colorKey: 'weather-expired' };
    case 'tutor-turbine':
      return { text: `${who(ev.player)} 從牌庫取出 ${cardName(ev.cardId)}`, colorKey: 'turbine-deployed' };
    case 'contract-applied':
      return { text: `📋 ${who(ev.player)} 簽下 ${cardName(ev.cardId)}`, colorKey: 'contract-applied' };
    case 'contract-progress':
      return { text: `📋 ${who(ev.player)} ${cardName(ev.cardId)} 進度 ${ev.progress}`, colorKey: 'default' };
    case 'contract-fulfilled':
      return { text: `🏆 ${who(ev.player)} 合約達成 ${cardName(ev.cardId)} +${ev.reward}`, colorKey: 'contract-fulfilled' };
    case 'round-scored':
      return { text: `${who(ev.player)} 結算 +${ev.mwh} MWh（總 ${ev.total}）`, colorKey: 'round-scored' };
    case 'game-over':
      return {
        text: ev.winner === -1 ? '🤝 平手！' : ev.winner === 0 ? '🎉 你贏了！' : '😈 AI 贏了',
        colorKey: 'game-over',
      };
    default:
      return { text: JSON.stringify(ev), colorKey: 'default' };
  }
}

export default function EventLog({ events, limit = 80 }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  // 新事件出現時自動捲到最上方（jsdom 測試環境不支援 scrollTo，需要防護）
  useEffect(() => {
    const el = listRef.current;
    if (el && typeof el.scrollTo === 'function') {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [events.length]);

  const recent = [...events].slice(-limit).reverse();

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-900/60 p-3 shadow">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-100">📜 戰況</span>
        <span className="text-[10px] text-slate-500">{events.length} 筆</span>
      </div>
      <div ref={listRef} className="flex-1 space-y-0.5 overflow-y-auto text-xs leading-relaxed">
        {recent.length === 0 && <span className="text-slate-600">（尚無事件）</span>}
        {recent.map((ev, i) => {
          const { text, colorKey } = describe(ev);
          const color = KIND_COLOR[colorKey] ?? KIND_COLOR.default;
          const isSection = ev.kind === 'round-start';
          return (
            <div
              key={i}
              className={`${color} ${isSection ? 'mt-1 border-t border-slate-800 pt-1' : ''}`}
            >
              {text}
            </div>
          );
        })}
      </div>
    </section>
  );
}
