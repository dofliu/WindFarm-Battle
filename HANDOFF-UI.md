# UI 改版交接書 · WindFarm Battle

> 給 Claude Code：把 `src/ui/` 從現有的 tailwind dashboard 風格替換為**雲海 Cumulus + 潮板 Tideboard 雙主題**對戰系統。
> 視覺參考、互動規格、所有可用的 React 原始碼都在這個資料夾。
> 不要動 `src/core/`、`src/store/`、`src/data/`、`src/i18n/`。

---

## 1 · 你會拿到的東西

| 檔案 | 用途 |
|---|---|
| `prototype.html` | **可玩 demo**，先在瀏覽器打開玩過，理解互動 |
| `proto/themes.js` | 兩主題的 design tokens（顏色、字體、陰影、圓角） |
| `proto/themed-card.jsx` | 手牌卡（兩主題版本） |
| `proto/themed-turbine.jsx` | 場上機組牌位 + 技師徽章（兩主題） |
| `proto/battle-chrome.jsx` | 頂部欄、玩家標籤、分數徽章 |
| `proto/battle-center.jsx` | 中央回合條（風速骰、行動點、天氣/合約狀態） |
| `proto/battle.jsx` | **核心對戰畫面組裝 + 拖曳出牌邏輯** |
| `proto/screens.jsx` | 標題 / 遊戲結束 / 牌庫 modal |
| `proto/effects.jsx` | 風速骰、故障閃光、修復星光、回合結算 toast、動畫 CSS |
| `proto/state.jsx` | 假 state machine（**只供參考**，正式要接 Zustand） |
| `proto/stage.jsx` | 1440×900 設計畫布的 scale-to-fit 容器 |
| `shared/icons.jsx` | 27 個自製 SVG icon（風機/技師/故障/天氣/合約等） |
| `shared/cards-data.js` | demo 用的卡牌資料（**正式版用 `src/data/cards.json`**） |
| `tweaks-panel.jsx` | 主題切換用的 Tweaks 面板 |
| `index.html` | 原始 4 種視覺方向探索（Cumulus、Tideboard、Blueprint、Atlas，可作為參考） |

---

## 2 · 整合策略總原則

### 保留不動（這些已經很完整）

```
src/core/        ← 規則引擎、AI、卡牌定義
src/store/       ← Zustand store（玩家狀態、回合、出牌邏輯）
src/data/        ← cards.json (47 張卡牌的標準資料)
src/i18n/        ← 中文文字
```

### 整批替換

```
src/ui/components/   ← 全部重寫，套新風格
src/ui/styles/       ← 新增 themes.ts
src/App.tsx          ← 重寫，套上 Stage + ThemeContext
src/index.css        ← 加入動畫 keyframes
```

### 工作流

1. 先把 `proto/themes.js` → `src/ui/styles/themes.ts`（用 TS interface 定義 token 型別）
2. 寫一個 `ThemeContext`，讓所有元件都能讀 `theme.colors / theme.fonts`
3. 一個一個替換 `src/ui/components/*.tsx`：
   - `CardChip.tsx` → 用 `proto/themed-card.jsx` 的邏輯
   - `TurbineSlot.tsx` → 用 `proto/themed-turbine.jsx`
   - `Hand.tsx` → 加上拖曳出牌（參考 `proto/battle.jsx` 的 `dragInfo` 邏輯）
   - `GameHeader.tsx` + `StatusPanel.tsx` → 合併成 `BattleCenter`（中央回合條）
   - `PlayerArea.tsx` → 用 `proto/themed-turbine.jsx` 的版面
4. 重寫 `App.tsx`：分成 `<TitleScreen />` / `<BattleScreen />` / `<GameOverScreen />` + 用 `<Stage>` 包起來
5. 加入動畫（從 `proto/effects.jsx` 抓 keyframes 到 `index.css`）

---

## 3 · Design Tokens

**直接複製這份到 `src/ui/styles/themes.ts`：**

