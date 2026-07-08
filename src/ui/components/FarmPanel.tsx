// ============================================================
// FarmPanel — 右側「風場狀態」資訊面板（寶可夢式主力/備戰區版面）。
// 每位玩家一塊：標題(可用率/故障數/發電/累計) + 主力大格 + 備戰區 3 小格。
// 主力/備戰格改用真正的視覺卡片（重用 <Card>，不再是純圖示+文字列），
// 上面疊一層即時戰況數值（有效可用率 / 故障數 / 停機標籤）——這些是動態數值，
// 不能只顯示靜態的手牌卡片，所以用 overlay 疊加而非直接改 Card 元件本身。
// data-slot 一律採用「真實 turbines[] 陣列索引」（不是固定 0=主力/1-3=備戰的位置編號），
// 因為 retreat 只 repoint activeTurbineIdx、不搬動陣列，主力的陣列索引撤退後可能改變。
// 外層帶 data-zone（play-mine / play-opp）供 Hand 拖曳落點判定沿用。
// ============================================================
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

interface Props {
  readonly side: 'me' | 'opp';
  readonly player: PlayerState;
  readonly score: number;
  /** 本回合發電預覽（通常只給玩家自己；只反映主力機組，與 _scoreRound 口徑一致） */
  readonly previewMwh?: number;
  readonly active?: boolean;
  /** 某機組是否為目前可點的目標（故障目標 / 快修目標 / 資源目標）；索引為 turbines[] 真實陣列索引 */
  readonly isSlotTargetable?: (slot: number) => boolean;
  readonly onSlotClick?: (slot: number) => void;
  /** 直向時佔滿寬度（否則固定 288） */
  readonly fullWidth?: boolean;
  /** 拖曳落點提示（整塊面板高亮） */
  readonly dropActive?: boolean;
  /** 寶可夢式撤退：點擊備戰區機組換上主力時呼叫（傳入該機組在 turbines[] 的真實索引） */
  readonly onRetreatClick?: (benchIdx: number) => void;
  /** 該備戰區機組目前是否可撤退換上（由 core canRetreat 查詢結果決定） */
  readonly canRetreatSlot?: (benchIdx: number) => boolean;
}

export function FarmPanel({
  side, player, score, previewMwh, active, isSlotTargetable, onSlotClick, fullWidth, dropActive,
  onRetreatClick, canRetreatSlot,
}: Props) {
  const { theme, themeKey } = useTheme();
  useLocale();
  const isTide = themeKey === 'tideboard';

  const turbines = player.turbines;
  const nonEmpty = turbines.filter(Boolean);
  const avgAvail = nonEmpty.length
    ? Math.round(nonEmpty.reduce((s, tu) => s + effAvail(tu), 0) / nonEmpty.length)
    : 0;
  const totalMw = nonEmpty.reduce((s, tu) => s + (CARDS[tu.cardId].stats?.mw ?? 0) + tu.mwBonus, 0);
  const faultCount = nonEmpty.reduce((s, tu) => s + tu.faults.length, 0);

  const panelBg = isTide ? 'rgba(40,25,15,0.55)' : 'rgba(255,255,255,0.55)';
  const rowBg = isTide ? 'rgba(60,40,25,0.5)' : 'rgba(255,255,255,0.7)';

  const activeIdx = player.activeTurbineIdx;
  const activeTurbine = activeIdx !== null ? turbines[activeIdx] : undefined;
  // 備戰區＝所有非主力索引（含理論上超額的 no-slot 疊加機組，一併顯示，不硬性裁切）
  const benchIndices = turbines.map((_, i) => i).filter((i) => i !== activeIdx);
  const benchDisplayCount = Math.max(BENCH_SLOTS, benchIndices.length);

  return (
    <div
      data-zone={side === 'me' ? 'play-mine' : 'play-opp'}
      style={{
        width: fullWidth ? '100%' : 288,
        flexShrink: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 10,
        borderRadius: isTide ? 6 : 16,
        background: dropActive ? 'rgba(217,108,90,0.1)' : panelBg,
        border: `${dropActive ? 2 : 1}px solid ${dropActive ? 'rgba(217,108,90,0.55)' : active ? theme.borderStrong : theme.border}`,
        boxShadow: active ? '0 0 16px rgba(58,167,200,0.18)' : '0 2px 10px rgba(28,42,58,0.06)',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s',
      }}
    >
      {/* 標題列 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: isTide ? 6 : 10,
            background: side === 'me' ? (isTide ? '#6e4a18' : '#1c2a3a') : '#a85b4a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <TurbineFloat size={20} stroke="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary, fontFamily: theme.fontUI }}>
            {side === 'me' ? t('farm.mine') : t('farm.opp')}
          </div>
          <div style={{ fontSize: 10, color: theme.textSecondary, fontFamily: theme.fontUI }}>
            {t('farm.hand')} {player.hand.length} · {t('farm.deck')} {player.deck.length}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: theme.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{score}</span>
            <span style={{ fontSize: 9, color: theme.textSecondary }}>MWh</span>
          </div>
          {previewMwh !== undefined && previewMwh > 0 && (
            <div style={{ fontSize: 10, color: '#3a8a5e', fontWeight: 700 }}>+{previewMwh}</div>
          )}
        </div>
      </div>

      {/* 統計三格：可用率 / 故障數 / 出力（涵蓋主力＋備戰區全艦隊概況） */}
      <div style={{ display: 'flex', gap: 6 }}>
        <Stat label={t('farm.availability')} value={`${avgAvail}%`} color={availColor(avgAvail)} theme={theme} bg={rowBg} />
        <Stat label={t('farm.faults')} value={String(faultCount)} color={faultCount > 0 ? '#a8453a' : theme.textSecondary} theme={theme} bg={rowBg} />
        <Stat label={t('farm.capacity')} value={`${totalMw}MW`} color={theme.textPrimary} theme={theme} bg={rowBg} />
      </div>

      {/* 主力 + 備戰區：面板高度不足時內部捲動，避免裁切 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* 主力（大格） */}
        <div>
          <SectionLabel text={t('farm.active')} theme={theme} />
          <div data-slot={activeIdx ?? undefined}>
            <BattleTurbineCard
              turbine={activeTurbine}
              size={104}
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
        <div>
          <SectionLabel text={t('farm.bench')} theme={theme} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                <div key={slot ?? `bench-empty-${j}`} data-slot={slot ?? undefined} style={{ flex: '1 1 0', minWidth: 64 }}>
                  <BattleTurbineCard
                    turbine={tu}
                    size={64}
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
        marginBottom: 4,
        fontFamily: theme.fontUI,
      }}
    >
      {text}
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
    <div style={{ flex: 1, padding: '3px 3px', borderRadius: 8, background: bg, textAlign: 'center' }}>
      <div style={{ fontSize: 8, color: theme.textSecondary, letterSpacing: '0.06em', fontFamily: theme.fontUI }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
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
