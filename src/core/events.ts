// ============================================================
// 事件流：core 把每次狀態變化吐成結構化事件。
// 一條流，多方消費：UI 戰況記錄（S5）、動畫/音效（D9）、研究遙測（D10）。
// ============================================================
import type { GameState } from './types';

export type GameEvent =
  | { kind: 'round-start'; round: number; windLabel: string }
  | { kind: 'card-played'; player: 0 | 1; cardId: string }
  | { kind: 'card-drawn'; player: 0 | 1; cardId: string }
  | { kind: 'card-discarded'; player: 0 | 1; cardId: string }
  | { kind: 'turbine-shutdown'; player: 0 | 1; turbineIdx: number; cardId: string }
  | { kind: 'turbine-restart'; player: 0 | 1; turbineIdx: number; cardId: string }
  | { kind: 'turbine-deployed'; player: 0 | 1; cardId: string }
  | { kind: 'turbine-replaced'; player: 0 | 1; oldCardId: string; newCardId: string }
  | { kind: 'turbine-returned'; player: 0 | 1; cardId: string }
  | { kind: 'turbine-upgraded'; player: 0 | 1; cardId: string; bonus: number }
  | { kind: 'turbine-evolved'; player: 0 | 1; fromCardId: string; toCardId: string; turbineIdx: number }
  | { kind: 'tech-deployed'; player: 0 | 1; cardId: string }
  | { kind: 'fault-applied'; player: 0 | 1; targetIdx: number; cardId: string; drop: number }
  | { kind: 'fault-cascaded'; player: 0 | 1; targetIdx: number; cardId: string }
  /** FN08 insurance-shield：打出保險卡，機組獲得保護層 */
  | { kind: 'turbine-shielded'; player: 0 | 1; turbineIdx: number; cardId: string; shieldCount: number }
  /** FN08 insurance-shield：保護層吸收了一次故障，故障短路 */
  | { kind: 'shield-absorbed'; player: 0 | 1; turbineIdx: number; faultCardId: string; shieldLeft: number }
  | { kind: 'fault-repaired'; player: 0 | 1; targetIdx: number; cardId: string; by?: string; quality?: 'full' | 'partial'; availLost?: number }
  /** 技師主動出招（輕模式）：某位在場技師對自家機組發動招式（P1：快修） */
  | { kind: 'skill-used'; player: 0 | 1; techId: string; turbineIdx: number; skill: string }
  | { kind: 'func-played'; player: 0 | 1; cardId: string; effect: string }
  | { kind: 'predict-wind'; player: 0 | 1; labels: string[] }
  /** T05 fault-warning：對手 T05 在本回合開始時預警 1 種故障（warnedPlayer 是被預警的玩家） */
  | { kind: 'fault-warning'; warnedPlayer: 0 | 1; faultCardId: string }
  /** T08 peek-hand：部署時查看對手手牌（cardIds 是被查看的卡牌 id） */
  | { kind: 'peek-hand'; player: 0 | 1; cardIds: string[] }
  /** T09 func-bonus：每次出 func 卡觸發，本回合 +1 動作（最多累加 +2） */
  | { kind: 'func-bonus'; player: 0 | 1; actionsGained: number; totalBonus: number }
  | { kind: 'extra-action-banked'; player: 0 | 1; pending: number }
  | { kind: 'mwh-boost'; player: 0 | 1 }
  | { kind: 'turn-ended'; player: 0 | 1 }
  | { kind: 'weather-applied'; player: 0 | 1; cardId: string; duration: number }
  | { kind: 'weather-expired'; cardId: string }
  | { kind: 'tutor-turbine'; player: 0 | 1; cardId: string }
  | { kind: 'contract-applied'; player: 0 | 1; cardId: string }
  | { kind: 'contract-progress'; player: 0 | 1; cardId: string; progress: number }
  | { kind: 'contract-fulfilled'; player: 0 | 1; cardId: string; reward: number }
  /** 對手搶先達成合約目標，打出者失去獎勵機會 */
  | { kind: 'contract-stolen'; stolenBy: 0 | 1; cardId: string }
  | { kind: 'round-scored'; player: 0 | 1; mwh: number; total: number }
  | { kind: 'game-over'; winner: 0 | 1 | -1 };

export type EventLog = GameEvent[];

/** 純函式動作的統一回傳：新狀態 + 本次產生的事件。 */
export interface ApplyResult {
  readonly state: GameState;
  readonly events: GameEvent[];
}
