// ═══════════════════════════════════════════════════════════════════
// Variant 1 · Cumulus — sky / clouds / Marvel Snap-leaning minimal
// Soft sky gradient, three zone-based battlefield, big legible cards.
// ═══════════════════════════════════════════════════════════════════

const cumStyles = {
  root: {
    width: 1440,
    height: 900,
    position: "relative",
    overflow: "hidden",
    fontFamily: '"Manrope", "Inter", system-ui, sans-serif',
    color: "#1c2a3a",
    background: "linear-gradient(180deg, #d8ecf4 0%, #e9f1ee 35%, #f4e9dc 70%, #f0d8c3 100%)",
  },
};

// Sky background — clouds + horizon line
const CumSky = () => (
  <svg width="1440" height="900" viewBox="0 0 1440 900" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true">
    <defs>
      <radialGradient id="cum-sun" cx="80%" cy="20%" r="40%">
        <stop offset="0%" stopColor="#ffe4c4" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#ffe4c4" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="1440" height="900" fill="url(#cum-sun)" opacity="0.6" />
    {/* Far clouds */}
    <g fill="#ffffff" opacity="0.55">
      <ellipse cx="180" cy="120" rx="140" ry="22" />
      <ellipse cx="220" cy="135" rx="110" ry="18" />
      <ellipse cx="1100" cy="80" rx="180" ry="26" />
      <ellipse cx="1180" cy="100" rx="120" ry="18" />
      <ellipse cx="560" cy="160" rx="160" ry="20" />
    </g>
    {/* Mid clouds */}
    <g fill="#ffffff" opacity="0.7">
      <ellipse cx="80" cy="280" rx="100" ry="14" />
      <ellipse cx="1350" cy="320" rx="120" ry="16" />
    </g>
    {/* Distant sea horizon stripe */}
    <rect x="0" y="445" width="1440" height="2" fill="#9fb6bd" opacity="0.3" />
  </svg>
);

// ─── Top bar ────────────────────────────────────────────────
const CumTopBar = () => (
  <div style={{
    position: "relative",
    height: 56,
    padding: "0 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(28,42,58,0.08)",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 32, height: 32, borderRadius: 10,
        background: "#1c2a3a", color: "#fff",
      }}>
        <WFTurbineFloat size={20} stroke="#fff" />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.02em" }}>WindFarm Battle</div>
        <div style={{ fontSize: 10, color: "#6a7888", letterSpacing: "0.18em", textTransform: "uppercase" }}>Cumulus · 雲海</div>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {["難度 · 中級", "牌庫", "新遊戲"].map((label, i) => (
        <button key={i} style={{
          background: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(28,42,58,0.1)",
          borderRadius: 999,
          padding: "6px 14px",
          fontSize: 12,
          fontWeight: 500,
          color: "#3a4858",
          backdropFilter: "blur(8px)",
        }}>{label}</button>
      ))}
    </div>
  </div>
);

