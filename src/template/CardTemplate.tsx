// ============================================================
// Sprint 4：卡牌模板元件（預覽 + 印製用）
// 結構參考 VISUAL_WORKFLOW.md 卡牌版面規範
//
// 設計原則：
//   1. 資料完全由 cards.json + i18n 驅動，無硬編碼文字
//   2. 支援六種卡類配色 × 五種稀有度邊框
//   3. artImage 可選：有圖片時顯示插畫，無則顯示大型表情符號佔位符
//   4. size 切換螢幕預覽尺寸（print 尺寸固定）
// ============================================================
import { CARDS } from '../core/cards';
import { cardName, cardFlavor, abilityName, abilityDesc } from '../i18n';
import type { Card, CardType, FaultCategory } from '../core/types';

// ── 卡類配色 ──────────────────────────────────────────────────
const TYPE_STYLE: Record<CardType, {
  border: string; bg: string; headerBg: string; typeLabel: string; typeColor: string;
}> = {
  turbine:  { border: 'border-sky-500',     bg: 'bg-gradient-to-b from-sky-950 to-slate-950',    headerBg: 'bg-sky-900/80',    typeLabel: 'TURBINE',  typeColor: 'text-sky-300' },
  tech:     { border: 'border-emerald-500', bg: 'bg-gradient-to-b from-emerald-950 to-slate-950', headerBg: 'bg-emerald-900/80', typeLabel: 'TECH',     typeColor: 'text-emerald-300' },
  fault:    { border: 'border-rose-500',    bg: 'bg-gradient-to-b from-rose-950 to-slate-950',    headerBg: 'bg-rose-900/80',   typeLabel: 'FAULT',    typeColor: 'text-rose-300' },
  func:     { border: 'border-pink-500',    bg: 'bg-gradient-to-b from-pink-950 to-slate-950',    headerBg: 'bg-pink-900/80',   typeLabel: 'FUNCTION', typeColor: 'text-pink-300' },
  weather:  { border: 'border-amber-500',   bg: 'bg-gradient-to-b from-amber-950 to-slate-950',   headerBg: 'bg-amber-900/80',  typeLabel: 'WEATHER',  typeColor: 'text-amber-300' },
  contract: { border: 'border-violet-500',  bg: 'bg-gradient-to-b from-violet-950 to-slate-950',  headerBg: 'bg-violet-900/80', typeLabel: 'CONTRACT', typeColor: 'text-violet-300' },
};

// ── 稀有度邊框增強 ──────────────────────────────────────────────
function rarityBorderClass(rarity: number, isLegendary: boolean): string {
  if (isLegendary) return 'ring-2 ring-yellow-400/80 shadow-[0_0_16px_4px_rgba(234,179,8,0.4)] border-yellow-400';
  if (rarity >= 4)  return 'ring-1 ring-violet-400/60 border-2';
  if (rarity >= 3)  return 'ring-1 ring-sky-400/40';
  return '';
}

// ── Route B：分類顯示 ─────────────────────────────────────────
const CAT_LABEL: Record<FaultCategory, { label: string; color: string }> = {
  mechanical: { label: '⚙️ 機械', color: 'text-orange-300' },
  blade:      { label: '🪂 葉片', color: 'text-sky-300' },
  electrical: { label: '⚡ 電氣', color: 'text-yellow-300' },
  sensor:     { label: '📡 感測', color: 'text-cyan-300' },
  hydraulic:  { label: '💧 液壓', color: 'text-blue-300' },
};

// ── 能力 tag → 圖示 ───────────────────────────────────────────
const TAG_ICON: Record<string, string> = {
  'aura-mw': '⚡', 'weather-immune': '🛡️', 'card-draw-trigger': '🃏',
  'lowwind-resist': '🌬️', 'offshore-delay': '⏳', 'storm-vulnerable': '⚡',
  'immune-hydraulic': '🛡️', 'fault-immune': '🛡️', 'periodic-repair': '🔧',
  'predict-wind': '🔮', 'fault-warning': '⚠️', 'remote-blade': '🔭',
  'peek-hand': '👁️', 'func-discount': '💰', 'storm-amplify': '🌪️',
  unpredictable: '🎲', 'disable-scada': '🚫', 'info-leak': '🕵️',
  'contract-stable': '📋', 'contract-scale': '📋', 'contract-suppress': '📋', 'contract-techs': '📋',
};

// ── 尺寸系統 ─────────────────────────────────────────────────
const SIZE: Record<string, { w: string; artH: string; name: string; text: string }> = {
  small:  { w: 'w-36',   artH: 'h-24', name: 'text-sm',  text: 'text-[9px]' },
  medium: { w: 'w-52',   artH: 'h-36', name: 'text-base', text: 'text-[10px]' },
  large:  { w: 'w-64',   artH: 'h-44', name: 'text-lg',  text: 'text-xs' },
  print:  { w: 'w-[240px]', artH: 'h-[160px]', name: 'text-base', text: 'text-[10px]' },
};

export interface CardTemplateProps {
  readonly cardId: string;
  readonly artImage?: string;           // 純插畫圖檔路徑（選填）
  readonly size?: 'small' | 'medium' | 'large' | 'print';
  readonly showFlavor?: boolean;
  readonly highlighted?: boolean;
}

