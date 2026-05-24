# 🚀 HANDOFF — WindFarm Battle 專案交接（v3）

> **這是給 Claude Code 看的第一份文件。** 整個專案的現狀、決策、與下一步行動都在這裡。
>
> **最後更新：2026-05-23（progress 97%）**

---

## 📌 30 秒專案總覽

**WindFarm Battle / 風場大戰** 是一個風電運維主題的策略卡牌遊戲，由 NCUT 智慧自動化工程系 DOF Lab（劉瑞弘副教授）開發。

**核心特點：**
- 🎓 教學工具：對應 IEC 61400 標準，Route B 知識效益修復模型
- 🎴 50 張卡片，6 種類別（機組/技師/故障/功能/天氣/合約）
- 🤖 含智慧 AI 對戰（3 難度）、CLI 自動模擬器（`npm run simulate`）
- 📱 Capacitor 8 已同步（Android + iOS 準備就緒）
- 🎨 Sprint 4 卡牌模板系統完成（CardTemplate + CardGallery + 列印功能）

**目前階段：** **可玩完整遊戲。** React+TS 重構完成、全測試通過、Capacitor 已同步、待實機測試。

---

## 🎯 接手時的現況（2026-05-22）

### ✅ 已完成（Sprint 1–5 + Sprint 4 模板）

- [x] Vite + React 18 + TypeScript 5 + Tailwind + Zustand 專案骨架
- [x] `core/` 層純 TS（零 React 依賴）：types, cards, game-state, rules-engine, actions, abilities
- [x] AI 三難度（easy/medium/hard）+ evaluator + strategy + difficulty
- [x] 50 張卡完整資料（cards.json v4）+ i18n 中文文案
- [x] Route B 知識效益修復模型：faultCategory × specialty 完全/部分修復
- [x] 開局固定艦隊：OS8(8MW) + OS10(10MW) + OS12(12MW) 雙方對稱
- [x] 完整 UI：GameHeader / PlayerArea / Hand / EventLog / StatusPanel / CardChip / TurbineSlot
- [x] CardLibraryModal / HowToPlayModal（含 Route B 教學說明）
- [x] **Sprint 4**：CardTemplate.tsx + CardGallery.tsx（列印 Modal，🎴 列印按鈕）
- [x] CLI 模擬器：`npm run simulate -- --games 1000 --p1 hard --p2 hard`
- [x] 1000 場平衡驗證全通過（勝率/緊湊度/卡牌涵蓋 ✅）
- [x] **Route B 永久損傷視覺化**：`DeployedTurbine.originalAvail` + TurbineSlot `⬇ −N% 永久` + 4 新測試
- [x] **模擬器 Web 模式**：SimulatorPanel.tsx（📊 模擬按鈕，200/500/1000 場，熱門/冷門卡排行）
- [x] **209 個測試全通過**（tsc/eslint/build 全綠）
- [x] Capacitor 8 同步（Android + iOS）

### 🔨 待完成（需 Dof 配合）

- [ ] **Android Studio 實機測試**：`npx cap open android`（需本機環境）
- [ ] **學生首輪試玩**：10-20 名學生 × 5 場，回饋收集
- [ ] **卡牌插畫製作**：使用 CARD_PROMPTS.md 的 AI prompt 產圖

### 🤖 如果繼續 coding，可做的事

- [x] **卡牌批次匯出 PDF**（Sprint 4 CardExporter）：`html2canvas` + `jsPDF`，A4 每頁 3×3，進度條，依過濾條件命名檔案，root.unmount 清理，匯出失敗錯誤 UI（commits e8f6942, afeffd2）
- App icon / splash screen（Capacitor 設定）
- [x] **英文版 i18n**：`en.ts` + `cards.en.ts` + `LocaleContext` + `LocaleSwitcher`，標題畫面已有 ZH/EN 切換按鈕，50 張卡完整英文文案，t() 支援多語言回退

