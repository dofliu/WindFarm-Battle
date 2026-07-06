// P2/P3 技師招式：驗證各技師招式的獨特效果 + 分級(多招式/特性)。
import { describe, it, expect } from 'vitest';
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import { applyAction, canUseSkill } from '../src/core/actions';
import { techSkills, techTier, techAbilityTag } from '../src/core/rules-engine';
import type { GameState } from '../src/core/types';

function base(): GameState {
  const s = createInitialState(createRng(1), 'weather-challenge');
  s.currentPlayer = 0;
  s.actionsLeft = 2;
  return s;
}
const F = (drop = 20, roundsLeft = 2) => ({ cardId: 'F04', roundsLeft, sev: 3, drop });

describe('P3 技師分級', () => {
  it('基礎 1 招 / 進化 2 招 / 傳奇 ex 有特性', () => {
    expect(techSkills('T01')).toHaveLength(1); // 基礎
    expect(techTier('T01')).toBe('basic');
    expect(techSkills('T05')).toHaveLength(2); // 進化
    expect(techTier('T05')).toBe('evolved');
    expect(techTier('T07')).toBe('ex'); // 傳奇
    expect(techAbilityTag('T07')).toBe('aura-action'); // 特性
    expect(techAbilityTag('T01')).toBeUndefined();
  });
  it('招式登錄含正確 tag', () => {
    expect(techSkills('T01')[0].tag).toBe('quick-repair');
    expect(techSkills('T08').map((s) => s.tag)).toEqual(['drone-sweep', 'blade-repair']);
  });
});

describe('P2 無目標招式', () => {
  it('T07 緊急調度 → 本回合 +1 動作（不需目標）', () => {
    const s = base();
    s.players[0].techs = ['T07'];
    expect(canUseSkill(s, 0, 'T07', 'dispatch')).toBe(true);
    const { state } = applyAction(s, { kind: 'use-skill', player: 0, techId: 'T07', skillTag: 'dispatch' }, createRng(1));
    expect(state.actionsLeft).toBe(3);
  });

  it('T05 預警掃描 → 己方所有故障剩餘回合 -1（到 0 痊癒）', () => {
    const s = base();
    s.players[0].techs = ['T05'];
    s.players[0].turbines[0].faults = [F(20, 1)];
    s.players[0].turbines[1].faults = [F(20, 2)];
    const { state } = applyAction(s, { kind: 'use-skill', player: 0, techId: 'T05', skillTag: 'scada-scan' }, createRng(1));
    expect(state.players[0].turbines[0].faults).toHaveLength(0);
    expect(state.players[0].turbines[1].faults[0].roundsLeft).toBe(1);
  });

  it('T06 全場診斷 → 每台最重故障 drop -10', () => {
    const s = base();
    s.players[0].techs = ['T06'];
    s.players[0].turbines[0].faults = [F(20)];
    s.players[0].turbines[1].faults = [F(8)];
    const { state } = applyAction(s, { kind: 'use-skill', player: 0, techId: 'T06', skillTag: 'field-diagnosis' }, createRng(1));
    expect(state.players[0].turbines[0].faults[0].drop).toBe(10);
    expect(state.players[0].turbines[1].faults).toHaveLength(0);
  });
});

describe('P2 有目標招式', () => {
  it('T08 無人機巡檢 → 清除目標機組所有故障', () => {
    const s = base();
    s.players[0].techs = ['T08'];
    s.players[0].turbines[0].faults = [F(20), F(10)];
    const { state } = applyAction(s, { kind: 'use-skill', player: 0, techId: 'T08', skillTag: 'drone-sweep', turbineIdx: 0 }, createRng(1));
    expect(state.players[0].turbines[0].faults).toHaveLength(0);
  });

  it('T09 技改增幅 → 目標機組永久 +2 MW（任一機組，不需故障）', () => {
    const s = base();
    s.players[0].techs = ['T09'];
    const bonus0 = s.players[0].turbines[0].mwBonus;
    expect(canUseSkill(s, 0, 'T09', 'rnd-upgrade', 0)).toBe(true);
    const { state } = applyAction(s, { kind: 'use-skill', player: 0, techId: 'T09', skillTag: 'rnd-upgrade', turbineIdx: 0 }, createRng(1));
    expect(state.players[0].turbines[0].mwBonus).toBe(bonus0 + 2);
  });

  it('T09 第二招「快修」也可用（多招式選一）', () => {
    const s = base();
    s.players[0].techs = ['T09'];
    s.players[0].turbines[0].faults = [F(20)];
    expect(canUseSkill(s, 0, 'T09', 'quick-repair', 0)).toBe(true);
    const { state } = applyAction(s, { kind: 'use-skill', player: 0, techId: 'T09', skillTag: 'quick-repair', turbineIdx: 0 }, createRng(1));
    expect(state.players[0].turbines[0].faults).toHaveLength(0);
    // 出過一招後，另一招也不能再用（每技師每回合一招）
    expect(canUseSkill(state, 0, 'T09', 'rnd-upgrade', 1)).toBe(false);
  });

  it('T03 機械大修 → 完全修復 + 該機組 +5 可用率', () => {
    const s = base();
    s.players[0].techs = ['T03'];
    const tu = s.players[0].turbines[0];
    tu.avail = 70;
    tu.originalAvail = 90;
    tu.faults = [F(20)];
    const { state } = applyAction(s, { kind: 'use-skill', player: 0, techId: 'T03', skillTag: 'mech-overhaul', turbineIdx: 0 }, createRng(1));
    expect(state.players[0].turbines[0].faults).toHaveLength(0);
    expect(state.players[0].turbines[0].avail).toBe(75);
  });
});
