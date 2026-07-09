// ============================================================
// FarmPanel — 拆成兩塊：
//   1. FarmStatsPanel：窄側欄，顯示身分/手牌牌庫/累計分數/可用率故障裝置量統計。
//      我方放在我方戰鬥卡「左邊」、對方放在對方戰鬥卡「右邊」（寶可夢式版面，見 BattleScreen renderHalf）。
//   2. TurbineStage：真正的戰場——主力（大）+ 備戰區 3 台（小），佔滿版面中央大塊空間，
//      不再塞在窄側欄裡看不清楚。主力/備戰格重用 <Card>（手牌同一套視覺），疊上一層即時戰況
//      overlay（有效可用率條 / 故障數 / 停機標籤）——這些是動態數值，不能只顯示靜態手牌卡片。
// data-slot 一律採用「真實 turbines[] 陣列索引」（不是固定 0=主力/1-3=備戰的位置編號），
// 因為 retreat 只 repoint activeTurbineIdx、不搬動陣列，主力的陣列索引撤退後可能改變。
// data-zone（play-mine / play-opp）放在 TurbineStage 根節點供 Hand 拖曳落點判定沿用。
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { CARDS } from '../../core/cards';
import { cardName, t } from '../../i18n';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../locale/LocaleContext';
import { TurbineFloat } from '../icons';
import { Card } from './Card';
import type { PlayerState, DeployedTurbine } from '../../core/types';

/** 備戰區固定顯示格數（上限 3；M10 no-slot 疊加時陣列可能更多，見下方渲染邏輯）。 */
const BENCH_SLOTS = 3;

function effAvail(tu: DeployedTurbine): number {
  return Math.max(0, tu.avail - tu.faults.reduce((s, f) => s + f.drop, 0));
}

function availColor(v: number): string {
  return v > 70 ? '#3a8a5e' : v > 40 ? '#a87a2a' : '#a8453a';
}

// ============================================================
// FarmStatsPanel — 窄側欄（身分 + 累計分數 + 可用率/故障/裝置量）
// ============================================================
interface FarmStatsPanelProps {
  readonly side: 'me' | 'opp';
  readonly player: PlayerState;
  readonly score: number;
  /** 本回合發電預覽（通常只給玩家自己；只反映主力機組，與 _scoreRound 口徑一致） */
  readonly previewMwh?: number;
  readonly active?: boolean;
  /** 直向手機時縮小字級/間距 */
  readonly compact?: boolean;
}

export function FarmStatsPanel({ side, player, score, previewMwh, active, compact }: FarmStatsPanelProps) {
  const { theme, themeKey } = useTheme();
  useLocale();
  const isTide = themeKey === 'tideboard';

  // 分數增加時彈跳強調（結算得分的即時回饋）。key 遞增 → 重掛 span 重播動畫。
  const prevScore = useRef(score);
  const [pop, setPop] = useState(0);
  useEffect(() => {
    if (score > prevScore.current) setPop((p) => p + 1);
    prevScore.current = score;
  }, [score]);

  const turbines = player.turbines;
  const nonEmpty = turbines.filter(Boolean);
  const avgAvail = nonEmpty.length
    ? Math.round(nonEmpty.reduce((s, tu) => s + effAvail(tu), 0) / nonEmpty.length)
    : 0;
  const totalMw = nonEmpty.reduce((s, tu) => s + (CARDS[tu.cardId].stats?.mw ?? 0) + tu.mwBonus, 0);
  const faultCount = nonEmpty.reduce((s, tu) => s + tu.faults.length, 0);

  const panelBg = isTide ? 'rgba(40,25,15,0.55)' : 'rgba(255,255,255,0.55)';
  const rowBg = isTide ? 'rgba(60,40,25,0.5)' : 'rgba(255,255,255,0.7)';

  return (
    <div
      style={{
        width: '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: compact ? 8 : 10,
        borderRadius: isTide ? 6 : 16,
        background: panelBg,
        border: `1px solid ${active ? theme.borderStrong : theme.border}`,
        boxShadow: active ? '0 0 16px rgba(58,167,200,0.18)' : '0 2px 10px rgba(28,42,58,0.06)',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s',
      }}
    >
      {/* 標題列 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: isTide ? 6 : 10,
            background: side === 'me' ? (isTide ? '#6e4a18' : '#1c2a3a') : '#a85b4a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <TurbineFloat size={16} stroke="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textPrimary, fontFamily: theme.fontUI }}>
            {side === 'me' ? t('farm.mine') : t('farm.opp')}
          </div>
          <div style={{ fontSize: 9, color: theme.textSecondary, fontFamily: theme.fontUI }}>
            {t('farm.hand')} {player.hand.length} · {t('farm.deck')} {player.deck.length}
          </div>
        </div>
      </div>

      {/* 累計分數 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          key={pop}
          className={pop > 0 ? 'wf-score-pop' : undefined}
          style={{ fontSize: 20, fontWeight: 800, color: theme.textPrimary, fontVariantNumeric: 'tabular-nums' }}
        >
          {score}
        </span>
        <span style={{ fontSize: 9, color: theme.textSecondary }}>MWh</span>
        {previewMwh !== undefined && previewMwh > 0 && (
          <span style={{ fontSize: 10, color: '#3a8a5e', fontWeight: 700, marginLeft: 'auto' }}>+{previewMwh}</span>
        )}
      </div>

      {/* 統計三格：可用率 / 故障數 / 裝置量（涵蓋主力＋備戰區全艦隊概況） */}
      <div style={{ display: 'flex', gap: 5 }}>
        <Stat label={t('farm.availability')} value={`${avgAvail}%`} color={availColor(avgAvail)} theme={theme} bg={rowBg} />
        <Stat label={t('farm.faults')} value={String(faultCount)} color={faultCount > 0 ? '#a8453a' : theme.textSecondary} theme={theme} bg={rowBg} />
        <Stat label={t('farm.capacity')} value={`${totalMw}MW`} color={theme.textPrimary} theme={theme} bg={rowBg} />
      </div>
    </div>
  );
}

