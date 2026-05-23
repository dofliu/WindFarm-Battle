// Custom SVG icon set — replaces emoji throughout the design.
// Stroke-based, monoline aesthetic; sized via `size` prop, color via `stroke`/`fill`.
// All icons are 24x24 viewBox by default.

const Icon = ({ children, size = 24, stroke = "currentColor", fill = "none", strokeWidth = 1.5, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    aria-hidden="true"
  >
    {children}
  </svg>
);

// ── Turbines (機組) ────────────────────────────────────
const TurbineOnshore = (p) => (
  <Icon {...p}>
    <line x1="12" y1="12" x2="12" y2="22" />
    <circle cx="12" cy="11" r="1.2" fill={p.stroke || "currentColor"} stroke="none" />
    <path d="M12 11 L12 4" />
    <path d="M12 11 L18 14" />
    <path d="M12 11 L6 14" />
  </Icon>
);

const TurbineOffshore = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="9" r="1" fill={p.stroke || "currentColor"} stroke="none" />
    <path d="M12 9 L12 3" />
    <path d="M12 9 L17.2 11.6" />
    <path d="M12 9 L6.8 11.6" />
    <line x1="12" y1="10" x2="12" y2="17" />
    <path d="M3 19 q 2 -1.5 4 0 t 4 0 t 4 0 t 4 0 t 4 0" />
    <path d="M3 21 q 2 -1.5 4 0 t 4 0 t 4 0 t 4 0 t 4 0" opacity="0.5" />
  </Icon>
);

const TurbineFloat = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="1" fill={p.stroke || "currentColor"} stroke="none" />
    <path d="M12 8 L12 3" />
    <path d="M12 8 L16.5 10" />
    <path d="M12 8 L7.5 10" />
    <line x1="12" y1="9" x2="12" y2="15" />
    <path d="M8 15 L16 15 L14.5 18 L9.5 18 Z" />
    <path d="M3 21 q 3 -2 6 0 t 6 0 t 6 0" />
  </Icon>
);

// ── Technicians (技師) ─────────────────────────────────
const TechWrench = (p) => (
  <Icon {...p}>
    <path d="M14.7 6.3 a3.5 3.5 0 0 0 -4.9 4.9 L4 17 L7 20 L12.8 14.2 a3.5 3.5 0 0 0 4.9 -4.9 L15.3 11 L13 8.7 L14.7 6.3 Z" />
  </Icon>
);

const TechBlade = (p) => (
  <Icon {...p}>
    <path d="M12 12 L18 6" />
    <path d="M12 12 L6 6" />
    <path d="M12 12 L12 20" />
    <circle cx="12" cy="12" r="1.5" />
    <path d="M16 4 L20 8" />
  </Icon>
);

const TechGear = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 3 L12 5.5 M12 18.5 L12 21 M3 12 L5.5 12 M18.5 12 L21 12 M5.6 5.6 L7.4 7.4 M16.6 16.6 L18.4 18.4 M5.6 18.4 L7.4 16.6 M16.6 7.4 L18.4 5.6" />
  </Icon>
);

const TechDrone = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="2.5" />
    <circle cx="5" cy="5" r="2" />
    <circle cx="19" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
    <line x1="6.5" y1="6.5" x2="10.2" y2="10.2" />
    <line x1="17.5" y1="6.5" x2="13.8" y2="10.2" />
    <line x1="6.5" y1="17.5" x2="10.2" y2="13.8" />
    <line x1="17.5" y1="17.5" x2="13.8" y2="13.8" />
  </Icon>
);

const TechScada = (p) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="13" rx="1.5" />
    <line x1="3" y1="14" x2="21" y2="14" />
    <path d="M6 11 L9 8 L11.5 10 L15 6 L18 11" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="17" x2="12" y2="20" />
  </Icon>
);

// ── Faults (故障) ──────────────────────────────────────
const FaultLightning = (p) => (
  <Icon {...p}>
    <path d="M13 2 L5 14 L11 14 L9 22 L19 9 L13 9 L13 2 Z" />
  </Icon>
);

