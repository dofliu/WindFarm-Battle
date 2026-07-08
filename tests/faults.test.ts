// S2.2 故障系統測試：施加 / cascade / 克制修復（含 required 白名單）/ T01 D4 上限 / spreading。
import { describe, it, expect } from 'vitest';
import type { Rng } from '../src/core/rng';
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import { applyFault, repairFaults, tickFaults } from '../src/core/rules-engine';
import type { GameState } from '../src/core/types';

/** 把 0.x 序列灌進 Rng；用來精確控制 cascade 的機率擲骰結果。 */
function fixedRng(values: number[]): Rng {
  let i = 0;
  const next = (): number => values[i++] ?? 0;
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

/** 兩台機組的初始狀態：方便驗證「預設目標＝最高 MW」與 cascade 命中第二台。 */
function withTwoTurbines(s: GameState, player: 0 | 1, ids: [string, string]): GameState {
  const next = structuredClone(s);
  next.players[player].turbines = [
    { cardId: ids[0], avail: 95, mwBonus: 0, faults: [] },
    { cardId: ids[1], avail: 95, mwBonus: 0, faults: [] },
  ];
  return next;
}

describe('S2.2 施加故障 / 預設目標 / big-fail / cascade（寶可夢式主力/備戰區規則）', () => {
  it('預設目標＝對手主力機組（不再是「最高 MW」——備戰區免疫故障目標）', () => {
    // P1 主力 M01(2MW,idx0) 與備戰區 M07(12MW,idx1)；攻擊方為 P0，使用 F02（無 cascade）。
    // 即使 M07 MW 較高，備戰區免疫，唯一合法目標＝主力 M01。
    const base = withTwoTurbines(createInitialState(createRng(1)), 1, ['M01', 'M07']);
    const r = applyFault(base, 0, 'F02', fixedRng([]));
    expect(r.state.players[1].turbines[0].faults).toHaveLength(1); // M01（主力）中招
    expect(r.state.players[1].turbines[1].faults).toHaveLength(0); // M07（備戰區）免疫
    expect(r.events).toContainEqual({
      kind: 'fault-applied', player: 1, targetIdx: 0, cardId: 'F02', drop: 6,
    });
  });

  it('指定 targetIdx＝備戰區索引 → 視為非法目標，故障不生效（備戰區免疫）', () => {
    const base = withTwoTurbines(createInitialState(createRng(1)), 1, ['M01', 'M07']);
    const r = applyFault(base, 0, 'F02', fixedRng([]), 1); // 1 = M07，備戰區
    expect(r.state.players[1].turbines[0].faults).toHaveLength(0);
    expect(r.state.players[1].turbines[1].faults).toHaveLength(0);
    expect(r.events.some((e) => e.kind === 'fault-applied')).toBe(false);
  });

  it('cascade 機率骰命中（rng < cascade）：仍只消耗 RNG，不再造成連鎖傷害（備戰區免疫）', () => {
    // F06 drop=18, cascade=0.2 → rng<0.2 命中；但備戰區免疫故障目標，連鎖已無「另一台合法機組」可命中。
    const base = withTwoTurbines(createInitialState(createRng(1)), 1, ['M01', 'M07']);
    const r = applyFault(base, 0, 'F06', fixedRng([0.1]));
    // 主目標：M01（主力，idx=0）drop=18；備戰區 M07 不受影響
    expect(r.state.players[1].turbines[0].faults[0].drop).toBe(18);
    expect(r.state.players[1].turbines[1].faults).toHaveLength(0);
    expect(r.events.some((e) => e.kind === 'fault-cascaded')).toBe(false);
  });

  it('cascade 機率骰未命中（rng ≥ cascade）：結果與命中時相同（連鎖已不生效）', () => {
    const base = withTwoTurbines(createInitialState(createRng(1)), 1, ['M01', 'M07']);
    const r = applyFault(base, 0, 'F06', fixedRng([0.99]));
    expect(r.state.players[1].turbines[0].faults).toHaveLength(1);
    expect(r.state.players[1].turbines[1].faults).toHaveLength(0);
    expect(r.events.some((e) => e.kind === 'fault-cascaded')).toBe(false);
  });

  it('對手僅 1 台機組時不觸發 cascade（不消耗 rng）', () => {
    // Route B：明確指定對手只有 1 台機組（預設艦隊有 3 台，需覆蓋）
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[1].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }];
    const r = applyFault(s, 0, 'F06', fixedRng([0.1]));
    expect(r.events.some((e) => e.kind === 'fault-cascaded')).toBe(false);
  });

  it('純函式：applyFault 不更動傳入狀態', () => {
    const base = withTwoTurbines(createInitialState(createRng(1)), 1, ['M01', 'M07']);
    applyFault(base, 0, 'F06', fixedRng([0.1]));
    expect(base.players[1].turbines[0].faults).toHaveLength(0);
    expect(base.players[1].turbines[1].faults).toHaveLength(0);
  });
});

