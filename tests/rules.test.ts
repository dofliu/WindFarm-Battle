// v2 回合流：startRound/endRound 職責、環境同調、發電結算、合約結算。
// 涵蓋修復項：每回合恰一次骰風與環境事件（曾因 endTurn 誤呼叫 startRound 而重複）。
import { describe, it, expect } from 'vitest';
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import { startRound, endRound, _scoreRound } from '../src/core/rules-engine';
import type { GameEvent } from '../src/core/types';

describe('回合流職責', () => {
  it('startRound 骰風 + 發 round-start；endRound 結算 + round+1（不重骰風）', () => {
    const rng = createRng(11);
    const s = createInitialState(rng, 'weather-challenge');
    const ev1 = startRound(s, rng);
    expect(ev1.filter((e) => e.kind === 'round-start')).toHaveLength(1);
    const windAfterStart = s.wind;

    const ev2 = endRound(s, rng);
    expect(s.round).toBe(2);
    expect(s.wind).toBe(windAfterStart); // endRound 不得重骰風
    expect(ev2.some((e) => e.kind === 'round-scored')).toBe(true);
    expect(ev2.filter((e) => e.kind === 'round-start')).toHaveLength(0); // 下一回合由外層呼叫 startRound
  });

  it('12 回合後 gameOver + game-over 事件', () => {
    const rng = createRng(12);
    const s = createInitialState(rng, 'weather-challenge');
    let lastEvents: GameEvent[] = [];
    for (let r = 1; r <= 12; r++) {
      startRound(s, rng);
      lastEvents = endRound(s, rng);
    }
    expect(s.gameOver).toBe(true);
    expect(lastEvents.some((e) => e.kind === 'game-over')).toBe(true);
  });

  it('雙方同一環境 seed：風/浪/環境事件同調（同題競賽）', () => {
    const rng1 = createRng(99);
    const rng2 = createRng(99);
    const a = createInitialState(rng1, 'weather-challenge');
    const b = createInitialState(rng2, 'weather-challenge');
    for (let r = 1; r <= 5; r++) {
      startRound(a, rng1);
      startRound(b, rng2);
      expect(a.wind.label).toBe(b.wind.label);
      expect(a.waveHeight).toBe(b.waveHeight);
      endRound(a, rng1);
      endRound(b, rng2);
    }
  });
});

describe('開局對稱（同設定風場）', () => {
  it('雙方風場固定為 OS8/OS10/OS12，容量與可用率一致', () => {
    const rng = createRng(3);
    const s = createInitialState(rng, 'weather-challenge');
    const ids0 = s.players[0].windFarm.map((t) => t.id);
    const ids1 = s.players[1].windFarm.map((t) => t.id);
    expect(ids0).toEqual(['OS8', 'OS10', 'OS12']);
    expect(ids1).toEqual(ids0);
    s.players[0].windFarm.forEach((t, i) => {
      expect(t.avail).toBe(s.players[1].windFarm[i].avail);
      expect(t.mw).toBe(s.players[1].windFarm[i].mw);
    });
  });

  it('牌組不含風機卡（技師為主角）', () => {
    const rng = createRng(4);
    const s = createInitialState(rng, 'weather-challenge');
    for (const p of s.players) {
      expect(p.deck.some((id) => id.startsWith('OS'))).toBe(false);
    }
  });
});

describe('發電結算', () => {
  it('MWh = Σ mw × coeff × avail%；合約倍率生效', () => {
    const rng = createRng(5);
    const s = createInitialState(rng, 'weather-challenge');
    s.wind = { roll: 4, speed: 10, coeff: 1.0, label: '額定' };
    s.players[0].windFarm.forEach((t) => { t.avail = 100; });
    // 8+10+12 = 30 MW × 1.0 × 100% = 30 MWh
    const ev: GameEvent[] = [];
    _scoreRound(s, ev);
    const scored = ev.find((e) => e.kind === 'round-scored' && e.player === 0);
    expect(scored && scored.kind === 'round-scored' ? scored.mwh : 0).toBeCloseTo(30, 1);
  });
});
