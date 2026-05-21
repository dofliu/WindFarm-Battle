// ============================================================
// 規則引擎（純函式，零 UI 依賴）。S2.1：核心迴圈，全部對齊 v3。
//   - 風速骰、發電結算、動作經濟、鹽霧、12 回合流程、勝負
//   - 故障「施加/克制/cascade」在 S2.2；玩家動作 playCard 在 S2.3；AI 在 S2.4
// 內部以 mutate 工作副本求效率，對外一律回傳新狀態（cloneState）。
// ============================================================
import type { GameState, PlayerState, Wind } from './types';
import type { Rng } from './rng';
import { shuffle } from './rng';
import type { GameEvent, ApplyResult } from './events';
import { CARDS, allCardIds } from './cards';
import { cloneState } from './game-state';

/** legacyV3=true 用於 β 逐場精確重現（含 v3 bug）；預設為修正後的正式版。 */
export interface RulesConfig {
  readonly legacyV3: boolean;
}
export const DEFAULT_CONFIG: RulesConfig = { legacyV3: false };

/** 一個玩家的「行動函式」：在傳入狀態上行動並回傳事件。S2.1 用 no-op；S2.4 接 AI。 */
export type TakeTurn = (state: GameState, player: 0 | 1, rng: Rng) => GameEvent[];
const noopTurn: TakeTurn = () => [];

// ---------- 風速骰（對齊 v3 rollWind）----------
export function rollWind(rng: Rng): Wind {
  const r = rng.int(1, 6);
  if (r === 1) return { roll: 1, speed: 0, coeff: 0, label: '無風停機' };
  if (r === 2 || r === 3) return { roll: r, speed: 5, coeff: 0.4, label: '低風' };
  if (r === 4 || r === 5) return { roll: r, speed: 10, coeff: 1.0, label: '額定' };
  const r2 = rng.int(1, 6);
  if (r2 === 6) return { roll: '6+6', speed: 25, coeff: 0, label: '颱風', typhoon: true };
  return { roll: 6, speed: 20, coeff: 0.7, label: '高風' };
}

// ---------- 小工具 ----------
function hasActionAura(p: PlayerState): boolean {
  // 資料驅動：任何在場技師帶 aura-action（目前為 T07）→ +1 動作
  return p.techs.some((id) => CARDS[id].abilities.some((a) => a.tag === 'aura-action'));
}

function turbineMW(cardId: string, mwBonus: number): number {
  return (CARDS[cardId].stats?.mw ?? 0) + mwBonus;
}

// ---------- 內部 mutate 版（runGame 內使用單一工作副本）----------
function _drawCard(s: GameState, player: 0 | 1, rng: Rng, _config: RulesConfig): void {
  const p = s.players[player];
  // v3 行為：牌庫空則以全卡池重洗（D4 棄牌堆改良延後到平衡階段，避免改動牌組經濟）
  if (p.deck.length === 0) p.deck = shuffle(allCardIds, rng);
  const cardId = p.deck.pop();
  if (cardId !== undefined && p.hand.length < 7) p.hand.push(cardId); // 手牌上限 7（對齊 v3）
}

function _beginTurn(s: GameState, player: 0 | 1): void {
  const p = s.players[player];
  s.currentPlayer = player;
  s.actionsLeft = 2 + (hasActionAura(p) ? 1 : 0) + p.pendingExtraActions;
  p.pendingExtraActions = 0;
}

function _tickFaults(s: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  s.players.forEach((p, pi) => {
    p.turbines.forEach((t, ti) => {
      for (const f of t.faults) {
        if (CARDS[f.cardId].spreading && f.roundsLeft > 1) f.drop += 5; // 擴散：未修每回合 -5%
      }
      t.faults = t.faults.filter((f) => {
        f.roundsLeft -= 1;
        if (f.roundsLeft <= 0) {
          events.push({ kind: 'fault-repaired', player: pi as 0 | 1, targetIdx: ti, cardId: f.cardId });
          return false;
        }
        return true;
      });
    });
  });
  return events;
}

function _scoreRound(s: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  s.players.forEach((p, pi) => {
    let mwh = 0;
    for (const t of p.turbines) {
      const totalDrop = t.faults.reduce((sum, f) => sum + f.drop, 0);
      const avail = Math.max(0, t.avail - totalDrop);
      mwh += turbineMW(t.cardId, t.mwBonus) * s.wind.coeff * (avail / 100);
    }
    if (p.mwhBoostActive) mwh *= 1.5; // FN06 緊急投標
    mwh = Math.round(mwh);
    p.score += mwh;
    events.push({ kind: 'round-scored', player: pi as 0 | 1, mwh, total: p.score });
  });
  return events;
}

function _applySalt(s: GameState): void {
  if (s.round % 4 !== 0) return;
  for (const p of s.players) {
    for (const t of p.turbines) {
      if (CARDS[t.cardId].special === 'salt') t.avail = Math.max(0, t.avail - 2); // M04 鹽霧腐蝕
    }
  }
}

// ---------- 對外純函式（clone 後呼叫內部版）----------
export function drawCard(
  state: GameState, player: 0 | 1, rng: Rng, config: RulesConfig = DEFAULT_CONFIG,
): ApplyResult {
  const s = cloneState(state);
  _drawCard(s, player, rng, config);
  return { state: s, events: [] };
}

export function beginTurn(state: GameState, player: 0 | 1): GameState {
  const s = cloneState(state);
  _beginTurn(s, player);
  return s;
}

export function tickFaults(state: GameState): ApplyResult {
  const s = cloneState(state);
  return { state: s, events: _tickFaults(s) };
}

export function scoreRound(state: GameState): ApplyResult {
  const s = cloneState(state);
  return { state: s, events: _scoreRound(s) };
}

export function applySalt(state: GameState): GameState {
  const s = cloneState(state);
  _applySalt(s);
  return s;
}

export function determineWinner(state: GameState): 0 | 1 | -1 {
  const a = state.players[0].score;
  const b = state.players[1].score;
  return a > b ? 0 : b > a ? 1 : -1;
}

// ---------- 12 回合主迴圈（結構對齊 v3 simulateOneGame）----------
// 注意：β 的「逐場精確重現」需與 v3 完全相同的 RNG 消耗順序，於 S2.5 以 legacyV3 處理。
export function runGame(
  initial: GameState,
  rng: Rng,
  takeTurn: TakeTurn = noopTurn,
  config: RulesConfig = DEFAULT_CONFIG,
): ApplyResult {
  const s = cloneState(initial);
  const events: GameEvent[] = [];

  for (let r = 1; r <= s.maxRounds; r++) {
    s.round = r;
    s.wind = rollWind(rng);
    events.push({ kind: 'round-start', round: r, windLabel: s.wind.label });

    events.push(..._tickFaults(s));
    s.players.forEach((p) => {
      p.mwhBoostActive = false;
    });
    _drawCard(s, 0, rng, config);
    _drawCard(s, 1, rng, config);

    s.firstPlayer = ((r - 1) % 2) as 0 | 1;
    for (let turn = 0; turn < 2; turn++) {
      const p = ((s.firstPlayer + turn) % 2) as 0 | 1;
      _beginTurn(s, p);
      events.push(...takeTurn(s, p, rng));
      // S2.2 會在此插入：events.push(..._repairFaults(s, p));
    }

    events.push(..._scoreRound(s));
    _applySalt(s);
  }

  s.gameOver = true;
  events.push({ kind: 'game-over', winner: determineWinner(s) });
  return { state: s, events };
}
