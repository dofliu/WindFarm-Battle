// ============================================================
// Educational knowledge content (en). Mirrors knowledge.zh-TW.ts.
// IEC 61400 series titles follow the actual standard naming.
// ============================================================
export const knowledgeEn: Record<string, string> = {
  // ── Five fault categories: real-world O&M context + specialist ──
  'knowledge.category.mechanical.name': 'Mechanical Drivetrain',
  'knowledge.category.mechanical.real': 'Gearbox and main-bearing wear — a leading source of offshore downtime; root cause needs torque and vibration diagnostics.',
  'knowledge.category.mechanical.specialist': 'Gearbox / Mechanical Tech',

  'knowledge.category.blade.name': 'Blade Structure',
  'knowledge.category.blade.real': 'Leading-edge erosion, lightning, cracks — directly cuts aerodynamic efficiency; repair needs rope access or drone inspection.',
  'knowledge.category.blade.specialist': 'Blade Inspector',

  'knowledge.category.electrical.name': 'Electrical System',
  'knowledge.category.electrical.real': 'Converter, pitch-electrical and grid-interface faults — affect power output and quality; need electrical measurement and protection coordination.',
  'knowledge.category.electrical.specialist': 'Electrical Tech',

  'knowledge.category.sensor.name': 'Sensor / Control',
  'knowledge.category.sensor.real': 'SCADA sensor anomalies and yaw misalignment — sensor data underpins condition monitoring; bad readings mislead O&M decisions.',
  'knowledge.category.sensor.specialist': 'SCADA / Control Engineer',

  'knowledge.category.hydraulic.name': 'Hydraulic System',
  'knowledge.category.hydraulic.real': 'Hydraulic leaks and pitch/brake failures — tied to safe-shutdown capability; need oil-pressure and seal maintenance.',
  'knowledge.category.hydraulic.specialist': 'Hydraulic Tech',

  // ── Knowledge-effectiveness repair model (teaching core) ──
  'knowledge.repair.full.title': 'Targeted Repair (Full)',
  'knowledge.repair.full.desc': 'The technician’s specialty matches the fault: the root cause is found and fully fixed with no permanent loss — this is the value of predictive maintenance.',
  'knowledge.repair.partial.title': 'Stopgap Repair (Partial)',
  'knowledge.repair.partial.desc': 'The specialty does not match: only the symptom is patched, availability drops permanently — the long-term cost of missing the right skill.',

  // ── O&M efficiency grade ──
  'knowledge.grade.S.title': 'Excellent O&M',
  'knowledge.grade.S.desc': 'Almost every fault fixed on target, zero asset loss.',
  'knowledge.grade.A.title': 'Good O&M',
  'knowledge.grade.A.desc': 'Mostly targeted repairs, only minor permanent loss.',
  'knowledge.grade.B.title': 'Room to Improve',
  'knowledge.grade.B.desc': 'Half were generic patches, notable permanent loss accrued.',
  'knowledge.grade.C.title': 'Needs Work',
  'knowledge.grade.C.desc': 'Mostly off-target repairs, assets kept degrading — try matching specialty to fault type.',

  // ── IEC 61400 series (titles follow the actual standard) ──
  'knowledge.iec.61400-1.title': 'IEC 61400-1 · Design requirements',
  'knowledge.iec.61400-2.title': 'IEC 61400-2 · Small wind turbines',
  'knowledge.iec.61400-3-1.title': 'IEC 61400-3-1 · Offshore design requirements',
  'knowledge.iec.61400-3-2.title': 'IEC 61400-3-2 · Floating offshore turbines',
  'knowledge.iec.61400-4.title': 'IEC 61400-4 · Gearbox design',
  'knowledge.iec.61400-5.title': 'IEC 61400-5 · Wind turbine blades',
  'knowledge.iec.61400-6.title': 'IEC 61400-6 · Tower and foundation design',
  'knowledge.iec.61400-12.title': 'IEC 61400-12 · Power performance measurement',
  'knowledge.iec.61400-15.title': 'IEC 61400-15 · Site suitability assessment',
  'knowledge.iec.61400-21.title': 'IEC 61400-21 · Power quality measurement',
  'knowledge.iec.61400-24.title': 'IEC 61400-24 · Lightning protection',
  'knowledge.iec.61400-25.title': 'IEC 61400-25 · Monitoring & control comms (SCADA)',
  'knowledge.iec.61400-25-6.title': 'IEC 61400-25-6 · Condition-monitoring logical nodes',
  'knowledge.iec.61400-26.title': 'IEC 61400-26 · Availability definitions',
  'knowledge.iec.61400-27.title': 'IEC 61400-27 · Electrical simulation models',
  'knowledge.iec.61400-28.title': 'IEC 61400-28 · Through-life O&M management',
};
