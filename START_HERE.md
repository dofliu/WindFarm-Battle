# 🚀 START_HERE — 給 Dof 的操作指南

> **這份文件只給你（Dof）看。** 教你怎麼用這個交接包啟動 Claude Code 開發。

---

## ✅ 你接下來要做的事（按順序）

### Step 1：在電腦上建立資料夾

```bash
# 在你的電腦上選個位置（例：D:\Projects\）
mkdir windfarm-battle
cd windfarm-battle
```

### Step 2：複製所有文件進去

把以下檔案放進 `windfarm-battle/` 資料夾：

```
windfarm-battle/
├── HANDOFF.md              ← Claude Code 第一個看的
├── PROJECT_STATUS.md       ← 詳細進度
├── DESIGN.md               ← 完整設計
├── VISUAL_WORKFLOW.md      ← 視覺工作流 ⭐
├── CARD_PROMPTS.md         ← Prompt 庫
├── CLAUDE.md               ← 工作規範
├── ROADMAP.md              ← 未來計畫
├── README.md               ← 公開首頁
├── START_HERE.md           ← 你正在看
└── data/
    └── cards.json          ← 卡牌資料
```

### Step 3：補上原型 HTML 檔案

從之前的對話下載這 4 個 HTML，放進 `prototypes/` 資料夾：

```
prototypes/
├── v1-playable.html       (windfield_playable.html 改名)
├── v2-smart-ai.html       (windfield_smart_ai.html 改名)
├── v3-functional-cards.html (windfield_v3.html 改名)
└── v4-expansion.html      (windfield_v4.html 改名)
```

**改名理由：** 原檔名用 "windfield" 是錯的（應該是 windfarm）。新檔名清楚標示版本特色。

### Step 4：初始化 Git Repo

```bash
git init
git add .
git commit -m "feat: 初始設計文件與原型"
```

### Step 5：推到 GitHub（建議 Private）

```bash
# 在 GitHub 開 private repo: windfarm-battle
git remote add origin https://github.com/[你的帳號]/windfarm-battle.git
git branch -M main
git push -u origin main
```

### Step 6：開啟 Claude Code

```bash
# 在 windfarm-battle 資料夾下
claude
```

### Step 7：給 Claude Code 的第一個指令

**複製貼上以下內容**：

```
你好。這是 WindFarm Battle 專案，一個風電教學卡牌遊戲。

請依以下順序執行：

1. 完整閱讀以下文件（按順序）：
   - HANDOFF.md
   - PROJECT_STATUS.md
   - DESIGN.md
   - VISUAL_WORKFLOW.md
   - CLAUDE.md

2. 開啟並理解 data/cards.json 的卡牌資料結構

3. 開啟 prototypes/v4-expansion.html 在瀏覽器中玩 3 局
   （遊玩時請特別注意 47 張卡的運作與 AI 行為）

4. **不要動手寫程式**，先輸出一份「重構計畫」，包含：
   - 你對專案的理解（5-10 句）
   - Sprint 1 的具體任務清單
   - 預定的檔案結構
   - 你的疑問清單（規格不清、設計有問題、需要決策的事項）
   - 預估時間與風險

5. 等我確認你的計畫後，再開始實作。

依 CLAUDE.md 規則 1：「先架構後實作」執行。
```

---

## 🎯 預期 Claude Code 會回覆什麼

Claude Code 應該會：

1. ✅ 確認讀完所有文件
2. ✅ 提交一份重構計畫（不直接寫程式）
3. ✅ 列出他的理解與疑問
4. ✅ 等你確認後才開始

如果 Claude Code 直接開始寫一堆程式碼——**請打斷他**，叫他先按 CLAUDE.md 的規則來。

---

## 🛡️ 安全網與風險控制

### 三個保險

1. **保留原型**：`prototypes/` 的 HTML 是 fallback，永遠不要刪
2. **頻繁 commit**：每個合理的中間狀態都 commit
3. **分支策略**：實驗性改動用 feature branch

### 緊急回滾

```bash
# 看歷史
git log --oneline

# 回到上一個版本
git reset --hard HEAD~1

# 或回到特定 commit
git reset --hard <commit-hash>
```

