// 事件流 → 音效映射（純函式）。手感沉浸強化 S8。
import { describe, it, expect } from 'vitest';
import type { GameEvent } from '../src/core/types';
import { eventToCue, eventsToCues } from '../src/ui/audio/event-sounds';

describe('eventToCue 單一事件映射', () => {
  it('新回合 → roundStart', () => {
    const e: GameEvent = { kind: 'round-start', round: 2, windLabel: '中風', waveHeight: 1 };
    expect(eventToCue(e)?.sound).toBe('roundStart');
  });

  it('招募技師 → techDeploy', () => {
    expect(eventToCue({ kind: 'tech-deployed', player: 0, cardId: 'T02', position: 'active' })?.sound).toBe('techDeploy');
  });

  it('施加故障：受害者是自己 → faultHit + 重震動', () => {
    const cue = eventToCue({ kind: 'fault-applied', player: 0, turbineId: 'OS8', cardId: 'F04', drop: 20 }, 0);
    expect(cue?.sound).toBe('faultHit');
    expect(cue?.haptic).toBe('heavy');
  });

  it('施加故障：受害者是對手 → faultHit 但不震動', () => {
    const cue = eventToCue({ kind: 'fault-applied', player: 1, turbineId: 'OS8', cardId: 'F04', drop: 20 }, 0);
    expect(cue?.sound).toBe('faultHit');
    expect(cue?.haptic).toBeUndefined();
  });

  it('同題環境事件 → faultHit + 重震動（對雙方皆受擊）', () => {
    const cue = eventToCue({ kind: 'incident', round: 3, faultCardId: 'F01', turbineId: 'OS8' }, 0);
    expect(cue?.sound).toBe('faultHit');
    expect(cue?.haptic).toBe('heavy');
  });

  it('修復品質：完全 vs 部分 → repairFull / repairPartial', () => {
    expect(eventToCue({ kind: 'fault-repaired', player: 0, turbineId: 'OS8', cardId: 'F04', quality: 'full' })?.sound).toBe('repairFull');
    expect(eventToCue({ kind: 'fault-repaired', player: 0, turbineId: 'OS8', cardId: 'F04', quality: 'partial' })?.sound).toBe('repairPartial');
  });

  it('得分：只在自己那筆響一次（避免雙方各響）', () => {
    expect(eventToCue({ kind: 'round-scored', player: 0, mwh: 30, total: 60 }, 0)?.sound).toBe('score');
    expect(eventToCue({ kind: 'round-scored', player: 1, mwh: 30, total: 60 }, 0)).toBeNull();
  });

  it('緊急停機：自己的機組 → shutdown + 重震動', () => {
    const cue = eventToCue({ kind: 'turbine-shutdown', player: 0, turbineId: 'OS8' }, 0);
    expect(cue?.sound).toBe('shutdown');
    expect(cue?.haptic).toBe('heavy');
  });

  it('遊戲結束：依勝負 → win / lose / draw', () => {
    expect(eventToCue({ kind: 'game-over', winner: 0 }, 0)?.sound).toBe('win');
    expect(eventToCue({ kind: 'game-over', winner: 1 }, 0)?.sound).toBe('lose');
    expect(eventToCue({ kind: 'game-over', winner: -1 }, 0)?.sound).toBe('draw');
  });
});

describe('eventsToCues 批次處理', () => {
  it('略過無聲事件、保留有聲事件', () => {
    const events: GameEvent[] = [
      { kind: 'card-drawn', player: 0, cardId: 'F01' },
      { kind: 'tech-deployed', player: 0, cardId: 'T02', position: 'active' },
      { kind: 'turn-ended', player: 0 },
    ];
    const cues = eventsToCues(events, 0);
    expect(cues).toHaveLength(1);
    expect(cues[0].sound).toBe('techDeploy');
  });

  it('折疊連續相同音效', () => {
    const events: GameEvent[] = [
      { kind: 'incident', round: 1, faultCardId: 'F01', turbineId: 'OS8' },
      { kind: 'incident', round: 1, faultCardId: 'F01', turbineId: 'OS10' },
    ];
    expect(eventsToCues(events, 0)).toHaveLength(2);

    const noHaptic: GameEvent[] = [
      { kind: 'round-start', round: 1, windLabel: 'a', waveHeight: 1 },
      { kind: 'round-start', round: 1, windLabel: 'b', waveHeight: 1 },
    ];
    expect(eventsToCues(noHaptic, 0)).toHaveLength(1); // 折疊
  });
});
