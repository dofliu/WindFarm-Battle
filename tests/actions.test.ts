// v2 動作系統：出牌限制 / 技師部署 / 工具裝備 / 合約 / 道具。
// 涵蓋修復項：techPlayedThisTurn 每回合 1 張技師、applyAction 回傳新 state。
import { describe, it, expect } from 'vitest';
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import { startRound, _beginTurn } from '../src/core/rules-engine';
import { applyAction, canPlayCard } from '../src/core/actions';
import type { GameState, GameEvent } from '../src/core/types';

function setup(seed = 7): { s: GameState; rng: ReturnType<typeof createRng> } {
  const rng = createRng(seed);
  const s = createInitialState(rng, 'weather-challenge');
  startRound(s, rng);
  return { s, rng };
}

/** 把指定卡塞進手牌並回傳其 index */
function addToHand(s: GameState, player: 0 | 1, cardId: string): number {
  s.players[player].hand.push(cardId);
  return s.players[player].hand.length - 1;
}

describe('applyAction 純函式性', () => {
  it('回傳新 state，不改動傳入的 state（AI 迴圈曾因丟棄回傳值而癱瘓）', () => {
    const { s, rng } = setup();
    const idx = addToHand(s, 0, 'T02');
    const before = s.players[0].field.active;
    const result = applyAction(s, { kind: 'play-card', player: 0, handIdx: idx }, rng);
    expect(s.players[0].field.active).toBe(before);        // 原 state 不變
    expect(result.state.players[0].field.active?.cardId).toBe('T02'); // 新 state 已部署
  });
});

describe('技師部署', () => {
  it('第一張技師 → 主力；之後 → 備戰區', () => {
    const { s, rng } = setup();
    const i1 = addToHand(s, 0, 'T02');
    let r = applyAction(s, { kind: 'play-card', player: 0, handIdx: i1 }, rng);
    expect(r.state.players[0].field.active?.cardId).toBe('T02');
    expect(r.events.some((e: GameEvent) => e.kind === 'tech-deployed' && e.position === 'active')).toBe(true);

    // 換回合重置旗標後再出第二張
    _beginTurn(r.state, 0, []);
    const i2 = addToHand(r.state, 0, 'T03');
    r = applyAction(r.state, { kind: 'play-card', player: 0, handIdx: i2 }, rng);
    expect(r.state.players[0].field.bench.map((t) => t.cardId)).toContain('T03');
  });

  it('每回合限出 1 張技師（techPlayedThisTurn）', () => {
    const { s, rng } = setup();
    const i1 = addToHand(s, 0, 'T02');
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: i1 }, rng);
    const i2 = addToHand(r.state, 0, 'T03');
    expect(canPlayCard(r.state, 0, i2)).toBe(false); // 同回合第二張技師不可出
    _beginTurn(r.state, 0, []);
    expect(canPlayCard(r.state, 0, i2)).toBe(true);  // 新回合重置後可出
  });

  it('場上至多 4 名技師（主力 1 + 備戰 3）', () => {
    const { s, rng } = setup();
    let cur = s;
    for (const id of ['T01', 'T02', 'T03', 'T04']) {
      _beginTurn(cur, 0, []);
      const i = addToHand(cur, 0, id);
      cur = applyAction(cur, { kind: 'play-card', player: 0, handIdx: i }, rng).state;
    }
    _beginTurn(cur, 0, []);
    const i5 = addToHand(cur, 0, 'T05');
    expect(canPlayCard(cur, 0, i5)).toBe(false); // 第 5 名進不來
  });
});

