import type { Wind } from './types';
import type { Rng } from './rng';

/** 擲風速 1d6 */
export function rollWind(rng: Rng): Wind {
  const roll1 = Math.floor(rng.next() * 6) + 1;
  if (roll1 === 6) {
    // 再次投擲以判斷是否為颱風
    const roll2 = Math.floor(rng.next() * 6) + 1;
    if (roll2 === 6) {
      return {
        roll: 12,
        speed: 25,
        coeff: 0.0,
        label: '強烈颱風 🌀',
        typhoon: true,
      };
    } else {
      return {
        roll: 6,
        speed: 20,
        coeff: 0.7,
        label: '強風 🌬️',
      };
    }
  }

  if (roll1 === 1) {
    return { roll: 1, speed: 0, coeff: 0.0, label: '無風 ☁️' };
  } else if (roll1 <= 3) {
    return { roll: roll1, speed: 5, coeff: 0.4, label: '低風 🍃' };
  } else {
    return { roll: roll1, speed: 10, coeff: 1.0, label: '額定風速  rated ✅' };
  }
}

/** 擲浪高 1d4 */
export function rollWaveHeight(rng: Rng): number {
  return Math.floor(rng.next() * 4) + 1;
}

/** 依據回合數與機率生成環境故障事件 */
export function triggerFaultIncident(round: number, rng: Rng): string | null {
  const roll = rng.next();
  if (round <= 4) {
    // 前期 30% 機率 Sev 1-2
    if (roll < 0.3) {
      const candidates = ['F01', 'F02', 'F03'];
      return candidates[Math.floor(rng.next() * candidates.length)];
    }
  } else if (round <= 8) {
    // 中期 50% 機率 Sev 2-3
    if (roll < 0.5) {
      const candidates = ['F03', 'F04', 'F05'];
      return candidates[Math.floor(rng.next() * candidates.length)];
    }
  } else {
    // 後期 60% 機率 Sev 3-5
    if (roll < 0.6) {
      const candidates = ['F04', 'F05', 'F06', 'F07'];
      return candidates[Math.floor(rng.next() * candidates.length)];
    }
  }
  return null;
}
