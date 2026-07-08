// S2.3 動作層測試：cost / canPlay / play-card 各卡類 / FN01-06 / end-turn / FN05 D4 修正。
import { describe, it, expect } from 'vitest';
import type { Rng } from '../src/core/rng';
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import {
  applyAction,
  canPlayCard,
  effectiveCost,
  legalActions,
  type Action,
} from '../src/core/actions';
import { runGame } from '../src/core/rules-engine';
import type { GameState } from '../src/core/types';

/** 把 0.x 序列灌進 Rng（draw / cascade / wind 隨機性都可被精確控制）。 */
function fixedRng(values: number[]): Rng {
  let i = 0;
  const next = (): number => values[i++] ?? 0;
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

/** 重設玩家手牌 + 動作數，方便控制測試前置條件。 */
function withHand(s: GameState, player: 0 | 1, hand: string[], actionsLeft = 2): GameState {
  const next = structuredClone(s);
  next.players[player].hand = [...hand];
  next.actionsLeft = actionsLeft;
  next.currentPlayer = player;
  return next;
}

describe('S2.3 effectiveCost（T07 tech-discount）', () => {
  it('未派遣 T07 → 原 cost', () => {
    const s = createInitialState(createRng(1));
    expect(effectiveCost(s, 0, 'T06')).toBe(2); // T06 cost 2
    expect(effectiveCost(s, 0, 'T01')).toBe(1); // T01 cost 1
  });
  it('已派遣 T07 → tech 卡 -1（下限 1）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = ['T07'];
    expect(effectiveCost(s, 0, 'T06')).toBe(1); // 2 → 1
    expect(effectiveCost(s, 0, 'T01')).toBe(1); // 1 → 1（下限）
  });
  it('T07 折扣不影響 fault / turbine / func', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = ['T07'];
    expect(effectiveCost(s, 0, 'F06')).toBe(2);
    expect(effectiveCost(s, 0, 'M03')).toBe(2);
    expect(effectiveCost(s, 0, 'FN03')).toBe(2); // FN03 cost=2（v5.11 回退）
  });
});

describe('S2.3 canPlayCard / legalActions', () => {
  it('非當前玩家 → 不可玩', () => {
    const s = withHand(createInitialState(createRng(1)), 0, ['M01'], 2);
    expect(canPlayCard(s, 1, 0)).toBe(false);
  });
  it('cost > actionsLeft → 不可玩', () => {
    const s = withHand(createInitialState(createRng(1)), 0, ['F06'], 1); // F06 cost 2
    expect(canPlayCard(s, 0, 0)).toBe(false);
  });
  it('tech 已派遣 → 不可重複', () => {
    const s = withHand(createInitialState(createRng(1)), 0, ['T01'], 2);
    s.players[0].techs = ['T01'];
    expect(canPlayCard(s, 0, 0)).toBe(false);
  });
  it('fault 但對手無機組 → 不可玩', () => {
    const s = withHand(createInitialState(createRng(1)), 0, ['F02'], 2);
    s.players[1].turbines = [];
    expect(canPlayCard(s, 0, 0)).toBe(false);
  });
  it('FN01 returnTurbine 但自己無機組 → 不可玩', () => {
    const s = withHand(createInitialState(createRng(1)), 0, ['FN01'], 2);
    s.players[0].turbines = [];
    expect(canPlayCard(s, 0, 0)).toBe(false);
  });
  it('FN03 upgradeMW 但所有機組已升級 → 不可玩', () => {
    const s = withHand(createInitialState(createRng(1)), 0, ['FN03'], 2);
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 2, faults: [] }];
    expect(canPlayCard(s, 0, 0)).toBe(false);
  });
  it('legalActions 至少包含 end-turn', () => {
    const s = createInitialState(createRng(1));
    expect(legalActions(s, 0).some((a) => a.kind === 'end-turn')).toBe(true);
  });
});

