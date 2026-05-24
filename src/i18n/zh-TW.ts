// 介面字串（zh-TW）。D3：未來卡牌文案也會集中到 i18n，新增 en 只翻語言檔。
export const zhTW = {
  // ── App ──────────────────────────────────────────────────
  'app.title': 'WindFarm Battle 風場大戰',
  'app.subtitle': '風電運維教學卡牌遊戲',
  'app.cardsLoaded': '已載入 {n} 張卡牌',
  'app.windDemo': '可重現風速示範（seed 20260521）',
  // ── Categories ───────────────────────────────────────────
  'category.turbine': '機組',
  'category.tech': '技師',
  'category.fault': '故障',
  'category.func': '功能',
  'category.weather': '天氣',
  'category.contract': '合約',
  'category.all': '全部',
  // ── Battle UI ────────────────────────────────────────────
  'ui.endTurn': '結束回合',
  'ui.actionsLeft': '剩餘動作',
  'ui.yourHand': '你的手牌',
  'ui.aiTurn': 'AI 回合',
  'ui.actions': '動作',
  'ui.round': '回合',
  'ui.wind': '本回合風速',
  'ui.remaining': '還剩 {n} 回',
  'ui.progress': '進度 {n}',
  'ui.drawDiscard': '1 抽 1 棄',
  'ui.actionsRemain': '剩 {n} 動作 · 1 抽 1 棄',
  // ── Side Labels ──────────────────────────────────────────
  'side.you': '你',
  'side.ai': 'AI',
  'side.yourField': '你的陣地',
  'side.aiOpponent': 'AI 對手',
  'side.hand': '手',
  'side.deck': '庫',
  'side.handDeck': '{hand} 手 · {deck} 庫',
  'side.fault': '故障',
  'side.faulting': '故障中',
  'side.yourTurn': '你的回合',
  'side.aiThinking': 'AI 思考中…',
  'side.calculating': '計算中',
  // ── Drag hints ───────────────────────────────────────────
  'drag.fault': '拖到對手機組上 · 或點對手機組目標',
  'drag.deploy': '拖到你的場地上部署',
  // ── Typhoon banner ───────────────────────────────────────
  'typhoon.alert': '🌀 颱風來襲',
  // ── Round Summary Toast ──────────────────────────────────
  'toast.roundResult': '回合 {round} 結算',
  'toast.you': '你',
  'toast.total': '總計 {me} vs {ai} MWh',
  // ── Library Modal ────────────────────────────────────────
  'library.title.tideboard': 'CARD CODEX · 牌冊',
  'library.title.cumulus': '📚 牌庫',
  'library.count': '{n} 張',
  // ── Game Over ────────────────────────────────────────────
  'gameover.win': '勝利',
  'gameover.lose': '敗北',
  'gameover.draw': '平手',
  'gameover.winSub': '您是優秀的風場運維者',
  'gameover.loseSub': 'AI 略勝一籌，再戰一回？',
  'gameover.drawSub': '勢均力敵的對手',
  'gameover.you': '你',
  'gameover.stat.turbines': '🏭 部署機組',
  'gameover.stat.techs': '⚙️ 雇用技師',
  'gameover.stat.faults': '💥 對手故障',
  'gameover.stat.rounds': '📅 完成回合',
  'gameover.restart': '再戰一回',
  'gameover.title': '返回',
  // ── TopBar ───────────────────────────────────────────────
  'topbar.difficulty.easy': '簡單',
  'topbar.difficulty.medium': '普通',
  'topbar.difficulty.hard': '困難',
  'topbar.library': '牌庫',
  'topbar.help': '說明',
  'topbar.theme': '主題',
  'topbar.restart': '重新開始',
  'topbar.title': '返回主選單',
} as const;

export type MessageKey = keyof typeof zhTW;
