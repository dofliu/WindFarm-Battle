// S2.4 AI 測試：策略（phase / position 邊界）、評估係數（重要邊界）、難度（fixedRng 驗 RNG 順序）、aiTakeTurn 完整 12 回合。
import { describe, it, expect } from 'vitest';
import type { Rng } from '../src/core/rng';
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import {
  evaluateBoard,
  getStrategy,
  pickByDifficulty,
  generateActions,
  aiChoose,
  aiTakeTurn,
  RESERVE_THRESHOLD,
  AI_AVG_WIND_COEFF,
} from '../src/core/ai';
import { evaluateTurbinePlay, evaluateFaultPlay, evaluateFuncPlay } from '../src/core/ai/evaluator';
import { CARDS } from '../src/core/cards';
import { runGame } from '../src/core/rules-engine';
import type { GameState } from '../src/core/types';
import type { ScoredAction } from '../src/core/ai';

function fixedRng(values: number[]): Rng {
  let i = 0;
  const next = (): number => values[i++] ?? 0;
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

describe('S2.4 strategy：phase 邊界', () => {
  function atRound(r: number): GameState {
    const s = structuredClone(createInitialState(createRng(1)));
    s.round = r;
    return s;
  }
  it('round 1–4 → early', () => {
    expect(getStrategy(atRound(1), 0).phase).toBe('early');
    expect(getStrategy(atRound(4), 0).phase).toBe('early');
  });
  it('round 5–8 → mid', () => {
    expect(getStrategy(atRound(5), 0).phase).toBe('mid');
    expect(getStrategy(atRound(8), 0).phase).toBe('mid');
  });
  it('round 9–12 → late', () => {
    expect(getStrategy(atRound(9), 0).phase).toBe('late');
    expect(getStrategy(atRound(12), 0).phase).toBe('late');
  });
});

describe('S2.4 strategy：position（futureScoreDiff 門檻 ±15）', () => {
  it('myMWh − oppMWh 領先很多 → winning', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }]; // 12MW
    s.players[1].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }]; // 2MW
    expect(getStrategy(s, 0).position).toBe('winning');
    expect(getStrategy(s, 1).position).toBe('losing');
  });
  it('完全對稱 → even', () => {
    const s = createInitialState(createRng(1));
    expect(getStrategy(s, 0).position).toBe('even');
  });
});

describe('S2.4 evaluateBoard：使用 AI_AVG_WIND_COEFF=0.65', () => {
  it('1 台 M01(2MW,95%) → 0.65×0.95×2 = 1.235', () => {
    // Route B：明確設定單台 M01 以測試 evaluateBoard 公式
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    const b = evaluateBoard(s, 0);
    expect(b.myMWhPerRound).toBeCloseTo(2 * AI_AVG_WIND_COEFF * 0.95, 5);
  });
  it('roundsLeft = maxRounds − round + 1', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.round = 5;
    expect(evaluateBoard(s, 0).roundsLeft).toBe(8);
  });
});

describe('S2.4 evaluateTurbinePlay：替換規則', () => {
  it('滿 3 台 + 新卡 MW ≤ 最弱 → -50', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] }, // 4MW
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] },
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] },
    ];
    const strategy = getStrategy(s, 0);
    expect(evaluateTurbinePlay(CARDS['M01'], s, 0, strategy)).toBe(-50); // 2MW ≤ 4MW
  });
});

