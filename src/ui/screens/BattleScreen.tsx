// ============================================================
// 對戰主畫面 v3：寶可夢式技師戰鬥桌面 + 課堂任務提示。
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { useGameStore, uiPreviewMwh } from '../../store/game-store';
import { TopBar } from '../components/TopBar';
import { WindFarmPanel } from '../components/WindFarmPanel';
import { TechField } from '../components/TechField';
import { EnvironmentPanel } from '../components/EnvironmentPanel';
import { EvolutionFX } from '../effects/EvolutionFX';
import { Hand, DragOverlay } from '../components/Hand';
import type { DragInfo } from '../components/Hand';
import { LibraryModal } from '../components/LibraryModal';
import { SettingsModal } from '../components/SettingsModal';
import { RoundSummaryToast } from '../effects/RoundSummaryToast';
import { RepairInsightToast } from '../components/RepairInsightToast';
import { useGameFeedback } from '../audio/useGameFeedback';
import { useRepairInsight } from '../learning/useRepairInsight';
import { useLocale } from '../locale/LocaleContext';
import { CARDS } from '../../core/cards';
import { cardName } from '../../i18n';
import type { GameState } from '../../core/types';

interface Props {
  readonly onTitle: () => void;
  readonly onGameOver: () => void;
}

const HUMAN = 0;
const AI = 1;

function countFaults(state: GameState, player: 0 | 1): number {
  return state.players[player].windFarm.reduce((sum, turbine) => sum + turbine.faults.length, 0);
}

function tutorialStep(state: GameState): { title: string; body: string; tone: 'emerald' | 'sky' | 'amber' | 'rose' } {
  const me = state.players[HUMAN];
  const hasTechInHand = me.hand.some((id) => CARDS[id]?.type === 'tech');
  const hasToolInHand = me.hand.some((id) => CARDS[id]?.type === 'tool');
  const hasItemInHand = me.hand.some((id) => CARDS[id]?.type === 'item');
  const faults = countFaults(state, HUMAN);

  if (!me.field.active) {
    return {
      title: '第 1 步：派出主力技師',
      body: hasTechInHand
        ? '把一張技師卡拖到你的戰鬥區。主力技師就是本遊戲的「寶可夢」，用疲勞度承受維修壓力。'
        : '先結束回合抽牌，找到技師卡後派到戰鬥區。沒有主力技師就很難處理故障。',
      tone: 'emerald',
    };
  }

  if (me.field.bench.length === 0) {
    return {
      title: '第 2 步：建立備戰區',
      body: '再派 1 名不同專長的技師到備戰區。遇到不對專長的故障時，可以撤退並換人上場。',
      tone: 'sky',
    };
  }

  if (!me.field.active.attachedToolId && hasToolInHand) {
    return {
      title: '第 3 步：裝備工具卡',
      body: '工具卡會強化技師，就像裝備卡。拖到你的技師區，讓主力技師更能撐住疲勞。',
      tone: 'amber',
    };
  }

  if (faults > 0) {
    return {
      title: '第 4 步：修復故障拿回發電量',
      body: '你的風機有故障。點主力技師的技能，再選擇故障機組；專長相符能減少永久可用率損失。',
      tone: 'rose',
    };
  }

  return {
    title: '本回合目標：提高 12 回合總發電量',
    body: hasItemInHand
      ? '可使用道具卡強化機組或保護風場；完成操作後按「結束回合」讓風場結算發電。'
      : '觀察風速、維持可用率、保留關鍵道具。你的勝利條件是 12 回合累積 MWh 高於 AI。',
    tone: 'emerald',
  };
}

