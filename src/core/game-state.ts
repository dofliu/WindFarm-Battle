import type { GameState, GameMode, PlayerState, DeployedTurbine } from './types';
import type { Rng } from './rng';
import { shuffle } from './rng';
import { CARDS, deckCardIds } from './cards';

/** 深拷貝狀態（確保 core 動作為純函式，不更動原狀態）。 */
export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

/** 建立開局風場（雙方相同） */
function makeStartingFleet(): DeployedTurbine[] {
  const os8Avail = CARDS['OS8'].stats?.avail ?? 90;
  const os10Avail = CARDS['OS10'].stats?.avail ?? 88;
  const os12Avail = CARDS['OS12'].stats?.avail ?? 86;
  return [
    {
      id: 'OS8',
      mw: CARDS['OS8'].stats?.mw ?? 8,
      mwBonus: 0,
      avail: os8Avail,
      originalAvail: os8Avail,
      faults: [],
      shutdown: false,
      faultImmuneRounds: 0,
    },
    {
      id: 'OS10',
      mw: CARDS['OS10'].stats?.mw ?? 10,
      mwBonus: 0,
      avail: os10Avail,
      originalAvail: os10Avail,
      faults: [],
      shutdown: false,
      faultImmuneRounds: 0,
    },
    {
      id: 'OS12',
      mw: CARDS['OS12'].stats?.mw ?? 12,
      mwBonus: 0,
      avail: os12Avail,
      originalAvail: os12Avail,
      faults: [],
      shutdown: false,
      faultImmuneRounds: 0,
    },
  ];
}

function createPlayer(name: string, rng: Rng): PlayerState {
  return {
    name,
    deck: shuffle([...deckCardIds], rng),
    hand: [],
    field: {
      active: null,
      bench: [],
    },
    windFarm: makeStartingFleet(),
    retired: [],
    score: 0,
    toolPlayedThisTurn: false,
    contractPlayedThisTurn: false,
    retreatedThisTurn: false,
    activeContracts: [],
    usedOncePerGame: [],
  };
}

/** 建立初始狀態 */
export function createInitialState(rng: Rng, mode: GameMode = 'versus'): GameState {
  // 隨機生成一個環境 Seed，這樣雙方抽風骰、浪骰、以及故障事件時都是同調的
  const environmentSeed = Math.floor(rng.next() * 1000000);

  return {
    round: 1,
    maxRounds: 12,
    mode,
    wind: { roll: 0, speed: 0, coeff: 0, label: '尚未開始' },
    waveHeight: 1,
    currentPlayer: 0,
    players: [createPlayer('P1', rng), createPlayer('P2', rng)],
    environmentSeed,
    gameOver: false,
  };
}
