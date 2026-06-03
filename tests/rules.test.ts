import { describe, it, expect } from 'vitest';
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import { scoreRound, beginTurn, applySalt, runGame, determineWinner } from '../src/core/rules-engine';
import type { GameState } from '../src/core/types';

function withWind(s: GameState, coeff: number): GameState {
  return { ...s, wind: { roll: 4, speed: 10, coeff, label: '測試' } };
}

describe('S2.1 結算公式（對齊 v3）', () => {
  it('Route B 開局艦隊(OS8+OS10+OS12) × 額定(×1.0) = round(26.32) = 26', () => {
    // OS8: 8×1.0×0.90=7.2  OS10: 10×1.0×0.88=8.8  OS12: 12×1.0×0.86=10.32  Total: 26.32 → 26
    const s = createInitialState(createRng(1));
    const r = scoreRound(withWind(s, 1.0));
    expect(r.state.players[0].score).toBe(26);
    expect(r.state.players[1].score).toBe(26);
  });

  it('故障扣可用率會降低發電', () => {
    const s2 = structuredClone(createInitialState(createRng(1)));
    // 對 turbines[0]（OS8, 8MW, avail=90）施加 drop=30 → effectiveAvail=60
    // OS8: 8×1.0×0.60=4.8 → 5; OS10: 8.8 → 9; OS12: 10.32 → 10 → 合計 24
    s2.players[0].turbines[0].faults.push({ cardId: 'F06', roundsLeft: 3, sev: 4, drop: 30 });
    expect(scoreRound(withWind(s2, 1.0)).state.players[0].score).toBe(24);
  });

  it('mwhBoost ×1.5（M07 12MW,88% + S3.1 aura-mw 自帶 +1）', () => {
    const s2 = structuredClone(createInitialState(createRng(1)));
    s2.players[0].mwhBoostActive = true;
    s2.players[0].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }];
    // S3.1：M07 aura-mw 對自家所有 turbine（含自身）+1 → (12+1)×1.0×0.88 = 11.44 ×1.5 = 17.16 → 17
    expect(scoreRound(withWind(s2, 1.0)).state.players[0].score).toBe(17);
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

describe('每回合自動補牌到 refillHandTo 張', () => {
  it('DEFAULT_CONFIG（refillHandTo 未設定）→ 不觸發補牌', () => {
    // DEFAULT_CONFIG 無 refillHandTo，手牌只靠 drawsPerRound=1 增長
    const initial = createInitialState(createRng(1));
    // 清空手牌，模擬手牌耗盡
    const s = structuredClone(initial);
    s.players[0].hand = [];
    s.players[1].hand = [];
    const r = runGame({ ...s, maxRounds: 1 } as typeof s, createRng(1));
    // DEFAULT_CONFIG drawsPerRound=1，每回合每人抽 1 張；無 refillHandTo
    // 跑完 1 回合後手牌 = 1 張（drawsPerRound 抽的那張）
    expect(r.state.players[0].hand.length).toBeLessThanOrEqual(1);
  });

  it('refillHandTo=4 → 回合開始時手牌補到至少 4 張（noopTurn 不出牌，手牌維持 4）', () => {
    const config = { legacyV3: false, initialDraws: 0, drawsPerRound: 0, refillHandTo: 4 };
    const initial = createInitialState(createRng(1));
    // 清空手牌，模擬手牌耗盡
    const s = structuredClone(initial);
    s.players[0].hand = [];
    s.players[1].hand = [];
    const r = runGame({ ...s, maxRounds: 1 } as typeof s, createRng(1), undefined, config);
    // noopTurn 不出牌，補牌後手牌應維持 4 張（_drawCard 不發 card-drawn 事件，驗證手牌長度）
    expect(r.state.players[0].hand.length).toBe(4);
    expect(r.state.players[1].hand.length).toBe(4);
  });

  it('手牌已有 5 張（超過 refillHandTo=4）→ 不補牌（手牌維持 5 張）', () => {
    const config = { legacyV3: false, initialDraws: 0, drawsPerRound: 0, refillHandTo: 4 };
    const initial = createInitialState(createRng(1));
    const s = structuredClone(initial);
    // 預設手牌 5 張（超過 refillHandTo=4）
    s.players[0].hand = ['M01', 'M03', 'T01', 'F02', 'FN01'];
    s.players[1].hand = ['M01', 'M03', 'T01', 'F02', 'FN01'];
    const r = runGame({ ...s, maxRounds: 1 } as typeof s, createRng(1), undefined, config);
    // 手牌已達 5 張，不應再補（noopTurn 不出牌，手牌應維持 5 張）
    expect(r.state.players[0].hand.length).toBe(5);
    expect(r.state.players[1].hand.length).toBe(5);
  });

  it('refillHandTo=4 + 手牌 2 張 → 補 2 張到 4 張（noopTurn 不出牌，手牌維持 4）', () => {
    const config = { legacyV3: false, initialDraws: 0, drawsPerRound: 0, refillHandTo: 4 };
    const initial = createInitialState(createRng(1));
    const s = structuredClone(initial);
    // 預設手牌 2 張
    s.players[0].hand = ['M01', 'M03'];
    s.players[1].hand = ['M01', 'M03'];
    const r = runGame({ ...s, maxRounds: 1 } as typeof s, createRng(1), undefined, config);
    // noopTurn 不出牌，補牌後手牌應維持 4 張（_drawCard 不發 card-drawn 事件，驗證手牌長度）
    expect(r.state.players[0].hand.length).toBe(4);
    expect(r.state.players[1].hand.length).toBe(4);
  });

  it('runGame 使用 refillHandTo 仍可重現（相同 seed）', () => {
    const config = { legacyV3: false, initialDraws: 0, drawsPerRound: 1, refillHandTo: 4 };
    const a = runGame(createInitialState(createRng(77)), createRng(77), undefined, config);
    const b = runGame(createInitialState(createRng(77)), createRng(77), undefined, config);
    expect(a.state.players[0].score).toBe(b.state.players[0].score);
    expect(a.state.players[1].score).toBe(b.state.players[1].score);
  });
});