const FaultBladeCrack = (p) => (
  <Icon {...p}>
    <path d="M12 3 L12 14" />
    <path d="M8 7 L9 9 L8 11 L9 13 L10 12" />
    <path d="M12 14 L7 21" />
    <path d="M12 14 L17 21" />
  </Icon>
);

const FaultHydraulic = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="14" r="5" />
    <path d="M12 3 L12 9" />
    <path d="M10 5 L14 5" />
    <path d="M8 11 q 2 -2 4 0" />
  </Icon>
);

const FaultGear = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="3" />
    <path d="M11 5 L11 7 M11 15 L11 17 M5 11 L7 11 M15 11 L17 11" />
    <path d="M5 5 L19 19" stroke="currentColor" strokeWidth="2" />
  </Icon>
);

const FaultSensor = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 5 L12 7 M12 17 L12 19 M5 12 L7 12 M17 12 L19 12" />
    <path d="M7 7 L9 9 M15 15 L17 17 M7 17 L9 15 M15 9 L17 7" opacity="0.5" />
  </Icon>
);

const FaultBearing = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.5" />
    <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" />
  </Icon>
);

// ── Weather (天氣) ─────────────────────────────────────
const Cloud = (p) => (
  <Icon {...p}>
    <path d="M6 18 a4 4 0 0 1 0 -8 a5 5 0 0 1 9.5 -1 A4 4 0 0 1 18 18 Z" />
  </Icon>
);

const Storm = (p) => (
  <Icon {...p}>
    <path d="M6 14 a4 4 0 0 1 0 -8 a5 5 0 0 1 9.5 -1 A4 4 0 0 1 18 14 Z" />
    <path d="M11 14 L8 19 L11 19 L9 23" />
    <path d="M16 14 L14 18" />
  </Icon>
);

const Wave = (p) => (
  <Icon {...p}>
    <path d="M2 8 q 2 -3 5 0 t 5 0 t 5 0 t 5 0" />
    <path d="M2 14 q 2 -3 5 0 t 5 0 t 5 0 t 5 0" />
    <path d="M2 20 q 2 -3 5 0 t 5 0 t 5 0 t 5 0" />
  </Icon>
);

const WindArrow = (p) => (
  <Icon {...p}>
    <path d="M3 9 q 4 -3 8 0 t 8 0 L19 9" />
    <path d="M3 14 q 4 -3 8 0 t 8 0" />
    <path d="M3 19 q 4 -3 8 0" />
    <path d="M16 6 L19 9 L16 12" />
  </Icon>
);

// ── Generic UI ─────────────────────────────────────────
const Shield = (p) => (
  <Icon {...p}>
    <path d="M12 3 L20 6 L20 13 q 0 5 -8 8 q -8 -3 -8 -8 L4 6 Z" />
  </Icon>
);

const Spark = (p) => (
  <Icon {...p}>
    <path d="M12 3 L13.5 10.5 L21 12 L13.5 13.5 L12 21 L10.5 13.5 L3 12 L10.5 10.5 Z" />
  </Icon>
);

const Eye = (p) => (
  <Icon {...p}>
    <path d="M2 12 q 5 -7 10 -7 t 10 7 q -5 7 -10 7 t -10 -7 Z" />
    <circle cx="12" cy="12" r="2.5" />
  </Icon>
);

const Coin = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9 q 3 -3 6 0 M9 15 q 3 3 6 0 M12 7 L12 17" />
  </Icon>
);

const Dice = (p) => (
  <Icon {...p}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <circle cx="9" cy="9" r="1.1" fill={p.stroke || "currentColor"} stroke="none" />
    <circle cx="15" cy="15" r="1.1" fill={p.stroke || "currentColor"} stroke="none" />
    <circle cx="15" cy="9" r="1.1" fill={p.stroke || "currentColor"} stroke="none" />
    <circle cx="9" cy="15" r="1.1" fill={p.stroke || "currentColor"} stroke="none" />
    <circle cx="12" cy="12" r="1.1" fill={p.stroke || "currentColor"} stroke="none" />
  </Icon>
);

const Hourglass = (p) => (
  <Icon {...p}>
    <path d="M6 3 L18 3" />
    <path d="M6 21 L18 21" />
    <path d="M7 3 L7 7 Q 7 10 12 12 Q 17 14 17 17 L17 21" />
    <path d="M17 3 L17 7 Q 17 10 12 12 Q 7 14 7 17 L7 21" />
  </Icon>
);

