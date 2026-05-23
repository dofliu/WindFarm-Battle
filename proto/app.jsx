// Main app — screen routing + tweaks panel

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "cumulus",
  "difficulty": "medium",
  "cardSize": 138,
  "showHints": true
}/*EDITMODE-END*/;

const App = () => {
  const t = useTweaks(TWEAK_DEFAULTS);
  const tweaks = { ...t.values, setTweak: t.setTweak };
  const game = useGame();
  const [screen, setScreen] = React.useState("title");
  const [showLibrary, setShowLibrary] = React.useState(false);

  // Sync game phase to screen
  React.useEffect(() => {
    if (game.state.phase === "gameover") setScreen("gameover");
  }, [game.state.phase]);

  const start = async () => {
    game.reset();
    setScreen("battle");
    await game.begin();
  };
  const goTitle = () => {
    setScreen("title");
    game.reset();
  };
  const restart = async () => {
    game.reset();
    setScreen("battle");
    await game.begin();
  };

  return (
    <>
      <style>{WFAnimationsCSS}</style>
      <WFStage>
        {screen === "title" && (
          <TitleScreen theme={tweaks.theme} onStart={start} />
        )}
        {screen === "battle" && (
          <BattleScreen
            game={game}
            tweaks={tweaks}
            onLibrary={() => setShowLibrary(true)}
            onTitle={goTitle}
          />
        )}
        {screen === "gameover" && (
          <GameOverScreen
            state={game.state}
            theme={tweaks.theme}
            onRestart={restart}
            onTitle={goTitle}
          />
        )}

        {showLibrary && (
          <LibraryModal theme={tweaks.theme} onClose={() => setShowLibrary(false)} />
        )}
      </WFStage>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="主題">
          <TweakRadio
            label="Theme"
            value={tweaks.theme}
            options={[
              { label: "雲海 Cumulus", value: "cumulus" },
              { label: "潮板 Tideboard", value: "tideboard" },
            ]}
            onChange={(v) => tweaks.setTweak("theme", v)}
          />
        </TweakSection>
        <TweakSection label="遊戲">
          <TweakSelect
            label="難度"
            value={tweaks.difficulty}
            options={[
              { label: "😊 入門", value: "easy" },
              { label: "😐 中級", value: "medium" },
              { label: "😈 高手", value: "hard" },
            ]}
            onChange={(v) => tweaks.setTweak("difficulty", v)}
          />
          <TweakToggle
            label="顯示提示"
            value={tweaks.showHints}
            onChange={(v) => tweaks.setTweak("showHints", v)}
          />
        </TweakSection>
        <TweakSection label="開發者測試">
          <TweakButton label="🎲 重擲風速" onClick={() => game.rollDice()} />
          <TweakButton label="🌀 強制颱風" onClick={() => {
            game.setState(s => ({ ...s, wind: { value: 25, label: "颱風！", coeff: 0, rolling: false, dice: [6, 6], typhoon: true } }));
            setTimeout(() => game.setState(s => ({ ...s, wind: { ...s.wind, typhoon: false } })), 2500);
          }} />
          <TweakButton label="💥 對 AI 施加故障" onClick={() => {
            const slot = game.state.ai.turbines.findIndex(t => t);
            if (slot >= 0) {
              game.pushEffect("fault", { side: "ai", slot, cardId: "F04" }, 1000);
              game.setState(s => ({
                ...s,
                ai: { ...s.ai, turbines: s.ai.turbines.map((tu, i) =>
                  i === slot ? { ...tu, faults: [...tu.faults, "F04"] } : tu
                )},
              }));
            }
          }} />
          <TweakButton label="🔧 修復自己的故障" onClick={() => {
            const slot = game.state.me.turbines.findIndex(t => t.faults.length > 0);
            if (slot >= 0) {
              game.pushEffect("repair", { side: "me", slot }, 900);
              game.setState(s => ({
                ...s,
                me: { ...s.me, turbines: s.me.turbines.map((tu, i) =>
                  i === slot ? { ...tu, faults: [] } : tu
                )},
              }));
            }
          }} />
          <TweakButton label="🏁 跳到遊戲結束" onClick={() => {
            game.setState(s => ({ ...s, phase: "gameover",
              me: { ...s.me, score: 142 }, ai: { ...s.ai, score: 128 } }));
          }} secondary />
        </TweakSection>
      </TweaksPanel>
    </>
  );
};

window.WFApp = App;
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