describe('工具裝備', () => {
  it('裝到主力技師並設 toolPlayedThisTurn；同技師不可疊第二把', () => {
    const { s, rng } = setup();
    const cur = applyAction(s, { kind: 'play-card', player: 0, handIdx: addToHand(s, 0, 'T02') }, rng).state;
    _beginTurn(cur, 0, []);
    const it = addToHand(cur, 0, 'TL04');
    const r = applyAction(cur, { kind: 'play-card', player: 0, handIdx: it, targetTechIdx: 0 }, rng);
    expect(r.state.players[0].field.active?.attachedToolId).toBe('TL04');
    expect(r.events.some((e: GameEvent) => e.kind === 'tool-attached')).toBe(true);
    // 已有工具 → 不可再裝
    const it2 = addToHand(r.state, 0, 'TL01');
    _beginTurn(r.state, 0, []);
    expect(canPlayCard(r.state, 0, it2, undefined, 0)).toBe(false);
  });

  it('無技師在場 → 工具不可出', () => {
    const { s } = setup();
    const it = addToHand(s, 0, 'TL01');
    expect(canPlayCard(s, 0, it, undefined, 0)).toBe(false);
  });
});

describe('道具卡', () => {
  it('IT01 快修：完全修復最嚴重故障、無永久損失', () => {
    const { s, rng } = setup();
    const tu = s.players[0].windFarm[0];
    tu.avail = 60;
    tu.faults = [
      { cardId: 'F01', faultCategory: 'sensor', roundsLeft: 2, sev: 1, drop: 5 },
      { cardId: 'F06', faultCategory: 'mechanical', roundsLeft: 3, sev: 4, drop: 20 },
    ];
    const i = addToHand(s, 0, 'IT01');
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: i, targetTurbineIdx: 0 }, rng);
    const t2 = r.state.players[0].windFarm[0];
    expect(t2.faults.map((f) => f.cardId)).toEqual(['F01']); // 最嚴重的 F06 被修
    expect(t2.avail).toBe(80); // 60 + 20 回復
    expect(r.events.some((e: GameEvent) => e.kind === 'fault-repaired' && e.quality === 'full')).toBe(true);
  });

  it('IT09 一場一次（oncePerGame）', () => {
    const { s, rng } = setup();
    const i = addToHand(s, 0, 'IT09');
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: i }, rng);
    expect(r.state.players[0].usedOncePerGame).toContain('IT09');
    const i2 = addToHand(r.state, 0, 'IT09');
    expect(canPlayCard(r.state, 0, i2)).toBe(false);
  });
});

describe('合約卡', () => {
  it('打出後進 activeContracts，且每回合限 1 張', () => {
    const { s, rng } = setup();
    const i = addToHand(s, 0, 'CT01');
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: i }, rng);
    expect(r.state.players[0].activeContracts.map((c) => c.cardId)).toContain('CT01');
    const i2 = addToHand(r.state, 0, 'CT02');
    expect(canPlayCard(r.state, 0, i2)).toBe(false);
  });
});

describe('撤退與晉升', () => {
  it('retreat 交換主力與備戰；promote 讓備戰上主力（主力空缺時）', () => {
    const { s, rng } = setup();
    let cur = applyAction(s, { kind: 'play-card', player: 0, handIdx: addToHand(s, 0, 'T02') }, rng).state;
    _beginTurn(cur, 0, []);
    cur = applyAction(cur, { kind: 'play-card', player: 0, handIdx: addToHand(cur, 0, 'T03') }, rng).state;
    // 撤退：T02 ↔ T03
    _beginTurn(cur, 0, []);
    const r = applyAction(cur, { kind: 'retreat', player: 0, benchIdx: 0 }, rng);
    expect(r.state.players[0].field.active?.cardId).toBe('T03');
    expect(r.state.players[0].field.bench[0]?.cardId).toBe('T02');
    // 晉升：清空主力後把備戰第 0 位晉升
    const s2 = r.state;
    s2.players[0].field.active = null;
    const r2 = applyAction(s2, { kind: 'promote-tech', player: 0, benchIdx: 0 }, rng);
    expect(r2.state.players[0].field.active?.cardId).toBe('T02');
    expect(r2.state.players[0].field.bench).toHaveLength(0);
  });
});
