// ============================================================
// 對戰主畫面 v2.0：技師經營模式
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { useGameStore, uiPreviewMwh } from '../../store/game-store';
import { ThemeBackground } from '../effects/ThemeBackground';
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

interface Props {
  readonly onTitle: () => void;
  readonly onGameOver: () => void;
}

const HUMAN = 0;
const AI = 1;

export function BattleScreen({ onTitle, onGameOver }: Props) {
  useLocale(); // 訂閱語言切換，觸發重新渲染

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

  // 彈窗狀態
  const [libOpen, setLibOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 記錄最後一個升級事件以顯示 EvolutionFX
  const [evolutionEvent, setEvolutionEvent] = useState<{ techId: string; level: number } | null>(null);
  
  // 記錄拖曳狀態
  const [dragState, setDragState] = useState<DragInfo | null>(null);

  // 音效反饋與教學洞察 hook
  useGameFeedback(HUMAN);
  const insight = useRepairInsight(HUMAN);

  // 監聽遊戲結束
  useEffect(() => {
    if (state.gameOver) {
      setTimeout(() => {
        onGameOver();
      }, 1500);
    }
  }, [state.gameOver, onGameOver]);

  // 監聽技師升級事件
  useEffect(() => {
    const latestEvent = events[events.length - 1];
    if (latestEvent && latestEvent.kind === 'tech-evolved') {
      setEvolutionEvent({
        techId: latestEvent.techId,
        level: latestEvent.level,
      });
    }
  }, [events]);

  // 3秒後自動關閉回合結算
  useEffect(() => {
    if (lastRoundScore) {
      const t = setTimeout(() => {
        clearLastRoundScore();
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [lastRoundScore, clearLastRoundScore]);

  const p1HandCount = state.players[AI].hand.length;

  const isYourTurn = state.currentPlayer === HUMAN && !isAiThinking;

  // 拖曳結束處理
  const handleDragEnd = useCallback(
    (drag: DragInfo, dropZone: { zone: 'mine' | 'opp' | null; slot: number | null }) => {
      setDragState(null);
      if (state.gameOver || !isYourTurn) return;
      if (dropZone.zone === 'mine') {
        // 工具卡裝備到指定技師槽位
        playCard(drag.handIdx, { targetTechIdx: dropZone.slot !== null ? dropZone.slot : undefined });
      } else {
        cancelPending();
      }
    },
    [state.gameOver, isYourTurn, playCard, cancelPending]
  );


  return (
    <div className="relative w-full min-h-screen text-gray-100 flex flex-col font-sans select-none overflow-x-hidden">
      <ThemeBackground />

      {/* 1. 頂部狀態列 */}
      <TopBar
        difficulty={difficulty}
        onDifficulty={setDifficulty}
        onRestart={() => newGame()}
        onLibrary={() => setLibOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onTitle={onTitle}
      />

      {/* 2. 主版面：左右分欄或上下堆疊 */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 max-w-7xl mx-auto w-full pb-36">
        {/* 左側：環境監控與對手陣容 */}
        <div className="flex-[3] flex flex-col gap-6">
          {/* 環境監控 */}
          <EnvironmentPanel
            wind={state.wind}
            waveHeight={state.waveHeight}
            roundFaultEvent={
              events.reverse().find((e) => e.kind === 'incident' && e.round === state.round) as any || null
            }
            round={state.round}
          />

          {/* 對手陣容 (風場與技師) */}
          <div className="flex flex-col gap-4 bg-red-950/5 border border-red-900/10 rounded-2xl p-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-extrabold text-red-400 tracking-widest uppercase">
                對手運維風場 (AI - {difficulty.toUpperCase()})
              </span>
              <span className="text-xs font-bold text-red-300 font-mono">
                Score: {state.players[AI].score} MWh ({p1HandCount} Cards)
              </span>
            </div>
            
            <WindFarmPanel
              turbines={state.players[AI].windFarm}
              isPlayer={false}
              isTargeting={false}
            />

            <TechField
              field={state.players[AI].field}
              isPlayer={false}
              isYourTurn={false}
            />
          </div>
        </div>

        {/* 右側：我的風場與我的技師 */}
        <div className="flex-[4] flex flex-col gap-6">
          <div className="flex flex-col gap-4 bg-emerald-950/5 border border-emerald-900/10 rounded-2xl p-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-extrabold text-emerald-400 tracking-widest uppercase">
                我的運維風場 (Player)
              </span>
              <div className="flex gap-4 items-center">
                <span className="text-xs font-semibold text-emerald-500">
                  預估發電: {uiPreviewMwh(state, HUMAN)} MWh
                </span>
                <span className="text-xs font-bold text-emerald-300 font-mono">
                  Score: {state.players[HUMAN].score} MWh
                </span>
              </div>
            </div>

            {/* 我的風場 (如果是道具卡或技能需要選取目標，isTargeting 設為 true) */}
            <WindFarmPanel
              turbines={state.players[HUMAN].windFarm}
              isPlayer={true}
              isTargeting={pendingFaultHandIdx !== null || pendingSkillTag !== null}
              onSelectTarget={(idx) => {
                if (pendingFaultHandIdx !== null) {
                  selectFaultTarget(idx);
                } else if (pendingSkillTag !== null) {
                  selectSkillTarget(idx);
                }
              }}
            />

            {/* 我的技師 */}
            <TechField
              field={state.players[HUMAN].field}
              isPlayer={true}
              isYourTurn={isYourTurn}
              pendingSkillTag={pendingSkillTag}
              onActivateSkill={(tag) => {
                const active = state.players[HUMAN].field.active;
                if (active) {
                  activateSkill(active.cardId, tag);
                }
              }}
              onRetreat={(idx) => retreat(idx)}
              onPromote={(idx) => promoteTech(idx)}
            />
          </div>
        </div>
      </div>

      {/* 3. 底部手牌與控制區 */}
      <div className="fixed bottom-0 inset-x-0 bg-gray-950/80 backdrop-blur border-t border-gray-800 z-30 p-3 shadow-2xl flex flex-col gap-2 items-center">
        {/* 選取目標提示 */}
        {(pendingFaultHandIdx !== null || pendingSkillTag !== null) && (
          <div className="bg-rose-950/80 border border-rose-800/40 text-rose-200 text-xs font-bold px-4 py-1.5 rounded-full flex gap-3 items-center animate-bounce shadow-lg">
            <span>🎯 請點擊選擇我的風力發電機組以施放技能或道具</span>
            <button
              className="px-2 py-0.5 bg-rose-900 hover:bg-rose-800 rounded text-[10px] text-white"
              onClick={cancelPending}
            >
              取消
            </button>
          </div>
        )}

        <div className="max-w-7xl w-full flex items-center justify-between gap-4">
          {/* 行動標記說明 */}
          <div className="hidden sm:flex flex-col gap-1 text-[10px] text-gray-400 font-semibold bg-gray-900/50 border border-gray-800 rounded-lg p-2 min-w-[150px]">
            <div className="flex justify-between">
              <span>👥 技師限制 (Supporter)</span>
              <span className={state.players[HUMAN].toolPlayedThisTurn ? 'text-gray-500' : 'text-emerald-400'}>
                {state.players[HUMAN].toolPlayedThisTurn ? '已使用' : '可使用'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>⚙️ 工具限制 (Tool)</span>
              <span className={state.players[HUMAN].toolPlayedThisTurn ? 'text-gray-500' : 'text-emerald-400'}>
                {state.players[HUMAN].toolPlayedThisTurn ? '已使用' : '可使用'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>🔄 撤退限制 (Retreat)</span>
              <span className={state.players[HUMAN].retreatedThisTurn ? 'text-gray-500' : 'text-emerald-400'}>
                {state.players[HUMAN].retreatedThisTurn ? '已使用' : '可使用'}
              </span>
            </div>
          </div>

          {/* 手牌組件 */}
          <div className="flex-1 flex justify-center">
            {isYourTurn ? (
              <Hand
                state={state}
                isPlayerTurn={isYourTurn}
                pendingFaultHandIdx={pendingFaultHandIdx}
                onDragEnd={handleDragEnd}
                onDragStateChange={setDragState}
              />
            ) : (
              <div className="h-[125px] flex items-center justify-center text-gray-500 italic text-sm border border-dashed border-gray-800/80 rounded-xl px-12 bg-gray-900/10">
                {isAiThinking ? (
                  <div className="flex items-center gap-3">
                    <span className="animate-spin text-emerald-400">🌀</span>
                    <span>對手 AI 正在行動: {aiCurrentAction || '考慮中...'}</span>
                  </div>
                ) : (
                  '非您的回合，等待對方行動中'
                )}
              </div>
            )}
          </div>

          {/* 結束回合按鈕 */}
          <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
            <button
              className={`px-5 py-3 rounded-xl font-bold text-sm text-white tracking-wide shadow-md transition-all ${
                isYourTurn
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40 hover:shadow-lg'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50'
              }`}
              onClick={() => {
                if (isYourTurn) endTurn();
              }}
              disabled={!isYourTurn}
            >
              結束回合 ➔
            </button>
            <span className="text-[9px] text-gray-500 font-mono">12 回合制</span>
          </div>
        </div>
      </div>

      {/* 4. 各類動態特效與彈窗 */}
      {dragState && <DragOverlay info={dragState} />}

      {/* 升級進化特效 */}
      {evolutionEvent && (
        <EvolutionFX
          techId={evolutionEvent.techId}
          level={evolutionEvent.level}
          onComplete={() => setEvolutionEvent(null)}
        />
      )}

      {/* 回合結算摘要 */}
      {lastRoundScore && (
        <RoundSummaryToast
          round={lastRoundScore.round}
          myMwh={lastRoundScore.p0Mwh}
          aiMwh={lastRoundScore.p1Mwh}
          myTotal={lastRoundScore.p0Total}
          aiTotal={lastRoundScore.p1Total}
        />
      )}

      {/* 教學修復評估彈窗 */}
      {insight && (
        <RepairInsightToast insight={insight.insight} />
      )}

      {/* 圖鑑 & 設定彈窗 */}
      {libOpen && <LibraryModal onClose={() => setLibOpen(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
