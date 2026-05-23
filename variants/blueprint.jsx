// Blueprint variant — full screen assembly

const BpOpponentHand = ({ count }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} style={{
        width: 28, height: 42,
        background: "linear-gradient(180deg, rgba(8,22,32,0.95) 0%, rgba(0,30,50,0.95) 100%)",
        border: "1px solid rgba(232,138,122,0.4)",
        position: "relative",
      }}>
        <div style={{ position: "absolute", inset: 4, border: "1px solid rgba(232,138,122,0.25)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: "rgba(232,138,122,0.5)" }}>✕</div>
      </div>
    ))}
  </div>
);

const BpTechBadge = ({ techId }) => {
  const card = WF_CARDS[techId];
  const IconComp = wfGetIcon(card.icon);
  const isLegendary = card.legendary;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 12px",
      border: `1px solid ${isLegendary ? "#f4d68a" : "#88e8a8"}`,
      background: isLegendary ? "rgba(244,214,138,0.08)" : "rgba(136,232,168,0.08)",
      position: "relative",
    }}>
      <IconComp size={18} stroke={isLegendary ? "#f4d68a" : "#88e8a8"} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#e8f4fa", letterSpacing: "0.03em" }}>{card.name}</div>
        <div style={{ fontSize: 8, color: "rgba(158,200,222,0.6)", letterSpacing: "0.15em" }}>{card.id}</div>
      </div>
    </div>
  );
};

