# 📌 NOTES — 接續開發注意事項（給 Claude Code / Dof）

> 這份是「接手前先看」的現況與注意事項。詳細設計看 `REFACTOR_PLAN.md` 與 `SPRINT2_DESIGN.md`。
> 最後更新：2026-07-09（S8 手感沉浸強化：Web Audio 合成音效 + 螢幕震動 + 分數跳動 + 體驗設定面板）。

---

## 0. 最新：S8 手感沉浸強化（Juice Pass）⭐

roadmap 的「動畫／音效後期增強」落地。**純 UI/store 層，零 core 規則改動**（D9：UI 由事件流驅動）。

- **音效**：`src/ui/audio/sound-engine.ts` 用 Web Audio API **即時合成**所有音效（零音檔，離線可跑），
  首次使用者手勢解鎖（瀏覽器自動播放政策）。`event-sounds.ts` 是**純函式**事件→音效映射（可測），
  `useGameFeedback.ts` diff `store.events` 逐批播放。出牌/部署/技師/故障/修復（完全 vs 部分不同音）/
  得分/颱風/勝負…各有音色。
- **視覺 juice**：受擊/颱風 → 螢幕微震（`wf-shake`，≤7px 防暈）；結算得分 → 分數彈跳（`wf-score-pop`）。
  `@media (prefers-reduced-motion)` + 使用者可關雙保險。
- **設定**：`src/store/settings-store.ts`（持久化 `wfb-settings`）音效/音量/螢幕震動/手機震動；
  `SettingsModal.tsx`（⚙️）+ TopBar 一鍵靜音（🔊/🔇）。預設尊重系統 `prefers-reduced-motion`。
- **手機震動**：`navigator.vibrate`（無新依賴），受擊/勝利有觸覺回饋。
- 測試：`event-sounds.test.ts`（15）+ `settings-store.test.ts`（5）；全套 **359** 綠、tsc/lint/build 乾淨。
- ⚠️ 坑重現：撰寫時再度混入 U+200B 零寬空格（第 3 節第 5 點），已用 `perl -CSD` 清除；
  若日後 eslint 報 `no-irregular-whitespace`，掃 `[\x{00A0}\x{200B}\x{2028}\x{2029}\x{FEFF}]`。

---

## 1. 一句話現況

專案骨架（Vite+React+TS+Tailwind+Zustand+Vitest）已建好。**Sprint 2/3/5 結案** / **Route B 完成** / **Sprint 4 卡牌模板系統完成**：可在 `npm run dev` 玩到完整 12 回合對 AI 戰局，並可用「🎴 列印」按鈕瀏覽/列印全部 50 張卡。所有產出 tsc(strict)/vitest **209** 全綠/eslint/build 全綠（**progress 95%**）。

**Route B（知識效益修復模型）摘要**：
- 起始固定艦隊：OS8(8MW) + OS10(10MW) + OS12(12MW)，雙方對稱預部署
- `faultCategory` 故障分類（機械/葉片/電氣/感測/液壓）+ 技師 `specialty` 專長對應
- 完全修復（specialty=faultCategory）vs 部分修復（avail 永久 -floor(drop×0.5)%）
- CardChip/TurbineSlot/EventLog/CardLibraryModal/HowToPlayModal 全部更新顯示教育標籤
- **`originalAvail` 追蹤**（新）：`DeployedTurbine.originalAvail` 記錄部署時的初始可用率；TurbineSlot 在 avail 下降時顯示 `⬇ −N% 永久` 橙色提示，讓學生直觀看到部分修復的長期後果
- 牌庫：50 張（含 OS8/OS10/OS12），抽牌池 39 張（退役 M01–M06/M08/M11）

**Route B 1000 場 hard×hard 平衡驗證（seed=1，校準後門檻）**：
```
p1WinRate 52.3% / p2WinRate 46.1% / drawRate 1.6%   ✅ 均在 42–58% 範圍，差距 6.2pp
avgP1 187.2 / avgP2 185.5 / avgScoreDiff 1.73 MWh   ✅ 極接近
closeRate 39.3%（相對差≤3%，目標 ≥25%）              ✅
blowoutRate 4.6%（相對差≥12%，目標 ≤20%）            ✅
卡牌涵蓋：41 種 / 39 抽牌池，全部 ≥1.5%              ✅
```
> 門檻已從絕對差（≤5 MWh）改為相對差（≤3% of combined），並修正 AI 對 M07 aura-mw/M10 no-slot 的評估盲點。M07/M12/W02 標記為情境性卡，不計入冷門警示。