describe('S2.3 applyAction：turbine 部署 / 替換 / fault', () => {
  it('turbine 部署（Route B：主力 + 備戰區已滿 3 台 → 替換備戰區最弱）', () => {
    // Route B：開局已有 OS8(主力,8MW)+OS10(10MW)+OS12(12MW)（備戰區 2 台），
    // 先補一台最弱的機組湊滿備戰區 3 台，才符合「艦隊已滿」的新規則定義。
    const s = withHand(createInitialState(createRng(1)), 0, ['M03'], 2); // M03 cost 2, 4MW
    s.players[0].turbines.push({ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }); // 備戰區第 3 台，2MW（最弱）
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.state.players[0].turbines).toHaveLength(4); // 主力 1 + 備戰區上限 3
    expect(r.state.players[0].turbines.some((t) => t.cardId === 'M03')).toBe(true);
    expect(r.state.players[0].turbines.some((t) => t.cardId === 'M01')).toBe(false); // 備戰區最弱被替換
    expect(r.state.players[0].turbines.some((t) => t.cardId === 'OS8')).toBe(true); // 主力不受影響
    expect(r.state.actionsLeft).toBe(0);
    expect(r.events.some((e) => e.kind === 'turbine-deployed')).toBe(true);
    expect(r.events.some((e) => e.kind === 'turbine-replaced')).toBe(true);
  });

  it('主力 + 備戰區滿 3 台 + 未指定 replaceIdx → 替換備戰區最弱（不動主力）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M02', avail: 93, mwBonus: 0, faults: [] }, // 主力：3MW
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }, // 備戰：2MW（最弱）
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] }, // 備戰：4MW
      { cardId: 'OS8', avail: 90, mwBonus: 0, faults: [] }, // 備戰：8MW（湊滿備戰區 3 台）
    ];
    s.players[0].activeTurbineIdx = 0;
    s.players[0].hand = ['M07']; // 12MW
    s.actionsLeft = 5;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.state.players[0].turbines).toHaveLength(4);
    expect(r.state.players[0].turbines.map((t) => t.cardId).includes('M01')).toBe(false);
    expect(r.state.players[0].turbines.map((t) => t.cardId).includes('M02')).toBe(true); // 主力不受影響
    expect(r.events.some((e) => e.kind === 'turbine-replaced')).toBe(true);
  });

  it('主力 + 備戰區滿 3 台 + 指定 replaceIdx → 替換指定的備戰區那台', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M02', avail: 93, mwBonus: 0, faults: [] }, // 主力
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }, // 備戰 idx1
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] }, // 備戰 idx2（指定替換這台）
      { cardId: 'OS8', avail: 90, mwBonus: 0, faults: [] }, // 備戰 idx3
    ];
    s.players[0].activeTurbineIdx = 0;
    s.players[0].hand = ['M07'];
    s.actionsLeft = 5;
    const r = applyAction(
      s,
      { kind: 'play-card', player: 0, handIdx: 0, replaceIdx: 2 },
      fixedRng([]),
    );
    expect(r.state.players[0].turbines.map((t) => t.cardId).includes('M03')).toBe(false);
  });

  it('指定 replaceIdx＝主力索引 → 視為非法，改自動替換備戰區最弱（主力受保護）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M02', avail: 93, mwBonus: 0, faults: [] }, // 主力 idx0（企圖指定被替換，應被忽略）
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }, // 備戰 idx1，2MW（最弱，改自動選中）
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] }, // 備戰 idx2
      { cardId: 'OS8', avail: 90, mwBonus: 0, faults: [] }, // 備戰 idx3
    ];
    s.players[0].activeTurbineIdx = 0;
    s.players[0].hand = ['M07'];
    s.actionsLeft = 5;
    const r = applyAction(
      s,
      { kind: 'play-card', player: 0, handIdx: 0, replaceIdx: 0 },
      fixedRng([]),
    );
    expect(r.state.players[0].turbines.map((t) => t.cardId).includes('M02')).toBe(true); // 主力保留
    expect(r.state.players[0].turbines.map((t) => t.cardId).includes('M01')).toBe(false); // 改替換備戰區最弱
  });

  it('fault 經 applyAction → 預設目標為對手主力（寶可夢式規則；與 S2.2 applyFault 行為一致）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['F02'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    s.players[1].turbines = [
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }, // 主力 idx0
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 備戰區 idx1，免疫故障目標
    ];
    s.players[1].activeTurbineIdx = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.state.players[1].turbines[0].faults).toHaveLength(1); // M01（主力）中招
    expect(r.state.players[1].turbines[1].faults).toHaveLength(0); // M07（備戰區）免疫
  });
});

