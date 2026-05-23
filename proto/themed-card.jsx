// Themed Card component — renders a hand card in the active theme.
// Variants: cumulus (rounded modern) or tideboard (parchment + brass).

const ThemedCard = React.forwardRef(({
  cardId, theme = "cumulus", lifted, dragging, faded,
  onMouseEnter, onMouseLeave, onPointerDown, onClick,
  style, size = 156,
}, ref) => {
  const card = WF_CARDS[cardId];
  if (!card) return null;
  const IconComp = wfGetIcon(card.icon);
  const t = wfThemeOf(theme);
  const tc = wfTypeColors(theme, card.type);
  const isLegendary = card.legendary;
  const themeKey = theme;

  if (themeKey === "tideboard") {
    return (
      <div ref={ref}
        onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
        onPointerDown={onPointerDown} onClick={onClick}
        style={{
          width: size, height: size * 1.4,
          position: "relative",
          opacity: faded ? 0.4 : 1,
          transform: dragging ? "scale(1.12) rotate(-6deg)" : lifted ? "translateY(-32px) scale(1.1)" : "none",
          transition: dragging ? "none" : "transform 0.2s ease, opacity 0.2s",
          filter: lifted || dragging ? "drop-shadow(0 14px 28px rgba(0,0,0,0.45))" : "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
          cursor: onPointerDown || onClick ? "pointer" : "default",
          ...style,
        }}>
        <svg width={size} height={size * 1.4} viewBox={`0 0 ${size} ${size * 1.4}`} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id={`tc-parch-${cardId}-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f0e0c0" />
              <stop offset="100%" stopColor="#d8c098" />
            </linearGradient>
          </defs>
          <path d={`M 6 4 L ${size - 8} 6 L ${size - 4} ${size * 1.4 - 4} L 4 ${size * 1.4 - 6} Z`}
            fill={`url(#tc-parch-${cardId}-${size})`} stroke="#3d2a1e" strokeWidth="1" />
          <rect x="8" y="8" width={size - 16} height={size * 1.4 - 16} fill="none" stroke={isLegendary ? "#d8a838" : "#c89848"} strokeWidth="2.5" opacity="0.9" />
          <rect x="11" y="11" width={size - 22} height={size * 1.4 - 22} fill="none" stroke="rgba(60,40,25,0.4)" strokeWidth="0.5" />
        </svg>
        {/* Cost orb */}
        <div style={{
          position: "absolute", top: -6, left: -6, zIndex: 2,
          width: 32, height: 32, borderRadius: "50%",
          background: "radial-gradient(circle at 30% 30%, #f4d68a, #c89848 50%, #6e4a18)",
          border: "2px solid #3d2a1e",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#3d2a1e", fontSize: 15, fontWeight: 800, fontFamily: 'Georgia, serif',
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
        }}>{card.cost}</div>
        {/* Name */}
        <div style={{
          position: "absolute", top: 12, left: 30, right: 12, zIndex: 1,
          fontSize: size * 0.085, fontWeight: 700, textAlign: "center",
          color: "#3d2a1e", fontFamily: 'Georgia, serif',
        }}>{card.name}</div>
        {/* Art well */}
        <div style={{
          position: "absolute", top: size * 0.22, left: 12, right: 12,
          height: size * 0.6, zIndex: 1,
          background: "#3d2a1e", border: "1px solid #6e4a18",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          <WFStripedPlaceholder width={size - 24} height={size * 0.6} stripe="rgba(232,200,120,0.15)" />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconComp size={size * 0.32} stroke={isLegendary ? "#f4d68a" : "#e8c878"} strokeWidth={1.3} />
          </div>
        </div>
        {/* Stats */}
        <div style={{
          position: "absolute", top: size * 0.86, left: 0, right: 0, zIndex: 1,
          display: "flex", justifyContent: "center", gap: 6, fontSize: size * 0.07, fontWeight: 700,
          fontFamily: 'Georgia, serif', color: "#3d2a1e",
        }}>
          {card.stats?.mw !== undefined && <span>⚡{card.stats.mw}MW</span>}
          {card.stats?.drop !== undefined && <span style={{ color: "#a8453a" }}>-{card.stats.drop}%</span>}
          {card.duration !== undefined && <span style={{ color: "#6e4a18" }}>{card.duration}回</span>}
        </div>
        {/* Ability */}
        {card.abilities?.length > 0 && (
          <div style={{
            position: "absolute", top: size * 0.99, left: 14, right: 14, zIndex: 1,
            fontSize: size * 0.058, color: "#3d2a1e", textAlign: "center",
            lineHeight: 1.3, fontStyle: "italic",
            fontFamily: 'Georgia, serif',
          }}>
            <div style={{ fontWeight: 700, fontStyle: "normal" }}>{card.abilities[0].name}</div>
          </div>
        )}
        {/* Rarity */}
        <div style={{
          position: "absolute", bottom: 6, left: 0, right: 0, zIndex: 1,
          display: "flex", justifyContent: "center", gap: 1,
        }}>
          {Array.from({ length: card.rarity || 1 }, (_, i) => (
            <div key={i} style={{
              width: 5, height: 5, transform: "rotate(45deg)",
              background: isLegendary ? "#d8a838" : "#c89848",
            }} />
          ))}
        </div>
      </div>
    );
  }

  // Cumulus default
  return (
    <div ref={ref}
      onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      onPointerDown={onPointerDown} onClick={onClick}
      style={{
        width: size, height: size * 1.43,
        borderRadius: 16,
        background: "linear-gradient(180deg, #ffffff 0%, #e8eef2 100%)",
        border: isLegendary ? "2.5px solid #d9a85a" : "1.5px solid rgba(28,42,58,0.22)",
        boxShadow: lifted ? t.shadowLifted : dragging ? t.shadowDragged : "0 8px 22px rgba(28,42,58,0.18), 0 1px 0 rgba(255,255,255,0.7) inset",
        padding: 10, display: "flex", flexDirection: "column",
        position: "relative",
        opacity: faded ? 0.4 : 1,
        transform: dragging ? "scale(1.12) rotate(-4deg)" : lifted ? "translateY(-32px) scale(1.1)" : "none",
        transition: dragging ? "none" : "transform 0.2s ease, opacity 0.2s",
        cursor: onPointerDown || onClick ? "pointer" : "default",
        ...style,
      }}>
      {/* Cost */}
      <div style={{
        position: "absolute", top: -6, left: -6,
        width: 30, height: 30, borderRadius: "50%",
        background: tc.accent, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 800, fontFamily: t.fontUI,
        boxShadow: "0 3px 10px rgba(28,42,58,0.2)",
        border: "2px solid #fff",
      }}>{card.cost}</div>
      <div style={{
        position: "absolute", top: 8, right: 10,
        fontSize: 8, fontWeight: 700, letterSpacing: "0.12em",
        color: tc.accent,
      }}>{WF_TYPE_THEME[card.type].short}</div>
      {/* Art slot */}
      <div style={{
        marginTop: 14,
        height: size * 0.65,
        borderRadius: 10,
        background: `linear-gradient(180deg, hsl(${tc.hue}, 35%, 94%) 0%, hsl(${tc.hue}, 30%, 86%) 100%)`,
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <WFStripedPlaceholder width={size - 20} height={size * 0.65} stripe={`hsla(${tc.hue}, 30%, 50%, 0.15)`} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconComp size={size * 0.36} stroke={tc.accent} strokeWidth={1.3} />
        </div>
      </div>
      {/* Name */}
      <div style={{ fontSize: 12, fontWeight: 700, color: t.textPrimary, textAlign: "center", marginTop: 6, fontFamily: t.fontUI }}>{card.name}</div>
      {/* Stats */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, fontSize: 10, marginTop: 4 }}>
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
      {/* Rarity */}
      <div style={{ display: "flex", justifyContent: "center", gap: 1, marginTop: "auto", fontSize: 9 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} style={{ color: i < (card.rarity || 1) ? (isLegendary ? "#d9a85a" : "#1c2a3a") : "rgba(28,42,58,0.15)" }}>★</span>
        ))}
      </div>
    </div>
  );
});

// Card back (face-down)
const ThemedCardBack = ({ theme = "cumulus", size = 42, style }) => {
  const t = wfThemeOf(theme);
  if (theme === "tideboard") {
    return (
      <svg width={size} height={size * 1.43} viewBox={`0 0 ${size} ${size * 1.43}`} style={{ ...style }}>
        <rect x="2" y="2" width={size - 4} height={size * 1.43 - 4} rx="2"
          fill="url(#tideback)" stroke="#c89848" strokeWidth="1" />
        <defs>
          <linearGradient id="tideback" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#6e4a18" />
            <stop offset="1" stopColor="#3d2a1e" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size * 0.7} r={size * 0.22} fill="none" stroke="#c89848" strokeWidth="0.8" />
        <circle cx={size / 2} cy={size * 0.7} r={size * 0.1} fill="none" stroke="#c89848" strokeWidth="0.6" />
        <circle cx={size / 2} cy={size * 0.7} r="1.5" fill="#c89848" />
      </svg>
    );
  }
  // Cumulus
  return (
    <div style={{
      width: size, height: size * 1.43,
      borderRadius: 6,
      background: t.cardBackBg,
      border: "1.5px solid rgba(255,255,255,0.5)",
      boxShadow: "0 2px 8px rgba(28,42,58,0.15)",
      display: "flex", alignItems: "center", justifyContent: "center",
      ...style,
    }}>
      <div style={{ width: size * 0.42, height: size * 0.42, borderRadius: "50%",
        border: "1.5px solid rgba(255,255,255,0.5)" }} />
    </div>
  );
};

window.ThemedCard = ThemedCard;
window.ThemedCardBack = ThemedCardBack;
