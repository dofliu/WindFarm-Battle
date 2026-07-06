// P2 技師專屬招式：驗證各技師招式的獨特效果。
import { describe, it, expect } from 'vitest';
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import { applyAction, canUseSkill } from '../src/core/actions';
import { techSkill } from '../src/core/rules-engine';
import type { GameState } from '../src/core/types';

function base(): GameState {
  const s = createInitialState(createRng(1), 'weather-challenge');
  s.currentPlayer = 0;
  s.actionsLeft = 2;
  return s;
}
const F = (drop = 20, roundsLeft = 2) => ({ cardId: 'F04', roundsLeft, sev: 3, drop });

describe('P2 招式登錄', () => {
  it('各技師對應正確招式與目標種類', () => {
    expect(techSkill('T01')).toEqual({ tag: 'quick-repair', targetKind: 'ownFault' });
    expect(techSkill('T05')).toEqual({ tag: 'scada-scan', targetKind: 'none' });
    expect(techSkill('T07')).toEqual({ tag: 'dispatch', targetKind: 'none' });
    expect(techSkill('T09')).toEqual({ tag: 'rnd-upgrade', targetKind: 'ownTurbine' });
  });
});

describe('P2 無目標招式', () => {
  it('T07 緊急調度 → 本回合 +1 動作（不需目標）', () => {
    const s = base();
    s.players[0].techs = ['T07'];
    expect(canUseSkill(s, 0, 'T07')).toBe(true); // 無目標
    const { state } = applyAction(s, { kind: 'use-skill', player: 0, techId: 'T07' }, createRng(1));
    expect(state.actionsLeft).toBe(3);
  });

  it('T05 預警掃描 → 己方所有故障剩餘回合 -1（到 0 痊癒）', () => {
    const s = base();
    s.players[0].techs = ['T05'];
    s.players[0].turbines[0].faults = [F(20, 1)]; // roundsLeft 1 → 掃描後痊癒
    s.players[0].turbines[1].faults = [F(20, 2)]; // → 剩 1
    const { state } = applyAction(s, { kind: 'use-skill', player: 0, techId: 'T05' }, createRng(1));
    expect(state.players[0].turbines[0].faults).toHaveLength(0);
    expect(state.players[0].turbines[1].faults[0].roundsLeft).toBe(1);
  });

  it('T06 全場診斷 → 每台最重故障 drop -10', () => {
    const s = base();
    s.players[0].techs = ['T06'];
    s.players[0].turbines[0].faults = [F(20)]; // → 10
    s.players[0].turbines[1].faults = [F(8)]; // 8-10 ≤0 → 移除
    const { state } = applyAction(s, { kind: 'use-skill', player: 0, techId: 'T06' }, createRng(1));
    expect(state.players[0].turbines[0].faults[0].drop).toBe(10);
    expect(state.players[0].turbines[1].faults).toHaveLength(0);
  });
});

describe('P2 有目標招式', () => {
  it('T08 無人機巡檢 → 清除目標機組所有故障', () => {
    const s = base();
    s.players[0].techs = ['T08'];
    s.players[0].turbines[0].faults = [F(20), F(10)];
    const { state } = applyAction(s, { kind: 'use-skill', player: 0, techId: 'T08', turbineIdx: 0 }, createRng(1));
    expect(state.players[0].turbines[0].faults).toHaveLength(0);
  });

  it('T09 技改增幅 → 目標機組永久 +2 MW（任一機組，不需故障）', () => {
    const s = base();
    s.players[0].techs = ['T09'];
    const bonus0 = s.players[0].turbines[0].mwBonus;
    expect(canUseSkill(s, 0, 'T09', 0)).toBe(true); // ownTurbine：無故障也可
    const { state } = applyAction(s, { kind: 'use-skill', player: 0, techId: 'T09', turbineIdx: 0 }, createRng(1));
    expect(state.players[0].turbines[0].mwBonus).toBe(bonus0 + 2);
  });

  it('T03 機械大修 → 完全修復 + 該機組 +5 可用率', () => {
    const s = base();
    s.players[0].techs = ['T03'];
    const tu = s.players[0].turbines[0];
    tu.avail = 70;
    tu.originalAvail = 90;
    tu.faults = [F(20)];
    const { state } = applyAction(s, { kind: 'use-skill', player: 0, techId: 'T03', turbineIdx: 0 }, createRng(1));
    expect(state.players[0].turbines[0].faults).toHaveLength(0);
    expect(state.players[0].turbines[0].avail).toBe(75); // 70 + 5
  });
});