```ts
// 全部 token 在 proto/themes.js 已寫好，直接轉 TS
export type ThemeKey = 'cumulus' | 'tideboard';
export interface Theme {
  bgRoot: string;
  bgPanel: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  secondary: string;
  danger: string;
  success: string;
  fontUI: string;
  fontDisplay: string;
  cardRadius: number;
  // ... 詳見 proto/themes.js
}
```

### 主要差異

| Token | Cumulus 雲海 | Tideboard 潮板 |
|---|---|---|
| 整體配色 | 柔和天空藍 → 米色 → 沙色 | 木質暖棕 → 深咖啡 |
| 字體 | Manrope sans | Cormorant + Cinzel serif |
| 卡片邊角 | 16px 圓角 | 4px 微圓角 |
| 卡片邊框 | 1.5px 半透明深藍 | 2px 黃銅 / 金色 |
| 故事感 | 現代極簡（Marvel Snap） | 古典桌遊（Hearthstone） |
| 機組形狀 | 直角圓邊卡片 | 六角形黃銅徽章 |
| 風速顯示 | 簡潔骰子 + 數字 | 黃銅羅盤指針 |

兩者**共用同一個遊戲版面結構**（敵上、我下、中間風速、底部手牌），只是把每個元件的視覺替換掉。

---

## 4 · 元件對應表

| 現有 (src/ui/components/) | 替換為 | 主要改動 |
|---|---|---|
| `CardChip.tsx` | `<Card cardId theme size lifted dragging />` | 中央留藝術區（60% 卡面）給未來卡圖 |
| `TurbineSlot.tsx` | `<Turbine turbine theme empty targeted />` | 兩主題不同形狀（圓角矩形 / 六角徽章） |
| `Hand.tsx` | 重寫 | 加入拖曳出牌 + hover 預覽 + 扇形排列 |
| `GameHeader.tsx` | `<BattleTopBar />` + `<RoundDisplay />` | 拆成標題列 + 中央回合資訊 |
| `StatusPanel.tsx` | `<StatusEffects />` | 嵌入中央回合條 |
| `PlayerArea.tsx` | `<PlayerRow />` + `<OpponentRow />` | 上下對稱配置 |
| `EventLog.tsx` | 改為浮動小視窗或拿掉 | 主要透過動畫呈現，文字 log 是輔助 |
| `CardLibraryModal.tsx` | `<LibraryModal theme onClose />` | 加上主題切換 |

---

## 5 · 互動規格（重點）

### 拖曳出牌（Hand.tsx）
- pointerdown 開始拖曳，記錄起始座標
- pointermove 跟著手指 / 滑鼠移動，卡片浮現在 cursor 旁
- pointerup 時判斷落點：
  - 機組 / 技師卡 → 我方場地 → 部署
  - 故障卡 → 對手機組 → 施加（落點未中時，進入 click-to-target 模式）
  - 落點不對 → 卡片回到原位
- 拖曳中：原位置淡化 (`opacity: 0.4`)，cursor 旁顯示 1.15× 放大版本

### 風速骰子動畫（BattleCenter）
- 回合開始時：骰子先快速旋轉 1.5 秒（每 80ms 換隨機面），然後落在最終結果
- 第一顆是 6 時：第二顆滾出
- 6+6 = 颱風事件，全螢幕紅色閃光 + 文字「🌀 颱風來襲」

### 故障 / 修復特效（effects.jsx）
- 故障：紅色放射狀閃光 + 5 道閃電從中心放射 + 故障 icon 縮放彈出
- 修復：綠色光暈 + 6 個星光分散爆出 + 中央打勾標記
- 都是 800-1000ms 一次性動畫，結束自動清除

### AI 回合
- 1.2 秒「思考中」狀態（脈動指示器）
- 1 次或 2 次出牌（隨機決定）
- 每次出牌後 0.7 秒緩衝
- AI 出牌時可選擇加上：卡片從 AI 手牌位置飛到場上的動畫（用 `<CardFlyout>`，已在 effects.jsx 寫好）