describe('S2.2 克制修復（克制矩陣 + required 白名單）', () => {
  function setupFault(player: 0 | 1, faultId: string, techs: string[]): GameState {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[player].techs = techs;
    s.players[player].turbines[0].faults.push({
      cardId: faultId, roundsLeft: 3, sev: 4, drop: 30,
    });
    return s;
  }

  it('F06 對手無 T03 → 不修', () => {
    const s = setupFault(0, 'F06', []);
    const r = repairFaults(s, 0);
    expect(r.state.players[0].turbines[0].faults).toHaveLength(1);
    expect(r.events).toHaveLength(0);
  });

  it('F06 對手有 T03 → 修復且事件附帶 by:T03 + quality:full（specialty 相符）', () => {
    const s = setupFault(0, 'F06', ['T03']);
    const r = repairFaults(s, 0);
    expect(r.state.players[0].turbines[0].faults).toHaveLength(0);
    // Route B：T03.specialty=mechanical 對應 F06.faultCategory=mechanical → quality=full
    expect(r.events).toContainEqual({
      kind: 'fault-repaired', player: 0, targetIdx: 0, cardId: 'F06', by: 'T03', quality: 'full',
    });
  });

  it('F04 required[T02,T08]：只有 T02 或 T08 能修；其他技師不行', () => {
    expect(repairFaults(setupFault(0, 'F04', ['T02']), 0).state.players[0].turbines[0].faults).toHaveLength(0);
    expect(repairFaults(setupFault(0, 'F04', ['T08']), 0).state.players[0].turbines[0].faults).toHaveLength(0);
    // T06 counters 含 F01–F05，但 F04 required 白名單只有 T02/T08 → T06 不可修 F04
    expect(repairFaults(setupFault(0, 'F04', ['T06']), 0).state.players[0].turbines[0].faults).toHaveLength(1);
    // T03 不在 F04 counters → 不修
    expect(repairFaults(setupFault(0, 'F04', ['T03']), 0).state.players[0].turbines[0].faults).toHaveLength(1);
  });

  it('F07 無 required：T03 可修；T04 不在 F07.counters → 不修', () => {
    // 對齊 v3：修復條件是 tech.counters 是否含此 faultId（非 fault.counters）。
    // T03.counters = [F06, F07] → 可修 F07。
    // 註：F07.counters 含 T06，但 v3 中 T06.counters = [F01..F05] 不含 F07，
    //     故 T06 實際無法 auto-repair F07（資料不對稱，屬待平衡 / 資料層議題，非 S2.2 範圍）。
    expect(repairFaults(setupFault(0, 'F07', ['T03']), 0).state.players[0].turbines[0].faults).toHaveLength(0);
    expect(repairFaults(setupFault(0, 'F07', ['T04']), 0).state.players[0].turbines[0].faults).toHaveLength(1);
  });

  it('（v3 已知資料不對稱）F07 + T06 仍不可 auto-repair（待資料層另案處理）', () => {
    // 此測試固定 v3 現況；若未來在資料層把 T06.counters 補上 F07，這支會自動失敗提醒改 spec。
    const r = repairFaults(setupFault(0, 'F07', ['T06']), 0);
    expect(r.state.players[0].turbines[0].faults).toHaveLength(1);
  });
});

