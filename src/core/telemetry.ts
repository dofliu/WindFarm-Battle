// ============================================================
// 對局遙測系統（Game Telemetry）
// 從 GameEvent[] 提取結構化對局記錄，供研究分析使用。
// 支援匯出 JSON 和 CSV 兩種格式。
// 注意：本模組僅做資料提取，不收集任何個人識別資訊。
// ============================================================

import type { GameEvent } from './events';
import type { GameState } from './types';

// ── 型別定義 ────────────────────────────────────────────────

/** 單回合記錄 */
export interface RoundRecord {
  readonly round: number;
  readonly windLabel: string;
  /** 玩家（0=人類）本回合出的牌 ID 列表 */
  readonly p0Cards: string[];
  /** AI（1）本回合出的牌 ID 列表 */
  readonly p1Cards: string[];
  /** 回合結束時玩家累積分數 */
  readonly p0Total: number;
  /** 回合結束時 AI 累積分數 */
  readonly p1Total: number;
  /** 本回合玩家得分 */
  readonly p0Mwh: number;
  /** 本回合 AI 得分 */
  readonly p1Mwh: number;
}

/** 完整對局記錄 */
export interface GameRecord {
  /** 記錄版本，供未來格式升級 */
  readonly version: '1.0';
  /** 對局 ID（時間戳 + 隨機後綴） */
  readonly gameId: string;
  /** 開始時間 ISO 8601 */
  readonly startedAt: string;
  /** 結束時間 ISO 8601 */
  readonly finishedAt: string;
  /** 難度：easy / normal / hard */
  readonly difficulty: string;
  /** 勝者：player / ai / draw */
  readonly winner: 'player' | 'ai' | 'draw';
  /** 玩家最終分數 */
  readonly p0FinalScore: number;
  /** AI 最終分數 */
  readonly p1FinalScore: number;
  /** 總回合數 */
  readonly totalRounds: number;
  /** 逐回合記錄 */
  readonly rounds: RoundRecord[];
  /** 玩家整場出牌次數 */
  readonly p0TotalCardsPlayed: number;
  /** AI 整場出牌次數 */
  readonly p1TotalCardsPlayed: number;
  /** 玩家整場出牌 ID 頻率 */
  readonly p0CardFrequency: Record<string, number>;
  /** AI 整場出牌 ID 頻率 */
  readonly p1CardFrequency: Record<string, number>;
}

// ── 主要函式 ────────────────────────────────────────────────

/**
 * 從 events 和最終 GameState 提取完整對局記錄。
 * @param events 整場對局的事件流（game-store 的 events[]）
 * @param state  遊戲結束時的 GameState
 * @param difficulty 難度字串
 * @param startedAt 對局開始時間（由呼叫端傳入）
 */
export function extractGameRecord(
  events: GameEvent[],
  state: GameState,
  difficulty: string,
  startedAt: Date,
): GameRecord {
  const finishedAt = new Date();
  const gameId = `wfb-${startedAt.getTime()}-${Math.random().toString(36).slice(2, 6)}`;

  // 逐回合提取
  const rounds = buildRoundRecords(events, state);

  // 整場統計
  const p0CardFrequency: Record<string, number> = {};
  const p1CardFrequency: Record<string, number> = {};
  let p0TotalCardsPlayed = 0;
  let p1TotalCardsPlayed = 0;

  for (const e of events) {
    if (e.kind === 'card-played') {
      if (e.player === 0) {
        p0CardFrequency[e.cardId] = (p0CardFrequency[e.cardId] ?? 0) + 1;
        p0TotalCardsPlayed++;
      } else {
        p1CardFrequency[e.cardId] = (p1CardFrequency[e.cardId] ?? 0) + 1;
        p1TotalCardsPlayed++;
      }
    }
  }

  const p0Score = state.players[0].score;
  const p1Score = state.players[1].score;
  const winner: 'player' | 'ai' | 'draw' =
    p0Score > p1Score ? 'player' : p0Score < p1Score ? 'ai' : 'draw';

  return {
    version: '1.0',
    gameId,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    difficulty,
    winner,
    p0FinalScore: p0Score,
    p1FinalScore: p1Score,
    totalRounds: state.round - 1, // round 在 gameOver 後已 +1
    rounds,
    p0TotalCardsPlayed,
    p1TotalCardsPlayed,
    p0CardFrequency,
    p1CardFrequency,
  };
}

