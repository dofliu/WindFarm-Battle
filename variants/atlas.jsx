// Atlas variant — full screen assembly

const AtlasCompassRose = ({ value, label, coeff }) => (
  <div style={{ position: "relative", width: 200, height: 200,
    display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="200" height="200" viewBox="0 0 200 200" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="atlas-rose-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f4e8d0" />
          <stop offset="100%" stopColor="#d8b878" />
        </radialGradient>
      </defs>
      {/* Outer ring with degrees */}
      <circle cx="100" cy="100" r="92" fill="url(#atlas-rose-bg)" stroke="#4a3018" strokeWidth="2" />
      <circle cx="100" cy="100" r="86" fill="none" stroke="#4a3018" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="78" fill="none" stroke="#7a5a3a" strokeWidth="0.5" strokeDasharray="2 2" />

      {/* Degree ticks */}
      {Array.from({ length: 36 }, (_, i) => {
        const angle = (i * 10) * Math.PI / 180;
        const long = i % 9 === 0;
        const r1 = long ? 78 : 84;
        const r2 = 86;
        return <line key={i}
          x1={100 + Math.sin(angle) * r1} y1={100 - Math.cos(angle) * r1}
          x2={100 + Math.sin(angle) * r2} y2={100 - Math.cos(angle) * r2}
          stroke="#4a3018" strokeWidth={long ? 1.2 : 0.6} />;
      })}

      {/* Cardinal letters */}
      {[["N", 0, -68], ["E", 68, 0], ["S", 0, 68], ["W", -68, 0]].map(([l, x, y]) => (
        <text key={l} x={100 + x} y={104 + y} fontSize="15" fontFamily="Georgia, serif" fontWeight="700"
          fill="#3a2f24" textAnchor="middle">{l}</text>
      ))}

      {/* 8-point star */}
      <g>
        <path d="M 100 30 L 108 100 L 100 170 L 92 100 Z" fill="#4a3018" />
        <path d="M 30 100 L 100 92 L 170 100 L 100 108 Z" fill="#7a5a3a" />
        <path d="M 50 50 L 100 96 L 96 100 Z" fill="#a87a4a" />
        <path d="M 150 50 L 104 96 L 100 100 Z" fill="#a87a4a" />
        <path d="M 50 150 L 100 104 L 96 100 Z" fill="#a87a4a" />
        <path d="M 150 150 L 104 104 L 100 100 Z" fill="#a87a4a" />
        <circle cx="100" cy="100" r="6" fill="#a8453a" stroke="#3a2f24" strokeWidth="1" />
      </g>

      {/* Wind arrow indicator (rotates) */}
      <g transform="rotate(45 100 100)">
        <path d="M 100 18 L 96 28 L 104 28 Z" fill="#a8453a" />
        <line x1="100" y1="28" x2="100" y2="50" stroke="#a8453a" strokeWidth="1.5" />
      </g>
    </svg>
    {/* Wind label below */}
    <div style={{ position: "absolute", bottom: -28, left: "50%",
      whiteSpace: "nowrap", textAlign: "center",
      background: "rgba(244,232,208,0.95)",
      border: "1.5px solid #4a3018", borderRadius: 2,
      padding: "3px 14px",
      fontSize: 16, color: "#3a2f24", fontFamily: '"Caveat", cursive', fontWeight: 700,
      transform: "translateX(-50%) rotate(-1deg)",
      boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
    }}>{value} m/s · {label} · ×{coeff}</div>
  </div>
);

const AtlasOpponentHand = ({ count }) => (
  <div style={{ display: "flex", gap: -16 }}>
    {Array.from({ length: count }, (_, i) => (
      <svg key={i} width="46" height="64" viewBox="0 0 46 64" style={{
        marginLeft: i === 0 ? 0 : -22,
        transform: `rotate(${(i - count / 2 + 0.5) * 4}deg)`,
        filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))",
      }}>
        <rect x="2" y="2" width="42" height="60" rx="2" fill="#f4e8d0" stroke="#4a3018" strokeWidth="1" />
        <rect x="6" y="6" width="34" height="52" fill="none" stroke="#a8453a" strokeWidth="0.6" strokeDasharray="3 2" />
        <text x="23" y="38" fontSize="18" fill="#4a3018" textAnchor="middle"
          fontFamily="Georgia, serif" fontStyle="italic">?</text>
      </svg>
    ))}
  </div>
);

