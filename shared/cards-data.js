// Sample card data — abbreviated subset of the real 47-card deck,
// chosen for visual variety across types/rarities/abilities.

const WF_CARDS = {
  // Turbines 機組 (blue)
  M01: { id: "M01", type: "turbine", name: "綠源", nameEn: "Green Source",
         icon: "TurbineOnshore", cost: 1, rarity: 1, stats: { mw: 2, avail: 95 },
         iec: "61400-1", flavor: "穩定可靠的陸域起手機組" },
  M03: { id: "M03", type: "turbine", name: "巨石", nameEn: "Monolith",
         icon: "TurbineOnshore", cost: 2, rarity: 2, stats: { mw: 4, avail: 92 },
         iec: "61400-6", abilities: [{ tag: "lowwind-resist", name: "低風韌性", desc: "低風時可用率僅 -5%" }],
         flavor: "重型基座，抗風能力強" },
  M05: { id: "M05", type: "turbine", name: "藍鯨", nameEn: "Blue Whale",
         icon: "TurbineOffshore", cost: 2, rarity: 3, stats: { mw: 6, avail: 91 },
         iec: "61400-3-1", abilities: [{ tag: "offshore-delay", name: "海域延遲", desc: "故障倒數 +1 回" }],
         flavor: "離岸風機主力" },
  M07: { id: "M07", type: "turbine", name: "天鯨", nameEn: "Sky Whale",
         icon: "TurbineFloat", cost: 3, rarity: 5, stats: { mw: 12, avail: 88 },
         iec: "61400-3-2",
         abilities: [
           { tag: "aura-mw", name: "穩定巨擘", desc: "在場時，你所有風機 +1MW" },
           { tag: "weather-immune", name: "浮式優勢", desc: "免疫低風與颱風的負面效果" },
           { tag: "card-draw-trigger", name: "終極效率", desc: "你打出技師/功能卡時，抽 1 張" }
         ],
         flavor: "浮動式深海王者，傳奇巨擘", legendary: true },

  // Technicians 技師 (green)
  T01: { id: "T01", type: "tech", name: "現場技師", nameEn: "Field Tech",
         icon: "TechWrench", cost: 1, rarity: 1,
         flavor: "基層維修的核心力量" },
  T02: { id: "T02", type: "tech", name: "葉片檢查員", nameEn: "Blade Inspector",
         icon: "TechBlade", cost: 2, rarity: 3,
         abilities: [{ tag: "counter-blade", name: "葉片專家", desc: "唯一能修復葉片損傷" }],
         flavor: "高空繩降專業" },
  T05: { id: "T05", type: "tech", name: "SCADA 工程師", nameEn: "SCADA Engineer",
         icon: "TechScada", cost: 2, rarity: 3,
         abilities: [{ tag: "predict-wind", name: "風能預測", desc: "公開下 2 回合風速" }],
         flavor: "監控全場的眼睛" },
  T07: { id: "T07", type: "tech", name: "資深主管", nameEn: "Senior Supervisor",
         icon: "TechGear", cost: 3, rarity: 5,
         abilities: [
           { tag: "aura-action", name: "領導加成", desc: "每回合 +1 動作" },
           { tag: "discount-tech", name: "知人善用", desc: "技師卡費用 -1" }
         ],
         flavor: "二十年運維資歷", legendary: true },
  T08: { id: "T08", type: "tech", name: "無人機操作員", nameEn: "Drone Operator",
         icon: "TechDrone", cost: 2, rarity: 2,
         abilities: [{ tag: "peek-hand", name: "空中偵察", desc: "偷看對手 2 張手牌" }],
         flavor: "高空巡檢，無孔不入" },

  // Faults 故障 (red)
  F01: { id: "F01", type: "fault", name: "感測器異常", nameEn: "Sensor Fault",
         icon: "FaultSensor", cost: 1, rarity: 1, stats: { drop: 5 }, duration: 1,
         flavor: "讀數飄動，影響輕微" },
  F03: { id: "F03", type: "fault", name: "液壓漏油", nameEn: "Hydraulic Leak",
         icon: "FaultHydraulic", cost: 1, rarity: 2, stats: { drop: 10 }, duration: 2,
         abilities: [{ tag: "spreading", name: "持續惡化", desc: "未修復每回合 -5%" }],
         flavor: "液壓系統漏油，需及時處理" },
  F04: { id: "F04", type: "fault", name: "葉片損傷", nameEn: "Blade Damage",
         icon: "FaultBladeCrack", cost: 2, rarity: 3, stats: { drop: 20 }, duration: 2,
         abilities: [{ tag: "req-blade", name: "專屬克制", desc: "需葉片檢查員才能修復" }],
         flavor: "鳥擊或冰雹造成的損傷" },
  F06: { id: "F06", type: "fault", name: "齒輪箱磨損", nameEn: "Gearbox Wear",
         icon: "FaultGear", cost: 2, rarity: 4, stats: { drop: 30 }, duration: 3,
         abilities: [{ tag: "cascade", name: "連鎖", desc: "20% 機率傳染鄰機" }],
         flavor: "齒輪表面剝離，重大故障" },
  F07: { id: "F07", type: "fault", name: "主軸承故障", nameEn: "Main Bearing",
         icon: "FaultBearing", cost: 2, rarity: 5, stats: { drop: 50 }, duration: 3,
         abilities: [
           { tag: "cascade", name: "重度連鎖", desc: "30% 機率傳染" },
           { tag: "shutdown", name: "緊急停機", desc: "目標立即停機" }
         ],
         flavor: "主軸承碎裂，整機停擺", legendary: true },

  // Functions 功能 (pink)
  FN04: { id: "FN04", type: "func", name: "預支動作", nameEn: "Advance Action",
          icon: "Hourglass", cost: 0, rarity: 2,
          abilities: [{ tag: "extra-action", name: "預支", desc: "下回合 +1 動作" }],
          flavor: "犧牲未來換取現在" },
  FN06: { id: "FN06", type: "func", name: "緊急投標", nameEn: "Emergency Bid",
          icon: "Coin", cost: 1, rarity: 3,
          abilities: [{ tag: "mwh-boost", name: "投標", desc: "本回合 MWh ×1.5" }],
          flavor: "高峰電價機會" },

  // Weather 天氣 (yellow)
  W02: { id: "W02", type: "weather", name: "颱風警報", nameEn: "Typhoon Alert",
         icon: "Storm", cost: 1, rarity: 3, duration: 2,
         flavor: "故障機率倍增" },
  W04: { id: "W04", type: "weather", name: "電網爆發", nameEn: "Grid Surge",
         icon: "PowerBolt", cost: 2, rarity: 4, duration: 1,
         flavor: "本回合 MWh ×2" },

  // Contracts 合約 (purple)
  C01: { id: "C01", type: "contract", name: "穩定供電", nameEn: "Stable Supply",
         icon: "Contract", cost: 1, rarity: 3,
         flavor: "保持高可用率 3 回合" },
};

// Type theme — colors per card type. Each variant overrides as needed.
const WF_TYPE_THEME = {
  turbine:  { name: "機組", short: "MW",   hue: 200, accent: "#3aa7c8" },
  tech:     { name: "技師", short: "TECH", hue: 160, accent: "#5db58c" },
  fault:    { name: "故障", short: "FAULT",hue: 8,   accent: "#d96c5a" },
  func:     { name: "功能", short: "FUNC", hue: 330, accent: "#d97a9c" },
  weather:  { name: "天氣", short: "WX",   hue: 40,  accent: "#d9a85a" },
  contract: { name: "合約", short: "PACT", hue: 270, accent: "#9d7fc8" },
};

// Helper: get icon component from name string
const wfGetIcon = (name) => window[`WF${name}`] || window.WFSpark;

Object.assign(window, { WF_CARDS, WF_TYPE_THEME, wfGetIcon });