function Stat({
  label, value, color, theme, bg,
}: {
  readonly label: string; readonly value: string; readonly color: string;
  readonly theme: ReturnType<typeof useTheme>['theme']; readonly bg: string;
}) {
  return (
    <div style={{ flex: 1, padding: '3px 2px', borderRadius: 8, background: bg, textAlign: 'center', minWidth: 0 }}>
      <div style={{ fontSize: 7, color: theme.textSecondary, letterSpacing: '0.04em', fontFamily: theme.fontUI }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

// ============================================================
// TurbineStage — 戰場中央大區塊：主力（大）+ 備戰區（小 ×3）
// ============================================================
interface TurbineStageProps {
  readonly side: 'me' | 'opp';
  readonly player: PlayerState;
  /** 某機組是否為目前可點的目標（故障目標 / 快修目標 / 資源目標）；索引為 turbines[] 真實陣列索引 */
  readonly isSlotTargetable?: (slot: number) => boolean;
  readonly onSlotClick?: (slot: number) => void;
  /** 寶可夢式撤退：點擊備戰區機組換上主力時呼叫（傳入該機組在 turbines[] 的真實索引） */
  readonly onRetreatClick?: (benchIdx: number) => void;
  /** 該備戰區機組目前是否可撤退換上（由 core canRetreat 查詢結果決定） */
  readonly canRetreatSlot?: (benchIdx: number) => boolean;
  /** 拖曳落點提示（整個戰場高亮） */
  readonly dropActive?: boolean;
  /**
   * true＝主力貼齊右緣（給對手半場用：我方風場資訊在對手戰鬥卡右邊，
   * 所以對手的主力要排在戰場區塊最靠近右側欄的那一端）。
   */
  readonly reverseOrder?: boolean;
  readonly activeSize?: number;
  readonly benchSize?: number;
}

export function TurbineStage({
  side, player, isSlotTargetable, onSlotClick, onRetreatClick, canRetreatSlot, dropActive,
  reverseOrder, activeSize = 150, benchSize = 92,
}: TurbineStageProps) {
  const { theme, themeKey } = useTheme();
  useLocale();
  const isTide = themeKey === 'tideboard';

  const turbines = player.turbines;
  const activeIdx = player.activeTurbineIdx;
  const activeTurbine = activeIdx !== null ? turbines[activeIdx] : undefined;
  // 備戰區＝所有非主力索引（含理論上超額的 no-slot 疊加機組，一併顯示，不硬性裁切）
  const benchIndices = turbines.map((_, i) => i).filter((i) => i !== activeIdx);
  const benchDisplayCount = Math.max(BENCH_SLOTS, benchIndices.length);

  return (
    <div
      data-zone={side === 'me' ? 'play-mine' : 'play-opp'}
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: reverseOrder ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: '10px 14px',
        borderRadius: isTide ? 6 : 16,
        background: dropActive ? 'rgba(217,108,90,0.1)' : 'transparent',
        border: `2px dashed ${dropActive ? 'rgba(217,108,90,0.55)' : 'transparent'}`,
        transition: 'all 0.2s',
      }}
    >
      {/* 主力（大格） */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <SectionLabel text={t('farm.active')} theme={theme} />
        <div data-slot={activeIdx ?? undefined}>
          <BattleTurbineCard
            turbine={activeTurbine}
            size={activeSize}
            emptyText={t('farm.emptyActive')}
            targetable={!!isSlotTargetable && activeIdx !== null && isSlotTargetable(activeIdx)}
            onClick={
              activeIdx !== null && isSlotTargetable?.(activeIdx) && onSlotClick
                ? () => onSlotClick(activeIdx)
                : undefined
            }
          />
        </div>
      </div>

      {/* 備戰區（小格 × 最多 3；no-slot 疊加卡超額時一併顯示） */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <SectionLabel text={t('farm.bench')} theme={theme} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {Array.from({ length: benchDisplayCount }, (_, j) => {
            const slot = benchIndices[j];
            const tu = slot !== undefined ? turbines[slot] : undefined;
            const targetable = slot !== undefined && !!isSlotTargetable && isSlotTargetable(slot);
            const retreatable = slot !== undefined && !!canRetreatSlot && canRetreatSlot(slot);
            const onClick = slot === undefined
              ? undefined
              : targetable && onSlotClick
                ? () => onSlotClick(slot)
                : retreatable && onRetreatClick
                  ? () => onRetreatClick(slot)
                  : undefined;
            return (
              <div key={slot ?? `bench-empty-${j}`} data-slot={slot ?? undefined} style={{ width: benchSize }}>
                <BattleTurbineCard
                  turbine={tu}
                  size={benchSize}
                  emptyText={t('farm.emptySlot')}
                  targetable={targetable}
                  retreatable={retreatable}
                  onClick={onClick}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ text, theme }: { readonly text: string; readonly theme: ReturnType<typeof useTheme>['theme'] }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: theme.textSecondary,
        fontFamily: theme.fontUI,
      }}
    >
      {text}
    </div>
  );
}

/**
 * 主力/備戰格的視覺卡片：重用 <Card>（手牌用的同一套主題化卡片視覺），
 * 疊上一層即時戰況 overlay（有效可用率條 / 故障數 / 停機標籤 / 目標高亮 / 可撤退提示）。
 * CLAUDE.md 視覺工作流鐵則：不重造卡框，直接組合既有 <Card> + overlay。
 */
function BattleTurbineCard({
  turbine, size, emptyText, targetable, retreatable, onClick,
}: {
  readonly turbine?: DeployedTurbine;
  readonly size: number;
  readonly emptyText: string;
  readonly targetable?: boolean;
  readonly retreatable?: boolean;
  readonly onClick?: () => void;
}) {
  const { theme } = useTheme();
  const height = size * 1.4;

  if (!turbine) {
    return (
      <div
        style={{
          width: '100%',
          height,
          borderRadius: 10,
          border: `1.5px dashed ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size >= 100 ? 11 : 9,
          color: theme.textSecondary,
          textAlign: 'center',
          padding: 4,
          letterSpacing: '0.06em',
        }}
      >
        {emptyText}
      </div>
    );
  }

  const eff = effAvail(turbine);
  const shutdown = !!turbine.shutdown;
  const hasFaults = turbine.faults.length > 0;
  const name = cardName(turbine.cardId) || turbine.cardId;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={retreatable ? `${name} · ${t('action.retreatHint')}` : name}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        position: 'relative',
        display: 'block',
        width: '100%',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ position: 'relative', width: size, margin: '0 auto' }}>
        <Card cardId={turbine.cardId} size={size} faded={shutdown} />

        {/* 目標高亮框（故障/技能/資源目標選取中） */}
        {targetable && (
          <div
            style={{
              position: 'absolute',
              inset: -3,
              borderRadius: 12,
              border: '2px solid rgba(217,108,90,0.6)',
              boxShadow: '0 0 0 3px rgba(217,108,90,0.15)',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* 可撤退提示框 */}
        {retreatable && !targetable && (
          <div
            style={{
              position: 'absolute',
              inset: -3,
              borderRadius: 12,
              border: '2px dashed rgba(58,167,200,0.65)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* 即時戰況 overlay：有效可用率條 + 故障數 / 停機標籤 */}
        <div
          style={{
            position: 'absolute',
            left: 4,
            right: 4,
            bottom: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: '2px 4px',
            borderRadius: 6,
            background: 'rgba(20,20,20,0.55)',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div style={{ height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.max(4, eff)}%`, background: availColor(eff), borderRadius: 999 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
            <span style={{ fontSize: size >= 100 ? 10 : 8, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
              {eff}%
            </span>
            {shutdown ? (
              <span style={{ fontSize: size >= 100 ? 9 : 7, fontWeight: 800, color: '#ff9a8a', letterSpacing: '0.06em' }}>
                {t('turbine.shutdown')}
              </span>
            ) : hasFaults ? (
              <span style={{ fontSize: size >= 100 ? 10 : 8, fontWeight: 800, color: '#ff9a8a' }}>
                ⚡{turbine.faults.length}
              </span>
            ) : null}
          </div>
        </div>

        {/* 撤退角標 */}
        {retreatable && (
          <div
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              padding: '2px 6px',
              borderRadius: 999,
              background: 'rgba(58,167,200,0.95)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.04em',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              pointerEvents: 'none',
            }}
          >
            {t('action.retreat')}
          </div>
        )}
      </div>
    </button>
  );
}