const Blueprint = () => {
  const oppTurbines = [
    { cardId: "M03", avail: 92, faults: [] },
    { cardId: "M05", avail: 91, faults: ["F03"] },
    null,
  ];
  const myTurbines = [
    { cardId: "M07", avail: 88, faults: [] },
    { cardId: "M01", avail: 95, faults: [] },
    null,
  ];
  const myTechs = ["T01", "T05", "T07"];
  const myHand = ["F04", "T02", "FN06", "M03", "W04", "F01"];

  return (
    <div style={bpStyles.root}>
      <BpGrid />

      {/* Edge framing */}
      <div style={{ position: "absolute", inset: 12, border: "1px solid rgba(100,180,220,0.15)", pointerEvents: "none" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
        <BpTopBar />

        {/* OPPONENT row */}
        <div style={{ padding: "18px 32px 12px", display: "flex", alignItems: "flex-start", gap: 24 }}>
          <BpScore side="opp" label="ADVERSARY · AI" score={42} preview={0} />
          <div style={{ flex: 1, display: "flex", gap: 16, justifyContent: "center" }}>
            {oppTurbines.map((t, i) => (
              <BpTurbineSchematic key={i} turbine={t} empty={!t} targeted={i === 0} />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <BpOpponentHand count={4} />
            <div style={{ fontSize: 8, color: "rgba(232,138,122,0.7)", letterSpacing: "0.2em" }}>HAND · 4 · DECK · 18</div>
          </div>
        </div>

        {/* CENTER bar */}
        <div style={{
          margin: "12px 32px",
          padding: "14px 24px",
          border: "1px solid rgba(100,180,220,0.3)",
          background: "rgba(0,15,25,0.85)",
          display: "flex", alignItems: "center", gap: 24,
          position: "relative",
        }}>
          {/* Tick marks on sides */}
          <div style={{ position: "absolute", top: -1, left: 30, width: 12, height: 6,
            borderLeft: "1px solid #5cc8e8", borderTop: "1px solid #5cc8e8" }} />
          <div style={{ position: "absolute", top: -1, right: 30, width: 12, height: 6,
            borderRight: "1px solid #5cc8e8", borderTop: "1px solid #5cc8e8" }} />

          {/* Round */}
          <div style={{ borderRight: "1px solid rgba(100,180,220,0.2)", paddingRight: 24 }}>
            <div style={{ fontSize: 9, color: "#5cc8e8", letterSpacing: "0.25em", marginBottom: 4 }}>ROUND</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#e8f4fa", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              07<span style={{ fontSize: 13, color: "rgba(158,200,222,0.5)" }}> / 12</span>
            </div>
            {/* Progress segments */}
            <div style={{ display: "flex", gap: 2, marginTop: 6 }}>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} style={{ width: 8, height: 3,
                  background: i < 7 ? "#5cc8e8" : "rgba(100,180,220,0.2)",
                  boxShadow: i === 6 ? "0 0 4px #5cc8e8" : "none" }} />
              ))}
            </div>
          </div>

          <BpWindGauge value={10} label="RATED · 額定" coeff={1.0} />

          {/* Actions */}
          <div style={{ borderLeft: "1px solid rgba(100,180,220,0.2)", paddingLeft: 24 }}>
            <div style={{ fontSize: 9, color: "#5cc8e8", letterSpacing: "0.25em", marginBottom: 6 }}>ACTIONS</div>
            <div style={{ display: "flex", gap: 4 }}>
              {[true, true, false, false].map((on, i) => (
                <div key={i} style={{ width: 14, height: 14,
                  background: on ? "#5cc8e8" : "transparent",
                  border: `1.5px solid ${on ? "#5cc8e8" : "rgba(100,180,220,0.4)"}`,
                  boxShadow: on ? "0 0 6px rgba(92,200,232,0.6)" : "none",
                  transform: "rotate(45deg)" }} />
              ))}
            </div>
            <div style={{ marginTop: 6, fontSize: 9, color: "rgba(158,200,222,0.6)", letterSpacing: "0.15em",
              fontFamily: "monospace" }}>02 / 04 REMAINING</div>
          </div>

          {/* Status effects */}
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px",
              border: "1px solid #e88a7a",
              background: "rgba(232,138,122,0.08)",
            }}>
              <WFStorm size={20} stroke="#e88a7a" />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#e88a7a", letterSpacing: "0.1em" }}>TYPHOON</div>
                <div style={{ fontSize: 9, color: "rgba(232,138,122,0.7)", fontFamily: "monospace" }}>FAULT ×2 · 1R</div>
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px",
              border: "1px solid #bda8e8",
              background: "rgba(189,168,232,0.08)",
            }}>
              <WFContract size={20} stroke="#bda8e8" />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#bda8e8", letterSpacing: "0.1em" }}>STABLE-SUPPLY</div>
                <div style={{ fontSize: 9, color: "rgba(189,168,232,0.7)", fontFamily: "monospace" }}>2 / 3 · +15</div>
              </div>
            </div>
          </div>
        </div>

        {/* MY row */}
        <div style={{ padding: "0 32px 12px", display: "flex", alignItems: "flex-start", gap: 24 }}>
          <BpScore side="me" label="OPERATOR · YOU" score={48} preview={12} active />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 16 }}>
              {myTurbines.map((t, i) => (
                <BpTurbineSchematic key={i} turbine={t} empty={!t} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {myTechs.map(id => <BpTechBadge key={id} techId={id} />)}
            </div>
          </div>
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6,
            border: "1px solid rgba(100,180,220,0.25)",
            background: "rgba(0,20,35,0.6)",
            padding: "10px 14px",
          }}>
            <div style={{ fontSize: 9, color: "#5cc8e8", letterSpacing: "0.2em" }}>YOUR HAND</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#e8f4fa", fontVariantNumeric: "tabular-nums" }}>6</div>
            <div style={{ fontSize: 9, color: "rgba(158,200,222,0.6)", letterSpacing: "0.15em" }}>DECK · 14</div>
          </div>
        </div>

        {/* HAND bay */}
        <div style={{
          marginTop: "auto",
          padding: "12px 32px 16px",
          background: "rgba(0,15,25,0.7)",
          borderTop: "1px solid rgba(100,180,220,0.2)",
          position: "relative",
          display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20,
        }}>
          {/* Hint banner */}
          <div style={{
            position: "absolute", top: -32, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 10,
            padding: "7px 16px",
            background: "rgba(232,138,122,0.95)",
            color: "#0a0a14",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.15em",
            boxShadow: "0 4px 16px rgba(232,138,122,0.3)",
          }}>
            <WFCrosshair size={14} stroke="#0a0a14" />
            TARGET · CLICK AI TURBINE TO APPLY F04 BLADE DAMAGE
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", position: "relative" }}>
            {myHand.map((cardId, i) => (
              <BpHandCard
                key={i}
                cardId={cardId}
                lifted={i === 1}
                dragging={i === 0}
                style={{
                  transform: i === 1
                    ? "translateY(-32px) scale(1.06)"
                    : i === 0
                      ? "translateY(-220px) translateX(80px) rotate(-6deg) scale(1.12)"
                      : "none",
                  zIndex: i === 0 ? 50 : i === 1 ? 30 : 10,
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <button style={{
              padding: "14px 28px",
              background: "linear-gradient(180deg, #5cc8e8 0%, #2a98c0 100%)",
              border: "none",
              color: "#0a1a24",
              fontSize: 13, fontWeight: 800, letterSpacing: "0.2em",
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 0 20px rgba(92,200,232,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <WFHourglass size={14} stroke="#0a1a24" />
              END · TURN
            </button>
            <div style={{ fontSize: 9, color: "rgba(158,200,222,0.6)",
              letterSpacing: "0.2em", fontFamily: "monospace" }}>2 ACT · 1 DRAW · 1 DISCARD</div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Blueprint = Blueprint;
