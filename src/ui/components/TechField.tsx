import type { FieldState } from '../../core/types';
import { TechCard } from './TechCard';
import { t } from '../../i18n';

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

  return (
    <div className="flex flex-col gap-4 bg-gray-900/30 rounded-2xl border border-gray-800/40 p-4 shadow-inner">
      {/* 區塊標題 */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">
          {isPlayer ? '我的技師陣容' : '對手的技師陣容'}
        </span>
        <span className="text-[10px] text-gray-500 font-semibold font-mono">
          ({active ? 1 : 0} 主力, {bench.length}/3 備戰)
        </span>
      </div>

      <div className="flex flex-row items-center gap-6 flex-wrap md:flex-nowrap">
        {/* 1. 主力技師區 */}
        <div className="flex flex-col gap-2 items-center">
          <span className="text-[10px] font-extrabold text-emerald-500 tracking-widest uppercase">
            主力技師 (Active)
          </span>
          {active ? (
            <TechCard
              tech={active}
              isPlayer={isPlayer}
              isActive={true}
              isYourTurn={isYourTurn}
              pendingSkillTag={pendingSkillTag}
              onActivateSkill={onActivateSkill}
              onRetreat={onRetreat ? () => onRetreat(0) : undefined} // retreat logic is handled by store
            />
          ) : (
            <div className="w-48 h-[225px] border-2 border-dashed border-gray-700/60 rounded-xl flex flex-col justify-center items-center gap-2 bg-gray-950/20 text-gray-500 transition-all duration-300 hover:border-gray-600 hover:bg-gray-950/30">
              <span className="text-3xl filter grayscale opacity-40">🔧</span>
              <span className="text-xs font-bold">{t('tech.slot.empty') || '主力空缺'}</span>
              <span className="text-[9px] text-gray-600 px-4 text-center leading-relaxed">
                打出技師卡，或晉升備戰技師
              </span>
            </div>
          )}
        </div>

        {/* 箭頭/隔板 */}
        {bench.length > 0 && (
          <div className="hidden md:flex text-gray-700 text-xl font-light">|</div>
        )}

        {/* 2. 備戰技師區 */}
        <div className="flex flex-col gap-2 items-start flex-1">
          {bench.length > 0 && (
            <span className="text-[10px] font-extrabold text-gray-500 tracking-widest uppercase pl-1">
              備戰區 (Bench)
            </span>
          )}
          <div className="flex flex-row gap-3 flex-wrap">
            {bench.map((tech, idx) => (
              <div key={tech.cardId} className="flex flex-col gap-1">
                <TechCard
                  tech={tech}
                  isPlayer={isPlayer}
                  isActive={false}
                  isYourTurn={isYourTurn}
                  onPromote={onPromote ? () => onPromote(idx) : undefined}
                  onRetreat={onRetreat ? () => onRetreat(idx) : undefined}
                />
              </div>
            ))}
            {/* 補足備戰區虛擬框 (最多3個) */}
            {isPlayer && bench.length < 3 && (
              <div className="w-48 h-[225px] border border-dashed border-gray-800/40 rounded-xl flex flex-col justify-center items-center text-gray-600 bg-gray-950/5 p-4 text-center">
                <span className="text-xl opacity-30">📦</span>
                <span className="text-[10px] font-semibold mt-1">備戰欄位 #{bench.length + 1}</span>
                <span className="text-[8px] text-gray-700 mt-0.5">空閒</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