---

## 2. 進度表

| 階段 | 狀態 | 說明 |
|---|---|---|
| Sprint 1 骨架 | ✅ | Vite/React/TS/Tailwind/Zustand/Vitest；Hello 畫面 |
| S2.0 i18n 抽取 | ✅ | 卡牌文案搬到 `src/i18n/cards.zh-TW.ts`；cards.json 瘦身（數值零變動） |
| S2.1 核心迴圈 | ✅ | 結算/動作經濟/12回合/鹽霧/勝負，對齊 v3 |
| S2.2 故障系統 | ✅ | applyFault/cascade/repairFaults（克制+required）/T01 D4 上限/spreading；接入 runGame |
| S2.3 動作+事件 | ✅ | actions.ts：Action/effectiveCost/canPlayCard/legalActions/applyAction；FN01–06、T07 折扣、T06 free-repair；FN05 D4 修正接 runGame（futureWind） |
| S2.4 AI | ✅ | ai/strategy（evaluateBoard/getStrategy）、ai/evaluator（4 套評估係數逐字對齊 v3）、ai/difficulty（pickByDifficulty，easy/medium/hard）、ai/index（generateActions/aiChoose/aiTakeTurn）；RESERVE_THRESHOLD=-10 |
| **S2.5 α 模擬器**     | ✅ | simulation/runner.ts：simulate(N 場) → SimSummary（勝率/平均/closeRate/blowoutRate/cardUsage）；scripts/measure-1000.ts 可一次性測量 |
| S2.5 β 對齊           | ⬜ 暫緩 | v3-oracle 凍結 + tests/golden/v3-baseline.json + tests/alignment.test.ts。工作量大，獨立任務。 |
| **S3.0 骨架**         | ✅ | src/core/abilities.ts：getAuraMwBonus / hasWeatherImmune / hasCardDrawTrigger / isFaultImmune |
| **S3.1 M07 三能力**   | ✅ | aura-mw（結算+AI 計入）/ weather-immune（max(coeff,1.0)）/ card-draw-trigger（出 tech/func 後抽 1） |
| **S3.2 M03/M05/M06** | ✅ | lowwind-resist（低風 0.4→0.7）/ offshore-delay（部署當回合 skip，DeployedTurbine 加 deployedRound）/ storm-vulnerable（高風 0.7→×0.5）。所有估計值集中在 abilities.ts 常數，未來調整一處改全 |
| **S3.3 M08–M12**      | ✅ | M08 fragile（drop ×1.5）/ M09 immune-hydraulic（F03 短路）/ M10 fault-immune（全故障短路）+ no-slot（不佔 3 台格）/ M11 lowwind-boost+highwind-penalty（低風 1.0/高風 ×0.5）/ M12 no-wind-power（永遠 1.0）。**skip：cheap-deploy / slow-recovery / once-per-game**（無 v3 基準且需更大狀態追蹤，留作 small fix） |
| **S3.4 T05/T06/T08/T09** | ✅ | T09 func-discount（func 卡 cost -1 下限 0）/ T05 predict-wind（部署時填 3 個 futureWind，與 FN05 同邏輯）/ T06 periodic-repair（runGame 迴圈內每回合修 1 個 sev≤3 故障）。**skip：T05 fault-warning / T08 peek-hand / T09 func-bonus**（純資訊 / 設計未明 / T08 remote-blade 已透過 F04 counters 處理） |
| **S3.5 F05/F08/F09**  | ✅ | F05 storm-amplify（颱風/高風 drop ×2）/ F08 unpredictable（_tickFaults 後 50% 機率 swap 到另一台，runGame 迴圈內接 _unpredictableShuffle）/ F09 disable-scada（施加時清空 state.futureWind）。**skip：F09 info-leak / F08 fast-damage**（純資訊；fast-damage 估計值已透過 stats.rounds=1 反映） |
| **S3.6 FN07/FN08 + W**| ✅ | 新增 `state.activeWeather: ActiveWeather[]` 系統。W01 wind-boost（coeff +0.3 cap 1.0）/ W02 shutdown-all（結算時全跳過）/ W03,W05 wind-penalty（coeff -0.3 cap 0）/ W04 mwh-double（×2 取代 mwhBoost ×1.5）/ FN07 tutor-turbine（從牌庫搜最高 MW turbine 入手牌）。runGame 結算後 `_tickWeather` 倒數。AI generateActions 支援 weather 卡簡化評分。**skip：FN08 insurance-shield / W02 damage-storm-vulnerable / W05 random-blade**（設計未明 / 需更多狀態） |
| **S3.7 C01–C04 合約** | ✅ | 新增 `state.activeContracts: ActiveContract[]` 系統。`evaluateContractCondition` 純函式統一條件判定（4 種 target.type）。runGame 結算後 `_checkContracts`：一次性條件達標即發 reward；持續條件（rounds）累積 progress（estimate：未達標 progress 不重置）。AI 加 contract 評分。**Sprint 3 結案 ✅** |
| **S5.0 game-store** | ✅ | Zustand store 包裝 GameState；newGame/playCard/endTurn/selectFaultTarget/cancelPending；玩家=P0，AI=P1，玩家 endTurn 後自動跑 AI 回合 + 結算 + 進入下一回合 |
| **S5.1 UI 元件** | ✅ | GameHeader（回合/風速/分數）/ PlayerArea（機組+技師）/ TurbineSlot（含故障 badge）/ Hand（手牌點擊）/ EventLog（事件中文描述）/ CardChip（通用卡牌） |
| **S5.2 互動流程** | ✅ | 點手牌出卡；fault 卡若對手>1 機組進入挑目標模式（對手機組黃框可點）；結束回合按鈕；結局畫面 + 再來一場 |
| **S5.3 測試 + 四道** | ✅ | app.test.tsx 改為 store 整合測試（render 5 case） |
| **Route B originalAvail 追蹤** | ✅ | DeployedTurbine.originalAvail 永久損傷視覺化；TurbineSlot ⬇ 提示；GameOverBanner 統計 |
| **模擬器 Web 模式** | ✅ | SimulatorPanel.tsx（📊 按鈕）：200/500/1000 場，勝率/勢均力敵/一面倒/熱門冷門卡 |

