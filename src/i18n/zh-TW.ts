// 介面字串（zh-TW）。D3：未來卡牌文案也會集中到 i18n，新增 en 只翻語言檔。
export const zhTW = {
  'app.title': 'WindFarm Battle 風場大戰',
  'app.subtitle': '風電運維教學卡牌遊戲',
  'app.cardsLoaded': '已載入 {n} 張卡牌',
  'app.windDemo': '可重現風速示範（seed 20260521）',
  'category.turbine': '機組',
  'category.tech': '技師',
  'category.fault': '故障',
  'category.func': '功能',
  'category.weather': '天氣',
  'category.contract': '合約',
  'ui.endTurn': '結束回合',
  'ui.actionsLeft': '剩餘動作',
  'ui.yourHand': '你的手牌',
} as const;

export type MessageKey = keyof typeof zhTW;
