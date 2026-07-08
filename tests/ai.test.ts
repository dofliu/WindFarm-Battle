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
import { evaluateTurbinePlay, evaluateFaultPlay, evaluateFuncPlay, evaluateTechPlay, getDifficultyMultipliers } from '../src/core/ai/evaluator';
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
  it('主力 + 備戰區滿 3 台 + 新卡 MW ≤ 最弱 → -50', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] }, // 主力：4MW
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] }, // 備戰
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] }, // 備戰
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] }, // 備戰（湊滿 3 台備戰區）
    ];
    s.players[0].activeTurbineIdx = 0;
    const strategy = getStrategy(s, 0);
    expect(evaluateTurbinePlay(CARDS['M01'], s, 0, strategy)).toBe(-50); // 2MW ≤ 4MW（備戰區最弱）
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

  it('M12（no-wind-power）2 台時使用 coeff=1.0 而非 0.65（分數 > 20）', () => {
    // 備戰區未滿（只有 1 台備戰）時會套用 BENCH_RESERVE_DISCOUNT 折價，絕對值比舊版低很多；
    // 若誤用 AI_AVG_WIND_COEFF=0.65，得分約 14.5；使用 NO_WIND_POWER_COEFF=1.0 則約 24.5，
    // 兩者相對差異仍成立，門檻改用兩者之間的值來驗證方向正確。
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'OS8', avail: 95, mwBonus: 0, faults: [] },
      { cardId: 'OS10', avail: 95, mwBonus: 0, faults: [] },
    ];
    s.players[0].activeTurbineIdx = 0;
    const strategy = getStrategy(s, 0);
    const score = evaluateTurbinePlay(CARDS['M12'], s, 0, strategy);
    expect(score).toBeGreaterThan(20); // coeff=0.65 時約 14.5，coeff=1.0 時約 24.5
  });
});

