import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import App from '../src/App';
import { useGameStore } from '../src/store/game-store';

describe('App（HANDOFF-UI 重寫後）', () => {
  beforeEach(() => {
    // 重置 store 到已知 seed，避免測試之間污染
    useGameStore.getState().newGame(20260521);
  });
  afterEach(() => {
    cleanup();
  });

  it('預設先顯示 TitleScreen（含品牌、副標、開始按鈕）', () => {
    const { container } = render(<App />);
    expect(container.textContent).toContain('風場大戰');
    expect(container.textContent).toContain('WINDFARM · BATTLE');
    expect(container.textContent).toContain('開始對戰');
  });

  it('TitleScreen 顯示研究室署名', () => {
    const { container } = render(<App />);
    expect(container.textContent).toContain('DOF LAB');
  });

  it('點擊「開始對戰」後進入戰場畫面（顯示回合與動作）', () => {
    const { container, getByText } = render(<App />);
    fireEvent.click(getByText('開始對戰'));
    expect(container.textContent).toContain('回合');
    expect(container.textContent).toContain('動作');
    // TopBar 應有結束回合按鈕
    expect(container.textContent).toContain('結束回合');
  });

  it('戰場頂部欄包含難度切換與「新遊戲」按鈕', () => {
    const { container, getByText } = render(<App />);
    fireEvent.click(getByText('開始對戰'));
    expect(container.textContent).toContain('新遊戲');
    // 三個難度選項
    expect(container.textContent).toContain('入門');
    expect(container.textContent).toContain('中級');
    expect(container.textContent).toContain('高手');
  });

  it('store 初始狀態：round=1、雙方各 3 台 OS8/OS10/OS12 開局艦隊', () => {
    const s = useGameStore.getState().state;
    expect(s.round).toBe(1);
    expect(s.players[0].turbines).toHaveLength(3);
    expect(s.players[0].turbines[0].cardId).toBe('OS8');
    expect(s.players[0].turbines[1].cardId).toBe('OS10');
    expect(s.players[0].turbines[2].cardId).toBe('OS12');
    expect(s.players[0].hand.length).toBeGreaterThanOrEqual(1);
  });

  it('Route B originalAvail：開局艦隊各機組的 originalAvail 與 avail 相同', () => {
    const s = useGameStore.getState().state;
    for (const p of s.players) {
      for (const t of p.turbines) {
        expect(t.originalAvail).toBeDefined();
        expect(t.originalAvail).toBe(t.avail);
      }
    }
  });

  it('store 新增 UI 動畫欄位（effects / windRolling）', () => {
    const s = useGameStore.getState();
    expect(Array.isArray(s.effects)).toBe(true);
    expect(typeof s.windRolling).toBe('boolean');
    expect(typeof s.pushEffect).toBe('function');
    expect(typeof s.removeEffect).toBe('function');
    expect(typeof s.setWindRolling).toBe('function');
  });

  it('pushEffect 加入特效後 removeEffect 可移除', () => {
    const { pushEffect, removeEffect } = useGameStore.getState();
    pushEffect('fault', { side: 1, slot: 0, cardId: 'F03' }, 60_000);
    const fx = useGameStore.getState().effects;
    expect(fx).toHaveLength(1);
    expect(fx[0].type).toBe('fault');
    removeEffect(fx[0].id);
    expect(useGameStore.getState().effects).toHaveLength(0);
  });
});
