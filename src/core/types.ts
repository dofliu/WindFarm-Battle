// ============================================================
// 共用型別。core/ 為純 TS，零 UI 依賴。
// ============================================================

export type CardType = 'tech' | 'tool' | 'item' | 'contract' | 'fault' | 'turbine';
export type Rarity = 1 | 2 | 3 | 4 | 5;
export type Difficulty = 'easy' | 'medium' | 'hard';
export type FaultCategory = 'mechanical' | 'blade' | 'electrical' | 'sensor' | 'hydraulic';
export type GameMode = 'versus' | 'weather-challenge';

// 技師等級 1 = 初階, 2 = 高級, 3 = 資深
export type TechLevel = 1 | 2 | 3;

export interface Ability {
  readonly tag: string;
  readonly value?: number;
}

export interface Skill {
  readonly tag: string;
  readonly staminaCost: number;
  readonly repairPower?: number;
  readonly availBoost?: number;
  readonly mwBoost?: number;
  readonly desc?: string;
  readonly specialtyMatchesOnly?: boolean;
  /** 特殊效果 tag（cards-v2 資料為單一字串，如 "predict-wind"、"prevent-fault-30"） */
  readonly special?: string;
}

/** 技師技能定義（分等級） */
export interface TechSkills {
  readonly lv1: Skill;
  readonly lv2: Skill;
  readonly lv3: Skill;
}

/** 單張卡牌的靜態定義（資料權威來源＝cards.json） */
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
  readonly image?: string;
  
  // 技師專屬
  readonly specialty?: FaultCategory;
  readonly skills?: TechSkills;

  // 故障專屬 (由環境引擎生成時載入定義)
  readonly faultCategory?: FaultCategory;
  readonly severity?: number;
  readonly drop?: number;
  readonly duration?: number;

  // 工具/道具/合約專屬
  readonly effect?: string;
  readonly value?: number;
  readonly multiplier?: number;
  readonly oncePerGame?: boolean;
}

// ---------- 執行期狀態 ----------

export interface ActiveFault {
  readonly cardId: string; // 故障卡 ID 參照
  readonly faultCategory: FaultCategory;
  roundsLeft: number;
  readonly sev: number;
  readonly drop: number;
}

/** 風場機組狀態 */
export interface DeployedTurbine {
  readonly id: string; // 'OS8' | 'OS10' | 'OS12'
  readonly mw: number;
  mwBonus: number;
  avail: number;
  originalAvail: number; // 初始可用率（用來計算永久損失）
  faults: ActiveFault[];
  shutdown: boolean;
  faultImmuneRounds: number; // 免疫故障的剩餘回合數 (IT05 等效果)
}

/** 場上部署的技師 */
export interface DeployedTech {
  readonly cardId: string;
  level: TechLevel;
  stamina: number;
  maxStamina: number;
  roundsOnField: number;
  attachedToolId: string | null;
  usedSkillThisTurn: boolean;
  /** IT13 安全講習：>0 時該回合結算不消耗疲勞（每回合 -1）。未設視為 0。 */
  staminaShieldRounds?: number;
}

export interface FieldState {
  active: DeployedTech | null; // 主力技師
  bench: DeployedTech[];       // 備戰區技師 (最多 3)
}

export interface ActiveContract {
  readonly cardId: string;
  readonly player: 0 | 1;
  durationLeft: number; // 持續回合數
  readonly multiplier: number;
}

export interface PlayerState {
  readonly name: string;
  deck: string[];
  hand: string[];
  field: FieldState;
  windFarm: DeployedTurbine[];
  retired: string[]; // 已力竭下場的技師卡 ID
  score: number; // 累積發電量 (MWh)
  
  // 每回合限制標記
  techPlayedThisTurn: boolean;
  toolPlayedThisTurn: boolean;
  contractPlayedThisTurn: boolean;
  retreatedThisTurn: boolean;
  activeContracts: ActiveContract[];
  usedOncePerGame: string[];
}

export interface Wind {
  readonly roll: number;
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
  waveHeight: number; // 浪高 1-4
  currentPlayer: 0 | 1;
  players: readonly [PlayerState, PlayerState];
  /** 環境事件隨機 Seed，確保雙方面對相同的風速/浪高/故障 */
  readonly environmentSeed: number;
  gameOver: boolean;
}

export type GameEvent =
  | { kind: 'round-start'; round: number; windLabel: string; waveHeight: number }
  | { kind: 'card-played'; player: 0 | 1; cardId: string }
  | { kind: 'card-drawn'; player: 0 | 1; cardId: string }
  | { kind: 'card-discarded'; player: 0 | 1; cardId: string }
  | { kind: 'tech-deployed'; player: 0 | 1; cardId: string; position: 'active' | 'bench' }
  | { kind: 'tech-promoted'; player: 0 | 1; cardId: string; benchIdx: number }
  | { kind: 'tech-retired'; player: 0 | 1; cardId: string }
  | { kind: 'tool-attached'; player: 0 | 1; toolId: string; techCardId: string }
  | { kind: 'item-played'; player: 0 | 1; cardId: string; targetTurbineId?: string }
  | { kind: 'contract-played'; player: 0 | 1; cardId: string }
  | { kind: 'contract-expired'; player: 0 | 1; cardId: string }
  | { kind: 'fault-applied'; player: 0 | 1; turbineId: string; cardId: string; drop: number }
  | { kind: 'fault-repaired'; player: 0 | 1; turbineId: string; cardId: string; byTechCardId?: string; quality?: 'full' | 'partial'; availLost?: number }
  | { kind: 'skill-used'; player: 0 | 1; techId: string; skillTag: string; turbineId?: string }
  | { kind: 'stamina-depleted'; player: 0 | 1; techId: string }
  | { kind: 'tech-evolved'; player: 0 | 1; techId: string; level: TechLevel }
  | { kind: 'turbine-shutdown'; player: 0 | 1; turbineId: string }
  | { kind: 'turbine-restart'; player: 0 | 1; turbineId: string }
  | { kind: 'round-scored'; player: 0 | 1; mwh: number; total: number }
  | { kind: 'turn-ended'; player: 0 | 1 }
  | { kind: 'game-over'; winner: 0 | 1 | -1 }
  | { kind: 'incident'; round: number; faultCardId: string; turbineId: string }
  | { kind: 'retreat'; player: 0 | 1; benchIdx: number }
  | { kind: 'turbine-shielded'; player: 0 | 1; turbineId: string; cardId: string; shieldCount: number }
  | { kind: 'shield-absorbed'; player: 0 | 1; turbineIdx: number; faultCardId: string; shieldLeft: number }
  | { kind: 'turbine-upgraded'; player: 0 | 1; cardId: string; bonus: number }
  | { kind: 'predict-wind'; player: 0 | 1; labels: string[] }
  /** 補血系：技師疲勞度回復（道具 IT10-12 / 技能 self-recharge / TL10 自動回充） */
  | { kind: 'stamina-restored'; player: 0 | 1; techId: string; amount: number };

export interface ApplyResult {
  readonly state: GameState;
  readonly events: GameEvent[];
}

