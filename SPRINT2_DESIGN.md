# 🏗️ Sprint 2 設計草案 — core 重構（27 張 + 對齊 + i18n）

> 依 CLAUDE.md 規則 1「先架構後實作」。**本文件僅設計，未寫任何實作碼。**
> 目標：把 v3 的遊戲邏輯重構成純 TS 的 `core/`，行為對齊 v3（D2），並把卡牌文案抽到 i18n（D3）。
> 狀態：等 Dof 確認第 7 節「對齊策略」與整體範圍後才動工。

---

## 1. Sprint 2 範圍與「對齊」的正確定義

### 做什麼
- 把 v3 的核心規則重寫為 `core/` 純函式（不可變更新、可注入 RNG、會吐事件流）。
- 補齊 AI（評估／局勢／難度／出牌迴圈）與模擬器。
- 建立**對齊測試**：證明新引擎能重現 v3 的行為。
- 把 `cards.json` 的文案抽到 `i18n/`（D3）。

### ⚠️ 「對齊」是「機制層級」，不是「逐卡」
重要澄清：**A 區 27 張的卡 ID 雖與 v3 相同，但它們在 cards.json(v4) 的能力比 v3 實作的多**。例如：
- v3 的 M07＝cost2「big-fail」弱點機；v4＝cost5 傳奇（aura-mw／weather-immune／card-draw-trigger）。
- v4 才有的：M03 lowwind-resist、M05 offshore-delay、T05 predict/warning、T06 periodic-repair、F05 storm-amplify…，**v3 都沒實作**。

所以對齊的對象是「**v3 真正跑過的那批機制**」（風速、結算、基本克制/修復、cascade、spreading、salt、動作經濟、FN01–06、T07 加動作/折扣）。
v4 在這些卡上**新增**的 tag 能力，與 B 區 20 張一樣屬「無原型基準、依文件重建（估計）」。

→ 結論：Sprint 2 交付「**對齊 v3 機制的引擎** + **這些卡的 v4 新 tag（估計）**」。對齊測試只驗證前者。

---

## 2. 檔案結構（Sprint 2 新增/擴充）

```
src/core/
├── types.ts          [擴充] 動作型別、能力 tag、完整 GameState
├── rng.ts            [已有]
├── cards.ts          [擴充] 依 tag/counter 查詢輔助
├── events.ts         [已有/微調]
├── game-state.ts     [擴充] createInitialState 完整化（發牌、初始 M01、先後手）
├── rules-engine.ts   [核心] 風速/結算/故障/克制修復/cascade/spreading/salt/勝負
├── actions.ts        [新] applyAction：playCard / endTurn（不可變 + 產生事件）
├── abilities.ts      [新] tag → 效果的資料驅動註冊表（hook 制）
└── ai/
    ├── evaluator.ts  [擴充] evaluateTurbine/Tech/Fault/Func
    ├── strategy.ts   [擴充] getStrategy（phase/position）
    ├── difficulty.ts [擴充] aiChoose 依難度
    └── index.ts      [新] generateActions / aiTakeTurn
src/core/simulation/
└── runner.ts         [新] simulate(N 場)→統計（對齊與 S6 共用）

src/data/cards.json   [改] 移除文案欄位，只留結構/數值（值不變）
src/i18n/
├── zh-TW.ts          [擴充] 47 張卡文案：cards.<id>.name / .flavor / .ability.<i>.name|desc
└── index.ts          [已有]

tests/
├── rules/*.test.ts       [新] 克制矩陣、結算、cascade、spreading、salt、動作經濟、勝負
├── ai/*.test.ts          [新] 評估函式行為
├── fixtures/cards-v3parity.ts  [新] v3 的 27 卡以新 schema 表示（對齊用）
├── golden/v3-baseline.json     [新] v3 邏輯在固定 seed 的黃金樣本
└── alignment.test.ts     [新] 新引擎重現 v3
```

---

## 3. 關鍵介面設計（草案）

### 3.1 不可變動作（actions.ts）
v3 是直接 mutate 全域 `game`；新版改為**純函式回傳新狀態 + 事件**。

```ts
export type Action =
  | { kind: 'play-card'; player: 0 | 1; handIdx: number; target?: number; replaceIdx?: number }
  | { kind: 'end-turn'; player: 0 | 1 };

export interface ApplyResult {
  readonly state: GameState;     // 新狀態（不改入參）
  readonly events: GameEvent[];  // 本次動作產生的事件流
}

export function applyAction(state: GameState, action: Action, rng: Rng): ApplyResult;
export function legalActions(state: GameState, player: 0 | 1): Action[]; // canPlay 過濾
```
> 不可變策略：以「clone-on-write」輔助函式產生新狀態（先求正確；1000 場模擬若有效能瓶頸再做結構共享優化）。

