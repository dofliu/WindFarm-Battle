// ============================================================
// useGameFeedback — 把 game-store 的事件流轉成「手感回饋」（音效 + 螢幕震動）。
//
// 單一事件來源：只在這裡 diff 一次 store.events，同時驅動音效與螢幕震動，
// 避免多個 hook 各自 diff。回傳 shakeKey：受擊時遞增，BattleScreen 據此重播抖動動畫。
//
// diff 策略：記住上次處理到的「最後一筆事件物件參照」（事件建立後不再變動，
// 參照相等可靠）。用 lastIndexOf 找到錨點，播放其後的新事件。
// 首次掛載 / newGame（events 換新陣列，錨點找不到）→ 只重設錨點、不播放，避免開場爆一串音。
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/game-store';
import type { GameEvent } from '../../core/events';
import { playEventSounds } from './event-sounds';
import { play } from './sound-engine';
import { getSettings } from '../../store/settings-store';

/** 新批次是否包含「對自己有衝擊」的事件（受擊 / 停機 / 技師力竭 / 同題事件）→ 觸發螢幕震動。 */
function hasImpactOnSelf(events: readonly GameEvent[], self: 0 | 1): boolean {
  return events.some((event) => {
    if (event.kind === 'incident') return true;
    if (event.kind === 'fault-applied') return event.player === self;
    if (event.kind === 'turbine-shutdown') return event.player === self;
    if (event.kind === 'stamina-depleted') return event.player === self;
    return false;
  });
}

export function useGameFeedback(self: 0 | 1 = 0): { readonly shakeKey: number } {
  const events = useGameStore((s) => s.events);
  const round = useGameStore((s) => s.state.round);
  const typhoon = useGameStore((s) => s.state.wind.typhoon);

  const anchorRef = useRef<GameEvent | null>(null);
  const typhoonRoundRef = useRef<number>(-1);
  const [shakeKey, setShakeKey] = useState(0);

  // ── 事件流 diff → 音效 + 受擊震動 ──────────────────────────
  useEffect(() => {
    const anchor = anchorRef.current;
    const idx = anchor ? events.lastIndexOf(anchor) : -1;
    // 首次掛載，或錨點已被 slice 掉 / newGame 換新陣列 → 靜默重設，避免開場爆音
    if (anchor === null || idx < 0) {
      anchorRef.current = events[events.length - 1] ?? null;
      return;
    }
    const fresh = events.slice(idx + 1);
    anchorRef.current = events[events.length - 1] ?? anchor;
    if (fresh.length === 0) return;

    playEventSounds(fresh, self);
    if (getSettings().screenShakeOn && hasImpactOnSelf(fresh, self)) {
      setShakeKey((k) => k + 1);
    }
  }, [events, self]);

  // ── 颱風：新回合開出颱風 → 低頻隆隆 + 抖動（每個颱風回合一次） ──
  useEffect(() => {
    if (typhoon && typhoonRoundRef.current !== round) {
      typhoonRoundRef.current = round;
      const s = getSettings();
      if (s.soundOn) play('typhoon', 0.15); // 稍晚於 roundStart 鐘聲
      if (s.screenShakeOn) setShakeKey((k) => k + 1);
    }
  }, [round, typhoon]);

  return { shakeKey };
}
