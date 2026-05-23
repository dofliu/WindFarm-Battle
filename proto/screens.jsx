// Intro / GameOver / Library screens

// ─── Title / Intro ─────────────────────────────────────────
const TitleScreen = ({ theme, onStart }) => {
  const t = wfThemeOf(theme);
  if (theme === "tideboard") {
    return (
      <div style={{
        width: "100%", height: "100%", position: "relative", overflow: "hidden",
        background: t.bgRoot, color: t.textPrimary, fontFamily: t.fontDisplay,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <ThemeBackground theme={theme} />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{ animation: "wf-fade-in 0.8s ease-out both" }}>
            <WFCompass size={88} stroke="#f4d68a" strokeWidth={1.2}
              style={{ filter: "drop-shadow(0 0 20px rgba(244,214,138,0.5))" }} />
          </div>
          <div style={{
            marginTop: 24,
            fontSize: 64, fontWeight: 700, color: "#f4d68a",
            letterSpacing: "0.15em",
            textShadow: "0 4px 12px rgba(0,0,0,0.5), 0 0 28px rgba(244,214,138,0.3)",
            
          }}>WINDFARM</div>
          <div style={{
            fontSize: 48, fontWeight: 700, color: "#e8c878",
            letterSpacing: "0.3em",
            marginTop: -8,
            textShadow: "0 4px 12px rgba(0,0,0,0.5)",
            
          }}>BATTLE</div>
          <div style={{
            marginTop: 12, fontSize: 16, color: "#c89848",
            fontStyle: "italic", fontFamily: 'Georgia, serif',
            
          }}>風場運維策略卡牌 · 12 回合決勝負</div>

          <button onClick={onStart} style={{
            marginTop: 48, padding: "16px 48px",
            background: "linear-gradient(180deg, #e8c878 0%, #c89848 50%, #8a6028 100%)",
            border: "3px solid #3d2a1e",
            borderRadius: 6,
            color: "#3d2a1e",
            fontSize: 18, fontWeight: 800,
            fontFamily: '"Cinzel", Georgia, serif',
            letterSpacing: "0.3em",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)",
            
            display: "inline-flex", alignItems: "center", gap: 12,
          }}>
            <WFCompass size={20} stroke="#3d2a1e" />
            開始航行
          </button>
          <div style={{
            marginTop: 18, fontSize: 11, color: "#c89848",
            letterSpacing: "0.3em", opacity: 0.7,
            
          }}>DOF LAB · 國立勤益科技大學</div>
        </div>
      </div>
    );
  }
  // Cumulus
  return (
    <div style={{
      width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: t.bgRoot, color: t.textPrimary, fontFamily: t.fontDisplay,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <ThemeBackground theme={theme} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{  display: "inline-block" }}>
          <WFTurbineFloat size={104} stroke="#1c2a3a" strokeWidth={1.2} />
        </div>
        <div style={{
          marginTop: 16,
          fontSize: 72, fontWeight: 800, color: "#1c2a3a",
          letterSpacing: "-0.02em", lineHeight: 1.05,
          
        }}>風場大戰</div>
        <div style={{
          fontSize: 18, fontWeight: 500, color: "#6a7888",
          letterSpacing: "0.4em",
          marginTop: 4,
          
        }}>WINDFARM · BATTLE</div>
        <div style={{
          marginTop: 16, fontSize: 14, color: "#3a4858",
          
        }}>風場運維策略卡牌 · 12 回合決勝負</div>

        <button onClick={onStart} style={{
          marginTop: 44, padding: "16px 44px",
          background: "linear-gradient(180deg, #1c2a3a 0%, #0d1924 100%)",
          color: "#fff",
          fontWeight: 700, fontSize: 16, letterSpacing: "0.15em",
          border: "none", borderRadius: 999,
          boxShadow: "0 12px 32px rgba(28,42,58,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
          cursor: "pointer",
          fontFamily: "inherit",
          
          display: "inline-flex", alignItems: "center", gap: 10,
        }}>
          <WFCompass size={18} stroke="#fff" />
          開始對戰
        </button>
        <div style={{
          marginTop: 16, fontSize: 11, color: "#6a7888",
          letterSpacing: "0.25em", textTransform: "uppercase",
          
        }}>DOF LAB · 國立勤益科技大學</div>
      </div>
    </div>
  );
};

// ─── Game Over ─────────────────────────────────────────────
const GameOverScreen = ({ state, theme, onRestart, onTitle }) => {
  const t = wfThemeOf(theme);
  const winner = state.me.score > state.ai.score ? "me" : state.me.score < state.ai.score ? "ai" : "draw";
  const label = winner === "me" ? "勝利" : winner === "ai" ? "敗北" : "平手";
  const subLabel = winner === "me" ? "您是優秀的風場運維者" : winner === "ai" ? "AI 略勝一籌，再戰一回？" : "勢均力敵的對手";
  const accent = winner === "me" ? t.success : winner === "ai" ? t.danger : t.warning;

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: t.bgRoot, color: t.textPrimary, fontFamily: t.fontUI,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <ThemeBackground theme={theme} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 560 }}>
        <div style={{ animation: "wf-fade-in 0.6s ease-out both" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 96, height: 96, borderRadius: "50%",
            background: theme === "tideboard"
              ? "radial-gradient(circle at 30% 30%, #f4d68a, #c89848 60%, #6e4a18)"
              : "#fff",
            border: theme === "tideboard" ? "3px solid #3d2a1e" : `4px solid ${accent}`,
            boxShadow: `0 0 32px ${accent}66`,
            color: accent, fontSize: 44, fontWeight: 800,
            fontFamily: theme === "tideboard" ? '"Cinzel", Georgia, serif' : t.fontDisplay,
          }}>
            {winner === "me" ? "♛" : winner === "ai" ? "✗" : "="}
          </div>
        </div>
        <div style={{
          marginTop: 20, fontSize: 56, fontWeight: 800, color: t.textPrimary,
          letterSpacing: "0.1em",
          fontFamily: theme === "tideboard" ? '"Cinzel", Georgia, serif' : t.fontDisplay,
          
        }}>{label}</div>
        <div style={{ fontSize: 16, color: t.textSecondary, marginTop: 6, animation: "wf-fade-in 1s ease-out both" }}>
          {subLabel}
        </div>

        {/* Score comparison */}
        <div style={{
          marginTop: 36,
          padding: theme === "tideboard" ? "20px 32px" : "24px 36px",
          background: theme === "tideboard"
            ? "linear-gradient(180deg, rgba(40,25,15,0.92), rgba(30,18,8,0.95))"
            : "rgba(255,255,255,0.85)",
          border: theme === "tideboard" ? "2px solid #c89848" : "1px solid rgba(28,42,58,0.1)",
          borderRadius: theme === "tideboard" ? 0 : 16,
          boxShadow: theme === "tideboard" ? "0 12px 32px rgba(0,0,0,0.4)" : "0 12px 32px rgba(28,42,58,0.12)",
          
        }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: theme === "tideboard" ? "#c89848" : "#6a7888",
                letterSpacing: "0.2em", textTransform: "uppercase" }}>你</div>
              <div style={{ fontSize: 48, fontWeight: 800,
                color: winner === "me" ? t.success : (theme === "tideboard" ? "#f4d68a" : "#1c2a3a"),
                fontVariantNumeric: "tabular-nums" }}>
                <CountUp from={0} to={state.me.score} duration={1500} />
              </div>
              <div style={{ fontSize: 11, color: theme === "tideboard" ? "#c89848" : "#6a7888" }}>MWh</div>
            </div>
            <div style={{ fontSize: 20, color: t.textMuted, paddingBottom: 14 }}>vs</div>
            <div>
              <div style={{ fontSize: 11, color: theme === "tideboard" ? "#c89848" : "#6a7888",
                letterSpacing: "0.2em", textTransform: "uppercase" }}>AI</div>
              <div style={{ fontSize: 48, fontWeight: 800,
                color: winner === "ai" ? t.danger : (theme === "tideboard" ? "#f4d68a" : "#1c2a3a"),
                fontVariantNumeric: "tabular-nums" }}>
                <CountUp from={0} to={state.ai.score} duration={1500} />
              </div>
              <div style={{ fontSize: 11, color: theme === "tideboard" ? "#c89848" : "#6a7888" }}>MWh</div>
            </div>
          </div>
          {/* Stats */}
          <div style={{
            marginTop: 18, paddingTop: 16,
            borderTop: theme === "tideboard" ? "1px solid rgba(200,152,72,0.3)" : "1px solid rgba(28,42,58,0.08)",
            display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
          }}>
            {[
              ["🏭 部署機組", state.me.turbines.length],
              ["⚙️ 雇用技師", state.me.techs.length],
              ["💥 對手故障", state.ai.turbines.reduce((s, t) => s + t.faults.length, 0)],
              ["📅 完成回合", state.round],
            ].map(([label, value]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: theme === "tideboard" ? "#c89848" : "#6a7888",
                  letterSpacing: "0.1em" }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700,
                  color: theme === "tideboard" ? "#f4d68a" : "#1c2a3a",
                  fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 28, display: "flex", justifyContent: "center", gap: 12,
          animation: "wf-fade-in 1.5s ease-out both" }}>
          <button onClick={onRestart} style={{
            padding: "12px 28px",
            background: theme === "tideboard"
              ? "linear-gradient(180deg, #e8c878, #c89848 50%, #8a6028)"
              : "linear-gradient(180deg, #d9a85a, #b8893f)",
            color: theme === "tideboard" ? "#3d2a1e" : "#fff",
            border: theme === "tideboard" ? "2px solid #3d2a1e" : "none",
            borderRadius: theme === "tideboard" ? 4 : 12,
            fontFamily: theme === "tideboard" ? '"Cinzel", Georgia, serif' : t.fontUI,
            fontSize: 14, fontWeight: 700, letterSpacing: "0.1em",
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <WFCompass size={16} stroke="currentColor" />
            再戰一回
          </button>
          <button onClick={onTitle} style={{
            padding: "12px 28px",
            background: "transparent",
            color: t.textPrimary,
            border: `1.5px solid ${t.borderStrong}`,
            borderRadius: theme === "tideboard" ? 4 : 12,
            fontFamily: theme === "tideboard" ? '"Cinzel", Georgia, serif' : t.fontUI,
            fontSize: 14, fontWeight: 600, letterSpacing: "0.1em",
            cursor: "pointer",
          }}>返回</button>
        </div>
      </div>
    </div>
  );
};