const AtlasScore = ({ side, label, score, preview, active }) => (
  <div style={{
    position: "relative",
    padding: "12px 18px",
    background: "rgba(244,232,208,0.92)",
    border: "1.5px solid #4a3018",
    borderRadius: 2,
    minWidth: 140,
    transform: `rotate(${side === "me" ? -1 : 1}deg)`,
    boxShadow: active ? "0 4px 12px rgba(0,0,0,0.25), 0 0 0 3px rgba(168,69,58,0.2)" : "0 3px 8px rgba(0,0,0,0.2)",
  }}>
    {/* Corner tape */}
    <div style={{ position: "absolute", top: -6, left: 8,
      width: 26, height: 12, background: "rgba(216,184,120,0.7)",
      border: "0.5px solid rgba(122,90,58,0.3)", transform: "rotate(-12deg)" }} />
    <div style={{ fontSize: 13, color: "#7a5a3a", fontFamily: "Georgia, serif", fontStyle: "italic",
      letterSpacing: "0.05em" }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
      <span style={{ fontSize: 38, fontWeight: 700, color: "#3a2f24", lineHeight: 1,
        fontFamily: '"Caveat", cursive' }}>{score}</span>
      <span style={{ fontSize: 12, color: "#7a5a3a", fontFamily: '"Caveat", cursive' }}>MWh</span>
      {preview > 0 && (
        <span style={{ fontSize: 16, color: "#3a6a3a", fontWeight: 700,
          fontFamily: '"Caveat", cursive' }}>+{preview}</span>
      )}
    </div>
  </div>
);

const AtlasTechSticker = ({ techId }) => {
  const card = WF_CARDS[techId];
  const IconComp = wfGetIcon(card.icon);
  return (
    <div style={{
      position: "relative",
      width: 84,
      padding: "8px 6px 6px",
      background: card.legendary ? "#f4e8d0" : "rgba(244,232,208,0.95)",
      border: "1.5px solid #4a3018",
      borderRadius: 2,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      transform: `rotate(${(parseInt(techId.slice(1), 10) % 3 - 1) * 2}deg)`,
      boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
    }}>
      <div style={{ position: "absolute", top: -5, left: "50%", transform: "translateX(-50%) rotate(-8deg)",
        width: 24, height: 10, background: "rgba(168,69,58,0.5)" }} />
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: card.legendary ? "#c89848" : "#a87a4a",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "2px solid #3a2f24",
      }}>
        <IconComp size={20} stroke="#f4e8d0" />
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#3a2f24",
        fontFamily: '"Caveat", cursive', whiteSpace: "nowrap", lineHeight: 1 }}>{card.name}</div>
    </div>
  );
};

