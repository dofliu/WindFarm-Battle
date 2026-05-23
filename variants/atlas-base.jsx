// ═══════════════════════════════════════════════════════════════════
// Variant 4 · Atlas — tabletop nautical chart, hand-drawn diorama
// Aged sea-chart paper, sketched compass rose, pin-marker turbines,
// field-notebook cards.
// ═══════════════════════════════════════════════════════════════════

const atlasStyles = {
  root: {
    width: 1440,
    height: 900,
    position: "relative",
    overflow: "hidden",
    fontFamily: '"Caveat", "Kalam", "Patrick Hand", cursive',
    color: "#3a2f24",
    background: "#e8d8b8",
  },
};

// Aged chart paper background
const AtlasChart = () => (
  <svg width="1440" height="900" viewBox="0 0 1440 900" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
    <defs>
      <radialGradient id="atlas-paper" cx="50%" cy="50%" r="80%">
        <stop offset="0%" stopColor="#f0e0bc" />
        <stop offset="60%" stopColor="#e0c898" />
        <stop offset="100%" stopColor="#9a7a4a" />
      </radialGradient>
      <pattern id="atlas-noise" patternUnits="userSpaceOnUse" width="40" height="40">
        <rect width="40" height="40" fill="transparent" />
        <circle cx="6" cy="10" r="0.5" fill="rgba(60,40,20,0.15)" />
        <circle cx="22" cy="6" r="0.4" fill="rgba(60,40,20,0.12)" />
        <circle cx="32" cy="18" r="0.6" fill="rgba(60,40,20,0.15)" />
        <circle cx="14" cy="28" r="0.4" fill="rgba(60,40,20,0.1)" />
        <circle cx="28" cy="36" r="0.5" fill="rgba(60,40,20,0.14)" />
      </pattern>
    </defs>
    <rect width="1440" height="900" fill="url(#atlas-paper)" />
    <rect width="1440" height="900" fill="url(#atlas-noise)" />

    {/* Coastal contour lines (top — opponent's coast) */}
    <g fill="none" stroke="rgba(80,60,40,0.35)" strokeWidth="0.8">
      <path d="M 0 220 Q 200 180 400 210 T 800 230 T 1200 200 T 1440 220" />
      <path d="M 0 240 Q 220 200 440 230 T 840 250 T 1240 220 T 1440 240" opacity="0.6" />
      <path d="M 0 260 Q 240 220 480 250 T 880 270 T 1280 240 T 1440 260" opacity="0.4" />
    </g>
    {/* Coastal contour lines (bottom — player's coast) */}
    <g fill="none" stroke="rgba(80,60,40,0.35)" strokeWidth="0.8">
      <path d="M 0 740 Q 200 770 400 750 T 800 730 T 1200 760 T 1440 740" />
      <path d="M 0 720 Q 220 750 440 730 T 840 710 T 1240 740 T 1440 720" opacity="0.6" />
      <path d="M 0 700 Q 240 730 480 710 T 880 690 T 1280 720 T 1440 700" opacity="0.4" />
    </g>

    {/* Sea waves in middle */}
    <g stroke="rgba(60,90,140,0.4)" fill="none" strokeWidth="1">
      {Array.from({ length: 8 }, (_, i) => {
        const y = 350 + i * 30;
        return <path key={i} d={`M 60 ${y} q 10 -6 20 0 q 10 6 20 0 q 10 -6 20 0`} />;
      })}
      {Array.from({ length: 6 }, (_, i) => {
        const y = 400 + i * 40;
        return <path key={`r${i}`} d={`M 1280 ${y} q 10 -6 20 0 q 10 6 20 0 q 10 -6 20 0`} />;
      })}
    </g>

    {/* Lat/long grid (faint) */}
    <g stroke="rgba(80,60,40,0.15)" strokeWidth="0.5" strokeDasharray="3 6">
      {[180, 360, 540, 720, 900, 1080, 1260].map(x => (
        <line key={x} x1={x} y1="80" x2={x} y2="820" />
      ))}
      {[160, 320, 480, 640].map(y => (
        <line key={y} x1="40" y1={y} x2="1400" y2={y} />
      ))}
    </g>

    {/* Decorative compass rose in corner */}
    <g transform="translate(140 760)" opacity="0.5">
      <circle r="38" fill="none" stroke="rgba(60,40,20,0.6)" strokeWidth="1" />
      <circle r="30" fill="none" stroke="rgba(60,40,20,0.4)" strokeWidth="0.6" />
      <path d="M 0 -38 L 4 0 L 0 38 L -4 0 Z" fill="rgba(60,40,20,0.4)" />
      <path d="M -38 0 L 0 -4 L 38 0 L 0 4 Z" fill="rgba(60,40,20,0.3)" />
      <text x="0" y="-44" fontSize="11" fontFamily="Georgia, serif" fill="rgba(60,40,20,0.7)" textAnchor="middle">N</text>
    </g>

    {/* Coastal city marker */}
    <g transform="translate(220 180)" opacity="0.6">
      <circle r="3" fill="rgba(60,40,20,0.7)" />
      <circle r="1" fill="#fff" />
      <text x="8" y="4" fontSize="13" fill="rgba(60,40,20,0.7)" fontFamily="Georgia, serif" fontStyle="italic">Mahalo Pt.</text>
    </g>
    <g transform="translate(1180 780)" opacity="0.6">
      <circle r="3" fill="rgba(60,40,20,0.7)" />
      <circle r="1" fill="#fff" />
      <text x="8" y="4" fontSize="13" fill="rgba(60,40,20,0.7)" fontFamily="Georgia, serif" fontStyle="italic">Port Tālī</text>
    </g>

    {/* Sketched sea creature */}
    <g transform="translate(1280 320)" opacity="0.35" stroke="rgba(60,40,20,0.7)" fill="none" strokeWidth="0.7">
      <path d="M 0 0 q 12 -8 24 0 q 8 6 16 0 q 6 -4 12 2" />
      <path d="M 4 4 q 4 4 12 0" />
      <circle cx="22" cy="0" r="0.8" fill="rgba(60,40,20,0.6)" stroke="none" />
    </g>

    {/* Dotted ship route */}
    <path d="M 180 200 Q 400 300 720 450 T 1240 750"
      stroke="rgba(140,40,30,0.5)" fill="none" strokeWidth="1.2"
      strokeDasharray="2 5" />
    <circle cx="720" cy="450" r="3" fill="rgba(140,40,30,0.7)" />

    {/* Stained/coffee ring stains */}
    <g opacity="0.18">
      <ellipse cx="180" cy="450" rx="38" ry="34" fill="none" stroke="#7a5a3a" strokeWidth="3" />
      <ellipse cx="1280" cy="180" rx="28" ry="24" fill="none" stroke="#7a5a3a" strokeWidth="2.5" />
    </g>

    {/* Page edge shadows */}
    <rect x="0" y="0" width="1440" height="20" fill="url(#atlas-noise)" opacity="0.5" />
    <rect width="1440" height="900" fill="url(#atlas-vignette)" />
  </svg>
);