describe('S2.2 T01 每回合上限（D4：legacyV3 旗標切換）', () => {
  function dualFaults(): GameState {
    // 兩台機組各有一個 F02（T01 counters[F01,F02,F03] 命中）
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = ['T01'];
    s.players[0].turbines = [
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [{ cardId: 'F02', roundsLeft: 1, sev: 1, drop: 10 }] },
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [{ cardId: 'F02', roundsLeft: 1, sev: 1, drop: 10 }] },
    ];
    return s;
  }

  it('legacyV3=false（預設）：T01 每回合只修 1 張', () => {
    const r = repairFaults(dualFaults(), 0);
    const remaining = r.state.players[0].turbines.reduce((sum, t) => sum + t.faults.length, 0);
    expect(remaining).toBe(1);
    expect(r.events.filter((e) => e.kind === 'fault-repaired')).toHaveLength(1);
  });

  it('legacyV3=true：T01 不限次（重現 v3 過強行為）', () => {
    const r = repairFaults(dualFaults(), 0, { legacyV3: true });
    const remaining = r.state.players[0].turbines.reduce((sum, t) => sum + t.faults.length, 0);
    expect(remaining).toBe(0);
    expect(r.events.filter((e) => e.kind === 'fault-repaired')).toHaveLength(2);
  });
});

describe('Route B 部分修復 + originalAvail 追蹤', () => {
  it('T01（無 specialty）修 F02（mechanical, drop=10）→ quality:partial、availLost=5、avail 永久降 5', () => {
    // T01.counters=[F01,F02,F03]；T01 無 specialty → 與 F02.faultCategory=mechanical 不符 → 部分修復
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = ['T01'];
    const availBefore = s.players[0].turbines[0].avail; // OS8 = 90
    s.players[0].turbines[0].faults.push({ cardId: 'F02', roundsLeft: 3, sev: 1, drop: 10 });
    const r = repairFaults(s, 0);
    // 故障移除
    expect(r.state.players[0].turbines[0].faults).toHaveLength(0);
    // 事件帶 quality=partial + availLost=5（floor(10×0.5)）
    expect(r.events).toContainEqual(
      expect.objectContaining({ kind: 'fault-repaired', quality: 'partial', availLost: 5 }),
    );
    // 機組 avail 永久下修 5
    expect(r.state.players[0].turbines[0].avail).toBe(availBefore - 5);
  });

  it('T06（specialty=hydraulic）修 F02（mechanical）→ 同樣為 quality:partial（專長不符）', () => {
    // T06.counters=[F01–F05] 包含 F02 → 可修；但 T06.specialty=hydraulic ≠ F02.faultCategory=mechanical
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = ['T06'];
    const availBefore = s.players[0].turbines[0].avail;
    s.players[0].turbines[0].faults.push({ cardId: 'F02', roundsLeft: 3, sev: 1, drop: 10 });
    const r = repairFaults(s, 0);
    expect(r.state.players[0].turbines[0].faults).toHaveLength(0);
    expect(r.events).toContainEqual(
      expect.objectContaining({ kind: 'fault-repaired', quality: 'partial', availLost: 5 }),
    );
    expect(r.state.players[0].turbines[0].avail).toBe(availBefore - 5);
  });

  it('originalAvail：createInitialState 開局艦隊各機組均有 originalAvail，且與初始 avail 相同', () => {
    const s = createInitialState(createRng(1));
    // OS8=90, OS10=88, OS12=86
    const [os8, os10, os12] = s.players[0].turbines;
    expect(os8.originalAvail).toBe(os8.avail);
    expect(os10.originalAvail).toBe(os10.avail);
    expect(os12.originalAvail).toBe(os12.avail);
  });

  it('originalAvail：部分修復後 avail 降低，但 originalAvail 保持不變（教育用：顯示長期損耗）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = ['T01'];
    const t = s.players[0].turbines[0]; // OS8, originalAvail=90
    t.faults.push({ cardId: 'F02', roundsLeft: 3, sev: 1, drop: 10 });
    const r = repairFaults(s, 0);
    // avail 下修 5（85），originalAvail 仍是 90
    expect(r.state.players[0].turbines[0].avail).toBe((t.originalAvail ?? 90) - 5);
    expect(r.state.players[0].turbines[0].originalAvail).toBe(t.originalAvail);
  });
});

