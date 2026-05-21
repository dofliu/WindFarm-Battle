# CLAUDE.md — WindFarm Battle 專案工作規範（v2）

> 本檔案是 Claude Code 在本專案中的標準作業規範。**每次新對話開始前請先讀完。**

---

## 🎯 專案上下文

**專案名稱**：WindFarm Battle（風場大戰）
**主導者**：劉瑞弘 副教授（NCUT 智慧自動化工程系 / DOF Lab）
**目標**：教學遊戲化的風場運維卡牌遊戲

**當前階段**：從 HTML 原型重構為正式專案（React + TypeScript + Capacitor）

**必讀文件順序**：
1. `HANDOFF.md` — 從這開始
2. `PROJECT_STATUS.md` — 詳細進度
3. `DESIGN.md` — 完整設計（**最重要**）
4. `VISUAL_WORKFLOW.md` — 視覺工作流（**新**）⭐
5. `CARD_PROMPTS.md` — AI 插畫 prompt 庫
6. `ROADMAP.md` — 未來計畫
7. `data/cards.json` — 卡牌資料
8. `prototypes/v4-expansion.html` — 親自玩過

---

## 📐 程式碼規範

### TypeScript

- **嚴格模式**：`strict: true`
- **無 any**：所有型別明確標註
- **介面優於類別**：能用 interface 就不用 class
- **不可變優先**：盡量使用 `const`、`readonly`、`as const`

### 命名規範

```typescript
// ✅ 變數、函式：camelCase
const playerScore = 100;
function calculateMWh(turbine) { ... }

// ✅ 型別、介面、Class：PascalCase
interface GameState { ... }
type CardType = 'turbine' | 'tech' | 'fault';

// ✅ 常數：UPPER_SNAKE_CASE
const MAX_ROUNDS = 12;
const AVG_WIND_COEFF = 0.65;

// ✅ 檔案名：kebab-case
// game-state.ts, ai-evaluator.ts

// ✅ React 元件檔：PascalCase
// PlayerArea.tsx, CardComponent.tsx
```

### 註解

- **中文註解優先**（Dof 母語為中文）
- 註解寫「為什麼」，不寫「做什麼」（程式碼自己會說）
- 複雜邏輯前用 JSDoc 標註

```typescript
/**
 * 評估施加故障的價值
 *
 * 核心邏輯：傷害期望 × 持續回合，但要扣除被克制的風險。
 * 如果對手有 required 技師卻沒在場，分數會大幅提升（無法修復）。
 */
function evaluateFaultPlay(card: FaultCard, target: Turbine, ...): number {
  // ...
}
```

---

## 🏗️ 架構規範

### 分層原則

```
┌─────────────────────────────┐
│ UI (React, can be replaced) │ ← 介面層，可換平台
├─────────────────────────────┤
│ State (Zustand)             │
├─────────────────────────────┤
│ Core (Pure TS, NO UI deps)  │ ← 必須保持平台無關
├─────────────────────────────┤
│ Template (Card Rendering)   │ ← 卡牌模板系統（新）
├─────────────────────────────┤
│ Data (JSON)                 │
└─────────────────────────────┘
```

**鐵則：core/ 不可 import 任何 React、UI 框架、瀏覽器 API**

```typescript
// ❌ 不允許
import { useState } from 'react';
import { localStorage } from 'browser';

// ✅ 允許
import { GameState } from './types';
import { CARDS } from '../data/cards.json';
```

### 檔案組織

```
src/
├── core/
│   ├── types.ts           # 共用型別
│   ├── cards.ts           # 卡牌資料載入
│   ├── game-state.ts      # 遊戲狀態與動作
│   ├── rules-engine.ts    # 規則邏輯
│   ├── ai/
│   │   ├── evaluator.ts   # 評估函式
│   │   ├── strategy.ts    # 局勢判斷
│   │   └── difficulty.ts  # 難度系統
│   └── simulation/
│       └── runner.ts      # 模擬器
├── ui/
│   ├── components/        # 純展示元件
│   ├── containers/        # 連接狀態的容器
│   └── styles/
├── template/              # 卡牌模板系統（新）
│   ├── CardTemplate.tsx
│   ├── CardRenderer.tsx
│   ├── CardExporter.tsx
│   └── BatchProcessor.ts
├── store/
│   └── game-store.ts      # Zustand store
└── tests/
```

---

## 🎨 視覺工作流規範（新增）⭐

### 鐵則

1. **AI 只生純插畫**，不生完整卡片
2. **模板提供統一框架**（所有卡用同一個版面結構）
3. **資料由 cards.json 驅動**（卡名、能力、數據從資料填入，不寫死）

### 模板元件設計原則

