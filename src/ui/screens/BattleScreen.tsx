// ============================================================
// 對戰主畫面：拼裝 TopBar / 對手陣地 / 中央條 / 玩家陣地 / 手牌。
// 接 Zustand store 直接拿狀態與動作；拖曳出牌與目標選取的邏輯都在這裡。
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../../store/game-store';
import { CARDS } from '../../core/cards';
import { useTheme } from '../theme/ThemeContext';
import { ThemeBackground } from '../effects/ThemeBackground';
import { TopBar } from '../components/TopBar';
import { SideLabel } from '../components/SideLabel';
import { ScoreBadge } from '../components/ScoreBadge';
import { BattleCenter } from '../components/BattleCenter';
import { Turbine } from '../components/Turbine';
import { Tech } from '../components/Tech';
import { CardBack } from '../components/CardBack';
import { Hand, DragOverlay } from '../components/Hand';
import type { DragInfo } from '../components/Hand';
import { FaultFlashFX, RepairFX } from '../effects/FaultRepairFX';
import { RoundSummaryToast } from '../effects/RoundSummaryToast';
import { LibraryModal } from '../components/LibraryModal';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { Hourglass, Crosshair } from '../icons';
import { uiPreviewMwh } from '../../store/game-store';
import { t } from '../../i18n';
import { useLocale } from '../locale/LocaleContext';
import { useOrientation } from '../stage/useOrientation';

interface Props {
  readonly onTitle: () => void;
  readonly onGameOver: () => void;
}