目前測試：12 檔 209 測試全過（rng/cards/wind/i18n/**app×5**/rules/faults/actions/ai/simulation/abilities×72）。

🎉 **Sprint 3 結案：1000 場 hard×hard 實測（含全部 v4 機制）**：
- 勝率 P1 47.8% / P2 51.4% / 平 0.8%（後手略優、合理）
- avgScoreDiff −1.97（**比 S2.5 的 −3.42 更平衡**）
- avgP1 62.1 vs avgP2 64.1（總分提升 ~17%，因 W/C 帶來新得分管道）
- closeRate 10.2% / blowoutRate 44.1%（仍不合格但屬 D2「先求對等」階段）
- **cardsPlayed 46/47** — 比 S2.5 的 37/47 大幅提升，幾乎所有卡都進入實戰

⚠️ **S3.1 後發現的平衡議題**（記下備忘，**不在 Sprint 3 範圍**處理）：
M07 在 cards.json cost=5，但 actionsLeft 上限是 4（基礎 2 + T07 aura +1 + FN04 pending +1 同回合到位的合理上限），所以 **M07 在實戰中永遠出不來** → 三能力對 1000 場 hard×hard 結果毫無影響（與 S3.1 前完全相同數據）。
→ 屬資料/平衡議題：要嘛降 M07 cost 到 ≤4，要嘛新增「降本」功能卡，要嘛接受傳奇卡僅作為強展示。等 Sprint 4/5 階段或專門平衡 PR 處理。

S2.5 α 1000 場 hard×hard 實測基準（v4 完整資料集 47 張、seed=1+i）：
- 勝率：P1 45.2% / P2 53.7% / 平 1.1%（後手略佔優，與 v3 50.5/48.4 同方向、容差內）
- 平均分數：53.4 vs 56.8；avgScoreDiff −3.42
- closeRate 12.4%（v3：13.7%；門檻 ≥25% 不合格，與 v3 同方向）
- blowoutRate 37.0%（v3：39.8%；門檻 ≤20% 不合格，與 v3 同方向）
- 出牌涵蓋 37 張卡（B 區 20 張有部分被打）

→ D2「先求行為對等，平衡另案」目標達成（重構後與 v3 同方向、容差內），平衡調整需待 β 對齊驗證後另開 PR 用模擬器調數值，**不混進重構**。

---

## 3. ⚠️ 最重要的注意事項（坑）