### 回合結算
- 「回合 N 結算」toast 從上方滑入
- MWh 數字以 `<CountUp>` 元件遞增動畫
- 3 秒後自動消失

---

## 6 · 接 Zustand store

`proto/state.jsx` 是 demo 用的 React useState。實際接到 `src/store/game-store.ts` 時：

1. **Store 已經有的**（不用改）：
   - `playCard()` / `endTurn()` / `selectFaultTarget()` / `newGame()` ← 直接呼叫
   - `state.round` / `state.wind` / `state.players[]` / `state.actionsLeft` ← 直接讀
   - `isAiThinking` / `lastRoundScore` ← 已存在

2. **Store 要新增的**（給動畫用）：

```ts
// game-store.ts 加入：
interface GameStore {
  // ... 既有 fields ...
  
  // 新增：動畫效果佇列
  effects: Effect[];
  pushEffect: (type: 'fault' | 'repair', target: { side: 0|1; slot: number; cardId?: string }, durationMs?: number) => void;
  removeEffect: (id: string) => void;
  
  // 新增：風速骰子動畫狀態
  windRolling: boolean;
  windDice: [number|null, number|null];
  rollDiceAnimated: () => Promise<void>;
}

type Effect = {
  id: string;
  type: 'fault' | 'repair';
  target: { side: 0 | 1; slot: number; cardId?: string };
  time: number;
};
```

3. **既有的 effects** 觸發點（在 store 內現有的 playCard / aiTakeAction 函式裡）要呼叫 `pushEffect`：
   - 故障施加時：`pushEffect('fault', { side: 1, slot: targetSlot, cardId: faultCardId })`
   - 故障被修復時：`pushEffect('repair', { side: 0, slot: faultedSlot })`

---

## 7 · 卡圖位（最重要！）

> 之後會換成精美的 AI 生成 / 手繪卡圖。**現在版面已經預留好。**

每張卡片中央 60% 區域是「藝術區」，目前用 `<WFStripedPlaceholder>` + 對應主題的 SVG icon 佔位。

**之後替換流程：**
1. 把生成好的圖放到 `public/cards/<cardId>.png`
2. 修改 `<Card>` 元件，把藝術區的 `<WFStripedPlaceholder>` 替換成：
   ```jsx
   <img src={`/cards/${cardId}.png`} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
   ```
3. 機組牌位（`<Turbine>`）的藝術區也同理替換
4. 不用動其他任何東西（名稱、數值、能力、邊框都會保留）

**規格：**
- 卡片藝術區：300×360 px（5:6 比例）@2x 解析度，輸出 600×720
- 機組牌位藝術區：依主題不同——
  - Cumulus 圓角矩形：360×270 (4:3)
  - Tideboard 六角徽章：圓形 360×360

---

## 8 · 主題切換實作

加 `ThemeContext` 在 App.tsx：

```tsx
const ThemeContext = createContext<ThemeKey>('cumulus');

function App() {
  const [theme, setTheme] = useLocalStorage<ThemeKey>('wfb-theme', 'cumulus');
  return (
    <ThemeContext.Provider value={theme}>
      <Stage>
        {/* 整個遊戲 */}
      </Stage>
      <ThemeSwitcher value={theme} onChange={setTheme} />
    </ThemeContext.Provider>
  );
}
```

主題切換按鈕放在頂部欄角落（不要做成 modal）。可以參考 `proto/app.jsx` 的 Tweaks 面板，但實際版本建議做成一個小型的設定面板。

---

## 9 · 動畫實作

把 `proto/effects.jsx` 末尾的 `WFAnimationsCSS` 整段複製到 `src/index.css`，包含這些 keyframes：
- `wf-deploy-bounce`（機組部署時的彈跳）
- `wf-dice-spin` / `wf-dice-settle`（風速骰）
- `wf-fault-flash` / `wf-fault-zoom` / `wf-fault-bolt`（故障特效）
- `wf-repair-flash` / `wf-repair-check` / `wf-sparkle`（修復特效）
- `wf-target-spin`（目標鎖定）
- `wf-toast-in`（回合結算 toast）
- `wf-fade-in`（淡入通用）
- `wf-thinking-pulse`（AI 思考）

