// R2 同題競賽模式（weather-challenge）：共享環境事件 + 移除 PvP + 風場固定。
import { describe, it, expect } from 'vitest';
import type { Rng } from '../src/core/rng';
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import { runGame, _applyEnvironmentIncident, _spawnRoundResources, _scoreRound, GRID_PRIORITY_MWH } from '../src/core/rules-engine';
import { canPlayCard, applyAction, canGrabResource } from '../src/core/actions';
import { aiTakeTurn } from '../src/core/ai';
import { CARDS } from '../src/core/cards';

/** 把 0.x 序列灌進 Rng。 */
function fixedRng(values: number[]): Rng {
  let i = 0;
  const next = (): number => values[i++] ?? 0;
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

describe('R2 同題：抽牌池', () => {
  it('同題模式牌組不含故障與新風機（風場固定、故障=環境事件）', () => {
    const s = createInitialState(createRng(1), 'weather-challenge');
    for (const id of s.players[0].deck) {
      expect(CARDS[id].type).not.toBe('fault');
      expect(CARDS[id].type).not.toBe('turbine');
    }
    expect(s.players[0].deck.length).toBeGreaterThan(0);
  });

  it('versus 模式牌組仍含故障（回歸不受影響）', () => {
    const s = createInitialState(createRng(1), 'versus');
    expect(s.players[0].deck.some((id) => CARDS[id].type === 'fault')).toBe(true);
  });
});

describe('R2 同題：共享環境事件', () => {
  it('同一事件同時、同槽砸向雙方（drop 相同）', () => {
    const s = createInitialState(createRng(1), 'weather-challenge');
    // 強制發生：prob 檢查 0.1(<0.6) → faultId index 0 → slot 0
    const events = _applyEnvironmentIncident(s, fixedRng([0.1, 0, 0]));
    const incident = events.find((e) => e.kind === 'incident');
    expect(incident?.kind).toBe('incident');
    const f0 = s.players[0].turbines[0].faults;
    const f1 = s.players[1].turbines[0].faults;
    expect(f0).toHaveLength(1);
    expect(f1).toHaveLength(1);
    expect(f0[0].cardId).toBe(f1[0].cardId); // 同一故障
    expect(f0[0].drop).toBe(f1[0].drop); // 同樣 drop
  });

  it('機率未命中 → 不發生事件', () => {
    const s = createInitialState(createRng(1), 'weather-challenge');
    const events = _applyEnvironmentIncident(s, fixedRng([0.9])); // 0.9 >= 0.6 → 不發生
    expect(events).toHaveLength(0);
    expect(s.players[0].turbines[0].faults).toHaveLength(0);
  });

  it('versus 模式不觸發環境事件（零 RNG 消耗）', () => {
    const s = createInitialState(createRng(1), 'versus');
    const events = _applyEnvironmentIncident(s, fixedRng([0.1, 0, 0]));
    expect(events).toHaveLength(0);
  });
});

describe('R2 同題：移除 PvP', () => {
  it('同題模式不可主動施加故障', () => {
    const s = createInitialState(createRng(1), 'weather-challenge');
    s.players[0].hand = ['F04'];
    s.actionsLeft = 4;
    expect(canPlayCard(s, 0, 0)).toBe(false);
  });
});

describe('R3 共享資源', () => {
  it('同題模式回合開始生成 2 項資源；versus 不生成', () => {
    const coop = createInitialState(createRng(1), 'weather-challenge');
    _spawnRoundResources(coop, fixedRng([0, 0.5, 0.9]));
    expect(coop.roundResources).toHaveLength(2);
    const versus = createInitialState(createRng(1), 'versus');
    _spawnRoundResources(versus, fixedRng([0, 0.5]));
    expect(versus.roundResources).toHaveLength(0);
  });

  it('搶「備品」→ 完全修復一個故障、花 1 動作、標記歸屬', () => {
    const s = createInitialState(createRng(1), 'weather-challenge');
    s.currentPlayer = 0;
    s.actionsLeft = 2;
    s.roundResources = [{ id: 'x', type: 'spare-part' }];
    s.players[0].turbines[0].faults = [{ cardId: 'F04', roundsLeft: 2, sev: 3, drop: 20 }];
    const { state } = applyAction(s, { kind: 'grab-resource', player: 0, resourceId: 'x', turbineIdx: 0 }, createRng(1));
    expect(state.players[0].turbines[0].faults).toHaveLength(0);
    expect(state.actionsLeft).toBe(1);
    expect(state.roundResources[0].claimedBy).toBe(0);
  });

  it('搶「併網優先」→ 本回合發電 +GRID_PRIORITY_MWH（計入結算）', () => {
    const s = createInitialState(createRng(1), 'weather-challenge');
    s.currentPlayer = 0;
    s.actionsLeft = 2;
    s.roundResources = [{ id: 'g', type: 'grid-priority' }];
    const { state } = applyAction(s, { kind: 'grab-resource', player: 0, resourceId: 'g' }, createRng(1));
    expect(state.players[0].gridBonusThisRound).toBe(GRID_PRIORITY_MWH);
    const before = state.players[0].score;
    _scoreRound(state);
    expect(state.players[0].score).toBeGreaterThanOrEqual(before + GRID_PRIORITY_MWH);
  });

  it('已被搶的資源不可再搶', () => {
    const s = createInitialState(createRng(1), 'weather-challenge');
    s.currentPlayer = 0;
    s.actionsLeft = 2;
    s.roundResources = [{ id: 'g', type: 'grid-priority', claimedBy: 1 }];
    expect(canGrabResource(s, 0, 'g')).toBe(false);
  });
});

describe('R2 同題：完整對局', () => {
  it('12 回合跑完、產生 incident 事件、無崩潰', () => {
    const init = createInitialState(createRng(7), 'weather-challenge');
    const { state, events } = runGame(init, createRng(7), aiTakeTurn('hard'));
    expect(state.gameOver).toBe(true);
    expect(events.some((e) => e.kind === 'incident')).toBe(true);
  });
});
