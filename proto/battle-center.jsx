// Center bar + battlefield backgrounds for themes

// ─── Wind display ──────────────────────────────────────────
const WindDisplay = ({ wind, theme }) => {
  if (theme === "tideboard") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <DiceRoller dice={wind.dice} rolling={wind.rolling} typhoon={wind.typhoon} theme={theme} size={48} />
        <div style={{ color: "#f4d68a", fontFamily: 'Georgia, serif' }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#c89848", fontFamily: '"Cinzel", serif' }}>WIND</div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>
            {wind.value}<span style={{ fontSize: 11, color: "#c89848" }}>m/s</span>
          </div>
          <div style={{ fontSize: 10, color: "#c89848" }}>{wind.label} · ×{wind.coeff.toFixed(2)}</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "8px 18px 8px 10px",
      background: "rgba(255,255,255,0.85)",
      borderRadius: 16,
      boxShadow: "0 4px 16px rgba(28,42,58,0.08)",
      border: "1px solid rgba(28,42,58,0.08)",
    }}>
      <DiceRoller dice={wind.dice} rolling={wind.rolling} typhoon={wind.typhoon} theme={theme} size={44} />
      <div>
        <div style={{ fontSize: 9, color: "#6a7888", letterSpacing: "0.18em", textTransform: "uppercase" }}>本回合風速</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 1 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#1c2a3a" }}>{wind.value}</span>
          <span style={{ fontSize: 11, color: "#6a7888" }}>m/s</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: wind.typhoon ? "#a8453a" : "#3aa7c8" }}>
          {wind.label} · ×{wind.coeff.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

// ─── Round display ──────────────────────────────────────────
const RoundDisplay = ({ round, maxRounds, theme }) => {
  if (theme === "tideboard") {
    return (
      <div style={{ textAlign: "center", color: "#f4d68a" }}>
        <div style={{ fontSize: 9, letterSpacing: "0.25em", opacity: 0.7, fontFamily: '"Cinzel", serif' }}>VOYAGE</div>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, fontFamily: 'Georgia, serif' }}>
          {round}<span style={{ fontSize: 12, opacity: 0.5 }}>/{maxRounds}</span>
        </div>
        <div style={{ display: "flex", gap: 1.5, justifyContent: "center", marginTop: 4 }}>
          {Array.from({ length: maxRounds }, (_, i) => (
            <div key={i} style={{
              width: 6, height: 3,
              background: i < round ? "#c89848" : "rgba(200,152,72,0.2)"
            }} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 9, color: "#6a7888", letterSpacing: "0.2em", textTransform: "uppercase" }}>回合</div>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: "#1c2a3a" }}>
        {round}<span style={{ fontSize: 12, color: "#6a7888", fontWeight: 400 }}>/{maxRounds}</span>
      </div>
      <div style={{ display: "flex", gap: 1.5, justifyContent: "center", marginTop: 4 }}>
        {Array.from({ length: maxRounds }, (_, i) => (
          <div key={i} style={{
            width: 6, height: 3, borderRadius: 999,
            background: i < round ? "#3aa7c8" : "rgba(28,42,58,0.1)",
            boxShadow: i === round - 1 ? "0 0 4px #3aa7c8" : "none",
          }} />
        ))}
      </div>
    </div>
  );
};

// ─── Action pips ───────────────────────────────────────────
const ActionPips = ({ actionsLeft, theme }) => {
  if (theme === "tideboard") {
    return (
      <div style={{ textAlign: "center", color: "#f4d68a" }}>
        <div style={{ fontSize: 9, letterSpacing: "0.25em", opacity: 0.7, fontFamily: '"Cinzel", serif' }}>ACTIONS</div>
        <div style={{ display: "flex", gap: 4, marginTop: 6, justifyContent: "center" }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: "50%",
              background: i < actionsLeft ? "radial-gradient(circle at 30% 30%, #f4d68a, #c89848)" : "transparent",
              border: "1.5px solid #c89848",
              boxShadow: i < actionsLeft ? "0 0 6px rgba(244,214,138,0.6)" : "none",
            }} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontSize: 9, color: "#6a7888", letterSpacing: "0.2em", textTransform: "uppercase" }}>動作</div>
      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: 13, height: 13, borderRadius: "50%",
            background: i < actionsLeft ? "#d9a85a" : "rgba(28,42,58,0.1)",
            boxShadow: i < actionsLeft ? "0 0 0 3px rgba(217,168,90,0.2)" : "none",
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>
    </div>
  );
};