**都要加 `animation-fill-mode: both`**（已在 prototype 修好，預設沒加會導致動畫結束後元素回到 opacity 0）

---

## 10 · 行動裝置適配（直向）

`<Stage>` 在直向時要重排：
- 桌機/平板橫向：1440×900 設計尺寸，scale-to-fit
- 手機直向：改成 vertical layout，回合條改置中橫向 strip，手牌改成底部抽屜

實作方式：偵測 viewport，若 width < height 且 width < 768，套不同 layout。可分兩個 component：`<BattleScreen layout="landscape" />` vs `<BattleScreen layout="portrait" />`。

**這個可以後做**，先把橫向版完成。

---

## 11 · 建議工作順序（給 Claude Code）

1. 先打開 `prototype.html`，玩 2 次（雲海各 1 場、潮板各 1 場），熟悉互動
2. 把 `proto/themes.js` 轉成 `src/ui/styles/themes.ts`（TS interface + 常數）
3. 寫 `ThemeContext` 和 `useTheme()` hook
4. 寫 `<Stage>`（從 `proto/stage.jsx` 抄）
5. **重寫 `<Card>` 元件**（最重要的元件，先確認長對 / 兩主題都對）
6. 重寫 `<Turbine>`
7. 重寫 `<TopBar>` + `<BattleCenter>`（包含風速骰）
8. 重寫 `<BattleScreen>`，組裝上面所有元件
9. 加入拖曳出牌（從 `proto/battle.jsx` 的 `dragInfo` state machine 抄）
10. 加入動畫 CSS keyframes
11. 加入 `<Effect>` 元件（故障、修復）
12. 寫 `<TitleScreen>` / `<GameOverScreen>`
13. 主題切換 UI（小型設定面板）
14. 接 Zustand store，加入 `effects` / 風速骰動畫狀態
15. 跑既有的測試（`tests/`）確保邏輯沒壞
16. 自己玩 3 場驗收

---

## 12 · 注意事項

### 別動的
- `src/core/` 所有檔案（規則引擎已測過 1000 場模擬）
- `src/store/game-store.ts` 的 `playCard` / `endTurn` 等核心 action（只加新的，不改既有的）
- `src/data/cards.json`（這是設計文件，不要改 cardId 或數值）

### 要保留的視覺/功能
- IEC 編號（在 hover preview 右下角顯示）
- 稀有度星星 / 傳奇邊框
- 故障 badge 上的扣減百分比
- 機組可用率血量條
- 動作點視覺化
- 12 回合進度條
- 對手手牌張數（背面）
- 對手卡牌不公開

### 字體
- Cumulus 使用 [Manrope](https://fonts.google.com/specimen/Manrope)（已在 Google Fonts，CDN load）
- Tideboard 使用 [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) + [Cinzel](https://fonts.google.com/specimen/Cinzel)
- 中文預設使用系統字體（Apple PingFang / Microsoft JhengHei）

### 圖標
- 27 個自製 SVG icon 在 `shared/icons.jsx`，全部用 stroke-based 設計、24x24 viewBox
- 可以直接拷貝過去 `src/ui/icons.tsx`，或拆成個別檔案

---

## 13 · 驗收標準

- [ ] 兩主題視覺都符合 `prototype.html` 觀感
- [ ] 拖曳出牌流暢
- [ ] 風速骰子有動畫
- [ ] 故障 / 修復有特效
- [ ] AI 回合有思考狀態
- [ ] 回合結算有 toast + MWh 累計動畫
- [ ] 卡片中央留藝術區（之後可換真實卡圖）
- [ ] 主題切換可即時生效（不用重整）
- [ ] 1000 場 AI 模擬還是會跑（邏輯沒壞）
- [ ] 既有單元測試全過

---

**有問題請查 `prototype.html` 看實際應該長什麼樣。**
