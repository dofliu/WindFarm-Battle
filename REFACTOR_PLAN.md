# 🧭 REFACTOR PLAN — WindFarm Battle 重構計畫（v2 · v3 基準版）

> 依 CLAUDE.md 規則 1「先架構後實作」產出。**本文件僅為計畫，未動任何產品程式碼。**
> 已與 Dof 確認：以 **v3 為對齊基準**、並已整理原型檔案。
> **決策已鎖定**（2026-05-21）：D1 資料以 cards.json(v4) 為準｜D2 先對等、平衡另案｜D3 文案全抽到 i18n。
> 狀態：D1–D3 已定；D4–D6 採預設（見第 6 節）。等 Dof 說「OK 開始 Sprint 1」即動工。

---

## 0. 現況快照（整理後）

```
windFarm-Battle/
├── *.md (9 份文件) + cards.json + REFACTOR_PLAN.md   ← 根目錄
└── prototypes/
    ├── v1-playable.html            (21 張，可玩，基本玩法)
    ├── v2-smart-ai.html            (21 張，可玩，智慧 AI)
    ├── v3-functional-cards.html    (27 張，可玩，最完整 ← 對齊基準)
    └── showcases/                  (5 個非互動展示/工具頁)
        ├── v4-47cards-showcase.html (47 張「展示」，不能玩)
        ├── card-ecosystem.html / card-style-analysis.html
        ├── layered-design.html / print-template-21.html
```
已刪除：重複的舊備份 `files/` 與 `files.zip`。

---

## 1. 我對專案的理解

WindFarm Battle 是 NCUT DOF Lab（劉瑞弘副教授）的風電運維教學卡牌遊戲，服務外行/學生/業界三類人，核心是「降低門檻、提高深度」。玩法為 12 回合雙人對戰、累計 MWh 高者勝，每回合 8 階段、2 動作費（可累積）。牌庫設計為 47 張 6 類（M/T/F/FN/W/C），稀有度 1–5，能力以 `tag` 驅動。三大系統為風速（1d6 含颱風）、故障（Sev 1–5 含連鎖/擴散/專屬克制）、技師克制矩陣（被克制＝回合結束自動修復）。已有完整 AI（行動評分＋局勢感知＋三段難度）與模擬器設計。目標是把 HTML 原型重構為 React 18＋TS(strict)＋Vite＋Zustand＋Tailwind＋Vitest，最終以 Capacitor 包成手機 App。鐵則：`core/` 純 TS、零 UI 依賴；資料驅動（改 JSON 不改碼）；視覺＝資料分離。

---

## 2. ⭐ 關鍵發現（讀完 v3 原始碼 + 跑基準後）

### 2.1 真相：沒有可玩的 47 張版本，最完整可玩版是 v3 / 27 張

可玩原型最多到 **v3，27 張**：M01–07、T01–07、F01–07、FN01–06。
那 47 張只存在於 `cards.json`（資料）＋一個不能互動的展示頁。

**→ 47 張可拆成兩塊，重構策略不同：**

| 區塊 | 卡 | 重構依據 | 可否對齊 |
|---|---|---|---|
| **A. 有 v3 實作（27）** | M01–07, T01–07, F01–07, FN01–06 | 對齊 v3 原始碼行為 | ✅ 可對齊（黃金樣本） |
| **B. 無任何實作（20）** | M08–12, T08–09, F08–09, FN07–08, W01–05, C01–04 | 依 cards.json + DESIGN.md 重建 | ❌ 只能標為「估計」 |

### 2.2 v3 原始碼 ≠ cards.json（資料模型與數值都有出入）