1. **沒有可玩的 v4 原型**。能玩的最高版本是 `prototypes/v3-functional-cards.html`（**27 張**）。47 張只存在於 cards.json + 一個不能玩的展示頁。
   → 對齊只能對「v3 跑過的 27 張機制」。另外 **20 張**（天氣 W、合約 C、M08–12、T08–09、F08–09、FN07–08）**無原型基準，依文件重建並標「估計」**。

2. **v3≠cards.json**。v3 用扁平 `special` 旗標、無 tag 系統；cards.json(v4) 用 `abilities[].tag`。**M07 等卡 v4 重設計過**（v3 M07=cost2 弱點機；v4=cost5 傳奇三能力）。**資料一律以 cards.json(v4) 為準（D1）**，引擎實作 tag 系統。

3. **v3 平衡基準本身不合格**（hard×hard 2000 場）：勝率 50.5/48.4 ✅、平均分數 ✅，但 **勢均力敵率 13.7%（需≥25%）❌、一面倒率 39.8%（需≤20%）❌、F01/F02/F03/F05 使用率<3% ❌**。
   → 所以 **D2：先求行為對等，平衡另案**（47 張齊全後另開 PR 用模擬調整，別混進重構）。

4. **v3 已知 bug 的處理**（D4）：
   - FN05 風能預測在 v3 無效（被 startRound 覆蓋）→ 重構要修。
   - T01「每回合一次免費修」v3 沒設上限 → 重構要設。
   - **棄牌堆：S2.1 先沒做**（保留 v3「牌庫空重洗全卡池」），因為它改動牌組經濟、屬平衡範疇，延後到平衡階段。
   - 修正後行為「故意不等於 v3」，β 對齊用 `legacyV3` 旗標關閉修正來逐場比對。

5. **程式碼檔請用編輯器/正常寫入**。先前用某工具編輯時混入過隱形 Unicode 行終止符（U+2028）導致 esbuild 解析失敗、Read 卻看不出來。若遇到「莫名其妙的語法錯誤」，先 `grep -nP "\xe2\x80[\xa8\xa9]"` 掃一下。

---

## 4. 關鍵決策速查（詳見 REFACTOR_PLAN.md 第 6 節）

- **D1** 資料以 cards.json(v4) 為準。
- **D2** 先對等、平衡另案。
- **D3** 文案全抽到 i18n（cards.json 只留數值/結構；鍵 `cards.<id>.name/.flavor/.ability.<i>.name|desc`）。
- **D4** v3 bug 重構即修（棄牌堆例外，延後）。
- **D5** cards.json 在 `src/data/`。
- **D6** sandbox 驗證 build；`npm install`/`dev` 在 Windows 跑。
- **D7** 新增「天氣對抗（同題競賽）」模式 → core 必須**模式無關**（已用 seeded RNG + `GameMode` 預留）。
- **D8** 機制優先、視覺/印刷往後（原視覺 Sprint 降級）。
- **D9** 動畫/音效後期 → UI 由 core **事件流**驅動（`src/core/events.ts` 已備）。
- **D10** 研究遙測：模擬數據≠論文實驗數據；真人對局另存。
- **對齊策略 = α+β**：α 行為單元測試＋統計回歸；β `legacyV3` 旗標逐場精確重現（需與 v3 相同 RNG 消耗順序；v3 神諭凍結於 `tests/fixtures/v3-oracle.mjs`，黃金樣本存 `tests/golden/v3-baseline.json`）。

---

## 5. S2.2 故障系統規格（可直接實作，對齊 v3）

在 `src/core/rules-engine.ts` 補（或拆 `faults.ts`）：

**施加故障**（v3 playCardFromHand fault 分支）：
- 目標預設＝對手最高 MW 的機組（或指定 index）。
- `drop = card.stats.drop`（若目標 `special==='big-fail'` 再 +5；註：v4 資料目前無 big-fail，此分支供 v3parity）。
- push `{ cardId, roundsLeft: card.stats.rounds, sev: card.stats.sev, drop }`。
- **cascade**：`card.cascade && rng.next() < card.cascade && 對手機組>1` → 另一台 +`floor(drop/2)`，發 `fault-cascaded` 事件。

**克制修復 `repairFaults(state, player)`**（v3 processAutoRepair；**接進 `runGame` 迴圈內 `takeTurn` 之後**，註解已標位置）：
- 對每個故障：若 player.techs 中有技師其 `counters` 含此 faultId **且**（該故障無 `required` 或 `required` 含此技師 id）→ 移除，發 `fault-repaired{ by: techId }`。
- **D4**：T01（tag `auto-repair-low`）每回合最多修 1 次（legacyV3=false 時生效；legacyV3=true 不限）。

