// ═══════════════════════════════════════════════════════════════════
// Variant 2 · Tideboard — warm coastal / Hearthstone-leaning
// Weathered teak battlefield, brass fittings, parchment cards,
// embossed circular turbine tokens, brass compass for wind.
// ═══════════════════════════════════════════════════════════════════

const tideStyles = {
  root: {
    width: 1440,
    height: 900,
    position: "relative",
    overflow: "hidden",
    fontFamily: '"Cormorant Garamond", "Source Serif Pro", Georgia, serif',
    color: "#3d2a1e",
    background: "radial-gradient(ellipse at center, #d8c5a8 0%, #b5997a 50%, #6b5240 100%)",
  },
};

// ─── Wood-grain board background ─────────────────────────────
const TideBoardBg = () => (
  <svg width="1440" height="900" viewBox="0 0 1440 900" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
    <defs>
      <linearGradient id="tide-wood" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#8a6a4a" />
        <stop offset="50%" stopColor="#a07d5a" />
        <stop offset="100%" stopColor="#6b5240" />
      </linearGradient>
      <pattern id="tide-grain" patternUnits="userSpaceOnUse" width="200" height="6">
        <rect width="200" height="6" fill="transparent" />
        <path d="M0 3 Q 50 1 100 3 T 200 3" stroke="rgba(60,40,25,0.18)" fill="none" />
        <path d="M0 4.5 Q 70 2.5 140 4.5 T 280 4.5" stroke="rgba(60,40,25,0.1)" fill="none" />
      </pattern>
      <radialGradient id="tide-vignette" cx="50%" cy="50%" r="70%">
        <stop offset="40%" stopColor="rgba(0,0,0,0)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
      </radialGradient>
    </defs>
    <rect width="1440" height="900" fill="url(#tide-wood)" />
    <rect width="1440" height="900" fill="url(#tide-grain)" />
    {/* Plank seams */}
    {[0, 1, 2, 3, 4].map(i => (
      <line key={i} x1="0" y1={i * 180} x2="1440" y2={i * 180} stroke="rgba(40,25,15,0.4)" strokeWidth="2" />
    ))}
    {/* Vignette */}
    <rect width="1440" height="900" fill="url(#tide-vignette)" />
  </svg>
);

// ─── Brass frame piece (decorative corner) ───────────────────
const BrassCorner = ({ style }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" style={style} aria-hidden="true">
    <defs>
      <linearGradient id="brass" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e8c878" />
        <stop offset="50%" stopColor="#c89848" />
        <stop offset="100%" stopColor="#8a6028" />
      </linearGradient>
    </defs>
    <path d="M2 2 L18 2 L18 6 L6 6 L6 18 L2 18 Z" fill="url(#brass)" />
    <circle cx="8" cy="8" r="1.5" fill="#3d2a1e" />
  </svg>
);

