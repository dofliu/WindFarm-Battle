// ============================================================
// FarmPanel — 右側「風場狀態」資訊面板（同題競賽新版面 R1）。
// 每位玩家一塊：標題(可用率/故障數/發電/累計) + 3 個機組資訊列。
// 機組列保留 data-slot 與可點 / 可拖曳目標能力，維持故障目標選取與快修目標選取。
// 外層帶 data-zone（play-mine / play-opp）供 Hand 拖曳落點判定沿用。
// ============================================================
import { CARDS } from '../../core/cards';
import { cardName, t } from '../../i18n';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../locale/LocaleContext';
import { pickIcon, PowerBolt, TurbineFloat, FaultLightning } from '../icons';
import type { PlayerState, DeployedTurbine } from '../../core/types';

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
  /** 本回合發電預覽（通常只給玩家自己） */
  readonly previewMwh?: number;
  readonly active?: boolean;
  /** 某機組是否為目前可點的目標（故障目標 / 快修目標） */
  readonly isSlotTargetable?: (slot: number) => boolean;
  readonly onSlotClick?: (slot: number) => void;
  /** 直向時佔滿寬度（否則固定 288） */
  readonly fullWidth?: boolean;
  /** 拖曳落點提示（整塊面板高亮） */
  readonly dropActive?: boolean;
}

export function FarmPanel({ side, player, score, previewMwh, active, isSlotTargetable, onSlotClick, fullWidth, dropActive }: Props) {
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

      {/* 統計三格：可用率 / 故障數 / 出力 */}
      <div style={{ display: 'flex', gap: 6 }}>
        <Stat label={t('farm.availability')} value={`${avgAvail}%`} color={availColor(avgAvail)} theme={theme} bg={rowBg} />
        <Stat label={t('farm.faults')} value={String(faultCount)} color={faultCount > 0 ? '#a8453a' : theme.textSecondary} theme={theme} bg={rowBg} />
        <Stat label={t('farm.capacity')} value={`${totalMw}MW`} color={theme.textPrimary} theme={theme} bg={rowBg} />
      </div>

      {/* 機組列（3 格）：面板高度不足時內部捲動，避免裁切 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {[0, 1, 2].map((slot) => {
          const tu = turbines[slot];
          const targetable = !!isSlotTargetable && isSlotTargetable(slot);
          return (
            <div key={slot} data-slot={slot}>
              <TurbineRow
                turbine={tu}
                rowBg={rowBg}
                targetable={targetable}
                onClick={targetable && onSlotClick ? () => onSlotClick(slot) : undefined}
              />
            </div>
          );
        })}
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
    <div style={{ flex: 1, padding: '3px 3px', borderRadius: 8, background: bg, textAlign: 'center' }}>
      <div style={{ fontSize: 8, color: theme.textSecondary, letterSpacing: '0.06em', fontFamily: theme.fontUI }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function TurbineRow({
  turbine, rowBg, targetable, onClick,
}: {
  readonly turbine?: DeployedTurbine | null;
  readonly rowBg: string;
  readonly targetable: boolean;
  readonly onClick?: () => void;
}) {
  const { theme } = useTheme();
  if (!turbine) {
    return (
      <div
        style={{
          height: 42,
          borderRadius: 10,
          border: `1.5px dashed ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: theme.textSecondary,
          letterSpacing: '0.2em',
        }}
      >
        {t('farm.emptySlot')}
      </div>
    );
  }
  const card = CARDS[turbine.cardId];
  const IconComp = pickIcon(card.icon, card.type);
  const mw = (card.stats?.mw ?? 0) + turbine.mwBonus;
  const eff = effAvail(turbine);
  const name = cardName(turbine.cardId) || turbine.cardId;
  const shutdown = !!turbine.shutdown;
  const hasFaults = turbine.faults.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px',
        borderRadius: 10,
        background: targetable ? 'rgba(217,108,90,0.12)' : rowBg,
        border: targetable ? '2px solid rgba(217,108,90,0.6)' : '1px solid transparent',
        boxShadow: targetable ? '0 0 0 3px rgba(217,108,90,0.15)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        opacity: shutdown ? 0.55 : 1,
        transition: 'all 0.15s',
      }}
    >
      <div
        style={{
          width: 24, height: 24, borderRadius: 7, flexShrink: 0,
          background: 'linear-gradient(180deg, hsl(200,40%,92%), hsl(200,30%,82%))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <IconComp size={15} stroke="#3aa7c8" strokeWidth={1.3} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: theme.fontUI }}>
          {name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 700, color: theme.textPrimary }}>
            <PowerBolt size={9} stroke="#3aa7c8" fill="#3aa7c8" />{mw}
          </span>
          <div style={{ flex: 1, height: 4, background: 'rgba(28,42,58,0.1)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.max(4, eff)}%`, background: availColor(eff), borderRadius: 999 }} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: availColor(eff), fontVariantNumeric: 'tabular-nums' }}>{eff}%</span>
        </div>
      </div>
      {shutdown ? (
        <span style={{ fontSize: 9, fontWeight: 800, color: '#a8453a', letterSpacing: '0.1em', flexShrink: 0 }}>{t('turbine.shutdown')}</span>
      ) : hasFaults ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <FaultLightning size={11} stroke="#a8453a" />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#a8453a' }}>{turbine.faults.length}</span>
        </span>
      ) : null}
    </button>
  );
}
