// ============================================================
// Sprint 4：CardTemplate 元件測試
// 覆蓋六種卡類 × 可用稀有度，確保模板系統不崩潰
// ============================================================
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import CardTemplate from '../src/template/CardTemplate';

// ── 六種卡類代表卡 ─────────────────────────────────────────
const TYPE_SAMPLES: { cardId: string; expectText: string }[] = [
  { cardId: 'M01', expectText: 'TURBINE' },   // turbine r1
  { cardId: 'M07', expectText: 'TURBINE' },   // turbine r5 legendary
  { cardId: 'T01', expectText: 'TECH' },      // tech r1
  { cardId: 'T07', expectText: 'TECH' },      // tech r5 legendary
  { cardId: 'F01', expectText: 'FAULT' },     // fault r1
  { cardId: 'FN01', expectText: 'FUNCTION' }, // func r2
  { cardId: 'W01', expectText: 'WEATHER' },   // weather r2
  { cardId: 'C01', expectText: 'CONTRACT' },  // contract r2
];

// ── 各稀有度（以 turbine 為例）────────────────────────────
const RARITY_SAMPLES = [
  { cardId: 'M01', rarity: 1 },
  { cardId: 'M03', rarity: 2 },
  { cardId: 'M06', rarity: 3 },
  { cardId: 'M09', rarity: 4 },
  { cardId: 'M07', rarity: 5 },
];

// 每個 test 後清理 DOM，避免跨測試污染
afterEach(() => cleanup());

describe('CardTemplate 元件渲染', () => {
  // ── 六種卡類都能正常渲染 ─────────────────────────────────
  describe('六種卡類渲染', () => {
    for (const { cardId, expectText } of TYPE_SAMPLES) {
      it(`${cardId}（${expectText}）能無錯誤渲染`, () => {
        const { container } = render(<CardTemplate cardId={cardId} />);
        expect(container.firstChild).not.toBeNull();
        // 確認類別標籤出現
        expect(screen.getAllByText(expectText).length).toBeGreaterThan(0);
        // 確認卡 ID 出現
        expect(screen.getAllByText(cardId).length).toBeGreaterThan(0);
      });
    }
  });

  // ── 稀有度星星數量正確 ────────────────────────────────────
  describe('稀有度星星', () => {
    for (const { cardId, rarity } of RARITY_SAMPLES) {
      it(`${cardId}（r${rarity}）應有 5 顆星容器（${rarity} 亮 + ${5 - rarity} 暗）`, () => {
        const { container } = render(<CardTemplate cardId={cardId} />);
        // 尋找所有 ★ 字元（底部稀有度列）
        const stars = container.querySelectorAll('span');
        const starSpans = Array.from(stars).filter(s => s.textContent === '★');
        expect(starSpans).toHaveLength(5);
      });
    }
  });

  // ── 傳說卡特效 ────────────────────────────────────────────
  it('M07（傳說卡）應顯示 Legendary 文字', () => {
    const { container } = render(<CardTemplate cardId="M07" />);
    expect(within(container).getAllByText('Legendary').length).toBeGreaterThan(0);
  });

  it('T07（傳說技師）應顯示 Legendary 文字', () => {
    const { container } = render(<CardTemplate cardId="T07" />);
    expect(within(container).getAllByText('Legendary').length).toBeGreaterThan(0);
  });

  it('普通卡（M01）不應顯示 Legendary 文字', () => {
    const { container } = render(<CardTemplate cardId="M01" />);
    expect(within(container).queryByText('Legendary')).toBeNull();
  });

  // ── 圖片 vs 表情符號佔位符 ───────────────────────────────
  it('無 artImage 時應顯示表情符號佔位符（無 img 元素）', () => {
    const { container } = render(<CardTemplate cardId="M01" />);
    const img = container.querySelector('img');
    expect(img).toBeNull();
  });

  it('提供 artImage 時應渲染 <img> 元素', () => {
    const { container } = render(
      <CardTemplate cardId="M01" artImage="/art/m01.png" />
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/art/m01.png');
  });

  // ── showFlavor 控制 ───────────────────────────────────────
  it('showFlavor=true 時應顯示風味文字（預設）', () => {
    const { container } = render(<CardTemplate cardId="M01" showFlavor />);
    // 風味文字用 ldquo/rdquo 包裹，確認容器存在
    const flavorEl = container.querySelector('.italic');
    expect(flavorEl).not.toBeNull();
  });

  it('showFlavor=false 時風味文字容器應不存在', () => {
    const { container } = render(<CardTemplate cardId="M01" showFlavor={false} />);
    // italic 類在這個元件只有風味文字用到
    const flavorEl = container.querySelector('.italic');
    expect(flavorEl).toBeNull();
  });

  // ── highlighted 高亮 ────────────────────────────────────
  it('highlighted=true 時根元素應有 ring-amber-400 class', () => {
    const { container } = render(<CardTemplate cardId="M01" highlighted />);
    expect(container.firstElementChild?.className).toContain('ring-amber-400');
  });

  it('highlighted=false（預設）時根元素不應有 ring-amber-400', () => {
    const { container } = render(<CardTemplate cardId="M01" />);
    expect(container.firstElementChild?.className).not.toContain('ring-amber-400');
  });

  // ── 四種尺寸不崩潰 ───────────────────────────────────────
  describe('尺寸模式', () => {
    for (const sz of ['small', 'medium', 'large', 'print'] as const) {
      it(`size="${sz}" 能正常渲染`, () => {
        const { container } = render(<CardTemplate cardId="T01" size={sz} />);
        expect(container.firstChild).not.toBeNull();
      });
    }
  });

  // ── Route B：specialty / faultCategory 顯示 ─────────────
  it('有 specialty 的技師卡應顯示分類標籤', () => {
    // T02 = 葉片專長
    const { container } = render(<CardTemplate cardId="T02" />);
    expect(container.textContent).toContain('🪂');
  });

  it('有 faultCategory 的故障卡應顯示分類標籤', () => {
    // F01 = sensor（📡）
    const { container } = render(<CardTemplate cardId="F01" />);
    expect(container.textContent).toContain('📡');
  });

  it('F03（液壓故障）應顯示💧標籤', () => {
    const { container } = render(<CardTemplate cardId="F03" />);
    expect(container.textContent).toContain('💧');
  });
});