- **資料模型不同**：v3 用扁平 `special` 旗標（`salt`/`storm-vulnerable`/`big-fail`/`predict`/`free-repair`/`extra-action`）；cards.json 用結構化 `abilities[].tag`。**v3 完全沒有 tag 系統、沒有 rarity、沒有 abilities 陣列。**
- **M07 數值衝突**：v3 是 `cost2, mw12, special:'big-fail'`（舊版弱點機）；cards.json 是 `cost5, rarity5, 傳奇`＋三個光環能力（aura-mw／weather-immune／card-draw-trigger）。**兩者是不同張卡。**
- **F04 克制**：v3 `required:['T02']`；cards.json `required:['T02','T08']`（v4 多了無人機 T08 可修）。
- v3 **未實作**的機制：所有光環/免疫/觸發類 tag、天氣、合約、FN07–08、M08–12、T08–09、F08–09、M05 海事窗口、M09 免疫液壓、M10 不佔位、M12 限部署一次、T01「每回合一次」上限。

### 2.3 v3 基準模擬（工程基準，**非實驗數據**）

我把 v3 純邏輯抽到 Node 跑 **hard vs hard 2000 場**（27 張池）：

| 指標 | 結果 | CLAUDE.md 標準 | 判定 |
|---|---|---|---|
| P1/P2 勝率 | 50.5% / 48.4% | 45–55% | ✅ |
| 平均分數差 | 68.8 vs 68.2 | ≤5 | ✅ |
| 勢均力敵率(差≤5) | **13.7%** | ≥25% | ❌ |
| 一面倒率(差≥30) | **39.8%** | ≤20% | ❌ |
| 冷門卡 | F01/F02/F03/F05 <3% | 每張 ≥3% | ❌ |

> ⚠️ **這代表現有 v3 原型本身就違反 3 條平衡標準。** 「忠實對齊 v3」與「通過平衡門檻」會直接衝突——見第 6 節決策 D2。
> （此為 27 張池的數字；47 張的平衡是未知數，因為沒有可玩實作。）

### 2.4 v3 已知 bug（重構時要決定「修正 or 照搬」）

- **FN05 風能預測無效**：`endRound` 取用 `futureWind` 後，`startRound` 立刻用 `rollWind()` 覆蓋掉 → 預測純裝飾。
- **牌庫無棄牌堆**：抽空後直接用「全卡池」重洗，非真實 TCG 牌庫。
- **T01「每回合一次免費修」未設上限**：`processAutoRepair` 每次把所有可修故障全修掉。
- 手牌上限 7（程式註解寫 +1，比文件早期 6 大）。

---

## 3. 重構策略（依 v3 基準）

1. **資料來源採 cards.json（v4，47 張）為單一真實來源**；`core/` 的規則引擎實作 **tag 系統**（DESIGN.md/CLAUDE.md 要求），不沿用 v3 的扁平 `special`。v3 的 `special` 行為對應到等價 tag。
   - **(D3 決議) cards.json 只留結構/數值**：`id, type, cost, rarity, stats, abilities[].tag/value, counters, required, cascade, spreading, special-flags…`。**所有文案**（卡名、flavor、能力名稱與描述、類別 label）搬到 `i18n/zh-TW.ts`，以 `card ID` ＋能力索引為鍵；未來加 `en` 只翻語言檔。
2. **A 區 27 張**：規則引擎邏輯對齊 v3 原始碼（風速表、結算公式、克制 gate、cascade、FN01–06、T07 加動作/折扣、salt 每 4 回合 -2%）。建「黃金樣本」對齊測試。
3. **B 區 20 張**：依 cards.json + DESIGN.md 實作，程式碼與測試中**明確標註 `// 無原型基準：依文件重建（估計）`**，不宣稱已對齊。
4. **可重現性**：v3 用 `Math.random`，無法重現。`core/` 改用**可注入的 seeded PRNG**，讓對齊測試與 1000 場模擬可決定性重跑。
5. **平衡**：先「行為對等」，平衡調整一律另開 PR＋附 1000 場模擬，不混進重構（待 D2 確認）。

---

## 4. Sprint 1 計畫：技術骨架

> 目標（PROJECT_STATUS.md 驗收）：`npm run dev` 看到「Hello WindFarm Battle」。

### 4.1 檔案結構