---

## 📝 推薦的 Git 工作流

```bash
# 開始新 Sprint
git checkout -b sprint/01-project-skeleton

# Claude Code 寫程式...

# 每個邏輯單元結束時 commit
git add src/core/cards.ts
git commit -m "feat: 重構卡牌資料載入層"

# Sprint 結束時合併
git checkout main
git merge sprint/01-project-skeleton
git push
```

**禁止：** Claude Code 自動 commit 或 push（CLAUDE.md 明令禁止）。

---

## 💡 給未來的你的提醒

幾個月後回頭看，你可能會困惑：

**Q: 為什麼選 Zustand 而不是 Redux？**
A: 看 DESIGN.md → Part 8 → 8.2

**Q: 為什麼故障的 required 和 counters 是分開的？**
A: F04 葉片損傷必須有 T02 才能修（required），但場上沒 T02 時 T08 也算 counter。看 DESIGN.md → 3.4。

**Q: 為什麼 M07 的 mw 是 12，cost 卻是 5（不是 2）？**
A: v4 設計，傳奇卡的費用反映稀有性與強度，不只看 MW。看 data/cards.json 中的稀有度系統。

**Q: 為什麼要分 Tier 1-4？**
A: 漸進式設計哲學。看 DESIGN.md → Part 1。

**Q: 為什麼視覺要分離成「AI 插畫 + 模板」？**
A: 業界標準做法，確保 47 張卡風格統一。看 VISUAL_WORKFLOW.md。

---

## 🆘 求救清單

如果遇到問題：

| 狀況 | 應對 |
|---|---|
| Claude Code 卡住 | 給它更小的子任務 |
| 重構後行為不一致 | 跑「對齊測試」（DESIGN.md → 8.3） |
| 平衡崩壞 | 跑 1000 場模擬（CLAUDE.md → 平衡性驗證） |
| 不知道該做什麼 | 看 PROJECT_STATUS.md 的 Sprint 規劃 |
| 設計問題 | 重讀 DESIGN.md，或開新對話問 Claude |
| 視覺工作流問題 | 看 VISUAL_WORKFLOW.md |

---

## 🎯 階段性檢查點

### 一週後

- [ ] Sprint 1 完成（專案骨架可運行）
- [ ] 有第一個 commit history
- [ ] Claude Code 知道專案結構

### 一個月後

- [ ] Sprint 2-3 完成（core + UI 重構）
- [ ] React 版能跑了
- [ ] 玩起來跟 v4 一樣順
- [ ] 有單元測試
- [ ] 1000 場模擬還在合格範圍

### 兩個月後

- [ ] Sprint 4-5 完成（卡牌模板 + 模擬器）
- [ ] 可以套版產出統一風格的 47 張卡
- [ ] 視覺資源開始準備

### 三個月後

- [ ] Sprint 6 完成（手機 App 包裝）
- [ ] iOS / Android 內測版本
- [ ] 找 5+ 人試玩過

如果三個月後 3 個以上打勾，你做得很好。

---

## 📊 進度追蹤建議

建議在 GitHub 用 Issues + Projects 追蹤：

```
GitHub Project: WindFarm Battle Development
├── To Do
├── In Progress
├── Review
└── Done

Issues 範本：
- [ ] Sprint 1: 專案骨架
- [ ] Sprint 2: core/ 重構
- [ ] Sprint 3: UI 遷移
- [ ] Sprint 4: 卡牌模板系統
- [ ] Sprint 5: 模擬器整合
- [ ] Sprint 6: 手機 App 包裝
```

---

## 🎉 最後的話

你已經完成了 80% 的設計工作。

剩下的 20% 是工程實作——這是 Claude Code 最擅長的部分。

**記住：**
- 不要怕拒絕 Claude Code 的方案
- 不要怕問問題（包括蠢問題）
- 不要怕回頭重做
- 保留所有原型作為設計史

幾個月後你回頭看，**這個專案會是你 DOF Lab 的代表作之一**。

加油！

— Claude（設計協作）
2025-05
