// Battle screen — themed top bar + opponent area + center + player area + hand

// ─── Top bar ────────────────────────────────────────────
const BattleTopBar = ({ theme, onLibrary, onRestart, onTitle, difficulty, onDifficulty }) => {
  const t = wfThemeOf(theme);
  if (theme === "tideboard") {
    return (
      <div style={{
        height: 52, padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(180deg, rgba(40,25,15,0.92) 0%, rgba(40,25,15,0.5) 100%)",
        borderBottom: "2px solid #c89848", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onTitle} style={{ background: "transparent", border: "none", padding: 0, margin: 0, font: "inherit", color: "inherit", textAlign: "inherit", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <WFCompass size={26} stroke="#e8c878" strokeWidth={1.5} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f4d68a",
                fontFamily: '"Cinzel", Georgia, serif', letterSpacing: "0.08em" }}>WINDFARM BATTLE</div>
            </div>
          </button>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <select value={difficulty} onChange={e => onDifficulty(e.target.value)} style={{
            background: "#3d2a1e", color: "#f4d68a", border: "1px solid #c89848",
            padding: "5px 10px", fontFamily: 'Georgia, serif', fontSize: 12,
          }}>
            <option value="easy">入門</option><option value="medium">中級</option><option value="hard">高手</option>
          </select>
          {[["牌冊", onLibrary], ["新局", onRestart]].map(([label, fn], i) => (
            <button key={i} onClick={fn} style={{
              background: "linear-gradient(180deg, #6e4a18, #3d2a1e)",
              border: "1px solid #c89848", borderRadius: 4,
              padding: "5px 14px", fontSize: 12, fontWeight: 600,
              color: "#f4d68a", fontFamily: 'Georgia, serif',
              letterSpacing: "0.1em", cursor: "pointer",
              whiteSpace: "nowrap",
            }}>{label}</button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{
      height: 56, padding: "0 28px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: "1px solid rgba(28,42,58,0.08)", flexShrink: 0,
      background: "rgba(255,255,255,0.4)", backdropFilter: "blur(10px)",
    }}>
      <button onClick={onTitle} style={{ background: "transparent", border: "none", padding: 0, margin: 0, font: "inherit", color: "inherit", textAlign: "inherit", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: "#1c2a3a", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <WFTurbineFloat size={20} stroke="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>WindFarm Battle</div>
          <div style={{ fontSize: 10, color: t.textSecondary, letterSpacing: "0.18em", textTransform: "uppercase", whiteSpace: "nowrap" }}>對戰 · 風電運維</div>
        </div>
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <select value={difficulty} onChange={e => onDifficulty(e.target.value)} style={{
          background: "rgba(255,255,255,0.7)", border: "1px solid rgba(28,42,58,0.1)",
          borderRadius: 999, padding: "6px 12px", fontSize: 12, color: "#3a4858",
          fontFamily: "inherit",
        }}>
          <option value="easy">😊 入門</option><option value="medium">😐 中級</option><option value="hard">😈 高手</option>
        </select>
        {[["📚 牌庫", onLibrary], ["🔄 新遊戲", onRestart]].map(([label, fn], i) => (
          <button key={i} onClick={fn} style={{
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(28,42,58,0.1)", borderRadius: 999,
            padding: "6px 14px", fontSize: 12, fontWeight: 500,
            color: "#3a4858", backdropFilter: "blur(8px)",
            cursor: "pointer", fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}>{label}</button>
        ))}
      </div>
    </div>
  );
};

// ─── Side label (player + AI) ───────────────────────────
const SideLabel = ({ theme, side, hand, deck, mw, faulted, active, aiThinking }) => {
  const t = wfThemeOf(theme);
  if (theme === "tideboard") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "8px 14px",
        background: "linear-gradient(180deg, #3d2a1e, #2a1810)",
        border: `1.5px solid ${active ? "#f4d68a" : "#6e4a18"}`,
        boxShadow: active ? "0 0 12px rgba(244,214,138,0.3)" : "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: side === "opp" ? "#a85b4a" : "#6e4a18",
            border: "1px solid #c89848",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#f4d68a", fontSize: 11, fontWeight: 700, fontFamily: 'Georgia, serif',
          }}>{side === "opp" ? "AI" : "你"}</div>
          <div style={{ color: "#f4d68a", fontFamily: 'Georgia, serif' }}>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{side === "opp" ? "對手" : "你的陣地"}</div>
            <div style={{ fontSize: 9, color: "#c89848" }}>手{hand} · 庫{deck}</div>
          </div>
        </div>
        <div style={{ height: 24, width: 1, background: "#6e4a18" }} />
        <div style={{ color: "#f4d68a", fontFamily: 'Georgia, serif' }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{mw}</span>
          <span style={{ fontSize: 9, color: "#c89848", marginLeft: 2 }}>MW</span>
        </div>
        {faulted && (
          <>
            <div style={{ height: 24, width: 1, background: "#6e4a18" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 3, color: "#f4886a", fontSize: 10, fontWeight: 600, fontFamily: 'Georgia, serif' }}>
              <WFFaultLightning size={12} stroke="#f4886a" />故障
            </div>
          </>
        )}
        {(active || aiThinking) && (
          <>
            <div style={{ height: 24, width: 1, background: "#6e4a18" }} />
            <div style={{ fontSize: 10, color: aiThinking ? "#f4886a" : "#a8d878", fontWeight: 700, fontFamily: 'Georgia, serif',
              animation: aiThinking ? "wf-thinking-pulse 1.4s ease-in-out infinite" : "none" }}>
              {aiThinking ? "AI 思考中..." : (side === "me" ? "你的回合" : "計算中")}
            </div>
          </>
        )}
      </div>
    );
  }
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "8px 16px",
      background: "rgba(255,255,255,0.6)",
      borderRadius: 14,
      border: `1px solid ${active ? "rgba(58,167,200,0.4)" : "rgba(28,42,58,0.08)"}`,
      backdropFilter: "blur(8px)",
      boxShadow: active ? "0 0 16px rgba(58,167,200,0.18)" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: side === "opp" ? "#a85b4a" : "#1c2a3a", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700,
        }}>{side === "opp" ? "AI" : "你"}</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1c2a3a" }}>{side === "opp" ? "AI 對手" : "你的陣地"}</div>
          <div style={{ fontSize: 9, color: "#6a7888" }}>{hand} 手 · {deck} 庫</div>
        </div>
      </div>
      <div style={{ height: 24, width: 1, background: "rgba(28,42,58,0.1)" }} />
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#1c2a3a" }}>{mw}</span>
        <span style={{ fontSize: 9, color: "#6a7888" }}>MW</span>
      </div>
      {faulted && (
        <>
          <div style={{ height: 24, width: 1, background: "rgba(28,42,58,0.1)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#a8453a", fontWeight: 600 }}>
            <WFFaultLightning size={12} stroke="#a8453a" />故障中
          </div>
        </>
      )}
      {(active || aiThinking) && (
        <>
          <div style={{ height: 24, width: 1, background: "rgba(28,42,58,0.1)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10,
            color: aiThinking ? "#a85b4a" : "#3aa7c8", fontWeight: 700,
            animation: aiThinking ? "wf-thinking-pulse 1.4s ease-in-out infinite" : "none",
          }}>
            <WFCompass size={12} stroke="currentColor" />
            {aiThinking ? "AI 思考中..." : (side === "me" ? "你的回合" : "計算中")}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Score ───────────────────────────────────────────────
const ScoreBadge = ({ theme, side, label, score, preview, active }) => {
  if (theme === "tideboard") {
    return (
      <div style={{ position: "relative", width: 130, height: 90 }}>
        <svg width="130" height="90" viewBox="0 0 130 90" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id={`score-tide-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e8c878" />
              <stop offset="100%" stopColor="#8a6028" />
            </linearGradient>
          </defs>
          <path d="M8 4 L122 4 L126 18 L126 76 L122 86 L8 86 L4 76 L4 18 Z"
            fill={`url(#score-tide-${side})`} stroke="#3d2a1e" strokeWidth="1.5" />
          <rect x="12" y="18" width="106" height="56" fill="#2a1810" />
        </svg>
        <div style={{ position: "relative", padding: "14px 18px", textAlign: "center", color: "#f4d68a" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.85, fontFamily: '"Cinzel", serif' }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1, fontFamily: 'Georgia, serif' }}>{score}</div>
          {preview > 0 && (
            <div style={{ position: "absolute", bottom: 12, right: 18,
              fontSize: 11, color: "#a8d878", fontWeight: 700, fontFamily: 'Georgia, serif' }}>
              +{preview}
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 14px", borderRadius: 14,
      background: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)",
      boxShadow: active ? "0 4px 20px rgba(28,42,58,0.12)" : "0 1px 4px rgba(28,42,58,0.05)",
      border: active ? "1px solid rgba(28,42,58,0.15)" : "1px solid rgba(28,42,58,0.06)",
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 10,
        background: side === "me" ? "#1c2a3a" : "#a85b4a",
        display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
      }}>
        {side === "me" ? <WFTechWrench size={17} stroke="#fff" /> : <WFCrosshair size={17} stroke="#fff" />}
      </div>
      <div>
        <div style={{ fontSize: 10, color: "#6a7888", letterSpacing: "0.15em", textTransform: "uppercase" }}>{label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#1c2a3a" }}>{score}</span>
          <span style={{ fontSize: 9, color: "#6a7888" }}>MWh</span>
          {preview > 0 && <span style={{ fontSize: 10, color: "#3a8a5e", fontWeight: 600 }}>+{preview}</span>}
        </div>
      </div>
    </div>
  );
};

window.BattleTopBar = BattleTopBar;
window.SideLabel = SideLabel;
window.ScoreBadge = ScoreBadge;