// Top bar — leather portfolio strap style
const AtlasTopBar = () => (
  <div style={{
    position: "relative", height: 50, padding: "0 24px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "linear-gradient(180deg, #6e4a28 0%, #4a3018 100%)",
    borderBottom: "3px double #c89848",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <WFCompass size={28} stroke="#f4d68a" />
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#f4e8d0",
          fontFamily: '"Caveat", cursive', lineHeight: 1 }}>WindFarm Battle</div>
        <div style={{ fontSize: 12, color: "#d8b878", marginTop: 1,
          fontFamily: '"Caveat", cursive', fontStyle: "italic" }}>Atlas · 海圖航誌</div>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {["難度 · 中級", "卡冊", "新航次"].map((label, i) => (
        <button key={i} style={{
          padding: "5px 14px",
          background: "rgba(244,232,208,0.85)",
          border: "1px solid #6e4a28",
          borderRadius: 2,
          fontSize: 15, color: "#4a3018",
          fontFamily: '"Caveat", cursive',
          cursor: "pointer",
          transform: `rotate(${(i - 1) * 0.5}deg)`,
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}>{label}</button>
      ))}
    </div>
  </div>
);

// Pin-marker turbine on the chart
const AtlasTurbinePin = ({ turbine, empty, targeted }) => {
  if (empty) {
    return (
      <div style={{ width: 140, height: 160, display: "flex", alignItems: "center", justifyContent: "center",
        opacity: 0.4 }}>
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="22" fill="none" stroke="#7a5a3a" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x="30" y="35" fontSize="11" fill="#7a5a3a" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic">未開發</text>
        </svg>
      </div>
    );
  }
  const card = WF_CARDS[turbine.cardId];
  const IconComp = wfGetIcon(card.icon);
  const dropTotal = (turbine.faults || []).reduce((s, f) => s + (WF_CARDS[f]?.stats?.drop || 0), 0);
  const eff = Math.max(0, turbine.avail - dropTotal);
  const isLegendary = card.legendary;

  return (
    <div style={{
      position: "relative", width: 140, height: 170,
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      {/* Pin shadow */}
      <div style={{ position: "absolute", top: 22, left: "50%", transform: "translateX(-50%)",
        width: 88, height: 8, background: "radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 60%)",
        zIndex: 0 }} />

      {/* Map pin head — circular illustration */}
      <div style={{
        position: "relative", width: 84, height: 84, marginTop: 12,
        background: isLegendary
          ? "radial-gradient(circle at 30% 30%, #fff5d8, #e8c878 60%, #8a6028)"
          : "radial-gradient(circle at 30% 30%, #fff5d8, #d8b878 60%, #7a5a3a)",
        borderRadius: "50%",
        border: targeted ? "3px solid #a8453a" : "2.5px solid #4a3018",
        boxShadow: targeted
          ? "0 0 0 4px rgba(168,69,58,0.2), 0 6px 12px rgba(0,0,0,0.4)"
          : "0 6px 12px rgba(0,0,0,0.35), inset 0 -3px 6px rgba(0,0,0,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1,
      }}>
        <IconComp size={42} stroke="#3a2f24" strokeWidth={1.5} />
        {/* Hand-drawn arc detail */}
        <svg width="84" height="84" viewBox="0 0 84 84" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <path d="M 12 42 a 30 30 0 0 1 60 0" fill="none" stroke="rgba(60,40,20,0.3)" strokeWidth="0.8" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* Pin tail */}
      <svg width="20" height="22" viewBox="0 0 20 22" style={{ marginTop: -2 }}>
        <path d="M 10 0 L 18 8 L 10 22 L 2 8 Z" fill="#4a3018" stroke="#2a1810" strokeWidth="1" />
      </svg>

      {/* Label tag — handwritten */}
      <div style={{
        marginTop: 4,
        background: "rgba(244,232,208,0.95)",
        border: "1px solid #6e4a28",
        borderRadius: 2,
        padding: "2px 10px",
        fontSize: 16, fontWeight: 700,
        color: "#3a2f24",
        fontFamily: '"Caveat", cursive',
        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
        transform: "rotate(-2deg)",
        whiteSpace: "nowrap",
      }}>{card.name}</div>

      {/* Stats — bracketed handwritten note */}
      <div style={{
        marginTop: 6,
        display: "flex", gap: 8, fontSize: 13,
        color: "#3a2f24",
        fontFamily: '"Caveat", cursive',
        textShadow: "0 0 4px rgba(244,232,208,0.8)",
      }}>
        <span>{card.stats.mw}MW</span>
        <span style={{ color: eff > 70 ? "#3a6a3a" : eff > 40 ? "#8a6028" : "#a8453a" }}>{eff}%</span>
      </div>

      {/* Fault stamps */}
      {(turbine.faults || []).length > 0 && (
        <div style={{
          position: "absolute", top: 8, right: -4,
          padding: "3px 8px",
          background: "rgba(168,69,58,0.92)",
          border: "1.5px solid #6a2818",
          color: "#f4e8d0",
          fontSize: 13, fontWeight: 700,
          fontFamily: '"Caveat", cursive',
          transform: "rotate(8deg)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
          letterSpacing: "0.05em",
        }}>故障！</div>
      )}

      {/* Legendary star */}
      {isLegendary && (
        <div style={{ position: "absolute", top: 6, left: 8,
          fontSize: 16, color: "#c8860a",
          textShadow: "0 0 6px rgba(244,214,138,0.8)" }}>★</div>
      )}

      {/* Target reticle */}
      {targeted && (
        <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)" }}>
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: "absolute", top: 18, left: -18 }}>
            <circle cx="60" cy="60" r="56" fill="none" stroke="#a8453a" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1="60" y1="0" x2="60" y2="14" stroke="#a8453a" strokeWidth="1.5" />
            <line x1="60" y1="120" x2="60" y2="106" stroke="#a8453a" strokeWidth="1.5" />
            <line x1="0" y1="60" x2="14" y2="60" stroke="#a8453a" strokeWidth="1.5" />
            <line x1="120" y1="60" x2="106" y2="60" stroke="#a8453a" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </div>
  );
};

window.atlasStyles = atlasStyles;
window.AtlasChart = AtlasChart;
window.AtlasTopBar = AtlasTopBar;
window.AtlasTurbinePin = AtlasTurbinePin;