```
src/
├── core/                       # 純 TS，零 UI 依賴（Sprint 1 只建空殼+型別）
│   ├── types.ts
│   ├── rng.ts                  # seeded PRNG（新，為對齊/模擬）
│   ├── cards.ts                # 載入 cards.json + 查詢介面
│   ├── game-state.ts
│   ├── rules-engine.ts
│   └── ai/{evaluator,strategy,difficulty}.ts
├── ui/{components,containers,styles}/
├── template/                   # Sprint 4
├── store/game-store.ts         # Zustand
├── data/cards.json             # ⬅ 由根目錄搬入（先問你，見 D3）
├── i18n/zh-TW.ts
├── App.tsx · main.tsx
tests/{unit,integration}/       # Vitest
+ 設定檔：tsconfig(strict) · vite · tailwind · postcss · eslint · prettier · .gitignore
```

### 4.2 套件（皆來自 CLAUDE.md 已選定清單）

react/react-dom、typescript(strict)、vite/@vitejs/plugin-react、zustand、tailwindcss/postcss/autoprefixer、vitest/@testing-library/react/jsdom、eslint/prettier/typescript-eslint。
**不裝**：Redux、styled-components、lodash、moment；Capacitor 留到 Sprint 6。

### 4.3 npm scripts
`dev / build / preview / test / lint / format`，預留 `simulate`（Sprint 5）、`cards:build`、`cards:pdf`（Sprint 4）。

### 4.4 驗收
`npm run dev` 顯示 Hello 畫面；`npm run test` 有 1 個 smoke test 通過；`npm run lint` 0 error；TS strict 全綠。**不自動 commit**，commit 訊息（中文）給你、由你執行。

---

## 5. 已由 v3 原始碼解答的疑問（前一版的疑問，現有答案）

- **`required` 語意（前 A1/A2）**：v3 `processAutoRepair` 證實——技師能修故障的條件是「`tech.counters` 含此故障」**且**「故障無 `required`，或 `required` 陣列含此技師」。所以 `required` 是**白名單 gate**：有 required 時只有名單內技師能修；F07 無 required → T03 或 T06 任一即可。✅ 採此語意。
- **平均風係數 0.65（前 B4）**：v3 確認 `AVG_WIND_COEFF=0.65` 僅用於 **AI 評估與局勢估算**；真正結算用精確 `wind.coeff` 表。✅ 兩者分開，沿用。
- **動作經濟**：v3 確認 base 2 ＋（T07 在場 +1）＋ pendingExtraActions（FN04，上限累積 2）；T07 讓技師卡 cost −1（最低 1）。✅
- **替換機組**：場上滿 3 台時打機組＝替換（預設換最弱）。✅

---

## 6. 決策紀錄

### 已定（2026-05-21，Dof 確認）
- **D1 卡牌數據 = cards.json(v4) 為準**。M07 等被 v4 重設計的卡採傳奇版；這些卡「不對齊 v3、依文件實作」。
- **D2 平衡 = 先對等、平衡另案**。重構只求行為與 v3 一致，平衡門檻不當合併條件；47 張齊全後另開 PR 用 1000 場模擬調整。
- **D3 i18n = 文案全抽到 `i18n/`**。cards.json 只留 ID/數值/結構；卡名、flavor、能力名稱與描述、類別 label 全搬語言檔，以 card ID＋能力索引為鍵。

### 採預設（D4–D6，未反對即沿用）
- **D4 v3 bug → 重構即修正**：FN05 風能預測真正生效、T01 設「每回合一次」上限、牌庫加棄牌堆。對齊測試對這幾點放寬比對（行為故意不等於 v3，會在測試註記）。
- **D5 cards.json 搬到 `src/data/`**：給 Vite import；根目錄不保留舊檔。
- **D6 環境**：我產出專案檔並在 sandbox 驗證 build；`npm install`／`npm run dev` 由你在 Windows 跑。

### 新增產品方向（2026-05-21，Dof）
- **D7 新增「天氣對抗模式（同題競賽）」**：非對戰模式。電腦生成同一串環境條件（風速／天氣／設備／故障），多名玩家（或單人 vs AI 基準）各自在限定回合內最佳化收入，最後比分。
  - 架構含意：**core/ 必須「模式無關」**——「對戰」與「同題競賽」是套在同一規則引擎上的不同控制器＋勝負判定，**不可把「兩人互打」寫死進核心**。已規劃的 seeded PRNG（`core/rng.ts`）正好支援「同題＝同 seed」。
  - 待細化：同題模式中玩家間是否仍可互丟故障？（影響計分，做到該模式時再定）
