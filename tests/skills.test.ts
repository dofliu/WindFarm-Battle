// 輕模式（技師主角）：技師主動出招「快修」的核心測試。
import { describe, it, expect } from 'vitest';
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import { applyAction, canUseSkill, legalActions } from '../src/core/actions';
import type { GameState } from '../src/core/types';

/** 建立一個「玩家 0 有指定技師、且 turbine[0] 帶一個故障」的狀態。 */
function withTechAndFault(techId: string, faultCardId: string, drop: number): GameState {
  const s = structuredClone(createInitialState(createRng(1)));
  s.currentPlayer = 0;
  s.players[0].techs = [techId];
  s.players[0].turbines[0].faults = [{ cardId: faultCardId, roundsLeft: 2, sev: 3, drop }];
  return s;
}

describe('輕模式：技師出招（快修）', () => {
  it('專長相符 → 完全修復，故障移除且 avail 不變', () => {
    const s = withTechAndFault('T02', 'F04', 20); // T02 specialty=blade；F04 faultCategory=blade
    const avail0 = s.players[0].turbines[0].avail;
    const { state, events } = applyAction(
      s,
      { kind: 'use-skill', player: 0, techId: 'T02', skillTag: 'blade-repair', turbineIdx: 0 },
      createRng(1),
    );
    expect(state.players[0].turbines[0].faults).toHaveLength(0);
    expect(state.players[0].turbines[0].avail).toBe(avail0);
    const rep = events.find((e) => e.kind === 'fault-repaired');
    expect(rep?.kind).toBe('fault-repaired');
    if (rep?.kind === 'fault-repaired') expect(rep.quality).toBe('full');
    expect(state.players[0].usedSkillThisRound).toContain('T02');
  });

  it('通用快修專長不符 → 部分修復，avail 永久 -⌊drop×0.5⌋', () => {
    // T01 泛用維修(quick-repair，無 specialty) → 對任何故障皆不符 → 部分修復
    const s = withTechAndFault('T01', 'F04', 20);
    const avail0 = s.players[0].turbines[0].avail;
    const { state, events } = applyAction(
      s,
      { kind: 'use-skill', player: 0, techId: 'T01', skillTag: 'quick-repair', turbineIdx: 0 },
      createRng(1),
    );
    expect(state.players[0].turbines[0].faults).toHaveLength(0);
    expect(state.players[0].turbines[0].avail).toBe(avail0 - 10);
    const rep = events.find((e) => e.kind === 'fault-repaired');
    if (rep?.kind === 'fault-repaired') {
      expect(rep.quality).toBe('partial');
      expect(rep.availLost).toBe(10);
    }
  });

  it('出招用獨立資源池：不消耗打牌動作', () => {
    const s = withTechAndFault('T02', 'F04', 20);
    s.actionsLeft = 2;
    const { state } = applyAction(
      s,
      { kind: 'use-skill', player: 0, techId: 'T02', skillTag: 'blade-repair', turbineIdx: 0 },
      createRng(1),
    );
    expect(state.actionsLeft).toBe(2);
  });

  it('每位技師每回合限出一招', () => {
    const s = withTechAndFault('T02', 'F04', 20);
    // 第二個故障，確認即使還有故障，同一技師本回合也不能再出招
    s.players[0].turbines[1].faults = [{ cardId: 'F04', roundsLeft: 2, sev: 3, drop: 20 }];
    const { state } = applyAction(
      s,
      { kind: 'use-skill', player: 0, techId: 'T02', skillTag: 'blade-repair', turbineIdx: 0 },
      createRng(1),
    );
    expect(canUseSkill(state, 0, 'T02', 'blade-repair', 1)).toBe(false);
  });

  it('無故障的機組不可出招', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.currentPlayer = 0;
    s.players[0].techs = ['T02'];
    expect(canUseSkill(s, 0, 'T02', 'blade-repair', 0)).toBe(false);
  });

  it('legalActions 會列出技師出招動作', () => {
    const s = withTechAndFault('T02', 'F04', 20);
    const acts = legalActions(s, 0);
    expect(acts.some((a) => a.kind === 'use-skill' && a.techId === 'T02' && a.turbineIdx === 0)).toBe(true);
  });
});
