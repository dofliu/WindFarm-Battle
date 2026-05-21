import { describe, it, expect } from 'vitest';
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import { scoreRound, beginTurn, applySalt, runGame, determineWinner } from '../src/core/rules-engine';
import type { GameState } from '../src/core/types';

function withWind(s: GameState, coeff: number): GameState {
  return { ...s, wind: { roll: 4, speed: 10, coeff, label: '測試' } };
}

describe('S2.1 結算公式（對齊 v3）', () => {
  it('M01(2MW,95%) × 額定(×1.0) = round(1.9) = 2', () => {
    const s = createInitialState(createRng(1)); // 各 1 台 M01
    const r = scoreRound(withWind(s, 1.0));
    expect(r.state.players[0].score).toBe(2);
    expect(r.state.players[1].score).toBe(2);
  });

  it('故障扣可用率會降低發電', () => {
    const s2 = structuredClone(createInitialState(createRng(1)));
    s2.players[0].turbines[0].faults.push({ cardId: 'F06', roundsLeft: 3, sev: 4, drop: 30 });
    // avail 95-30=65 → 2*1.0*0.65=1.3 → round 1
    expect(scoreRound(withWind(s2, 1.0)).state.players[0].score).toBe(1);
  });

  it('mwhBoost ×1.5（M07 12MW,88%）', () => {
    const s2 = structuredClone(createInitialState(createRng(1)));
    s2.players[0].mwhBoostActive = true;
    s2.players[0].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }];
    // 12*1.0*0.88=10.56 ×1.5=15.84 → 16
    expect(scoreRound(withWind(s2, 1.0)).state.players[0].score).toBe(16);
  });

  it('無風(×0)發電為 0', () => {
    const s = createInitialState(createRng(1));
    expect(scoreRound(withWind(s, 0)).state.players[0].score).toBe(0);
  });
});

describe('S2.1 動作經濟（對齊 v3）', () => {
  it('基礎 2 動作', () => {
    expect(beginTurn(createInitialState(createRng(1)), 0).actionsLeft).toBe(2);
  });
  it('T07（aura-action）+1 動作', () => {
    const s2 = structuredClone(createInitialState(createRng(1)));
    s2.players[0].techs = ['T07'];
    expect(beginTurn(s2, 0).actionsLeft).toBe(3);
  });
  it('FN04 預支動作累加，回合開始清零', () => {
    const s2 = structuredClone(createInitialState(createRng(1)));
    s2.players[0].pendingExtraActions = 2;
    const after = beginTurn(s2, 0);
    expect(after.actionsLeft).toBe(4); // 2 + 0 + 2
    expect(after.players[0].pendingExtraActions).toBe(0);
  });
});

describe('S2.1 鹽霧腐蝕（每4回合 -2%，對齊 v3）', () => {
  it('第4回合 M04 90→88', () => {
    const s2 = structuredClone(createInitialState(createRng(1)));
    s2.round = 4;
    s2.players[0].turbines = [{ cardId: 'M04', avail: 90, mwBonus: 0, faults: [] }];
    expect(applySalt(s2).players[0].turbines[0].avail).toBe(88);
  });
  it('第3回合不腐蝕', () => {
    const s2 = structuredClone(createInitialState(createRng(1)));
    s2.round = 3;
    s2.players[0].turbines = [{ cardId: 'M04', avail: 90, mwBonus: 0, faults: [] }];
    expect(applySalt(s2).players[0].turbines[0].avail).toBe(90);
  });
});

describe('S2.1 12 回合流程與勝負', () => {
  it('跑滿 12 回合、gameOver、雙方同板 M01 → 平手', () => {
    const { state, events } = runGame(createInitialState(createRng(42)), createRng(42));
    expect(state.round).toBe(12);
    expect(state.gameOver).toBe(true);
    expect(state.players[0].score).toBe(state.players[1].score);
    expect(determineWinner(state)).toBe(-1);
    expect(events.filter((e) => e.kind === 'round-start')).toHaveLength(12);
    expect(events.some((e) => e.kind === 'game-over')).toBe(true);
  });

  it('runGame 不更動傳入的初始狀態（純函式）', () => {
    const initial = createInitialState(createRng(7));
    runGame(initial, createRng(7));
    expect(initial.round).toBe(1);
    expect(initial.gameOver).toBe(false);
  });

  it('相同 seed → 相同最終分數（可重現）', () => {
    const a = runGame(createInitialState(createRng(99)), createRng(99));
    const b = runGame(createInitialState(createRng(99)), createRng(99));
    expect(a.state.players[0].score).toBe(b.state.players[0].score);
    expect(a.state.players[1].score).toBe(b.state.players[1].score);
  });
});