export function BattleScreen({ onTitle, onGameOver }: Props) {
  const { theme, themeKey } = useTheme();
  useLocale(); // 訂閱語言切換，觸發重新渲染
  const isPortrait = useOrientation() === 'portrait';

  const state = useGameStore((s) => s.state);
  const pendingFaultHandIdx = useGameStore((s) => s.pendingFaultHandIdx);
  const playCard = useGameStore((s) => s.playCard);
  const selectFaultTarget = useGameStore((s) => s.selectFaultTarget);
  const cancelPending = useGameStore((s) => s.cancelPending);
  const endTurn = useGameStore((s) => s.endTurn);
  const newGame = useGameStore((s) => s.newGame);
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const isAiThinking = useGameStore((s) => s.isAiThinking);
  const lastRoundScore = useGameStore((s) => s.lastRoundScore);
  const clearLastRoundScore = useGameStore((s) => s.clearLastRoundScore);
  const effects = useGameStore((s) => s.effects);
  const windRolling = useGameStore((s) => s.windRolling);
  const setWindRolling = useGameStore((s) => s.setWindRolling);

  const [showLibrary, setShowLibrary] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);

  const me = state.players[0];
  const opp = state.players[1];
  const isMyTurn = state.currentPlayer === 0 && !isAiThinking && !state.gameOver;

  // 進入遊戲結束畫面
  useEffect(() => {
    if (state.gameOver) {
      // 結局畫面由 GameOver 顯示；保留一點延遲讓最後 toast 收尾
      const t = window.setTimeout(() => onGameOver(), 800);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [state.gameOver, onGameOver]);

  // 回合結算 toast 3 秒自動消失
  useEffect(() => {
    if (!lastRoundScore) return;
    const t = window.setTimeout(() => clearLastRoundScore(), 3000);
    return () => window.clearTimeout(t);
  }, [lastRoundScore, clearLastRoundScore]);

  // 新回合 → 風速骰滾動動畫（state.round 變化即觸發）
  useEffect(() => {
    setWindRolling(true);
    const t = window.setTimeout(() => setWindRolling(false), 1200);
    return () => window.clearTimeout(t);
  }, [state.round, setWindRolling]);

  // 機組數值 — MW 合計
  const myMw = me.turbines.reduce((s, t) => s + ((CARDS[t.cardId].stats?.mw ?? 0) + t.mwBonus), 0);
  const aiMw = opp.turbines.reduce((s, t) => s + ((CARDS[t.cardId].stats?.mw ?? 0) + t.mwBonus), 0);
  const myFaulted = me.turbines.some((t) => t.faults.length > 0);
  const aiFaulted = opp.turbines.some((t) => t.faults.length > 0);
  const myPreview = uiPreviewMwh(state, 0);

  // 拖曳結束：依卡類 + 落點判定動作
  const onDragEnd = useCallback(
    (info: DragInfo, drop: { zone: 'mine' | 'opp' | null; slot: number | null }) => {
      const card = CARDS[info.cardId];
      if (!card) return;
      if (!isMyTurn) return;
      if (card.type === 'fault') {
        // 拖到對手機組格 → 直接出牌
        if (drop.zone === 'opp' && drop.slot != null && opp.turbines[drop.slot] && !opp.turbines[drop.slot].shutdown) {
          playCard(info.handIdx, { target: drop.slot });
        } else {
          // 否則進入點擊式選擇模式（playCard 內部會處理 pendingFaultHandIdx）
          playCard(info.handIdx);
        }
        return;
      }
      // turbine / tech / func / weather / contract：丟到自己場地即出牌
      if (drop.zone === 'mine') {
        playCard(info.handIdx);
      }
      // 落點不對 → 不做事，等同回原位
    },
    [isMyTurn, playCard, opp.turbines],
  );

  // 玩家點擊（不拖曳）— 點手牌時也試出
  const onCardClick = useCallback(
    (handIdx: number) => {
      if (!isMyTurn) return;
      playCard(handIdx);
    },
    [isMyTurn, playCard],
  );

  // 一次性視覺特效（故障/修復）渲染：找到對應 turbine 區塊的 DOM rect
  // 由於 Stage 已 scale，rect 需轉成 stage 座標。
  const renderEffects = (sideKey: 'me' | 'opp') => {
    const stateSide: 0 | 1 = sideKey === 'me' ? 0 : 1;
    return effects
      .filter((e) => e.target.side === stateSide)
      .map((e) => {
        const slotEl = document.querySelector(
          `[data-zone="play-${sideKey === 'me' ? 'mine' : 'opp'}"] [data-slot="${e.target.slot}"]`,
        );
        if (!slotEl) return null;
        const rect = slotEl.getBoundingClientRect();
        const stage = (window as Window & { wfViewportToStage?: (x: number, y: number) => { x: number; y: number } })
          .wfViewportToStage?.(rect.left, rect.top);
        const scale = (window as Window & { wfStageScale?: number }).wfStageScale ?? 1;
        return (
          <div
            key={e.id}
            style={{
              position: 'absolute',
              left: stage?.x ?? rect.left,
              top: stage?.y ?? rect.top,
              width: rect.width / scale,
              height: rect.height / scale,
              pointerEvents: 'none',
              zIndex: 200,
            }}
          >
            {e.type === 'fault' && <FaultFlashFX cardId={e.target.cardId} />}
            {e.type === 'repair' && <RepairFX />}
          </div>
        );
      });
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: theme.bgRoot,
        color: theme.textPrimary,
        fontFamily: theme.fontUI,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ThemeBackground />

      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 1 }}>
        <TopBar
          difficulty={difficulty}
          onDifficulty={setDifficulty}
          onLibrary={() => setShowLibrary(true)}
          onRestart={() => newGame()}
          onTitle={onTitle}
          onTheme={() => setShowTheme(true)}
        />

        {/* 中段三區：直向時垂直置中平均分佈，橫向時沿用上緣對齊 */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isPortrait ? 'space-evenly' : 'flex-start',
          }}
        >
          {/* 對手列 */}
          <div
            style={{
              padding: isPortrait ? '10px 12px 8px' : '14px 28px 10px',
              display: 'flex',
              flexDirection: isPortrait ? 'column' : 'row',
              alignItems: isPortrait ? 'stretch' : 'flex-start',
              gap: isPortrait ? 10 : 18,
              background: theme.bgOpponent,
              borderBottom: themeKey === 'tideboard' ? '1px solid rgba(168,69,58,0.3)' : '1px solid rgba(168,91,74,0.1)',
            }}
          >
            {/* 資訊橫條（直向時 SideLabel 左、分數牌右） */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: isPortrait ? 'space-between' : 'flex-start',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SideLabel
                  side="opp"
                  hand={opp.hand.length}
                  deck={opp.deck.length}
                  mw={aiMw}
                  faulted={aiFaulted}
                  aiThinking={isAiThinking}
                  active={state.currentPlayer === 1 && !isAiThinking}
                />
                <div style={{ display: 'flex', marginLeft: -2 }}>
                  {Array.from({ length: opp.hand.length }, (_, i) => (
                    <CardBack
                      key={i}
                      size={36}
                      style={{
                        marginLeft: i === 0 ? 0 : -22,
                        transform: `rotate(${(i - opp.hand.length / 2 + 0.5) * 4}deg)`,
                      }}
                    />
                  ))}
                </div>
              </div>
              {isPortrait && <ScoreBadge side="opp" label="AI" score={opp.score} active={state.currentPlayer === 1} />}
            </div>
            <div
              data-zone="play-opp"
              style={{
                flex: isPortrait ? '0 0 auto' : 1,
                display: 'flex',
                gap: isPortrait ? 10 : 16,
                justifyContent: 'center',
                padding: '6px 0',
                borderRadius: 16,
                background:
                  pendingFaultHandIdx !== null || (dragInfo && CARDS[dragInfo.cardId]?.type === 'fault')
                    ? 'rgba(217,108,90,0.08)'
                    : 'transparent',
                boxShadow:
                  pendingFaultHandIdx !== null || (dragInfo && CARDS[dragInfo.cardId]?.type === 'fault')
                    ? 'inset 0 0 0 2px rgba(217,108,90,0.4)'
                    : 'none',
                transition: 'all 0.2s',
              }}
            >
              {[0, 1, 2].map((slot) => {
                const tu = opp.turbines[slot];
                return (
                  <div key={slot} data-slot={slot}>
                    <Turbine
                      turbine={tu}
                      empty={!tu}
                      targeted={pendingFaultHandIdx !== null && !!tu && !tu.shutdown}
                      onClick={pendingFaultHandIdx !== null && tu && !tu.shutdown ? () => selectFaultTarget(slot) : undefined}
                    />
                  </div>
                );
              })}
            </div>
            {!isPortrait && <ScoreBadge side="opp" label="AI" score={opp.score} active={state.currentPlayer === 1} />}
          </div>

          {/* 中央條 */}
          <BattleCenter state={state} windRolling={windRolling} />

          {/* 玩家列 */}
          <div
            style={{
              padding: isPortrait ? '8px 12px 6px' : '10px 28px 6px',
              display: 'flex',
              flexDirection: isPortrait ? 'column' : 'row',
              alignItems: isPortrait ? 'stretch' : 'flex-start',
              gap: isPortrait ? 10 : 18,
              background: theme.bgPlayer,
              borderTop: themeKey === 'tideboard' ? '1px solid rgba(232,200,120,0.2)' : '1px solid rgba(58,167,200,0.1)',
            }}
          >
            {/* 資訊橫條（直向時分數牌左、SideLabel 右） */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: isPortrait ? 'space-between' : 'flex-start',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <ScoreBadge side="me" label={t('side.you')} score={me.score} preview={myPreview} active={isMyTurn} />
              {isPortrait && (
                <SideLabel side="me" hand={me.hand.length} deck={me.deck.length} mw={myMw} faulted={myFaulted} active={isMyTurn} />
              )}
            </div>
            <div
              style={{
                flex: isPortrait ? '0 0 auto' : 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <div
                data-zone="play-mine"
                style={{
                  display: 'flex',
                  gap: isPortrait ? 10 : 16,
                  padding: '6px 16px',
                  borderRadius: 16,
                  background:
                    dragInfo && CARDS[dragInfo.cardId]?.type !== 'fault'
                      ? themeKey === 'tideboard'
                        ? 'rgba(232,200,120,0.12)'
                        : 'rgba(58,167,200,0.08)'
                      : 'transparent',
                  boxShadow:
                    dragInfo && CARDS[dragInfo.cardId]?.type !== 'fault'
                      ? `inset 0 0 0 2px ${themeKey === 'tideboard' ? 'rgba(232,200,120,0.5)' : 'rgba(58,167,200,0.4)'}`
                      : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {[0, 1, 2].map((slot) => {
                  const tu = me.turbines[slot];
                  return (
                    <div key={slot} data-slot={slot}>
                      <Turbine turbine={tu} empty={!tu} />
                    </div>
                  );
                })}
              </div>
              {me.techs.length > 0 && (
                <div style={{ display: 'flex', gap: 10, marginTop: themeKey === 'tideboard' ? 14 : 0 }}>
                  {me.techs.map((id) => (
                    <Tech key={id} techId={id} />
                  ))}
                </div>
              )}
            </div>
            {!isPortrait && (
              <SideLabel side="me" hand={me.hand.length} deck={me.deck.length} mw={myMw} faulted={myFaulted} active={isMyTurn} />
            )}
          </div>
        </div>

        {/* 手牌列 */}
        <div
          style={{
            padding: isPortrait ? '8px 10px 14px' : '10px 28px 18px',
            position: 'relative',
            background:
              themeKey === 'tideboard'
                ? 'linear-gradient(180deg, transparent 0%, rgba(40,25,15,0.6) 100%)'
                : 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.3) 100%)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          {/* 目標選取提示 */}
          {pendingFaultHandIdx !== null && (
            <div
              style={{
                position: 'absolute',
                top: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '7px 16px',
                background:
                  themeKey === 'tideboard' ? 'linear-gradient(180deg, #d96c5a, #a8453a)' : 'rgba(217,108,90,0.95)',
                border: themeKey === 'tideboard' ? '1.5px solid #f4d68a' : 'none',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: themeKey === 'tideboard' ? 0 : 999,
                boxShadow: '0 6px 16px rgba(217,108,90,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 5,
                fontFamily: theme.fontUI,
              }}
            >
              <Crosshair size={14} stroke="#fff" />
              {t('drag.fault')}
              <button
                type="button"
                onClick={cancelPending}
                style={{
                  marginLeft: 8,
                  background: 'rgba(0,0,0,0.2)',
                  border: 'none',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* 拖曳提示 */}
          {dragInfo && (
            <div
              style={{
                position: 'absolute',
                top: -32,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '6px 14px',
                background: themeKey === 'tideboard' ? 'linear-gradient(180deg, #6e4a18, #3d2a1e)' : 'rgba(28,42,58,0.85)',
                border: themeKey === 'tideboard' ? '1.5px solid #c89848' : 'none',
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 999,
                zIndex: 5,
              }}
            >
              {CARDS[dragInfo.cardId]?.type === 'fault' ? t('drag.fault') : t('drag.deploy')}
            </div>
          )}

          <Hand
            state={state}
            isPlayerTurn={isMyTurn}
            pendingFaultHandIdx={pendingFaultHandIdx}
            onDragEnd={onDragEnd}
            onCardClick={onCardClick}
            onDragStateChange={setDragInfo}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <button
              type="button"
              onClick={() => isMyTurn && endTurn()}
              disabled={!isMyTurn}
              style={{
                padding: themeKey === 'tideboard' ? '14px 22px' : '14px 26px',
                background: !isMyTurn
                  ? themeKey === 'tideboard'
                    ? 'linear-gradient(180deg, #4a3018, #2a1810)'
                    : 'rgba(28,42,58,0.2)'
                  : themeKey === 'tideboard'
                    ? 'linear-gradient(180deg, #e8c878, #c89848 50%, #8a6028)'
                    : 'linear-gradient(180deg, #d9a85a 0%, #b8893f 100%)',
                color: !isMyTurn ? 'rgba(255,255,255,0.5)' : themeKey === 'tideboard' ? '#3d2a1e' : '#fff',
                border: themeKey === 'tideboard' ? '2px solid #3d2a1e' : 'none',
                borderRadius: themeKey === 'tideboard' ? 6 : 14,
                fontFamily: themeKey === 'tideboard' ? '"Cinzel", Georgia, serif' : theme.fontUI,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: '0.1em',
                boxShadow: !isMyTurn ? 'none' : '0 6px 18px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
                cursor: isMyTurn ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Hourglass size={15} stroke="currentColor" />
              {isAiThinking ? t('ui.aiTurn') : t('ui.endTurn')}
            </button>
            <div style={{ fontSize: 10, color: theme.textSecondary, fontFamily: theme.fontUI }}>
              {t('ui.actionsRemain', { n: state.actionsLeft })}
            </div>
          </div>
        </div>
      </div>

      {/* 故障/修復特效層 */}
      {renderEffects('me')}
      {renderEffects('opp')}

      {/* 拖曳浮動 overlay */}
      {dragInfo && <DragOverlay info={dragInfo} />}

      {/* 颱風橫幅 */}
      {state.wind.typhoon && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(circle at center, rgba(217,108,90,0.08) 0%, transparent 70%)',
            animation: 'wf-fade-in 0.5s ease-out both',
            zIndex: 50,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '30%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 64,
              fontWeight: 800,
              color: '#d96c5a',
              textShadow: '0 0 24px rgba(217,108,90,0.6)',
              animation: 'wf-fade-in 0.8s ease-out both',
              letterSpacing: '0.2em',
              fontFamily: themeKey === 'tideboard' ? '"Cinzel", Georgia, serif' : theme.fontDisplay,
            }}
          >
            {t('typhoon.alert')}
          </div>
        </div>
      )}

      {/* 回合結算 toast */}
      {lastRoundScore && (
        <RoundSummaryToast
          round={lastRoundScore.round}
          myMwh={lastRoundScore.p0Mwh}
          aiMwh={lastRoundScore.p1Mwh}
          myTotal={lastRoundScore.p0Total}
          aiTotal={lastRoundScore.p1Total}
        />
      )}

      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} />}
      {showTheme && <ThemeSwitcher onClose={() => setShowTheme(false)} />}
    </div>
  );
}