### 3.2 規則引擎（rules-engine.ts，純函式）
```ts
export function rollWind(rng: Rng): Wind;                       // ✅ 已對齊 v3
export function startRound(state: GameState, rng: Rng): ApplyResult;  // 故障倒數/擴散→抽牌→設動作
export function scoreRound(state: GameState): ApplyResult;      // Σ mw×coeff×(avail/100)，四捨五入
export function repairFaults(state: GameState, player: 0 | 1): ApplyResult; // counter+required gate
export function endRound(state: GameState, rng: Rng): ApplyResult;    // 結算+salt(每4回合)+換手+下回合
```
**克制 gate（對齊 v3 processAutoRepair）**：技師可修 ⇔ `tech.counters` 含此故障 **且**（故障無 `required` 或 `required` 含此技師）。

**結算（對齊 v3 endRound）**：`mwh = Σ (mw+mwBonus) × wind.coeff × max(0, avail−ΣfaultDrop)/100`；`mwhBoostActive` 則 ×1.5；`Math.round`。

### 3.3 能力 tag 註冊表（abilities.ts，資料驅動）
v3 用扁平 `special`；新版用 hook 制，依 tag 在不同時點觸發。新增能力＝加一筆註冊，不改引擎主體（CLAUDE.md 規則 4）。

```ts
export interface AbilityHooks {
  auraMwBonus?: (ctx: Ctx) => number;        // 例：M07 aura-mw → 全機 +1
  actionBonus?: (ctx: Ctx) => number;        // 例：T07 aura-action → +1 動作
  costModifier?: (ctx: Ctx, card: Card) => number; // 例：T07 技師 -1、T09 功能 -1
  onDeploy?: (ctx: Ctx) => Patch;            // 例：T06 instant-repair
  weatherImmune?: boolean;                   // 例：M07
  faultImmune?: (faultId: string) => boolean;// 例：M09 immune-hydraulic、M10 fault-immune
  // ... B 區再擴充
}
export const ABILITY_TABLE: Readonly<Record<string /*tag*/, AbilityHooks>>;
```
> Sprint 2 先實作 v3 真正有的 hook（aura-action/tech-discount、salt、storm-vulnerable、big-fail、cascade、spreading、free-repair、FN01–06）。v4 新 tag（aura-mw、weather-immune…）標 `// 估計`，並寫該卡的行為測試（依 DESIGN.md）。

### 3.4 AI（ai/，對齊 v3 評估函式）
```ts
export interface Strategy { phase:'early'|'mid'|'late'; position:'winning'|'even'|'losing';
  myMWhPerRound:number; oppMWhPerRound:number; scoreDiff:number; roundsLeft:number; }
export function getStrategy(state: GameState, player: 0|1): Strategy;

export interface ScoredAction { action: Action; score: number; desc: string; }
export function generateActions(state: GameState, player: 0|1): ScoredAction[];
export function aiChoose(state: GameState, player: 0|1, diff: Difficulty, rng: Rng): Action | null;
export function aiTakeTurn(state: GameState, player: 0|1, diff: Difficulty, rng: Rng): ApplyResult;
```
評估係數、難度行為（easy 50% 取 top3／medium 25% 取次優／hard 取最優）、`AI_AVG_WIND_COEFF=0.65`、保留行動門檻（score<−10）皆**逐一對齊 v3 數值**。

### 3.5 模擬器（simulation/runner.ts）
```ts
export interface SimResult { p1Score:number; p2Score:number; winner:0|1|-1; }
export interface SimSummary {
  games:number; p1WinRate:number; p2WinRate:number; drawRate:number;
  avgP1:number; avgP2:number; closeRate:number /*≤5*/; blowoutRate:number /*≥30*/;
  cardUsage: Record<string, number>;
}
export function simulate(opts: {
  p1: Difficulty; p2: Difficulty; games: number; seed: number;
  dataset?: 'v4' | 'v3parity';   // 對齊用 v3parity；正式平衡用 v4
}): SimSummary;
```
CLI 入口（`npm run simulate -- --games 1000 --p1 hard --p2 hard`）留到 S6 接，runner 本體在此完成。

---

## 4. i18n 文案抽取（D3）

`cards.json` 只留結構/數值，**所有數值不動**（HANDOFF 鐵則）；只把文字搬走。

```jsonc
// 之前
"M07": { "id":"M07","type":"turbine","name":"天鯨 12MW","cost":5,"rarity":5,
  "stats":{"mw":12,"avail":88},"flavor":"像鯨魚般…",
  "abilities":[{"name":"穩定巨擘","tag":"aura-mw","value":1,"desc":"在場時…"}] }
// 之後（cards.json）
"M07": { "id":"M07","type":"turbine","cost":5,"rarity":5,
  "stats":{"mw":12,"avail":88},
  "abilities":[{"tag":"aura-mw","value":1}] }
```
```ts
// i18n/zh-TW.ts 新增
'cards.M07.name': '天鯨 12MW',
'cards.M07.flavor': '像鯨魚般乘風破浪…',
'cards.M07.ability.0.name': '穩定巨擘',
'cards.M07.ability.0.desc': '在場時，你所有風機 +1MW',
```
- `Card` 型別移除 `name/flavor/abilities[].name/desc`；新增 `t.card(id)` 等取字串輔助。
- 現有 `App.tsx` 不讀卡名（只用數量與類別 label），**不受影響**。
- 寫一支一次性 migration 腳本做抽取，避免手工 47 張出錯（產出後我會給你 diff 對照，確認數值零變動）。