// ─── Library modal ─────────────────────────────────────────
const LibraryModal = ({ theme, onClose }) => {
  const t = wfThemeOf(theme);
  const [filter, setFilter] = React.useState("all");
  const allCards = Object.keys(WF_CARDS);
  const filtered = filter === "all" ? allCards : allCards.filter(id => WF_CARDS[id].type === filter);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(0,0,0,0.65)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(960px, 95vw)", maxHeight: "85vh",
        background: theme === "tideboard"
          ? "linear-gradient(180deg, #3d2a1e, #2a1810)"
          : "#fff",
        border: theme === "tideboard" ? "3px solid #c89848" : "1px solid rgba(28,42,58,0.1)",
        borderRadius: theme === "tideboard" ? 0 : 16,
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        display: "flex", flexDirection: "column", overflow: "hidden",
        color: t.textPrimary, fontFamily: t.fontUI,
      }}>
        <div style={{
          padding: "16px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: theme === "tideboard" ? "2px solid #c89848" : "1px solid rgba(28,42,58,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 700,
              fontFamily: theme === "tideboard" ? '"Cinzel", Georgia, serif' : t.fontUI,
              letterSpacing: theme === "tideboard" ? "0.1em" : "0",
              color: theme === "tideboard" ? "#f4d68a" : "#1c2a3a",
            }}>{theme === "tideboard" ? "CARD CODEX · 牌冊" : "📚 牌庫"}</span>
            <span style={{ fontSize: 11, color: t.textSecondary }}>{filtered.length} 張</span>
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: t.textPrimary, fontSize: 22, padding: "4px 10px",
            fontFamily: "inherit",
          }}>✕</button>
        </div>
        {/* Filter */}
        <div style={{ padding: "10px 24px", display: "flex", gap: 6, flexWrap: "wrap",
          borderBottom: theme === "tideboard" ? "1px solid #6e4a18" : "1px solid rgba(28,42,58,0.06)" }}>
          {[
            ["all", "全部"],
            ["turbine", "機組"],
            ["tech", "技師"],
            ["fault", "故障"],
            ["func", "功能"],
            ["weather", "天氣"],
            ["contract", "合約"],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: "4px 12px",
              background: filter === k
                ? (theme === "tideboard" ? "#c89848" : "#1c2a3a")
                : (theme === "tideboard" ? "transparent" : "rgba(28,42,58,0.05)"),
              color: filter === k
                ? (theme === "tideboard" ? "#3d2a1e" : "#fff")
                : t.textPrimary,
              border: theme === "tideboard" ? "1px solid #c89848" : "none",
              borderRadius: theme === "tideboard" ? 0 : 999,
              fontSize: 11, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}>{label}</button>
          ))}
        </div>
        {/* Grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: 18,
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 14, alignContent: "start" }}>
          {filtered.map(id => (
            <div key={id} style={{ display: "flex", justifyContent: "center" }}>
              <ThemedCard cardId={id} theme={theme} size={146} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

window.TitleScreen = TitleScreen;
window.GameOverScreen = GameOverScreen;
window.LibraryModal = LibraryModal;
