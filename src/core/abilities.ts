// ============================================================
// Sprint 3：能力 tag 純函式查詢輔助。
//   - 不做大型 hook 抽象表（過早抽象、難除錯），改在 rules-engine / actions 對應位置呼叫此檔的純查詢函式。
//   - 所有函式無副作用、不消耗 RNG；只是「掃過卡牌靜態定義（CARDS）回答 yes/no/number」。
//   - 標「估計」的 tag：在 v3 無原型基準，行為依 DESIGN.md 重建（見 NOTES.md「無原型基準」項）。
// ============================================================
import type { DeployedTurbine, PlayerState, Wind } from './types';
import { CARDS } from './cards';

// ---------- S3.2：低風補正 / 離岸延遲 / 颱風脆弱 估計值（無 v3 基準） ----------
/** M03 lowwind-resist：低風 coeff=0.4 時補正到 0.7（介於額定與低風中間） */
export const LOWWIND_RESIST_COEFF = 0.7;
/** M06 storm-vulnerable：高風 coeff=0.7 時懲罰 ÷2 = 0.35（颱風 0.0 無感） */
export const STORM_VULNERABLE_MULT = 0.5;
// ---------- S3.3：M08–M12 估計值（無 v3 基準） ----------
/** M11 lowwind-boost：低風 0.4 → 1.0（比 M03 resist 強，因 M11 同時帶 highwind-penalty 雙刃劍） */
export const LOWWIND_BOOST_COEFF = 1.0;
/** M11 highwind-penalty：高風 0.7 → 0.35（與 M06 同 ÷2 邏輯） */
export const HIGHWIND_PENALTY_MULT = 0.5;
/** M12 no-wind-power：不受風影響，永遠 1.0（電池/儲能特性） */
export const NO_WIND_POWER_COEFF = 1.0;
/** M08 fragile：施加故障時 drop 倍率（受傷加重） */
export const FRAGILE_DROP_MULT = 1.5;

/** M07 aura-mw：場上任一 turbine 帶此 tag → 自家所有 turbine +value MW（光環，含自身）。 */
export function getAuraMwBonus(p: PlayerState): number {
  let bonus = 0;
  for (const t of p.turbines) {
    for (const a of CARDS[t.cardId].abilities) {
      if (a.tag === 'aura-mw') bonus += a.value ?? 1;
    }
  }
  return bonus;
}

/**
 * M07 weather-immune：免疫天氣的「負面」效果。
 * 解讀：低風（×0.4）/ 颱風（×0.0）/ 高風（×0.7）皆視為 ×1.0（額定）；額定（1.0）保持。
 * 即：effectiveCoeff = max(coeff, 1.0)。
 */
export function hasWeatherImmune(t: DeployedTurbine): boolean {
  return CARDS[t.cardId].abilities.some((a) => a.tag === 'weather-immune');
}

/**
 * M07 card-draw-trigger：場上任一 turbine 帶此 tag，當該玩家出 tech 或 func 卡 → 抽 1 張。
 * 此函式僅回答「是否有觸發資格」；實際的「抽牌」由 actions 端在出牌結算後呼叫 _drawCard。
 */
export function hasCardDrawTrigger(p: PlayerState): boolean {
  return p.turbines.some((t) =>
    CARDS[t.cardId].abilities.some((a) => a.tag === 'card-draw-trigger'),
  );
}

/** M03 lowwind-resist：帶此 tag 的 turbine ✓ */
export function hasLowwindResist(t: DeployedTurbine): boolean {
  return CARDS[t.cardId].abilities.some((a) => a.tag === 'lowwind-resist');
}

/** M06 storm-vulnerable：帶此 tag 的 turbine ✓（高風時 ×STORM_VULNERABLE_MULT 懲罰） */
export function hasStormVulnerable(t: DeployedTurbine): boolean {
  return CARDS[t.cardId].abilities.some((a) => a.tag === 'storm-vulnerable');
}

/** M11 lowwind-boost：低風時 coeff 補正到 LOWWIND_BOOST_COEFF（比 lowwind-resist 強） */
export function hasLowwindBoost(t: DeployedTurbine): boolean {
  return CARDS[t.cardId].abilities.some((a) => a.tag === 'lowwind-boost');
}

