// 學習複盤分析（純函式）。教學深度強化。
import { describe, it, expect } from 'vitest';
import type { GameEvent } from '../src/core/events';
import { explainRepair, extractLearningReport, gradeFor } from '../src/core/learning';

// 真實卡牌：F04 blade(61400-5) / F06 mechanical(61400-4) / T02 blade(61400-5) /
//           T03 mechanical(61400-4) / T01 無專長(61400-28)

describe('explainRepair 單次修復拆解', () => {
  it('完全修復（quality full）→ matched, availLost 0', () => {
    const e: GameEvent = { kind: 'fault-repaired', player: 0, targetIdx: 0, cardId: 'F04', by: 'T02', quality: 'full' };
    const r = explainRepair(e);
    expect(r?.matched).toBe(true);
    expect(r?.availLost).toBe(0);
    expect(r?.techId).toBe('T02');
    expect(r?.category).toBe('blade');
  });

  it('部分修復（quality partial）→ 未相符, 帶永久損耗', () => {
    const e: GameEvent = { kind: 'fault-repaired', player: 0, targetIdx: 0, cardId: 'F06', by: 'T01', quality: 'partial', availLost: 9 };
    const r = explainRepair(e);
    expect(r?.matched).toBe(false);
    expect(r?.availLost).toBe(9);
    expect(r?.category).toBe('mechanical');
  });

  it('共享資源修復（by=spare-part）→ techId undefined', () => {
    const e: GameEvent = { kind: 'fault-repaired', player: 0, targetIdx: 0, cardId: 'F04', by: 'spare-part', quality: 'full' };
    const r = explainRepair(e);
    expect(r?.techId).toBeUndefined();
    expect(r?.matched).toBe(true);
  });

  it('非修復事件 → null', () => {
    expect(explainRepair({ kind: 'turn-ended', player: 0 })).toBeNull();
  });
});

describe('gradeFor 維運評級', () => {
  it('依完全修復率分級 S/A/B/C', () => {
    expect(gradeFor(1, 5)).toBe('S');
    expect(gradeFor(0.9, 10)).toBe('S');
    expect(gradeFor(0.75, 4)).toBe('A');
    expect(gradeFor(0.5, 2)).toBe('B');
    expect(gradeFor(0.2, 5)).toBe('C');
  });

  it('無修復（totalRepairs 0）→ S（零損耗）', () => {
    expect(gradeFor(1, 0)).toBe('S');
  });
});

describe('extractLearningReport 整場複盤', () => {
  const events: GameEvent[] = [
    { kind: 'fault-applied', player: 0, targetIdx: 0, cardId: 'F04', drop: 12 },       // 遇到 blade
    { kind: 'incident', round: 2, faultCardId: 'F06', turbineIdx: 0 },                 // 遇到 mechanical
    { kind: 'fault-repaired', player: 0, targetIdx: 0, cardId: 'F04', by: 'T02', quality: 'full' },              // 完全（blade 對 blade）
    { kind: 'fault-repaired', player: 0, targetIdx: 0, cardId: 'F06', by: 'T01', quality: 'partial', availLost: 9 }, // 部分（通用技師）
    { kind: 'fault-repaired', player: 1, targetIdx: 0, cardId: 'F04', by: 'T02', quality: 'full' },              // 對手的修復不計入
  ];

  it('完全/部分修復數 + 永久損耗（只計自己）', () => {
    const r = extractLearningReport(events, 0);
    expect(r.totalRepairs).toBe(2);
    expect(r.fullRepairs).toBe(1);
    expect(r.partialRepairs).toBe(1);
    expect(r.permanentAvailLost).toBe(9);
    expect(r.matchRate).toBeCloseTo(0.5);
    expect(r.grade).toBe('B');
  });

  it('遇到的故障類別（含 fault-applied + incident）', () => {
    const r = extractLearningReport(events, 0);
    const cats = r.categoriesSeen.map((c) => c.category);
    expect(cats).toContain('blade');
    expect(cats).toContain('mechanical');
  });

  it('派上用場的技師 + IEC 標準（去重）', () => {
    const r = extractLearningReport(events, 0);
    expect(r.specialistsUsed).toContain('T02');
    expect(r.specialistsUsed).toContain('T01');
    // F04/T02→61400-5, F06→61400-4, T01→61400-28
    expect(r.iecSeen).toEqual(expect.arrayContaining(['61400-4', '61400-5', '61400-28']));
  });

  it('完全無故障/修復 → grade S, matchRate 1', () => {
    const r = extractLearningReport([{ kind: 'round-start', round: 1, windLabel: 'a' }], 0);
    expect(r.totalRepairs).toBe(0);
    expect(r.matchRate).toBe(1);
    expect(r.grade).toBe('S');
  });
});
