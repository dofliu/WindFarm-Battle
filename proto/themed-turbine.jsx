// Themed Turbine + Tech components

const ThemedTurbine = ({ turbine, theme = "cumulus", empty, targeted, faulted, repairing, onClick, deployed }) => {
  const t = wfThemeOf(theme);

  if (empty) {
    if (theme === "tideboard") {
      return (
        <div style={{ width: 120, height: 150, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
          <svg width="120" height="150" viewBox="0 0 120 150">
            <ellipse cx="60" cy="135" rx="42" ry="6" fill="rgba(0,0,0,0.3)" />
            <circle cx="60" cy="80" r="50" fill="none" stroke="rgba(200,152,72,0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>
        </div>
      );
    }
    return (
      <div style={{
        width: 168, height: 200,
        borderRadius: 22,
        border: "1.5px dashed rgba(28,42,58,0.18)",
        background: "rgba(255,255,255,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 6,
        color: "rgba(28,42,58,0.35)",
      }}>
        <WFTurbineOnshore size={28} stroke="currentColor" strokeWidth={1.2} />
        <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>空缺</span>
      </div>
    );
  }

  const card = WF_CARDS[turbine.cardId];
  const IconComp = wfGetIcon(card.icon);
  const dropTotal = (turbine.faults || []).reduce((s, f) => s + (WF_CARDS[f]?.stats?.drop || 0), 0);
  const eff = Math.max(0, turbine.avail - dropTotal);
  const isLegendary = card.legendary;
  const hasFaults = (turbine.faults || []).length > 0;
  const isNew = turbine.placedAt && Date.now() - turbine.placedAt < 800;

  if (theme === "tideboard") {
    return (
      <button onClick={onClick}
        disabled={!onClick}
        style={{
          all: "unset",
          position: "relative", width: 120, height: 160,
          display: "flex", flexDirection: "column", alignItems: "center",
          cursor: onClick ? "pointer" : "default",
          transform: targeted ? "scale(1.05)" : isNew ? "scale(1.08)" : "none",
          transition: "transform 0.3s cubic-bezier(.2,.7,.3,1.4)",
          animation: isNew ? "wf-deploy-bounce 0.5s ease-out" : "none",
        }}>
        <div style={{ position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)",
          width: 90, height: 14, background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)" }} />
        <svg width="120" height="150" viewBox="0 0 120 150" style={{ position: "absolute", top: 0 }}>
          <defs>
            <radialGradient id={`tt-brass-${turbine.cardId}-${deployed || 0}`} cx="50%" cy="30%" r="80%">
              <stop offset="0%" stopColor={isLegendary ? "#f8e094" : "#e8c878"} />
              <stop offset="50%" stopColor={isLegendary ? "#d8a838" : "#c89848"} />
              <stop offset="100%" stopColor="#6e4a18" />
            </radialGradient>
          </defs>
          <path d="M60 8 L102 30 L102 90 L60 112 L18 90 L18 30 Z"
            fill={`url(#tt-brass-${turbine.cardId}-${deployed || 0})`}
            stroke={targeted ? "#d96c5a" : "#3d2a1e"} strokeWidth={targeted ? "3" : "1.5"} />
          <path d="M60 14 L97 33 L97 87 L60 106 L23 87 L23 33 Z"
            fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
          <path d="M60 24 L88 39 L88 76 L60 91 L32 76 L32 39 Z" fill="#3d2a1e" />
        </svg>
        <div style={{ position: "absolute", top: 28, left: "50%", transform: "translateX(-50%)",
          width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center",
          background: "radial-gradient(circle, rgba(58,167,200,0.4) 0%, #3d2a1e 100%)",
          borderRadius: "50%" }}>
          <IconComp size={36} stroke="#e8c878" strokeWidth={1.3} />
        </div>
        {/* MW */}
        <div style={{ position: "absolute", top: -4, left: -4,
          width: 30, height: 30, borderRadius: "50%",
          background: "radial-gradient(circle at 30% 30%, #f4d68a, #c89848 60%, #6e4a18)",
          border: "2px solid #3d2a1e",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#3d2a1e", fontSize: 13, fontWeight: 800, fontFamily: 'Georgia, serif' }}>{card.stats.mw}</div>
        {/* Avail */}
        <div style={{ position: "absolute", top: -4, right: -4,
          width: 30, height: 30, borderRadius: "50%",
          background: eff > 70 ? "radial-gradient(circle at 30% 30%, #b5d68a, #5db58c 60%, #2a5a3c)"
                     : eff > 40 ? "radial-gradient(circle at 30% 30%, #f4c878, #d9a85a 60%, #6e4a18)"
                                : "radial-gradient(circle at 30% 30%, #f4886a, #d96c5a 60%, #6e2818)",
          border: "2px solid #3d2a1e",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 10, fontWeight: 800, fontFamily: 'Georgia, serif' }}>{eff}</div>
        {/* Name plaque */}
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(180deg, #3d2a1e 0%, #2a1810 100%)",
          border: "1px solid #c89848", padding: "2px 12px", borderRadius: 4,
          color: "#e8c878", fontSize: 11, fontWeight: 700,
          whiteSpace: "nowrap", fontFamily: 'Georgia, serif' }}>{card.name}</div>
        {isLegendary && (
          <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)",
            fontSize: 14, color: "#f8e094", textShadow: "0 0 8px #d8a838, 0 2px 4px rgba(0,0,0,0.5)" }}>♛</div>
        )}
        {hasFaults && (
          <div style={{ position: "absolute", inset: "20px 16px 26px 16px",
            border: "2px solid #d96c5a", borderRadius: 4,
            background: "radial-gradient(circle, rgba(217,108,90,0) 30%, rgba(217,108,90,0.3) 100%)",
            pointerEvents: "none", animation: "wf-fault-pulse 1.5s ease-in-out infinite" }}>
          </div>
        )}
        {targeted && <TargetReticle theme={theme} />}
      </button>
    );
  }

  // Cumulus
  return (
    <button onClick={onClick}
      disabled={!onClick}
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #c5dde8 100%)",
        border: targeted ? "3px solid #d96c5a" : isLegendary ? "3px solid #d9a85a" : "2.5px solid #2a5a78",
        padding: 10, margin: 0, font: "inherit", color: "inherit", textAlign: "inherit",
        position: "relative",
        width: 168, height: 200,
        borderRadius: 22,
        boxShadow: targeted
          ? "0 0 0 6px rgba(217,108,90,0.18), 0 14px 36px rgba(217,108,90,0.35)"
          : isLegendary
            ? "0 14px 36px rgba(217,168,90,0.4), 0 0 0 4px rgba(217,168,90,0.18)"
            : "0 12px 28px rgba(28,90,120,0.28), 0 1px 0 rgba(255,255,255,0.9) inset",
        display: "flex", flexDirection: "column", gap: 6,
        cursor: onClick ? "pointer" : "default",
        transform: targeted ? "scale(1.03)" : isNew ? "scale(1.06)" : "none",
        transition: "transform 0.3s cubic-bezier(.2,.7,.3,1.4)",
        animation: isNew ? "wf-deploy-bounce 0.5s ease-out both" : "none",
      }}>
      {/* Art */}
      <div style={{
        position: "relative",
        height: 96, borderRadius: 12,
        background: `linear-gradient(180deg, hsl(200, 40%, 92%) 0%, hsl(200, 30%, 82%) 100%)`,
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <WFStripedPlaceholder width={144} height={96} stripe="hsla(200, 30%, 50%, 0.15)" />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconComp size={56} stroke="#3aa7c8" strokeWidth={1.2} />
        </div>
        {isLegendary && (
          <div style={{ position: "absolute", top: 6, right: 6,
            background: "#d9a85a", color: "#fff",
            fontSize: 8, fontWeight: 700, letterSpacing: "0.1em",
            padding: "2px 6px", borderRadius: 4 }}>傳奇</div>
        )}
      </div>
      {/* Name */}
      <div style={{ fontSize: 12, fontWeight: 700, color: t.textPrimary, fontFamily: t.fontUI }}>{card.name}</div>
      {/* Stats */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <WFPowerBolt size={11} stroke="#3aa7c8" fill="#3aa7c8" />
          <span style={{ fontWeight: 700, color: t.textPrimary }}>{card.stats.mw}</span>
        </div>
        <div style={{ flex: 1, height: 4, background: "rgba(28,42,58,0.08)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${Math.max(4, eff)}%`,
            background: eff > 70 ? "#5db58c" : eff > 40 ? "#d9a85a" : "#d96c5a",
            borderRadius: 999, transition: "width 0.5s ease",
          }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 600,
          color: eff > 70 ? "#3a8a5e" : eff > 40 ? "#a87a2a" : "#a8453a",
          fontVariantNumeric: "tabular-nums" }}>{eff}%</span>
      </div>
      {/* Fault badges */}
      {hasFaults && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {turbine.faults.map((fid, i) => {
            const f = WF_CARDS[fid];
            const FIcon = wfGetIcon(f.icon);
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 3,
                padding: "2px 6px",
                background: "rgba(217,108,90,0.12)",
                border: "1px solid rgba(217,108,90,0.25)",
                borderRadius: 6,
                fontSize: 9, fontWeight: 600, color: "#a8453a",
              }}>
                <FIcon size={10} stroke="#a8453a" />
                <span>-{f.stats?.drop || 0}%</span>
              </div>
            );
          })}
        </div>
      )}
      {targeted && <TargetReticle theme={theme} />}
    </button>
  );
};

