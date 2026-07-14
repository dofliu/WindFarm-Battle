// v2.1 戰鬥深化：補血道具 / 疲勞護盾 / 附著工具 / 技能 special / IT04 次效。
import { describe, it, expect } from 'vitest';
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import { startRound } from '../src/core/rules-engine';
import { applyAction, canPlayCard, legalActions } from '../src/core/actions';
import { tickStamina } from '../src/core/stamina';
import { applySkill } from '../src/core/skills';
import { evaluateItemPlay } from '../src/core/ai/evaluator';
import { getStrategy } from '../src/core/ai/strategy';
import type { GameState, DeployedTech, GameEvent } from '../src/core/types';

function setup(seed = 9): { s: GameState; rng: ReturnType<typeof createRng> } {
  const rng = createRng(seed);
  const s = createInitialState(rng, 'weather-challenge');
  startRound(s, rng);
  s.waveHeight = 1; // 平靜海象，技能不受限
  return { s, rng };
}

function mkTech(cardId: string, stamina = 10, maxStamina = 10): DeployedTech {
  return { cardId, level: 1, stamina, maxStamina, roundsOnField: 0, attachedToolId: null, usedSkillThisTurn: false };
}

function addToHand(s: GameState, cardId: string): number {
  s.players[0].hand.push(cardId);
  return s.players[0].hand.length - 1;
}

describe('補血道具（寶可夢傷藥式續航）', () => {
  it('IT10 能量飲料：指定技師 +5，上限 maxStamina', () => {
    const { s, rng } = setup();
    s.players[0].field.active = mkTech('T02', 3);
    const i = addToHand(s, 'IT10');
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: i, targetTechIdx: 0 }, rng);
    expect(r.state.players[0].field.active!.stamina).toBe(8);
    expect(r.events.some((e: GameEvent) => e.kind === 'stamina-restored' && e.amount === 5)).toBe(true);
    // 滿血不溢出
    const j = addToHand(r.state, 'IT10');
    r.state.players[0].field.active!.stamina = 9;
    const r2 = applyAction(r.state, { kind: 'play-card', player: 0, handIdx: j, targetTechIdx: 0 }, rng);
    expect(r2.state.players[0].field.active!.stamina).toBe(10);
  });

  it('IT11 輪休排班可指定備戰技師（targetTechIdx=1）', () => {
    const { s, rng } = setup();
    s.players[0].field.active = mkTech('T02', 9);
    s.players[0].field.bench = [mkTech('T03', 2)];
    const i = addToHand(s, 'IT11');
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: i, targetTechIdx: 1 }, rng);
    expect(r.state.players[0].field.bench[0].stamina).toBe(10); // 2+8
  });

  it('IT12 團隊補給站：全隊 +3；無技師在場不可出', () => {
    const { s, rng } = setup();
    s.players[0].field.active = mkTech('T02', 4);
    s.players[0].field.bench = [mkTech('T03', 6), mkTech('T04', 10)];
    const i = addToHand(s, 'IT12');
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: i }, rng);
    expect(r.state.players[0].field.active!.stamina).toBe(7);
    expect(r.state.players[0].field.bench[0].stamina).toBe(9);
    expect(r.state.players[0].field.bench[1].stamina).toBe(10); // 滿血不變

    const { s: s2 } = setup(11);
    const j = addToHand(s2, 'IT12');
    expect(canPlayCard(s2, 0, j)).toBe(false); // 場上無技師
  });

  it('補血卡需要技師目標：無 targetTechIdx 時 canPlayCard=false', () => {
    const { s } = setup();
    s.players[0].field.active = mkTech('T02', 5);
    const i = addToHand(s, 'IT10');
    expect(canPlayCard(s, 0, i)).toBe(false);
    expect(canPlayCard(s, 0, i, undefined, 0)).toBe(true);
  });
});

describe('IT13 安全講習（疲勞護盾）', () => {
  it('護盾回合不消耗疲勞，之後恢復消耗', () => {
    const { s, rng } = setup();
    s.players[0].field.active = mkTech('T02', 10);
    const i = addToHand(s, 'IT13');
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: i, targetTechIdx: 0 }, rng);
    const p = r.state.players[0];
    expect(p.field.active!.staminaShieldRounds).toBe(1);

    const ev: GameEvent[] = [];
    tickStamina(p, 0, ev);
    expect(p.field.active!.stamina).toBe(10); // 護盾吸收，不掉血
    tickStamina(p, 0, ev);
    expect(p.field.active!.stamina).toBe(7); // 護盾用完，正常 -3
  });
});

