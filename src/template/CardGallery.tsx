// ============================================================
// Sprint 4：卡牌圖鑑（CardGallery）
//
// 功能：
//   1. 顯示全部 50 張卡牌的 CardTemplate 預覽
//   2. 依類別/稀有度過濾
//   3. 右上角「🖨 列印」觸發 window.print()（印出全部 30px 格）
//   4. 右上角「📄 匯出 PDF」批次截圖 → jsPDF A4（每頁 3×3）
//   5. 可從 App.tsx 頂部列中喚出的 Modal
// ============================================================
import { useState, useMemo } from 'react';
import { CARDS, allCardIds } from '../core/cards';
import CardTemplate from './CardTemplate';
import { exportCardsToPdf } from './CardExporter';
import type { CardType } from '../core/types';

interface Props {
  readonly onClose: () => void;
}

// 類別過濾選項
const TYPE_OPTIONS: { value: CardType | 'all'; label: string }[] = [
  { value: 'all',      label: '全部' },
  { value: 'turbine',  label: '🌀 機組' },
  { value: 'tech',     label: '🔧 技師' },
  { value: 'fault',    label: '⚡ 故障' },
  { value: 'func',     label: '✨ 功能' },
  { value: 'weather',  label: '🌪️ 天氣' },
  { value: 'contract', label: '📋 合約' },
];

// 稀有度過濾選項
const RARITY_OPTIONS: { value: number | 0; label: string }[] = [
  { value: 0, label: '全部' },
  { value: 1, label: '★☆☆☆☆' },
  { value: 2, label: '★★☆☆☆' },
  { value: 3, label: '★★★☆☆' },
  { value: 4, label: '★★★★☆' },
  { value: 5, label: '★★★★★ 傳說' },
];

