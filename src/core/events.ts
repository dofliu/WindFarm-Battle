// ============================================================
// 事件流：core 把每次狀態變化吐成結構化事件。
// 一條流，多方消費：UI 戰況記錄（S5）、動畫/音效（D9）、研究遙測（D10）。
// ============================================================
import type { GameState } from './types';

export type GameEvent =
  | { kind: 'round-start'; round: number; windLabel: string }
  | { kind: 'card-played'; player: 0 | 1; cardId: string }
  | { kind: 'turbine-deployed'; player: 0 | 1; cardId: string }
  | { kind: 'turbine-replaced'; player: 0 | 1; oldCardId: string; newCardId: string }
  | { kind: 'tech-deployed'; player: 0 | 1; cardId: string }
  | { kind: 'fault-applied'; player: 0 | 1; targetIdx: number; cardId: string; drop: number }
  | { kind: 'fault-cascaded'; player: 0 | 1; targetIdx: number; cardId: string }
  | { kind: 'fault-repaired'; player: 0 | 1; targetIdx: number; cardId: string; by?: string }
  | { kind: 'round-scored'; player: 0 | 1; mwh: number; total: number }
  | { kind: 'game-over'; winner: 0 | 1 | -1 };

export type EventLog = GameEvent[];

/** 純函式動作的統一回傳：新狀態 + 本次產生的事件。 */
export interface ApplyResult {
  readonly state: GameState;
  readonly events: GameEvent[];
}