describe('S2.4 evaluateTurbinePlay：M07/M10/M12 特殊能力修正', () => {
  it('M07（aura-mw + card-draw-trigger）3 台已滿→ 分數顯著高於純升級值（> 20）', () => {
    // 初始艦隊 OS8/OS10/OS12（3 台），M07 替換 OS8(8MW)；
    // aura-mw: 3 × 1 × 0.65 × 12 × 1.5 = 35.1；card-draw-trigger: +8；
    // early × 1.4 後約 103，舊邏輯因缺少兩個加成只得 ~3.5
    const s = structuredClone(createInitialState(createRng(1)));
    const strategy = getStrategy(s, 0);
    const score = evaluateTurbinePlay(CARDS['M07'], s, 0, strategy);
    expect(score).toBeGreaterThan(20);
  });

  it('M10（no-slot）3 台已滿→ 不回傳 -50（跳過替換邏輯，走疊加路徑）', () => {
    // M10 no-slot：即使 turbines.length >= 3 也走 hasNoSlot 分支，不進入「替換最弱」判定
    const s = structuredClone(createInitialState(createRng(1)));
    const strategy = getStrategy(s, 0);
    const score = evaluateTurbinePlay(CARDS['M10'], s, 0, strategy);
    expect(score).not.toBe(-50);
    expect(score).toBeGreaterThan(0);
  });

  it('M12（no-wind-power）2 台時使用 coeff=1.0 而非 0.65（分數 > 50）', () => {
    // 若誤用 AI_AVG_WIND_COEFF=0.65，得分約 43；使用 NO_WIND_POWER_COEFF=1.0 則約 71
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'OS8', avail: 95, mwBonus: 0, faults: [] },
      { cardId: 'OS10', avail: 95, mwBonus: 0, faults: [] },
    ];
    const strategy = getStrategy(s, 0);
    const score = evaluateTurbinePlay(CARDS['M12'], s, 0, strategy);
    expect(score).toBeGreaterThan(50); // coeff=0.65 時約 43，coeff=1.0 時約 71
  });
});

describe('S2.4 evaluateFaultPlay：required +35 / 反制 -25', () => {
  it('F04 required[T02,T08]，對手無此 tech → 加 35（再乘 phase/position 倍率）', () => {
    // round=1 → phase=early ×0.7；設定 P0 為 1 台 M01、P1 為 M07 → P0 落後 → position=losing ×1.4
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    s.players[1].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }];
    s.players[1].techs = [];
    const strategy = getStrategy(s, 0);
    expect(strategy.phase).toBe('early');
    expect(strategy.position).toBe('losing');

    const withReq = evaluateFaultPlay(CARDS['F04'], s.players[1].turbines[0], s, 0, strategy);

    const s2 = structuredClone(s);
    s2.players[1].techs = ['T02'];
    const blocked = evaluateFaultPlay(CARDS['F04'], s2.players[1].turbines[0], s2, 0, strategy);
    // 差距 = 35（required gate） × 0.7（early） × 1.4（losing）
    expect(withReq - blocked).toBeCloseTo(35 * 0.7 * 1.4, 5);
  });

  it('F02 無 required，對手有 T01（counters F02）→ 扣 25（再乘 phase 倍率）', () => {
    // Route B：P0 和 P1 均設為相同單台，使 position=even
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    s.players[1].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    s.players[1].techs = ['T01'];
    const strategy = getStrategy(s, 0);
    expect(strategy.phase).toBe('early');
    expect(strategy.position).toBe('even');

    const blocked = evaluateFaultPlay(CARDS['F02'], s.players[1].turbines[0], s, 0, strategy);
    const s2 = structuredClone(s);
    s2.players[1].techs = [];
    const open = evaluateFaultPlay(CARDS['F02'], s2.players[1].turbines[0], s2, 0, strategy);
    // 差距 = 25 × 0.7（early）；position=even 無倍率
    expect(open - blocked).toBeCloseTo(25 * 0.7, 5);
  });
});

describe('S2.4 evaluateFuncPlay：邊界回 -1000', () => {
  it('FN03 upgradeMW 但所有機組已升級 → -1000', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 2, faults: [] }];
    expect(evaluateFuncPlay(CARDS['FN03'], s, 0, getStrategy(s, 0))).toBe(-1000);
  });
  it('FN04 extraAction 但 pending=2 → -1000', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].pendingExtraActions = 2;
    expect(evaluateFuncPlay(CARDS['FN04'], s, 0, getStrategy(s, 0))).toBe(-1000);
  });
});

