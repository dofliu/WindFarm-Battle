// ============================================================
// 共用型別。core/ 為純 TS，零 UI 依賴（CLAUDE.md 架構鐵則）。
// 註：對應 cards.json(v4) 結構；文案（name/flavor/能力名稱描述）已抽到 i18n（D3）。
// ============================================================

export type CardType = 'turbine' | 'tech' | 'fault' | 'func' | 'weather' | 'contract';
export type Rarity = 1 | 2 | 3 | 4 | 5;
export type Difficulty = 'easy' | 'medium' | 'hard';

/** D7：core 設計為「模式無關」，對戰與同題競賽共用同一規則引擎 */
export type GameMode = 'versus' | 'weather-challenge';

// 文案（name/desc）已抽到 i18n（D3）；這裡只留結構/數值。
export interface Ability {
  readonly tag: string;
  readonly value?: number;
}

export interface ContractTarget {
  readonly type: string;
  readonly threshold?: number;
  readonly rounds?: number;
  readonly reward: number;
}

/** 單張卡牌的靜態定義（資料權威來源＝cards.json；文案在 i18n） */
export interface Card {
  readonly id: string;
  readonly type: CardType;
  readonly icon: string;
  readonly cost: number;
  readonly rarity?: Rarity;
  readonly legendary?: boolean;
  readonly iec: string;
  readonly abilities: readonly Ability[];
  readonly stats?: Readonly<Record<string, number>>;
  readonly counters?: readonly string[];
  readonly required?: readonly string[];
  readonly cascade?: number;
  readonly spreading?: boolean;
  readonly special?: string;
  readonly effect?: string;
  readonly duration?: number;
  readonly target?: ContractTarget;
}

// ---------- 以下為遊戲執行期狀態（Sprint 2 補完整動作邏輯） ----------

export interface ActiveFault {
  readonly cardId: string;
  roundsLeft: number;
  sev: number;
  drop: number;
}

export interface DeployedTurbine {
  readonly cardId: string;
  avail: number;
  mwBonus: number;
  faults: ActiveFault[];
}

export interface PlayerState {
  readonly name: string;
  deck: string[];
  hand: string[];
  turbines: DeployedTurbine[];
  techs: string[];
  score: number;
  pendingExtraActions: number;
  mwhBoostActive: boolean;
}

export interface Wind {
  readonly roll: number | string;
  readonly speed: number;
  readonly coeff: number;
  readonly label: string;
  readonly typhoon?: boolean;
}

export interface GameState {
  round: number;
  readonly maxRounds: number;
  readonly mode: GameMode;
  wind: Wind;
  currentPlayer: 0 | 1;
  firstPlayer: 0 | 1;
  actionsLeft: number;
  players: readonly [PlayerState, PlayerState];
  gameOver: boolean;
}