function ClassMissionPanel({ state }: { readonly state: GameState }) {
  const me = state.players[HUMAN];
  const ai = state.players[AI];
  const myFaults = countFaults(state, HUMAN);
  const hasBench = me.field.bench.length > 0;
  const hasTool = !!me.field.active?.attachedToolId || me.field.bench.some((t) => !!t.attachedToolId);
  const lead = me.score - ai.score;
  const missions = [
    { label: '派出主力技師', done: !!me.field.active, hint: '理解戰鬥區' },
    { label: '放置備戰技師', done: hasBench, hint: '建立專長隊伍' },
    { label: '裝備 1 張工具', done: hasTool, hint: '強化主力' },
    { label: '保持故障 ≤ 1', done: myFaults <= 1, hint: '維持可用率' },
    { label: '分數領先 AI', done: lead > 0, hint: `${lead >= 0 ? '+' : ''}${lead.toFixed(1)} MWh` },
  ];

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-3 shadow-xl shadow-cyan-950/10">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-black tracking-[0.24em] text-cyan-200">課堂任務</div>
          <div className="text-[10px] text-cyan-100/60">學生依序完成，老師可用來引導討論</div>
        </div>
        <div className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-bold text-cyan-100">
          {missions.filter((m) => m.done).length}/{missions.length}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-5">
        {missions.map((mission) => (
          <div
            key={mission.label}
            className={`rounded-xl border px-2 py-2 text-center ${
              mission.done ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100' : 'border-slate-700/60 bg-slate-950/35 text-slate-400'
            }`}
          >
            <div className="text-lg">{mission.done ? '✅' : '⬚'}</div>
            <div className="text-[10px] font-black">{mission.label}</div>
            <div className="text-[9px] opacity-70">{mission.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoachPanel({ state }: { readonly state: GameState }) {
  const step = tutorialStep(state);
  const toneClass = {
    emerald: 'border-emerald-400/30 bg-emerald-950/35 text-emerald-100',
    sky: 'border-sky-400/30 bg-sky-950/35 text-sky-100',
    amber: 'border-amber-400/30 bg-amber-950/35 text-amber-100',
    rose: 'border-rose-400/30 bg-rose-950/35 text-rose-100',
  }[step.tone];

  return (
    <div className={`rounded-2xl border p-3 shadow-xl ${toneClass}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl">🎓</div>
        <div>
          <div className="text-sm font-black">{step.title}</div>
          <div className="mt-1 text-xs leading-relaxed opacity-80">{step.body}</div>
        </div>
      </div>
    </div>
  );
}

function HelpModal({ onClose }: { readonly onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-[520] flex items-center justify-center bg-black/70 p-6 backdrop-blur" onClick={onClose}>
      <div className="max-w-3xl rounded-3xl border border-white/10 bg-slate-950 p-6 text-slate-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-black">快速規則：風電戰鬥卡牌</div>
            <div className="text-sm text-slate-400">給課堂 3 分鐘導入用</div>
          </div>
          <button className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold hover:bg-white/20" onClick={onClose}>關閉</button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ['1', '主力技師 = 寶可夢', '戰鬥區只能有 1 名主力技師，負責使用技能修復風機。'],
            ['2', '疲勞度 = 血量', '技能與維修會消耗體力並累積疲勞；疲勞滿了就退場。'],
            ['3', '備戰區 = 換人策略', '準備不同專長技師，遇到葉片、電氣、機械等故障時換上對的人。'],
            ['4', '工具 / 道具 = 戰術卡', '工具裝在技師身上，道具直接支援風機或修復狀態。'],
            ['5', '故障 = 對戰壓力', '環境事件會讓雙方風場受損，修得快的一方累積更多 MWh。'],
            ['6', '勝利條件', '12 回合後累積發電量最高者獲勝。'],
          ].map(([n, title, body]) => (
            <div key={n} className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400 text-sm font-black text-slate-950">{n}</span>
                <span className="font-black">{title}</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BattleScreen({ onTitle, onGameOver }: Props) {
  useLocale();

  const state = useGameStore((s) => s.state);
  const events = useGameStore((s) => s.events);
  const playCard = useGameStore((s) => s.playCard);
  const selectFaultTarget = useGameStore((s) => s.selectFaultTarget);
  const activateSkill = useGameStore((s) => s.activateSkill);
  const pendingSkillTag = useGameStore((s) => s.pendingSkillTag);
  const selectSkillTarget = useGameStore((s) => s.selectSkillTarget);
  const retreat = useGameStore((s) => s.retreat);
  const promoteTech = useGameStore((s) => s.promoteTech);
  const cancelPending = useGameStore((s) => s.cancelPending);
  const endTurn = useGameStore((s) => s.endTurn);
  const newGame = useGameStore((s) => s.newGame);
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const isAiThinking = useGameStore((s) => s.isAiThinking);
  const aiCurrentAction = useGameStore((s) => s.aiCurrentAction);
  const lastRoundScore = useGameStore((s) => s.lastRoundScore);
  const clearLastRoundScore = useGameStore((s) => s.clearLastRoundScore);
  const pendingFaultHandIdx = useGameStore((s) => s.pendingFaultHandIdx);

  const [libOpen, setLibOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [evolutionEvent, setEvolutionEvent] = useState<{ techId: string; level: number } | null>(null);
  const [dragState, setDragState] = useState<DragInfo | null>(null);

  useGameFeedback(HUMAN);
  const insight = useRepairInsight(HUMAN);

  useEffect(() => {
    if (state.gameOver) {
      setTimeout(() => onGameOver(), 1500);
    }
  }, [state.gameOver, onGameOver]);

  useEffect(() => {
    const latestEvent = events[events.length - 1];
    if (latestEvent && latestEvent.kind === 'tech-evolved') {
      setEvolutionEvent({ techId: latestEvent.techId, level: latestEvent.level });
    }
  }, [events]);

  useEffect(() => {
    if (lastRoundScore) {
      const t = setTimeout(() => clearLastRoundScore(), 3000);
      return () => clearTimeout(t);
    }
  }, [lastRoundScore, clearLastRoundScore]);

  const isYourTurn = state.currentPlayer === HUMAN && !isAiThinking;
  const aiHandCount = state.players[AI].hand.length;
  const pendingTarget = pendingFaultHandIdx !== null || pendingSkillTag !== null;
  const pendingCardName = pendingFaultHandIdx !== null ? cardName(state.players[HUMAN].hand[pendingFaultHandIdx]) : null;

  const handleDragEnd = useCallback(
    (drag: DragInfo, dropZone: { zone: 'mine' | 'opp' | null; slot: number | null }) => {
      setDragState(null);
      if (state.gameOver || !isYourTurn) return;
      if (dropZone.zone === 'mine') {
        playCard(drag.handIdx, { targetTechIdx: dropZone.slot !== null ? dropZone.slot : undefined });
      } else {
        cancelPending();
      }
    },
    [state.gameOver, isYourTurn, playCard, cancelPending]
  );

  const handleHandClick = useCallback((handIdx: number) => playCard(handIdx), [playCard]);

  return (
    <div className="relative flex min-h-screen w-full select-none flex-col overflow-x-hidden bg-slate-950 text-gray-100">
      {/* 深色戰場背景（自洽的夜間風場氛圍；不用 ThemeBackground 的白晝雲朵，避免亮暗混搭） */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(56,130,190,0.14), transparent), radial-gradient(ellipse 70% 45% at 85% 105%, rgba(16,120,90,0.1), transparent)',
        }}
      />
      <TopBar
        dark
        difficulty={difficulty}
        onDifficulty={setDifficulty}
        onRestart={() => newGame()}
        onLibrary={() => setLibOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onHelp={() => setHelpOpen(true)}
        onTitle={onTitle}
      />

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 pb-40">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <EnvironmentPanel
            wind={state.wind}
            waveHeight={state.waveHeight}
            roundFaultEvent={(() => {
              // incident 事件欄位是 faultCardId / turbineId；映射成面板期望的 shape（勿用 as any 硬轉）
              const e = [...events].reverse().find((x) => x.kind === 'incident' && x.round === state.round);
              return e && e.kind === 'incident' ? { cardId: e.faultCardId, turbineId: e.turbineId } : null;
            })()}
            round={state.round}
          />
          <CoachPanel state={state} />
        </div>

        <ClassMissionPanel state={state} />

        <section className="rounded-[32px] border border-rose-400/15 bg-rose-950/10 p-4 shadow-2xl shadow-black/20">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <div className="text-xs font-black tracking-[0.28em] text-rose-300">對手場地 AI</div>
              <div className="text-[10px] text-rose-100/50">手牌 {aiHandCount} · 難度 {difficulty.toUpperCase()}</div>
            </div>
            <div className="rounded-full border border-rose-300/20 bg-rose-950/40 px-4 py-1.5 text-sm font-black text-rose-100">
              {state.players[AI].score} MWh
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]" data-zone="play-opp">
            <WindFarmPanel turbines={state.players[AI].windFarm} isPlayer={false} isTargeting={false} />
            <TechField field={state.players[AI].field} isPlayer={false} isYourTurn={false} />
          </div>
        </section>

        <div className="flex items-center justify-center gap-3 py-1 text-xs font-black tracking-[0.22em] text-slate-400">
          <span className="h-px w-24 bg-gradient-to-r from-transparent to-slate-600" />
          <span>VS · 風場運維對戰桌</span>
          <span className="h-px w-24 bg-gradient-to-l from-transparent to-slate-600" />
        </div>

        <section className="rounded-[32px] border border-emerald-400/20 bg-emerald-950/10 p-4 shadow-2xl shadow-black/20" data-zone="play-mine">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <div className="text-xs font-black tracking-[0.28em] text-emerald-300">我的場地 PLAYER</div>
              <div className="text-[10px] text-emerald-100/60">預估本回合發電 {uiPreviewMwh(state, HUMAN)} MWh</div>
            </div>
            <div className="rounded-full border border-emerald-300/20 bg-emerald-950/40 px-4 py-1.5 text-sm font-black text-emerald-100">
              {state.players[HUMAN].score} MWh
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <WindFarmPanel
              turbines={state.players[HUMAN].windFarm}
              isPlayer={true}
              isTargeting={pendingTarget}
              onSelectTarget={(idx) => {
                if (pendingFaultHandIdx !== null) selectFaultTarget(idx);
                else if (pendingSkillTag !== null) selectSkillTarget(idx);
              }}
            />
            <TechField
              field={state.players[HUMAN].field}
              isPlayer={true}
              isYourTurn={isYourTurn}
              pendingSkillTag={pendingSkillTag}
              onActivateSkill={(tag) => {
                const active = state.players[HUMAN].field.active;
                if (active) activateSkill(active.cardId, tag);
              }}
              onRetreat={(idx) => retreat(idx)}
              onPromote={(idx) => promoteTech(idx)}
            />
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 border-t border-slate-700/70 bg-slate-950/90 p-3 shadow-2xl backdrop-blur">
        {pendingTarget && (
          <div className="flex animate-pulse items-center gap-3 rounded-full border border-rose-500/40 bg-rose-950/90 px-4 py-1.5 text-xs font-black text-rose-100 shadow-lg">
            <span>🎯 選擇你的風力機組目標 {pendingCardName ? `｜${pendingCardName}` : ''}</span>
            <button className="rounded bg-rose-800 px-2 py-0.5 text-[10px] text-white hover:bg-rose-700" onClick={cancelPending}>取消</button>
          </div>
        )}

        <div className="flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="hidden min-w-[180px] rounded-2xl border border-slate-700/60 bg-slate-900/60 p-3 text-[10px] font-bold text-slate-400 sm:block">
            <div className="mb-1 text-slate-200">回合提示</div>
            <div>1. 派技師到戰鬥區 / 備戰區</div>
            <div>2. 工具裝備技師，道具選機組</div>
            <div>3. 技能修復故障，結束回合計分</div>
          </div>

          <div className="flex flex-1 justify-center">
            {isYourTurn ? (
              <Hand
                state={state}
                isPlayerTurn={isYourTurn}
                pendingFaultHandIdx={pendingFaultHandIdx}
                onDragEnd={handleDragEnd}
                onCardClick={handleHandClick}
                onDragStateChange={setDragState}
              />
            ) : (
              <div className="flex h-[125px] items-center justify-center rounded-xl border border-dashed border-slate-700/80 bg-slate-900/30 px-12 text-sm italic text-slate-500">
                {isAiThinking ? (
                  <div className="flex items-center gap-3">
                    <span className="animate-spin text-emerald-400">🌀</span>
                    <span>對手 AI 正在行動：{aiCurrentAction || '考慮中...'}</span>
                  </div>
                ) : (
                  '非您的回合，等待對方行動中'
                )}
              </div>
            )}
          </div>

          <div className="flex min-w-[120px] flex-col items-center gap-1.5">
            <button
              className={`rounded-2xl px-5 py-3 text-sm font-black tracking-wide text-white shadow-md transition-all ${
                isYourTurn ? 'bg-rose-600 shadow-rose-950/40 hover:bg-rose-500 hover:shadow-lg' : 'cursor-not-allowed border border-slate-700/50 bg-slate-800 text-slate-500'
              }`}
              onClick={() => {
                if (isYourTurn) endTurn();
              }}
              disabled={!isYourTurn}
            >
              結束回合 ➔
            </button>
            <span className="font-mono text-[9px] text-slate-500">12 回合制</span>
          </div>
        </div>
      </div>

      {dragState && <DragOverlay info={dragState} />}
      {evolutionEvent && <EvolutionFX techId={evolutionEvent.techId} level={evolutionEvent.level} onComplete={() => setEvolutionEvent(null)} />}
      {lastRoundScore && (
        <RoundSummaryToast
          round={lastRoundScore.round}
          myMwh={lastRoundScore.p0Mwh}
          aiMwh={lastRoundScore.p1Mwh}
          myTotal={lastRoundScore.p0Total}
          aiTotal={lastRoundScore.p1Total}
        />
      )}
      {insight && <RepairInsightToast insight={insight.insight} />}
      {libOpen && <LibraryModal onClose={() => setLibOpen(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