---

## 🧠 重大決策紀錄

| 決策項目 | 結論 | 詳見 |
|---|---|---|
| **專案名稱** | WindFarm Battle / 風場大戰 | README.md |
| **卡牌數量** | 50 張（含 OS8/OS10/OS12 開局艦隊） | data/cards.json |
| **技術棧** | React 18 + TS 5 + Vite + Zustand + Tailwind | DESIGN.md |
| **手機方案** | Capacitor 8（已同步） | ROADMAP.md |
| **視覺工作流** | AI 生純插畫 + CardTemplate 統一套版 | VISUAL_WORKFLOW.md ⭐ |
| **Route B** | specialty×faultCategory → 完全/部分修復 | DESIGN.md |
| **平衡門檻** | 勝率差距 ≤12pp；closeRate 相對差 ≤3%；usage ≥1.5% | scripts/simulate.ts |
| **M07 cost** | 4（原 5，已修正：max actions=5 才能出傳說卡） | cards.json |
| **M10/M12/W02** | 情境性豁免卡（不計冷門警示） | scripts/simulate.ts |

---

## 📚 文件閱讀順序

```
必讀：
1. HANDOFF.md          ← 你正在看（現況）
2. NOTES.md            ← 最新技術注意事項（最先看）
3. PROJECT_STATUS.md   ← 詳細 Sprint 進度
4. DESIGN.md           ← 完整設計規範（最重要）
5. VISUAL_WORKFLOW.md  ⭐ 視覺工作流

選讀：
6. CLAUDE.md           ← 工作規範（每次對話開始前讀）
7. CARD_PROMPTS.md     ← AI 插畫 prompt 庫
8. ROADMAP.md          ← 未來計畫
```

---

## ⚠️ 重要警告與限制

### 開發者偏好（劉瑞弘 / Dof）

| 偏好 | 說明 |
|---|---|
| 🌏 **中文溝通** | 程式碼可用英文，討論用中文 |
| 📝 **簡潔直接** | 不要過度客套、不要長前言 |
| 💻 **Windows 環境** | RTX 4080，會用 Git，會用 Claude Code |
| 🚫 **無自動 commit** | 任何 git 動作都要明確同意 |
| 🚫 **無假數據** | AI 模擬結果不可當實驗數據 |
| 🚫 **無硬編碼路徑** | 用 `path.join()` |
| 🏗️ **先架構後實作** | 100+ 行的程式碼要先給設計草稿 |

### 技術約束

- ❌ **core/ 層禁止 import React / 任何 UI 框架**（為了未來跨平台）
- ❌ **不可刪除 prototypes/**（v1-v4 是設計史）
- ❌ **不可直接修改 cards.json 中的卡牌數值**（沒有跑 1000 場模擬驗證不可合併）
- ✅ **每個 Sprint 結束都要有可運行成果**（不只是程式碼）

---

## 🆘 卡住的時候怎麼辦

| 狀況 | 應對 |
|---|---|
| 規格不清 | 問使用者，給 2-3 個選項 + 你的推薦 |
| 設計矛盾 | 引用 DESIGN.md 對應段落，提出修正建議 |
| 平衡崩壞 | 跑 `npm run simulate -- --games 1000 --p1 hard --p2 hard`，看 scripts/simulate.ts 門檻 |
| 視覺問題 | 看 VISUAL_WORKFLOW.md |
| tsc 錯誤 | core/ 層不可有 React import；所有型別明確標注 |

---

## 📞 聯絡資訊

- **使用者**：劉瑞弘 副教授（NCUT IAE / DOF Lab）
- **網站**：[doflab.cc](https://doflab.cc)

---

**文件版本**：v3.2（英文 i18n 完成）
**最後更新**：2026-05-24
**狀態**：React 重構完成，CardExporter 完成，英文 i18n 完成，待 Android Studio 實機測試 + 學生試玩