// ─── Status effects strip ──────────────────────────────────
const StatusEffects = ({ weather, contracts, theme }) => {
  if (weather.length === 0 && contracts.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {weather.map((w, i) => {
        const card = WF_CARDS[w.cardId];
        if (theme === "tideboard") {
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 10px",
              background: "rgba(217,108,90,0.15)",
              border: "1px solid #d96c5a",
            }}>
              <WFStorm size={18} stroke="#f4886a" />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#f4886a", fontFamily: 'Georgia, serif' }}>{card.name}</div>
                <div style={{ fontSize: 9, color: "#f4886a", opacity: 0.7 }}>還剩 {w.duration} 回</div>
              </div>
            </div>
          );
        }
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px",
            background: "rgba(217,168,90,0.15)",
            border: "1px solid rgba(217,168,90,0.3)",
            borderRadius: 10,
          }}>
            <WFStorm size={18} stroke="#a87a2a" />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#a87a2a" }}>{card.name}</div>
              <div style={{ fontSize: 9, color: "#a87a2a", opacity: 0.7 }}>還剩 {w.duration} 回</div>
            </div>
          </div>
        );
      })}
      {contracts.map((c, i) => {
        if (theme === "tideboard") {
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 10px",
              background: "rgba(168,216,120,0.1)",
              border: "1px solid #5db58c",
            }}>
              <WFContract size={18} stroke="#a8d878" />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#a8d878", fontFamily: 'Georgia, serif' }}>穩定供電</div>
                <div style={{ fontSize: 9, color: "#a8d878", opacity: 0.7 }}>{c.progress}/{c.target} · +{c.reward}</div>
              </div>
            </div>
          );
        }
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px",
            background: "rgba(157,127,200,0.12)",
            border: "1px solid rgba(157,127,200,0.3)",
            borderRadius: 10,
          }}>
            <WFContract size={18} stroke="#7a5ca8" />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#7a5ca8" }}>穩定供電</div>
              <div style={{ fontSize: 9, color: "#7a5ca8", opacity: 0.7 }}>{c.progress}/{c.target} · +{c.reward}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Background for theme ──────────────────────────────────
const ThemeBackground = ({ theme }) => {
  if (theme === "tideboard") {
    return (
      <>
        <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1440 900"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true">
          <defs>
            <linearGradient id="bw-wood" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8a6a4a" />
              <stop offset="50%" stopColor="#a07d5a" />
              <stop offset="100%" stopColor="#6b5240" />
            </linearGradient>
            <radialGradient id="bw-vignette" cx="50%" cy="50%" r="80%">
              <stop offset="40%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
            </radialGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#bw-wood)" />
          {Array.from({ length: 5 }, (_, i) => (
            <line key={i} x1="0" y1={i * 180} x2="1440" y2={i * 180} stroke="rgba(40,25,15,0.4)" strokeWidth="2" />
          ))}
          {/* Grain noise */}
          {Array.from({ length: 80 }, (_, i) => (
            <path key={i} d={`M 0 ${i * 12 + 4} Q 80 ${i * 12 + 2} 160 ${i * 12 + 4} T 320 ${i * 12 + 4} T 480 ${i * 12 + 4} T 640 ${i * 12 + 4} T 800 ${i * 12 + 4} T 960 ${i * 12 + 4} T 1120 ${i * 12 + 4} T 1280 ${i * 12 + 4} T 1440 ${i * 12 + 4}`}
              fill="none" stroke="rgba(60,40,25,0.08)" strokeWidth="0.6" />
          ))}
          <rect width="1440" height="900" fill="url(#bw-vignette)" />
        </svg>
      </>
    );
  }
  // Cumulus
  return (
    <>
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1440 900"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true">
        <defs>
          <radialGradient id="bw-sun" cx="80%" cy="20%" r="50%">
            <stop offset="0%" stopColor="#ffe4c4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffe4c4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#bw-sun)" opacity="0.5" />
        <g fill="#ffffff" opacity="0.5" style={{ animation: "wf-wind-bg-drift 60s linear infinite" }}>
          <ellipse cx="180" cy="100" rx="140" ry="22" />
          <ellipse cx="220" cy="120" rx="110" ry="18" />
          <ellipse cx="1100" cy="80" rx="180" ry="26" />
          <ellipse cx="1180" cy="100" rx="120" ry="18" />
          <ellipse cx="560" cy="140" rx="160" ry="20" />
          <ellipse cx="80" cy="260" rx="100" ry="14" />
          <ellipse cx="1350" cy="300" rx="120" ry="16" />
        </g>
        <rect x="0" y="445" width="1440" height="1.5" fill="#9fb6bd" opacity="0.3" />
      </svg>
      {/* Wave foam bottom */}
      <svg width="100%" height="120" preserveAspectRatio="none" viewBox="0 0 1440 120"
        style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.35, pointerEvents: "none" }} aria-hidden="true">
        <path d="M0 80 Q 120 40 240 80 T 480 80 T 720 80 T 960 80 T 1200 80 T 1440 80 L 1440 120 L 0 120 Z" fill="#c5a888" />
        <path d="M0 100 Q 100 70 200 100 T 400 100 T 600 100 T 800 100 T 1000 100 T 1200 100 T 1440 100 L 1440 120 L 0 120 Z" fill="#b39476" />
      </svg>
    </>
  );
};

window.WindDisplay = WindDisplay;
window.RoundDisplay = RoundDisplay;
window.ActionPips = ActionPips;
window.StatusEffects = StatusEffects;
window.ThemeBackground = ThemeBackground;
