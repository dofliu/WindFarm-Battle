# 🚀 HANDOFF — WindFarm Battle 專案交接（v3）

> **這是給 Claude Code 看的第一份文件。** 整個專案的現狀、決策、與下一步行動都在這裡。
>
> **最後更新：2026-06-14（progress 99%）**

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
- [x] **App icon / splash screen（Android）**：以 Python Pillow 繪製風力發電機主題圖示（深藍背景 + 金色光暈 + 白色風力機），產生 Android 全部 DPI 規格（mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi）的 ic_launcher / ic_launcher_round / ic_launcher_foreground，以及各方向 splash（直向/橫向 全部替換）；新增 `scripts/generate_icons.py`
- [x] **App icon / splash screen（iOS）**：同主題，產生 iOS 全規格 AppIcon（1024×1024 App Store + iPhone/iPad 各尺寸 @2x/@3x，共 11 個檔案）+ splash（2732×2732 × 3 份）；更新 `Contents.json` 讓 Xcode 識別所有規格；新增 `scripts/generate_ios_icons.py`
- [x] **英文版 i18n**：`en.ts` + `cards.en.ts` + `LocaleContext` + `LocaleSwitcher`，標題畫面已有 ZH/EN 切換按鈕，50 張卡完整英文文案，t() 支援多語言回退
- [x] **戰鬥畫面全面 i18n**：BattleScreen / SideLabel / BattleCenter / RoundSummaryToast / LibraryModal / GameOverScreen 所有硬編碼中文字串全部接入 t()，語言切換在整個遊戲中生效
- [x] **TopBar 完整 i18n**：難度選項（簡單/普通/困難↔Easy/Normal/Hard）、按鈕標籤、副標題全部接入 t()，並在 TopBar 加入 LocaleSwitcher，進行中可隨時切換語言；同步更新測試以配合新 key
- [x] **全專案 i18n 100% 完成**：ThemeSwitcher、HoverPreview、Hand、Card、TitleScreen 所有殘餘硬編碼中文字串全部接入 t()；新增 14 個 i18n key（theme.*、card.*、hand.*、title.*）
- [x] **PWA 支援**：`vite-plugin-pwa` + Web App Manifest + Workbox Service Worker；支援「加入主畫面」（Android Chrome / iOS Safari）；4 個 PWA icon（192/512px × 一般/maskable）；build 產出 `sw.js` + `workbox-*.js` + `manifest.webmanifest`，預快取 13 個靜態資源（435KB）；index.html 加入 Apple PWA meta 標籤
- [x] **遙測批次分析腳本**：`scripts/analyze_telemetry.py`，讀取 `data/telemetry/*.json` 批次分析多場對局；自動計算勝率/分數/回合數統計、逐回合分數趨勢、卡牌類別分布、Top 10 使用卡牌、冷門卡清單；終端機摘要 + 輸出 `reports/telemetry_report_YYYYMMDD.md` Markdown 研究報告；附 10 筆測試資料（`data/telemetry/test_*.json`）
- [x] **對局遙測系統**：`src/core/telemetry.ts`，從 `events[]` 提取結構化 `GameRecord`（對局 ID、難度、勝敗、逐回合出牌序列、分數、出牌頻率）；`GameOverScreen` 加入「研究遙測」區塊，提供「下載 JSON」和「下載 CSV」兩個按鈕；`game-store` 加入 `gameStartedAt` 記錄開局時間；兩語匹出提示文字（zh-TW / en）
- [x] **GitHub Pages 自動部署**：`.github/workflows/deploy.yml` GitHub Actions 工作流程（push main 自動觸發）；`npm run deploy` 手動部署備用；`public/.nojekyll` 確保 Vite `_assets` 目錄可存取。❗ **需手動到 GitHub 設定頁面啟用 Pages：** Settings → Pages → Source 選 **GitHub Actions**，完成後網址為 `https://dofliu.github.io/WindFarm-Battle/`

### 🎮 遊戲機制改善（2026-06-01 排入，按優先序執行）

  - [x] 🔴 **特效方向 bug 修復**：`game-store.ts` 的 `_deriveEffects` 函式，`targetSide` 改為直接使用 `e.player as 0 | 1`，不再做 `1 - e.player` 翻轉（commit 包含在 v4.3）
  - [x] 🔴 **場上卡牌 hover 詳細資訊**：`Turbine.tsx` 加入 `TurbineHoverTooltip` 元件（兩主題），顯示卡牌名稱、有效可用率、故障列表（故障名 + 剩餘回合 + drop%）、MW 數值；新增 7 個 i18n key（turbine.*）；支援語言切換（commit 包含在 v4.3）