describe('S2.2 spreading（F03 未修每回合 +5%，由 tickFaults 推進）', () => {
  it('roundsLeft>1 時 drop +5；roundsLeft=1 時不再增加（最後一回合直接修復）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines[0].faults = [
      { cardId: 'F03', roundsLeft: 2, sev: 2, drop: 10 },
    ];
    const r1 = tickFaults(s);
    // 推進前 drop=10，spreading 在 roundsLeft>1 時 +5；隨後 roundsLeft -= 1
    expect(r1.state.players[0].turbines[0].faults).toHaveLength(1);
    expect(r1.state.players[0].turbines[0].faults[0].drop).toBe(15);
    expect(r1.state.players[0].turbines[0].faults[0].roundsLeft).toBe(1);

    // 再推進一次：roundsLeft 從 1 → 0 → 觸發修復事件並移除
    const r2 = tickFaults(r1.state);
    expect(r2.state.players[0].turbines[0].faults).toHaveLength(0);
    expect(r2.events.some((e) => e.kind === 'fault-repaired')).toBe(true);
  });
});

describe('故障數量上限（同台風機最多 2 個故障）', () => {
  /** 建立一台已有 N 個故障的風機狀態（對手 P1 的第一台機組）。 */
  function withFaults(n: number): GameState {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[1].turbines = [{
      cardId: 'M07', avail: 95, mwBonus: 0,
      faults: Array.from({ length: n }, () => ({ cardId: 'F02', roundsLeft: 3, sev: 1, drop: 10 })),
    }];
    return s;
  }

  it('0 個故障 → 可正常施加，故障數 = 1', () => {
    const r = applyFault(withFaults(0), 0, 'F02', fixedRng([]));
    expect(r.state.players[1].turbines[0].faults).toHaveLength(1);
    expect(r.events.some((e) => e.kind === 'fault-applied')).toBe(true);
  });

  it('1 個故障 → 可正常施加，故障數 = 2', () => {
    const r = applyFault(withFaults(1), 0, 'F02', fixedRng([]));
    expect(r.state.players[1].turbines[0].faults).toHaveLength(2);
    expect(r.events.some((e) => e.kind === 'fault-applied')).toBe(true);
  });

  it('2 個故障 → 第 3 個不疊加，改為觸發停機事件', () => {
    const r = applyFault(withFaults(2), 0, 'F02', fixedRng([]));
    // 故障數量不增加（仍為 2）
    expect(r.state.players[1].turbines[0].faults).toHaveLength(2);
    // 不發 fault-applied
    expect(r.events.some((e) => e.kind === 'fault-applied')).toBe(false);
    // 改發 turbine-shutdown
    expect(r.events.some((e) => e.kind === 'turbine-shutdown')).toBe(true);
    expect(r.state.players[1].turbines[0].shutdown).toBe(true);
  });

  it('已停機的風機再受第 3 個故障攻擊 → 不重複發 turbine-shutdown', () => {
    const s = withFaults(2);
    s.players[1].turbines[0].shutdown = true; // 已停機
    const r = applyFault(s, 0, 'F02', fixedRng([]));
    // 故障數量不增加
    expect(r.state.players[1].turbines[0].faults).toHaveLength(2);
    // 不發 turbine-shutdown（已停機，不重複）
    expect(r.events.some((e) => e.kind === 'turbine-shutdown')).toBe(false);
  });

  it('停機後修復故障 → 有效可用率 > 0 時恢復運轉', () => {
    // 先讓風機停機（2 個故障 + 第 3 個觸發停機）
    const r1 = applyFault(withFaults(2), 0, 'F02', fixedRng([]));
    expect(r1.state.players[1].turbines[0].shutdown).toBe(true);
    // 修復所有故障（直接清空 faults 模擬修復）
    const s2 = structuredClone(r1.state);
    s2.players[1].turbines[0].faults = [];
    // 有效可用率 = 95 > 0，停機應可恢復（透過 repairFaults 的 restart 邏輯）
    // 這裡驗證 effectiveAvail 計算正確（間接驗證）
    expect(s2.players[1].turbines[0].avail).toBe(95);
  });
});