const Atlas = () => {
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
  const myHand = ["F04", "T02", "FN06", "M03", "W04"];

  return (
    <div style={atlasStyles.root}>
      <AtlasChart />

      {/* Paper edge shadow */}
      <div style={{ position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.18) 100%)",
        pointerEvents: "none" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
        <AtlasTopBar />

        {/* OPPONENT */}
        <div style={{ padding: "18px 36px 6px", display: "flex", alignItems: "flex-start", gap: 20 }}>
          <AtlasScore side="opp" label="AI 對手 · 北方海域" score={42} preview={0} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <AtlasOpponentHand count={4} />
            <div style={{ fontSize: 14, color: "#4a3018", fontFamily: '"Caveat", cursive', fontStyle: "italic" }}>
              對手暗牌 · 4 張
            </div>
          </div>
          <div style={{ width: 140, textAlign: "right" }}>
            <div style={{ fontSize: 14, color: "#4a3018", fontFamily: '"Caveat", cursive' }}>
              裝機 <span style={{ fontWeight: 700, fontSize: 18 }}>10</span> MW
            </div>
            <div style={{ fontSize: 12, color: "#a8453a", fontFamily: '"Caveat", cursive', fontStyle: "italic" }}>
              ⚡ 故障中
            </div>
          </div>
        </div>

        {/* OPPONENT turbines on chart */}
        <div style={{ padding: "0 100px", display: "flex", justifyContent: "space-around" }}>
          {oppTurbines.map((t, i) => (
            <AtlasTurbinePin key={i} turbine={t} empty={!t} targeted={i === 0} />
          ))}
        </div>

        {/* CENTER */}
        <div style={{
          margin: "20px auto",
          display: "flex", alignItems: "center", gap: 32,
          padding: "8px 24px",
        }}>
          {/* Round counter — paper note */}
          <div style={{
            background: "rgba(244,232,208,0.92)",
            border: "1.5px solid #4a3018",
            padding: "8px 16px",
            transform: "rotate(-3deg)",
            boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
            textAlign: "center",
            position: "relative",
          }}>
            <div style={{ position: "absolute", top: -6, left: 8,
              width: 24, height: 10, background: "rgba(216,184,120,0.6)" }} />
            <div style={{ fontSize: 12, color: "#7a5a3a", fontFamily: 'Georgia, serif', fontStyle: "italic" }}>第</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#3a2f24", lineHeight: 1,
              fontFamily: '"Caveat", cursive' }}>七<span style={{ fontSize: 16, color: "#7a5a3a" }}>/十二</span></div>
            <div style={{ fontSize: 12, color: "#7a5a3a", fontFamily: 'Georgia, serif', fontStyle: "italic" }}>航次</div>
          </div>

          <AtlasCompassRose value={10} label="額定" coeff={1.0} />

          {/* Actions — abacus beads */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#7a5a3a", fontFamily: 'Georgia, serif', fontStyle: "italic" }}>
              本回動作
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "center" }}>
              {[true, true, false, false].map((on, i) => (
                <div key={i} style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: on ? "#a8453a" : "transparent",
                  border: "2px solid #4a3018",
                  boxShadow: on ? "0 2px 4px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)" : "none",
                }} />
              ))}
            </div>
            <div style={{ fontSize: 14, color: "#3a2f24", fontFamily: '"Caveat", cursive', marginTop: 4 }}>2 / 4</div>
          </div>

          {/* Status notes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{
              background: "rgba(252,228,200,0.92)",
              border: "1.5px solid #a8453a",
              padding: "5px 12px",
              transform: "rotate(2deg)",
              boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <WFStorm size={20} stroke="#a8453a" />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#a8453a",
                  fontFamily: '"Caveat", cursive', lineHeight: 1 }}>颱風警報！</div>
                <div style={{ fontSize: 11, color: "#7a3a2a", fontFamily: 'Georgia, serif', fontStyle: "italic" }}>故障 ×2 · 還剩 1 回</div>
              </div>
            </div>
            <div style={{
              background: "rgba(244,232,208,0.92)",
              border: "1.5px solid #5d7a3a",
              padding: "5px 12px",
              transform: "rotate(-1deg)",
              boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <WFContract size={20} stroke="#5d7a3a" />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#3a5a1a",
                  fontFamily: '"Caveat", cursive', lineHeight: 1 }}>穩定供電合約</div>
                <div style={{ fontSize: 11, color: "#5d7a3a", fontFamily: 'Georgia, serif', fontStyle: "italic" }}>進度 2/3 · +15</div>
              </div>
            </div>
          </div>
        </div>

        {/* MY turbines on chart */}
        <div style={{ padding: "0 100px", display: "flex", justifyContent: "space-around" }}>
          {myTurbines.map((t, i) => (
            <AtlasTurbinePin key={i} turbine={t} empty={!t} />
          ))}
        </div>

        {/* MY techs row — sticker style */}
        <div style={{ padding: "12px 36px", display: "flex", justifyContent: "center", gap: 12 }}>
          {myTechs.map(id => <AtlasTechSticker key={id} techId={id} />)}
        </div>

        {/* MY hand + buttons */}
        <div style={{
          marginTop: "auto",
          padding: "8px 36px 18px",
          display: "flex", alignItems: "flex-end", gap: 20,
          position: "relative",
        }}>
          {/* Hint — torn paper note */}
          <div style={{
            position: "absolute", top: -30, left: "50%", transform: "translateX(-50%) rotate(-1.5deg)",
            background: "#fef3c7",
            border: "1.5px solid #a8453a",
            padding: "6px 16px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
            fontSize: 18, fontFamily: '"Caveat", cursive', fontWeight: 700,
            color: "#a8453a", letterSpacing: "0.03em",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <WFCrosshair size={16} stroke="#a8453a" />
            點選對手機組，施加葉片損傷
          </div>

          <AtlasScore side="me" label="你 · 南方海域" score={48} preview={12} active />

          {/* Hand */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 4, alignItems: "flex-end",
            position: "relative" }}>
            {myHand.map((cardId, i) => (
              <AtlasNotebookCard
                key={i}
                cardId={cardId}
                lifted={i === 1}
                dragging={i === 0}
                style={{
                  marginLeft: i === 0 ? 0 : -22,
                  zIndex: i === 0 ? 30 : i === 1 ? 20 : 10 - Math.abs(i - 2),
                }}
              />
            ))}
          </div>

          {/* End turn — wooden stamp button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <button style={{
              padding: "14px 22px",
              background: "linear-gradient(180deg, #a8453a 0%, #6a2818 100%)",
              border: "3px double #f4e8d0",
              borderRadius: 4,
              boxShadow: "0 6px 14px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              color: "#f4e8d0",
              fontSize: 22, fontWeight: 700,
              fontFamily: '"Caveat", cursive',
              cursor: "pointer",
              transform: "rotate(-1.5deg)",
              display: "flex", alignItems: "center", gap: 8,
              letterSpacing: "0.05em",
            }}>
              <WFHourglass size={18} stroke="#f4e8d0" />
              結束航次
            </button>
            <div style={{ fontSize: 13, color: "#4a3018", fontFamily: '"Caveat", cursive',
              fontStyle: "italic", marginTop: 4 }}>剩 2 動作 · 抽 1 棄 1</div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Atlas = Atlas;
