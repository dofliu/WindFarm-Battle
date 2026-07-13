// ============================================================
// WindFarmStrip — 手機直向的「中線風場帶」。
//
// 把桌面版兩大塊風機統計面板壓縮成一條：雙方各 3 個迷你可用率圓環
// （對手在上排、我方在下排），中央是本回合環境（風骰係數 + 浪高 + 回合數）。
// 故障中的風機亮紅點；道具/技能選目標時我方圓環變綠色可點。
// ============================================================
import type { DeployedTurbine, GameState } from '../../core/types';
import { t } from '../../i18n';

const R = 15;                      // 圓環半徑
const C = 2 * Math.PI * R;         // 圓周長

function AvailRing({
  turbine, targetable, onPress,
}: {
  readonly turbine: DeployedTurbine;
  readonly targetable?: boolean;
  readonly onPress?: () => void;
}) {
  const eff = Math.max(0, Math.min(100, turbine.avail));
  const color = turbine.shutdown ? '#64748b' : eff > 70 ? '#34d399' : eff > 40 ? '#fbbf24' : '#f87171';
  const hasFault = turbine.faults.length > 0;
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={!onPress}
      title={`${turbine.id} ${eff}%`}
      style={{
        all: 'unset',
        position: 'relative',
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onPress ? 'pointer' : 'default',
        borderRadius: '50%',
        boxShadow: targetable ? '0 0 0 3px rgba(52,211,153,0.85), 0 0 14px rgba(52,211,153,0.6)' : 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <svg width={44} height={44} viewBox="0 0 44 44">
        <circle cx={22} cy={22} r={R} fill="rgba(10,18,30,0.85)" stroke="rgba(148,180,220,0.25)" strokeWidth={3.5} />
        <circle
          cx={22} cy={22} r={R}
          fill="none"
          stroke={color}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray={`${(eff / 100) * C} ${C}`}
          transform="rotate(-90 22 22)"
          style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.4s' }}
        />
      </svg>
      <span style={{ position: 'absolute', fontSize: 10.5, fontWeight: 900, color: '#e5eefb', fontVariantNumeric: 'tabular-nums' }}>
        {turbine.shutdown ? '✕' : eff}
      </span>
      {/* 機組容量小標 */}
      <span style={{ position: 'absolute', bottom: -11, fontSize: 7.5, fontWeight: 800, color: '#7d95b3', letterSpacing: '0.03em' }}>
        {turbine.mw + turbine.mwBonus}MW
      </span>
      {hasFault && !turbine.shutdown && (
        <span
          style={{
            position: 'absolute', top: 0, right: 0, width: 13, height: 13, borderRadius: '50%',
            background: '#ef4444', border: '1.5px solid #0e1a2a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 900, color: '#fff',
            animation: 'wf-fault-pulse 1.1s ease-in-out infinite',
          }}
        >
          {turbine.faults.length}
        </span>
      )}
    </button>
  );
}

interface Props {
  readonly state: GameState;
  /** 我方風機是否處於「選目標」模式（道具/技能），可點時傳入 */
  readonly isTurbineTargetable?: (idx: number) => boolean;
  readonly onTurbinePress?: (idx: number) => void;
}

export function WindFarmStrip({ state, isTurbineTargetable, onTurbinePress }: Props) {
  const me = state.players[0];
  const opp = state.players[1];
  const windIcon = state.wind.typhoon ? '🌀' : state.wind.coeff >= 1 ? '💨' : state.wind.coeff > 0 ? '🍃' : '😴';
  const waveIcon = state.waveHeight >= 4 ? '🌊🚨' : state.waveHeight >= 3 ? '🌊' : '〰️';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '10px 14px 16px',
        borderRadius: 18,
        background: 'linear-gradient(180deg, rgba(20,34,52,0.85), rgba(12,22,36,0.85))',
        border: '1px solid rgba(148,180,220,0.22)',
      }}
    >
      {/* 對手風場（左） */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
        <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.12em', color: '#f0a5b4' }}>AI {opp.score.toFixed(0)}</span>
        <div style={{ display: 'flex', gap: 9 }}>
          {opp.windFarm.map((tu) => (
            <AvailRing key={tu.id} turbine={tu} />
          ))}
        </div>
      </div>

      {/* 中央環境 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 74 }}>
        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', color: '#7d95b3' }}>
          {t('mobile.round', { n: state.round, max: state.maxRounds })}
        </span>
        <span style={{ fontSize: 17, fontWeight: 900, color: '#7dd3fc', lineHeight: 1.2 }}>
          {windIcon} ×{state.wind.coeff}
        </span>
        <span style={{ fontSize: 10, color: '#8fb3d9', fontWeight: 700 }}>
          {waveIcon} {t('mobile.wave', { n: state.waveHeight })}
        </span>
      </div>

      {/* 我方風場（右） */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
        <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.12em', color: '#6ee7b7' }}>{t('mobile.me')} {me.score.toFixed(0)}</span>
        <div style={{ display: 'flex', gap: 9 }}>
          {me.windFarm.map((tu, i) => (
            <AvailRing
              key={tu.id}
              turbine={tu}
              targetable={isTurbineTargetable?.(i)}
              onPress={onTurbinePress ? () => onTurbinePress(i) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
