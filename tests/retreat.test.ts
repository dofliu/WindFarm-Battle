// 寶可夢式主力/備戰區規則測試：部署（主力/備戰區指派）、故障目標限制、撤退動作。
import { describe, it, expect } from 'vitest';
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import { applyAction, canRetreat, canPlayCard, RETREAT_ACTION_COST } from '../src/core/actions';
import { _repairFaults } from '../src/core/rules-engine';
import type { GameState } from '../src/core/types';

/** 建立一個「空艦隊」狀態，方便測試從零開始部署主力/備戰區。 */
function emptyFleetState(): GameState {
  const s = structuredClone(createInitialState(createRng(1)));
  s.players[0].turbines = [];
  s.players[0].activeTurbineIdx = null;
  s.currentPlayer = 0;
  s.actionsLeft = 5;
  return s;
}

describe('寶可夢式主力/備戰區：部署指派規則', () => {
  it('尚無主力時，第一台部署的機組立即成為主力', () => {
    const s = emptyFleetState();
    s.players[0].hand = ['M01'];
    const { state } = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, createRng(1));
    expect(state.players[0].turbines).toHaveLength(1);
    expect(state.players[0].activeTurbineIdx).toBe(0);
  });

  it('已有主力時，第二台（及之後）部署的機組進入備戰區，不取代主力', () => {
    const s = emptyFleetState();
    s.players[0].hand = ['M01', 'M02'];
    const r1 = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, createRng(1));
    const r2 = applyAction(r1.state, { kind: 'play-card', player: 0, handIdx: 0 }, createRng(1));
    expect(r2.state.players[0].turbines).toHaveLength(2);
    expect(r2.state.players[0].activeTurbineIdx).toBe(0); // 主力仍是第一台
    expect(r2.state.players[0].turbines[1].cardId).toBe('M02'); // 第二台進備戰區
  });

  it('備戰區已滿 3 台時，部署第 5 台（含主力）只替換備戰區最弱一台，主力不受影響', () => {
    const s = emptyFleetState();
    s.players[0].turbines = [
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 主力：12MW
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }, // 備戰：2MW（最弱）
      { cardId: 'M02', avail: 93, mwBonus: 0, faults: [] }, // 備戰：3MW
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] }, // 備戰：4MW（湊滿備戰區 3 台）
    ];
    s.players[0].activeTurbineIdx = 0;
    s.players[0].hand = ['M04']; // 5MW，比備戰區最弱的 M01(2MW) 強
    const { state, events } = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, createRng(1));
    expect(state.players[0].turbines).toHaveLength(4); // 主力 1 + 備戰上限 3，不會變 5
    expect(state.players[0].turbines.some((t) => t.cardId === 'M07')).toBe(true); // 主力仍在
    expect(state.players[0].turbines.some((t) => t.cardId === 'M01')).toBe(false); // 備戰區最弱被替換
    expect(state.players[0].turbines.some((t) => t.cardId === 'M04')).toBe(true);
    expect(events.some((e) => e.kind === 'turbine-replaced')).toBe(true);
  });
});

describe('寶可夢式主力/備戰區：故障卡只能打主力', () => {
  it('canPlayCard：對手主力停機時，故障卡不可出（備戰區不算「有目標」）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['F02'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    s.players[1].turbines[s.players[1].activeTurbineIdx as number].shutdown = true;
    expect(canPlayCard(s, 0, 0)).toBe(false);
  });

  it('canPlayCard：對手主力健在（即使備戰區有其他停機機組）時，故障卡可出', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['F02'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    // 備戰區機組停機不影響「還有主力可以打」的判定
    s.players[1].turbines.forEach((t, i) => {
      if (i !== s.players[1].activeTurbineIdx) t.shutdown = true;
    });
    expect(canPlayCard(s, 0, 0)).toBe(true);
  });
});

describe('寶可夢式撤退（retreat）', () => {
  it('撤退成功：主力與被選中的備戰區機組互換，且花費 1 動作', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.currentPlayer = 0;
    s.actionsLeft = 2;
    // 開局艦隊：turbines[0]=OS8（主力）、turbines[1]=OS10（備戰）、turbines[2]=OS12（備戰）
    expect(s.players[0].activeTurbineIdx).toBe(0);
    const { state, events } = applyAction(s, { kind: 'retreat', player: 0, benchIdx: 1 }, createRng(1));
    expect(state.players[0].activeTurbineIdx).toBe(1); // OS10 換上主力
    expect(state.actionsLeft).toBe(2 - RETREAT_ACTION_COST);
    const ev = events.find((e) => e.kind === 'retreat');
    expect(ev).toEqual({ kind: 'retreat', player: 0, fromIdx: 0, toIdx: 1 });
    // 陣列本身沒有被搬動，只是 activeTurbineIdx 換了指向
    expect(state.players[0].turbines[0].cardId).toBe('OS8');
    expect(state.players[0].turbines[1].cardId).toBe('OS10');
  });

  it('canRetreat：動作點不足時不可撤退', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.currentPlayer = 0;
    s.actionsLeft = 0;
    expect(canRetreat(s, 0, 1)).toBe(false);
  });

  it('canRetreat：benchIdx 超出範圍或等於主力索引時不可撤退', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.currentPlayer = 0;
    s.actionsLeft = 2;
    expect(canRetreat(s, 0, 0)).toBe(false); // 0 = 目前主力自己
    expect(canRetreat(s, 0, 99)).toBe(false); // 陣列外索引
  });

  it('canRetreat：非當前玩家回合不可撤退', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.currentPlayer = 1;
    s.actionsLeft = 2;
    expect(canRetreat(s, 0, 1)).toBe(false);
  });

  it('停機中的備戰機組仍可撤退換上主力（設計決定：換血打時間差）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.currentPlayer = 0;
    s.actionsLeft = 2;
    s.players[0].turbines[1].shutdown = true; // OS10（備戰）停機
    expect(canRetreat(s, 0, 1)).toBe(true);
    const { state } = applyAction(s, { kind: 'retreat', player: 0, benchIdx: 1 }, createRng(1));
    expect(state.players[0].activeTurbineIdx).toBe(1);
  });

  it('非法撤退動作不消耗動作點、不改變主力索引（無副作用）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.currentPlayer = 0;
    s.actionsLeft = 0; // 動作點不足
    const { state, events } = applyAction(s, { kind: 'retreat', player: 0, benchIdx: 1 }, createRng(1));
    expect(state.players[0].activeTurbineIdx).toBe(0);
    expect(state.actionsLeft).toBe(0);
    expect(events).toHaveLength(0);
  });
});

describe('寶可夢式主力/備戰區：修復/技師不受主力限制', () => {
  it('技師克制修復（_repairFaults）仍可修復備戰區機組的故障', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = ['T03']; // T03 specialty=mechanical，counters 含 F06
    // 主力 turbines[0] 無故障；備戰區 turbines[1] 帶一個 F06 故障
    s.players[0].turbines[1].faults = [{ cardId: 'F06', roundsLeft: 3, sev: 4, drop: 30 }];
    const { state, events } = ((): { state: GameState; events: import('../src/core/events').GameEvent[] } => {
      const clone = structuredClone(s);
      const ev = _repairFaults(clone, 0, { legacyV3: false });
      return { state: clone, events: ev };
    })();
    expect(state.players[0].turbines[1].faults).toHaveLength(0); // 備戰區機組的故障被修復
    expect(events.some((e) => e.kind === 'fault-repaired' && e.targetIdx === 1)).toBe(true);
  });
});
