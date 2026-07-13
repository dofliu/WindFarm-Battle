// v2 AI 決策：評分、動作生效、整場對局。
// 涵蓋修復項：currentPlayer=AI 時 legalActions 合法、AI 動作用回傳 state 續跑。
import { describe, it, expect } from 'vitest';
import { aiTakeTurn, aiChoose, generateActions } from '../src/core/ai';
import { RESERVE_THRESHOLD } from '../src/core/ai/evaluator';
import { applyAction } from '../src/core/actions';
import { createInitialState } from '../src/core/game-state';
import { startRound, endRound, _beginTurn } from '../src/core/rules-engine';
import { createRng } from '../src/core/rng';
import type { GameState } from '../src/core/types';

function setupAiTurn(seed = 42): { s: GameState; rng: ReturnType<typeof createRng> } {
  const rng = createRng(seed);
  const s = createInitialState(rng, 'weather-challenge');
  for (let i = 0; i < 4; i++) {
    s.players[0].hand.push(s.players[0].deck.shift()!);
    s.players[1].hand.push(s.players[1].deck.shift()!);
  }
  startRound(s, rng);
  s.currentPlayer = 1;
  _beginTurn(s, 1, []);
  return { s, rng };
}

describe('AI 評分與決策', () => {
  it('currentPlayer=AI 時能產生非 end-turn 的正分動作（修復：曾因 currentPlayer 被 startRound 蓋回 0 而癱瘓）', () => {
    const { s } = setupAiTurn();
    const { actions } = generateActions(s, 1, 'hard');
    const positive = actions.filter((a) => a.action.kind !== 'end-turn' && a.score >= RESERVE_THRESHOLD);
    expect(positive.length).toBeGreaterThan(0);
  });

  it('手上有技師時，派遣技師分數高於結束回合', () => {
    const { s } = setupAiTurn();
    s.players[1].hand = ['T02'];
    const { actions } = generateActions(s, 1, 'hard');
    const deploy = actions.find((a) => a.action.kind === 'play-card');
    const end = actions.find((a) => a.action.kind === 'end-turn');
    expect(deploy).toBeDefined();
    expect(deploy!.score).toBeGreaterThan(end!.score);
  });

  it('AI 步進迴圈：用回傳 state 續跑，動作實際生效（修復：曾打空氣）', () => {
    const { s, rng } = setupAiTurn();
    let cur = s;
    for (let step = 0; step < 6; step++) {
      const choice = aiChoose(cur, 1, 'hard', rng);
      if (!choice || choice.chosen.score < RESERVE_THRESHOLD || choice.chosen.action.kind === 'end-turn') break;
      cur = applyAction(cur, choice.chosen.action, rng).state;
      if (choice.chosen.action.kind === 'use-skill') break;
    }
    // AI 至少完成一項建設（部署技師或使用卡）
    const built = cur.players[1].field.active !== null || cur.players[1].hand.length < s.players[1].hand.length;
    expect(built).toBe(true);
  });
});

describe('AI 整場對局', () => {
  it('12 回合對局跑完：AI 有部署、分數 > 0、正常終局', () => {
    const rng = createRng(20260713);
    let s = createInitialState(rng, 'weather-challenge');
    for (let i = 0; i < 4; i++) {
      s.players[0].hand.push(s.players[0].deck.shift()!);
      s.players[1].hand.push(s.players[1].deck.shift()!);
    }
    startRound(s, rng);

    let aiEverDeployed = false;
    for (let round = 1; round <= 12 && !s.gameOver; round++) {
      // 玩家擺爛直接結束 → AI 回合
      s.currentPlayer = 1;
      _beginTurn(s, 1, []);
      for (let step = 0; step < 8; step++) {
        const choice = aiChoose(s, 1, 'hard', rng);
        if (!choice || choice.chosen.score < RESERVE_THRESHOLD || choice.chosen.action.kind === 'end-turn') break;
        s = applyAction(s, choice.chosen.action, rng).state;
        if (choice.chosen.action.kind === 'use-skill') break;
      }
      if (s.players[1].field.active) aiEverDeployed = true;
      endRound(s, rng);
      if (!s.gameOver) startRound(s, rng);
    }

    expect(s.gameOver).toBe(true);
    expect(aiEverDeployed).toBe(true);
    expect(s.players[0].score).toBeGreaterThan(0);
    expect(s.players[1].score).toBeGreaterThan(0);
    // 雙方同一風場同一環境：AI 有經營（技能修復/道具）應 ≥ 玩家擺爛分
    expect(s.players[1].score).toBeGreaterThanOrEqual(s.players[0].score);
  });
});

describe('aiTakeTurn 包裝', () => {
  it('回傳 state 與 events 不炸', () => {
    const rng = createRng(12345);
    const state = createInitialState(rng, 'weather-challenge');
    startRound(state, rng);
    state.currentPlayer = 1;
    _beginTurn(state, 1, []);
    const result = aiTakeTurn(state, 'medium', rng);
    expect(result).toBeDefined();
    expect(result.state).toBeDefined();
  });
});
