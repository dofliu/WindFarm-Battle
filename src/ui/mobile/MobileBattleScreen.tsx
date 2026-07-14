// ============================================================
// MobileBattleScreen — 手機直向的 Pokemon TCG Pocket 式卡牌桌面。
//
// 設計哲學（對照參考圖）：
//   1. 卡牌就是 UI：桌面只擺卡，統計面板 / 課堂任務 / 教練提示全部收起
//   2. 點卡放大：說明文字只出現在 CardZoom（滿版檢視），卡面保持乾淨
//   3. 單屏不滾動：對手列 → 風場帶 → 我方主力 → 備戰 → 手牌，由上而下一屏放完
//
// 互動全部走「點擊 → 放大 → 確認」；不做拖曳（手機拖曳體驗差）。
// 邏輯完全沿用 game-store 既有 action，零 core 改動。
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../../store/game-store';
import { CARDS } from '../../core/cards';
import { cardName, t } from '../../i18n';
import { useLocale } from '../locale/LocaleContext';
import { BattleCardFace, EmptyCardSlot } from './BattleCardFace';
import { CardZoom, type ZoomAction } from './CardZoom';
import { WindFarmStrip } from './WindFarmStrip';
import { Card } from '../components/Card';
import { SettingsModal } from '../components/SettingsModal';
import { RepairInsightToast } from '../components/RepairInsightToast';
import { useGameFeedback } from '../audio/useGameFeedback';
import { useRepairInsight } from '../learning/useRepairInsight';

interface Props {
  readonly onTitle: () => void;
  readonly onGameOver: () => void;
}

const HUMAN = 0 as const;
const AI = 1 as const;

/** 點卡後的檢視對象 */
type ZoomTarget =
  | { kind: 'hand'; handIdx: number; cardId: string }
  | { kind: 'my-active' }
  | { kind: 'my-bench'; benchIdx: number }
  | { kind: 'opp-active' }
  | { kind: 'opp-bench'; benchIdx: number };