/** M11 highwind-penalty：高風時 coeff × HIGHWIND_PENALTY_MULT */
export function hasHighwindPenalty(t: DeployedTurbine): boolean {
  return CARDS[t.cardId].abilities.some((a) => a.tag === 'highwind-penalty');
}

/** M12 no-wind-power：不受風影響（永遠額定） */
export function hasNoWindPower(t: DeployedTurbine): boolean {
  return CARDS[t.cardId].abilities.some((a) => a.tag === 'no-wind-power');
}

/** M10 no-slot：不佔機組格（3 台上限例外）。canPlayCard 對 turbine 滿 3 台時放行此卡。 */
export function hasNoSlot(cardId: string): boolean {
  return CARDS[cardId].abilities.some((a) => a.tag === 'no-slot');
}

/** 場上 M10（no-slot）的數量，用於 turbines.length - noSlotCount 比對 3 台上限 */
export function countNoSlotTurbines(p: PlayerState): number {
  return p.turbines.filter((t) => hasNoSlot(t.cardId)).length;
}

/** M08 fragile：被施加故障時 drop ×FRAGILE_DROP_MULT */
export function isFragile(t: DeployedTurbine): boolean {
  return CARDS[t.cardId].abilities.some((a) => a.tag === 'fragile');
}

/** S3.4：T06 periodic-repair — 場上是否有此 tag 的技師（runGame 回合末追加修一張 sev≤3 故障）。 */
export function hasPeriodicRepair(p: PlayerState): boolean {
  return p.techs.some((id) => CARDS[id].abilities.some((a) => a.tag === 'periodic-repair'));
}

// ---------- S3.5：F 類故障 tag ----------
/** F05 storm-amplify：高風 0.7 或颱風時，該故障的 drop ×STORM_AMPLIFY_MULT（估計值）。 */
export const STORM_AMPLIFY_MULT = 2;
/** F08 unpredictable：每回合 P(shuffle)= UNPREDICTABLE_PROB 把故障 swap 到對手另一台機組。 */
export const UNPREDICTABLE_PROB = 0.5;

export function isStormAmplifyFault(faultCardId: string): boolean {
  return CARDS[faultCardId].abilities.some((a) => a.tag === 'storm-amplify');
}

export function isUnpredictableFault(faultCardId: string): boolean {
  return CARDS[faultCardId].abilities.some((a) => a.tag === 'unpredictable');
}

export function isDisableScadaFault(faultCardId: string): boolean {
  return CARDS[faultCardId].abilities.some((a) => a.tag === 'disable-scada');
}

// ---------- S3.6：天氣 W01–W05 ----------
/** 風速加成（W01 wind-boost）：coeff += WEATHER_WIND_BOOST_DELTA（cap 1.0） */
export const WEATHER_WIND_BOOST_DELTA = 0.3;
/** 風速懲罰（W03/W05 wind-penalty）：coeff -= WEATHER_WIND_PENALTY_DELTA（cap 0） */
export const WEATHER_WIND_PENALTY_DELTA = 0.3;
/** W04 mwh-double：本回合 MWh 倍率（取代 FN06 ×1.5，與 mwhBoostActive 並存時取大） */
export const WEATHER_MWH_DOUBLE_MULT = 2.0;

/** 給 ActiveWeather 的 cardId 查 tag 是否含某項 */
function weatherHas(weatherCardId: string, tag: string): boolean {
  return CARDS[weatherCardId].abilities.some((a) => a.tag === tag);
}

/** 當前 activeWeather 中是否有 wind-boost（W01） */
export function isWindBoostActive(activeWeather: readonly { cardId: string }[]): boolean {
  return activeWeather.some((w) => weatherHas(w.cardId, 'wind-boost'));
}

/** 當前 activeWeather 中是否有 wind-penalty（W03/W05） */
export function isWindPenaltyActive(activeWeather: readonly { cardId: string }[]): boolean {
  return activeWeather.some((w) => weatherHas(w.cardId, 'wind-penalty'));
}

/** 當前 activeWeather 中是否有 shutdown-all（W02） */
export function isShutdownAllActive(activeWeather: readonly { cardId: string }[]): boolean {
  return activeWeather.some((w) => weatherHas(w.cardId, 'shutdown-all'));
}

