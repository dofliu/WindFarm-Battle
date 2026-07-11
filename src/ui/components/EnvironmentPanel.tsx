import type { Wind } from '../../core/types';
import { t } from '../../i18n';

interface EnvironmentPanelProps {
  readonly wind: Wind;
  readonly waveHeight: number;
  readonly roundFaultEvent: { cardId: string; turbineId: string } | null;
  readonly round: number;
}

export function EnvironmentPanel({
  wind,
  waveHeight,
  roundFaultEvent,
  round,
}: EnvironmentPanelProps) {
  // 浪高對應說明
  const waveLabels: Record<number, string> = {
    1: t('wave.level.flat') || '平靜 🌊',
    2: t('wave.level.light') || '小浪 🌊',
    3: t('wave.level.moderate') || '中浪 ⚠️ (維修減半)',
    4: t('wave.level.heavy') || '大浪 🚨 (出海受阻)',
  };

  const waveDesc = waveLabels[waveHeight] || '未知';

  return (
    <div className="bg-gray-900/60 backdrop-blur rounded-2xl border border-gray-800/80 p-4 shadow-xl flex flex-col gap-3.5">
      <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
        <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">
          環境與氣候監控
        </span>
        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded font-mono">
          ROUND {round}/12
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 1. 風速看板 */}
        <div className="bg-gray-950/40 rounded-xl border border-gray-800/40 p-3 flex flex-col gap-1.5 shadow-inner">
          <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold tracking-wider uppercase">
            <span>風速骰</span>
            <span className="font-mono">Coeff: {wind.coeff}x</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-extrabold text-sky-400">{wind.label}</span>
            <span className="text-xs text-gray-400 font-mono">({wind.speed} m/s)</span>
          </div>
          <span className="text-[9px] text-gray-500 leading-normal">
            風速決定發電效率。颱風會導致全面停機。
          </span>
        </div>

        {/* 2. 浪高看板 */}
        <div className="bg-gray-950/40 rounded-xl border border-gray-800/40 p-3 flex flex-col gap-1.5 shadow-inner">
          <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold tracking-wider uppercase">
            <span>浪高骰</span>
            <span className="font-mono">Level: {waveHeight}/4</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-extrabold text-indigo-400">{waveDesc}</span>
          </div>
          <span className="text-[9px] text-gray-500 leading-normal">
            中浪使非防浪技師效率減半；大浪限制出海作業。
          </span>
        </div>
      </div>

      {/* 3. 本回合環境事件 */}
      {roundFaultEvent ? (
        <div className="bg-rose-950/20 border border-rose-900/35 rounded-xl p-3 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">🚨</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-rose-300">本回合突發環境故障</span>
              <span className="text-[10px] text-rose-400 mt-0.5">
                設備 {roundFaultEvent.turbineId} 遭遇了故障 (ID: {roundFaultEvent.cardId})
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-rose-950 text-rose-400 border border-rose-900/50 px-2 py-0.5 rounded font-mono font-bold">
            已發生
          </span>
        </div>
      ) : (
        <div className="bg-gray-950/25 border border-gray-800/40 rounded-xl p-3 flex items-center gap-3 text-gray-500 text-xs">
          <span>🛡️</span>
          <span>本回合氣候平穩，無新增環境突發故障。</span>
        </div>
      )}
    </div>
  );
}
