import type { FieldState } from '../../core/types';
import { TechCard } from './TechCard';

interface TechFieldProps {
  readonly field: FieldState;
  readonly isPlayer: boolean;
  readonly isYourTurn: boolean;
  readonly pendingSkillTag?: string | null;
  readonly onActivateSkill?: (skillTag: string) => void;
  readonly onRetreat?: (benchIdx: number) => void;
  readonly onPromote?: (benchIdx: number) => void;
}

export function TechField({
  field,
  isPlayer,
  isYourTurn,
  pendingSkillTag,
  onActivateSkill,
  onRetreat,
  onPromote,
}: TechFieldProps) {
  const { active, bench } = field;
  const activeZoneClass = isPlayer
    ? 'border-emerald-400/50 bg-emerald-950/15'
    : 'border-rose-400/50 bg-rose-950/15';
  const activeLabelClass = isPlayer ? 'text-emerald-200' : 'text-rose-200';

  return (
    <div className="relative rounded-[28px] border border-white/10 bg-slate-950/55 p-4 shadow-2xl shadow-black/20">
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.16),transparent_45%)]" />
      <div className="relative flex items-center justify-between pb-3">
        <div>
          <div className={`text-[11px] font-black tracking-[0.28em] uppercase ${isPlayer ? 'text-emerald-300' : 'text-rose-300'}`}>
            {isPlayer ? 'PLAYER TECH ARENA' : 'AI TECH ARENA'}
          </div>
          <div className="text-[10px] text-slate-400">
            戰鬥區 1 名技師 · 備戰區最多 3 名 · 疲勞滿則退場
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold text-slate-300">
          戰鬥區 {active ? 1 : 0}/1 · 備戰 {bench.length}/3
        </div>
      </div>

      <div className="relative grid gap-4 lg:grid-cols-[230px_1fr]">
        <section className={`rounded-2xl border-2 p-3 shadow-inner ${activeZoneClass}`}>
          <div className={`mb-2 text-center text-[11px] font-black tracking-[0.22em] ${activeLabelClass}`}>
            戰鬥區 ACTIVE
          </div>
          {active ? (
            <TechCard
              tech={active}
              isPlayer={isPlayer}
              isActive={true}
              isYourTurn={isYourTurn}
              pendingSkillTag={pendingSkillTag}
              onActivateSkill={onActivateSkill}
              onRetreat={onRetreat ? () => onRetreat(0) : undefined}
            />
          ) : (
            <div className="flex h-[245px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-700/70 bg-slate-950/45 text-slate-500">
              <span className="text-4xl opacity-50">🔧</span>
              <span className="text-sm font-black">戰鬥區空缺</span>
              <span className="px-5 text-center text-[10px] leading-relaxed text-slate-600">
                從手牌派出技師，或把備戰技師晉升上場
              </span>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[11px] font-black tracking-[0.22em] text-slate-400">備戰區 BENCH</div>
            <div className="text-[10px] text-slate-500">準備替換、保留專長、等待工具</div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {bench.map((tech, idx) => (
              <TechCard
                key={`${tech.cardId}-${idx}`}
                tech={tech}
                isPlayer={isPlayer}
                isActive={false}
                isYourTurn={isYourTurn}
                onPromote={onPromote ? () => onPromote(idx) : undefined}
                onRetreat={onRetreat ? () => onRetreat(idx) : undefined}
              />
            ))}
            {Array.from({ length: Math.max(0, 3 - bench.length) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="flex min-h-[210px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/50 bg-slate-950/20 p-4 text-center text-slate-600"
              >
                <span className="text-2xl opacity-40">📦</span>
                <span className="mt-2 text-[11px] font-bold">備戰欄位 #{bench.length + idx + 1}</span>
                <span className="mt-1 text-[9px]">放入不同專長技師，應對不同故障</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