- [x] 🟡 **技師卡每回合出牌限制（一回合只能出一張）**：`PlayerState` 加入 `techPlayedThisRound: boolean`；`canPlayCard` 加入第二張技師卡鎖定；`_beginTurn` 時重置；新增 5 個測試（215 tests 全通過）（commit 包含在 v4.4）
- [x] 🟡 **故障數量上限（同台風機最多 2 個故障）**：`_applyFault` 主目標與 cascade 目標均加入上限檢查；第 3 個故障直接觸發停機（不疊加）；新增 5 個測試（220 tests 全通過）（commit 包含在 v4.5）
- [x] 🟡 **每回合自動補牌到 4 張**：`RulesConfig` 加入 `refillHandTo?: number`；`runGame` 每位玩家 `_beginTurn` 後補牌到目標張數；`game-store.ts` 的 `startRound` 和 `advanceAfterTurn` 同步補牌；`UI_RICH_CONFIG.refillHandTo=4`；新增 5 個測試（225 tests 全通過）（commit 包含在 v4.6）
- [x] 🟠 **新增全場恢復強力卡（FN09 緊急大修）**：FN09 massRepair 卡（費用 3，稀有度 4，🔩 圖示）；清除自家所有機組所有故障 + 停機復機（avail 恢復 20%）；PlayerState 加入 usedOncePerGame 每場限用 1 次；i18n 中英文皆補齊；新增 5 個測試（236 tests 全通過）
- [x] 🟠 **天氣卡加入「我方免疫」tag**：修改 W01-W04 的設計，讓打出天氣卡的一方有部分免疫或加成，使天氣卡成為主動策略而非隨機干擾
- [x] 🟠 **合約卡改為雙方攻防目標**：重新設計 C01-C04 的觸發邏輯，改為「雙方共享目標，先達成的人拿獎勵」，讓合約成為攻防焦點；新增 `contract-stolen` 事件；打出者優先原則；新增 2 個測試（239 tests 全通過）（commit v5.0）
- [x] 🔵 **AI 行為多樣化**：`evaluator.ts` 加入 `getDifficultyMultipliers()`；Easy attackMult=0.5/repairMult=0.5/deployMult=0.7；Medium attackMult=0.85/repairMult=1.0；Hard attackMult=1.2/repairMult=1.3/deployMult=1.1 + targetHighestMW 加成；`generateActions()` 傳入 difficulty；新增 6 個測試（231 tests 全通過）（commit 包含在 v4.7）
- [x] 🔵 **風機升級進化系統**：新增 UP01-UP04 升級卡（降域/近岸/離岸/通用），實作 `evolveTurbine` effect，進化時保留 avail/faults/mwBonus；新增 `turbine-evolved` 事件；新增 5 個測試（244 tests 全通過）（commit v5.1）
- [x] 🔵 **W05 冰風 random-blade 故障邏輯**：`_applyWeather` 加入 random-blade 邏輯，對對手隨機一台非停機機組施加 F04 葉片故障（drop=20, rounds=2, sev=3）；打出者因 `self-immune-blade-fault` tag 免疫；故障上限保護；新增 5 個測試（249 tests 全通過）（commit v5.2）
- [x] 🟢 **天氣免疫狀態 UI 視覺化**：`BattleCenter.tsx` 新增 `WeatherImmunityBadges` 元件，在天氣卡列表下方顯示玩家的免疫狀態（🛡 我方免疫停機 / 風速懲罰 / 葉片故障，⚡ 風能加成）；新增 8 個 i18n key（weather.*）；支援 Cumulus/Tideboard 雙主題（249 tests 全通過）（commit v5.3）
- [x] 🟢 **FN08 insurance-shield 完整邏輯**：`DeployedTurbine` 加入 `shieldCount?: number`；`_executeFunc` insurance case 改為對指定機組加 1 層保護盾；`_applyFault` 加入保護盾檢查（shieldCount > 0 則消耗一層並短路故障）；新增 `turbine-shielded` 和 `shield-absorbed` 事件；新增 2 個 i18n key（turbine.shielded / turbine.shieldAbsorbed）；更新卡牌文案（zh-TW + en）；新增 4 個測試（253 tests 全通過）（commit v5.4）
- [x] 🟢 **T05 SCADA 工程師 fault-warning 能力**：`_beginTurn` 加入 fault-warning 邏輯（對手場上有 T05 時，對當前玩家手牌中第一張 fault 卡發出預警事件）；`beginTurn()` 純函式版改回 `ApplyResult`；`game-store.ts` 全部 `_beginTurn` 呼叫點更新為收集事件；新增 `hasFaultWarning()` 輔助函式；新增 `fault-warning` 事件型別；新增 2 個 i18n key（tech.faultWarning zh-TW + en）；新增 5 個測試（258 tests 全通過）（commit v5.5）
- [x] 🟢 **T08 無人機操作員 peek-hand + T09 研發總監 func-bonus**：`_deployTech` 加入 peek-hand 觸發（部署時查看對手前 2 張手牌，不消耗）；`PlayerState` 加入 `funcBonusThisRound`；`_applyActionMutate` 加入 func-bonus 觸發（出 func 卡後若場上有 T09 則 +1 動作，上限 2）；`_beginTurn` 重置 `funcBonusThisRound`；新增 `peek-hand` / `func-bonus` 事件型別；新增 4 個 i18n key（tech.peekHand / tech.funcBonus zh-TW + en）；新增 9 個測試（267 tests 全通過）（commit v5.6）

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

**文件版本**：v5.4（FN08 insurance-shield 完整邏輯）
**最後更新**：2026-06-12
**狀態**：React 重構完成，CardExporter 完成，全專案 i18n 100% 完成，Android + iOS icon / splash 全部完成，PWA 支援完成，GitHub Pages CI/CD 完成，對局遙測系統完成，遙測批次分析腳本完成，特效方向 bug 修復完成，Turbine hover 詳細資訊完成，技師卡每回合出牌限制完成，故障數量上限完成，每回合自動補牌到 4 張完成，AI 難度分級化完成，FN09 緊急大修完成，天氣卡我方免疫完成，合約卡雙方攻防完成，風機升級進化系統完成，W05 random-blade 故障邏輯完成，FN08 insurance-shield 完成，待手動啟用 Pages + 實機測試 + 學生試玩
