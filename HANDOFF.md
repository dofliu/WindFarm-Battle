# 🚀 HANDOFF — WindFarm Battle 專案交接（v2）

> **這是給 Claude Code 看的第一份文件。** 整個專案的現狀、決策、與下一步行動都在這裡。

---

## 📌 30 秒專案總覽

**WindFarm Battle / 風場大戰** 是一個風電運維主題的策略卡牌遊戲，由 NCUT 智慧自動化工程系 DOF Lab（劉瑞弘副教授）開發。

**核心特點：**
- 🎓 教學工具：對應 IEC 61400 標準
- 🎴 47 張卡片，6 種類別（機組/技師/故障/功能/天氣/合約）
- 🤖 含智慧 AI 對戰、自動模擬器
- 🎨 已建立完整視覺風格指引

**目前階段：** 設計完成、HTML 原型可玩、**準備重構為 React + TS 正式專案**

---

## 🎯 你（Claude Code）接手時的現況

### ✅ 已完成
- [x] 完整遊戲機制設計（規則、平衡、AI）
- [x] 4 代 HTML 原型（v1-v4，47 張卡可玩）
- [x] 卡牌結構化資料（`data/cards.json`）
- [x] AI 評估函式與三段難度
- [x] 自動模擬器（驗證平衡性）
- [x] **視覺風格決策**（混合策略，見 VISUAL_WORKFLOW.md）
- [x] **AI 插畫 prompt 模板**（已測試三張，方向確認）

### 🔨 你即將做的
- [ ] **第一步：閱讀所有文件、玩過 v4 原型**
- [ ] 提出重構計畫（不要直接寫程式）
- [ ] Sprint 1：建立 React + TS 專案骨架
- [ ] Sprint 2：核心邏輯（`core/`）層重構
- [ ] Sprint 3：UI 層遷移
- [ ] Sprint 4：卡牌模板系統（套版工具）
- [ ] Sprint 5：模擬器整合
- [ ] Sprint 6：Capacitor 包裝為手機 App

### 🧠 目前的重大決策

| 決策項目 | 結論 | 詳見 |
|---|---|---|
| **專案名稱** | WindFarm Battle / 風場大戰 | README.md |
| **卡牌數量** | 47 張（v4 完整版） | data/cards.json |
| **技術棧** | React + TS + Vite + Zustand + Tailwind | DESIGN.md Part 8 |
| **手機方案** | Capacitor（共用 90% Web 程式） | ROADMAP.md |
| **視覺工作流** | AI 生純插畫 + 統一模板套版 | VISUAL_WORKFLOW.md ⭐ |
| **AI 風格** | 機組真實 CG、技師半寫實、故障工程示意圖 | VISUAL_WORKFLOW.md |

---

## 📚 文件閱讀順序（按重要性）

```
必讀（依此順序）：
1. HANDOFF.md                ← 你正在看
2. PROJECT_STATUS.md         ← 詳細進度
3. DESIGN.md                 ← 完整設計（最重要）
4. VISUAL_WORKFLOW.md        ⭐ 視覺工作流（新）
5. CLAUDE.md                 ← 你的工作規範
6. data/cards.json           ← 卡牌資料

選讀：
7. ROADMAP.md                ← 未來計畫
8. CARD_PROMPTS.md           ← AI 插畫 prompt 庫
9. prototypes/v4-expansion.html ← 親自玩過
```

---

## 🚦 你的第一個任務（不要寫程式！）

**請依以下順序執行，然後回報給使用者：**

### 階段 1：理解專案（半天）

```
1. 完整讀完 HANDOFF.md、PROJECT_STATUS.md、DESIGN.md、VISUAL_WORKFLOW.md
2. 開啟 prototypes/v4-expansion.html 在瀏覽器中玩 3 場
3. 觀察 cards.json 的結構
4. 列出你的疑問清單
```

### 階段 2：提交計畫（不要寫程式）

```
回報以下文件給使用者審核：

## 我的理解
- 用 5-10 句話總結你理解的專案目標
- 列出你看到的最關鍵設計決策

## Sprint 1 計畫
- 預定建立的檔案結構
- 預定使用的套件清單
- 預估時間
- 風險點

## 我的疑問
- 任何規格不清的地方
- 任何你覺得設計有問題的地方
- 任何需要使用者決策的事項
```

### 階段 3：等待確認

```
不要自己開始寫程式！
等使用者明確說「OK 開始實作 Sprint 1」再動手。
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

- ❌ **core/ 層禁止 import React / 任何 UI 框架** （為了未來跨平台）
- ❌ **不可刪除 prototypes/** （v1-v4 是設計史與 fallback）
- ❌ **不可直接修改 cards.json 中的卡牌數值** 沒有跑過 1000 場模擬驗證
- ✅ **每個 Sprint 結束都要有可運行成果**（不只是程式碼）

---

## 🆘 卡住的時候怎麼辦

| 狀況 | 應對 |
|---|---|
| 規格不清 | 問使用者，給 2-3 個選項 + 你的推薦 |
| 設計矛盾 | 引用 DESIGN.md 對應段落，提出修正建議 |
| 重構後行為不一致 | 跑「對齊測試」（與 v4 原型比對） |
| 平衡崩壞 | 跑 1000 場模擬，看 CLAUDE.md 驗收標準 |
| 視覺問題 | 看 VISUAL_WORKFLOW.md 的工作流 |

---

## 📞 聯絡資訊

- **使用者**：劉瑞弘 副教授（NCUT IAE / DOF Lab）
- **網站**：[doflab.cc](https://doflab.cc)
- **設計協作 AI**：Claude（這份文件由 Claude 整理）

---

## 🎬 開場白範例

如果這是你和使用者的第一次對話，可以這樣開始：

```
你好！我剛讀完 HANDOFF、PROJECT_STATUS、DESIGN、VISUAL_WORKFLOW 四份文件，
也玩了 v4 原型 3 場。

我的初步理解：
- WindFarm Battle 是一個 47 張卡的策略卡牌遊戲
- 教學目的（風電 + IEC 61400）+ 研究價值
- 你已經完成所有設計，現在要做的是把 HTML 原型重構為 React + TS
- 視覺方面採「AI 純插畫 + 統一模板」工作流
- 最終要包裝為手機 App（Capacitor）

我有幾個問題想先釐清：
[列 3-5 個關鍵問題]

如果這些確認後，我打算先做 Sprint 1 的技術骨架（Vite + React + TS）。
要我提交詳細的 Sprint 1 計畫嗎？
```

---

**文件版本**：v2.0
**最後更新**：2025-05
**狀態**：準備交接給 Claude Code