const TargetReticle = ({ theme }) => (
  <div style={{ position: "absolute", inset: -8, pointerEvents: "none" }}>
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <rect x="0" y="0" width="100%" height="100%" rx="22" fill="none"
        stroke="#d96c5a" strokeWidth="2" strokeDasharray="6 4"
        style={{ animation: "wf-target-spin 4s linear infinite" }} />
    </svg>
    <div style={{ position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)",
      background: "#d96c5a", color: "#fff",
      fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
      letterSpacing: "0.1em", whiteSpace: "nowrap",
      display: "flex", alignItems: "center", gap: 4,
    }}>
      <WFCrosshair size={11} stroke="#fff" />
      目標
    </div>
  </div>
);

const ThemedTech = ({ techId, theme = "cumulus" }) => {
  const card = WF_CARDS[techId];
  const IconComp = wfGetIcon(card.icon);
  if (theme === "tideboard") {
    return (
      <div style={{
        position: "relative", width: 56, height: 56,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="56" height="56" viewBox="0 0 56 56" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id={`tide-med-${techId}`} cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor={card.legendary ? "#f8e094" : "#e8c878"} />
              <stop offset="60%" stopColor={card.legendary ? "#d8a838" : "#c89848"} />
              <stop offset="100%" stopColor="#6e4a18" />
            </radialGradient>
          </defs>
          <circle cx="28" cy="28" r="26" fill={`url(#tide-med-${techId})`} stroke="#3d2a1e" strokeWidth="1.5" />
          <circle cx="28" cy="28" r="20" fill="#2a4838" stroke="rgba(0,0,0,0.5)" />
        </svg>
        <IconComp size={22} stroke="#a8d878" />
        <div style={{
          position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)",
          fontSize: 9, color: "#f4d68a", whiteSpace: "nowrap",
          fontFamily: 'Georgia, serif', fontWeight: 700,
          textShadow: "0 1px 2px rgba(0,0,0,0.8)",
        }}>{card.name}</div>
      </div>
    );
  }
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "5px 11px 5px 7px",
      background: "rgba(255,255,255,0.85)",
      border: card.legendary ? "1px solid #d9a85a" : "1px solid rgba(93,181,140,0.4)",
      borderRadius: 999,
      boxShadow: "0 2px 6px rgba(28,42,58,0.06)",
    }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%",
        background: card.legendary ? "#d9a85a" : "#5db58c",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <IconComp size={14} stroke="#fff" />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#1c2a3a" }}>{card.name}</span>
    </div>
  );
};

window.ThemedTurbine = ThemedTurbine;
window.ThemedTech = ThemedTech;
