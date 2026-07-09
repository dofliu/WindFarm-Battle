// ============================================================
// 教學知識內容（zh-TW）。教學深度強化：把 Route B 知識-效能模型與
// 真實風電運維知識抽成可查詢文案。結構對應在 core/knowledge.ts。
//
// 內容鐵則（DESIGN.md）：教學情境真實。IEC 61400 系列標題依實際標準命名，
// 故障類別描述對應真實運維情境，避免虛構。
// ============================================================
export const knowledgeZhTW: Record<string, string> = {
  // ── 五種故障類別：真實運維情境 + 對應專長 ──────────────────────
  'knowledge.category.mechanical.name': '機械傳動',
  'knowledge.category.mechanical.real': '齒輪箱、主軸承等傳動元件磨損——離岸風機停機工時的主要來源，需扭力與振動診斷找出根因。',
  'knowledge.category.mechanical.specialist': '齒輪箱／機械技師',

  'knowledge.category.blade.name': '葉片結構',
  'knowledge.category.blade.real': '前緣侵蝕、雷擊、裂紋——直接影響氣動效率，維修需登高作業或無人機巡檢評估。',
  'knowledge.category.blade.specialist': '葉片檢查員',

  'knowledge.category.electrical.name': '電氣系統',
  'knowledge.category.electrical.real': '變流器、變槳電氣與併網介面故障——影響功率輸出與電能品質，需電氣量測與保護協調。',
  'knowledge.category.electrical.specialist': '電氣技師',

  'knowledge.category.sensor.name': '感測／控制',
  'knowledge.category.sensor.real': 'SCADA 感測器異常、偏航對準誤差——感測資料是狀態監測（CMS）的基礎，錯誤讀值會誤導維運決策。',
  'knowledge.category.sensor.specialist': 'SCADA／控制工程師',

  'knowledge.category.hydraulic.name': '液壓系統',
  'knowledge.category.hydraulic.real': '液壓漏油、變槳與煞車液壓失效——關乎機組的安全停機能力，需油壓與密封維護。',
  'knowledge.category.hydraulic.specialist': '液壓技師',

  // ── 知識-效能修復模型（教學核心） ──────────────────────────────
  'knowledge.repair.full.title': '對症維修（完全修復）',
  'knowledge.repair.full.desc': '技師專長與故障類別相符，以正確知識找到根因徹底排除，機組回復且無永久損耗——這就是預測性維護的價值。',
  'knowledge.repair.partial.title': '權宜維修（部分修復）',
  'knowledge.repair.partial.desc': '技師專長與故障類別不符，只能暫時處理表徵、未解根因，機組可用率永久下降——反映缺乏對應技能的長期代價。',

  // ── 維運效率評級 ───────────────────────────────────────────────
  'knowledge.grade.S.title': '卓越運維',
  'knowledge.grade.S.desc': '幾乎全數對症修復，資產零損耗。',
  'knowledge.grade.A.title': '良好運維',
  'knowledge.grade.A.desc': '多數對症下藥，僅少量永久損耗。',
  'knowledge.grade.B.title': '尚待加強',
  'knowledge.grade.B.desc': '半數靠通用維修，累積了可觀的永久損耗。',
  'knowledge.grade.C.title': '需改善',
  'knowledge.grade.C.desc': '多為不對症維修，資產持續劣化——試著讓專長對上故障類別。',

  // ── IEC 61400 系列標準（本局可能接觸到；標題依實際標準） ──────────
  'knowledge.iec.61400-1.title': 'IEC 61400-1 · 風機設計要求',
  'knowledge.iec.61400-2.title': 'IEC 61400-2 · 小型風機',
  'knowledge.iec.61400-3-1.title': 'IEC 61400-3-1 · 離岸風機設計要求',
  'knowledge.iec.61400-3-2.title': 'IEC 61400-3-2 · 浮式離岸風機',
  'knowledge.iec.61400-4.title': 'IEC 61400-4 · 齒輪箱設計',
  'knowledge.iec.61400-5.title': 'IEC 61400-5 · 風機葉片',
  'knowledge.iec.61400-6.title': 'IEC 61400-6 · 塔架與基礎設計',
  'knowledge.iec.61400-12.title': 'IEC 61400-12 · 功率性能量測',
  'knowledge.iec.61400-15.title': 'IEC 61400-15 · 場址風況評估',
  'knowledge.iec.61400-21.title': 'IEC 61400-21 · 電能品質量測與評估',
  'knowledge.iec.61400-24.title': 'IEC 61400-24 · 雷擊防護',
  'knowledge.iec.61400-25.title': 'IEC 61400-25 · 監控通訊（SCADA）',
  'knowledge.iec.61400-25-6.title': 'IEC 61400-25-6 · 狀態監測邏輯節點',
  'knowledge.iec.61400-26.title': 'IEC 61400-26 · 可用度定義',
  'knowledge.iec.61400-27.title': 'IEC 61400-27 · 電氣模擬模型',
  'knowledge.iec.61400-28.title': 'IEC 61400-28 · 風場全生命週期維運管理',
};