- **D8 優先序：可玩＋機制完備優先，視覺／印刷往後**：原 Sprint 4（卡牌美術模板系統）**降級延後**，等機制與平衡定案後才做。先把「能玩、規則正確、平衡站得住」做扎實，再談美編與紙本印刷。
- **D9 動畫／音效列為後期**：PTCG 式出牌／出招動畫＋音效，屬機制定案後的增強。**架構伏筆**：UI 由 core 吐出的**事件流**驅動（出牌／受擊／修復／結算…），動畫掛在事件上即可，不必重寫；現在先把 v3 的 log 正式化為事件流。
- **D10 研究用統計／遙測機制**：拆兩塊——(a) **模擬分析**（僅平衡用，**依 CLAUDE.md 不可當論文實驗數據**）；(b) **真人對局遙測**（結構化記錄每局的選擇／結果／用時／卡牌使用，可匯出供論文）。同題競賽模式因變數受控，最適合產生可比較的研究數據。提醒：收學生資料涉**受試者同意／IRB** 流程（你決定）。

---

## 7. 風險與緩解

| 風險 | 等級 | 緩解 |
|---|---|---|
| 20 張無原型基準 | 🟡 中 | 明確標註「估計」，不宣稱對齊；交付前請你逐張確認規則 |
| v3≠cards.json 數值衝突 | 🟡 中 | D1 定案；以 cards.json 為資料權威 |
| 對齊 vs 平衡衝突 | 🟡 中 | D2 定案；先對等後平衡 |
| Math.random 不可重現 | 🟢 低 | core 改 seeded PRNG |
| Win/Linux 環境差異 | 🟢 低 | 路徑用 path API；install 在你機器跑 |

---

## 8. 修訂後的 Sprint 順序（依 D8「機制優先、視覺往後」）

| # | 內容 | 對應原規劃 | 備註 |
|---|---|---|---|
| **S1** | 技術骨架（Vite＋React＋TS＋Tailwind＋Zustand＋Vitest） | 同 | 模式無關地基；含 `core/rng.ts` seeded PRNG、事件流雛形 |
| **S2** | core 重構：A 區 27 張＋對齊測試（v3 黃金樣本），文案抽 i18n | 同 | 行為對等優先（D2） |
| **S3** | B 區 20 張（天氣/合約/M08-12/T08-09/F08-09/FN07-08，tag 系統） | 擴充 | 無原型基準，標「估計」 |
| **S4** | 模式系統：對戰 ＋ **天氣對抗（同題競賽）**（D7） | 新 | core 控制器層；同 seed 同題 |
| **S5** | UI 層（可玩、事件流驅動，為動畫預留掛點） | 原 Sprint 3 | 先求好玩可玩，不做美編 |
| **S6** | 模擬器整合＋**遙測/統計**（D10：模擬分析＋真人對局記錄） | 原 Sprint 5 ＋新 | 平衡調整在此另案進行 |
| **S7** | ⏸ 卡牌美術模板系統（套版/印刷） | 原 Sprint 4（**降級延後**） | 機制與平衡定案後才做 |
| **S8** | 動畫／音效（PTCG 式）（D9） | 新（後期） | 掛在事件流上 |
| **S9** | Capacitor 手機 App | 原 Sprint 6 | |

> 順序可再討論；重點是 **S1–S6（能玩＋機制＋數據）做穩後，才進 S7 美術與 S8 動畫**。

## 9. 下一步

1. ✅ D1–D10 已記錄（D4–D6 採預設，要改跟我說）。
2. 你說「OK 開始 Sprint 1」→ 我建骨架，驗收為 `npm run dev` 看到 Hello 畫面。

> 在你說「OK 開始 Sprint 1」前，我不會寫任何產品程式碼，也不會做任何 git 操作。