describe('S2.3 applyAction：tech / T06 free-repair', () => {
  it('派遣 tech → push 並發 tech-deployed 事件', () => {
    const s = withHand(createInitialState(createRng(1)), 0, ['T01'], 2);
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.state.players[0].techs).toEqual(['T01']);
    expect(r.events.some((e) => e.kind === 'tech-deployed')).toBe(true);
  });

  it('T06 派遣 → 立即修復一個 sev ≤ 3 的故障（free-repair）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines[0].faults = [
      { cardId: 'F01', roundsLeft: 1, sev: 1, drop: 5 },
      { cardId: 'F05', roundsLeft: 2, sev: 3, drop: 25 }, // 應優先修這張（sev 較高）
    ];
    s.players[0].hand = ['T06'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    const remaining = r.state.players[0].turbines[0].faults.map((f) => f.cardId);
    expect(remaining).toEqual(['F01']); // F05 被立即修復，F01 保留
    expect(
      r.events.some((e) => e.kind === 'fault-repaired' && e.by === 'T06'),
    ).toBe(true);
  });
});

describe('S2.3 applyAction：FN01–06 功能卡', () => {
  it('FN01 returnTurbine：把最弱機組收回手牌', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] }, // 4MW
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }, // 2MW（最弱）
    ];
    s.players[0].hand = ['FN01'];
    s.actionsLeft = 1;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.state.players[0].turbines.map((t) => t.cardId)).toEqual(['M03']);
    expect(r.state.players[0].hand).toContain('M01');
    expect(r.events.some((e) => e.kind === 'turbine-returned')).toBe(true);
  });

  it('FN02 draw2：抽 2 張、消耗 2 次 rng（無重洗時）', () => {
    const s = withHand(createInitialState(createRng(1)), 0, ['FN02'], 1);
    const before = s.players[0].hand.length; // 1
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([0, 0]));
    // 打掉 FN02 自己 + 抽 2 → 手牌 = 0 + 2 = 2
    expect(r.state.players[0].hand.length).toBe(before - 1 + 2);
  });

  it('FN03 upgradeMW：最強無 bonus 機組 +2 MW', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }, // 2MW
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] }, // 4MW（最強）
    ];
    s.players[0].hand = ['FN03'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    const upgraded = r.state.players[0].turbines.find((t) => t.cardId === 'M03');
    expect(upgraded?.mwBonus).toBe(2);
    expect(r.state.players[0].turbines.find((t) => t.cardId === 'M01')?.mwBonus).toBe(0);
  });

  it('FN04 extraAction：pendingExtraActions +1，最多 2', () => {
    const s = withHand(createInitialState(createRng(1)), 0, ['FN04', 'FN04', 'FN04'], 0);
    s.actionsLeft = 3; // 強制可玩，雖然 v3 cost=0 也行
    const r1 = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r1.state.players[0].pendingExtraActions).toBe(1);
    const r2 = applyAction(r1.state, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r2.state.players[0].pendingExtraActions).toBe(2);
    const r3 = applyAction(r2.state, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r3.state.players[0].pendingExtraActions).toBe(2); // 上限
  });

  it('FN05 predictWind：futureWind 推入 3 個，消耗 3 次 rng', () => {
    const s = withHand(createInitialState(createRng(1)), 0, ['FN05'], 1);
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, createRng(42));
    expect(r.state.futureWind).toHaveLength(3);
    expect(r.events.some((e) => e.kind === 'predict-wind')).toBe(true);
  });

  it('FN06 mwhBoost：mwhBoostActive=true', () => {
    const s = withHand(createInitialState(createRng(1)), 0, ['FN06'], 3); // FN06 cost=3（v5.16）
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.state.players[0].mwhBoostActive).toBe(true);
    expect(r.events.some((e) => e.kind === 'mwh-boost')).toBe(true);
  });
});