describe('S2.4 evaluateFaultPlay：required +35 / 反制 -25', () => {
  it('F04 required[T02,T08]，對手無此 tech → 加 35（再乘 phase/position 倍率）', () => {
    // round=1 → phase=early ×0.7；設定 P0 為 1 台 M01、P1 為 M07 → P0 落後 → position=losing ×1.4
    // v4.7 難度係數：hard attackMult=1.2，差距要乘以 attackMult
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    s.players[1].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }];
    s.players[1].techs = [];
    const strategy = getStrategy(s, 0);
    expect(strategy.phase).toBe('early');
    expect(strategy.position).toBe('losing');

    const withReq = evaluateFaultPlay(CARDS['F04'], s.players[1].turbines[0], s, 0, strategy, 'hard');

    const s2 = structuredClone(s);
    s2.players[1].techs = ['T02'];
    const blocked = evaluateFaultPlay(CARDS['F04'], s2.players[1].turbines[0], s2, 0, strategy, 'hard');
    // 差距 = 35（required gate） × 0.7（early） × 1.4（losing） × 1.2（hard attackMult）
    expect(withReq - blocked).toBeCloseTo(35 * 0.7 * 1.4 * 1.2, 5);
  });

  it('F02 無 required，對手有 T01（counters F02）→ 扣 25（再乘 phase 倍率）', () => {
    // Route B：P0 和 P1 均設為相同單台，使 position=even
    // v4.7 難度係數：hard attackMult=1.2，差距要乘以 attackMult
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    s.players[1].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    s.players[1].techs = ['T01'];
    const strategy = getStrategy(s, 0);
    expect(strategy.phase).toBe('early');
    expect(strategy.position).toBe('even');

    const blocked = evaluateFaultPlay(CARDS['F02'], s.players[1].turbines[0], s, 0, strategy, 'hard');
    const s2 = structuredClone(s);
    s2.players[1].techs = [];
    const open = evaluateFaultPlay(CARDS['F02'], s2.players[1].turbines[0], s2, 0, strategy, 'hard');
    // 差距 = 25 × 0.7（early） × 1.2（hard attackMult）；position=even 無倍率
    expect(open - blocked).toBeCloseTo(25 * 0.7 * 1.2, 5);
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
  it('canPlay 過濾後產生候選；fault 只對對手主力產生一個候選（寶可夢式規則）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['F02']; // F02 cost 1
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    s.players[1].turbines = [
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }, // 主力
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 備戰區，免疫，不產生候選
    ];
    s.players[1].activeTurbineIdx = 0;
    const { actions } = generateActions(s, 0);
    const faultCandidates = actions.filter((a) => a.action.kind === 'play-card');
    expect(faultCandidates).toHaveLength(1);
    const only = faultCandidates[0];
    expect(only.action.kind === 'play-card' && only.action.target).toBe(0);
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

describe('v4.7 AI 難度分級化：getDifficultyMultipliers', () => {
  it('easy：attackMult=0.5, repairMult=0.5, deployMult=0.7, targetHighestMW=false', () => {
    const m = getDifficultyMultipliers('easy');
    expect(m.attackMult).toBe(0.5);
    expect(m.repairMult).toBe(0.5);
    expect(m.deployMult).toBe(0.7);
    expect(m.targetHighestMW).toBe(false);
  });

  it('medium：attackMult=0.85, repairMult=1.0, deployMult=1.0, targetHighestMW=false', () => {
    const m = getDifficultyMultipliers('medium');
    expect(m.attackMult).toBe(0.85);
    expect(m.repairMult).toBe(1.0);
    expect(m.deployMult).toBe(1.0);
    expect(m.targetHighestMW).toBe(false);
  });

  it('hard：attackMult=1.2, repairMult=1.3, deployMult=1.1, targetHighestMW=true', () => {
    const m = getDifficultyMultipliers('hard');
    expect(m.attackMult).toBe(1.2);
    expect(m.repairMult).toBe(1.3);
    expect(m.deployMult).toBe(1.1);
    expect(m.targetHighestMW).toBe(true);
  });

  it('easy 的故障卡評分 < medium < hard（使用 F04 required gate 確保正分）', () => {
    // F04 有 required gate：對手無對應 tech 時 +35 分，確保分數為正
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] },
      { cardId: 'M09', avail: 90, mwBonus: 0, faults: [] },
    ];
    s.players[1].turbines = [
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] },
      { cardId: 'M09', avail: 90, mwBonus: 0, faults: [] },
    ];
    s.players[1].techs = []; // 對手無 T02/T08，觸發 required gate +35 分
    s.round = 5; // mid 階段，避免 late 的分數放大干擾
    const strategy = getStrategy(s, 0);
    expect(strategy.position).toBe('even');
    const target = s.players[1].turbines[1]; // M09 高 MW 目標
    const easyScore = evaluateFaultPlay(CARDS['F04'], target, s, 0, strategy, 'easy');
    const medScore = evaluateFaultPlay(CARDS['F04'], target, s, 0, strategy, 'medium');
    const hardScore = evaluateFaultPlay(CARDS['F04'], target, s, 0, strategy, 'hard');
    // required gate 確保分數為正，且 easy < medium < hard
    expect(easyScore).toBeGreaterThan(0);
    expect(easyScore).toBeLessThan(medScore);
    expect(medScore).toBeLessThan(hardScore);
  });

  it('easy 的技師卡評分 < medium < hard（相同場面）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [{ cardId: 'F02', drop: 20, roundsLeft: 3, sev: 2 }] }];
    s.players[1].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }];
    const strategy = getStrategy(s, 0);
    const easyScore = evaluateTechPlay(CARDS['T01'], s, 0, strategy, 'easy');
    const medScore = evaluateTechPlay(CARDS['T01'], s, 0, strategy, 'medium');
    const hardScore = evaluateTechPlay(CARDS['T01'], s, 0, strategy, 'hard');
    expect(easyScore).toBeLessThan(medScore);
    expect(medScore).toBeLessThan(hardScore);
  });

  it('hard targetHighestMW：攻擊最高 MW 機組比攻擊低 MW 機組得分更高', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    // 對手有兩台：M01(4MW) 和 M07(12MW)
    s.players[1].turbines = [
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] },
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] },
    ];
    const strategy = getStrategy(s, 0);
    const scoreOnHighMW = evaluateFaultPlay(CARDS['F02'], s.players[1].turbines[1], s, 0, strategy, 'hard');
    const scoreOnLowMW = evaluateFaultPlay(CARDS['F02'], s.players[1].turbines[0], s, 0, strategy, 'hard');
    // Hard 攻擊最高 MW 機組應得到更高分（targetHighestMW 加 10 分）
    expect(scoreOnHighMW).toBeGreaterThan(scoreOnLowMW);
  });
});

