// R4 技師隊伍(上限3) + 組合招（依專長多樣性）。
import { describe, it, expect } from 'vitest';
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import { applyAction, canPlayCard } from '../src/core/actions';
import { comboTier } from '../src/core/rules-engine';

// 技師專長：T02=blade, T03=mechanical, T04=electrical, T05=sensor, T06=hydraulic, T08=blade

describe('R4 組合等級', () => {
  it('相異專長數 → 0/1/2', () => {
    const s = createInitialState(createRng(1), 'weather-challenge');
    s.players[0].techs = ['T03'];
    expect(comboTier(s.players[0])).toBe(0);
    s.players[0].techs = ['T03', 'T04'];
    expect(comboTier(s.players[0])).toBe(1); // mechanical + electrical
    s.players[0].techs = ['T03', 'T04', 'T05'];
    expect(comboTier(s.players[0])).toBe(2); // + sensor
    s.players[0].techs = ['T02', 'T08']; // 皆 blade → 不算多樣
    expect(comboTier(s.players[0])).toBe(0);
  });
});

describe('R4 組合影響快修', () => {
  it('團隊互補(tier1)：通用快修即使專長不符也完全修復，無永久損耗', () => {
    const s = createInitialState(createRng(1), 'weather-challenge');
    s.currentPlayer = 0;
    // T01 通用快修(無 specialty) + T03機械 + T04電氣 → 2 種專長 = tier1
    s.players[0].techs = ['T01', 'T03', 'T04'];
    const avail0 = s.players[0].turbines[0].avail;
    s.players[0].turbines[0].faults = [{ cardId: 'F04', roundsLeft: 2, sev: 3, drop: 20 }]; // blade，對 T01 不符
    const { state } = applyAction(s, { kind: 'use-skill', player: 0, techId: 'T01', turbineIdx: 0 }, createRng(1));
    expect(state.players[0].turbines[0].faults).toHaveLength(0);
    expect(state.players[0].turbines[0].avail).toBe(avail0); // 組合使不符也完全修復、無損耗
  });

  it('全能小組(tier2)：修復後額外回復可用率(不超過初始值)', () => {
    const s = createInitialState(createRng(1), 'weather-challenge');
    s.currentPlayer = 0;
    s.players[0].techs = ['T03', 'T04', 'T05']; // mechanical+electrical+sensor → tier2
    const tu = s.players[0].turbines[0];
    tu.avail = 70;
    tu.originalAvail = 90;
    tu.faults = [{ cardId: 'F04', roundsLeft: 2, sev: 3, drop: 20 }];
    // 用 T04 電控復歸(完全修復、無額外 +avail)，只看組合回復：70 +10 = 80
    const { state } = applyAction(s, { kind: 'use-skill', player: 0, techId: 'T04', turbineIdx: 0 }, createRng(1));
    expect(state.players[0].turbines[0].avail).toBe(80); // 70 + 10，capped 90
  });
});

describe('R4 技師上限 3', () => {
  it('場上已 3 位技師 → 不可再招募；2 位時可招募', () => {
    const s = createInitialState(createRng(1), 'weather-challenge');
    s.currentPlayer = 0;
    s.actionsLeft = 4;
    s.players[0].hand = ['T05'];
    s.players[0].techs = ['T02', 'T03', 'T04'];
    expect(canPlayCard(s, 0, 0)).toBe(false);
    s.players[0].techs = ['T02', 'T03'];
    expect(canPlayCard(s, 0, 0)).toBe(true);
  });
});