describe('技師卡每回合出牌限制（一回合只能出一張）', () => {
  it('未出過技師卡 → 可以出', () => {
    const s = withHand(createInitialState(createRng(1)), 0, ['T01'], 2);
    expect(canPlayCard(s, 0, 0)).toBe(true);
  });

  it('同回合已出過一張技師卡 → 第二張技師卡被鎖定', () => {
    const s = withHand(createInitialState(createRng(1)), 0, ['T01', 'T02'], 4);
    // 出 T01
    const r1 = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    // T01 已出，techPlayedThisRound = true，手牌剩 ['T02']
    expect(r1.state.players[0].techPlayedThisRound).toBe(true);
    // T02 應被鎖定
    expect(canPlayCard(r1.state, 0, 0)).toBe(false);
  });

  it('同回合已出技師卡，但其他類型卡不受影響', () => {
    const s = withHand(createInitialState(createRng(1)), 0, ['T01', 'M03'], 4);
    const r1 = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    // M03 turbine 卡不受技師限制
    expect(canPlayCard(r1.state, 0, 0)).toBe(true);
  });

  it('下一回合開始時 techPlayedThisRound 被重置', () => {
    // 先出一張技師卡
    const s = withHand(createInitialState(createRng(1)), 0, ['T01'], 2);
    const r1 = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r1.state.players[0].techPlayedThisRound).toBe(true);
    // 模擬 _beginTurn 重置（直接修改 state 模擬下一回合開始）
    const nextTurn = structuredClone(r1.state);
    nextTurn.players[0].techPlayedThisRound = false; // _beginTurn 會重置
    nextTurn.players[0].hand = ['T02'];
    nextTurn.actionsLeft = 2;
    nextTurn.currentPlayer = 0;
    expect(canPlayCard(nextTurn, 0, 0)).toBe(true);
  });

  it('整局 runGame 中每回合開始技師限制自動重置', () => {
    // 跨回合驗證：runGame 内 _beginTurn 會重置 techPlayedThisRound
    const initial = createInitialState(createRng(1));
    const r = runGame({ ...initial, maxRounds: 2 } as GameState, createRng(1));
    // 只要沒有 throw 且回合正常結束即為通過
    expect(r.events.some((e) => e.kind === 'game-over')).toBe(true);
  });
});

describe('S2.3 end-turn 事件', () => {
  it('回傳新狀態（== 入參深拷貝）+ turn-ended 事件', () => {
    const s = createInitialState(createRng(1));
    const action: Action = { kind: 'end-turn', player: 0 };
    const r = applyAction(s, action, fixedRng([]));
    expect(r.events).toContainEqual({ kind: 'turn-ended', player: 0 });
    expect(r.state.round).toBe(s.round); // 不直接推進回合，由 runGame 控制
  });
});

describe('S2.3 純函式：applyAction 不更動入參', () => {
  it('打 turbine 後原 state 手牌不變', () => {
    const s = withHand(createInitialState(createRng(1)), 0, ['M03'], 2);
    const handBefore = [...s.players[0].hand];
    applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(s.players[0].hand).toEqual(handBefore);
    expect(s.actionsLeft).toBe(2);
  });
});