export function MobileBattleScreen({ onTitle, onGameOver }: Props) {
  useLocale();
  const state = useGameStore((s) => s.state);
  const events = useGameStore((s) => s.events);
  const playCard = useGameStore((s) => s.playCard);
  const activateSkill = useGameStore((s) => s.activateSkill);
  const selectFaultTarget = useGameStore((s) => s.selectFaultTarget);
  const selectSkillTarget = useGameStore((s) => s.selectSkillTarget);
  const retreat = useGameStore((s) => s.retreat);
  const promoteTech = useGameStore((s) => s.promoteTech);
  const cancelPending = useGameStore((s) => s.cancelPending);
  const endTurn = useGameStore((s) => s.endTurn);
  const newGame = useGameStore((s) => s.newGame);
  const isAiThinking = useGameStore((s) => s.isAiThinking);
  const aiCurrentAction = useGameStore((s) => s.aiCurrentAction);
  const pendingFaultHandIdx = useGameStore((s) => s.pendingFaultHandIdx);
  const pendingSkillTag = useGameStore((s) => s.pendingSkillTag);
  const lastRoundScore = useGameStore((s) => s.lastRoundScore);
  const clearLastRoundScore = useGameStore((s) => s.clearLastRoundScore);

  const [zoom, setZoom] = useState<ZoomTarget | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // 手感回饋沿用（音效 + 震動 key；手機不做全屏 shake，改由卡片動畫承擔）
  useGameFeedback(HUMAN);
  const repairInsight = useRepairInsight(HUMAN);

  const me = state.players[HUMAN];
  const opp = state.players[AI];
  const isMyTurn = state.currentPlayer === HUMAN && !isAiThinking && !state.gameOver;
  const targeting = pendingFaultHandIdx !== null || pendingSkillTag !== null;

  useEffect(() => {
    if (state.gameOver) {
      const timer = window.setTimeout(() => onGameOver(), 800);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state.gameOver, onGameOver]);

  // 回合結算 toast 自動消失
  useEffect(() => {
    if (!lastRoundScore) return undefined;
    const timer = window.setTimeout(() => clearLastRoundScore(), 2600);
    return () => window.clearTimeout(timer);
  }, [lastRoundScore, clearLastRoundScore]);

  // 本回合共享環境事件（頂部細條顯示）
  const incident = [...events].reverse().find((e) => e.kind === 'incident' && e.round === state.round);
  const incidentName = incident && incident.kind === 'incident' ? cardName(incident.faultCardId) || incident.faultCardId : null;

  // ── Zoom 動作組裝 ──────────────────────────────────────────
  const closeZoom = useCallback(() => setZoom(null), []);

  function zoomActionsFor(target: ZoomTarget): { cardId: string; tech?: typeof me.field.active; actions: ZoomAction[] } {
    if (target.kind === 'hand') {
      const cardId = me.hand[target.handIdx];
      const card = CARDS[cardId];
      const canPlay = isMyTurn && !!card;

      // 補血/護盾道具：直接在檢視內列出場上技師（精準選擇，不用另開選取模式）
      const TECH_TARGET_EFFECTS = ['restore-stamina', 'restore-stamina-big', 'stamina-shield'];
      if (card?.type === 'item' && TECH_TARGET_EFFECTS.includes(card.effect ?? '')) {
        const squad = [me.field.active, ...me.field.bench].filter((x): x is NonNullable<typeof me.field.active> => x !== null);
        const techActions: ZoomAction[] = squad.map((tech, i) => ({
          label: `💉 ${cardName(tech.cardId) || tech.cardId}（${tech.stamina}/${tech.maxStamina}）`,
          variant: 'primary' as const,
          disabled: !canPlay,
          onPress: () => {
            closeZoom();
            playCard(target.handIdx, { targetTechIdx: i });
          },
        }));
        return {
          cardId,
          actions: [
            ...(techActions.length > 0 ? techActions : []),
            { label: t('mobile.close'), variant: 'ghost', onPress: closeZoom },
          ],
        };
      }

      return {
        cardId,
        actions: [
          {
            label: card?.type === 'tech' ? t('mobile.actionDeploy') : t('mobile.actionPlay'),
            variant: 'primary',
            disabled: !canPlay,
            onPress: () => {
              closeZoom();
              playCard(target.handIdx); // 需要目標的道具會自動進入選目標模式（pendingFaultHandIdx）
            },
          },
          { label: t('mobile.close'), variant: 'ghost', onPress: closeZoom },
        ],
      };
    }
    if (target.kind === 'my-active') {
      const tech = me.field.active;
      if (!tech) return { cardId: '', actions: [] };
      const card = CARDS[tech.cardId];
      const levelKey = tech.level === 3 ? 'lv3' : tech.level === 2 ? 'lv2' : 'lv1';
      const skill = card.skills?.[levelKey];
      const canSkill = isMyTurn && !!skill && !tech.usedSkillThisTurn;
      return {
        cardId: tech.cardId,
        tech,
        actions: [
          {
            label: skill ? `${t('mobile.actionSkill')}（⚡${skill.staminaCost}）` : t('mobile.actionSkill'),
            variant: 'primary',
            disabled: !canSkill,
            onPress: () => {
              if (!skill) return;
              closeZoom();
              activateSkill(tech.cardId, skill.tag); // 需目標時 store 會設 pendingSkillTag
            },
          },
          { label: t('mobile.close'), variant: 'ghost', onPress: closeZoom },
        ],
      };
    }
    if (target.kind === 'my-bench') {
      const tech = me.field.bench[target.benchIdx];
      if (!tech) return { cardId: '', actions: [] };
      const hasActive = !!me.field.active;
      return {
        cardId: tech.cardId,
        tech,
        actions: [
          {
            label: t('mobile.actionToField'),
            variant: 'primary',
            disabled: !isMyTurn,
            onPress: () => {
              closeZoom();
              if (hasActive) retreat(target.benchIdx);
              else promoteTech(target.benchIdx);
            },
          },
          { label: t('mobile.close'), variant: 'ghost', onPress: closeZoom },
        ],
      };
    }
    // 對手卡：純檢視
    const tech = target.kind === 'opp-active' ? opp.field.active : opp.field.bench[target.benchIdx];
    if (!tech) return { cardId: '', actions: [] };
    return {
      cardId: tech.cardId,
      tech,
      actions: [{ label: t('mobile.close'), variant: 'ghost', onPress: closeZoom }],
    };
  }

  const zoomData = zoom ? zoomActionsFor(zoom) : null;

  // ── 版面 ──────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background:
          'radial-gradient(ellipse 90% 45% at 50% -8%, rgba(56,130,190,0.22), transparent), radial-gradient(ellipse 90% 45% at 50% 108%, rgba(16,140,100,0.2), transparent), linear-gradient(180deg, #0b1624 0%, #0d1a2b 50%, #0b1826 100%)',
        color: '#e5eefb',
        fontFamily: "'Manrope', 'Noto Sans TC', system-ui, sans-serif",
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* ── 頂列：選單 + 回合狀態 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 4px' }}>
        <button
          type="button"
          onClick={() => setShowMenu(true)}
          style={{
            all: 'unset', width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(148,180,220,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          }}
        >
          ☰
        </button>
        <div style={{ fontSize: 12, fontWeight: 800, color: isAiThinking ? '#fbbf24' : '#8fb3d9', textAlign: 'center' }}>
          {isAiThinking
            ? `🤖 ${aiCurrentAction ?? t('mobile.aiActing')}`
            : targeting
              ? `🎯 ${t('mobile.pickTurbine')}`
              : isMyTurn
                ? t('mobile.yourTurn')
                : ''}
        </div>
        <div style={{ width: 38 }} />
      </div>

      {/* 環境事件細條 */}
      {incidentName && (
        <div style={{ margin: '0 12px', padding: '4px 10px', borderRadius: 10, background: 'rgba(244,63,94,0.14)', border: '1px solid rgba(244,63,94,0.4)', fontSize: 11, fontWeight: 800, color: '#fda4af', textAlign: 'center' }}>
          🚨 {incidentName}
        </div>
      )}

      {/* ── 對手列：卡背手牌 + 主力/備戰小卡 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px', gap: 10 }}>
        {/* 卡背扇（手牌數） */}
        <div style={{ position: 'relative', width: 74, height: 58, flexShrink: 0 }}>
          {Array.from({ length: Math.min(opp.hand.length, 5) }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute', left: i * 11, top: Math.abs(i - 2) * 2,
                width: 34, height: 48, borderRadius: 5,
                background: 'linear-gradient(135deg, #1e3a5f, #0f2440)',
                border: '1.5px solid rgba(125,211,252,0.5)',
                transform: `rotate(${(i - 2) * 6}deg)`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}
            />
          ))}
          <span style={{ position: 'absolute', bottom: -4, left: 0, fontSize: 9, fontWeight: 800, color: '#f0a5b4' }}>
            AI ✋{opp.hand.length}
          </span>
        </div>

        {/* 對手備戰（右到左） + 主力 */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
          {opp.field.bench.map((tech, i) => (
            <BattleCardFace key={`${tech.cardId}-${i}`} tech={tech} width={54} onClick={() => setZoom({ kind: 'opp-bench', benchIdx: i })} />
          ))}
          {opp.field.active ? (
            <BattleCardFace tech={opp.field.active} width={84} isActive onClick={() => setZoom({ kind: 'opp-active' })} />
          ) : (
            <EmptyCardSlot width={84} label={t('mobile.noActive')} />
          )}
        </div>
      </div>

      {/* ── 中線：風場帶 ── */}
      <div style={{ padding: '2px 12px' }}>
        <WindFarmStrip
          state={state}
          isTurbineTargetable={targeting ? () => true : undefined}
          onTurbinePress={
            targeting
              ? (idx) => {
                  if (pendingFaultHandIdx !== null) selectFaultTarget(idx);
                  else if (pendingSkillTag !== null) selectSkillTarget(idx);
                }
              : undefined
          }
        />
        {targeting && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
            <button
              type="button"
              onClick={cancelPending}
              style={{
                all: 'unset', padding: '5px 16px', borderRadius: 999,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(148,180,220,0.4)',
                fontSize: 12, fontWeight: 800, color: '#c8d8ea', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              ✕ {t('mobile.cancel')}
            </button>
          </div>
        )}
      </div>

      {/* ── 我方主力（大卡）＋ 結束回合 ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '4px 14px', minHeight: 0 }}>
        {me.field.active ? (
          <BattleCardFace
            tech={me.field.active}
            width={138}
            isActive
            dimUsed={me.field.active.usedSkillThisTurn}
            onClick={() => setZoom({ kind: 'my-active' })}
          />
        ) : (
          <EmptyCardSlot width={138} label={t('mobile.deployHint')} highlight={isMyTurn} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            disabled={!isMyTurn}
            onClick={() => isMyTurn && endTurn()}
            style={{
              all: 'unset',
              padding: '16px 18px',
              borderRadius: 999,
              background: isMyTurn ? 'linear-gradient(180deg, #f43f5e, #be123c)' : 'rgba(120,140,160,0.22)',
              color: isMyTurn ? '#fff' : 'rgba(220,230,240,0.45)',
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: '0.05em',
              boxShadow: isMyTurn ? '0 8px 22px rgba(244,63,94,0.4)' : 'none',
              cursor: isMyTurn ? 'pointer' : 'not-allowed',
              textAlign: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isAiThinking ? '🤖' : t('mobile.endTurn')}
          </button>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#7d95b3' }}>{t('mobile.roundLimit', { n: state.maxRounds })}</span>
        </div>
      </div>

      {/* ── 我方備戰區 ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '4px 14px 8px' }}>
        {Array.from({ length: 3 }, (_, i) => {
          const tech = me.field.bench[i];
          return tech ? (
            <BattleCardFace
              key={`${tech.cardId}-${i}`}
              tech={tech}
              width={72}
              onClick={() => setZoom({ kind: 'my-bench', benchIdx: i })}
            />
          ) : (
            <EmptyCardSlot key={`empty-${i}`} width={72} label={t('mobile.benchSlot')} />
          );
        })}
      </div>

      {/* ── 手牌（水平滑動大卡） ── */}
      <div
        data-zone="hand"
        style={{
          display: 'flex',
          gap: 10,
          padding: '10px 14px 12px',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          background: 'linear-gradient(180deg, transparent, rgba(6,12,22,0.75))',
          minHeight: 172,
          alignItems: 'flex-end',
        }}
      >
        {me.hand.length === 0 && (
          <div style={{ width: '100%', textAlign: 'center', fontSize: 12, color: '#7d95b3', fontWeight: 700, padding: '30px 0' }}>
            {t('hand.empty')}
          </div>
        )}
        {me.hand.map((cardId, i) => (
          <div key={`${i}-${cardId}`} style={{ flexShrink: 0 }}>
            <Card cardId={cardId} size={104} faded={!isMyTurn} onClick={() => setZoom({ kind: 'hand', handIdx: i, cardId })} />
          </div>
        ))}
      </div>

      {/* ── 疊層 ── */}
      {zoom && zoomData && zoomData.cardId && (
        <CardZoom
          cardId={zoomData.cardId}
          tech={zoomData.tech ?? null}
          actions={zoomData.actions}
          onClose={closeZoom}
        />
      )}

      {repairInsight && <RepairInsightToast key={repairInsight.token} insight={repairInsight.insight} />}

      {/* 回合結算：手機專用單行 toast（桌面版 RoundSummaryToast 在窄幅會擠壓） */}
      {lastRoundScore && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top) + 52px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 400,
            padding: '9px 18px',
            borderRadius: 999,
            background: 'rgba(12,22,38,0.95)',
            border: '1px solid rgba(148,180,220,0.4)',
            boxShadow: '0 10px 28px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            whiteSpace: 'nowrap',
            animation: 'wf-toast-in 0.35s ease-out both',
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          <span style={{ color: '#8fb3d9', fontSize: 11 }}>{t('mobile.round', { n: lastRoundScore.round, max: state.maxRounds })}</span>
          <span style={{ color: '#6ee7b7' }}>+{lastRoundScore.p0Mwh.toFixed(1)}</span>
          <span style={{ color: '#7d95b3', fontSize: 11 }}>vs</span>
          <span style={{ color: '#fda4af' }}>+{lastRoundScore.p1Mwh.toFixed(1)}</span>
        </div>
      )}

      {/* 簡易選單（設定 / 重開 / 返回標題） */}
      {showMenu && (
        <div
          onClick={() => setShowMenu(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 550, background: 'rgba(4,8,16,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', borderRadius: '20px 20px 0 0',
              background: '#12233a', border: '1px solid rgba(148,180,220,0.3)', borderBottom: 'none',
              padding: '16px 16px calc(16px + env(safe-area-inset-bottom))',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}
          >
            {[
              { label: `⚙️ ${t('topbar.settings')}`, fn: () => { setShowMenu(false); setShowSettings(true); } },
              { label: `🔄 ${t('topbar.restart')}`, fn: () => { setShowMenu(false); newGame(); } },
              { label: `🏠 ${t('topbar.title')}`, fn: () => { setShowMenu(false); onTitle(); } },
              { label: t('mobile.close'), fn: () => setShowMenu(false) },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.fn}
                style={{
                  all: 'unset', padding: '13px 16px', borderRadius: 12, textAlign: 'center',
                  background: 'rgba(255,255,255,0.07)', fontSize: 15, fontWeight: 800, color: '#dbe7f4',
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
