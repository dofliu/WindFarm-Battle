// ============================================================
// 對戰主畫面（同題競賽版面 R1）：TopBar / 頂條(回合·風速·動作) / 上下兩半(左技師舞台·右風場面板) / 手牌。
// 去掉「中間」；風場移到右側資訊面板，技師與招式成為左側主舞台。
// 接 Zustand store 直接拿狀態與動作；拖曳出牌與目標選取的邏輯都在這裡。
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../../store/game-store';
import { CARDS } from '../../core/cards';
import { useTheme } from '../theme/ThemeContext';
import { ThemeBackground } from '../effects/ThemeBackground';
import { TopBar } from '../components/TopBar';
import { BattleCenter } from '../components/BattleCenter';
import { FarmStatsPanel, TurbineStage } from '../components/FarmPanel';
import { Tech } from '../components/Tech';
import { Hand, DragOverlay } from '../components/Hand';
import { CardBack } from '../components/CardBack';
import type { DragInfo } from '../components/Hand';
import { FaultFlashFX, RepairFX } from '../effects/FaultRepairFX';
import { RoundSummaryToast } from '../effects/RoundSummaryToast';
import { LibraryModal } from '../components/LibraryModal';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { SettingsModal } from '../components/SettingsModal';
import { RepairInsightToast } from '../components/RepairInsightToast';
import { useGameFeedback } from '../audio/useGameFeedback';
import { useRepairInsight } from '../learning/useRepairInsight';
import { Hourglass, Crosshair } from '../icons';
import { uiPreviewMwh } from '../../store/game-store';
import { canRetreat } from '../../core/actions';
import { comboTier, MAX_TECHS, techSkills, techSkillDef, techAbilityTag } from '../../core/rules-engine';
import { t, cardName, abilityName } from '../../i18n';
import { useLocale } from '../locale/LocaleContext';
import { useOrientation } from '../stage/useOrientation';

interface Props {
  readonly onTitle: () => void;
  readonly onGameOver: () => void;
}

/** R3 共享資源圖示 */
const RES_ICON: Record<string, string> = {
  'spare-part': '🔧',
  'crane': '🏗️',
  'grid-priority': '⚡',
};

/** 對手手牌背面顯示（只顯示數量） */
function OppHandBack({ count }: { readonly count: number }) {
  const { theme, themeKey } = useTheme();
  const isTide = themeKey === 'tideboard';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '6px 8px',
        borderRadius: isTide ? 6 : 12,
        background: isTide ? 'rgba(40,25,15,0.55)' : 'rgba(255,255,255,0.55)',
        border: `1px solid ${theme.border}`,
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ fontSize: 8, color: theme.textSecondary, letterSpacing: '0.08em', fontFamily: theme.fontUI, textTransform: 'uppercase' }}>
        對手手牌
      </div>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {Array.from({ length: count }, (_, i) => (
          <CardBack key={i} size={22} />
        ))}
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: theme.textPrimary, textAlign: 'center', fontFamily: theme.fontUI }}>
        {count} 張
      </div>
    </div>
  );
}