const Skull = (p) => (
  <Icon {...p}>
    <path d="M5 11 q 0 -7 7 -7 t 7 7 v 4 q 0 1.5 -1.5 1.5 H 16 v 3 H 8 v -3 H 6.5 Q 5 16.5 5 15 Z" />
    <circle cx="9" cy="12" r="1.2" fill={p.stroke || "currentColor"} stroke="none" />
    <circle cx="15" cy="12" r="1.2" fill={p.stroke || "currentColor"} stroke="none" />
    <path d="M11 16 L13 16" />
  </Icon>
);

const Contract = (p) => (
  <Icon {...p}>
    <path d="M6 3 L6 21 L18 21 L18 7 L14 3 Z" />
    <path d="M14 3 L14 7 L18 7" />
    <path d="M9 12 L15 12 M9 15 L15 15 M9 18 L12 18" />
  </Icon>
);

const Compass = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 5 L14 12 L12 19 L10 12 Z" fill={p.stroke || "currentColor"} stroke="none" opacity="0.85" />
    <path d="M5 12 L19 12" strokeWidth="0.5" opacity="0.4" />
    <path d="M12 5 L12 19" strokeWidth="0.5" opacity="0.4" />
  </Icon>
);

const PowerBolt = (p) => (
  <Icon {...p}>
    <path d="M13 2 L4 13 L11 13 L11 22 L20 11 L13 11 Z" />
  </Icon>
);

const Crosshair = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <circle cx="12" cy="12" r="2" fill={p.stroke || "currentColor"} stroke="none" />
  </Icon>
);

// Striped placeholder rectangle — for future card-art slot
let _stripIdCounter = 0;
const StripedPlaceholder = ({ width = 100, height = 80, stripe = "rgba(0,0,0,0.06)", bg = "transparent", label, labelColor = "rgba(0,0,0,0.4)", style }) => {
  const id = React.useMemo(() => "stripes-" + (++_stripIdCounter), []);
  return (
  <svg
    width="100%"
    height="100%"
    viewBox={`0 0 ${width} ${height}`}
    preserveAspectRatio="none"
    style={style}
    aria-hidden="true"
  >
    <defs>
      <pattern id={id} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
        <rect width="8" height="8" fill={bg} />
        <line x1="0" y1="0" x2="0" y2="8" stroke={stripe} strokeWidth="3" />
      </pattern>
    </defs>
    <rect x="0" y="0" width={width} height={height} fill={`url(#${id})`} />
    {label && (
      <text
        x={width / 2}
        y={height / 2}
        fontSize={Math.min(width, height) * 0.12}
        fontFamily="ui-monospace, monospace"
        fill={labelColor}
        textAnchor="middle"
        dominantBaseline="middle"
        letterSpacing="0.05em"
      >
        {label}
      </text>
    )}
  </svg>
  );
};

Object.assign(window, {
  WFIcon: Icon,
  WFTurbineOnshore: TurbineOnshore,
  WFTurbineOffshore: TurbineOffshore,
  WFTurbineFloat: TurbineFloat,
  WFTechWrench: TechWrench,
  WFTechBlade: TechBlade,
  WFTechGear: TechGear,
  WFTechDrone: TechDrone,
  WFTechScada: TechScada,
  WFFaultLightning: FaultLightning,
  WFFaultBladeCrack: FaultBladeCrack,
  WFFaultHydraulic: FaultHydraulic,
  WFFaultGear: FaultGear,
  WFFaultSensor: FaultSensor,
  WFFaultBearing: FaultBearing,
  WFCloud: Cloud,
  WFStorm: Storm,
  WFWave: Wave,
  WFWindArrow: WindArrow,
  WFShield: Shield,
  WFSpark: Spark,
  WFEye: Eye,
  WFCoin: Coin,
  WFDice: Dice,
  WFHourglass: Hourglass,
  WFSkull: Skull,
  WFContract: Contract,
  WFCompass: Compass,
  WFPowerBolt: PowerBolt,
  WFCrosshair: Crosshair,
  WFStripedPlaceholder: StripedPlaceholder,
});