```typescript
// ✅ 正確：模板元件吃資料，產出視覺
<CardTemplate
  cardData={cards.M07}      // 從 cards.json 來
  artImage="/art/m07.png"   // 純插畫
  size="medium"
/>

// ❌ 錯誤：硬編碼卡牌資訊
<CardTemplate
  name="天鯨 12MW"
  cost={5}
  abilities={[...]}
/>
```

### 卡牌類別視覺對應

| 卡類 | CSS 類別 | 邊框色 | 用途 |
|---|---|---|---|
| turbine | `.card-turbine` | 藍色漸層 | 機組 |
| tech | `.card-tech` | 綠色漸層 | 技師 |
| fault | `.card-fault` | 紅色漸層 | 故障 |
| func | `.card-func` | 粉色漸層 | 功能 |
| weather | `.card-weather` | 黃色漸層 | 天氣 |
| contract | `.card-contract` | 紫色漸層 | 合約 |
| (legendary) | `.card-legendary` | 金色發光特效 | 任何稀有度=5的卡 |

詳見 `VISUAL_WORKFLOW.md`。

---

## ✅ 開發流程規則

### 規則 1：先架構後實作

**任何 100 行以上的程式碼**，先提交設計草稿給使用者確認，再開始實作。

格式範例：
```markdown
## 計畫：實作 AI 評估系統

### 檔案結構
- src/core/ai/evaluator.ts
- src/core/ai/strategy.ts
- src/core/ai/difficulty.ts

### 介面設計
[code blocks showing key interfaces]

### 影響範圍
- 不影響：UI 層、卡牌資料
- 影響：game-state.ts 需新增 aiTurn() 函式

### 測試計畫
- 單元測試每個 evaluate*Play() 函式
- 整合測試：1000 場 AI vs AI 模擬

### 預估時間
3-4 小時

確認後我開始實作。
```

### 規則 2：小步快跑

- 每個 commit 必須可運行（不可有半成品）
- 每個 commit 應對應一個明確功能
- commit message 用中文：`feat: 加入機組替換機制`、`fix: 修正連鎖故障判定`

### 規則 3：測試先行（TDD 精神）

核心邏輯（core/）必須有單元測試：

```typescript
// rules-engine.test.ts
describe('故障施加邏輯', () => {
  it('對手有 required 技師時，故障會被自動修復', () => {
    const state = setupGameWithTechs(['T02']);
    const result = playFaultCard(state, 'F04', targetIdx);
    expect(result.opponentTurbines[0].faults).toHaveLength(0);
  });
});
```

### 規則 4：資料驅動

卡牌數值、規則參數、平衡性調整，**只改 JSON 不改程式碼**：

```json
// data/cards.json
{
  "M07": {
    "id": "M07",
    "type": "turbine",
    "mw": 12,
    "abilities": [
      { "name": "穩定巨擘", "tag": "aura-mw", "value": 1 }
    ]
  }
}
```

新增能力標籤時，先在 `rules-engine.ts` 加入處理邏輯，再加新卡。

### 規則 5：對齊原型行為

任何重構，**最後都要跑「對齊測試」**：

```typescript
test('重構後遊戲結果應與原型一致', () => {
  const seed = 12345;
  const protypeResult = playPrototypeGame(seed);
  const refactoredResult = playNewGame(seed);
  expect(refactoredResult.finalScore).toEqual(prototypeResult.finalScore);
});
```

### 規則 6：視覺與資料分離（新增）⭐

```typescript
// ❌ 不允許：在 UI 元件中寫死卡牌資料
<div>天鯨 12MW</div>

// ✅ 正確：UI 元件讀取資料
<div>{cardData.name}</div>

// ❌ 不允許：用 if/else 處理不同卡類視覺
if (card.type === 'turbine') { ... }

// ✅ 正確：用 CSS class 對應
<div className={`card card-${card.type}`}>
```

---

## 🚫 禁止事項

### 絕對禁止

1. **❌ 自動 git commit**：任何 commit 都必須使用者明確同意
2. **❌ 假數據當實驗數據**：AI 模擬的結果是「估計值」，不可寫進論文當實驗結果
3. **❌ 硬編碼 Linux 路徑**：使用 `path.join()`、`process.cwd()`
4. **❌ 寫死的英文字串**：UI 文字必須能輕易切換中英文
5. **❌ 跳過測試**：核心邏輯沒測試就不能合併
6. **❌ AI 一次畫整張卡**：違反視覺工作流（新增）⭐

### 強烈不建議

1. ⚠️ 一次寫 500+ 行程式碼（拆成多個 PR）
2. ⚠️ 為了「優雅」而過度抽象（明確優先）
3. ⚠️ 使用太多第三方套件（每個依賴都是負擔）
4. ⚠️ 修改原型 HTML 檔案（保留作為設計史）
5. ⚠️ 沒讀過 DESIGN.md 就動手

---

## 🎨 溝通規範

### 對話風格（給 Claude Code）

