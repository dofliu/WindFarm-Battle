import type { GameState, PlayerState, ActiveFault, GameEvent, FaultCategory } from './types';
import { CARDS, getCard } from './cards';
import { rollWind, rollWaveHeight, triggerFaultIncident } from './environment';
import { tickStamina, tickEvolution } from './stamina';
import { createRng, Rng } from './rng';

export const MAX_TECHS = 3;

export interface RulesConfig {
  readonly legacyV3?: boolean;
}

export const DEFAULT_CONFIG: RulesConfig = {};
export const UI_RICH_CONFIG: RulesConfig = {};

export interface TechSkillDef {
  readonly tag: string;
  readonly targetKind: 'ownFault' | 'ownTurbine' | 'none';
}

/** 取得技師技能定義（lv1, lv2, lv3 三招） */
export function techSkills(techId: string): readonly TechSkillDef[] {
  const card = CARDS[techId];
  if (!card || !card.skills) return [];
  return [card.skills.lv1, card.skills.lv2, card.skills.lv3].map((sk) => {
    let targetKind: 'ownFault' | 'ownTurbine' | 'none' = 'none';
    if (sk.repairPower) {
      targetKind = 'ownFault';
    } else if (
      sk.availBoost ||
      sk.mwBoost ||
      sk.special?.includes('prevent-fault') ||
      sk.special?.includes('block-next-fault')
    ) {
      targetKind = 'ownTurbine';
    }
    return {
      tag: sk.tag,
      targetKind,
    };
  });
}

export function techSkillDef(techId: string, tag: string): TechSkillDef | undefined {
  return techSkills(techId).find((sk) => sk.tag === tag);
}

export type TechTier = 'basic' | 'evolved' | 'ex';

export function techTier(techId: string): TechTier {
  const card = CARDS[techId];
  if (!card) return 'basic';
  if (card.legendary || (card.rarity ?? 1) >= 5) return 'ex';
  return (card.rarity ?? 1) >= 3 ? 'evolved' : 'basic';
}

export function techAbilityTag(techId: string): string | undefined {
  if (techTier(techId) !== 'ex') return undefined;
  return CARDS[techId]?.abilities?.[0]?.tag;
}

/** 計算技師組合技 (Combo Tier) */
export function comboTier(techIds: string[]): number {
  const specialties = new Set<FaultCategory>();
  for (const id of techIds) {
    const spec = CARDS[id]?.specialty;
    if (spec) {
      specialties.add(spec);
    }
  }
  if (specialties.size >= 3) return 2;
  if (specialties.size >= 2) return 1;
  return 0;
}

/** 判定勝負：比較雙方發電量 */
export function determineWinner(state: GameState): 0 | 1 | -1 {
  const p0 = state.players[0].score;
  const p1 = state.players[1].score;
  if (p0 > p1) return 0;
  if (p1 > p0) return 1;
  return -1;
}

/** 抽 1 張牌 */
export function _drawCard(player: PlayerState, playerIdx: 0 | 1, events: GameEvent[]): void {
  if (player.deck.length > 0) {
    const cardId = player.deck.shift()!;
    player.hand.push(cardId);
    events.push({
      kind: 'card-drawn',
      player: playerIdx,
      cardId,
    });
  }
}

/** 回合開始初始化：重置旗標、補牌 */
export function _beginTurn(state: GameState, playerIdx: 0 | 1, events: GameEvent[]): void {
  const player = state.players[playerIdx];
  player.techPlayedThisTurn = false;
  player.toolPlayedThisTurn = false;
  player.contractPlayedThisTurn = false;
  player.retreatedThisTurn = false;

  // 補牌至 4 張 (若手牌不足 4 張)
  while (player.hand.length < 4 && player.deck.length > 0) {
    _drawCard(player, playerIdx, events);
  }
}

