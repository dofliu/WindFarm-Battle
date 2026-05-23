// Blueprint variant — turbine schematics + cards + assembly

// Schematic turbine card (deployed)
const BpTurbineSchematic = ({ turbine, empty, targeted }) => {
  if (empty) {
    return (
      <div style={{
        width: 200, height: 240,
        border: "1px dashed rgba(100,180,220,0.25)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
        background: "rgba(0,20,35,0.3)",
      }}>
        <WFTurbineOnshore size={32} stroke="rgba(100,180,220,0.3)" strokeWidth={1} />
        <span style={{ fontSize: 9, color: "rgba(100,180,220,0.5)",
          letterSpacing: "0.25em", textTransform: "uppercase" }}>EMPTY · SLOT</span>
      </div>
    );
  }
  const card = WF_CARDS[turbine.cardId];
  const IconComp = wfGetIcon(card.icon);
  const dropTotal = (turbine.faults || []).reduce((s, f) => s + (WF_CARDS[f]?.stats?.drop || 0), 0);
  const eff = Math.max(0, turbine.avail - dropTotal);
  const isLegendary = card.legendary;
  const accentColor = targeted ? "#e88a7a" : isLegendary ? "#f4d68a" : "#5cc8e8";
  return (
    <div style={{
      width: 200, height: 240,
      border: `1px solid ${accentColor}`,
      background: targeted ? "rgba(232,138,122,0.06)" : "rgba(0,20,35,0.85)",
      position: "relative",
      boxShadow: targeted
        ? "0 0 24px rgba(232,138,122,0.4), inset 0 0 20px rgba(232,138,122,0.1)"
        : isLegendary
          ? "0 0 16px rgba(244,214,138,0.2), inset 0 0 10px rgba(244,214,138,0.05)"
          : "0 4px 16px rgba(0,0,0,0.4)",
    }}>
      {/* Corner brackets */}
      {[
        { top: 0, left: 0, borderTop: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}` },
        { top: 0, right: 0, borderTop: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}` },
        { bottom: 0, left: 0, borderBottom: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}` },
        { bottom: 0, right: 0, borderBottom: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}` },
      ].map((s, i) => <div key={i} style={{ position: "absolute", width: 14, height: 14, ...s }} />)}

      {/* ID + IEC */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px",
        fontSize: 9, color: accentColor, letterSpacing: "0.15em", borderBottom: `1px solid ${accentColor}33` }}>
        <span style={{ fontWeight: 700 }}>{card.id}</span>
        <span style={{ opacity: 0.7 }}>IEC {card.iec}</span>
      </div>

      {/* Schematic area */}
      <div style={{
        position: "relative",
        height: 110,
        background: "rgba(0,30,50,0.5)",
        borderBottom: `1px solid ${accentColor}33`,
        overflow: "hidden",
      }}>
        <WFStripedPlaceholder width={200} height={110} stripe={`${accentColor}1a`} />
        <svg width="200" height="110" viewBox="0 0 200 110" style={{ position: "absolute", inset: 0 }}>
          {/* Crosshair guides */}
          <line x1="100" y1="0" x2="100" y2="110" stroke={accentColor} strokeOpacity="0.15" strokeDasharray="2 4" />
          <line x1="0" y1="55" x2="200" y2="55" stroke={accentColor} strokeOpacity="0.15" strokeDasharray="2 4" />
          {/* Dimension labels */}
          <text x="6" y="14" fontSize="8" fill={accentColor} fillOpacity="0.6" fontFamily="monospace">A.01</text>
          <text x="174" y="14" fontSize="8" fill={accentColor} fillOpacity="0.6" fontFamily="monospace">M-1</text>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconComp size={70} stroke={accentColor} strokeWidth={1} />
        </div>
      </div>

      {/* Name + stats grid */}
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e8f4fa", marginBottom: 6, letterSpacing: "0.05em" }}>
          {card.name}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 10 }}>
          <div>
            <div style={{ fontSize: 8, color: "rgba(158,200,222,0.6)", letterSpacing: "0.15em" }}>MW</div>
            <div style={{ color: "#5cc8e8", fontWeight: 700, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{card.stats.mw}</div>
          </div>
          <div>
            <div style={{ fontSize: 8, color: "rgba(158,200,222,0.6)", letterSpacing: "0.15em" }}>AVAIL</div>
            <div style={{
              color: eff > 70 ? "#88e8a8" : eff > 40 ? "#f4d68a" : "#e88a7a",
              fontWeight: 700, fontSize: 14, fontVariantNumeric: "tabular-nums"
            }}>{eff}%</div>
          </div>
        </div>
        {/* Availability bar */}
        <div style={{ height: 3, background: "rgba(100,180,220,0.1)", marginTop: 6 }}>
          <div style={{ height: "100%", width: `${eff}%`,
            background: eff > 70 ? "#88e8a8" : eff > 40 ? "#f4d68a" : "#e88a7a",
            boxShadow: `0 0 6px ${eff > 70 ? "#88e8a8" : eff > 40 ? "#f4d68a" : "#e88a7a"}` }} />
        </div>
        {/* Faults */}
        {(turbine.faults || []).length > 0 && (
          <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
            {turbine.faults.map((fid, i) => {
              const f = WF_CARDS[fid];
              const FIcon = wfGetIcon(f.icon);
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "2px 5px",
                  border: "1px solid #e88a7a", background: "rgba(232,138,122,0.12)",
                  fontSize: 9, color: "#e88a7a", fontWeight: 600, letterSpacing: "0.05em",
                }}>
                  <FIcon size={10} stroke="#e88a7a" />
                  <span>-{f.stats.drop}%</span>
                  <span style={{ opacity: 0.6 }}>×{f.duration}r</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Target reticle */}
      {targeted && (
        <div style={{ position: "absolute", top: -24, left: "50%", transform: "translateX(-50%)",
          padding: "3px 10px", background: "#e88a7a", color: "#1a0a0a",
          fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
          display: "flex", alignItems: "center", gap: 4 }}>
          <WFCrosshair size={11} stroke="#1a0a0a" />
          TARGET LOCK
        </div>
      )}
      {isLegendary && (
        <div style={{ position: "absolute", top: -8, right: -8,
          width: 18, height: 18, transform: "rotate(45deg)",
          background: "#f4d68a", border: "1px solid #0d2538" }} />
      )}
    </div>
  );
};

// Blueprint hand card
const BpHandCard = ({ cardId, lifted, dragging, style }) => {
  const card = WF_CARDS[cardId];
  if (!card) return null;
  const IconComp = wfGetIcon(card.icon);
  const theme = WF_TYPE_THEME[card.type];
  const isLegendary = card.legendary;
  // Type to hex
  const typeColor = {
    turbine: "#5cc8e8", tech: "#88e8a8", fault: "#e88a7a",
    func: "#e8a8d8", weather: "#f4d68a", contract: "#bda8e8"
  }[card.type];

  return (
    <div style={{
      width: 152, height: 220,
      position: "relative",
      background: "rgba(8,22,32,0.95)",
      border: `1px solid ${isLegendary ? "#f4d68a" : typeColor}`,
      boxShadow: lifted
        ? `0 16px 40px rgba(0,0,0,0.6), 0 0 30px ${typeColor}66, inset 0 0 0 1px ${typeColor}66`
        : dragging
          ? `0 24px 50px rgba(0,0,0,0.7), 0 0 40px ${typeColor}88`
          : "0 4px 14px rgba(0,0,0,0.4)",
      transform: lifted ? "translateY(-32px) scale(1.08)" : dragging ? "translateY(-200px) translateX(60px) rotate(-6deg) scale(1.12)" : "none",
      transition: "all 0.2s ease",
      ...style,
    }}>
      {/* Corner brackets */}
      {[
        { top: -1, left: -1, borderTop: `2px solid ${typeColor}`, borderLeft: `2px solid ${typeColor}` },
        { top: -1, right: -1, borderTop: `2px solid ${typeColor}`, borderRight: `2px solid ${typeColor}` },
        { bottom: -1, left: -1, borderBottom: `2px solid ${typeColor}`, borderLeft: `2px solid ${typeColor}` },
        { bottom: -1, right: -1, borderBottom: `2px solid ${typeColor}`, borderRight: `2px solid ${typeColor}` },
      ].map((s, i) => <div key={i} style={{ position: "absolute", width: 10, height: 10, ...s }} />)}

      {/* Header band */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 8px",
        background: `linear-gradient(90deg, ${typeColor}22 0%, transparent 100%)`,
        borderBottom: `1px solid ${typeColor}55`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 22, height: 22,
            background: typeColor, color: "#0d2538",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800,
            fontFamily: "monospace",
          }}>{card.cost}</div>
          <span style={{ fontSize: 8, color: typeColor, letterSpacing: "0.2em", fontFamily: "monospace" }}>{card.id}</span>
        </div>
        <span style={{ fontSize: 8, color: typeColor, letterSpacing: "0.15em" }}>{theme.short}</span>
      </div>

      {/* Art slot */}
      <div style={{
        position: "relative", height: 92,
        background: "rgba(0,30,50,0.5)",
        borderBottom: `1px solid ${typeColor}33`,
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <WFStripedPlaceholder width={150} height={92} stripe={`${typeColor}1a`} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconComp size={54} stroke={typeColor} strokeWidth={1} />
        </div>
        {/* Corner brackets in art */}
        <svg width="150" height="92" viewBox="0 0 150 92" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <path d="M 6 6 L 6 14 M 6 6 L 14 6" stroke={typeColor} strokeOpacity="0.6" />
          <path d="M 144 6 L 144 14 M 144 6 L 136 6" stroke={typeColor} strokeOpacity="0.6" />
          <path d="M 6 86 L 6 78 M 6 86 L 14 86" stroke={typeColor} strokeOpacity="0.6" />
          <path d="M 144 86 L 144 78 M 144 86 L 136 86" stroke={typeColor} strokeOpacity="0.6" />
        </svg>
      </div>

      {/* Name + stats */}
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#e8f4fa", marginBottom: 4 }}>{card.name}</div>
        <div style={{ display: "flex", gap: 10, fontSize: 10, fontFamily: "monospace" }}>
          {card.stats?.mw !== undefined && (
            <span style={{ color: "#5cc8e8" }}>MW {card.stats.mw}</span>
          )}
          {card.stats?.drop !== undefined && (
            <span style={{ color: "#e88a7a" }}>-{card.stats.drop}%</span>
          )}
          {card.duration !== undefined && (
            <span style={{ color: "#f4d68a" }}>{card.duration}R</span>
          )}
        </div>
        {/* Ability */}
        {card.abilities?.length > 0 && (
          <div style={{ marginTop: 6, padding: "4px 6px",
            background: `${typeColor}10`, borderLeft: `2px solid ${typeColor}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: typeColor, letterSpacing: "0.05em" }}>
              {card.abilities[0].name}
            </div>
            <div style={{ fontSize: 8, color: "rgba(216,230,238,0.7)", lineHeight: 1.3, marginTop: 2 }}>
              {card.abilities[0].desc.slice(0, 30)}{card.abilities[0].desc.length > 30 ? "…" : ""}
            </div>
          </div>
        )}
      </div>

      {/* Rarity bar */}
      <div style={{ position: "absolute", bottom: 6, left: 10, right: 10,
        display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 8, color: "rgba(158,200,222,0.5)", letterSpacing: "0.1em" }}>R{card.rarity}</span>
        <div style={{ display: "flex", gap: 2 }}>
          {Array.from({ length: card.rarity || 1 }, (_, i) => (
            <div key={i} style={{ width: 6, height: 2, background: isLegendary ? "#f4d68a" : typeColor }} />
          ))}
        </div>
      </div>
    </div>
  );
};

window.BpTurbineSchematic = BpTurbineSchematic;
window.BpHandCard = BpHandCard;
