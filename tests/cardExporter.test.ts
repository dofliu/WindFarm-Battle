// ============================================================
// CardExporter 單元測試
//
// 策略：
//   - mock html2canvas（回傳假 canvas）
//   - mock jsPDF（spy 各方法呼叫次數）
//   - 測試進度回呼、空陣列短路、分頁邏輯、檔名、DOM 清理
//
// 注意：
//   - jsdom 環境無 requestAnimationFrame，需 mock
//   - document.fonts.ready 需 mock
// ============================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── mock html2canvas ──────────────────────────────────────────
// 回傳一個假 canvas，toDataURL 回傳固定字串
const mockCanvas = {
  toDataURL: vi.fn(() => 'data:image/png;base64,FAKE'),
};
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve(mockCanvas)),
}));

// ── mock jsPDF ────────────────────────────────────────────────
const mockPdfInstance = {
  addPage:      vi.fn(),
  setFontSize:  vi.fn(),
  setTextColor: vi.fn(),
  text:         vi.fn(),
  addImage:     vi.fn(),
  save:         vi.fn(),
};
vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => mockPdfInstance),
}));

// ── mock react-dom/client（createRoot → 立即 resolve）─────────
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render:  vi.fn(),
    unmount: vi.fn(),
  })),
}));

// ── 讀入受測模組 ──────────────────────────────────────────────
import { exportCardsToPdf } from '../src/template/CardExporter';

// ── 測試前後清理 ──────────────────────────────────────────────
beforeEach(() => {
  // 重置所有 mock 呼叫紀錄
  vi.clearAllMocks();

  // mock document.fonts.ready（jsdom 無此 API）
  Object.defineProperty(document, 'fonts', {
    value: { ready: Promise.resolve() },
    writable: true,
    configurable: true,
  });

  // mock requestAnimationFrame：立即執行 callback（jsdom 無此 API）
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── 測試套件 ──────────────────────────────────────────────────
describe('CardExporter exportCardsToPdf', () => {

  it('空陣列時直接回傳，不呼叫任何 PDF 方法', async () => {
    await exportCardsToPdf([]);
    expect(mockPdfInstance.addImage).not.toHaveBeenCalled();
    expect(mockPdfInstance.save).not.toHaveBeenCalled();
  });

  it('單張卡：呼叫 addImage 一次，save 一次', async () => {
    await exportCardsToPdf(['M01']);
    expect(mockPdfInstance.addImage).toHaveBeenCalledTimes(1);
    expect(mockPdfInstance.save).toHaveBeenCalledTimes(1);
  });

  it('9 張卡（剛好一頁）：addImage 9 次，addPage 0 次', async () => {
    const ids = ['M01','M02','M03','M04','M05','M06','M07','M08','M09'];
    await exportCardsToPdf(ids);
    expect(mockPdfInstance.addImage).toHaveBeenCalledTimes(9);
    expect(mockPdfInstance.addPage).not.toHaveBeenCalled();
  });

  it('10 張卡（跨頁）：addPage 呼叫 1 次', async () => {
    const ids = ['M01','M02','M03','M04','M05','M06','M07','M08','M09','M10'];
    await exportCardsToPdf(ids);
    expect(mockPdfInstance.addImage).toHaveBeenCalledTimes(10);
    expect(mockPdfInstance.addPage).toHaveBeenCalledTimes(1);
  });

  it('18 張卡（剛好兩頁）：addPage 呼叫 1 次', async () => {
    const ids = Array.from({ length: 18 }, (_, i) => `M0${(i % 9) + 1}`);
    await exportCardsToPdf(ids);
    expect(mockPdfInstance.addPage).toHaveBeenCalledTimes(1);
  });

  it('19 張卡（第三頁開始）：addPage 呼叫 2 次', async () => {
    const ids = Array.from({ length: 19 }, (_, i) => `M0${(i % 9) + 1}`);
    await exportCardsToPdf(ids);
    expect(mockPdfInstance.addPage).toHaveBeenCalledTimes(2);
  });

  it('進度回呼：每張卡呼叫一次，最後一次 done === total', async () => {
    const ids = ['M01', 'M02', 'M03'];
    const calls: [number, number][] = [];
    await exportCardsToPdf(ids, 'test.pdf', (done, total) => {
      calls.push([done, total]);
    });
    expect(calls).toHaveLength(3);
    expect(calls[0]).toEqual([1, 3]);
    expect(calls[1]).toEqual([2, 3]);
    expect(calls[2]).toEqual([3, 3]);
  });

  it('自訂檔名：save 以指定檔名呼叫', async () => {
    await exportCardsToPdf(['M01'], 'my-cards.pdf');
    expect(mockPdfInstance.save).toHaveBeenCalledWith('my-cards.pdf');
  });

  it('預設檔名：save 以 windfarm-cards.pdf 呼叫', async () => {
    await exportCardsToPdf(['M01']);
    expect(mockPdfInstance.save).toHaveBeenCalledWith('windfarm-cards.pdf');
  });

  it('每頁第一張卡加頁碼頁尾（text 被呼叫）', async () => {
    await exportCardsToPdf(['M01']);
    // 第一頁第一張應呼叫 text（頁碼）
    expect(mockPdfInstance.text).toHaveBeenCalledTimes(1);
    const callArg = (mockPdfInstance.text.mock.calls[0] as unknown[])[0] as string;
    expect(callArg).toContain('WindFarm Battle');
    expect(callArg).toContain('第 1 頁');
  });

  it('10 張卡：第 1 頁和第 2 頁各呼叫一次 text（頁碼）', async () => {
    const ids = Array.from({ length: 10 }, (_, i) => `M0${(i % 9) + 1}`);
    await exportCardsToPdf(ids);
    // 兩頁各一次頁碼
    expect(mockPdfInstance.text).toHaveBeenCalledTimes(2);
  });

  it('匯出完成後 DOM 中不留隱藏容器（body 子元素數量不增加）', async () => {
    const before = document.body.children.length;
    await exportCardsToPdf(['M01']);
    const after = document.body.children.length;
    expect(after).toBe(before);
  });

  it('addImage 傳入 PNG 格式與正確 imgData', async () => {
    await exportCardsToPdf(['M01']);
    const args = mockPdfInstance.addImage.mock.calls[0] as unknown[];
    expect(args[0]).toBe('data:image/png;base64,FAKE');
    expect(args[1]).toBe('PNG');
  });

});
