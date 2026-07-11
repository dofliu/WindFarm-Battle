import { useEffect, useState } from 'react';
import { cardName } from '../../i18n';

interface EvolutionFXProps {
  readonly techId: string | null;
  readonly level: number | null;
  readonly onComplete?: () => void;
}

export function EvolutionFX({ techId, level, onComplete }: EvolutionFXProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (techId && level) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [techId, level, onComplete]);

  if (!visible || !techId || !level) return null;

  const name = cardName(techId) || techId;
  const levelText = level === 3 ? '資深技師 (Level 3)' : '高級技師 (Level 2)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in transition-all duration-300">
      <div className="relative bg-gradient-to-b from-gray-900 via-emerald-950 to-gray-950 rounded-2xl border border-emerald-500/60 p-8 flex flex-col items-center gap-4 text-center max-w-sm mx-4 shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-scale-up">
        {/* 發光背景光芒 */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 opacity-20 blur-xl animate-pulse" />

        <div className="text-5xl animate-bounce">⚡</div>
        <div className="flex flex-col gap-1 z-10">
          <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">
            等級提升 LEVEL UP!
          </span>
          <h2 className="text-2xl font-black text-white tracking-wide mt-1">{name}</h2>
          <span className="text-sm font-semibold text-gray-300 mt-0.5">{levelText}</span>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-500/35 to-transparent my-2" />

        <div className="text-xs text-emerald-300 font-semibold leading-relaxed bg-emerald-950/60 px-4 py-2 rounded-xl border border-emerald-800/30">
          ✨ 技能效果獲得強化，耐久度上限提升！
        </div>
      </div>
    </div>
  );
}