/** 更新故障剩餘回合 */
export function _tickFaults(state: GameState, playerIdx: 0 | 1, events: GameEvent[]): void {
  void events;
  const player = state.players[playerIdx];
  player.windFarm.forEach((turbine) => {
    if (turbine.shutdown) return;

    turbine.faults = turbine.faults.map((f) => {
      return {
        ...f,
        roundsLeft: f.roundsLeft - 1,
      };
    });

    // 移除已過期的故障
    turbine.faults = turbine.faults.filter((f) => {
      if (f.roundsLeft <= 0) {
        // 可用率不恢復，只移除故障狀態
        return false;
      }
      return true;
    });
  });
}

/** 結算發電量 */
export function _scoreRound(state: GameState, events: GameEvent[]): void {
  const windCoeff = state.wind.coeff;

  state.players.forEach((player, playerIdx) => {
    let roundMwh = 0;

    player.windFarm.forEach((turbine) => {
      // 停機的風機不產電
      if (turbine.shutdown) return;

      const baseMW = turbine.mw;
      const mwBonus = turbine.mwBonus;
      const effectiveAvail = turbine.avail;

      const turbineMwh = (baseMW + mwBonus) * windCoeff * (effectiveAvail / 100);
      roundMwh += turbineMwh;
    });

    // 應用合約乘數
    let activeMultiplier = 1.0;
    player.activeContracts.forEach((c) => {
      activeMultiplier *= c.multiplier;
    });

    roundMwh *= activeMultiplier;

    // 四捨五入到小數第二位
    roundMwh = Math.round(roundMwh * 100) / 100;
    player.score = Math.round((player.score + roundMwh) * 100) / 100;

    events.push({
      kind: 'round-scored',
      player: playerIdx as 0 | 1,
      mwh: roundMwh,
      total: player.score,
    });
  });
}

/** 觸發共用的環境故障事件 */
export function _applyEnvironmentIncident(state: GameState, events: GameEvent[]): void {
  const rng = createRng(state.environmentSeed + state.round * 1000);
  const faultId = triggerFaultIncident(state.round, rng);

  if (faultId) {
    const card = getCard(faultId);
    // 隨機選一個風機槽位 (0, 1, 2)
    const targetIdx = Math.floor(rng.next() * 3);

    state.players.forEach((player, playerIdx) => {
      const turbine = player.windFarm[targetIdx];

      // 檢查故障免疫 (IT05 等)
      if (turbine.faultImmuneRounds > 0) {
        events.push({
          kind: 'shield-absorbed',
          player: playerIdx as 0 | 1,
          turbineIdx: targetIdx,
          faultCardId: faultId,
          shieldLeft: turbine.faultImmuneRounds - 1,
        });
        return;
      }

      // 如果已經停機，則不再新增故障
      if (turbine.shutdown) return;

      // 新增活躍故障
      const newFault: ActiveFault = {
        cardId: faultId,
        faultCategory: card.faultCategory!,
        roundsLeft: card.duration ?? 2,
        sev: card.severity ?? 3,
        drop: card.drop ?? 10,
      };

      turbine.faults.push(newFault);
      turbine.avail = Math.max(0, turbine.avail - newFault.drop);

      events.push({
        kind: 'fault-applied',
        player: playerIdx as 0 | 1,
        turbineId: turbine.id,
        cardId: faultId,
        drop: newFault.drop,
      });

      events.push({
        kind: 'incident',
        round: state.round,
        faultCardId: faultId,
        turbineId: turbine.id,
      });

      // 檢查停機條件 (3 個以上故障，或可用率降至 0 以下)
      if (turbine.faults.length >= 3 || turbine.avail <= 0) {
        turbine.shutdown = true;
        turbine.avail = 0;
        events.push({
          kind: 'turbine-shutdown',
          player: playerIdx as 0 | 1,
          turbineId: turbine.id,
        });
      }
    });
  }
}

/** 檢查與更新活躍合約 */
export function _checkContracts(state: GameState, events: GameEvent[]): void {
  state.players.forEach((player, playerIdx) => {
    player.activeContracts = player.activeContracts
      .map((c) => {
        return {
          ...c,
          durationLeft: c.durationLeft - 1,
        };
      })
      .filter((c) => {
        if (c.durationLeft <= 0) {
          events.push({
            kind: 'contract-expired',
            player: playerIdx as 0 | 1,
            cardId: c.cardId,
          });
          return false;
        }
        return true;
      });
  });
}