- **中文優先**：除非寫程式碼 / 變數名
- **簡潔直接**：不要過度客套、不要過長前言
- **誠實**：不會的就說不會，不要硬掰
- **質疑導向**：使用者要求不合理時，要直接說

### 報告格式

完成大型工作後，用此格式總結：

```markdown
## ✅ 已完成

- 重構 ai/ 資料夾為三個檔案
- 新增 15 個單元測試（全部通過）

## ⚠️ 注意事項

- ai/strategy.ts 中的「落後判定門檻」改為 15 MWh（原型是 10）
  - 理由：1000 場模擬顯示原值會導致 AI 過度激進

## 📝 待辦

- [ ] 整合測試（AI vs AI）
- [ ] 對齊原型行為的測試

## 💡 建議

考慮新增「保守難度」選項，介於入門與中級之間。
```

---

## 📦 套件選擇原則

### 已選定（不要換）

- **React 18**：UI 框架
- **TypeScript 5+**：型別
- **Vite**：建置工具
- **Zustand**：狀態管理
- **TailwindCSS**：樣式
- **Vitest**：測試
- **Capacitor**：手機 App 包裝

### 暫不引入

- ❌ Redux（Zustand 已夠用）
- ❌ Styled Components（Tailwind 已夠用）
- ❌ Lodash（原生 JS 已夠用）
- ❌ Moment.js（用 Intl API）

### 引入新套件前

每個新依賴需評估：
1. 是否真的不能用原生實作？
2. 維護狀態如何？（最後 commit 在 6 個月內）
3. Bundle size 影響？（小於 50KB gzipped）
4. 如果消失了，能否輕易替換？

---

## 🧪 測試規範

### 覆蓋率目標

- **core/**：80%+
- **ui/**：50%+（重點測互動，不必測渲染）
- **template/**：70%+（新）
- **整體**：70%+

### 必測場景

1. 每張卡牌的命名能力都有對應測試
2. 風速骰子（含颱風判定）
3. 故障克制矩陣
4. AI 各難度行為差異
5. 完整 12 回合遊戲流程
6. 卡牌模板渲染（六種類別 × 五種稀有度 = 30 種組合）（新）

---

## 📊 平衡性驗證

每次數值調整後，必須跑：

```bash
npm run simulate -- --games 1000 --p1 hard --p2 hard
```

**合格標準：**
- 勝率差距 ≤ 10%（45-55%）
- 平均分數差距 ≤ 5 MWh
- 任何卡使用率 ≥ 3%（沒有完全冷門卡）
- 勢均力敵率（差 ≤ 5）≥ 25%
- 一面倒率（差 ≥ 30）≤ 20%

不合格 = 不可合併。

---

## 🔄 與使用者協作

### Dof 偏好

- 中文溝通
- 直接、不囉嗦
- 喜歡看到實際成果（HTML / 截圖）
- 不喜歡過長的解釋
- 開發環境：Windows + RTX 4080
- 工作流：Claude Code 為主，自己會用 Git
- 對 AI 估值有警覺（不會把模擬結果當實驗數據）

### 何時主動提問

- 設計決策有重大影響時
- 規則模糊時
- 多種合理實作方式時

### 何時不問直接做

- 程式碼風格問題
- 小修正、bug 修復
- DESIGN.md 已明確規定的事

---

## 📍 當前優先任務

按順序執行（詳見 `PROJECT_STATUS.md`）：

1. **Sprint 0**：閱讀所有文件，熟悉原型
2. **Sprint 1**：建立專案骨架（Vite + React + TS + Tailwind）
3. **Sprint 2**：core/ 層重構（卡牌、規則、AI）
4. **Sprint 3**：UI 層遷移
5. **Sprint 4**：⭐ **卡牌模板系統**（新增 Sprint）
6. **Sprint 5**：模擬器整合
7. **Sprint 6**：Capacitor 包裝為 App

每個 Sprint 結束前提交給 Dof 審查。

---

## 🌐 多語化準備

雖然第一版只做中文，但 UI 文字要從一開始就**抽取**到語言檔：

```typescript
// src/i18n/zh-TW.ts
export default {
  ui: {
    endTurn: '結束回合',
    actionsLeft: '剩餘動作',
    yourHand: '你的手牌',
  },
  cards: {
    M01: { name: '綠源 2MW', flavor: '入門陸域' },
    // ...
  }
};
```

未來加英文版只需翻譯 JSON，不必改程式碼。

---

## 📞 緊急聯絡

- **DOF Lab**：[doflab.cc](https://doflab.cc)
- **GitHub Issues**：本 repo 的 issue tracker
- **Anthropic Support**：support.claude.com

---

**本檔案版本**：v2.0 (含視覺工作流規範)
**最後更新**：2025-05
**適用範圍**：本專案所有開發工作
