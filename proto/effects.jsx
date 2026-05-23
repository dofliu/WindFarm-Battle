// Animation FX — dice rolling, fault flash, repair sparks, MWh count-up

// ─── Dice (1d6) ────────────────────────────────────────────
const DiceFace = ({ value, size = 56, theme = "cumulus", spinning }) => {
  // dot positions for 1-6
  const dots = {
    1: [[0.5, 0.5]],
    2: [[0.3, 0.3], [0.7, 0.7]],
    3: [[0.3, 0.3], [0.5, 0.5], [0.7, 0.7]],
    4: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]],
    5: [[0.3, 0.3], [0.7, 0.3], [0.5, 0.5], [0.3, 0.7], [0.7, 0.7]],
    6: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.5], [0.7, 0.5], [0.3, 0.7], [0.7, 0.7]],
  }[value] || [];
  const t = wfThemeOf(theme);
  const bg = theme === "tideboard" ? "#f4e8d0" : "#fff";
  const fg = theme === "tideboard" ? "#3d2a1e" : "#1c2a3a";
  const stroke = theme === "tideboard" ? "#3d2a1e" : "rgba(28,42,58,0.2)";
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.18,
      background: bg,
      border: `2px solid ${stroke}`,
      boxShadow: theme === "tideboard"
        ? "0 4px 12px rgba(0,0,0,0.5), inset 0 -3px 6px rgba(0,0,0,0.15)"
        : "0 4px 12px rgba(28,42,58,0.25), inset 0 -3px 6px rgba(28,42,58,0.05)",
      position: "relative",
      animation: spinning ? "wf-dice-spin 0.2s linear infinite" : "wf-dice-settle 0.4s ease-out",
    }}>
      {dots.map(([x, y], i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${x * 100}%`, top: `${y * 100}%`,
          transform: "translate(-50%, -50%)",
          width: size * 0.16, height: size * 0.16,
          borderRadius: "50%",
          background: fg,
        }} />
      ))}
    </div>
  );
};

const DiceRoller = ({ dice, rolling, typhoon, theme = "cumulus", size = 56 }) => {
  const t = wfThemeOf(theme);
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", position: "relative" }}>
      {dice[0] != null && <DiceFace value={dice[0]} size={size} theme={theme} spinning={rolling} />}
      {dice[1] != null && (
        <DiceFace value={dice[1]} size={size} theme={theme} spinning={rolling} />
      )}
      {typhoon && (
        <div style={{
          position: "absolute", inset: -16,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <svg width={size * 3} height={size * 3} viewBox="0 0 200 200" style={{
            animation: "wf-spin 1.2s linear infinite",
          }}>
            <circle cx="100" cy="100" r="80" fill="none" stroke="#d96c5a" strokeWidth="2"
              strokeDasharray="10 4" opacity="0.7" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="#d96c5a" strokeWidth="1.5"
              strokeDasharray="4 8" opacity="0.5" />
          </svg>
        </div>
      )}
    </div>
  );
};

// ─── Fault flash effect ─────────────────────────────────────
const FaultFlashFX = ({ theme = "cumulus", cardId }) => {
  const card = WF_CARDS[cardId];
  const IconComp = card ? wfGetIcon(card.icon) : WFFaultLightning;
  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10,
    }}>
      {/* Flash */}
      <div style={{
        position: "absolute", inset: -10, borderRadius: 22,
        background: "radial-gradient(circle, rgba(217,108,90,0.7) 0%, transparent 70%)",
        animation: "wf-fault-flash 1s ease-out forwards",
      }} />
      {/* Lightning bolts */}
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: "absolute" }}>
        {[0, 72, 144, 216, 288].map(rot => (
          <g key={rot} transform={`rotate(${rot} 60 60)`} style={{ animation: "wf-fault-bolt 0.6s ease-out" }}>
            <path d="M 60 20 L 56 50 L 64 50 L 58 80" stroke="#fff" strokeWidth="2.5" fill="none"
              opacity="0.9" filter="drop-shadow(0 0 4px #d96c5a)" />
          </g>
        ))}
      </svg>
      {/* Center icon */}
      <div style={{
        position: "relative",
        animation: "wf-fault-zoom 1s ease-out forwards",
      }}>
        <IconComp size={48} stroke="#fff" strokeWidth={2.5} fill="none"
          style={{ filter: "drop-shadow(0 0 8px #d96c5a)" }} />
      </div>
    </div>
  );
};

// ─── Repair sparkle effect ──────────────────────────────────
const RepairFX = ({ theme = "cumulus" }) => (
  <div style={{
    position: "absolute", inset: 0, pointerEvents: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 10,
  }}>
    {/* Green wash */}
    <div style={{
      position: "absolute", inset: -10, borderRadius: 22,
      background: "radial-gradient(circle, rgba(93,181,140,0.5) 0%, transparent 70%)",
      animation: "wf-repair-flash 0.9s ease-out forwards",
    }} />
    {/* Sparkles */}
    {[
      { x: 0.2, y: 0.3, delay: 0 },
      { x: 0.8, y: 0.4, delay: 0.1 },
      { x: 0.5, y: 0.2, delay: 0.05 },
      { x: 0.3, y: 0.7, delay: 0.15 },
      { x: 0.7, y: 0.75, delay: 0.2 },
      { x: 0.5, y: 0.5, delay: 0.05 },
    ].map((p, i) => (
      <div key={i} style={{
        position: "absolute",
        left: `${p.x * 100}%`, top: `${p.y * 100}%`,
        transform: "translate(-50%, -50%)",
        animation: `wf-sparkle 0.7s ease-out ${p.delay}s forwards`,
        opacity: 0,
      }}>
        <WFSpark size={20} stroke="#5db58c" fill="#a8d878" strokeWidth={1.5}
          style={{ filter: "drop-shadow(0 0 6px #5db58c)" }} />
      </div>
    ))}
    {/* Checkmark center */}
    <div style={{
      position: "relative",
      animation: "wf-repair-check 0.9s ease-out forwards",
      opacity: 0,
    }}>
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="#5db58c"
          style={{ filter: "drop-shadow(0 0 12px #5db58c)" }} />
        <path d="M 14 24 L 21 31 L 34 17" stroke="#fff" strokeWidth="3.5" fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);

// ─── Counting number (animated count-up) ────────────────────
const CountUp = ({ from, to, duration = 1200, format = (v) => v, style }) => {
  const [v, setV] = React.useState(from);
  React.useEffect(() => {
    if (from === to) { setV(to); return; }
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(from + (to - from) * eased));
      if (t >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [from, to, duration]);
  return <span style={style}>{format(v)}</span>;
};

// ─── Card-fly-out animation (when card leaves hand) ─────────
const CardFlyout = ({ from, to, cardId, theme, onComplete, duration = 700 }) => {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const tt = Math.min(1, (Date.now() - start) / duration);
      setT(tt);
      if (tt >= 1) {
        clearInterval(id);
        onComplete?.();
      }
    }, 16);
    return () => clearInterval(id);
  }, [duration, onComplete]);
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  const e = ease(t);
  const x = from.x + (to.x - from.x) * e;
  const y = from.y + (to.y - from.y) * e;
  const rot = -15 * Math.sin(e * Math.PI);
  const scale = 1 + 0.15 * Math.sin(e * Math.PI);
  return (
    <div style={{
      position: "fixed", left: x, top: y,
      transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
      pointerEvents: "none", zIndex: 100,
      filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.4))",
    }}>
      <ThemedCard cardId={cardId} theme={theme} />
    </div>
  );
};

// ─── Round summary toast ────────────────────────────────────
const RoundSummaryToast = ({ data, theme = "cumulus" }) => {
  if (!data) return null;
  const t = wfThemeOf(theme);
  return (
    <div style={{
      position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
      zIndex: 200, animation: "wf-toast-in 0.4s ease-out both",
      padding: "12px 22px",
      background: theme === "tideboard" ? "linear-gradient(180deg, #3d2a1e, #2a1810)" : "rgba(28,42,58,0.95)",
      border: theme === "tideboard" ? "2px solid #c89848" : "1px solid rgba(255,255,255,0.15)",
      borderRadius: 14,
      color: "#fff",
      boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
      display: "flex", alignItems: "center", gap: 18,
      fontFamily: t.fontUI,
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.05em", color: t.secondary }}>
        回合 {data.round} 結算
      </div>
      <div style={{ height: 32, width: 1, background: "rgba(255,255,255,0.15)" }} />
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
          <span style={{ color: "rgba(255,255,255,0.5)" }}>你</span>
          <span style={{
            fontSize: 22, fontWeight: 800,
            color: data.myMwh >= data.aiMwh ? "#88e8a8" : "#fff",
          }}>
            +<CountUp from={0} to={data.myMwh} duration={1000} />
          </span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>vs</span>
          <span style={{
            fontSize: 22, fontWeight: 800,
            color: data.aiMwh > data.myMwh ? "#e88a7a" : "#fff",
          }}>
            +<CountUp from={0} to={data.aiMwh} duration={1000} />
          </span>
          <span style={{ color: "rgba(255,255,255,0.5)" }}>AI</span>
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
          總計 {data.myTotal} vs {data.aiTotal} MWh
        </div>
      </div>
      <div style={{ fontSize: 28 }}>
        {data.myMwh > data.aiMwh ? "🏆" : data.myMwh < data.aiMwh ? "😬" : "🤝"}
      </div>
    </div>
  );
};

// ─── Animation styles (global) ──────────────────────────────
const WFAnimationsCSS = `
@keyframes wf-deploy-bounce {
  0% { transform: translateY(-40px) scale(0.85); opacity: 0; }
  60% { transform: translateY(4px) scale(1.08); opacity: 1; }
  100% { transform: translateY(0) scale(1); }
}
@keyframes wf-dice-spin {
  0% { transform: rotate(0); }
  100% { transform: rotate(360deg); }
}
@keyframes wf-dice-settle {
  0% { transform: scale(1.2) rotate(15deg); }
  60% { transform: scale(0.95) rotate(-3deg); }
  100% { transform: scale(1) rotate(0); }
}
@keyframes wf-fault-flash {
  0% { opacity: 0; transform: scale(0.6); }
  30% { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(1.3); }
}
@keyframes wf-fault-zoom {
  0% { transform: scale(0.2) rotate(-30deg); opacity: 0; }
  40% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0; }
}
@keyframes wf-fault-bolt {
  0% { opacity: 0; transform: rotate(0); }
  20% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes wf-fault-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
@keyframes wf-repair-flash {
  0% { opacity: 0; transform: scale(0.6); }
  30% { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(1.4); }
}
@keyframes wf-repair-check {
  0% { opacity: 0; transform: scale(0); }
  60% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes wf-sparkle {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
}
@keyframes wf-spin {
  0% { transform: rotate(0); }
  100% { transform: rotate(360deg); }
}
@keyframes wf-target-spin {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 30; }
}
@keyframes wf-toast-in {
  0% { opacity: 0; transform: translate(-50%, -20px); }
  100% { opacity: 1; transform: translate(-50%, 0); }
}
@keyframes wf-fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
.wf-fade {
  animation: wf-fade-in 0.6s ease-out both;
}
@keyframes wf-thinking-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}
@keyframes wf-wind-bg-drift {
  0% { transform: translateX(0); }
  100% { transform: translateX(-200px); }
}
@keyframes wf-mwh-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
`;

window.DiceFace = DiceFace;
window.DiceRoller = DiceRoller;
window.FaultFlashFX = FaultFlashFX;
window.RepairFX = RepairFX;
window.CountUp = CountUp;
window.CardFlyout = CardFlyout;
window.RoundSummaryToast = RoundSummaryToast;
window.WFAnimationsCSS = WFAnimationsCSS;
