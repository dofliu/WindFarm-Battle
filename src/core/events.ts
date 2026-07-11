// ============================================================
// 事件流：core 把每次狀態變化吐成結構化事件。
// 一條流，多方消費：UI 戰況記錄、動畫/音效、研究遙測。
// ============================================================
import type { GameEvent as TypeGameEvent, ApplyResult as TypeApplyResult } from './types';

export type GameEvent = TypeGameEvent;
export type ApplyResult = TypeApplyResult;
export type EventLog = GameEvent[];
export type { GameState } from './types';