/** 當前 activeWeather 中是否有 mwh-double（W04） */
export function isMwhDoubleActive(activeWeather: readonly { cardId: string }[]): boolean {
  return activeWeather.some((w) => weatherHas(w.cardId, 'mwh-double'));
}

/** W01 self-boost-wind 加成倍率（打出者額外 MWh 加成） */
export const WEATHER_SELF_BOOST_MULT = 1.1;

/** 查詢 activeWeather 中是否有某張卡有指定 tag，且是由指定玩家打出 */
function weatherHasForPlayer(
  activeWeather: readonly { cardId: string; appliedBy: 0 | 1 }[],
  player: 0 | 1,
  tag: string,
): boolean {
  return activeWeather.some((w) => w.appliedBy === player && weatherHas(w.cardId, tag));
}

/** 當前玩家是否有打出的 W02（self-immune-shutdown）→ 打出者機組免疫全場停機 */
export function isSelfImmuneShutdown(
  activeWeather: readonly { cardId: string; appliedBy: 0 | 1 }[],
  player: 0 | 1,
): boolean {
  return weatherHasForPlayer(activeWeather, player, 'self-immune-shutdown');
}

/** 當前玩家是否有打出的 W03/W05（self-immune-wind-penalty）→ 打出者不受風速懲罰 */
export function isSelfImmuneWindPenalty(
  activeWeather: readonly { cardId: string; appliedBy: 0 | 1 }[],
  player: 0 | 1,
): boolean {
  return weatherHasForPlayer(activeWeather, player, 'self-immune-wind-penalty');
}

/** 當前玩家是否有打出的 W01（self-boost-wind）→ 打出者額外 MWh ×1.1 */
export function isSelfBoostWind(
  activeWeather: readonly { cardId: string; appliedBy: 0 | 1 }[],
  player: 0 | 1,
): boolean {
  return weatherHasForPlayer(activeWeather, player, 'self-boost-wind');
}

/** 當前玩家是否有打出的 W05（self-immune-blade-fault）→ 打出者不受 random-blade 故障 */
export function isSelfImmuneBladeFault(
  activeWeather: readonly { cardId: string; appliedBy: 0 | 1 }[],
  player: 0 | 1,
): boolean {
  return weatherHasForPlayer(activeWeather, player, 'self-immune-blade-fault');
}

/**
 * 套用天氣風況到 base Wind：先 boost 再 penalty（兩者共存時抵消）。
 * 不改入參，回新 Wind 物件。typhoon 標記不受影響（W02 shutdown-all 走別的路徑）。
 */
export function applyWeatherToWind(base: Wind, activeWeather: readonly { cardId: string }[]): Wind {
  let coeff = base.coeff;
  if (isWindBoostActive(activeWeather)) coeff = Math.min(1.0, coeff + WEATHER_WIND_BOOST_DELTA);
  if (isWindPenaltyActive(activeWeather)) coeff = Math.max(0, coeff - WEATHER_WIND_PENALTY_DELTA);
  return { ...base, coeff };
}

// ---------- S3.7：合約條件判定 ----------
/**
 * 判斷合約條件「本回合」是否滿足。回傳本回合是否達標（true=可累積 progress / 一次性可立即 reward）。
 * - highAvail（C01）：自家所有機組（含 fault drop）avail ≥ threshold
 * - totalMW（C02）：自家機組 mw（含 mwBonus + aura-mw）總和 ≥ threshold
 * - techCount（C03）：自家 techs 數 ≥ threshold
 * - killOpponent（C04）：對手所有機組 effectiveAvail ≤ 0（all knocked out）
 */
