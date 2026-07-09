// ============================================================
// 學習複盤分析（純函式，core 層）。
//
// 從事件流萃取「教學層」資料——把隱藏的知識-效能修復模型（Route B）
// 變成可複盤的成績：完全 vs 部分修復、因專長不符而永久損失的可用率、
// 本局遇到的故障類別與真實 IEC 標準、維運效率評級。
//
// 定位：與 telemetry.ts 平行（皆為 events → 結構化資料的純提取），
// 但 telemetry 服務研究數據匯出，learning 服務「玩家學到什麼」的教學回饋。
// 無任何 UI / 瀏覽器依賴 → 可單元測試。文案在 i18n（knowledge.*）。
// ============================================================
import type { GameEvent } from './events';
import type { FaultCategory } from './types';
import { categoryOf, iecOf, isTechCard } from './knowledge';

/** 單次修復的教學拆解（供即時解說用）。 */
export interface RepairInsight {
  readonly player: 0 | 1;
  /** 執行修復者原始標記：技師 ID（T0x）或共享資源型別（spare-part/crane）。 */
  readonly by: string;
  /** 若由技師修復，其卡牌 ID；共享資源則 undefined。 */
  readonly techId?: string;
  readonly faultId: string;
  readonly category?: FaultCategory;
  /** true＝專長相符的完全修復；false＝部分修復（有永久損耗）。 */
  readonly matched: boolean;
  /** 部分修復造成的永久可用率損失（%）；完全修復為 0。 */
  readonly availLost: number;
}

export type GradeTier = 'S' | 'A' | 'B' | 'C';

export interface CategoryCount {
  readonly category: FaultCategory;
  readonly count: number;
}

/** 一局的學習複盤報告（以指定玩家＝人類為視角）。 */
export interface LearningReport {
  readonly totalRepairs: number;
  readonly fullRepairs: number;
  readonly partialRepairs: number;
  /** 因專長不符而永久損失的可用率總和（%）。 */
  readonly permanentAvailLost: number;
  /** 完全修復率 full/(full+partial)；無修復時為 1。 */
  readonly matchRate: number;
  readonly grade: GradeTier;
  /** 本局遇到的故障類別（依出現次數排序，多→少）。 */
  readonly categoriesSeen: CategoryCount[];
  /** 本局實際派上用場（執行過修復）的技師卡 ID（去重）。 */
  readonly specialistsUsed: string[];
  /** 本局接觸到的 IEC 61400 系列標準碼（去重、排序）。 */
  readonly iecSeen: string[];
}

/**
 * 把單一 fault-repaired 事件拆解成教學洞察。
 * 非 fault-repaired 事件回傳 null。
 */
export function explainRepair(e: GameEvent): RepairInsight | null {
  if (e.kind !== 'fault-repaired') return null;
  const techId = isTechCard(e.by ?? '') ? e.by : undefined;
  return {
    player: e.player,
    by: e.by ?? '',
    techId,
    faultId: e.cardId,
    category: categoryOf(e.cardId),
    matched: e.quality !== 'partial',
    availLost: e.availLost ?? 0,
  };
}

/** 維運效率評級：依完全修復率分級。 */
export function gradeFor(matchRate: number, totalRepairs: number): GradeTier {
  if (totalRepairs === 0) return 'S'; // 無故障需修＝零損耗
  if (matchRate >= 0.9) return 'S';
  if (matchRate >= 0.7) return 'A';
  if (matchRate >= 0.4) return 'B';
  return 'C';
}

/**
 * 從整場事件流萃取學習複盤報告（預設以人類玩家＝side 0 為視角）。
 */
export function extractLearningReport(events: readonly GameEvent[], self: 0 | 1 = 0): LearningReport {
  let fullRepairs = 0;
  let partialRepairs = 0;
  let permanentAvailLost = 0;
  const categoryCounts = new Map<FaultCategory, number>();
  const specialists = new Set<string>();
  const iec = new Set<string>();

  const bumpCategory = (faultId: string): void => {
    const cat = categoryOf(faultId);
    if (cat) categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    const code = iecOf(faultId);
    if (code) iec.add(code);
  };

  for (const e of events) {
    switch (e.kind) {
      case 'fault-applied':
        // fault-applied.player = 受害者；只計自己遇到的故障
        if (e.player === self) bumpCategory(e.cardId);
        break;
      case 'fault-cascaded':
        if (e.player === self) bumpCategory(e.cardId);
        break;
      case 'incident':
        // 同題共享事件：雙方同時受擊 → 玩家也遇到
        bumpCategory(e.faultCardId);
        break;
      case 'fault-repaired': {
        if (e.player !== self) break;
        const insight = explainRepair(e);
        if (!insight) break;
        if (insight.matched) fullRepairs += 1;
        else {
          partialRepairs += 1;
          permanentAvailLost += insight.availLost;
        }
        if (insight.techId) {
          specialists.add(insight.techId);
          const code = iecOf(insight.techId);
          if (code) iec.add(code);
        }
        break;
      }
      default:
        break;
    }
  }

  const totalRepairs = fullRepairs + partialRepairs;
  const matchRate = totalRepairs > 0 ? fullRepairs / totalRepairs : 1;
  const categoriesSeen: CategoryCount[] = [...categoryCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalRepairs,
    fullRepairs,
    partialRepairs,
    permanentAvailLost,
    matchRate,
    grade: gradeFor(matchRate, totalRepairs),
    categoriesSeen,
    specialistsUsed: [...specialists],
    iecSeen: [...iec].sort(),
  };
}
