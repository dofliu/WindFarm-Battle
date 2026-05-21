# 📊 PROJECT STATUS — 詳細進度報告

> 從專案開始到現在的完整進度記錄

---

## 🎯 整體進度

```
設計階段 ████████████ 100% ✅
原型階段 ████████████ 100% ✅
視覺方向 ████████████ 100% ✅
工程化   ░░░░░░░░░░░░ 0%  ← 你（Claude Code）從這裡開始
測試上線 ░░░░░░░░░░░░ 0%
```

---

## 📋 已完成的工作清單

### 1. 遊戲設計（100%）

- [x] 核心機制：12 回合制、雙人對戰、MWh 計分
- [x] 風速系統：1d6 骰子，含颱風判定
- [x] 6 種卡牌類別：機組 / 技師 / 故障 / 功能 / 天氣 / 合約
- [x] 47 張完整卡牌定義
- [x] 故障克制矩陣（技師 vs 故障）
- [x] 動作費經濟系統
- [x] 命名能力系統（aura / immunity / trigger）
- [x] 平衡參數（5 級稀有度、Sev 1-5 故障）
- [x] 教學模式對應 18 週課程

### 2. 原型開發（100%）

| 版本 | 重點 | 狀態 |
|---|---|---|
| v1 | 21 張卡基本玩法 | ✅ 可玩 |
| v2 | 智慧 AI（評估函式） | ✅ 可玩 |
| v3 | 功能卡 + 機組替換機制 | ✅ 可玩 |
| **v4** | **47 張完整卡庫 + 6 類別** | ✅ **目前主版本** |

**位置**：`prototypes/v4-expansion.html`

### 3. AI 系統（100%）

- [x] 評估函式（每張卡可能打法都計算分數）
- [x] 局勢感知（開局 / 中盤 / 終局 + 領先 / 均勢 / 落後）
- [x] 三段難度：入門 / 中級 / 高手
- [x] AI 思考過程可視化（debug 用）
- [x] 自動模擬器（可跑 1000+ 場驗證平衡）

### 4. 視覺設計（100% — 方向確認）

#### 風格決策

| 卡類 | 採用風格 | 理由 |
|---|---|---|
| 機組 | 真實 CG（M07 那種） | 英雄卡需視覺衝擊 |
| 技師 | 半寫實人物 | 真實感優先，避免漫畫 |
| 故障 | 工程示意圖 | 真實性最重要（教學工具） |
| 功能 | 科技 HUD 線條 | 抽象動作的視覺化 |
| 天氣 | 氣象局風格 | 仿真實氣象圖式 |
| 合約 | 文件 / 標案風 | 仿真實合約視覺 |

#### 工作流確認

- ✅ **AI 只生純插畫**（無 UI、無文字、無邊框）
- ✅ **統一卡框模板**（金色框 + 結構化版面）
- ✅ **程式自動套版**（從 cards.json 讀資料填入）

詳細見 `VISUAL_WORKFLOW.md`。

### 5. 文件（100%）

- [x] DESIGN.md（完整設計文件）
- [x] CLAUDE.md（工作規範）
- [x] ROADMAP.md（未來路線圖）
- [x] cards.json（結構化卡牌資料）
- [x] VISUAL_WORKFLOW.md（視覺工作流，**新**）
- [x] CARD_PROMPTS.md（AI 插畫 prompt 庫，**新**）

---

## 🔮 你（Claude Code）接手後要做的工作

### Sprint 1：技術骨架（1 週）

**目標**：建立可運行的開發環境

```bash
- npm init + Vite + React + TypeScript
- TailwindCSS 設定
- Zustand store 起手式
- Vitest 測試環境
- ESLint + Prettier 規則
- Git workflow（含 hooks）
- 第一個 commit：「feat: 專案骨架建立」
```

**驗收**：能 `npm run dev` 並看到「Hello WindFarm Battle」

### Sprint 2：核心邏輯重構（2 週）

**目標**：把原型的遊戲邏輯重構為純 TypeScript

```
src/core/
├── types.ts          # GameState、Card、Player 等型別
├── cards.ts          # 從 cards.json 載入並提供查詢介面
├── game-state.ts     # 狀態與動作（不可變更新）
├── rules-engine.ts   # 規則邏輯（風速、發電、故障處理）
└── ai/
    ├── evaluator.ts  # 評估函式
    ├── strategy.ts   # 局勢判斷
    └── difficulty.ts # 難度系統
```