---

## 5. 拆成小 PR（CLAUDE.md：避免一次 500+ 行）

| 步 | 內容 | 產出/驗收 |
|---|---|---|
| **S2.0** | i18n 文案抽取 + cards.json 瘦身 | 數值零變動 diff；既有測試仍綠 |
| **S2.1** | types/game-state/rules-engine 核心迴圈（風速/結算/動作經濟/勝負） | 單元測試：結算公式、12 回合流程 |
| **S2.2** | 故障系統（施加/克制 gate/cascade/spreading/salt/修復） | 克制矩陣全測試 |
| **S2.3** | actions.ts + 事件流串接（playCard/endTurn/替換） | 動作合法性、事件正確 |
| **S2.4** | AI（evaluator/strategy/difficulty/generateActions/aiTakeTurn） | 評估行為測試 |
| **S2.5** | simulation/runner + 黃金樣本 + 對齊測試 | 對齊通過（見第 7 節） |

每步都可獨立 commit、可運行、測試綠。

---

## 6. 影響範圍

- **動到**：`src/core/*`、`src/data/cards.json`（僅搬文字）、`src/i18n/*`、`src/core/types.ts`、新增 `tests/*`。
- **不動**：`App.tsx`／UI（S5 才做）、`prototypes/`（設計史）、設定檔。
- **相容性**：`createInitialState(mode)` 維持模式無關（D7），對戰邏輯不寫死。

---

## 7. ⭐ 需 Dof 決策：對齊策略

新引擎要怎麼「證明對齊 v3」？兩種，影響要寫多少程式：

**α（建議）行為對齊 + 統計回歸**
- 用單元測試把 v3 的每條規則寫成明確預期（克制 gate、結算、cascade、salt、動作經濟…）。
- 再跑統計回歸：新引擎＋`v3parity` 資料集、固定 seed、2000 場，檢查總體指標落在 v3 基準容差內（勝率≈50/50、平均分數、分佈）。
- 對 D4 已修的 bug（FN05/棄牌堆/T01 上限）測「修正後」的正確行為。
- 優點：穩健、貼近我們其實要改 bug 的事實。

**β 逐場精確重現**
- 額外加一個 `legacyV3` 引擎旗標（關閉 D4 修正、用 v3parity 資料），對同一批 seed **逐場分數完全相等** v3 黃金樣本。
- 優點：最強保證、論文最好說明「重構不改變行為」。
- 代價：多一套 legacy 分支要維護。

> 我建議 **α**；若你重視論文要「可證明等價」，可加做 **β**（兩者不衝突，β 是 α 的加強）。

### ✅ 決議（2026-05-21）：採 **α + β**
- α：行為單元測試 + 統計回歸（v3parity 資料、固定 seed、2000 場、容差比對）。
- β：新增 `legacyV3` 引擎模式（關閉 D4 修正、用 v3parity 資料），對固定 seed **逐場分數精確等於** v3 神諭。
- **β 實作關鍵**：`legacyV3` 必須與 v3 **相同順序消耗注入的 seeded RNG**（rollWind 的 1~2 次、Fisher-Yates 洗牌、cascade 擲骰、AI easy/medium 的難度選擇）。
- **v3 神諭**：把 v3 `<script>` 的純邏輯（DOM 打樁、`Math.random`→注入 RNG）凍結為 `tests/fixtures/v3-oracle.mjs`，黃金樣本由它在固定 seed 產生，存 `tests/golden/v3-baseline.json`。
- 風險：RNG 呼叫順序對齊需細心，可能需迭代；若某機制無法逐場對齊，先以 α 容差通過並在測試標註原因。

---

## 8. 預估與風險

**預估**：S2.0 小；S2.1–S2.2 是重頭（規則正確性）；S2.4 AI 中等；S2.5 對齊。建議逐步交付，每步給你看測試結果。

| 風險 | 等級 | 緩解 |
|---|---|---|
| 不可變更新拖慢 1000 場模擬 | 🟡 | 先求正確，再做結構共享優化；runner 可用輕量 clone |
| tag 系統涵蓋不全 | 🟡 | S2 只做 v3 機制 + 這些卡的 v4 新 tag；B 區留 S3 |
| i18n 抽取改到數值 | 🟢 | 自動腳本 + diff 驗證數值零變動 |
| 對齊過脆（α 統計波動） | 🟢 | 用固定 seed + 容差；必要時升級 β |

---

## 9. 下一步
1. 你確認 **第 7 節對齊策略（α / α+β）** 與整體範圍。
2. 確認後我從 **S2.0（i18n 抽取）** 開始，逐步交付、每步測試綠燈給你看。

> 在你確認前不寫實作碼、不做 git。