// ─── Score badge ─────────────────────────────────────────────
const CumScore = ({ side, label, score, preview, active }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 14px",
    borderRadius: 14,
    background: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)",
    boxShadow: active ? "0 4px 20px rgba(28,42,58,0.12)" : "0 1px 4px rgba(28,42,58,0.05)",
    border: active ? "1px solid rgba(28,42,58,0.15)" : "1px solid rgba(28,42,58,0.06)",
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 10,
      background: side === "me" ? "#1c2a3a" : "#a85b4a",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff",
    }}>
      {side === "me" ? <WFTechWrench size={18} stroke="#fff" /> : <WFCrosshair size={18} stroke="#fff" />}
    </div>
    <div>
      <div style={{ fontSize: 10, color: "#6a7888", letterSpacing: "0.15em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{score}</span>
        <span style={{ fontSize: 9, color: "#6a7888" }}>MWh</span>
        {preview > 0 && (
          <span style={{ fontSize: 10, color: "#3a8a5e", fontWeight: 600 }}>+{preview} ↗</span>
        )}
      </div>
    </div>
  </div>
);

// ─── Wind dial ──────────────────────────────────────────────
const CumWindDial = ({ value, label, coeff }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 14,
    padding: "10px 22px 10px 14px",
    background: "rgba(255,255,255,0.85)",
    borderRadius: 18,
    boxShadow: "0 4px 20px rgba(28,42,58,0.08)",
    border: "1px solid rgba(28,42,58,0.08)",
  }}>
    <div style={{ position: "relative", width: 48, height: 48 }}>
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(28,42,58,0.1)" strokeWidth="3" />
        <circle cx="24" cy="24" r="20" fill="none"
          stroke="#3aa7c8" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${(coeff * 125)} 125`} transform="rotate(-90 24 24)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
        ×{coeff}
      </div>
    </div>
    <div>
      <div style={{ fontSize: 9, color: "#6a7888", letterSpacing: "0.18em", textTransform: "uppercase" }}>本回合風速</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
        <span style={{ fontSize: 20, fontWeight: 700 }}>{value}</span>
        <span style={{ fontSize: 11, color: "#6a7888" }}>m/s</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#3aa7c8" }}>· {label}</span>
      </div>
    </div>
  </div>
);

// ─── Turbine zone (a deployed slot on the battlefield) ───────
const CumTurbineSlot = ({ turbine, side, empty, dropping, targeted, faulted }) => {
  if (empty) {
    return (
      <div style={{
        width: 188, height: 220,
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
  return (
    <div style={{
      position: "relative",
      width: 188, height: 220,
      borderRadius: 22,
      background: "linear-gradient(180deg, #ffffff 0%, #f4f7f9 100%)",
      border: targeted ? "2.5px solid #d96c5a" : isLegendary ? "2px solid #d9a85a" : "1px solid rgba(28,42,58,0.1)",
      boxShadow: targeted
        ? "0 0 0 6px rgba(217,108,90,0.15), 0 8px 28px rgba(217,108,90,0.25)"
        : isLegendary
          ? "0 8px 28px rgba(217,168,90,0.25), 0 0 0 3px rgba(217,168,90,0.1)"
          : "0 4px 16px rgba(28,42,58,0.08)",
      padding: 12,
      display: "flex", flexDirection: "column", gap: 8,
      transform: dropping ? "rotate(-3deg) translateY(-6px) scale(1.04)" : "none",
      transition: "all 0.3s ease",
    }}>
      {/* Art area — placeholder for future card image */}
      <div style={{
        position: "relative",
        height: 110,
        borderRadius: 14,
        background: `linear-gradient(180deg, hsl(${WF_TYPE_THEME[card.type].hue}, 40%, 92%) 0%, hsl(${WF_TYPE_THEME[card.type].hue}, 30%, 85%) 100%)`,
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <WFStripedPlaceholder width={164} height={110} stripe={`hsla(${WF_TYPE_THEME[card.type].hue}, 30%, 50%, 0.15)`} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconComp size={60} stroke={WF_TYPE_THEME[card.type].accent} strokeWidth={1.2} />
        </div>
        {isLegendary && (
          <div style={{
            position: "absolute", top: 6, right: 6,
            background: "#d9a85a", color: "#fff",
            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
            padding: "2px 6px", borderRadius: 4,
          }}>傳奇</div>
        )}
      </div>
      {/* Name */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1c2a3a", display: "flex", alignItems: "center", gap: 4 }}>
        {card.name}
      </div>
      {/* Stats row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <WFPowerBolt size={12} stroke="#3aa7c8" fill="#3aa7c8" />
          <span style={{ fontWeight: 700, color: "#1c2a3a" }}>{card.stats.mw}</span>
          <span style={{ color: "#6a7888", fontSize: 9 }}>MW</span>
        </div>
        <div style={{ flex: 1, height: 4, background: "rgba(28,42,58,0.08)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.max(4, eff)}%`,
            background: eff > 70 ? "#5db58c" : eff > 40 ? "#d9a85a" : "#d96c5a",
            borderRadius: 999,
          }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: eff > 70 ? "#3a8a5e" : eff > 40 ? "#a87a2a" : "#a8453a", fontVariantNumeric: "tabular-nums" }}>{eff}%</span>
      </div>
      {/* Fault badges */}
      {(turbine.faults || []).length > 0 && (
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
                <span>-{f.stats.drop}%</span>
              </div>
            );
          })}
        </div>
      )}
      {/* Target reticle */}
      {targeted && (
        <div style={{ position: "absolute", inset: -4, borderRadius: 24, pointerEvents: "none",
          background: "radial-gradient(circle, rgba(217,108,90,0) 50%, rgba(217,108,90,0.05) 100%)" }}>
          <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)",
            background: "#d96c5a", color: "#fff",
            fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
            letterSpacing: "0.1em", whiteSpace: "nowrap",
          }}>
            <WFCrosshair size={10} stroke="#fff" style={{ verticalAlign: "middle", marginRight: 3 }} />
            目標
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Hand card (face-up) ─────────────────────────────────────
const CumHandCard = ({ cardId, lifted, dragging, style }) => {
  const card = WF_CARDS[cardId];
  if (!card) return null;
  const IconComp = wfGetIcon(card.icon);
  const theme = WF_TYPE_THEME[card.type];
  const isLegendary = card.legendary;

  return (
    <div style={{
      width: 156, height: 224,
      borderRadius: 16,
      background: "linear-gradient(180deg, #ffffff 0%, #f8f5ef 100%)",
      border: isLegendary ? "2px solid #d9a85a" : "1px solid rgba(28,42,58,0.12)",
      boxShadow: lifted
        ? "0 24px 50px rgba(28,42,58,0.25), 0 8px 18px rgba(28,42,58,0.12)"
        : dragging
          ? "0 30px 60px rgba(28,42,58,0.4), 0 0 0 2px rgba(58,167,200,0.5)"
          : "0 4px 14px rgba(28,42,58,0.1)",
      padding: 10,
      display: "flex", flexDirection: "column", gap: 6,
      position: "relative",
      transform: lifted ? "translateY(-28px) scale(1.08)" : dragging ? "rotate(-6deg) translateY(-180px) translateX(40px) scale(1.12)" : "none",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      ...style,
    }}>
      {/* Cost */}
      <div style={{
        position: "absolute", top: -6, left: -6,
        width: 30, height: 30, borderRadius: "50%",
        background: theme.accent, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 800,
        boxShadow: "0 3px 10px rgba(28,42,58,0.2)",
        border: "2px solid #fff",
      }}>{card.cost}</div>
      {/* Type tag */}
      <div style={{
        position: "absolute", top: 8, right: 8,
        fontSize: 8, fontWeight: 700, letterSpacing: "0.12em",
        color: theme.accent,
      }}>{theme.short}</div>
      {/* Art slot */}
      <div style={{
        marginTop: 14,
        height: 100,
        borderRadius: 10,
        background: `linear-gradient(180deg, hsl(${theme.hue}, 35%, 94%) 0%, hsl(${theme.hue}, 30%, 86%) 100%)`,
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <WFStripedPlaceholder width={130} height={100} stripe={`hsla(${theme.hue}, 30%, 50%, 0.15)`} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconComp size={56} stroke={theme.accent} strokeWidth={1.3} />
        </div>
      </div>
      {/* Name */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#1c2a3a", textAlign: "center" }}>{card.name}</div>
      {/* Stats line */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, fontSize: 10 }}>
        {card.stats?.mw !== undefined && (
          <span style={{ color: "#3aa7c8", fontWeight: 700 }}>⚡{card.stats.mw}MW</span>
        )}
        {card.stats?.drop !== undefined && (
          <span style={{ color: "#a8453a", fontWeight: 700 }}>-{card.stats.drop}%</span>
        )}
        {card.duration !== undefined && (
          <span style={{ color: "#a87a2a", fontWeight: 600 }}>{card.duration}回</span>
        )}
      </div>
      {/* Rarity stars */}
      <div style={{ display: "flex", justifyContent: "center", gap: 1, marginTop: "auto", fontSize: 9 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} style={{ color: i < (card.rarity || 1) ? (isLegendary ? "#d9a85a" : "#1c2a3a") : "rgba(28,42,58,0.15)" }}>★</span>
        ))}
      </div>
    </div>
  );
};

