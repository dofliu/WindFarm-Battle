// Atlas variant — field notebook card

const AtlasNotebookCard = ({ cardId, lifted, dragging, style }) => {
  const card = WF_CARDS[cardId];
  if (!card) return null;
  const IconComp = wfGetIcon(card.icon);
  const theme = WF_TYPE_THEME[card.type];
  const isLegendary = card.legendary;

  const tilt = (parseInt(cardId.slice(1), 10) % 5 - 2) * 1.2;

  return (
    <div style={{
      width: 156, height: 220,
      position: "relative",
      transform: lifted
        ? `rotate(${tilt}deg) translateY(-32px) scale(1.1)`
        : dragging
          ? `rotate(${tilt - 8}deg) translateY(-220px) translateX(70px) scale(1.15)`
          : `rotate(${tilt}deg)`,
      transition: "transform 0.2s ease",
      filter: lifted || dragging ? "drop-shadow(0 12px 24px rgba(0,0,0,0.4))" : "drop-shadow(0 4px 8px rgba(0,0,0,0.25))",
      ...style,
    }}>
      <svg width="156" height="220" viewBox="0 0 156 220" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`atlas-paper-${cardId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8eed4" />
            <stop offset="100%" stopColor="#e8d8b0" />
          </linearGradient>
        </defs>
        {/* Irregular card outline — hand-cut paper */}
        <path d="M 6 4 L 150 6 L 152 214 L 4 216 Z"
          fill={`url(#atlas-paper-${cardId})`}
          stroke="#3a2f24" strokeWidth="1" />
        {/* Notebook line (red margin) */}
        <line x1="18" y1="14" x2="18" y2="206" stroke="rgba(168,69,58,0.4)" strokeWidth="0.8" />
        {/* Holes */}
        <circle cx="10" cy="40" r="3" fill="#3a2f24" opacity="0.6" />
        <circle cx="10" cy="110" r="3" fill="#3a2f24" opacity="0.6" />
        <circle cx="10" cy="180" r="3" fill="#3a2f24" opacity="0.6" />
        {/* Faint horizontal rule lines */}
        {[60, 84, 108, 132, 156, 180].map(y => (
          <line key={y} x1="22" y1={y} x2="148" y2={y} stroke="rgba(60,40,20,0.12)" strokeWidth="0.5" />
        ))}
      </svg>

      {/* Cost — circled */}
      <div style={{
        position: "absolute", top: 10, right: 14, zIndex: 2,
        width: 32, height: 32,
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" style={{ position: "absolute", inset: 0 }}>
          <circle cx="16" cy="16" r="13" fill="rgba(244,232,208,0.95)" stroke="#a8453a" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="14" fill="none" stroke="#a8453a" strokeWidth="0.5" opacity="0.5"
            transform="rotate(15 16 16)" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 700, color: "#a8453a", fontFamily: '"Caveat", cursive', lineHeight: 1 }}>{card.cost}</div>
      </div>

      {/* Type marginalia */}
      <div style={{
        position: "absolute", top: 8, left: 26, zIndex: 1,
        fontSize: 11, color: "#7a5a3a", fontStyle: "italic",
        fontFamily: 'Georgia, serif', letterSpacing: "0.1em",
      }}>— {theme.name.toLowerCase()} —</div>

      {/* Name (handwritten) */}
      <div style={{
        position: "absolute", top: 22, left: 26, right: 50, zIndex: 1,
        fontSize: 22, fontWeight: 700, color: "#3a2f24",
        fontFamily: '"Caveat", cursive',
        textDecoration: "underline",
        textDecorationColor: "rgba(58,47,36,0.4)",
        textDecorationStyle: "wavy",
        textUnderlineOffset: "4px",
        lineHeight: 1,
      }}>{card.name}</div>

      {/* Sketch — illustration area with placeholder + icon */}
      <div style={{
        position: "absolute", top: 56, left: 24, right: 12, height: 90, zIndex: 1,
        background: "rgba(244,232,208,0.4)",
        border: "1.5px dashed #7a5a3a",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        <WFStripedPlaceholder width={120} height={90} stripe="rgba(60,40,20,0.15)" />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconComp size={50} stroke="#3a2f24" strokeWidth={1.4} />
        </div>
        {/* Hand-drawn corner brackets */}
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <path d="M 4 4 q -2 4 2 8" stroke="#3a2f24" fill="none" strokeWidth="0.8" />
          <path d="M 96 96 q 2 -4 -2 -8" stroke="#3a2f24" fill="none" strokeWidth="0.8" />
        </svg>
      </div>

      {/* Stats — handwritten */}
      <div style={{
        position: "absolute", top: 152, left: 26, right: 12, zIndex: 1,
        display: "flex", gap: 10, fontSize: 15, fontFamily: '"Caveat", cursive',
        color: "#3a2f24", fontWeight: 600,
      }}>
        {card.stats?.mw !== undefined && <span style={{ color: "#3a6a8a" }}>⚡ {card.stats.mw} MW</span>}
        {card.stats?.drop !== undefined && <span style={{ color: "#a8453a" }}>-{card.stats.drop}%</span>}
        {card.duration !== undefined && <span style={{ color: "#8a6028" }}>{card.duration}回</span>}
      </div>

      {/* Ability — short scribble */}
      {card.abilities?.length > 0 && (
        <div style={{
          position: "absolute", top: 174, left: 26, right: 12, zIndex: 1,
          fontSize: 13, fontFamily: '"Caveat", cursive',
          color: "#3a2f24", lineHeight: 1.15,
        }}>
          <span style={{ fontWeight: 700, textDecoration: "underline" }}>{card.abilities[0].name}：</span>
          <span style={{ opacity: 0.8 }}>{card.abilities[0].desc.slice(0, 18)}…</span>
        </div>
      )}

      {/* Rarity — paw/stamp */}
      <div style={{
        position: "absolute", bottom: 6, right: 10, zIndex: 1,
        display: "flex", gap: 1,
      }}>
        {Array.from({ length: card.rarity || 1 }, (_, i) => (
          <span key={i} style={{
            fontSize: 11, color: isLegendary ? "#c8860a" : "#7a5a3a",
            fontFamily: 'Georgia, serif',
          }}>★</span>
        ))}
      </div>
      {isLegendary && (
        <div style={{
          position: "absolute", bottom: 6, left: 26, zIndex: 1,
          padding: "1px 6px", border: "1.5px solid #a8453a",
          fontSize: 11, color: "#a8453a", fontWeight: 700,
          fontFamily: 'Georgia, serif',
          transform: "rotate(-4deg)",
          background: "rgba(244,232,208,0.6)",
          letterSpacing: "0.1em",
        }}>LEGENDARY</div>
      )}
    </div>
  );
};

window.AtlasNotebookCard = AtlasNotebookCard;