**克制矩陣（取自 cards.json，A 區）**：
```
F01 counters[T01,T04]            F02 counters[T01]
F03 counters[T01] spreading      F04 counters[T02,T08] required[T02,T08]
F05 counters[T04]                F06 counters[T03] required[T03] cascade0.2
F07 counters[T03,T06] cascade0.3
```
spreading（F03）的「未修每回合 +5%」已在 S2.1 `_tickFaults` 實作。

**測試重點**：
- F06 對手無 T03 → 不修；有 T03 → 回合結束修復。✅
- F04 只有 T02 或 T08 能修（required 白名單）。✅
- F07 → T03（無 required）。✅
- cascade 用 fixedRng 驗機率分支命中/未命中。✅
- T01 每回合上限（D4）。✅

> **⚠️ S2.2 過程發現的資料不對稱**（已用測試固定 v3 現況）：
> F07.counters = [T03, T06]，但 T06.counters = [F01..F05] 不含 F07。
> v3 修復條件用的是 `tech.counters.includes(faultId)`（非 fault.counters），
> 所以 **T06 實際無法 auto-repair F07**（T06 的「立即修復」走 `special:'free-repair'` 另一條路）。
> 這屬資料層議題，**非 S2.2 範圍**，留待平衡 / 資料層另案處理；
> 若日後把 F07 補進 T06.counters，`faults.test.ts` 內標記為「v3 已知資料不對稱」的測試會自動失敗提醒。

> 注意：v4 才有的 tag（M07 aura-mw/weather-immune/card-draw-trigger、M05 offshore-delay、F05 storm-amplify…）**不是 S2.2 範圍**，屬「無原型基準」項，於 S3 依文件實作並標「估計」。

---

## 6. 驗證指令（Windows）

```bash
npm install        # 首次
npm run dev        # Hello 畫面：標題＋已載入 47 張卡＋可重現風速示範
npm test           # 應 25/25（S2.2 後會更多）
npm run build      # tsc --noEmit && vite build
npm run lint
```
合格門檻：tsc strict 0 錯、測試全綠、eslint 0、build 成功。
平衡驗證（S6 接 CLI）：`npm run simulate -- --games 1000 --p1 hard --p2 hard`。

---

## 7. Git 狀態

- 資料夾已有 `.git`，**3 個 commit**（docs / prototypes / 骨架+S2.1），作者 Dof <moredof@gmail.com>，分支 `main`，remote `origin` → `https://github.com/dofliu/WindFarm-Battle.git`。
- `node_modules/`、`dist/` 已被 `.gitignore` 排除（共 53 檔進版控）。
- **待你執行**：在 Windows 專案資料夾 `git push -u origin main`。
- 之後在 Claude Code 那邊 git 可正常用（先前是雲端沙箱掛載的特性導致 git 無法在資料夾內執行，本機不會有此問題）。

---

## 8. 檔案地圖

```
src/
├── core/
│   ├── types.ts          卡牌/狀態型別（文案已移走）
│   ├── rng.ts            seeded PRNG + shuffle（對齊/模擬/同題基礎）
│   ├── cards.ts          載入 src/data/cards.json + 查詢
│   ├── events.ts         事件流型別 + ApplyResult（D9/D10 基礎）
│   ├── game-state.ts     createInitialState（模式無關）+ cloneState
│   ├── rules-engine.ts   ★S2.1 核心迴圈；S2.2 在此加故障
│   └── ai/               evaluator/strategy/difficulty（S2.4 填）
├── i18n/                 zh-TW.ts(UI) + cards.zh-TW.ts(卡牌文案) + index.ts
├── data/cards.json       v4 47 張，只剩數值/結構
├── store/game-store.ts   Zustand（UI 狀態）
└── App.tsx / main.tsx    Hello 畫面
tests/                    rng/cards/wind/i18n/app/rules（25 測試）
prototypes/               v1–v3 可玩 + showcases/（設計史，勿刪）
REFACTOR_PLAN.md / SPRINT2_DESIGN.md   ← 決策與設計細節
```
```
core/ 鐵則：純 TS，禁止 import React / 瀏覽器 API。
資料驅動：能力用 tag；新增能力先在 rules-engine/abilities 加處理再加卡。
```