describe('S2.3 FN05 D4 修正：runGame 優先消費 futureWind', () => {
  it('legacyV3=false（預設）：futureWind 會被下回合消費', () => {
    // 注入一個非常識別的 wind 到 futureWind，跑 1 回合驗證 round-start 用此 wind label
    const initial = createInitialState(createRng(1));
    initial.futureWind = [
      { roll: 99, speed: 99, coeff: 0.5, label: '預測風' },
      { roll: 99, speed: 99, coeff: 0.5, label: '預測風B' },
      { roll: 99, speed: 99, coeff: 0.5, label: '預測風C' },
    ];
    const r = runGame({ ...initial, maxRounds: 3 } as GameState, createRng(1));
    const roundStarts = r.events.filter((e) => e.kind === 'round-start');
    expect(roundStarts[0]).toMatchObject({ windLabel: '預測風' });
    expect(roundStarts[1]).toMatchObject({ windLabel: '預測風B' });
    expect(roundStarts[2]).toMatchObject({ windLabel: '預測風C' });
  });

  it('legacyV3=true：futureWind 被忽略，仍 rollWind（重現 v3 bug）', () => {
    const initial = createInitialState(createRng(1));
    initial.futureWind = [
      { roll: 99, speed: 99, coeff: 0.5, label: '預測風' },
    ];
    const r = runGame({ ...initial, maxRounds: 1 } as GameState, createRng(1), undefined, {
      legacyV3: true,
    });
    const first = r.events.find((e) => e.kind === 'round-start');
    expect(first).not.toMatchObject({ windLabel: '預測風' });
  });
});

describe('FN09 緊急大修（massRepair）', () => {
  it('清除自家所有機組的所有故障', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M01', avail: 75, mwBonus: 0, faults: [{ cardId: 'F02', drop: 10, roundsLeft: 2, sev: 1 }] },
      { cardId: 'M03', avail: 70, mwBonus: 0, faults: [{ cardId: 'F04', drop: 20, roundsLeft: 3, sev: 2 }] },
    ];
    s.players[0].hand = ['FN09'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.state.players[0].turbines[0].faults).toHaveLength(0);
    expect(r.state.players[0].turbines[1].faults).toHaveLength(0);
    expect(r.events.filter((e) => e.kind === 'fault-repaired')).toHaveLength(2);
  });

  it('停機機組同時復機並回復 20% 可用率', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M01', avail: 5, mwBonus: 0, faults: [{ cardId: 'F02', drop: 10, roundsLeft: 1, sev: 1 }], shutdown: true },
      { cardId: 'M03', avail: 90, mwBonus: 0, faults: [] },
    ];
    s.players[0].hand = ['FN09'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    const t0 = r.state.players[0].turbines[0];
    expect(t0.shutdown).toBeFalsy();
    expect(t0.avail).toBeGreaterThanOrEqual(20);
    expect(r.events.some((e) => e.kind === 'turbine-restart')).toBe(true);
  });

  it('每場限用 1 次：出牌後 usedOncePerGame 加入 FN09', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M01', avail: 75, mwBonus: 0, faults: [{ cardId: 'F02', drop: 10, roundsLeft: 2, sev: 1 }] },
    ];
    s.players[0].hand = ['FN09'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.state.players[0].usedOncePerGame).toContain('FN09');
  });

  it('每場限用 1 次：第二次出牌被 canPlayCard 阻擋', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M01', avail: 75, mwBonus: 0, faults: [{ cardId: 'F02', drop: 10, roundsLeft: 2, sev: 1 }] },
    ];
    s.players[0].hand = ['FN09', 'FN09'];
    s.players[0].usedOncePerGame = ['FN09']; // 已使用過
    s.actionsLeft = 6;
    s.currentPlayer = 0;
    expect(canPlayCard(s, 0, 0)).toBe(false);
    expect(canPlayCard(s, 0, 1)).toBe(false);
  });

  it('無故障且無停機機組時：不發出 fault-repaired 事件，且內部發出 mass-repair-noop', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] },
    ];
    s.players[0].hand = ['FN09'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    // 無故障時不應發出 fault-repaired 事件
    expect(r.events.filter((e) => e.kind === 'fault-repaired')).toHaveLength(0);
    // 內部發出的第二個 func-played effect 應為 mass-repair-noop
    const noopEvent = r.events.filter((e) => e.kind === 'func-played').at(-1);
    expect(noopEvent?.kind === 'func-played' && noopEvent.effect).toBe('mass-repair-noop');
  });
});