// 以下為新版相容性的 Dummy 導出
export function _applySalt() {}
export function _periodicRepair() {}
export function _repairFaults() {}
export function _unpredictableShuffle() {}
export function _spawnRoundResources() {}
export function _tickWeather() {}

/** 開始新回合：環境結算、故障生成、為當前玩家補牌 */
export function startRound(state: GameState, rng: Rng): GameEvent[] {
  void rng;
  const events: GameEvent[] = [];
  state.currentPlayer = 0;
  
  // 1. 擲風速、浪高
  const envRng = createRng(state.environmentSeed + state.round * 1000);
  state.wind = rollWind(envRng);
  state.waveHeight = rollWaveHeight(envRng);

  events.push({
    kind: 'round-start',
    round: state.round,
    windLabel: state.wind.label,
    waveHeight: state.waveHeight,
  });

  // 2. 減少免疫計數並結算故障倒數
  state.players.forEach((p, playerIdx) => {
    p.windFarm.forEach((t) => {
      if (t.faultImmuneRounds > 0) {
        t.faultImmuneRounds--;
      }
    });
    _tickFaults(state, playerIdx as 0 | 1, events);
  });

  // 3. 觸發共用環境故障
  _applyEnvironmentIncident(state, events);

  // 4. 重置與開始玩家回合
  _beginTurn(state, state.currentPlayer, events);

  return events;
}

/** 結束目前回合：發電結算、耐久度消耗、升級、合約計數、回合推進 */
export function endRound(state: GameState, rng: Rng): GameEvent[] {
  void rng;
  const events: GameEvent[] = [];

  // 1. 發電與合約結算
  _scoreRound(state, events);
  _checkContracts(state, events);

  // 2. 耐久度消耗與升級
  state.players.forEach((player, playerIdx) => {
    tickStamina(player, playerIdx as 0 | 1, events);
    tickEvolution(player, playerIdx as 0 | 1, events);
  });

  // 3. 推進回合
  state.round += 1;
  if (state.round > state.maxRounds) {
    state.gameOver = true;
    const winner = determineWinner(state);
    events.push({
      kind: 'game-over',
      winner,
    });
  } else {
    // 進入新回合的初始化 (新回合第一個玩家一般與 currentPlayer 一致，或者在 store 裡調度)
    // 這裡不做 full startRound 呼叫，由 store 決定何時呼叫 startRound
  }

  return events;
}

/** 運行整場遊戲的核心流程（模擬與測試用） */
export function runGame(
  state: GameState,
  config: RulesConfig,
  takeTurn: (s: GameState) => { state: GameState; events: GameEvent[] },
  rng: Rng
): { state: GameState; events: GameEvent[] } {
  void config;
  let currState = structuredClone(state);
  const events: GameEvent[] = [];

  while (!currState.gameOver) {
    // 開始新回合
    const e1 = startRound(currState, rng);
    events.push(...e1);

    // 雙方各自行動
    for (let playerIdx = 0; playerIdx < 2; playerIdx++) {
      currState.currentPlayer = playerIdx as 0 | 1;
      if (playerIdx > 0) {
        // P1 行動前也需要 beginTurn
        const e2: GameEvent[] = [];
        _beginTurn(currState, playerIdx as 0 | 1, e2);
        events.push(...e2);
      }

      // 調用決策回呼直到玩家結束回合
      let turnOver = false;
      while (!turnOver) {
        const actionResult = takeTurn(currState);
        currState = actionResult.state;
        events.push(...actionResult.events);
        
        // 檢查當前玩家是否已發送 turn-ended 或 turn 結束的事件
        const hasEnded = actionResult.events.some(
          (e) => e.kind === 'turn-ended' || e.kind === 'skill-used'
        );
        if (hasEnded) {
          turnOver = true;
        }
      }
    }

    // 結束回合
    const e3 = endRound(currState, rng);
    events.push(...e3);
  }

  return { state: currState, events };
}