// ─── Hover preview tooltip ───────────────────────────────────
const CumHoverPreview = ({ cardId, style }) => {
  const card = WF_CARDS[cardId];
  if (!card) return null;
  const IconComp = wfGetIcon(card.icon);
  const theme = WF_TYPE_THEME[card.type];
  return (
    <div style={{
      position: "absolute",
      width: 240,
      borderRadius: 16,
      background: "#fff",
      boxShadow: "0 16px 48px rgba(28,42,58,0.2)",
      border: "1px solid rgba(28,42,58,0.08)",
      padding: 16,
      ...style,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10,
          background: `hsl(${theme.hue}, 35%, 92%)`,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconComp size={24} stroke={theme.accent} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1c2a3a" }}>{card.name}</div>
          <div style={{ fontSize: 10, color: "#6a7888", letterSpacing: "0.05em" }}>{card.iec ? `IEC ${card.iec} · ` : ""}費用 {card.cost}</div>
        </div>
      </div>
      {card.abilities?.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {card.abilities.map((ab, i) => (
            <div key={i} style={{ padding: "8px 10px", borderRadius: 8, background: "#f7f5f0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.accent }}>{ab.name}</div>
              <div style={{ fontSize: 10, color: "#3a4858", marginTop: 2, lineHeight: 1.4 }}>{ab.desc}</div>
            </div>
          ))}
        </div>
      )}
      {card.flavor && (
        <div style={{ marginTop: 10, fontSize: 10, color: "#8a98a8", fontStyle: "italic", borderTop: "1px solid rgba(28,42,58,0.06)", paddingTop: 8, lineHeight: 1.4 }}>
          {card.flavor}
        </div>
      )}
    </div>
  );
};

// ─── Technician chip (deployed) ──────────────────────────────
const CumTechChip = ({ techId }) => {
  const card = WF_CARDS[techId];
  const IconComp = wfGetIcon(card.icon);
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

// ─── Opponent hand (back-side) ───────────────────────────────
const CumOpponentHand = ({ count }) => (
  <div style={{ display: "flex", gap: -8, marginLeft: -16 }}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} style={{
        width: 42, height: 60,
        borderRadius: 6,
        background: "linear-gradient(135deg, #a85b4a 0%, #8a4538 100%)",
        border: "1.5px solid rgba(255,255,255,0.5)",
        boxShadow: "0 2px 8px rgba(28,42,58,0.15)",
        marginLeft: i === 0 ? 0 : -28,
        transform: `rotate(${(i - count / 2) * 4}deg)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0.5)" }} />
      </div>
    ))}
  </div>
);

// ─── Side label strip ────────────────────────────────────────
const CumSideLabel = ({ side, hand, deck, total, active, faulted }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 16,
    padding: "8px 18px",
    background: "rgba(255,255,255,0.55)",
    borderRadius: 14,
    border: "1px solid rgba(28,42,58,0.06)",
    backdropFilter: "blur(8px)",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
      <span style={{ fontSize: 16, fontWeight: 700 }}>{total}</span>
      <span style={{ fontSize: 9, color: "#6a7888" }}>裝機 MW</span>
    </div>
    {faulted && (
      <>
        <div style={{ height: 24, width: 1, background: "rgba(28,42,58,0.1)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#a8453a", fontWeight: 600 }}>
          <WFFaultLightning size={12} stroke="#a8453a" />
          故障中
        </div>
      </>
    )}
    {active && (
      <>
        <div style={{ height: 24, width: 1, background: "rgba(28,42,58,0.1)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#3aa7c8", fontWeight: 700 }}>
          <WFCompass size={12} stroke="#3aa7c8" />
          {side === "me" ? "你的回合" : "計算中..."}
        </div>
      </>
    )}
  </div>
);

// ════════════════════════════════════════════════════════════
// Full screen
// ════════════════════════════════════════════════════════════
const Cumulus = () => {
  // demo state
  const oppTurbines = [
    { cardId: "M03", avail: 92, faults: [] },
    { cardId: "M05", avail: 91, faults: ["F03"] },
    null,
  ];
  const myTurbines = [
    { cardId: "M07", avail: 88, faults: [] }, // legendary
    { cardId: "M01", avail: 95, faults: [] },
    null,
  ];
  const myTechs = ["T01", "T05", "T07"];
  const myHand = ["F04", "T02", "FN06", "M03", "W04", "F01"];

  return (
    <div style={cumStyles.root}>
      <CumSky />
      {/* Wave foam at bottom */}
      <svg width="1440" height="120" viewBox="0 0 1440 120" preserveAspectRatio="none"
        style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.4, pointerEvents: "none" }} aria-hidden="true">
        <path d="M0 80 Q 120 40 240 80 T 480 80 T 720 80 T 960 80 T 1200 80 T 1440 80 L 1440 120 L 0 120 Z" fill="#c5a888" />
        <path d="M0 100 Q 100 70 200 100 T 400 100 T 600 100 T 800 100 T 1000 100 T 1200 100 T 1440 100 L 1440 120 L 0 120 Z" fill="#b39476" />
      </svg>

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
        <CumTopBar />

        {/* OPPONENT AREA */}
        <div style={{ padding: "16px 28px 12px", display: "flex", alignItems: "flex-start", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
            <CumSideLabel side="opp" hand={4} deck={18} total={10} faulted />
            <CumOpponentHand count={4} />
          </div>
          <div style={{ flex: 1, display: "flex", gap: 14, justifyContent: "center" }}>
            {oppTurbines.map((t, i) => (
              <CumTurbineSlot key={i} turbine={t} side="opp" empty={!t} targeted={i === 0} faulted={t?.faults?.length > 0} />
            ))}
          </div>
          <CumScore side="opp" label="AI" score={42} preview={0} />
        </div>

        {/* CENTER BAR — wind + round + actions */}
        <div style={{
          padding: "12px 28px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 20,
          background: "rgba(255,255,255,0.4)",
          borderTop: "1px solid rgba(28,42,58,0.06)",
          borderBottom: "1px solid rgba(28,42,58,0.06)",
          backdropFilter: "blur(10px)",
        }}>
          {/* Round */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#6a7888", letterSpacing: "0.2em", textTransform: "uppercase" }}>回合</div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
              7<span style={{ fontSize: 12, color: "#6a7888", fontWeight: 400 }}>/12</span>
            </div>
          </div>
          <div style={{ height: 36, width: 1, background: "rgba(28,42,58,0.1)" }} />
          <CumWindDial value={10} label="額定風速" coeff={1.0} />
          <div style={{ height: 36, width: 1, background: "rgba(28,42,58,0.1)" }} />
          {/* Action pips */}
          <div>
            <div style={{ fontSize: 9, color: "#6a7888", letterSpacing: "0.2em", textTransform: "uppercase" }}>動作</div>
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              {[true, true, false, false].map((on, i) => (
                <div key={i} style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: on ? "#d9a85a" : "rgba(28,42,58,0.1)",
                  boxShadow: on ? "0 0 0 3px rgba(217,168,90,0.2)" : "none",
                }} />
              ))}
            </div>
          </div>
          <div style={{ height: 36, width: 1, background: "rgba(28,42,58,0.1)" }} />
          {/* Active weather effects */}
          <div style={{ display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px", background: "rgba(217,168,90,0.15)",
            border: "1px solid rgba(217,168,90,0.3)", borderRadius: 10 }}>
            <WFStorm size={18} stroke="#a87a2a" />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#a87a2a" }}>颱風警報</div>
              <div style={{ fontSize: 9, color: "#a87a2a", opacity: 0.7 }}>故障 ×2 · 還剩 1 回</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px", background: "rgba(157,127,200,0.12)",
            border: "1px solid rgba(157,127,200,0.3)", borderRadius: 10 }}>
            <WFContract size={18} stroke="#7a5ca8" />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#7a5ca8" }}>穩定供電</div>
              <div style={{ fontSize: 9, color: "#7a5ca8", opacity: 0.7 }}>進度 2/3 · +15</div>
            </div>
          </div>
        </div>

        {/* MY AREA */}
        <div style={{ padding: "14px 28px 0", display: "flex", alignItems: "flex-start", gap: 18 }}>
          <CumScore side="me" label="你" score={48} preview={12} active />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 14 }}>
              {myTurbines.map((t, i) => (
                <CumTurbineSlot key={i} turbine={t} side="me" empty={!t} dropping={i === 2 ? false : false} />
              ))}
            </div>
            {/* Tech row */}
            <div style={{ display: "flex", gap: 8 }}>
              {myTechs.map((id) => <CumTechChip key={id} techId={id} />)}
            </div>
          </div>
          <CumSideLabel side="me" hand={6} deck={14} total={14} active />
        </div>

        {/* BOTTOM — hand + actions */}
        <div style={{
          marginTop: "auto",
          padding: "0 28px 18px",
          position: "relative",
          display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20,
        }}>
          {/* Hint banner */}
          <div style={{
            position: "absolute", top: -42, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 14px",
            background: "rgba(217,108,90,0.95)", color: "#fff",
            borderRadius: 999, fontSize: 11, fontWeight: 600,
            boxShadow: "0 6px 20px rgba(217,108,90,0.3)",
          }}>
            <WFCrosshair size={14} stroke="#fff" />
            點選 AI 機組施加「葉片損傷」· 點此取消
          </div>
          {/* Hand */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", position: "relative" }}>
            {myHand.map((cardId, i) => (
              <CumHandCard
                key={i}
                cardId={cardId}
                lifted={i === 1}
                dragging={i === 0}
                style={{ transform: i === 1 ? "translateY(-28px) scale(1.08)" : i === 0 ? "rotate(-6deg) translateY(-180px) translateX(80px) scale(1.12)" : `translateY(${Math.abs(i - 2.5) * 3}px) rotate(${(i - 2.5) * 1.5}deg)` }}
              />
            ))}
          </div>
          {/* End turn */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <button style={{
              padding: "14px 28px",
              background: "linear-gradient(180deg, #d9a85a 0%, #b8893f 100%)",
              color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "0.05em",
              border: "none", borderRadius: 14,
              boxShadow: "0 6px 20px rgba(184,137,63,0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <WFHourglass size={16} stroke="#fff" />
              結束回合
            </button>
            <div style={{ fontSize: 10, color: "#6a7888" }}>剩餘 2 動作 · 抽 1 棄 1</div>
          </div>
        </div>

        {/* Hover preview for the lifted card */}
        <CumHoverPreview cardId={myHand[1]} style={{ bottom: 240, left: 180 }} />

        {/* Dragging card overlay — already in hand layout */}
      </div>
    </div>
  );
};

window.Cumulus = Cumulus;