**驗收**：
- 80%+ 單元測試覆蓋
- 對齊測試通過（重構後行為與原型一致）
- 可獨立執行 1000 場模擬（CLI 模式）

### Sprint 3：UI 層遷移（2 週）

**目標**：把 HTML 原型的視覺重做為 React 元件

```
src/ui/
├── components/
│   ├── Card.tsx           # 卡牌元件（多種尺寸）
│   ├── CardArt.tsx        # 卡牌插畫包裝
│   ├── PlayerArea.tsx     # 玩家區
│   ├── HandArea.tsx       # 手牌區
│   ├── WindDisplay.tsx    # 風速面板
│   ├── LogPanel.tsx       # 戰況記錄
│   └── AIThoughtPanel.tsx # AI 思考過程
├── containers/
│   ├── GameContainer.tsx
│   ├── LibraryView.tsx
│   └── SimulationView.tsx
└── styles/
```

**驗收**：視覺與 v4 原型一致度 90%+

### Sprint 4：卡牌模板系統（1 週）⭐ **新增**

**目標**：建立可批次套版的工具

```
src/template/
├── CardTemplate.tsx       # 統一卡框元件
├── CardRenderer.tsx       # 從 cards.json 渲染完整卡
├── CardExporter.tsx       # 導出 PNG/PDF
└── BatchProcessor.ts      # 批次處理 47 張卡
```

**驗收**：
- 給定純插畫圖檔 + 卡牌 ID，自動產出完整卡牌
- 可批次處理整個 cards.json
- 可導出 300DPI PNG 或印製 PDF

### Sprint 5：模擬器整合（1 週）

**目標**：將 v4 的模擬器整合到 React 版

- CLI 模式：`npm run simulate -- --games 1000 --p1 hard --p2 hard`
- Web 模式：模擬模式分頁
- 結果分析：卡牌使用率、勝率分佈

### Sprint 6：手機 App（2 週）

**目標**：Web 版包裝為 iOS + Android App

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
```

**處理事項**：
- 觸控優化（手指比滑鼠粗）
- 螢幕方向適配
- App icon、splash screen
- iOS / Android 商店審核準備

### Sprint 7+：學生實測與優化

- 召募學生試玩
- 收集回饋
- 平衡調整
- 視覺資源完善
- 多人連線（選用）

---

## 🎓 學術產出規劃

### 短期（6 個月內）

- 教學遊戲化論文（Computers & Education / SSCI）
- WindEurope Education Workshop 投稿
- 工程教育研討會展示

### 中期（1 年內）

- AI 教學遊戲平衡研究論文
- NSTC 數位學習計畫申請

### 長期（2 年內）

- 開源版本國際推廣
- 與歐洲風電大學交流

---

## 💼 商業模式

**主軸（A）**：免費教育版 + 開源
**次要（B）**：學校採購進階版（含教師後台）
**選用（C）**：國際發行（Steam / App Store）

詳見 ROADMAP.md。

---

## 📁 檔案地圖

```
windfarm-battle/
├── HANDOFF.md              ← Claude Code 第一份要讀
├── PROJECT_STATUS.md       ← 你正在看
├── DESIGN.md               ← 完整設計
├── VISUAL_WORKFLOW.md      ← 視覺工作流 ⭐
├── CARD_PROMPTS.md         ← AI 插畫 prompt 庫
├── CLAUDE.md               ← 工作規範
├── ROADMAP.md              ← 未來計畫
├── README.md               ← 公開首頁
├── data/
│   └── cards.json          ← 47 張卡資料
├── prototypes/
│   ├── v1-playable.html
│   ├── v2-smart-ai.html
│   ├── v3-functional-cards.html
│   └── v4-expansion.html   ← 主版本
└── src/                    ← Claude Code 將建立
    ├── core/
    ├── ui/
    ├── template/
    └── tests/
```

---

## 🚧 已知的開放問題

這些是 Dof 還未完全決定，留給未來討論的事項：

1. **卡牌數量是否再擴充到 60+ 張**？  
   → 目前 47 張，候選 Tier 2 設計有 12 張新卡未整合（M13-M15、T10-T12、F10-F11、B01-B04）

2. **多人連線採用 WebSocket 還是 Firebase**？  
   → Sprint 7 才決定，現在不用考慮

3. **是否做角色不對稱模式**（OEM / 電網 / 氣象之神）？  
   → 屬於 Tier 4 遠期計畫

4. **商品化路線**（純開源 vs 學校採購）？  
   → 學術論文發表後再決定

---

**最後更新**：2025-05