export function evaluateContractCondition(
  cardId: string,
  player: 0 | 1,
  state: {
    readonly players: readonly [PlayerState, PlayerState];
  },
): boolean {
  const card = CARDS[cardId];
  const target = card.target;
  if (!target) return false;
  const me = state.players[player];
  const opp = state.players[1 - player];
  const threshold = target.threshold ?? 0;

  switch (target.type) {
    case 'highAvail': {
      if (me.turbines.length === 0) return false;
      return me.turbines.every((t) => {
        const totalDrop = t.faults.reduce((s, f) => s + f.drop, 0);
        return Math.max(0, t.avail - totalDrop) >= threshold;
      });
    }
    case 'totalMW': {
      const auraMw = getAuraMwBonus(me);
      const total = me.turbines.reduce(
        (sum, t) => sum + (CARDS[t.cardId].stats?.mw ?? 0) + t.mwBonus + auraMw,
        0,
      );
      return total >= threshold;
    }
    case 'techCount': {
      return me.techs.length >= threshold;
    }
    case 'killOpponent': {
      if (opp.turbines.length === 0) return true; // 對手無機組 vacuously true
      return opp.turbines.every((t) => {
        const totalDrop = t.faults.reduce((s, f) => s + f.drop, 0);
        return Math.max(0, t.avail - totalDrop) <= 0;
      });
    }
    default:
      return false;
  }
}

/**
 * M05 offshore-delay：部署當回合不結算。
 * 判定：turbine.deployedRound 等於當前回合 → 仍延遲（skip）。createInitialState 的開局機組 deployedRound=0，不會延遲。
 */
export function isOffshoreDelayed(t: DeployedTurbine, currentRound: number): boolean {
  if (!CARDS[t.cardId].abilities.some((a) => a.tag === 'offshore-delay')) return false;
  return (t.deployedRound ?? 0) === currentRound;
}

/**
 * S3.2 + S3.3：把單台 turbine 在某風況下的有效 coeff 一次算到底（套用所有 tag）。
 * 順序（重要：互動正確性）：
 * 1. offshore-delay → skip
 * 2. no-wind-power（M12）→ 直接 = NO_WIND_POWER_COEFF（最高優先，蓋過所有風況）
 * 3. weather-immune（M07）→ max(coeff, 1.0)
 * 4. lowwind-resist（M03）：低風 → LOWWIND_RESIST_COEFF
 * 5. lowwind-boost（M11）：低風 → LOWWIND_BOOST_COEFF（與 resist 同源風況；M11 比 M03 強）
 * 6. storm-vulnerable（M06）：高風 → × STORM_VULNERABLE_MULT
 * 7. highwind-penalty（M11）：高風 → × HIGHWIND_PENALTY_MULT
 * 註：M03 與 M11 都對低風加成（互斥不同卡）；M06 與 M11 都對高風懲罰（互斥不同卡）。
 */
export function effectiveCoeff(
  t: DeployedTurbine,
  wind: Wind,
  currentRound: number,
): { coeff: number; skip: boolean } {
  if (isOffshoreDelayed(t, currentRound)) return { coeff: 0, skip: true };
  if (hasNoWindPower(t)) return { coeff: NO_WIND_POWER_COEFF, skip: false };
  let c = wind.coeff;
  if (hasWeatherImmune(t)) c = Math.max(c, 1.0);
  if (hasLowwindResist(t) && wind.coeff === 0.4) c = LOWWIND_RESIST_COEFF;
  if (hasLowwindBoost(t) && wind.coeff === 0.4) c = LOWWIND_BOOST_COEFF;
  if (hasStormVulnerable(t) && wind.coeff === 0.7) c *= STORM_VULNERABLE_MULT;
  if (hasHighwindPenalty(t) && wind.coeff === 0.7) c *= HIGHWIND_PENALTY_MULT;
  return { coeff: c, skip: false };
}

/**
 * M09 immune-hydraulic：免疫液壓系故障（F03 液壓漏油）。
 * M10 fault-immune：免疫所有故障（estimated；DESIGN 註此為傳奇級保護）。
 * 在施加故障入口判斷：若回 true，整個 _applyFault 對該目標短路（包含 cascade 命中也跳過）。
 */
export function isFaultImmune(t: DeployedTurbine, faultId: string): boolean {
  const card = CARDS[t.cardId];
  for (const a of card.abilities) {
    if (a.tag === 'fault-immune') return true;
    if (a.tag === 'immune-hydraulic' && faultId === 'F03') return true;
  }
  return false;
}

/**
 * T05 fault-warning：場上有技師具備 fault-warning tag 則回 true。
 * 用於 _beginTurn 中判斷對手是否有 SCADA 工程師預警能力。
 */
export function hasFaultWarning(p: PlayerState): boolean {
  return p.techs.some((id) => CARDS[id].abilities.some((a) => a.tag === 'fault-warning'));
}
