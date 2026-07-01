# WindFarm Battle 風場大戰

> 風場運維主題的策略卡牌遊戲，結合 IEC 61400 國際標準教學

[![Status](https://img.shields.io/badge/status-handoff_to_dev-yellow)]()
[![Cards](https://img.shields.io/badge/cards-47-blue)]()
[![Prototype](https://img.shields.io/badge/prototype-v4-green)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## 🎮 線上遊玩

**👉 直接開玩（免安裝）：<https://dofliu.github.io/WindFarm-Battle/>**

純瀏覽器執行、玩家 vs AI、可安裝為 PWA 到手機桌面離線遊玩。
（合併進 `main` 後由 GitHub Actions 自動部署；首次需在 repo **Settings → Pages → Source** 選 **「GitHub Actions」**。）

---

## 📖 專案簡介

**WindFarm Battle** 是國立勤益科技大學智慧自動化工程系 DOF Lab 開發的風電教學遊戲。透過卡牌對戰機制，玩家扮演風場運維者，學習：

- 風力發電機組類型與特性
- 故障診斷與維修策略
- IEC 61400 國際風電標準
- 預測性維護（PdM）思維
- SCADA 與 CMS 系統概念

**核心特色：**
- 🎴 47 張卡（機組 / 技師 / 故障 / 功能 / 天氣 / 合約）
- 🤖 三段難度智慧 AI（評估函式 + 局勢感知）
- 📊 自動模擬模式（驗證遊戲平衡）
- 🌬️ 1d6 風速骰子機制（含颱風判定）
- 📐 漸進式 IEC 標準揭露（不嚇退新手）
- 🎨 統一視覺風格（AI 插畫 + 模板套版）

---

## 🎯 目標使用者

| 角色 | 使用模式 | 卡牌需求 |
|---|---|---|
| **大學新生** | 入門體驗 | 基礎 21 張（Tier 1） |
| **修課學生** | 課程教材 | 完整 47 張 + 教學參考卡 |
| **任課教師** | 教學工具 | 完整版 + 教學手冊 |
| **產業培訓** | 工作坊 | 完整版 + 角色不對稱模式 |

---

## 🚀 快速開始

### 玩原型版本（Web）

```bash
# Clone repo
git clone https://github.com/[YOUR_USERNAME]/windfarm-battle.git
cd windfarm-battle

# 開啟最新原型
open prototypes/v4-expansion.html
```

或直接在瀏覽器開啟 `prototypes/` 目錄下的任一 HTML 檔案。

### 開發環境（規劃中）

```bash
npm install
npm run dev       # 啟動本地開發伺服器
npm run build     # 建置 production
npm run test      # 執行單元測試
npm run simulate  # 跑 1000 場 AI 模擬
npm run cards:build  # 批次套版產出 47 張卡
```

---

## 📁 專案結構

```
windfarm-battle/
├── README.md              # 本檔案
├── START_HERE.md          # 給 Dof 的操作指南
├── HANDOFF.md             # 給 Claude Code 的交接書
├── PROJECT_STATUS.md      # 詳細進度
├── DESIGN.md              # 完整設計文件
├── VISUAL_WORKFLOW.md     # 視覺工作流 ⭐
├── CARD_PROMPTS.md        # AI 插畫 prompt 庫
├── CLAUDE.md              # Claude Code 工作規範
├── ROADMAP.md             # 開發路線圖
├── data/
│   └── cards.json         # 所有卡牌結構化資料
├── prototypes/            # HTML 原型（v1-v4）
│   ├── v1-playable.html
│   ├── v2-smart-ai.html
│   ├── v3-functional-cards.html
│   └── v4-expansion.html  # 目前主版本
└── src/                   # 程式碼（Claude Code 將建立）
    ├── core/              # 純邏輯（卡牌、規則、AI）
    ├── ui/                # 介面層
    ├── template/          # 卡牌模板系統
    └── tests/             # 測試
```

---

## 🛠️ 技術棧（規劃）

**第一階段：Web 版**
- React 18 + TypeScript
- Vite（建置工具）
- Zustand（狀態管理）
- TailwindCSS（樣式）
- Vitest（單元測試）

**第二階段：手機 App**
- Capacitor（包裝 Web 為 App）
- 共用 90% 程式碼

**第三階段：多人連線（選用）**
- WebSocket + Node.js 伺服器
- Firebase（雲端存檔）

---

## 📊 開發進度

- [x] 遊戲機制設計
- [x] 21 張 Tier 1 卡牌定義
- [x] 智慧 AI 系統（評估函式）
- [x] 自動模擬與統計工具
- [x] 功能卡與升級機制
- [x] 47 張完整卡庫（v4）
- [x] **視覺工作流方向確認**（AI 插畫 + 模板套版）⭐
- [ ] **程式碼重構為 React + TypeScript** ← 下一步
- [ ] 卡牌模板系統
- [ ] 視覺資源（AI 生成卡牌插畫）
- [ ] 多人連線
- [ ] 行動 App 發布
- [ ] 教學論文發表

---

## 🎓 學術定位

本專案同時是：

1. **教學工具**：搭配風力發電課程使用
2. **研究素材**：教學遊戲化（Gamification of Education）研究
3. **產學橋樑**：與台電、上緯、世紀風電合作示範
4. **DOF Lab 代表作**：展示實驗室在 AI + 風電領域的整合能力

---

## 📚 文件閱讀指引

**新加入這個專案？依序閱讀：**

### 給開發者（Claude Code）

1. 🚀 `HANDOFF.md` — 從這開始
2. 📊 `PROJECT_STATUS.md` — 詳細進度
3. 🎯 `DESIGN.md` — 設計哲學與機制
4. 🎨 `VISUAL_WORKFLOW.md` — 視覺工作流（重要）
5. 📋 `CLAUDE.md` — 工作規範
6. 🎴 `data/cards.json` — 卡牌資料結構
7. 🗺️ `ROADMAP.md` — 知道下一步在哪
8. 🎮 開啟 `prototypes/v4-expansion.html` — 親自體驗

### 給專案主導者（Dof）

1. 📋 `START_HERE.md` — 操作指南
2. 其他文件依需求查閱

---

## 👥 開發團隊

**主導**：劉瑞弘 副教授（國立勤益科技大學智慧自動化工程系 / DOF Lab）

**技術協作**：Claude（Anthropic）+ Claude Code

**設計理念**：「降低嘗試門檻，提高深度可及性」

---

## 📄 授權

MIT License — 教育用途自由使用、修改、散布。

商業用途請聯絡 DOF Lab：[doflab.cc](https://doflab.cc)

---

## 🔗 相關連結

- DOF Lab 官方網站：[doflab.cc](https://doflab.cc)
- 風電課程資源：[NCUT IAE](https://www.ncut.edu.tw/)
- IEC 61400 標準：[IEC 官網](https://www.iec.ch/)

---

**版本**：v2.0
**最後更新**：2025-05
**狀態**：準備交接給 Claude Code 開發
