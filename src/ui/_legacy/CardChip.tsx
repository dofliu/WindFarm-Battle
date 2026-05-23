// 卡牌元件（手牌版 md / 對手背面 sm）。
// 設計重點：彩色邊框 + 稀有度星星 + 能力 icon + 費用徽章 + hover tooltip。
import { CARDS } from '../../core/cards';
import { cardName, cardFlavor, abilityName, abilityDesc } from '../../i18n';
import type { CardType, FaultCategory } from '../../core/types';

/** Route B：故障類別 / 技師專長的顯示標籤（教育輔助） */
const CAT_DISPLAY: Record<FaultCategory, { label: string; color: string }> = {
  mechanical: { label: '⚙️機械', color: 'text-orange-300' },
  blade:      { label: '🪂葉片', color: 'text-sky-300' },
  electrical: { label: '⚡電氣', color: 'text-yellow-300' },
  sensor:     { label: '📡感測', color: 'text-cyan-300' },
  hydraulic:  { label: '💧液壓', color: 'text-blue-300' },
};

// 各卡類配色（邊框、背景、文字）
const STYLE_BY_TYPE: Record<CardType, { border: string; bg: string; text: string; glow: string }> = {
  turbine: {
    border: 'border-sky-500',
    bg: 'bg-gradient-to-b from-sky-950/90 to-slate-950/90',
    text: 'text-sky-100',
    glow: 'shadow-sky-900/60',
  },
  tech: {
    border: 'border-emerald-500',
    bg: 'bg-gradient-to-b from-emerald-950/90 to-slate-950/90',
    text: 'text-emerald-100',
    glow: 'shadow-emerald-900/60',
  },
  fault: {
    border: 'border-rose-500',
    bg: 'bg-gradient-to-b from-rose-950/90 to-slate-950/90',
    text: 'text-rose-100',
    glow: 'shadow-rose-900/60',
  },
  func: {
    border: 'border-pink-500',
    bg: 'bg-gradient-to-b from-pink-950/90 to-slate-950/90',
    text: 'text-pink-100',
    glow: 'shadow-pink-900/60',
  },
  weather: {
    border: 'border-amber-500',
    bg: 'bg-gradient-to-b from-amber-950/90 to-slate-950/90',
    text: 'text-amber-100',
    glow: 'shadow-amber-900/60',
  },
  contract: {
    border: 'border-violet-500',
    bg: 'bg-gradient-to-b from-violet-950/90 to-slate-950/90',
    text: 'text-violet-100',
    glow: 'shadow-violet-900/60',
  },
};

// 能力 tag → 簡短圖示 label（最多 2 個顯示）
const TAG_ICON: Record<string, string> = {
  'aura-mw': '⚡光',
  'weather-immune': '🛡️天',
  'card-draw-trigger': '🃏抽',
  'lowwind-resist': '🌬️韌',
  'offshore-delay': '⏳岸',
  'storm-vulnerable': '⚡弱',
  'immune-hydraulic': '🛡️液',
  'fault-immune': '🛡️障',
  'periodic-repair': '🔧修',
  'predict-wind': '🔮預',
  'fault-warning': '⚠️警',
  'remote-blade': '🔭遠',
  'peek-hand': '👁️觀',
  'func-discount': '💰折',
  'storm-amplify': '🌪️擴',
  unpredictable: '🎲亂',
  'disable-scada': '🚫控',
  'info-leak': '🕵️洩',
  'contract-stable': '📋穩',
  'contract-scale': '📋大',
  'contract-suppress': '📋壓',
  'contract-techs': '📋師',
};

interface Props {
  readonly cardId: string;
  readonly cost?: number;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly highlighted?: boolean;
  readonly size?: 'sm' | 'md';
}

