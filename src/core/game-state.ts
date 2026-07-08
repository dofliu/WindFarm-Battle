// 遊戲狀態建立與低階輔助。動作（playCard 等）在 actions.ts（S2.3）。
import type { GameState, GameMode, PlayerState } from './types';
import type { Rng } from './rng';
import { shuffle } from './rng';
import { CARDS, deckCardIds, coopDeckCardIds } from './cards';

/** 深拷貝狀態（確保 core 動作為純函式，不更動入參）。 */
export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

/**
 * Route B：建立開局離岸艦隊（雙方相同）。
 * OS8 8MW / OS10 10MW / OS12 12MW 全為離岸機組，對應 IEC 61400-3-1/3-2。
 * deployedRound=0 使 offshore-delay 能力不對開局機組生效（從 round 1 起就正常計分）。
 */
function makeStartingFleet(): import('./types').DeployedTurbine[] {
  const os8Avail  = CARDS['OS8'].stats?.avail  ?? 90;
  const os10Avail = CARDS['OS10'].stats?.avail ?? 88;
  const os12Avail = CARDS['OS12'].stats?.avail ?? 86;
  return [
    { cardId: 'OS8',  avail: os8Avail,  originalAvail: os8Avail,  mwBonus: 0, faults: [], deployedRound: 0 },
    { cardId: 'OS10', avail: os10Avail, originalAvail: os10Avail, mwBonus: 0, faults: [], deployedRound: 0 },
    { cardId: 'OS12', avail: os12Avail, originalAvail: os12Avail, mwBonus: 0, faults: [], deployedRound: 0 },
  ];
}

function createPlayer(name: string, rng: Rng, mode: GameMode): PlayerState {
  // 同題模式(weather-challenge)牌組排除故障與新風機（風場固定、故障改為環境事件）
  const pool = mode === 'weather-challenge' ? coopDeckCardIds : deckCardIds;
  return {
    name,
    deck: shuffle(pool as string[], rng),
    hand: [],
    // Route B：雙方開局各有相同的離岸艦隊（OS8 + OS10 + OS12）
    turbines: makeStartingFleet(),
    // 寶可夢式主力/備戰區：開局艦隊第一台（OS8）直接視為主力，其餘 2 台為備戰區
    // （設計決定：沿用既有「turbines[0]」慣例，避免大改開局艦隊建置邏輯）。
    activeTurbineIdx: 0,
    techs: [],
    score: 0,
    pendingExtraActions: 0,
    mwhBoostActive: false,
    techPlayedThisRound: false,
    usedOncePerGame: [],
    funcBonusThisRound: 0,
    usedSkillThisRound: [],
    gridBonusThisRound: 0,
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
    players: [createPlayer('P1', rng, mode), createPlayer('P2', rng, mode)],
    futureWind: [],
    activeWeather: [],
    activeContracts: [],
    roundResources: [],
    gameOver: false,
  };
}
