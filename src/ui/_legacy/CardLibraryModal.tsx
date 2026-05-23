// 牌庫瀏覽器：列出全部 50 張卡，依類別分組，支援搜尋。
// 教學核心功能：學生可在遊戲中隨時查閱卡牌效果、能力與 IEC 標準對應。
// Route B：技師顯示專長類別，故障顯示故障分類，幫助學生對症下藥。
import { useState, useMemo } from 'react';
import { CARDS, allCardIds } from '../../core/cards';
import { cardName, cardFlavor, abilityName, abilityDesc } from '../../i18n';
import type { CardType, FaultCategory } from '../../core/types';

/** Route B：故障分類 / 技師專長的顯示標籤 */
const CAT_DISPLAY: Record<FaultCategory, { label: string; color: string }> = {
  mechanical: { label: '⚙️機械', color: 'text-orange-300' },
  blade:      { label: '🪂葉片', color: 'text-sky-300' },
  electrical: { label: '⚡電氣', color: 'text-yellow-300' },
  sensor:     { label: '📡感測', color: 'text-cyan-300' },
  hydraulic:  { label: '💧液壓', color: 'text-blue-300' },
};

interface Props {
  readonly onClose: () => void;
}

const TYPE_LABEL: Record<CardType, { label: string; icon: string; color: string }> = {
  turbine: { label: '機組', icon: '🌬️', color: 'text-sky-300 border-sky-700 bg-sky-950/50' },
  tech: { label: '技師', icon: '🔧', color: 'text-emerald-300 border-emerald-700 bg-emerald-950/50' },
  fault: { label: '故障', icon: '💥', color: 'text-rose-300 border-rose-700 bg-rose-950/50' },
  func: { label: '功能', icon: '✨', color: 'text-pink-300 border-pink-700 bg-pink-950/50' },
  weather: { label: '天氣', icon: '🌦️', color: 'text-amber-300 border-amber-700 bg-amber-950/50' },
  contract: { label: '合約', icon: '📋', color: 'text-violet-300 border-violet-700 bg-violet-950/50' },
};

const TYPE_ORDER: CardType[] = ['turbine', 'tech', 'fault', 'func', 'weather', 'contract'];

