// ============================================================
// useRepairInsight — 監看事件流，於「自己的機組被修復」時取出教學洞察。
//
// 與 useGameFeedback 同一套「錨點 diff」技巧（各自維護 anchor，互不干擾）。
// teachingTips 關閉時只推進錨點、不觸發（漸進式揭露：專家可關）。
// 一批含多次修復時，優先顯示「部分修復」（知識-效益模型的教學重點）。
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/game-store';
import { useSettingsStore } from '../../store/settings-store';
import type { GameEvent } from '../../core/events';
import { explainRepair, type RepairInsight } from '../../core/learning';

export interface ActiveInsight {
  readonly insight: RepairInsight;
  /** 遞增 token：作為 toast 的 key，讓每次新修復都重播滑入動畫。 */
  readonly token: number;
}

/** 顯示時長（毫秒）。部分修復（教學重點）多停留一會兒。 */
const DISPLAY_MS_FULL = 4200;
const DISPLAY_MS_PARTIAL = 6000;

export function useRepairInsight(self: 0 | 1 = 0): ActiveInsight | null {
  const events = useGameStore((s) => s.events);
  const teachingTips = useSettingsStore((s) => s.teachingTips);

  const anchorRef = useRef<GameEvent | null>(null);
  const tokenRef = useRef(0);
  const [active, setActive] = useState<ActiveInsight | null>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    const idx = anchor ? events.lastIndexOf(anchor) : -1;
    // 首次掛載 / newGame 換新陣列 / 錨點被 slice 掉 → 靜默重設
    if (anchor === null || idx < 0) {
      anchorRef.current = events[events.length - 1] ?? null;
      return;
    }
    const fresh = events.slice(idx + 1);
    anchorRef.current = events[events.length - 1] ?? anchor;
    if (!teachingTips || fresh.length === 0) return;

    const repairs = fresh
      .filter((e) => e.kind === 'fault-repaired' && e.player === self)
      .map((e) => explainRepair(e))
      .filter((r): r is RepairInsight => r !== null);
    if (repairs.length === 0) return;

    // 優先顯示部分修復（教學重點：專長不符 → 永久損耗）；否則顯示最後一筆完全修復
    const pick = repairs.find((r) => !r.matched) ?? repairs[repairs.length - 1];
    tokenRef.current += 1;
    setActive({ insight: pick, token: tokenRef.current });
  }, [events, self, teachingTips]);

  // 自動消失（依修復品質決定停留時間）
  useEffect(() => {
    if (!active) return undefined;
    const ms = active.insight.matched ? DISPLAY_MS_FULL : DISPLAY_MS_PARTIAL;
    const timer = window.setTimeout(() => setActive(null), ms);
    return () => window.clearTimeout(timer);
  }, [active]);

  return active;
}
