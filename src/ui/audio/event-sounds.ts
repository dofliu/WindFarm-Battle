// ============================================================
// 事件流 → 音效／震動 的映射（D9：UI 由 core 事件流驅動）。
//
// 分兩層：
//   1. 純函式 eventToCue / eventsToCues：把 GameEvent 映射成音效/震動指令。
//      無任何瀏覽器依賴 → 可單元測試（tests/event-sounds.test.ts）。
//   2. playEventSounds：讀設定、呼叫合成引擎、觸發手機震動（副作用層）。
//
// selfPlayer 觀點：分數只在「自己」那筆 round-scored 響一次（避免雙方各響一次糊掉）；
// 受擊震動只在自己是受害者時觸發；game-over 依勝負選 win/lose/draw。
// ============================================================
import type { GameEvent } from '../../core/events';
import type { SoundName } from './sound-engine';
import { play, unlock } from './sound-engine';
import { getSettings } from '../../store/settings-store';

export type Haptic = 'light' | 'heavy' | 'win';

export interface SoundCue {
  readonly sound: SoundName;
  readonly haptic?: Haptic;
}

/**
 * 單一事件 → 音效指令（純函式）。回傳 null＝此事件不發聲。
 * fault-applied/incident 的 player 欄位是「受害者」（見 game-store._deriveEffects 註解），
 * 故 victim===self 時才給重震動。
 */
export function eventToCue(event: GameEvent, self: 0 | 1 = 0): SoundCue | null {
  switch (event.kind) {
    case 'round-start':
      return { sound: 'roundStart' };
    case 'tech-deployed':
      return { sound: 'techDeploy' };
    case 'tech-promoted':
    case 'turbine-restart':
      return { sound: 'deploy' };
    case 'tech-evolved':
      // 技師升級（Lv2/Lv3）：亮音強化成長感
      return { sound: 'mwhBoost' };
    case 'tech-retired':
    case 'stamina-depleted':
      // 力竭退場：警示下墜音（自己的技師倒下給重震動）
      return { sound: 'shutdown', haptic: event.player === self ? 'heavy' : undefined };
    case 'tool-attached':
      return { sound: 'shieldUp' };
    case 'item-played':
      return { sound: 'cardPlay' };
    case 'contract-played':
      return { sound: 'contract' };
    case 'fault-applied':
      return { sound: 'faultHit', haptic: event.player === self ? 'heavy' : undefined };
    case 'incident':
      // 同題共享事件：雙方同槽受擊 → 對玩家一律視為受擊
      return { sound: 'faultHit', haptic: 'heavy' };
    case 'fault-repaired':
      return { sound: event.quality === 'partial' ? 'repairPartial' : 'repairFull' };
    case 'turbine-shielded':
      return { sound: 'shieldUp' };
    case 'shield-absorbed':
      return { sound: 'shieldAbsorb' };
    case 'skill-used':
      return { sound: 'skill' };
    case 'stamina-restored':
      // 補血：亮音（自己的技師被治癒才響，避免 AI 補血洗版）
      return event.player === self ? { sound: 'mwhBoost' } : null;
    case 'predict-wind':
      return { sound: 'weather' };
    case 'turbine-upgraded':
      return { sound: 'mwhBoost' };
    case 'retreat':
      return { sound: 'retreat' };
    case 'turbine-shutdown':
      return { sound: 'shutdown', haptic: event.player === self ? 'heavy' : undefined };
    case 'round-scored':
      // 只在自己得分那筆響一次
      return event.player === self ? { sound: 'score' } : null;
    case 'game-over':
      if (event.winner === -1) return { sound: 'draw' };
      return event.winner === self ? { sound: 'win', haptic: 'win' } : { sound: 'lose' };
    default:
      // card-played / card-drawn / card-discarded / turn-ended / contract-expired → 靜默（避免糊成一片）
      return null;
  }
}

const BATCH_CAP = 7;

/**
 * 一批事件 → 去重後的音效序列（純函式）。
 * - 折疊「連續相同」音效（例：連鎖產生的兩筆 faultHit）
 * - 只保留最後 BATCH_CAP 筆：一批事件的敘事高潮（結算/勝負）在尾端，
 *   AI 的次要動作在前段，超量時優先保留尾端最有意義的音。
 */
export function eventsToCues(events: readonly GameEvent[], self: 0 | 1 = 0): SoundCue[] {
  const raw: SoundCue[] = [];
  for (const e of events) {
    const cue = eventToCue(e, self);
    if (!cue) continue;
    const prev = raw[raw.length - 1];
    if (prev && prev.sound === cue.sound && !cue.haptic) continue; // 折疊連續相同
    raw.push(cue);
  }
  return raw.length > BATCH_CAP ? raw.slice(raw.length - BATCH_CAP) : raw;
}

// ── 副作用層：實際播放 ────────────────────────────────────────
const STAGGER_SEC = 0.07;

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* 部分瀏覽器擲例外 */
  }
}

function fireHaptic(h: Haptic): void {
  switch (h) {
    case 'light':
      vibrate(12);
      break;
    case 'heavy':
      vibrate([0, 30, 20, 30]);
      break;
    case 'win':
      vibrate([0, 40, 30, 40, 30, 60]);
      break;
  }
}

/**
 * 播放一批事件對應的音效與震動（副作用）。讀取 settings-store 快照：
 *   soundOn 關 → 不發聲；hapticsOn 關 → 不震動。
 * 錯開 STAGGER 秒避免同一 tick 疊成噪音。
 */
export function playEventSounds(events: readonly GameEvent[], self: 0 | 1 = 0): void {
  const settings = getSettings();
  const cues = eventsToCues(events, self);
  if (cues.length === 0) return;

  if (settings.soundOn) {
    cues.forEach((cue, i) => play(cue.sound, i * STAGGER_SEC));
  }
  if (settings.hapticsOn) {
    cues.forEach((cue) => {
      if (cue.haptic) fireHaptic(cue.haptic);
    });
  }
}

/** 在使用者手勢中解鎖音訊（轉呼叫引擎，供 UI import 單一入口）。 */
export { unlock };
