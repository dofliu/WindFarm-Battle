// ============================================================
// 共用型別。core/ 為純 TS，零 UI 依賴（CLAUDE.md 架構鐵則）。
// 註：對應 cards.json(v4) 結構；文案（name/flavor/能力名稱描述）已抽到 i18n（D3）。
// ============================================================

export type CardType = 'turbine' | 'tech' | 'fault' | 'func' | 'weather' | 'contract';
export type Rarity = 1 | 2 | 3 | 4 | 5;
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * 故障分類（Route B 知識-效能模型）。
 * 技師的 specialty 若與故障的 faultCategory 相符 → 100% 修復；不符 → 50% 修復。
 */
export type FaultCategory = 'mechanical' | 'blade' | 'electrical' | 'sensor' | 'hydraulic';

/** D7：core 設計為「模式無關」，對戰與同題競賽共用同一規則引擎 */
export type GameMode = 'versus' | 'weather-challenge';

/**
 * R3 共享資源（半競爭）：同題模式每回合開出有限資源，先搶先得、搶走即對手不可用。
 *   - spare-part 備品：立即完全修復一台自家機組 drop 最高的故障（無永久損耗）
 *   - crane 吊車：立即完全修復一台自家機組最嚴重故障並復機（可解停機）
 *   - grid-priority 併網優先：本回合自家發電 +GRID_PRIORITY_MWH
 */
export type ResourceType = 'spare-part' | 'crane' | 'grid-priority';

export interface RoundResource {
  readonly id: string;
  readonly type: ResourceType;
  /** 已被哪位玩家搶走；undefined = 尚未被搶 */
  claimedBy?: 0 | 1;
}

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
  /**
   * Route B：故障卡的分類（mechanical/blade/electrical/sensor/hydraulic）。
   * 技師 specialty 相符時修復效率 100%，否則 50%。
   */
  readonly faultCategory?: FaultCategory;
  /**
   * Route B：技師卡的專長分類。
   * 與目標故障 faultCategory 相符時完全修復；不符時為部分修復（50% 效能）。
   */
  readonly specialty?: FaultCategory;
  /**
   * 卡牌插畫圖片路徑（相對於 public/），例如 "cards/M01.jpg"。
   * 有此欄位時 CardTemplate 顯示插畫，否則顯示表情符號佔位符。
   */
  readonly image?: string;
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
  /**
   * Route B 教育標記：部署時的初始可用率，部署後不再變動。
   * 若 avail < originalAvail，代表發生了部分修復損耗或鹽霧腐蝕的永久影響。
   * 讓學生直觀看到「專長不符的維修會造成長期損害」。
   */
  originalAvail?: number;
  mwBonus: number;
  faults: ActiveFault[];
  /** S3.2：部署於哪一回合（offshore-delay 用，部署當回合不結算）。createInitialState 的開局 M01 為 0。 */
  deployedRound?: number;
  /**
   * FN08 insurance-shield：保護層數。
   * 每層可抵消一次故障傷害（故障不生效）。
   * 打出 FN08 時對指定機組加 1 層；_applyFault 時若 shieldCount > 0 則消耗一層並短路。
   */
  shieldCount?: number;
  /**
   * 緊急停機：當累積故障使有效可用率 ≤ 0 時觸發。
   * 停機中機組不產 MWh、對手不能再加故障。
   * 修復需要花費 2 動作（透過 play-card 打出修復功能卡或技師）。
   */
  shutdown?: boolean;
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
  /** 本回合是否已出過技師卡（對齊寶可夢 TCG 支援者限制：一回合只能出一張）。_beginTurn 時重置。 */
  techPlayedThisRound: boolean;
  /** 本局已使用過的 once-per-game 卡 ID 清單。包含在此清單的卡不可再出。 */
  usedOncePerGame: string[];
  /** T09 func-bonus：本回合已累加的額外動作數（上限 2）。_beginTurn 時重置為 0。 */
  funcBonusThisRound: number;
  /**
   * 技師主動出招（輕模式）：本回合已出過招的技師 ID 清單。
   * 技師招式使用「獨立資源池」——每位在場技師每回合限出一招，且不消耗打牌動作。
   * _beginTurn 時重置為空陣列。
   */
  usedSkillThisRound: string[];
  /**
   * R3：本回合搶到「併網優先」資源的發電加成（MWh），_scoreRound 時計入、每回合開始歸零。
   */
  gridBonusThisRound: number;
}

export interface Wind {
  readonly roll: number | string;
  readonly speed: number;
  readonly coeff: number;
  readonly label: string;
  readonly typhoon?: boolean;
}

/** S3.6：全局生效的天氣效果（W01–W05），duration 倒數至 0 移除。雙方共享。 */
export interface ActiveWeather {
  readonly cardId: string;
  /** 剩餘生效回合數；每回合 _tickWeather 減 1，0 時移除 */
  duration: number;
  /** 由哪位玩家施加（部分效果如 mwh-double 可能未來只對施加者；目前 estimate 為全局） */
  readonly appliedBy: 0 | 1;
}

/** S3.7：合約 C01–C04 的執行期狀態。一次性條件達成即移除；持續條件用 progress 累積。 */
export interface ActiveContract {
  readonly cardId: string;
  readonly player: 0 | 1;
  /** 連續滿足條件的回合數（C01/C04 needs rounds）；一次性條件不使用 */
  progress: number;
  /** 達成後 true（事件已發出，等待 runGame 移除） */
  fulfilled: boolean;
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
  /** FN05 風能預測 D4 修正：在此預存未來風骰，下回合 startRound 會優先消費（v3 bug 修正） */
  futureWind: Wind[];
  /** S3.6：當前生效的天氣效果（duration > 0 才在此清單） */
  activeWeather: ActiveWeather[];
  /** S3.7：當前生效的合約（fulfilled=false 才需檢查；fulfilled=true 將於下次 tick 移除） */
  activeContracts: ActiveContract[];
  /** R3：本回合的共享資源（同題模式；每回合重生成）。 */
  roundResources: RoundResource[];
  gameOver: boolean;
}
