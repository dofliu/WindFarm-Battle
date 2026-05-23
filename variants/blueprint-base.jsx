// ═══════════════════════════════════════════════════════════════════
// Variant 3 · Blueprint — MTG Arena-leaning, deep navy schematic
// Engineering grid, cyan accents, technical drawing aesthetic.
// Information-dense but elegant.
// ═══════════════════════════════════════════════════════════════════

const bpStyles = {
  root: {
    width: 1440,
    height: 900,
    position: "relative",
    overflow: "hidden",
    fontFamily: '"IBM Plex Sans", "Inter", system-ui, sans-serif',
    color: "#d8e6ee",
    background: "radial-gradient(ellipse at center top, #0d2538 0%, #061520 60%, #020a12 100%)",
  },
};

// Grid + wave pattern background
const BpGrid = () => (
  <svg width="1440" height="900" viewBox="0 0 1440 900" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true">
    <defs>
      <pattern id="bp-grid-fine" patternUnits="userSpaceOnUse" width="20" height="20">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(100,180,220,0.06)" strokeWidth="0.5" />
      </pattern>
      <pattern id="bp-grid-coarse" patternUnits="userSpaceOnUse" width="100" height="100">
        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(100,180,220,0.12)" strokeWidth="0.8" />
      </pattern>
    </defs>
    <rect width="1440" height="900" fill="url(#bp-grid-fine)" />
    <rect width="1440" height="900" fill="url(#bp-grid-coarse)" />
    {/* Wave contours */}
    <g stroke="rgba(80,160,200,0.1)" fill="none" strokeWidth="0.8">
      {[0, 1, 2, 3].map(i => (
        <path key={i} d={`M 0 ${300 + i * 60} Q 360 ${280 + i * 60} 720 ${300 + i * 60} T 1440 ${300 + i * 60}`} />
      ))}
    </g>
    {/* Center vertical reference */}
    <line x1="720" y1="0" x2="720" y2="900" stroke="rgba(100,180,220,0.15)" strokeDasharray="2 4" />
  </svg>
);

// Top status bar
const BpTopBar = () => (
  <div style={{
    position: "relative", height: 48, padding: "0 24px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    borderBottom: "1px solid rgba(100,180,220,0.2)",
    background: "rgba(0,15,25,0.6)",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <WFCompass size={22} stroke="#5cc8e8" />
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#e8f4fa", letterSpacing: "0.08em" }}>WINDFARM</span>
        <span style={{ fontSize: 11, color: "#5cc8e8", letterSpacing: "0.15em" }}>BATTLE</span>
      </div>
      <div style={{ marginLeft: 24, padding: "3px 10px", border: "1px solid rgba(100,180,220,0.3)",
        background: "rgba(100,180,220,0.08)", borderRadius: 3,
        fontSize: 9, color: "#9ec8de", letterSpacing: "0.2em" }}>
        BLUEPRINT · 藍圖
      </div>
    </div>
    <div style={{ display: "flex", gap: 6 }}>
      {["難度 · HARD", "圖鑑", "重新部署"].map((label, i) => (
        <button key={i} style={{
          padding: "5px 12px",
          background: "transparent",
          border: "1px solid rgba(100,180,220,0.3)",
          borderRadius: 3,
          fontSize: 11, color: "#9ec8de",
          letterSpacing: "0.05em",
          cursor: "pointer",
          fontFamily: "inherit",
        }}>{label}</button>
      ))}
    </div>
    {/* Live indicator */}
    <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)",
      fontSize: 9, color: "#5cc8e8", letterSpacing: "0.3em", display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5cc8e8", boxShadow: "0 0 8px #5cc8e8" }} />
      ROUND 07 · YOUR DEPLOYMENT
    </div>
  </div>
);

// Wind gauge (technical meter)
const BpWindGauge = ({ value, label, coeff }) => (
  <div style={{
    width: 240,
    border: "1px solid rgba(100,180,220,0.3)",
    background: "rgba(0,20,35,0.7)",
    padding: 14,
    position: "relative",
  }}>
    {/* Corner ticks */}
    {[
      { top: -1, left: -1 }, { top: -1, right: -1 },
      { bottom: -1, left: -1 }, { bottom: -1, right: -1 }
    ].map((p, i) => (
      <div key={i} style={{ position: "absolute", ...p, width: 8, height: 8,
        borderTop: i < 2 ? "2px solid #5cc8e8" : "none",
        borderBottom: i >= 2 ? "2px solid #5cc8e8" : "none",
        borderLeft: i % 2 === 0 ? "2px solid #5cc8e8" : "none",
        borderRight: i % 2 === 1 ? "2px solid #5cc8e8" : "none" }} />
    ))}
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9,
      color: "#5cc8e8", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 8 }}>
      <span>Wind Speed</span>
      <span style={{ opacity: 0.6 }}>m/s</span>
    </div>
    {/* Linear gauge */}
    <div style={{ position: "relative", height: 8, background: "rgba(100,180,220,0.1)",
      border: "1px solid rgba(100,180,220,0.3)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0,
        width: `${(value / 25) * 100}%`,
        background: "linear-gradient(90deg, #5cc8e8 0%, #88e8a8 100%)",
        boxShadow: "0 0 8px rgba(92,200,232,0.6)" }} />
      {/* Tick marks */}
      {[5, 10, 15, 20].map(t => (
        <div key={t} style={{ position: "absolute", left: `${(t / 25) * 100}%`, top: -3, bottom: -3,
          width: 1, background: "rgba(100,180,220,0.5)" }} />
      ))}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: "rgba(158,200,222,0.6)" }}>
      <span>0</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span>
    </div>
    <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#e8f4fa", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {value}<span style={{ fontSize: 13, color: "#5cc8e8", marginLeft: 4 }}>m/s</span>
        </div>
        <div style={{ fontSize: 10, color: "#88e8a8", marginTop: 4, letterSpacing: "0.1em" }}>{label}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 9, color: "rgba(158,200,222,0.6)", letterSpacing: "0.15em" }}>COEFF</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#88e8a8", fontVariantNumeric: "tabular-nums" }}>×{coeff.toFixed(2)}</div>
      </div>
    </div>
  </div>
);

// Score module
const BpScore = ({ side, label, score, preview, active }) => (
  <div style={{
    border: `1px solid ${active ? "#5cc8e8" : "rgba(100,180,220,0.25)"}`,
    background: active ? "rgba(92,200,232,0.08)" : "rgba(0,20,35,0.6)",
    padding: "12px 18px",
    minWidth: 180,
    boxShadow: active ? "0 0 20px rgba(92,200,232,0.2), inset 0 0 0 1px rgba(92,200,232,0.2)" : "none",
    position: "relative",
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontSize: 9, color: side === "opp" ? "#e88a7a" : "#5cc8e8",
        letterSpacing: "0.25em", textTransform: "uppercase" }}>{label}</span>
      {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5cc8e8",
        boxShadow: "0 0 8px #5cc8e8" }} />}
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
      <span style={{ fontSize: 36, fontWeight: 700, color: "#e8f4fa", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{score}</span>
      <span style={{ fontSize: 11, color: "rgba(158,200,222,0.7)" }}>MWh</span>
      {preview > 0 && (
        <span style={{ fontSize: 12, color: "#88e8a8", fontWeight: 600, marginLeft: 4 }}>
          +{preview} <span style={{ fontSize: 9 }}>↗</span>
        </span>
      )}
    </div>
  </div>
);
window.bpStyles = bpStyles;
window.BpGrid = BpGrid;
window.BpTopBar = BpTopBar;
window.BpWindGauge = BpWindGauge;
window.BpScore = BpScore;
