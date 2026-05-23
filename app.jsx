// Main app — DesignCanvas with 4 variant artboards

const App = () => (
  <DesignCanvas>
    <DCSection
      id="intro"
      title="風場大戰 · 對戰系統視覺重新設計"
      subtitle="四個方向的 hi-fi 探索 · 海風自然基調 · 預留未來卡圖位 · 自製 SVG iconography"
    >
    </DCSection>

    <DCSection
      id="variants"
      title="戰場主畫面 · 四種方向"
      subtitle="點任一張卡進入全螢幕；目前每張卡都顯示同樣的對戰局勢（回合 7、玩家正準備施加葉片損傷）便於對比"
    >
      <DCArtboard
        id="cumulus"
        label="A · Cumulus 雲海"
        sublabel="參考 Marvel Snap · 三格戰場 · 柔和明亮、Snap-like 卡片"
        width={1440}
        height={900}
      >
        <Cumulus />
      </DCArtboard>

      <DCArtboard
        id="tideboard"
        label="B · Tideboard 潮板"
        sublabel="參考 Hearthstone · 木質戰桌 · 黃銅羅盤 · 圓形機組牌位"
        width={1440}
        height={900}
      >
        <Tideboard />
      </DCArtboard>

      <DCArtboard
        id="blueprint"
        label="C · Blueprint 藍圖"
        sublabel="參考 MTG Arena · 深海工程藍圖 · 高資訊密度 · 青色點綴"
        width={1440}
        height={900}
      >
        <Blueprint />
      </DCArtboard>

      <DCArtboard
        id="atlas"
        label="D · Atlas 海圖"
        sublabel="桌上手繪海圖 · 田野筆記本卡片 · 大頭針機組 · 蠟筆字體"
        width={1440}
        height={900}
      >
        <Atlas />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="notes"
      title="設計思路備忘"
      subtitle="所有方向共通的決策"
    >
      <DCPostIt id="note1" x={0} y={0}>
        <strong>戰場結構</strong>
        <br /><br />
        所有方向都採用「敵在上 / 中央風速狀態 / 我在下 / 手牌底部」的經典上下對戰。
        <br /><br />
        固定 3 機組欄位（不再 flex-wrap），讓場上佈局穩定、易讀。
      </DCPostIt>
      <DCPostIt id="note2" x={0} y={0}>
        <strong>預留卡圖位</strong>
        <br /><br />
        所有卡片中央留 60% 為「藝術區」，目前以條紋 placeholder + 單色 icon 填充。
        <br /><br />
        未來換成 AI 生成插畫時，只需替換背景圖層，名稱/數值/能力的版面不變。
      </DCPostIt>
      <DCPostIt id="note3" x={0} y={0}>
        <strong>自製 SVG iconography</strong>
        <br /><br />
        共 27 個自製 stroke-based icon 取代 emoji，含風機（陸/離岸/浮式）、技師職能、各類故障、天氣、合約。
        <br /><br />
        統一線稿、可隨主題調色。
      </DCPostIt>
      <DCPostIt id="note4" x={0} y={0}>
        <strong>互動演示</strong>
        <br /><br />
        每個方向都示範了：
        <br />· Hover 卡片放大發光（手牌中央那張）
        <br />· 拖曳出牌（手牌左側那張）
        <br />· 目標鎖定（對手左側機組紅環）
        <br />· 故障標記（對手中間機組）
        <br /><br />
        確認方向後，可以做完整可玩 demo。
      </DCPostIt>
      <DCPostIt id="note5" x={0} y={0}>
        <strong>下一步</strong>
        <br /><br />
        告訴我哪個方向最有感（也可以挑混合元素：例如 Tideboard 的機組外觀 + Blueprint 的資訊密度），我會把它做成完整 React prototype，包含：
        <br /><br />
        · 完整拖曳出牌動畫
        <br />· 風速骰子動畫
        <br />· 故障/修復特效
        <br />· 卡片入手、棄牌動畫
        <br />· 手機橫向適配
      </DCPostIt>
    </DCSection>
  </DesignCanvas>
);

window.WFApp = App;
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