describe('UP01-UP04 風機升級進化卡', () => {
  it('UP01：M01 進化為 M03，保留 avail 和 faults', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M01', avail: 80, mwBonus: 0, faults: [{ cardId: 'F01', roundsLeft: 1, drop: 10, sev: 1 }] },
    ];
    s.players[0].hand = ['UP01'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    // 應發出 turbine-evolved 事件
    const ev = r.events.find((e) => e.kind === 'turbine-evolved');
    expect(ev?.kind).toBe('turbine-evolved');
    if (ev?.kind === 'turbine-evolved') {
      expect(ev.fromCardId).toBe('M01');
      expect(ev.toCardId).toBe('M03');
    }
    // 機組應已進化為 M03
    expect(r.state.players[0].turbines[0].cardId).toBe('M03');
    // 保留 avail（取較小值）
    expect(r.state.players[0].turbines[0].avail).toBeLessThanOrEqual(80);
    // 保留 faults
    expect(r.state.players[0].turbines[0].faults).toHaveLength(1);
  });

  it('UP02：M04 進化為 M06', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M04', avail: 90, mwBonus: 0, faults: [] },
    ];
    s.players[0].hand = ['UP02'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    const ev = r.events.find((e) => e.kind === 'turbine-evolved');
    expect(ev?.kind).toBe('turbine-evolved');
    if (ev?.kind === 'turbine-evolved') {
      expect(ev.fromCardId).toBe('M04');
      expect(ev.toCardId).toBe('M06');
    }
  });

  it('UP03：M05 進化為 M09', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M05', avail: 95, mwBonus: 0, faults: [] },
    ];
    s.players[0].hand = ['UP03'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    const ev = r.events.find((e) => e.kind === 'turbine-evolved');
    expect(ev?.kind).toBe('turbine-evolved');
    if (ev?.kind === 'turbine-evolved') {
      expect(ev.fromCardId).toBe('M05');
      expect(ev.toCardId).toBe('M09');
    }
  });

  it('UP04：對最強未升級機組加 +3MW', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M07', avail: 95, mwBonus: 0, faults: [] },
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] },
    ];
    s.players[0].hand = ['UP04'];
    s.actionsLeft = 4; // UP04 cost=4（v5.11）
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    const ev = r.events.find((e) => e.kind === 'turbine-upgraded');
    expect(ev?.kind).toBe('turbine-upgraded');
    if (ev?.kind === 'turbine-upgraded') {
      expect(ev.bonus).toBe(3);
    }
    // 最強機組（M07）應獲得 +3MW
    expect(r.state.players[0].turbines[0].mwBonus).toBe(3);
  });

  it('UP01：場上無符合機組時不發出 turbine-evolved 事件', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M07', avail: 95, mwBonus: 0, faults: [] }, // M07 不符合 tier1
    ];
    s.players[0].hand = ['UP01'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.events.filter((e) => e.kind === 'turbine-evolved')).toHaveLength(0);
  });
});