/** 單張卡牌詳細列表項目（橫向緊湊版） */
function CardRow({ id }: { id: string }) {
  const card = CARDS[id];
  const t = TYPE_LABEL[card.type];
  const rarity = card.rarity ?? 1;
  const isLegendary = card.legendary === true || card.rarity === 5;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${t.color} ${
        isLegendary ? 'ring-1 ring-yellow-500/50 shadow-[0_0_6px_rgba(234,179,8,0.2)]' : ''
      }`}
    >
      {/* 圖示 + IEC */}
      <div className="flex flex-col items-center gap-0.5 min-w-[2.5rem]">
        <span className="text-2xl leading-none">{card.icon}</span>
        <span className="text-[8px] text-slate-500 tabular-nums">{card.iec}</span>
      </div>

      {/* 主要資訊 */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className={`font-bold text-sm ${isLegendary ? 'text-yellow-300' : 'text-slate-100'}`}>
            {cardName(id)}
          </span>
          {/* 稀有度星 */}
          <span className="text-[9px]">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={i < rarity ? (isLegendary ? 'text-yellow-400' : 'text-amber-400') : 'text-slate-700'}>★</span>
            ))}
            {isLegendary && <span className="ml-1 text-yellow-400 font-semibold text-[9px]">傳說</span>}
          </span>
        </div>

        {/* 數值行 */}
        <div className="flex flex-wrap gap-2 mt-0.5 text-[10px]">
          <span className="text-slate-400">費用 <span className="font-bold text-slate-200">{card.cost}</span></span>
          {card.stats?.mw !== undefined && (
            <span className="text-sky-300">⚡{card.stats.mw}MW</span>
          )}
          {card.stats?.avail !== undefined && (
            <span className="text-emerald-300">可用率{card.stats.avail}%</span>
          )}
          {card.stats?.drop !== undefined && (
            <span className="text-rose-300">-{card.stats.drop}%/回</span>
          )}
          {card.duration !== undefined && (
            <span className="text-amber-300">持續{card.duration}回</span>
          )}
          {card.stats?.sev !== undefined && (
            <span className="text-rose-400">嚴重度{card.stats.sev}</span>
          )}
          {/* Route B：技師專長標籤 */}
          {card.type === 'tech' && card.specialty && (
            <span className={`font-semibold ${CAT_DISPLAY[card.specialty].color}`}>
              專長：{CAT_DISPLAY[card.specialty].label}
            </span>
          )}
          {/* Route B：故障分類標籤 */}
          {card.type === 'fault' && card.faultCategory && (
            <span className={`font-semibold ${CAT_DISPLAY[card.faultCategory].color}`}>
              類型：{CAT_DISPLAY[card.faultCategory].label}
            </span>
          )}
        </div>

        {/* 能力說明 */}
        {card.abilities.length > 0 && (
          <div className="mt-1.5 flex flex-col gap-1">
            {card.abilities.map((_ab, i) => (
              <div key={i} className="rounded bg-slate-900/60 px-2 py-0.5 text-[9px]">
                <span className="font-semibold text-amber-200">{abilityName(id, i)}</span>
                <span className="text-slate-400 ml-1">— {abilityDesc(id, i)}</span>
              </div>
            ))}
          </div>
        )}

        {/* 風味文字 */}
        <div className="mt-1 text-[9px] italic text-slate-600 line-clamp-1">{cardFlavor(id)}</div>
      </div>
    </div>
  );
}

export default function CardLibraryModal({ onClose }: Props) {
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<CardType | 'all'>('all');

  // 過濾與分組（Route B：specialty / faultCategory 也納入搜尋）
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allCardIds.filter((id) => {
      const card = CARDS[id];
      if (activeType !== 'all' && card.type !== activeType) return false;
      if (!q) return true;
      const catLabel = card.specialty
        ? CAT_DISPLAY[card.specialty].label
        : card.faultCategory
          ? CAT_DISPLAY[card.faultCategory].label
          : '';
      return (
        id.toLowerCase().includes(q) ||
        cardName(id).includes(q) ||
        cardFlavor(id).toLowerCase().includes(q) ||
        card.iec.toLowerCase().includes(q) ||
        catLabel.includes(q)
      );
    });
  }, [search, activeType]);

  // 按類型分組（若 activeType=all）
  const groups = useMemo((): Array<{ type: CardType; ids: string[] }> => {
    if (activeType !== 'all') {
      return [{ type: activeType, ids: filtered }];
    }
    return TYPE_ORDER.map((type) => ({
      type,
      ids: filtered.filter((id) => CARDS[id].type === type),
    })).filter((g) => g.ids.length > 0);
  }, [filtered, activeType]);

  const totalCount = allCardIds.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-8 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="牌庫瀏覽器"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題列 */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <div className="text-lg font-bold text-slate-100">📚 牌庫瀏覽器</div>
            <div className="text-xs text-slate-500">全 {totalCount} 張 · 包含能力說明與 IEC 對應</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 active:scale-95"
          >
            ✕ 關閉
          </button>
        </div>

        {/* 搜尋列 + 類型篩選 */}
        <div className="border-b border-slate-800 px-5 py-3">
          <input
            type="text"
            placeholder="搜尋卡名、IEC 編號、風味文字…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveType('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                activeType === 'all'
                  ? 'bg-slate-100 text-slate-900'
                  : 'border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              全部 ({totalCount})
            </button>
            {TYPE_ORDER.map((type) => {
              const t = TYPE_LABEL[type];
              const count = allCardIds.filter((id) => CARDS[id].type === type).length;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    activeType === type
                      ? `border ${t.color} brightness-125`
                      : 'border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  {t.icon} {t.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* 卡牌列表 */}
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {groups.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              找不到符合的卡牌
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map(({ type, ids }) => (
                <div key={type}>
                  {activeType === 'all' && (
                    <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest ${TYPE_LABEL[type].color.split(' ')[0]}`}>
                      <span>{TYPE_LABEL[type].icon}</span>
                      <span>{TYPE_LABEL[type].label}</span>
                      <span className="font-normal text-slate-600">({ids.length})</span>
                      <div className="flex-1 border-t border-slate-800" />
                    </div>
                  )}
                  <div className="grid gap-2 sm:grid-cols-1">
                    {ids.map((id) => (
                      <CardRow key={id} id={id} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
