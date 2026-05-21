// 遊戲狀態建立與低階輔助。動作（playCard 等）在 actions.ts（S2.3）。
import type { GameState, GameMode, PlayerState } from './types';
import type { Rng } from './rng';
import { shuffle } from './rng';
import { CARDS, allCardIds } from './cards';

/** 深拷貝狀態（確保 core 動作為純函式，不更動入參）。 */
export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

function createPlayer(name: string, rng: Rng): PlayerState {
  const m01 = CARDS['M01'];
  return {
    name,
    deck: shuffle(allCardIds, rng),
    hand: [],
    // 對齊 v3：每位玩家開局各 1 台 綠源 2MW
    turbines: [{ cardId: 'M01', avail: m01.stats?.avail ?? 95, mwBonus: 0, faults: [] }],
    techs: [],
    score: 0,
    pendingExtraActions: 0,
    mwhBoostActive: false,
  };
}

/** 建立初始狀態（模式無關，D7）。不預先抽牌；抽牌在每回合流程內進行（對齊 v3）。 */
export function createInitialState(rng: Rng, mode: GameMode = 'versus'): GameState {
  return {
    round: 1,
    maxRounds: 12,
    mode,
    wind: { roll: 0, speed: 0, coeff: 0, label: '尚未開始' },
    currentPlayer: 0,
    firstPlayer: 0,
    actionsLeft: 2,
    players: [createPlayer('P1', rng), createPlayer('P2', rng)],
    gameOver: false,
  };
}