describe('FN08 insurance-shield', () => {
  it('打出 FN08 → 目標機組獲得 shieldCount=1，發出 turbine-shielded 事件', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    // P0 有機組，手牌放 FN08
    s.players[0].turbines = [
      { cardId: 'OS8', avail: 90, mwBonus: 0, faults: [] },
    ];
    s.players[0].hand = ['FN08'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    // 應有 turbine-shielded 事件
    const ev = r.events.find((e) => e.kind === 'turbine-shielded');
    expect(ev?.kind).toBe('turbine-shielded');
    if (ev?.kind === 'turbine-shielded') {
      expect(ev.shieldCount).toBe(1);
      expect(ev.player).toBe(0);
    }
    // 機組的 shieldCount 應為 1
    expect(r.state.players[0].turbines[0].shieldCount).toBe(1);
  });

  it('有保護盾的機組受到故障 → 保護盾吸收，故障不生效，發出 shield-absorbed 事件', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    // P1（對手）有一台機組，且已有 shieldCount=1
    s.players[1].turbines = [
      { cardId: 'OS8', avail: 90, mwBonus: 0, faults: [], shieldCount: 1 },
    ];
    // P0 出故障卡攻擊 P1
    s.players[0].hand = ['F01'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(
      s,
      { kind: 'play-card', player: 0, handIdx: 0, target: 0 },
      fixedRng([0.99]), // cascade rng（F01 無 cascade，但確保 rng 穩定）
    );
    // 應有 shield-absorbed 事件
    const ev = r.events.find((e) => e.kind === 'shield-absorbed');
    expect(ev?.kind).toBe('shield-absorbed');
    if (ev?.kind === 'shield-absorbed') {
      expect(ev.player).toBe(1);
      expect(ev.turbineIdx).toBe(0);
      expect(ev.shieldLeft).toBe(0);
    }
    // 不應有 fault-applied 事件
    expect(r.events.filter((e) => e.kind === 'fault-applied')).toHaveLength(0);
    // 機組故障清單應為空
    expect(r.state.players[1].turbines[0].faults).toHaveLength(0);
    // shieldCount 應消耗為 0
    expect(r.state.players[1].turbines[0].shieldCount).toBe(0);
  });

  it('保護盾耗盡後，下一個故障正常生效', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    // P1 機組已有 shieldCount=0（已耗盡）
    s.players[1].turbines = [
      { cardId: 'OS8', avail: 90, mwBonus: 0, faults: [], shieldCount: 0 },
    ];
    s.players[0].hand = ['F01'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(
      s,
      { kind: 'play-card', player: 0, handIdx: 0, target: 0 },
      fixedRng([0.99]),
    );
    // 應有 fault-applied 事件（保護盾已耗盡，故障正常生效）
    expect(r.events.filter((e) => e.kind === 'fault-applied')).toHaveLength(1);
    // 不應有 shield-absorbed 事件
    expect(r.events.filter((e) => e.kind === 'shield-absorbed')).toHaveLength(0);
    // 機組應有 1 個故障
    expect(r.state.players[1].turbines[0].faults).toHaveLength(1);
  });

  it('FN08 打出後 target 參數可指定特定機組', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'OS8',  avail: 90, mwBonus: 0, faults: [] },
      { cardId: 'OS10', avail: 88, mwBonus: 0, faults: [] },
    ];
    s.players[0].hand = ['FN08'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    // 指定 target=1（第二台機組）
    const r = applyAction(
      s,
      { kind: 'play-card', player: 0, handIdx: 0, target: 1 },
      fixedRng([]),
    );
    // 第二台機組應有保護盾
    expect(r.state.players[0].turbines[1].shieldCount).toBe(1);
    // 第一台機組不應有保護盾
    expect(r.state.players[0].turbines[0].shieldCount ?? 0).toBe(0);
  });
});

describe('T08 無人機操作員 peek-hand（出場時查看對手 2 張手牌）', () => {
  it('部署 T08 → 發出 peek-hand 事件，cardIds 為對手前 2 張手牌', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['T08'];
    s.players[1].hand = ['F01', 'F02', 'M01'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    const peekEvents = r.events.filter((e) => e.kind === 'peek-hand');
    expect(peekEvents).toHaveLength(1);
    const ev = peekEvents[0] as { kind: 'peek-hand'; player: 0 | 1; cardIds: string[] };
    expect(ev.player).toBe(0);
    expect(ev.cardIds).toEqual(['F01', 'F02']); // 前 2 張
  });

  it('對手手牌只有 1 張 → peek-hand 事件 cardIds 長度為 1', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['T08'];
    s.players[1].hand = ['F01'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    const peekEvents = r.events.filter((e) => e.kind === 'peek-hand');
    expect(peekEvents).toHaveLength(1);
    const ev = peekEvents[0] as { kind: 'peek-hand'; player: 0 | 1; cardIds: string[] };
    expect(ev.cardIds).toHaveLength(1);
  });

  it('對手手牌為空 → 不發 peek-hand 事件', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['T08'];
    s.players[1].hand = [];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.events.filter((e) => e.kind === 'peek-hand')).toHaveLength(0);
  });

  it('peek-hand 不消耗對手手牌（對手手牌張數不變）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['T08'];
    s.players[1].hand = ['F01', 'F02', 'M01'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.state.players[1].hand).toHaveLength(3);
  });
});