describe('附著工具（道具附上技師身上）', () => {
  it('TL09 外骨骼支架：上限 +4 且立即回復 4', () => {
    const { s, rng } = setup();
    s.players[0].field.active = mkTech('T02', 6);
    const i = addToHand(s, 'TL09');
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: i, targetTechIdx: 0 }, rng);
    const tech = r.state.players[0].field.active!;
    expect(tech.maxStamina).toBe(14);
    expect(tech.stamina).toBe(10);
    expect(tech.attachedToolId).toBe('TL09');
  });

  it('TL10 智慧監測手環：每回合結算自動 +1（力竭者不救）', () => {
    const { s } = setup();
    const p = s.players[0];
    p.field.active = mkTech('T02', 8);
    p.field.active.attachedToolId = 'TL10';
    const ev: GameEvent[] = [];
    tickStamina(p, 0, ev);
    // 一般檢修 -3 後手環 +1 → 8-3+1 = 6
    expect(p.field.active!.stamina).toBe(6);
    expect(ev.some((e) => e.kind === 'stamina-restored' && e.amount === 1)).toBe(true);
  });
});

describe('技能 special（多樣化）', () => {
  it('T01 Lv3 老練節能：出招後自回 3', () => {
    const { s, rng } = setup();
    const tech = mkTech('T01', 8);
    tech.level = 3;
    tech.maxStamina = 20;
    s.players[0].field.active = tech;
    s.players[0].windFarm[0].faults = [{ cardId: 'F01', faultCategory: 'sensor', roundsLeft: 2, sev: 1, drop: 5 }];
    const ev: GameEvent[] = [];
    applySkill(s, 0, 0, ev, rng);
    expect(ev.some((e) => e.kind === 'stamina-restored' && e.techId === 'T01' && e.amount === 3)).toBe(true);
    expect(tech.stamina).toBe(11); // 8 + 3（技能耗體在 tickStamina 才扣）
  });

  it('T12 Lv3 團隊照護：全隊 +2', () => {
    const { s, rng } = setup();
    const mgr = mkTech('T12', 10);
    mgr.level = 3;
    mgr.maxStamina = 20;
    s.players[0].field.active = mgr;
    s.players[0].field.bench = [mkTech('T03', 5)];
    const ev: GameEvent[] = [];
    applySkill(s, 0, 0, ev, rng);
    expect(mgr.stamina).toBe(12);
    expect(s.players[0].field.bench[0].stamina).toBe(7);
  });

  it('T15 Lv3 過載重構：額外 -4 疲勞（risk/reward）', () => {
    const { s, rng } = setup();
    const chief = mkTech('T15', 15);
    chief.level = 3;
    chief.maxStamina = 20;
    s.players[0].field.active = chief;
    s.players[0].windFarm[0].faults = [{ cardId: 'F06', faultCategory: 'mechanical', roundsLeft: 3, sev: 4, drop: 18 }];
    const ev: GameEvent[] = [];
    applySkill(s, 0, 0, ev, rng);
    expect(chief.stamina).toBe(11); // 15 - 4 過載代價
    expect(s.players[0].windFarm[0].faults).toHaveLength(0); // 修復力 18(×1.5 免懲罰) 秒殺 drop18
  });
});

describe('IT04 吊車調度次效（平衡補救）', () => {
  it('未停機 → +10% 可用率（不再是死卡）', () => {
    const { s, rng } = setup();
    const tu = s.players[0].windFarm[0];
    tu.avail = 70;
    const i = addToHand(s, 'IT04');
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: i, targetTurbineIdx: 0 }, rng);
    expect(r.state.players[0].windFarm[0].avail).toBe(80);
  });
});

describe('AI 對新卡的評分與候選', () => {
  it('legalActions 為補血卡產生每個場上技師的候選', () => {
    const { s } = setup();
    s.currentPlayer = 0;
    s.players[0].field.active = mkTech('T02', 3);
    s.players[0].field.bench = [mkTech('T03', 5)];
    s.players[0].hand = ['IT10'];
    const acts = legalActions(s, 0).filter((a) => a.kind === 'play-card');
    expect(acts).toHaveLength(2); // 主力 + 備戰各一
  });

  it('補血評分：疲勞缺口越大分越高；滿血 → 負分不打', () => {
    const { s } = setup();
    const strategy = getStrategy(s, 0);
    const card = { id: 'IT10', type: 'item', cost: 1, rarity: 1, effect: 'restore-stamina', value: 5 } as never;
    const low = evaluateItemPlay(card, null, s, 0, strategy, 'hard', mkTech('T02', 2));
    const full = evaluateItemPlay(card, null, s, 0, strategy, 'hard', mkTech('T02', 10));
    expect(low).toBeGreaterThan(10);
    expect(full).toBeLessThan(0);
  });
});