describe('S2.4 pickByDifficulty（RNG 順序固定）', () => {
  const candidates: ScoredAction[] = [
    { action: { kind: 'play-card', player: 0, handIdx: 0 }, score: 30, desc: 'top1' },
    { action: { kind: 'play-card', player: 0, handIdx: 1 }, score: 20, desc: 'top2' },
    { action: { kind: 'play-card', player: 0, handIdx: 2 }, score: 10, desc: 'top3' },
    { action: { kind: 'play-card', player: 0, handIdx: 3 }, score: 5, desc: 'top4' },
  ];

  it('hard 永遠 top1', () => {
    expect(pickByDifficulty(candidates, 'hard', fixedRng([]))?.desc).toBe('top1');
  });

  it('medium：roll<0.25 → 次優；其他 → top1', () => {
    expect(pickByDifficulty(candidates, 'medium', fixedRng([0.2]))?.desc).toBe('top2');
    expect(pickByDifficulty(candidates, 'medium', fixedRng([0.3]))?.desc).toBe('top1');
  });

  it('easy：roll<0.5 → top3 內隨機；其他 → top1', () => {
    // roll=0.1 取 top3 隨機；接下來 index = floor(0 * 3) = 0 → top1（desc）
    expect(pickByDifficulty(candidates, 'easy', fixedRng([0.1, 0]))?.desc).toBe('top1');
    // floor(0.99 * 3) = 2 → top3
    expect(pickByDifficulty(candidates, 'easy', fixedRng([0.1, 0.99]))?.desc).toBe('top3');
    expect(pickByDifficulty(candidates, 'easy', fixedRng([0.9]))?.desc).toBe('top1');
  });

  it('全部負分時改用全部（不過濾）', () => {
    const allNeg: ScoredAction[] = [
      { action: { kind: 'end-turn', player: 0 }, score: -1, desc: 'best-neg' },
      { action: { kind: 'end-turn', player: 0 }, score: -50, desc: 'worse' },
    ];
    expect(pickByDifficulty(allNeg, 'hard', fixedRng([]))?.desc).toBe('best-neg');
  });
});

describe('S2.4 generateActions / aiChoose', () => {
  it('canPlay 過濾後產生候選；fault 對每個對手機組產生一個', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['F02']; // F02 cost 1
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    s.players[1].turbines = [
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] },
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] },
    ];
    const { actions } = generateActions(s, 0);
    // F02 對兩台機組各產一個候選
    const faultCandidates = actions.filter((a) => a.action.kind === 'play-card');
    expect(faultCandidates).toHaveLength(2);
  });

  it('aiChoose hard 對 M07 vs M09 兩張手牌 → 偏好 M07（MW 較大，是有效升級）', () => {
    // Route B：開局艦隊 OS8(8MW)+OS10(10MW)+OS12(12MW)；M07(12MW) 替換 OS8(8MW) → +4MW 升級
    // M09(10MW) 替換 OS8(8MW) → +2MW；M07 > M09 升級幅度更大
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['M09', 'M07'];
    s.actionsLeft = 5;
    s.currentPlayer = 0;
    const choice = aiChoose(s, 0, 'hard', fixedRng([]));
    expect(choice).not.toBeNull();
    const chosenCardId =
      choice && choice.chosen.action.kind === 'play-card'
        ? s.players[0].hand[choice.chosen.action.handIdx]
        : '';
    expect(chosenCardId).toBe('M07');
  });
});

describe('S2.4 RESERVE_THRESHOLD 與 aiTakeTurn 安全網', () => {
  it('RESERVE_THRESHOLD 對齊 v3 = -10', () => {
    expect(RESERVE_THRESHOLD).toBe(-10);
  });

  it('aiTakeTurn AI vs AI 跑滿 12 回合不丟錯，事件序列含 12 個 round-start 與 1 個 game-over', () => {
    const initial = createInitialState(createRng(42));
    const r = runGame(initial, createRng(42), aiTakeTurn('hard'));
    expect(r.state.round).toBe(12);
    expect(r.state.gameOver).toBe(true);
    expect(r.events.filter((e) => e.kind === 'round-start')).toHaveLength(12);
    expect(r.events.some((e) => e.kind === 'game-over')).toBe(true);
  });

  it('同 seed AI vs AI → 完全可重現（最終分數一致）', () => {
    const a = runGame(createInitialState(createRng(7)), createRng(7), aiTakeTurn('hard'));
    const b = runGame(createInitialState(createRng(7)), createRng(7), aiTakeTurn('hard'));
    expect(a.state.players[0].score).toBe(b.state.players[0].score);
    expect(a.state.players[1].score).toBe(b.state.players[1].score);
  });

  it('hard vs easy：完整一局也不會無限迴圈或丟錯', () => {
    const initial = createInitialState(createRng(99));
    const takeTurn = (state: GameState, player: 0 | 1, rng: Rng) =>
      (player === 0 ? aiTakeTurn('hard') : aiTakeTurn('easy'))(state, player, rng);
    const r = runGame(initial, createRng(99), takeTurn);
    expect(r.state.gameOver).toBe(true);
  });
});