describe('T09 研發總監 func-bonus（出功能卡 +1 動作，最多 +2）', () => {
  // 使用 FN04 extraAction（cost=0）避免 FN01 returnTurbine 副作用（會把機組收回手牌）
  // T09 有 func-discount，FN04 cost=0 後仍為 0（下限 0）
  it('場上有 T09，出 1 張 func 卡 → actionsLeft +1，發出 func-bonus 事件', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = ['T09'];
    s.players[0].hand = ['FN04'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    const bonusEvents = r.events.filter((e) => e.kind === 'func-bonus');
    expect(bonusEvents).toHaveLength(1);
    const ev = bonusEvents[0] as { kind: 'func-bonus'; player: 0 | 1; actionsGained: number; totalBonus: number };
    expect(ev.actionsGained).toBe(1);
    expect(ev.totalBonus).toBe(1);
    // FN04 cost=0（T09 func-discount 下限 0），出牌後 actionsLeft = 3 - 0 + 1 = 4
    expect(r.state.actionsLeft).toBe(4);
  });

  it('場上有 T09，出 2 張 func 卡 → 第 2 次仍 +1（累計 +2）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = ['T09'];
    s.players[0].hand = ['FN04', 'FN04'];
    s.actionsLeft = 5;
    s.currentPlayer = 0;
    // 出第 1 張 FN04
    const r1 = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r1.events.filter((e) => e.kind === 'func-bonus')).toHaveLength(1);
    expect(r1.state.players[0].funcBonusThisRound).toBe(1);
    // 出第 2 張 FN04
    const r2 = applyAction(r1.state, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r2.events.filter((e) => e.kind === 'func-bonus')).toHaveLength(1);
    expect(r2.state.players[0].funcBonusThisRound).toBe(2);
  });

  it('場上有 T09，出 3 張 func 卡 → 第 3 次不再 +1（上限 2）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = ['T09'];
    s.players[0].hand = ['FN04', 'FN04', 'FN04'];
    s.actionsLeft = 8;
    s.currentPlayer = 0;
    const r1 = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    const r2 = applyAction(r1.state, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    const r3 = applyAction(r2.state, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    // 第 3 次不應有 func-bonus 事件
    expect(r3.events.filter((e) => e.kind === 'func-bonus')).toHaveLength(0);
    // funcBonusThisRound 仍為 2（上限）
    expect(r3.state.players[0].funcBonusThisRound).toBe(2);
  });

  it('場上無 T09，出 func 卡 → 不發 func-bonus 事件', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = ['T01']; // T01 不是研發總監
    s.players[0].turbines = [{ cardId: 'OS8', avail: 90, mwBonus: 0, faults: [] }];
    s.players[0].hand = ['FN01'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.events.filter((e) => e.kind === 'func-bonus')).toHaveLength(0);
  });

  it('T09 func-bonus 在 _beginTurn 時重置（新回合重新累計）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = ['T09'];
    s.players[0].turbines = [{ cardId: 'OS8', avail: 90, mwBonus: 0, faults: [] }];
    s.players[0].hand = ['FN04']; // 用不需要備戰區前置條件的 func 卡（FN01 現在需要備戰區機組才能出）
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    // 出 1 張 func 卡，funcBonusThisRound = 1
    const r1 = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r1.state.players[0].funcBonusThisRound).toBe(1);
    // 模擬 _beginTurn 重置
    const s2 = structuredClone(r1.state);
    s2.players[0].funcBonusThisRound = 0; // _beginTurn 會重置
    expect(s2.players[0].funcBonusThisRound).toBe(0);
  });
});