export default function CardGallery({ onClose }: Props) {
  const [typeFilter, setTypeFilter] = useState<CardType | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<number>(0);
  const [sizeMode, setSizeMode] = useState<'small' | 'medium'>('small');

  // PDF 匯出狀態
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(0);
  const [exportTotal, setExportTotal] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  const filteredIds = useMemo(() => {
    return allCardIds.filter((id) => {
      const card = CARDS[id];
      if (!card) return false;
      if (typeFilter !== 'all' && card.type !== typeFilter) return false;
      if (rarityFilter !== 0 && (card.rarity ?? 1) !== rarityFilter) return false;
      return true;
    });
  }, [typeFilter, rarityFilter]);

  // ── PDF 匯出處理 ──────────────────────────────────────────
  async function handleExportPdf() {
    if (exporting || filteredIds.length === 0) return;
    setExporting(true);
    setExportDone(0);
    setExportTotal(filteredIds.length);
    setExportError(null);
    try {
      const typeLabel = typeFilter === 'all' ? 'all' : typeFilter;
      const rarityLabel = rarityFilter === 0 ? '' : `-r${rarityFilter}`;
      const filename = `windfarm-cards-${typeLabel}${rarityLabel}.pdf`;
      await exportCardsToPdf(
        filteredIds,
        filename,
        (done, total) => {
          setExportDone(done);
          setExportTotal(total);
        },
      );
    } catch (err) {
      // 匯出失敗：顯示錯誤訊息，5 秒後自動清除
      const msg = err instanceof Error ? err.message : '未知錯誤';
      setExportError(`匯出失敗：${msg}`);
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setExporting(false);
    }
  }

  // ── 進度文字 ──────────────────────────────────────────────
  const progressText = exporting
    ? `匯出中… ${exportDone}/${exportTotal}`
    : `📄 匯出 PDF（${filteredIds.length} 張）`;

  return (
    <>
      {/* ── 螢幕 overlay（列印時隱藏） ── */}
      <div className="card-gallery-modal fixed inset-0 z-50 flex flex-col bg-slate-950/95 print:static print:bg-white">

        {/* ── 頂部工具列（列印時隱藏） ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 bg-slate-900/90 px-4 py-2 print:hidden">
          {/* 左：標題 + 計數 */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100">🎴 卡牌圖鑑</span>
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
              {filteredIds.length} 張
            </span>
          </div>

          {/* 中：過濾器 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 類別 */}
            <div className="flex gap-0.5 rounded-lg bg-slate-800 p-0.5">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTypeFilter(opt.value)}
                  className={`rounded-md px-2 py-1 text-xs transition-all ${
                    typeFilter === opt.value
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 稀有度 */}
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(Number(e.target.value))}
              className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:outline-none"
            >
              {RARITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* 尺寸切換 */}
            <div className="flex gap-0.5 rounded-lg bg-slate-800 p-0.5">
              {(['small', 'medium'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSizeMode(s)}
                  className={`rounded-md px-2 py-1 text-xs transition-all ${
                    sizeMode === s
                      ? 'bg-sky-700 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s === 'small' ? '小' : '中'}
                </button>
              ))}
            </div>
          </div>

          {/* 右：匯出 PDF + 列印 + 關閉 */}
          <div className="flex items-center gap-2">
            {/* 匯出 PDF 按鈕 */}
            <button
              onClick={handleExportPdf}
              disabled={exporting || filteredIds.length === 0}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold text-white shadow transition-all ${
                exporting
                  ? 'cursor-not-allowed bg-indigo-800 opacity-70'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'
              }`}
            >
              {progressText}
            </button>

            {/* 列印按鈕 */}
            <button
              onClick={() => window.print()}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white shadow transition-all hover:bg-emerald-600 active:scale-95"
            >
              🖨 列印
            </button>

            {/* 關閉按鈕 */}
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-semibold text-slate-200 shadow transition-all hover:bg-slate-600 active:scale-95"
            >
              ✕ 關閉
            </button>
          </div>
        </div>

        {/* ── 匯出錯誤提示（失敗時顯示） ── */}
        {exportError && (
          <div className="bg-rose-900/80 px-4 py-1.5 text-xs text-rose-200 print:hidden">
            ⚠️ {exportError}
          </div>
        )}

        {/* ── 匯出進度條（匯出中才顯示） ── */}
        {exporting && exportTotal > 0 && (
          <div className="h-1 bg-slate-800 print:hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-200"
              style={{ width: `${Math.round((exportDone / exportTotal) * 100)}%` }}
            />
          </div>
        )}

        {/* ── 卡牌網格 ── */}
        <div className="flex-1 overflow-y-auto p-4 print:overflow-visible print:p-0">
          {filteredIds.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-slate-600">
              沒有符合條件的卡牌
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 print:gap-4">{/* print:gap-4 給卡片之間留白 */}
              {filteredIds.map((id) => (
                <CardTemplate
                  key={id}
                  cardId={id}
                  size={sizeMode}
                  showFlavor={sizeMode !== 'small'}
                  artImage={CARDS[id]?.image}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── 列印說明（列印時顯示，螢幕時隱藏） ── */}
        <div className="hidden border-t border-slate-300 pt-1 text-right text-[8px] text-slate-400 print:block">
          WindFarm Battle — 教學卡牌 / 列印版 / 劉瑞弘 副教授 · NCUT DOF Lab
        </div>
      </div>

      {/* ── Print CSS（全域注入）
           策略：列印時讓 fixed modal 的 overflow/position reset，讓卡片自然分頁。
           不用 visibility:hidden 隱藏 body 其他元素（modal 本身已覆蓋全螢幕）。
      ── */}
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          /* modal 由 fixed 改為 static，讓瀏覽器正常分頁流 */
          .card-gallery-modal {
            position: static !important;
            background: white !important;
            overflow: visible !important;
            min-height: auto !important;
          }
          /* 確保卡片允許跨頁 */
          .card-gallery-modal [class*="flex flex-wrap"] {
            overflow: visible !important;
          }
        }
      `}</style>
    </>
  );
}