describe('v5.7 AI 策略感知：T08 peek-hand / T09 func-bonus / FN07-09 評分', () => {
  // ── T09 func-bonus 感知 ──────────────────────────────────────────
  it('T09 在場時出 func 卡比無 T09 時得分高 +8', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    s.players[0].funcBonusThisRound = 0;
    s.round = 5;
    const strategy = getStrategy(s, 0);
    s.players[0].techs = [];
    const scoreWithoutT09 = evaluateFuncPlay(CARDS['FN04'], s, 0, strategy);
    s.players[0].techs = ['T09'];
    const scoreWithT09 = evaluateFuncPlay(CARDS['FN04'], s, 0, strategy);
    expect(scoreWithT09).toBe(scoreWithoutT09 + 8);
  });

  it('T09 在場但 funcBonusThisRound=2（已到上限）→ 不再加分', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    s.players[0].funcBonusThisRound = 2;
    s.round = 5;
    const strategy = getStrategy(s, 0);
    const sNoT09 = structuredClone(s);
    sNoT09.players[0].techs = [];
    const baseScore = evaluateFuncPlay(CARDS['FN04'], sNoT09, 0, strategy);
    s.players[0].techs = ['T09'];
    const scoreAtCap = evaluateFuncPlay(CARDS['FN04'], s, 0, strategy);
    expect(scoreAtCap).toBe(baseScore);
  });

  // ── T08 peek-hand 感知 ──────────────────────────────────────────
  it('T08 在場時攻擊評分比無 T08 時高 +5', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    s.players[1].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }];
    s.players[1].techs = [];
    s.round = 5;
    const strategy = getStrategy(s, 0);
    const target = s.players[1].turbines[0];
    s.players[0].techs = [];
    const scoreWithoutT08 = evaluateFaultPlay(CARDS['F02'], target, s, 0, strategy, 'hard');
    s.players[0].techs = ['T08'];
    const scoreWithT08 = evaluateFaultPlay(CARDS['F02'], target, s, 0, strategy, 'hard');
    expect(scoreWithT08).toBe(scoreWithoutT08 + 5);
  });

  // ── FN07 searchTurbine 評分 ──────────────────────────────────────
  it('FN07 牌庫有風機時得正分；牌庫無風機時 -1000', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    s.round = 3;
    s.players[0].deck = ['M07', 'F01'];
    const scoreWithTurbine = evaluateFuncPlay(CARDS['FN07'], s, 0, getStrategy(s, 0));
    expect(scoreWithTurbine).toBeGreaterThan(0);
    s.players[0].deck = ['F01', 'F02'];
    const scoreNoTurbine = evaluateFuncPlay(CARDS['FN07'], s, 0, getStrategy(s, 0));
    expect(scoreNoTurbine).toBe(-1000);
  });

  // ── FN08 insurance 評分 ──────────────────────────────────────────
  it('FN08 有故障機組時得分高於無故障時', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = [];
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [{ cardId: 'F02', drop: 20, roundsLeft: 3, sev: 2 }] }];
    const scoreWithFault = evaluateFuncPlay(CARDS['FN08'], s, 0, getStrategy(s, 0));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    const scoreNoFault = evaluateFuncPlay(CARDS['FN08'], s, 0, getStrategy(s, 0));
    expect(scoreWithFault).toBeGreaterThan(scoreNoFault);
  });

  // ── FN09 massRepair 評分 ──────────────────────────────────────────
  it('FN09 有多個故障時得高分；無故障時 -5；已使用過 -1000', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = [];
    s.players[0].turbines = [
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [{ cardId: 'F02', drop: 20, roundsLeft: 3, sev: 2 }] },
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [{ cardId: 'F04', drop: 25, roundsLeft: 2, sev: 3 }] },
    ];
    s.players[0].usedOncePerGame = [];
    const scoreWithFaults = evaluateFuncPlay(CARDS['FN09'], s, 0, getStrategy(s, 0));
    expect(scoreWithFaults).toBeGreaterThan(20);
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    const scoreNoFault = evaluateFuncPlay(CARDS['FN09'], s, 0, getStrategy(s, 0));
    expect(scoreNoFault).toBe(-5);
    s.players[0].usedOncePerGame = ['FN09'];
    const scoreUsed = evaluateFuncPlay(CARDS['FN09'], s, 0, getStrategy(s, 0));
    expect(scoreUsed).toBe(-1000);
  });
});

// ── evolveTurbine 評分（UP01-UP04）──────────────────────────────────
describe('v5.10 evaluateFuncPlay — evolveTurbine', () => {
  it('UP01 有 tier1 機組時得正分（早期）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    s.round = 2; // early phase
    const score = evaluateFuncPlay(CARDS['UP01'], s, 0, getStrategy(s, 0));
    expect(score).toBeGreaterThan(0);
  });

  it('UP03 有 tier3 機組時得正分；終局（round=9）得分低於早期（round=2）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M05', avail: 95, mwBonus: 0, faults: [] }];
    s.round = 2;
    const scoreEarly = evaluateFuncPlay(CARDS['UP03'], s, 0, getStrategy(s, 0));

    const sLate = structuredClone(s);
    sLate.round = 9;
    const scoreLate = evaluateFuncPlay(CARDS['UP03'], sLate, 0, getStrategy(sLate, 0));

    expect(scoreEarly).toBeGreaterThan(scoreLate);
  });

  it('UP04 evolve-universal 有機組時得正分', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M07', avail: 95, mwBonus: 0, faults: [] }];
    s.round = 3;
    const score = evaluateFuncPlay(CARDS['UP04'], s, 0, getStrategy(s, 0));
    expect(score).toBeGreaterThan(0);
  });

  it('evolveTurbine 早期評分 > 終局評分（早期升級效益高）', () => {
    const sEarly = structuredClone(createInitialState(createRng(1)));
    sEarly.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    sEarly.round = 1;
    const scoreEarly = evaluateFuncPlay(CARDS['UP01'], sEarly, 0, getStrategy(sEarly, 0));

    const sLate = structuredClone(sEarly);
    sLate.round = 9;
    const scoreLate = evaluateFuncPlay(CARDS['UP01'], sLate, 0, getStrategy(sLate, 0));

    expect(scoreEarly).toBeGreaterThan(scoreLate);
  });
});
