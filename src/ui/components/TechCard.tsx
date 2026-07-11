import type { DeployedTech } from '../../core/types';
import { CARDS, getCard } from '../../core/cards';
import { cardName, t } from '../../i18n';
import { StaminaBar } from './StaminaBar';

interface TechCardProps {
  readonly tech: DeployedTech;
  readonly isPlayer: boolean;
  readonly isActive: boolean;
  readonly isYourTurn?: boolean;
  readonly pendingSkillTag?: string | null;
  readonly onActivateSkill?: (skillTag: string) => void;
  readonly onRetreat?: () => void;
  readonly onPromote?: () => void;
}

export function TechCard({
  tech,
  isPlayer,
  isActive,
  isYourTurn = false,
  pendingSkillTag,
  onActivateSkill,
  onRetreat,
  onPromote,
}: TechCardProps) {
  const card = getCard(tech.cardId);
  const name = cardName(tech.cardId) || tech.cardId;

  // 取得當前等級的技能
  const levelKey = tech.level === 3 ? 'lv3' : tech.level === 2 ? 'lv2' : 'lv1';
  const skill = card.skills?.[levelKey];

  // 顯示等級標籤
  const levelLabel =
    tech.level === 3
      ? t('tech.level.expert') || '資深'
      : tech.level === 2
      ? t('tech.level.senior') || '高級'
      : t('tech.level.junior') || '初階';

  // 顯示專長標籤
  const specialtyLabel = card.specialty
    ? t(`category.${card.specialty}`) || card.specialty
    : t('category.general') || '通用';

  const specialtyIcons: Record<string, string> = {
    mechanical: '⚙️',
    blade: '🪂',
    electrical: '⚡',
    sensor: '📡',
    hydraulic: '🔬',
  };
  const specIcon = card.specialty ? specialtyIcons[card.specialty] || '🔧' : '🔧';

  // 格式化技能名稱
  const skillDisplayName = skill
    ? t(`skills.${skill.tag}.name`) ||
      skill.tag
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : '無技能';

  const skillDesc = skill
    ? t(`skills.${skill.tag}.desc`) ||
      `耗費 ${skill.staminaCost} 耐久${
        skill.repairPower ? `，修復力為 ${skill.repairPower}` : ''
      }${skill.availBoost ? `，可用率提升 ${skill.availBoost}%` : ''}${
        skill.mwBoost ? `，發電容量提升 ${skill.mwBoost} MW` : ''
      }`
    : '';

  // 檢查工具
  const toolName = tech.attachedToolId ? cardName(tech.attachedToolId) : null;
  const toolIcon = tech.attachedToolId ? CARDS[tech.attachedToolId]?.icon || '📦' : null;

  return (
    <div
      className={`relative w-48 bg-gray-800/90 backdrop-blur rounded-xl border p-3 flex flex-col gap-2.5 shadow-xl transition-all duration-300 ${
        isActive
          ? 'border-emerald-500/80 shadow-emerald-950/20 ring-1 ring-emerald-500/20 scale-102'
          : 'border-gray-700/60 hover:border-gray-600'
      }`}
    >
      {/* 頂部標題 */}
      <div className="flex justify-between items-start gap-1">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-100 truncate w-32">{name}</span>
          <span className="text-[10px] font-semibold text-emerald-400 mt-0.5 tracking-wider uppercase">
            {levelLabel} • {specialtyLabel} {specIcon}
          </span>
        </div>
        <div className="text-xl">{card.icon}</div>
      </div>

      {/* 耐久度條 */}
      <StaminaBar stamina={tech.stamina} maxStamina={tech.maxStamina} />

      {/* 裝備的工具 */}
      {toolName ? (
        <div className="flex items-center gap-1.5 bg-gray-900/65 rounded-lg border border-yellow-600/30 px-2 py-1 text-[10px] text-yellow-300 font-semibold shadow-inner">
          <span>{toolIcon}</span>
          <span className="truncate">{toolName}</span>
        </div>
      ) : (
        <div className="h-6 border border-dashed border-gray-700/40 rounded-lg flex items-center justify-center text-[9px] text-gray-500 font-mono">
          [ 無裝備工具 ]
        </div>
      )}

      {/* 技能資訊與出招按鈕 */}
      {skill && (
        <div className="flex flex-col gap-1.5 bg-gray-950/50 rounded-lg p-2 border border-gray-900 shadow-inner mt-1">
          <div className="flex justify-between items-center text-xs font-bold text-gray-300">
            <span className="truncate max-w-[100px]">{skillDisplayName}</span>
            <span className="text-[10px] text-rose-400 font-mono">⚡{skill.staminaCost}</span>
          </div>
          <span className="text-[10px] text-gray-400 leading-normal">{skillDesc}</span>

          {/* 出招或晉升/撤退按鈕 */}
          {isPlayer && isYourTurn && (
            <div className="flex flex-col gap-1 mt-1.5">
              {isActive ? (
                <>
                  {!tech.usedSkillThisTurn && (
                    <button
                      className={`w-full py-1 rounded text-xs font-bold transition-all text-white ${
                        pendingSkillTag === skill.tag
                          ? 'bg-rose-500 animate-pulse'
                          : 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/40 hover:shadow-lg'
                      }`}
                      onClick={() => onActivateSkill?.(skill.tag)}
                    >
                      {pendingSkillTag === skill.tag ? '請點選風機...' : '使用技能 ⚔️'}
                    </button>
                  )}
                  {onRetreat && (
                    <button
                      className="w-full py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-[10px] font-semibold transition"
                      onClick={onRetreat}
                    >
                      撤退下場 🔄
                    </button>
                  )}
                </>
              ) : (
                onPromote && (
                  <button
                    className="w-full py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold transition shadow"
                    onClick={onPromote}
                  >
                    晉升主力 ⬆️
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
