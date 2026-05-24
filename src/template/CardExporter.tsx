// ============================================================
// CardExporter.tsx
// 卡牌批次 PDF 匯出工具
//
// 策略：
//   1. 在 DOM 外建立隱藏容器，依序渲染每張 CardTemplate（print 尺寸 240×340px）
//   2. 使用 html2canvas 將每張卡截圖成 canvas
//   3. 使用 jsPDF 將所有 canvas 排版成 A4 PDF（每頁 3×3 = 9 張）
//   4. 匯出完成後自動下載 PDF 並清除隱藏容器
//
// 注意：
//   - 此模組純 React（無 core/ 依賴）
//   - html2canvas 不支援 CSS backdrop-filter，已用 useCssText 繞過
//   - 字型若有 @font-face 需等 document.fonts.ready
//   - 每張卡渲染後需 unmount React root，避免記憶體洩漏與重複 root 警告
// ============================================================
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import CardTemplate from './CardTemplate';

// ── 版面常數 ──────────────────────────────────────────────────
const CARD_W_PX  = 240;   // CardTemplate print size width  (px)
const CARD_H_PX  = 340;   // CardTemplate print size height (px)
const COLS       = 3;     // 每列幾張
const ROWS       = 3;     // 每頁幾列
const PER_PAGE   = COLS * ROWS;

// A4 in mm：210 × 297
const PAGE_W_MM  = 210;
const PAGE_H_MM  = 297;
const MARGIN_MM  = 8;     // 四邊留白
const GAP_MM     = 3;     // 卡片間距

// 計算每張卡在 PDF 中的尺寸（mm）
const CELL_W_MM  = (PAGE_W_MM - MARGIN_MM * 2 - GAP_MM * (COLS - 1)) / COLS;
const CELL_H_MM  = (PAGE_H_MM - MARGIN_MM * 2 - GAP_MM * (ROWS - 1)) / ROWS;

// ── 進度回呼型別 ──────────────────────────────────────────────
export type ExportProgressCallback = (done: number, total: number) => void;

// ── 主函式 ────────────────────────────────────────────────────
/**
 * 將指定的卡牌 ID 清單批次匯出成 PDF 並觸發瀏覽器下載。
 *
 * @param cardIds   要匯出的卡牌 ID 陣列
 * @param filename  下載檔名（預設 windfarm-cards.pdf）
 * @param onProgress 進度回呼 (done, total)
 */
export async function exportCardsToPdf(
  cardIds: readonly string[],
  filename = 'windfarm-cards.pdf',
  onProgress?: ExportProgressCallback,
): Promise<void> {
  if (cardIds.length === 0) return;

  // 等字型載入完成（避免截圖時字型尚未就緒）
  await document.fonts.ready;

  // 建立隱藏容器（移到視窗外，不影響畫面）
  const host = document.createElement('div');
  host.style.cssText = [
    'position:fixed',
    'top:-9999px',
    'left:-9999px',
    `width:${CARD_W_PX}px`,
    `height:${CARD_H_PX}px`,
    'overflow:hidden',
    'z-index:-1',
    'pointer-events:none',
  ].join(';');
  document.body.appendChild(host);

  // 初始化 jsPDF（A4，mm 單位）
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  try {
    for (let i = 0; i < cardIds.length; i++) {
      const id = cardIds[i];

      // 渲染單張 CardTemplate 到隱藏容器
      await renderCardToContainer(host, id);

      // 截圖
      const canvas = await html2canvas(host, {
        width:  CARD_W_PX,
        height: CARD_H_PX,
        scale:  2,           // 2× 解析度，印出更清晰
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // 計算在 PDF 中的位置
      const pageIndex  = Math.floor(i / PER_PAGE);
      const posInPage  = i % PER_PAGE;
      const col        = posInPage % COLS;
      const row        = Math.floor(posInPage / COLS);

      // 若是新頁（第 0 張除外）先 addPage
      if (posInPage === 0 && i > 0) {
        pdf.addPage();
      }

      // 若是每頁第一張，加頁碼頁尾
      if (posInPage === 0) {
        const totalPages = Math.ceil(cardIds.length / PER_PAGE);
        pdf.setFontSize(7);
        pdf.setTextColor(180, 180, 180);
        pdf.text(
          `WindFarm Battle — 教學卡牌 / 第 ${pageIndex + 1} 頁 / 共 ${totalPages} 頁`,
          MARGIN_MM,
          PAGE_H_MM - 3,
        );
      }

      const x = MARGIN_MM + col * (CELL_W_MM + GAP_MM);
      const y = MARGIN_MM + row * (CELL_H_MM + GAP_MM);

      // 將 canvas 加入 PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', x, y, CELL_W_MM, CELL_H_MM);

      // 回報進度
      onProgress?.(i + 1, cardIds.length);
    }

    // 下載
    pdf.save(filename);
  } finally {
    // 清除隱藏容器（無論成功或失敗）
    document.body.removeChild(host);
  }
}

// ── 輔助：將單張卡渲染到容器 ─────────────────────────────────
function renderCardToContainer(container: HTMLElement, cardId: string): Promise<void> {
  return new Promise((resolve) => {
    // 清空容器
    container.innerHTML = '';

    // 建立 React root 並渲染
    const root = createRoot(container);
    root.render(
      <CardTemplate
        cardId={cardId}
        size="print"
        showFlavor={true}
      />,
    );

    // 等兩個 animation frame 讓 React 完成渲染後再截圖
    // 截圖完成後 unmount，避免記憶體洩漏與 React 重複 root 警告
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
        // 非同步 unmount（截圖已完成，不影響結果）
        setTimeout(() => root.unmount(), 0);
      });
    });
  });
}
