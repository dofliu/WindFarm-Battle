// Stage — keeps the prototype at fixed 1440x900 design size,
// scaled to fit any viewport (letterboxed on neutral backdrop).

const WF_STAGE_W = 1440;
const WF_STAGE_H = 900;

const Stage = ({ children }) => {
  const [scale, setScale] = React.useState(1);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const recompute = () => {
      const s = Math.min(window.innerWidth / WF_STAGE_W, window.innerHeight / WF_STAGE_H);
      setScale(s);
      // expose for non-React consumers
      window.wfStageScale = s;
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, []);

  // Update window.wfStageRect on every layout
  React.useEffect(() => {
    const update = () => {
      if (ref.current) window.wfStageRect = ref.current.getBoundingClientRect();
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [scale]);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#0d1924",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      <div ref={ref} style={{
        width: WF_STAGE_W, height: WF_STAGE_H,
        flexShrink: 0,
        transform: `scale(${scale})`, transformOrigin: "center center",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
      }}>
        {children}
      </div>
    </div>
  );
};

// Convert viewport coords to design (stage) coords
window.wfViewportToStage = (x, y) => {
  const rect = window.wfStageRect;
  const scale = window.wfStageScale || 1;
  if (!rect) return { x, y };
  return {
    x: (x - rect.left) / scale,
    y: (y - rect.top) / scale,
  };
};

window.WFStage = Stage;
window.WF_STAGE_W = WF_STAGE_W;
window.WF_STAGE_H = WF_STAGE_H;