/** 從事件流重建逐回合記錄 */
function buildRoundRecords(events: GameEvent[], state: GameState): RoundRecord[] {
  const records: RoundRecord[] = [];
  let currentRound = 0;
  let currentWind = '';
  let p0Cards: string[] = [];
  let p1Cards: string[] = [];

  // 收集每回合的 round-scored 分數
  const roundScores: Map<number, { p0Mwh: number; p1Mwh: number; p0Total: number; p1Total: number }> = new Map();

  // 先掃一遍，收集所有 round-scored 事件
  // 因為 round-scored 在 endRound 時才發出，我們需要配對
  const scoredEvents = events.filter(e => e.kind === 'round-scored');
  // 每兩個 round-scored 事件對應一個回合（p0 和 p1）
  for (let i = 0; i + 1 < scoredEvents.length; i += 2) {
    const e0 = scoredEvents[i];
    const e1 = scoredEvents[i + 1];
    if (e0.kind === 'round-scored' && e1.kind === 'round-scored') {
      const roundNum = Math.floor(i / 2) + 1;
      const p0e = e0.player === 0 ? e0 : e1;
      const p1e = e0.player === 1 ? e0 : e1;
      if (p0e.kind === 'round-scored' && p1e.kind === 'round-scored') {
        roundScores.set(roundNum, {
          p0Mwh: p0e.mwh,
          p1Mwh: p1e.mwh,
          p0Total: p0e.total,
          p1Total: p1e.total,
        });
      }
    }
  }

  // 再掃一遍，按回合分組出牌記錄
  for (const e of events) {
    if (e.kind === 'round-start') {
      if (currentRound > 0) {
        // 儲存上一回合
        const scores = roundScores.get(currentRound) ?? {
          p0Mwh: 0, p1Mwh: 0,
          p0Total: state.players[0].score,
          p1Total: state.players[1].score,
        };
        records.push({
          round: currentRound,
          windLabel: currentWind,
          p0Cards: [...p0Cards],
          p1Cards: [...p1Cards],
          p0Total: scores.p0Total,
          p1Total: scores.p1Total,
          p0Mwh: scores.p0Mwh,
          p1Mwh: scores.p1Mwh,
        });
      }
      currentRound = e.round;
      currentWind = e.windLabel;
      p0Cards = [];
      p1Cards = [];
    } else if (e.kind === 'card-played') {
      if (e.player === 0) p0Cards.push(e.cardId);
      else p1Cards.push(e.cardId);
    }
  }

  // 儲存最後一回合
  if (currentRound > 0) {
    const scores = roundScores.get(currentRound) ?? {
      p0Mwh: 0, p1Mwh: 0,
      p0Total: state.players[0].score,
      p1Total: state.players[1].score,
    };
    records.push({
      round: currentRound,
      windLabel: currentWind,
      p0Cards: [...p0Cards],
      p1Cards: [...p1Cards],
      p0Total: scores.p0Total,
      p1Total: scores.p1Total,
      p0Mwh: scores.p0Mwh,
      p1Mwh: scores.p1Mwh,
    });
  }

  return records;
}

// ── 匯出函式 ────────────────────────────────────────────────

/** 下載 JSON 格式的對局記錄 */
export function downloadGameRecordJson(record: GameRecord): void {
  const json = JSON.stringify(record, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `windfarm-battle-${record.gameId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 下載 CSV 格式的逐回合記錄（適合 Excel / SPSS 分析） */
export function downloadGameRecordCsv(record: GameRecord): void {
  const lines: string[] = [];

  // 標頭行
  lines.push([
    'gameId', 'difficulty', 'winner', 'round', 'windLabel',
    'p0Cards', 'p1Cards',
    'p0Mwh', 'p1Mwh',
    'p0Total', 'p1Total',
  ].join(','));

  // 逐回合資料行
  for (const r of record.rounds) {
    lines.push([
      record.gameId,
      record.difficulty,
      record.winner,
      r.round,
      `"${r.windLabel}"`,
      `"${r.p0Cards.join(';')}"`,
      `"${r.p1Cards.join(';')}"`,
      r.p0Mwh,
      r.p1Mwh,
      r.p0Total,
      r.p1Total,
    ].join(','));
  }

  const csv = lines.join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `windfarm-battle-${record.gameId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