// ─── Brass compass (wind dial) ───────────────────────────────
const TideCompass = ({ value, label, coeff }) => (
  <div style={{
    position: "relative", width: 140, height: 140,
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <svg width="140" height="140" viewBox="0 0 140 140" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="brass-rad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#f4d68a" />
          <stop offset="50%" stopColor="#c89848" />
          <stop offset="100%" stopColor="#6e4a18" />
        </radialGradient>
      </defs>
      {/* Outer brass ring */}
      <circle cx="70" cy="70" r="65" fill="url(#brass-rad)" />
      <circle cx="70" cy="70" r="65" fill="none" stroke="#3d2a1e" strokeWidth="1.5" />
      <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
      {/* Tick marks */}
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i * 22.5) * Math.PI / 180;
        const x1 = 70 + Math.sin(angle) * 56;
        const y1 = 70 - Math.cos(angle) * 56;
        const x2 = 70 + Math.sin(angle) * (i % 4 === 0 ? 48 : 52);
        const y2 = 70 - Math.cos(angle) * (i % 4 === 0 ? 48 : 52);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3d2a1e" strokeWidth={i % 4 === 0 ? 1.5 : 0.8} />;
      })}
      {/* Cardinal letters */}
      <text x="70" y="22" fontSize="10" fill="#3d2a1e" fontWeight="700" textAnchor="middle">N</text>
      <text x="120" y="74" fontSize="10" fill="#3d2a1e" fontWeight="700" textAnchor="middle">E</text>
      <text x="70" y="126" fontSize="10" fill="#3d2a1e" fontWeight="700" textAnchor="middle">S</text>
      <text x="20" y="74" fontSize="10" fill="#3d2a1e" fontWeight="700" textAnchor="middle">W</text>
      {/* Inner dial */}
      <circle cx="70" cy="70" r="38" fill="#2a1810" />
      <circle cx="70" cy="70" r="38" fill="none" stroke="#c89848" strokeWidth="1" />
      {/* Coeff arc */}
      <circle cx="70" cy="70" r="34" fill="none"
        stroke="#e8c878" strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={`${coeff * 213} 213`} transform="rotate(-90 70 70)" opacity="0.9" />
      {/* Needle */}
      <path d="M70 30 L74 70 L70 75 L66 70 Z" fill="#e8c878" stroke="#3d2a1e" strokeWidth="0.5" />
      <path d="M70 110 L66 70 L70 75 L74 70 Z" fill="#a85b4a" stroke="#3d2a1e" strokeWidth="0.5" opacity="0.7" />
      <circle cx="70" cy="70" r="3.5" fill="#3d2a1e" stroke="#c89848" strokeWidth="0.8" />
    </svg>
    {/* Center value */}
    <div style={{
      position: "relative",
      zIndex: 1,
      textAlign: "center",
      color: "#f4d68a",
      marginTop: 18,
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{value}<span style={{ fontSize: 11, opacity: 0.8 }}>m/s</span></div>
      <div style={{ fontSize: 10, opacity: 0.85, letterSpacing: "0.1em", marginTop: 2 }}>×{coeff}</div>
    </div>
  </div>
);

// ─── Turbine token (Hearthstone-style minion) ────────────────
const TideTurbineToken = ({ turbine, empty, targeted, attacking, faulted }) => {
  if (empty) {
    return (
      <div style={{
        width: 120, height: 150,
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: 0.4,
      }}>
        <svg width="120" height="150" viewBox="0 0 120 150">
          <ellipse cx="60" cy="135" rx="42" ry="6" fill="rgba(0,0,0,0.3)" />
          <circle cx="60" cy="80" r="50" fill="none" stroke="rgba(200,152,72,0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
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
      position: "relative", width: 120, height: 160,
      display: "flex", flexDirection: "column", alignItems: "center",
      transform: attacking ? "translateY(-12px) scale(1.05)" : "none",
      transition: "all 0.25s ease",
    }}>
      {/* Ground shadow */}
      <div style={{ position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)",
        width: 90, height: 14, background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)" }} />
      {/* Hexagonal brass frame */}
      <svg width="120" height="150" viewBox="0 0 120 150" style={{ position: "absolute", top: 0 }}>
        <defs>
          <radialGradient id={`tt-brass-${turbine.cardId}`} cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor={isLegendary ? "#f8e094" : "#e8c878"} />
            <stop offset="50%" stopColor={isLegendary ? "#d8a838" : "#c89848"} />
            <stop offset="100%" stopColor="#6e4a18" />
          </radialGradient>
        </defs>
        {/* Hexagon */}
        <path d="M60 8 L102 30 L102 90 L60 112 L18 90 L18 30 Z"
          fill={`url(#tt-brass-${turbine.cardId})`}
          stroke={targeted ? "#d96c5a" : "#3d2a1e"} strokeWidth={targeted ? "3" : "1.5"} />
        <path d="M60 14 L97 33 L97 87 L60 106 L23 87 L23 33 Z"
          fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
        {/* Inner art well */}
        <path d="M60 24 L88 39 L88 76 L60 91 L32 76 L32 39 Z"
          fill="#3d2a1e" />
      </svg>
      {/* Icon */}
      <div style={{ position: "absolute", top: 28, left: "50%", transform: "translateX(-50%)",
        width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center",
        background: `radial-gradient(circle, hsl(${WF_TYPE_THEME.turbine.hue}, 30%, 25%) 0%, #3d2a1e 100%)`,
        borderRadius: "50%",
      }}>
        <IconComp size={36} stroke="#e8c878" strokeWidth={1.3} />
      </div>
      {/* MW badge top */}
      <div style={{ position: "absolute", top: -4, left: -4,
        width: 32, height: 32, borderRadius: "50%",
        background: "radial-gradient(circle at 30% 30%, #f4d68a, #c89848 60%, #6e4a18)",
        border: "2px solid #3d2a1e",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#3d2a1e", fontSize: 14, fontWeight: 800, fontFamily: 'Georgia, serif',
        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
      }}>{card.stats.mw}</div>
      {/* Avail (HP) badge */}
      <div style={{ position: "absolute", top: -4, right: -4,
        width: 32, height: 32, borderRadius: "50%",
        background: eff > 70 ? "radial-gradient(circle at 30% 30%, #b5d68a, #5db58c 60%, #2a5a3c)"
                   : eff > 40 ? "radial-gradient(circle at 30% 30%, #f4c878, #d9a85a 60%, #6e4a18)"
                              : "radial-gradient(circle at 30% 30%, #f4886a, #d96c5a 60%, #6e2818)",
        border: "2px solid #3d2a1e",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 11, fontWeight: 800,
        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
        fontFamily: 'Georgia, serif',
      }}>{eff}</div>
      {/* Name plaque */}
      <div style={{
        position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
        background: "linear-gradient(180deg, #3d2a1e 0%, #2a1810 100%)",
        border: "1px solid #c89848",
        padding: "2px 12px", borderRadius: 4,
        color: "#e8c878", fontSize: 11, fontWeight: 700,
        whiteSpace: "nowrap",
        fontFamily: 'Georgia, serif',
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
      }}>{card.name}</div>
      {/* Legendary crown */}
      {isLegendary && (
        <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)",
          fontSize: 14, color: "#f8e094", textShadow: "0 0 8px #d8a838, 0 2px 4px rgba(0,0,0,0.5)" }}>
          ♛
        </div>
      )}
      {/* Fault overlay */}
      {(turbine.faults || []).length > 0 && (
        <div style={{
          position: "absolute", inset: "20px 16px 26px 16px",
          border: "2px solid #d96c5a",
          borderRadius: 4,
          background: "radial-gradient(circle, rgba(217,108,90,0) 30%, rgba(217,108,90,0.3) 100%)",
          pointerEvents: "none",
        }}>
          <div style={{
            position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 2,
          }}>
            {turbine.faults.map((fid, i) => {
              const f = WF_CARDS[fid];
              const FIcon = wfGetIcon(f.icon);
              return (
                <div key={i} style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#3d2a1e", border: "1.5px solid #d96c5a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FIcon size={11} stroke="#f4886a" />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Target reticle */}
      {targeted && (
        <div style={{ position: "absolute", inset: -10, pointerEvents: "none" }}>
          <svg width="140" height="170" viewBox="0 0 140 170">
            <circle cx="70" cy="80" r="65" fill="none" stroke="#d96c5a" strokeWidth="2" strokeDasharray="6 4" opacity="0.9" />
            <circle cx="70" cy="80" r="72" fill="none" stroke="#d96c5a" strokeWidth="1" strokeDasharray="2 6" opacity="0.6" />
          </svg>
        </div>
      )}
    </div>
  );
};

// ─── Parchment card (hand) ───────────────────────────────────
const TideHandCard = ({ cardId, lifted, dragging, style }) => {
  const card = WF_CARDS[cardId];
  if (!card) return null;
  const IconComp = wfGetIcon(card.icon);
  const theme = WF_TYPE_THEME[card.type];
  const isLegendary = card.legendary;

  return (
    <div style={{
      width: 150, height: 210,
      position: "relative",
      transform: lifted ? "translateY(-32px) scale(1.1)" : dragging ? "translateY(-200px) translateX(60px) rotate(-8deg) scale(1.15)" : "none",
      transition: "transform 0.2s ease",
      filter: lifted ? "drop-shadow(0 12px 24px rgba(0,0,0,0.4))" : "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
      ...style,
    }}>
      <svg width="150" height="210" viewBox="0 0 150 210" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`tide-parch-${cardId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f0e0c0" />
            <stop offset="100%" stopColor="#d8c098" />
          </linearGradient>
          <linearGradient id={`tide-card-brass-${cardId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8c878" />
            <stop offset="50%" stopColor={isLegendary ? "#f4d680" : "#c89848"} />
            <stop offset="100%" stopColor="#6e4a18" />
          </linearGradient>
        </defs>
        {/* Card outline (slightly irregular) */}
        <path d="M8 4 L142 6 L146 204 L4 206 Z" fill={`url(#tide-parch-${cardId})`} stroke="#3d2a1e" strokeWidth="0.8" />
        {/* Brass border */}
        <path d="M8 4 L142 6 L146 204 L4 206 Z" fill="none" stroke={`url(#tide-card-brass-${cardId})`} strokeWidth="4" opacity="0.9" />
        {/* Inner frame line */}
        <rect x="10" y="10" width="130" height="190" fill="none" stroke="rgba(60,40,25,0.5)" strokeWidth="0.5" />
        {/* Worn corners */}
        <circle cx="10" cy="14" r="6" fill="rgba(60,40,25,0.15)" />
        <circle cx="140" cy="200" r="5" fill="rgba(60,40,25,0.12)" />
      </svg>
      {/* Cost orb */}
      <div style={{
        position: "absolute", top: -6, left: -6, zIndex: 2,
        width: 36, height: 36, borderRadius: "50%",
        background: "radial-gradient(circle at 30% 30%, #f4d68a, #c89848 50%, #6e4a18)",
        border: "2px solid #3d2a1e",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#3d2a1e", fontSize: 16, fontWeight: 800, fontFamily: 'Georgia, serif',
        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
      }}>{card.cost}</div>
      {/* Type tag */}
      <div style={{
        position: "absolute", top: 12, right: 12, zIndex: 1,
        fontSize: 8, fontWeight: 700, letterSpacing: "0.15em",
        color: "#3d2a1e", opacity: 0.6,
        fontFamily: 'Georgia, serif',
      }}>{theme.short}</div>
      {/* Name */}
      <div style={{
        position: "absolute", top: 14, left: 30, right: 30, zIndex: 1,
        fontSize: 13, fontWeight: 700, textAlign: "center",
        color: "#3d2a1e", fontFamily: 'Georgia, serif',
        textShadow: "0 1px 0 rgba(255,255,255,0.3)",
      }}>{card.name}</div>
      {/* Art well */}
      <div style={{
        position: "absolute", top: 36, left: 16, right: 16, height: 90, zIndex: 1,
        background: "#3d2a1e",
        border: "1px solid #6e4a18",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        <WFStripedPlaceholder width={118} height={90} stripe="rgba(232,200,120,0.15)" />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconComp size={50} stroke={isLegendary ? "#f4d68a" : "#e8c878"} strokeWidth={1.3} />
        </div>
      </div>
      {/* Stats line */}
      <div style={{
        position: "absolute", top: 132, left: 12, right: 12, zIndex: 1,
        display: "flex", justifyContent: "center", gap: 8, fontSize: 10, fontWeight: 700,
        fontFamily: 'Georgia, serif', color: "#3d2a1e",
      }}>
        {card.stats?.mw !== undefined && <span>⚡{card.stats.mw}MW</span>}
        {card.stats?.drop !== undefined && <span style={{ color: "#a8453a" }}>-{card.stats.drop}%</span>}
        {card.duration !== undefined && <span style={{ color: "#6e4a18" }}>{card.duration}回</span>}
      </div>
      {/* Ability description */}
      {card.abilities?.length > 0 && (
        <div style={{
          position: "absolute", top: 148, left: 16, right: 16, zIndex: 1,
          fontSize: 9, color: "#3d2a1e", textAlign: "center",
          lineHeight: 1.3,
          fontFamily: 'Georgia, serif',
          fontStyle: "italic",
        }}>
          <div style={{ fontWeight: 700, fontStyle: "normal" }}>{card.abilities[0].name}</div>
          <div style={{ opacity: 0.75 }}>{card.abilities[0].desc.slice(0, 28)}{card.abilities[0].desc.length > 28 ? "…" : ""}</div>
        </div>
      )}
      {/* Rarity gem */}
      <div style={{
        position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", zIndex: 1,
        display: "flex", gap: 1,
      }}>
        {Array.from({ length: card.rarity || 1 }, (_, i) => (
          <div key={i} style={{
            width: 6, height: 6, transform: "rotate(45deg)",
            background: isLegendary ? "#f4d68a" : "#c89848",
            border: "0.5px solid #3d2a1e",
          }} />
        ))}
      </div>
    </div>
  );
};

// ─── Opponent hand backs (parchment) ─────────────────────────
const TideOpponentHand = ({ count }) => (
  <div style={{ display: "flex" }}>
    {Array.from({ length: count }, (_, i) => (
      <svg key={i} width="50" height="70" viewBox="0 0 50 70" style={{
        marginLeft: i === 0 ? 0 : -30,
        transform: `rotate(${(i - count / 2 + 0.5) * 5}deg)`,
        filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))",
      }}>
        <defs>
          <linearGradient id={`tide-back-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6e4a18" />
            <stop offset="100%" stopColor="#3d2a1e" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="46" height="66" rx="3" fill={`url(#tide-back-${i})`} stroke="#c89848" strokeWidth="1" />
        <circle cx="25" cy="35" r="10" fill="none" stroke="#c89848" strokeWidth="0.8" />
        <circle cx="25" cy="35" r="5" fill="none" stroke="#c89848" strokeWidth="0.6" />
        <circle cx="25" cy="35" r="1.5" fill="#c89848" />
      </svg>
    ))}
  </div>
);

// ─── Score plate (engraved brass) ────────────────────────────
const TideScore = ({ side, label, score, preview, active }) => (
  <div style={{ position: "relative", width: 140, height: 110 }}>
    <svg width="140" height="110" viewBox="0 0 140 110" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id={`tide-score-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e8c878" />
          <stop offset="50%" stopColor="#c89848" />
          <stop offset="100%" stopColor="#8a6028" />
        </linearGradient>
      </defs>
      <path d="M10 4 L130 4 L136 18 L136 92 L130 106 L10 106 L4 92 L4 18 Z"
        fill={`url(#tide-score-${side})`} stroke="#3d2a1e" strokeWidth="1.5" />
      <path d="M10 4 L130 4 L136 18 L136 92 L130 106 L10 106 L4 92 L4 18 Z"
        fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" transform="translate(2 2)" />
      {/* Inner panel */}
      <rect x="14" y="20" width="112" height="70" fill="#2a1810" stroke="rgba(0,0,0,0.5)" />
      {active && (
        <rect x="14" y="20" width="112" height="70" fill="none" stroke="#f4d68a" strokeWidth="1" opacity="0.6">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
        </rect>
      )}
    </svg>
    <div style={{ position: "relative", padding: "16px 20px", textAlign: "center", color: "#f4d68a" }}>
      <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.85,
        fontFamily: '"Cinzel", Georgia, serif', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.1, fontFamily: 'Georgia, serif',
        textShadow: "0 0 10px rgba(244,214,138,0.5)" }}>{score}</div>
      <div style={{ fontSize: 9, opacity: 0.7 }}>MWh</div>
      {preview > 0 && (
        <div style={{ position: "absolute", bottom: 14, right: 18,
          fontSize: 11, color: "#a8d878", fontWeight: 700,
          fontFamily: 'Georgia, serif',
        }}>+{preview}</div>
      )}
    </div>
  </div>
);

// ─── Technician medallion ────────────────────────────────────
const TideTechMedallion = ({ techId }) => {
  const card = WF_CARDS[techId];
  const IconComp = wfGetIcon(card.icon);
  return (
    <div style={{
      position: "relative", width: 64, height: 64,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id={`tide-med-${techId}`} cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor={card.legendary ? "#f8e094" : "#e8c878"} />
            <stop offset="60%" stopColor={card.legendary ? "#d8a838" : "#c89848"} />
            <stop offset="100%" stopColor="#6e4a18" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill={`url(#tide-med-${techId})`} stroke="#3d2a1e" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
        <circle cx="32" cy="32" r="22" fill="#2a4838" stroke="rgba(0,0,0,0.5)" />
      </svg>
      <IconComp size={24} stroke="#a8d878" />
      {/* Hover-like name label */}
      <div style={{
        position: "absolute", bottom: -16, left: "50%", transform: "translateX(-50%)",
        fontSize: 9, color: "#f4d68a", whiteSpace: "nowrap",
        fontFamily: 'Georgia, serif', fontWeight: 700,
        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
      }}>{card.name}</div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Full screen
// ════════════════════════════════════════════════════════════
const Tideboard = () => {
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
    <div style={tideStyles.root}>
      <TideBoardBg />

      {/* Top bar — brass nameplate */}
      <div style={{
        position: "relative",
        height: 56,
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(180deg, rgba(40,25,15,0.85) 0%, rgba(40,25,15,0.4) 100%)",
        borderBottom: "2px solid #c89848",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <WFCompass size={28} stroke="#e8c878" strokeWidth={1.5} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f4d68a",
              fontFamily: '"Cinzel", Georgia, serif', letterSpacing: "0.08em" }}>WINDFARM BATTLE</div>
            <div style={{ fontSize: 10, color: "#c89848", letterSpacing: "0.25em", textTransform: "uppercase",
              fontFamily: 'Georgia, serif' }}>Tideboard · 潮板</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {["中級", "牌庫", "新局"].map((label, i) => (
            <button key={i} style={{
              background: "linear-gradient(180deg, #6e4a18 0%, #3d2a1e 100%)",
              border: "1px solid #c89848",
              borderRadius: 4,
              padding: "6px 14px",
              fontSize: 12, fontWeight: 600,
              color: "#f4d68a",
              fontFamily: 'Georgia, serif',
              letterSpacing: "0.1em",
              cursor: "pointer",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Battlefield */}
      <div style={{ position: "relative", flex: 1, height: "calc(100% - 56px)", display: "flex", flexDirection: "column" }}>

        {/* OPPONENT row */}
        <div style={{ padding: "20px 36px 12px", display: "flex", alignItems: "center", gap: 24 }}>
          <TideScore side="opp" label="AI · 對手" score={42} preview={0} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <TideOpponentHand count={4} />
            <div style={{ fontSize: 9, color: "#c89848", letterSpacing: "0.2em",
              fontFamily: 'Georgia, serif', textTransform: "uppercase",
              textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>對手手牌 · 4 張</div>
          </div>
          <div style={{ width: 140 }} />
        </div>

        {/* OPPONENT turbines */}
        <div style={{ padding: "8px 36px 0", display: "flex", justifyContent: "center", gap: 36 }}>
          {oppTurbines.map((t, i) => (
            <TideTurbineToken key={i} turbine={t} empty={!t} targeted={i === 0} />
          ))}
        </div>

        {/* CENTER — brass compass + meta */}
        <div style={{
          margin: "20px auto",
          padding: "16px 32px",
          background: "linear-gradient(180deg, rgba(40,25,15,0.9) 0%, rgba(30,18,8,0.95) 100%)",
          border: "2px solid #c89848",
          borderRadius: 8,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", gap: 28,
          position: "relative",
        }}>
          {/* Corner brass */}
          <BrassCorner style={{ position: "absolute", top: -2, left: -2 }} />
          <BrassCorner style={{ position: "absolute", top: -2, right: -2, transform: "scaleX(-1)" }} />
          <BrassCorner style={{ position: "absolute", bottom: -2, left: -2, transform: "scaleY(-1)" }} />
          <BrassCorner style={{ position: "absolute", bottom: -2, right: -2, transform: "scale(-1)" }} />

          {/* Round counter */}
          <div style={{ textAlign: "center", color: "#f4d68a" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.25em", opacity: 0.7,
              fontFamily: '"Cinzel", serif' }}>VOYAGE</div>
            <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1,
              fontFamily: 'Georgia, serif' }}>VII<span style={{ fontSize: 14, opacity: 0.5 }}>/XII</span></div>
          </div>

          <div style={{ width: 1, height: 60, background: "#c89848", opacity: 0.4 }} />

          <TideCompass value={10} label="額定" coeff={1.0} />

          <div style={{ width: 1, height: 60, background: "#c89848", opacity: 0.4 }} />

          {/* Dice + actions */}
          <div style={{ textAlign: "center", color: "#f4d68a" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.25em", opacity: 0.7,
              fontFamily: '"Cinzel", serif' }}>ACTIONS</div>
            <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
              {[true, true, false, false].map((on, i) => (
                <div key={i} style={{
                  width: 16, height: 16, borderRadius: "50%",
                  background: on ? "radial-gradient(circle at 30% 30%, #f4d68a, #c89848)" : "transparent",
                  border: "1.5px solid #c89848",
                  boxShadow: on ? "0 0 6px rgba(244,214,138,0.6)" : "none",
                }} />
              ))}
            </div>
            <div style={{ fontSize: 10, marginTop: 6, opacity: 0.7, fontFamily: 'Georgia, serif' }}>2 / 4</div>
          </div>

          <div style={{ width: 1, height: 60, background: "#c89848", opacity: 0.4 }} />

          {/* Status effects */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6,
              padding: "6px 10px", background: "rgba(217,108,90,0.15)",
              border: "1px solid #d96c5a", borderRadius: 4 }}>
              <WFStorm size={18} stroke="#f4886a" />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#f4886a", fontFamily: 'Georgia, serif' }}>颱風</div>
                <div style={{ fontSize: 9, color: "#f4886a", opacity: 0.7 }}>故障×2 · 1回</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6,
              padding: "6px 10px", background: "rgba(168,216,120,0.1)",
              border: "1px solid #5db58c", borderRadius: 4 }}>
              <WFContract size={18} stroke="#a8d878" />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#a8d878", fontFamily: 'Georgia, serif' }}>穩定供電</div>
                <div style={{ fontSize: 9, color: "#a8d878", opacity: 0.7 }}>2/3 · +15</div>
              </div>
            </div>
          </div>
        </div>

        {/* MY turbines */}
        <div style={{ padding: "0 36px 8px", display: "flex", justifyContent: "center", gap: 36 }}>
          {myTurbines.map((t, i) => (
            <TideTurbineToken key={i} turbine={t} empty={!t} />
          ))}
        </div>

        {/* MY techs row */}
        <div style={{ padding: "16px 36px 8px", display: "flex", justifyContent: "center", gap: 14, marginTop: 4 }}>
          {myTechs.map(id => <TideTechMedallion key={id} techId={id} />)}
        </div>

        {/* MY hand + score */}
        <div style={{
          marginTop: "auto",
          padding: "8px 36px 18px",
          position: "relative",
          display: "flex", alignItems: "flex-end", gap: 20,
        }}>
          {/* Hint */}
          <div style={{
            position: "absolute", top: -28, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 18px",
            background: "linear-gradient(180deg, #d96c5a 0%, #a8453a 100%)",
            border: "1.5px solid #f4d68a",
            color: "#fff", fontSize: 12, fontWeight: 700,
            fontFamily: 'Georgia, serif',
            letterSpacing: "0.05em",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}>
            <WFCrosshair size={14} stroke="#f4d68a" />
            點選對手機組 · 施加葉片損傷
          </div>

          <TideScore side="me" label="你" score={48} preview={12} active />

          {/* Hand */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 6, alignItems: "flex-end", position: "relative" }}>
            {myHand.map((cardId, i) => (
              <TideHandCard
                key={i}
                cardId={cardId}
                lifted={i === 1}
                dragging={i === 0}
                style={{
                  transform: i === 1 ? "translateY(-32px) scale(1.08)" : i === 0 ? "translateY(-220px) translateX(60px) rotate(-8deg) scale(1.12)" : `translateY(${Math.abs(i - 2.5) * 4}px) rotate(${(i - 2.5) * 2}deg)`,
                  marginLeft: i === 0 ? 0 : -16,
                  zIndex: i === 1 ? 20 : i === 0 ? 30 : 10 - Math.abs(i - 2),
                }}
              />
            ))}
          </div>

          {/* End turn button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <button style={{
              padding: "14px 24px",
              background: "linear-gradient(180deg, #e8c878 0%, #c89848 50%, #8a6028 100%)",
              border: "2px solid #3d2a1e",
              borderRadius: 6,
              color: "#3d2a1e",
              fontSize: 14, fontWeight: 800,
              fontFamily: '"Cinzel", Georgia, serif',
              letterSpacing: "0.15em",
              boxShadow: "0 6px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5)",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <WFHourglass size={16} stroke="#3d2a1e" />
              END TURN
            </button>
            <div style={{ fontSize: 10, color: "#c89848", fontFamily: 'Georgia, serif',
              textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>2 動作 · 1 抽 1 棄</div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Tideboard = Tideboard;
