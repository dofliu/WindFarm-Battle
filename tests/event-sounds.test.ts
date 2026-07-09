// 事件流 → 音效映射（純函式）。手感沉浸強化 S8。
import { describe, it, expect } from 'vitest';
import type { GameEvent } from '../src/core/events';
import { eventToCue, eventsToCues } from '../src/ui/audio/event-sounds';

describe('eventToCue 單一事件映射', () => {
  it('新回合 → roundStart', () => {
    const e: GameEvent = { kind: 'round-start', round: 2, windLabel: '中風' };
    expect(eventToCue(e)?.sound).toBe('roundStart');
  });

  it('部署機組 → deploy', () => {
    expect(eventToCue({ kind: 'turbine-deployed', player: 0, cardId: 'OS8' })?.sound).toBe('deploy');
  });

  it('招募技師 → techDeploy', () => {
    expect(eventToCue({ kind: 'tech-deployed', player: 0, cardId: 'T02' })?.sound).toBe('techDeploy');
  });

  it('施加故障：受害者是自己 → faultHit + 重震動', () => {
    const cue = eventToCue({ kind: 'fault-applied', player: 0, targetIdx: 0, cardId: 'F04', drop: 20 }, 0);
    expect(cue?.sound).toBe('faultHit');
    expect(cue?.haptic).toBe('heavy');
  });

  it('施加故障：受害者是對手 → faultHit 但不震動', () => {
    const cue = eventToCue({ kind: 'fault-applied', player: 1, targetIdx: 0, cardId: 'F04', drop: 20 }, 0);
    expect(cue?.sound).toBe('faultHit');
    expect(cue?.haptic).toBeUndefined();
  });

  it('同題環境事件 → faultHit + 重震動（對雙方皆受擊）', () => {
    const cue = eventToCue({ kind: 'incident', round: 3, faultCardId: 'F01', turbineIdx: 0 }, 0);
    expect(cue?.sound).toBe('faultHit');
    expect(cue?.haptic).toBe('heavy');
  });

  it('修復品質：完全 vs 部分 → repairFull / repairPartial', () => {
    expect(eventToCue({ kind: 'fault-repaired', player: 0, targetIdx: 0, cardId: 'F04', quality: 'full' })?.sound).toBe('repairFull');
    expect(eventToCue({ kind: 'fault-repaired', player: 0, targetIdx: 0, cardId: 'F04', quality: 'partial' })?.sound).toBe('repairPartial');
    // 未標 quality 視為完全修復
    expect(eventToCue({ kind: 'fault-repaired', player: 0, targetIdx: 0, cardId: 'F04' })?.sound).toBe('repairFull');
  });

  it('得分：只在自己那筆響一次（避免雙方各響）', () => {
    expect(eventToCue({ kind: 'round-scored', player: 0, mwh: 30, total: 60 }, 0)?.sound).toBe('score');
    expect(eventToCue({ kind: 'round-scored', player: 1, mwh: 30, total: 60 }, 0)).toBeNull();
  });

  it('緊急停機：自己的機組 → shutdown + 重震動', () => {
    const cue = eventToCue({ kind: 'turbine-shutdown', player: 0, turbineIdx: 0, cardId: 'OS8' }, 0);
    expect(cue?.sound).toBe('shutdown');
    expect(cue?.haptic).toBe('heavy');
  });

  it('遊戲結束：依勝負 → win / lose / draw', () => {
    expect(eventToCue({ kind: 'game-over', winner: 0 }, 0)?.sound).toBe('win');
    expect(eventToCue({ kind: 'game-over', winner: 1 }, 0)?.sound).toBe('lose');
    expect(eventToCue({ kind: 'game-over', winner: -1 }, 0)?.sound).toBe('draw');
  });

  it('資訊型事件（抽牌/回合結束/棄牌）→ 靜默', () => {
    expect(eventToCue({ kind: 'card-drawn', player: 0, cardId: 'F01' })).toBeNull();
    expect(eventToCue({ kind: 'turn-ended', player: 0 })).toBeNull();
    expect(eventToCue({ kind: 'card-discarded', player: 0, cardId: 'F01' })).toBeNull();
  });
});

describe('eventsToCues 批次處理', () => {
  it('略過無聲事件、保留有聲事件', () => {
    const events: GameEvent[] = [
      { kind: 'card-drawn', player: 0, cardId: 'F01' },
      { kind: 'turbine-deployed', player: 0, cardId: 'OS8' },
      { kind: 'turn-ended', player: 0 },
    ];
    const cues = eventsToCues(events, 0);
    expect(cues).toHaveLength(1);
    expect(cues[0].sound).toBe('deploy');
  });

  it('折疊連續相同音效（連鎖產生的多筆 faultHit）', () => {
    const events: GameEvent[] = [
      { kind: 'incident', round: 1, faultCardId: 'F01', turbineIdx: 0 },
      { kind: 'incident', round: 1, faultCardId: 'F01', turbineIdx: 1 },
    ];
    // 兩筆都帶 haptic，不折疊（受擊需各自震動）
    expect(eventsToCues(events, 0)).toHaveLength(2);

    const noHaptic: GameEvent[] = [
      { kind: 'round-start', round: 1, windLabel: 'a' },
      { kind: 'round-start', round: 1, windLabel: 'b' },
    ];
    expect(eventsToCues(noHaptic, 0)).toHaveLength(1); // 折疊
  });

  it('超量時只保留最後 7 筆（敘事高潮在尾端）', () => {
    const many: GameEvent[] = Array.from({ length: 12 }, (_, i) => ({
      kind: 'tech-deployed' as const,
      player: (i % 2) as 0 | 1,
      cardId: `T0${i}`,
    }));
    // 全部 techDeploy 但連續相同會先折疊 → 只剩 1 筆；改用交錯不同音效
    const mixed: GameEvent[] = [];
    for (let i = 0; i < 12; i++) {
      mixed.push({ kind: 'tech-deployed', player: 0, cardId: `T${i}` });
      mixed.push({ kind: 'turbine-deployed', player: 0, cardId: `M${i}` });
    }
    expect(eventsToCues(mixed, 0).length).toBeLessThanOrEqual(7);
    // 折疊後的極端案例（全相同）→ 1 筆
    expect(eventsToCues(many, 0)).toHaveLength(1);
  });

  it('game-over 在尾端 → 一定會被保留播放', () => {
    const events: GameEvent[] = [
      { kind: 'round-scored', player: 0, mwh: 10, total: 100 },
      { kind: 'round-scored', player: 1, mwh: 8, total: 90 },
      { kind: 'game-over', winner: 0 },
    ];
    const cues = eventsToCues(events, 0);
    expect(cues[cues.length - 1].sound).toBe('win');
  });
});
