// 玩法說明 Modal：學生首次進入時的快速教學。
// 設計原則：簡潔勝於完整，讓學生 2 分鐘內掌握核心規則。
interface Props {
  readonly onClose: () => void;
}

const CARD_TYPES = [
  {
    icon: '🌬️',
    name: '機組（Turbine）',
    color: 'border-sky-700 bg-sky-950/40 text-sky-200',
    desc: '部署後每回合產電。MW 越高，結算 MWh 越多。可被故障降低可用率。',
  },
  {
    icon: '🔧',
    name: '技師（Tech）',
    color: 'border-emerald-700 bg-emerald-950/40 text-emerald-200',
    desc: '駐場後自動修復故障。【專長相符 = 完全修復；專長不符 = 部分修復（留下永久可用率損失）】— 對症下藥才是關鍵！',
  },
  {
    icon: '💥',
    name: '故障（Fault）',
    color: 'border-rose-700 bg-rose-950/40 text-rose-200',
    desc: '施加給對手機組，使其每回合可用率下降。卡面顯示故障類型（機械/葉片/電氣/感測/液壓），影響對手選擇哪位技師修復。',
  },
  {
    icon: '✨',
    name: '功能（Function）',
    color: 'border-pink-700 bg-pink-950/40 text-pink-200',
    desc: '即時效果：抽牌、增加動作、升級機組、緊急修復等。一次性使用。',
  },
  {
    icon: '🌦️',
    name: '天氣（Weather）',
    color: 'border-amber-700 bg-amber-950/40 text-amber-200',
    desc: '全場效果，持續數回合。可提升可用率、放大故障效果或改變風況。',
  },
  {
    icon: '📋',
    name: '合約（Contract）',
    color: 'border-violet-700 bg-violet-950/40 text-violet-200',
    desc: '設定目標（如「保持高可用率 3 回合」），達成後獲得大量 MWh 獎勵。',
  },
];

const FLOW_STEPS = [
  { icon: '🌬️', title: '風速骰子', desc: '每回合開始擲骰決定風速係數（0.1–2.0），強風 = 高發電，颱風 = 全場風險。' },
  { icon: '🃏', title: '抽 2 張牌', desc: '每回合自動補充手牌，最多持有 7 張。也可主動棄牌 1 張（每回合限一次）。' },
  { icon: '⚡', title: '使用動作', desc: '每回合有 2 個動作點（部分卡牌或技師可增加）。出每張牌消耗其費用顯示的點數。' },
  { icon: '⏭️', title: '結束回合', desc: '按下「結束回合」，技師自動修復故障，接著 AI 行動，最後結算本回合 MWh。' },
];

export default function HowToPlayModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="玩法說明"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題 */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <div className="text-lg font-bold text-slate-100">🌬️ WindFarm Battle 玩法說明</div>
            <div className="text-xs text-slate-500">12 回合累積最多 MWh（兆瓦時）即獲勝</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 active:scale-95"
          >
            ✕ 關閉
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-5 space-y-5">

          {/* 勝利條件 */}
          <section className="rounded-xl border border-amber-700/50 bg-amber-950/20 px-4 py-3">
            <div className="mb-1 text-sm font-bold text-amber-300">🏆 如何獲勝</div>
            <p className="text-xs leading-relaxed text-slate-300">
              雙方同時經營一座離岸風場，12 回合後<strong className="text-amber-200">累積 MWh 較多的玩家獲勝</strong>。
              每回合結算：各機組的發電量 = MW × 可用率 × 風速係數。
              故障降低可用率，技師修復故障，功能卡提供戰術靈活性。
            </p>
          </section>

          {/* 回合流程 */}
          <section>
            <div className="mb-2 text-sm font-bold text-slate-200">⚙️ 每回合流程</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FLOW_STEPS.map((step, i) => (
                <div key={i} className="rounded-xl border border-slate-700 bg-slate-800/40 p-2.5 text-center">
                  <div className="mb-1 text-2xl">{step.icon}</div>
                  <div className="mb-1 text-[11px] font-bold text-slate-200">{step.title}</div>
                  <div className="text-[10px] leading-snug text-slate-400">{step.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 卡牌類型 */}
          <section>
            <div className="mb-2 text-sm font-bold text-slate-200">🃏 六種卡牌類型</div>
            <div className="flex flex-col gap-2">
              {CARD_TYPES.map((ct) => (
                <div
                  key={ct.name}
                  className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 ${ct.color}`}
                >
                  <span className="mt-0.5 text-xl leading-none">{ct.icon}</span>
                  <div>
                    <div className="text-[12px] font-bold leading-tight">{ct.name}</div>
                    <div className="mt-0.5 text-[10px] leading-relaxed opacity-80">{ct.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Route B 知識效益模型 */}
          <section className="rounded-xl border border-emerald-700/50 bg-emerald-950/20 px-4 py-3">
            <div className="mb-2 text-sm font-bold text-emerald-300">🔬 對症下藥：知識效益修復模型</div>
            <p className="mb-2 text-[11px] leading-relaxed text-slate-300">
              技師修復故障時，<strong className="text-emerald-200">專長與故障類型相符 → 完全修復</strong>（可用率全回復）；
              <strong className="text-rose-300">不相符 → 部分修復</strong>（故障消除，但留下永久性可用率損失）。
            </p>
            <div className="grid grid-cols-5 gap-1 text-center text-[9px]">
              {[
                { cat: '⚙️機械', color: 'text-orange-300', tech: 'T03' },
                { cat: '🪂葉片', color: 'text-sky-300', tech: 'T02/T08' },
                { cat: '⚡電氣', color: 'text-yellow-300', tech: 'T04' },
                { cat: '📡感測', color: 'text-cyan-300', tech: 'T05' },
                { cat: '💧液壓', color: 'text-blue-300', tech: 'T06' },
              ].map((item) => (
                <div key={item.cat} className="rounded-lg bg-slate-800/60 p-1.5">
                  <div className={`font-bold leading-tight ${item.color}`}>{item.cat}</div>
                  <div className="mt-0.5 text-slate-400">→ {item.tech}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 核心策略提示 */}
          <section className="rounded-xl border border-sky-700/50 bg-sky-950/20 px-4 py-3">
            <div className="mb-2 text-sm font-bold text-sky-300">💡 新手策略提示</div>
            <ul className="space-y-1 text-[11px] text-slate-300">
              <li>① 開局已有 OS8 + OS10 + OS12 三台離岸機組（固定起始艦隊）</li>
              <li>② 查看對手打出的故障類型，部署對應專長的技師才能完全修復（機組顯示「⬇ −N% 永久」= 部分修復留下了損傷）</li>
              <li>③ 強風回合 = 高分回合，此時應確保機組滿可用率</li>
              <li>④ 點卡名可查看完整能力說明；📚 牌庫可瀏覽全部 50 張卡</li>
              <li>⑤ 傳說卡（⭐⭐⭐⭐⭐）有特殊能力，效果往往改變盤面</li>
            </ul>
          </section>

          {/* IEC 標準對應（教學連結） */}
          <section className="rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3">
            <div className="mb-1 text-xs font-bold text-slate-400">📖 IEC 標準對應（學術連結）</div>
            <p className="text-[10px] leading-relaxed text-slate-500">
              每張卡牌均對應 IEC 61400（風機設計）或 IEC 61966（運維）標準條款，
              可在牌庫的「IEC 編號」欄位查詢，作為課程複習用。
              起始機組 OS8/OS10 遵循 IEC 61400-3-1（固定式離岸），OS12 遵循 IEC 61400-3-2（浮式離岸）。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