export function BattleScreen({ onTitle, onGameOver }: Props) {
  const { theme, themeKey } = useTheme();
  useLocale(); // 訂閱語言切換，觸發重新渲染
  const isPortrait = useOrientation() === 'portrait';

  const state = useGameStore((s) => s.state);
  const pendingFaultHandIdx = useGameStore((s) => s.pendingFaultHandIdx);
  const playCard = useGameStore((s) => s.playCard);
  const selectFaultTarget = useGameStore((s) => s.selectFaultTarget);
  const activateSkill = useGameStore((s) => s.activateSkill);
  const pendingSkillTechId = useGameStore((s) => s.pendingSkillTechId);
  const pendingSkillTag = useGameStore((s) => s.pendingSkillTag);
  const selectSkillTarget = useGameStore((s) => s.selectSkillTarget);
  const grabResource = useGameStore((s) => s.grabResource);
  const retreat = useGameStore((s) => s.retreat);
  const pendingResourceId = useGameStore((s) => s.pendingResourceId);
  const selectResourceTarget = useGameStore((s) => s.selectResourceTarget);
  const cancelPending = useGameStore((s) => s.cancelPending);
  const endTurn = useGameStore((s) => s.endTurn);
  const newGame = useGameStore((s) => s.newGame);
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const isAiThinking = useGameStore((s) => s.isAiThinking);
  const lastRoundScore = useGameStore((s) => s.lastRoundScore);
  const clearLastRoundScore = useGameStore((s) => s.clearLastRoundScore);
  const effects = useGameStore((s) => s.effects);
  const events = useGameStore((s) => s.events);
  const windRolling = useGameStore((s) => s.windRolling);
  const setWindRolling = useGameStore((s) => s.setWindRolling);

  // R2 同題：本回合共享環境事件（供頂部橫幅顯示）
  const incident = [...events].reverse().find((e) => e.kind === 'incident' && e.round === state.round);
  const incidentName = incident && incident.kind === 'incident' ? cardName(incident.faultCardId) || incident.faultCardId : null;

  const [showLibrary, setShowLibrary] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);

  // 手感回饋：事件流 → 音效 + 螢幕震動（玩家＝side 0）
  const { shakeKey } = useGameFeedback(0);
  // 教學：維修時的知識-效益即時解說（受 settings.teachingTips 控制）
  const repairInsight = useRepairInsight(0);
  const [shakeClass, setShakeClass] = useState('');
  useEffect(() => {
    if (!shakeKey) return undefined;
    // 先清空再於下一幀掛上 → 連續受擊也能每次重播動畫
    setShakeClass('');
    const raf = window.requestAnimationFrame(() => setShakeClass('wf-shake'));
    const timer = window.setTimeout(() => setShakeClass(''), 460);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [shakeKey]);

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

  const myPreview = uiPreviewMwh(state, 0);
  const myHasFault = me.turbines.some((tu) => tu.faults.length > 0);

  // 拖曳結束：依卡類 + 落點判定動作
  const onDragEnd = useCallback(
    (info: DragInfo, drop: { zone: 'mine' | 'opp' | null; slot: number | null }) => {
      const card = CARDS[info.cardId];
      if (!card) return;
      if (!isMyTurn) return;
      if (card.type === 'fault') {
        // 寶可夢式規則：唯一合法目標＝對手主力機組。拖到對手主力格才帶明確 target；
        // 拖到對手場地其他位置（含備戰區）一律落回自動解析（playCard 會鎖定對手主力，
        // 備戰區免疫故障目標，不可把 target 設成備戰區索引，否則會白白浪費手牌與動作）。
        if (
          drop.zone === 'opp' &&
          drop.slot != null &&
          drop.slot === opp.activeTurbineIdx &&
          opp.turbines[drop.slot] &&
          !opp.turbines[drop.slot].shutdown
        ) {
          playCard(info.handIdx, { target: drop.slot });
        } else if (drop.zone === 'opp') {
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
    [isMyTurn, playCard, opp.turbines, opp.activeTurbineIdx],
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

  // 一半 = 戰場（主力大格 + 備戰區）+ 風場資訊窄側欄。
  // 新版面：左右側欄只顯示風場統計資訊；技師列表移到戰鬥區內部。
  const renderHalf = (sideKey: 'me' | 'opp') => {
    const p = sideKey === 'me' ? me : opp;
    const active = sideKey === 'me' ? isMyTurn : state.currentPlayer === 1 && !isAiThinking;
    const faultTargeting = sideKey === 'opp' && pendingFaultHandIdx !== null;
    const skillTargeting = sideKey === 'me' && pendingSkillTechId !== null;
    const resourceTargeting = sideKey === 'me' && pendingResourceId !== null;
    const dropActive =
      !!dragInfo &&
      (sideKey === 'opp' ? CARDS[dragInfo.cardId]?.type === 'fault' : CARDS[dragInfo.cardId]?.type !== 'fault');

    // 側欄：只顯示風場統計資訊（移除技師列表）
    const sidebar = (
      <div
        style={{
          width: isPortrait ? 108 : 140,
          flexShrink: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          overflowY: 'auto',
        }}
      >
        <FarmStatsPanel
          side={sideKey}
          player={p}
          score={p.score}
          previewMwh={sideKey === 'me' ? myPreview : undefined}
          active={active}
          compact={isPortrait}
        />
        {/* 對手手牌數量（背面）顯示 */}
        {sideKey === 'opp' && opp.hand.length > 0 && (
          <OppHandBack count={opp.hand.length} />
        )}
      </div>
    );

    // 技師區：顯示在戰鬥區內部（主力左右各一側）
    const techsPanel = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 8, letterSpacing: '0.1em', color: theme.textSecondary, textTransform: 'uppercase', fontFamily: theme.fontUI }}>
            {t('farm.techsTitle')} {p.techs.length}/{MAX_TECHS}
          </span>
          {comboTier(p) > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                padding: '1px 6px',
                borderRadius: 999,
                fontSize: 8,
                fontWeight: 800,
                color: '#fff',
                background: comboTier(p) >= 2 ? 'linear-gradient(180deg,#d9a85a,#b8893f)' : 'linear-gradient(180deg,#5db58c,#2a8a5a)',
              }}
              title={comboTier(p) >= 2 ? t('combo.trioHint') : t('combo.duoHint')}
            >
              ❆ {comboTier(p) >= 2 ? t('combo.trio') : t('combo.duo')}
            </span>
          )}
        </div>
        {p.techs.length === 0 ? (
          <div
            style={{
              fontSize: 9,
              color: theme.textSecondary,
              padding: '6px 8px',
              border: `1.5px dashed ${theme.border}`,
              borderRadius: 8,
              fontFamily: theme.fontUI,
              textAlign: 'center',
            }}
          >
            {t('farm.noTech')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {p.techs.map((id) => {
              const abilTag = techAbilityTag(id);
              const abilityLabel = abilTag ? abilityName(id, 0) : undefined;
              if (sideKey === 'opp') return <Tech key={id} techId={id} abilityLabel={abilityLabel} />;
              const used = me.usedSkillThisRound.includes(id);
              const skills = techSkills(id).map((def) => ({
                tag: def.tag,
                label: t(`skill.${def.tag}` as Parameters<typeof t>[0]),
                ready: isMyTurn && !used && (def.targetKind === 'ownFault' ? myHasFault : true),
                onUse: () => activateSkill(id, def.tag),
              }));
              return <Tech key={id} techId={id} skills={skills} skillUsed={used} abilityLabel={abilityLabel} />;
            })}
          </div>
        )}
      </div>
    );

    const stage = (
      <TurbineStage
        side={sideKey}
        player={p}
        reverseOrder={sideKey === 'opp'}
        activeSize={isPortrait ? 104 : 156}
        benchSize={isPortrait ? 64 : 92}
        dropActive={dropActive}
        isSlotTargetable={(slot) => {
          const tu = p.turbines[slot];
          if (!tu) return false;
          // 寶可夢式規則：故障卡唯一合法目標＝主力機組，備戰區免疫（即使 pending 模式理論上不會
          // 再被觸發——playCard 已自動解析目標——這裡仍保留正確判斷以防禦性程式碼一致）。
          if (faultTargeting) return slot === p.activeTurbineIdx && !tu.shutdown;
          if (skillTargeting) {
            // 依 pending 招式的目標種類：ownFault 需故障；ownTurbine 任一機組（含備戰區，修復不受限）
            const def = pendingSkillTag ? techSkillDef(pendingSkillTechId as string, pendingSkillTag) : undefined;
            return def?.targetKind === 'ownFault' ? tu.faults.length > 0 : true;
          }
          if (resourceTargeting) return tu.faults.length > 0;
          return false;
        }}
        onSlotClick={(slot) => {
          if (faultTargeting) selectFaultTarget(slot);
          else if (skillTargeting) selectSkillTarget(slot);
          else if (resourceTargeting) selectResourceTarget(slot);
        }}
        onRetreatClick={
          sideKey === 'me' && isMyTurn && !faultTargeting && !skillTargeting && !resourceTargeting
            ? (benchIdx) => retreat(benchIdx)
            : undefined
        }
        canRetreatSlot={
          sideKey === 'me' && isMyTurn && !faultTargeting && !skillTargeting && !resourceTargeting
            ? (benchIdx) => canRetreat(state, 0, benchIdx)
            : undefined
        }
      />
    );

    // 戰鬥區（主力 + 備戰區）+ 技師區（左右各一側）
    const stageWithTechs = (
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: isPortrait ? 6 : 10 }}>
        {/* 備戰區左側技師（我方）或對方技師（對方備戰區在左） */}
        {sideKey === 'opp' && techsPanel}
        {stage}
        {/* 主力右側技師（我方） */}
        {sideKey === 'me' && techsPanel}
      </div>
    );

    return (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'row',
          gap: isPortrait ? 6 : 12,
          padding: isPortrait ? '6px 8px' : '8px 16px',
          alignItems: 'stretch',
          background: sideKey === 'me' ? theme.bgPlayer : theme.bgOpponent,
          borderTop:
            sideKey === 'me'
              ? themeKey === 'tideboard'
                ? '1px solid rgba(232,200,120,0.2)'
                : '1px solid rgba(58,167,200,0.1)'
              : undefined,
          overflow: 'hidden',
        }}
      >
        {/* 我方：風場資訊在左、戰鬥區+技師在右；對方：戰鬥區+技師在左、風場資訊在右 */}
        {sideKey === 'me' ? (
          <>
            {sidebar}
            {stageWithTechs}
          </>
        ) : (
          <>
            {stageWithTechs}
            {sidebar}
          </>
        )}
      </div>
    );
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

      <div
        className={shakeClass}
        style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 1 }}
      >
        <TopBar
          difficulty={difficulty}
          onDifficulty={setDifficulty}
          onLibrary={() => setShowLibrary(true)}
          onRestart={() => newGame()}
          onTitle={onTitle}
          onTheme={() => setShowTheme(true)}
          onSettings={() => setShowSettings(true)}
        />

        {/* 頂條：回合 · 風速 · 動作（共享資訊，去掉「中間」） */}
        <BattleCenter state={state} windRolling={windRolling} />

        {/* R2 同題：本回合共享環境事件橫幅 */}
        {incidentName && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '5px 12px',
              background: themeKey === 'tideboard' ? 'rgba(168,69,58,0.25)' : 'rgba(217,108,90,0.12)',
              borderBottom: '1px solid rgba(217,108,90,0.35)',
              color: '#a8453a',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: theme.fontUI,
              animation: 'wf-fade-in 0.4s ease-out both',
            }}
          >
            <Crosshair size={13} stroke="#a8453a" />
            {t('incident.banner', { name: incidentName })}
          </div>
        )}

        {/* R3：本回合共享資源（先搶先得） */}
        {state.roundResources.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '6px 12px',
              borderBottom: `1px solid ${theme.border}`,
              background: themeKey === 'tideboard' ? 'rgba(40,25,15,0.4)' : 'rgba(255,255,255,0.35)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 10, color: theme.textSecondary, letterSpacing: '0.08em', fontFamily: theme.fontUI }}>
              {t('resource.title')} · {t('resource.hint')}
            </span>
            {state.roundResources.map((res) => {
              const claimed = res.claimedBy !== undefined;
              const mine = res.claimedBy === 0;
              const canGrab = isMyTurn && !claimed && state.actionsLeft >= 1;
              return (
                <button
                  key={res.id}
                  type="button"
                  disabled={!canGrab}
                  onClick={canGrab ? () => grabResource(res.id) : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 12px',
                    borderRadius: 999,
                    border: claimed ? `1px solid ${theme.border}` : '1px solid rgba(58,167,200,0.5)',
                    background: claimed
                      ? mine
                        ? 'rgba(58,167,200,0.15)'
                        : 'rgba(168,91,74,0.15)'
                      : canGrab
                        ? 'rgba(58,167,200,0.14)'
                        : 'rgba(0,0,0,0.04)',
                    color: claimed ? (mine ? '#2a7a9a' : '#a8453a') : theme.textPrimary,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: canGrab ? 'pointer' : 'default',
                    fontFamily: theme.fontUI,
                    opacity: claimed ? 0.7 : 1,
                  }}
                >
                  <span>{RES_ICON[res.type]}</span>
                  {t(`resource.${res.type}` as Parameters<typeof t>[0])}
                  {claimed && (
                    <span style={{ fontSize: 9, marginLeft: 2 }}>
                      · {mine ? t('resource.claimedYou') : t('resource.claimedAi')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 上下兩半：opp 在上、me 在下；各半＝左技師舞台 + 右風場面板 */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {renderHalf('opp')}
          {renderHalf('me')}
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

          {/* 技師出招：挑選要快修的自家機組 */}
          {pendingSkillTechId !== null && (
            <div
              style={{
                position: 'absolute',
                top: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '7px 16px',
                background: themeKey === 'tideboard' ? 'linear-gradient(180deg, #2a8a5a, #1a5a3a)' : 'rgba(42,138,90,0.95)',
                border: themeKey === 'tideboard' ? '1.5px solid #a8d878' : 'none',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: themeKey === 'tideboard' ? 0 : 999,
                boxShadow: '0 6px 16px rgba(42,138,90,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 5,
                fontFamily: theme.fontUI,
              }}
            >
              ⚡ {t('skill.pickTarget')}
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

          {/* R3：挑選要施用資源(備品/吊車)的自家機組 */}
          {pendingResourceId !== null && (
            <div
              style={{
                position: 'absolute',
                top: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '7px 16px',
                background: themeKey === 'tideboard' ? 'linear-gradient(180deg, #3a7a9a, #1a5a7a)' : 'rgba(58,167,200,0.95)',
                border: themeKey === 'tideboard' ? '1.5px solid #a8d8e8' : 'none',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: themeKey === 'tideboard' ? 0 : 999,
                boxShadow: '0 6px 16px rgba(58,167,200,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 5,
                fontFamily: theme.fontUI,
              }}
            >
              🔧 {t('resource.pickTarget')}
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
            cardSize={isPortrait ? 72 : 90}
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

      {/* 維修知識即時解說（教學提示開啟時） */}
      {repairInsight && <RepairInsightToast key={repairInsight.token} insight={repairInsight.insight} />}

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
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