export default function CardChip({ cardId, cost, onClick, disabled, highlighted, size = 'md' }: Props) {
  const card = CARDS[cardId];
  const style = STYLE_BY_TYPE[card.type];
  const c = cost ?? card.cost;
  const isClickable = onClick && !disabled;
  const isLegendary = card.legendary === true || card.rarity === 5;
  const rarity = card.rarity ?? 1;

  // 傳說卡：金色外發光
  const legendaryRing = isLegendary
    ? 'ring-2 ring-yellow-400/70 shadow-[0_0_12px_2px_rgba(234,179,8,0.35)]'
    : '';
  const highlightRing = highlighted ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : '';

  // ── sm：對手手牌背面（小牌背）──
  if (size === 'sm') {
    return (
      <div className="flex h-9 w-7 items-center justify-center rounded border border-slate-600 bg-slate-700 text-sm shadow">
        🂠
      </div>
    );
  }

  // ── md：玩家手牌（完整卡片）──
  return (
    <div className="group relative">
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={[
        'relative flex w-24 flex-col gap-0 rounded-xl border-2 text-left shadow-lg transition-all duration-150',
        style.border,
        style.bg,
        style.text,
        legendaryRing,
        highlightRing,
        isClickable
          ? 'cursor-pointer hover:-translate-y-1 hover:scale-105 hover:brightness-125 hover:shadow-xl'
          : 'opacity-45 cursor-not-allowed',
        `shadow-lg ${style.glow}`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* 頂部：費用 badge + 卡類縮寫 */}
      <div className="flex items-center justify-between px-2 pt-1.5">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow ${
            disabled ? 'bg-slate-700 text-slate-400' : 'bg-slate-900/80 text-white'
          }`}
        >
          {c}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-wide opacity-60">
          {card.type === 'turbine' ? 'MW' : card.type === 'tech' ? 'TECH' : card.type === 'fault' ? 'FAULT' : card.type.toUpperCase()}
        </span>
      </div>

      {/* 中間：大圖示 */}
      <div className="flex justify-center py-1 text-3xl leading-none">{card.icon}</div>

      {/* 卡名 */}
      <div className="truncate px-1.5 text-center text-[10px] font-semibold leading-tight">
        {cardName(cardId)}
      </div>

      {/* 數值列：MW / drop / duration + Route B 分類標籤 */}
      <div className="flex flex-wrap justify-center gap-1 px-1.5 py-0.5 text-[9px] font-medium">
        {card.stats?.mw !== undefined && (
          <span className="text-sky-300">⚡{card.stats.mw}MW</span>
        )}
        {card.stats?.drop !== undefined && (
          <span className="text-rose-300">-{card.stats.drop}%</span>
        )}
        {card.duration !== undefined && (
          <span className="text-amber-300">{card.duration}回</span>
        )}
        {/* Route B：技師專長標籤（教育輔助：讓學生知道該派誰修） */}
        {card.type === 'tech' && card.specialty && (
          <span className={`${CAT_DISPLAY[card.specialty].color} font-semibold`}>
            {CAT_DISPLAY[card.specialty].label}
          </span>
        )}
        {/* Route B：故障分類標籤（教育輔助：讓學生知道要用哪類技師） */}
        {card.type === 'fault' && card.faultCategory && (
          <span className={`${CAT_DISPLAY[card.faultCategory].color} font-semibold`}>
            {CAT_DISPLAY[card.faultCategory].label}
          </span>
        )}
      </div>

      {/* 能力 icons（最多 2 個） */}
      {card.abilities.length > 0 && (
        <div className="flex flex-wrap justify-center gap-0.5 px-1 pb-1">
          {card.abilities.slice(0, 2).map((ab, i) => (
            <span
              key={i}
              title={ab.tag}
              className="rounded bg-slate-900/60 px-1 py-0.5 text-[8px] leading-tight opacity-90"
            >
              {TAG_ICON[ab.tag] ?? ab.tag.slice(0, 4)}
            </span>
          ))}
        </div>
      )}

      {/* 底部：稀有度星星 */}
      <div className="flex justify-center pb-1.5 text-[8px]">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < rarity ? (isLegendary ? 'text-yellow-400' : 'text-amber-400') : 'text-slate-700'}>
            ★
          </span>
        ))}
      </div>
    </button>

    {/* Hover 詳細面板：顯示完整卡牌資訊（向上展開，z-50 確保不被蓋住） */}
    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-xl border-2 border-slate-600 bg-slate-900/95 p-3 text-xs shadow-2xl opacity-0 transition-opacity duration-150 group-hover:opacity-100">
      {/* 卡名 + icon */}
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-2xl">{card.icon}</span>
        <div>
          <div className="font-bold text-slate-100 leading-tight">{cardName(cardId)}</div>
          <div className="text-[10px] text-slate-400">{card.iec} · 費用 {c}</div>
        </div>
      </div>

      {/* 稀有度 */}
      <div className="mb-1.5 flex gap-0.5 text-[10px]">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < rarity ? (isLegendary ? 'text-yellow-400' : 'text-amber-400') : 'text-slate-700'}>★</span>
        ))}
        {isLegendary && <span className="ml-1 text-yellow-400 font-bold">傳說</span>}
      </div>

      {/* 數值 */}
      <div className="mb-1.5 flex flex-wrap gap-2 text-[10px]">
        {card.stats?.mw !== undefined && <span className="text-sky-300">⚡ {card.stats.mw} MW</span>}
        {card.stats?.avail !== undefined && <span className="text-emerald-300">可用率 {card.stats.avail}%</span>}
        {card.stats?.drop !== undefined && <span className="text-rose-300">-{card.stats.drop}%/回</span>}
        {card.duration !== undefined && <span className="text-amber-300">持續 {card.duration} 回</span>}
        {/* Route B：技師專長（完整標籤，幫助學生選對修復人員） */}
        {card.type === 'tech' && card.specialty && (
          <span className={`${CAT_DISPLAY[card.specialty].color} font-semibold`}>
            專長：{CAT_DISPLAY[card.specialty].label}
          </span>
        )}
        {/* Route B：故障分類（提示學生對症下藥） */}
        {card.type === 'fault' && card.faultCategory && (
          <span className={`${CAT_DISPLAY[card.faultCategory].color} font-semibold`}>
            類型：{CAT_DISPLAY[card.faultCategory].label}
          </span>
        )}
      </div>

      {/* 能力說明 */}
      {card.abilities.map((ab, i) => (
        <div key={i} className="mb-1 rounded bg-slate-800/70 px-2 py-1">
          <div className="font-semibold text-amber-200 text-[10px]">
            {TAG_ICON[ab.tag] ?? '◆'} {abilityName(cardId, i)}
            {ab.value !== undefined && <span className="ml-1 text-slate-400">(×{ab.value})</span>}
          </div>
          <div className="text-[9px] text-slate-300 leading-snug mt-0.5">{abilityDesc(cardId, i)}</div>
        </div>
      ))}

      {/* 風味文字 */}
      <div className="mt-1.5 border-t border-slate-700 pt-1 text-[9px] italic text-slate-500 leading-snug">
        {cardFlavor(cardId)}
      </div>
    </div>
    </div>
  );
}