export default function CardTemplate({
  cardId,
  artImage,
  size = 'medium',
  showFlavor = true,
  highlighted = false,
}: CardTemplateProps) {
  const card = CARDS[cardId] as Card;
  const ts = TYPE_STYLE[card.type];
  const sz = SIZE[size];
  const rarity = card.rarity ?? 1;
  const isLegendary = card.legendary === true || card.rarity === 5;
  const rarityExtra = rarityBorderClass(rarity, isLegendary);

  // Route B 分類標籤
  const catDisplay = card.specialty
    ? CAT_LABEL[card.specialty]
    : card.faultCategory
      ? CAT_LABEL[card.faultCategory]
      : null;

  return (
    <div
      className={[
        sz.w,
        'flex flex-col rounded-2xl border-2 overflow-hidden shadow-2xl select-none',
        ts.border,
        ts.bg,
        rarityExtra,
        highlighted ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* ── 頂部標籤條：ID · TYPE · COST ── */}
      <div className={`flex items-center justify-between px-3 py-1.5 ${ts.headerBg}`}>
        <span className="font-mono text-[9px] font-bold text-slate-400 tracking-widest">{cardId}</span>
        <span className={`text-[9px] font-bold uppercase tracking-widest ${ts.typeColor}`}>
          {ts.typeLabel}
        </span>
        {/* 費用徽章 */}
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 text-xs font-bold text-white shadow">
          {card.cost}
        </span>
      </div>

      {/* ── 卡名區 ── */}
      <div className="px-3 pt-2 pb-1">
        <div className={`font-bold leading-tight ${isLegendary ? 'text-yellow-300' : 'text-slate-100'} ${sz.name}`}>
          {cardName(cardId)}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px] text-slate-500 font-mono">{card.iec}</span>
          {/* Route B 分類標籤 */}
          {catDisplay && (
            <span className={`text-[9px] font-semibold ${catDisplay.color}`}>
              {catDisplay.label}
            </span>
          )}
        </div>
      </div>

      {/* ── 主視覺：插畫 or 表情符號佔位符 ── */}
      <div className={`relative mx-2 rounded-xl overflow-hidden ${sz.artH} flex items-center justify-center bg-slate-900/60 border border-slate-700/50`}>
        {artImage ? (
          <img
            src={artImage}
            alt={cardName(cardId)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          /* 佔位符：居中大型表情符號 + 淡色 IEC 標籤 */
          <div className="flex flex-col items-center justify-center gap-1">
            <span className={`${sz.artH === 'h-24' ? 'text-5xl' : sz.artH === 'h-36' ? 'text-6xl' : 'text-7xl'} leading-none drop-shadow-2xl`}>
              {card.icon}
            </span>
            <span className="text-[8px] text-slate-600 font-mono">{card.iec}</span>
          </div>
        )}
        {/* 傳說光暈疊層 */}
        {isLegendary && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-yellow-900/30 to-transparent" />
        )}
      </div>

      {/* ── 數據條 ── */}
      <div className="flex items-center justify-center gap-3 px-3 py-1.5 text-[10px] font-semibold">
        {card.stats?.mw !== undefined && (
          <span className="text-sky-300">⚡{card.stats.mw} MW</span>
        )}
        {card.stats?.avail !== undefined && (
          <span className="text-emerald-300">{card.stats.avail}%</span>
        )}
        {card.stats?.drop !== undefined && (
          <span className="text-rose-300">-{card.stats.drop}%/回</span>
        )}
        {card.duration !== undefined && (
          <span className="text-amber-300">{card.duration}回</span>
        )}
        {card.stats?.sev !== undefined && (
          <span className="text-rose-400">Sev {card.stats.sev}</span>
        )}
        {/* 無任何數據的功能/合約卡顯示說明 */}
        {card.stats?.mw === undefined && card.stats?.drop === undefined && card.duration === undefined && (
          <span className="text-slate-600 text-[9px] italic">即時效果</span>
        )}
      </div>

      {/* ── 能力區 ── */}
      {card.abilities.length > 0 && (
        <div className="flex flex-col gap-1 px-2.5 pb-1.5">
          <div className="border-t border-slate-700/60 pt-1.5" />
          {card.abilities.map((ab, i) => (
            <div key={i} className="rounded-lg bg-slate-900/60 px-2 py-1">
              <div className={`flex items-baseline gap-1 font-bold text-amber-200 ${sz.text}`}>
                <span>{TAG_ICON[ab.tag] ?? '◆'}</span>
                <span>{abilityName(cardId, i)}</span>
                {ab.value !== undefined && (
                  <span className="text-slate-500 font-normal">(×{ab.value})</span>
                )}
              </div>
              {sz.text !== 'text-[9px]' && (
                <div className={`text-slate-400 leading-snug mt-0.5 ${sz.text}`}>
                  {abilityDesc(cardId, i)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── 風味文字 ── */}
      {showFlavor && (
        <div className="border-t border-slate-800/80 mx-2.5 mt-auto pt-1.5 pb-1 px-0.5 text-[9px] italic text-slate-600 leading-snug">
          &ldquo;{cardFlavor(cardId)}&rdquo;
        </div>
      )}

      {/* ── 底部：稀有度 + 傳說標記 ── */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex gap-0.5 text-[10px]">
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className={i < rarity
                ? isLegendary ? 'text-yellow-400' : 'text-amber-400'
                : 'text-slate-800'}
            >
              ★
            </span>
          ))}
        </div>
        {isLegendary && (
          <span className="text-[9px] font-bold tracking-wider text-yellow-400 uppercase">
            Legendary
          </span>
        )}
        {/* 品牌標記 */}
        <span className="text-[8px] text-slate-700 font-mono">WindFarm</span>
      </div>
    </div>
  );
}
