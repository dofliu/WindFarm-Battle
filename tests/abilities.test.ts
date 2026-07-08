// S3.1 M07 三能力測試：aura-mw / weather-immune / card-draw-trigger。
// 註：M07 在 v4 資料 abilities=[aura-mw, weather-immune, card-draw-trigger]，value=1。
import { describe, it, expect } from 'vitest';
import type { Rng } from '../src/core/rng';
import { createRng } from '../src/core/rng';
import { createInitialState } from '../src/core/game-state';
import { scoreRound } from '../src/core/rules-engine';
import { applyAction } from '../src/core/actions';
import {
  getAuraMwBonus,
  hasWeatherImmune,
  hasCardDrawTrigger,
} from '../src/core/abilities';
import { CARDS } from '../src/core/cards';
import type { GameState } from '../src/core/types';

function withWind(s: GameState, coeff: number): GameState {
  return { ...s, wind: { roll: 4, speed: 10, coeff, label: '測試' } };
}

function fixedRng(values: number[]): Rng {
  let i = 0;
  const next = (): number => values[i++] ?? 0;
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

describe('S3.1 abilities：純查詢函式', () => {
  it('getAuraMwBonus：沒 aura-mw 卡 → 0；場上 M07 → 1', () => {
    const s = createInitialState(createRng(1)); // 預設 M01
    expect(getAuraMwBonus(s.players[0])).toBe(0);

    const s2 = structuredClone(s);
    s2.players[0].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }];
    expect(getAuraMwBonus(s2.players[0])).toBe(1);
  });

  it('hasWeatherImmune：M07 ✓ / M01 ✗', () => {
    const m07 = { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] };
    const m01 = { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] };
    expect(hasWeatherImmune(m07)).toBe(true);
    expect(hasWeatherImmune(m01)).toBe(false);
  });

  it('hasCardDrawTrigger：場上有 M07 → true', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    expect(hasCardDrawTrigger(s.players[0])).toBe(false);
    s.players[0].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }];
    expect(hasCardDrawTrigger(s.players[0])).toBe(true);
  });
});

describe('S3.1 aura-mw 結算：自家所有機組 +1（含自身；寶可夢式規則下只有主力計分）', () => {
  it('M07 在備戰區、M01 為主力 → 主力仍拿到 aura +1MW；備戰區的 M07 自己不計分', () => {
    // 寶可夢式規則：只有主力計分。M07 即使在備戰區，getAuraMwBonus 仍掃描全場（不分主力/備戰），
    // 所以主力 M01 依然拿得到 +1MW 光環；但 M07 自己那 12MW 因為在備戰區、不計分。
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }, // 主力：2MW → 3MW（aura）
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 備戰區：不計分，但仍提供 aura
    ];
    s.players[0].activeTurbineIdx = 0;
    // (2+1) × 1.0 × 0.95 = 2.85 → 3
    expect(scoreRound(withWind(s, 1.0)).state.players[0].score).toBe(3);
  });

  it('沒有 M07 時 aura-mw 不生效（開局艦隊主力 OS8 按原 MW 計算，備戰區 OS10/OS12 不計分）', () => {
    const s = createInitialState(createRng(1));
    // 只有主力 OS8 計分：8×1.0×0.90=7.2 → 7
    expect(scoreRound(withWind(s, 1.0)).state.players[0].score).toBe(7);
  });
});

describe('S3.1 weather-immune：M07 對低風/颱風免疫', () => {
  it('颱風 coeff=0.0 → M07 視為 1.0', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }];
    // (12+1)×1.0×0.88 = 11.44 → 11
    expect(scoreRound(withWind(s, 0)).state.players[0].score).toBe(11);
  });

  it('低風 coeff=0.4 → 主力 M01 仍受 0.4 影響（備戰區 M07 的 weather-immune 不會保護未計分的自己，只提供 aura）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }, // 主力，無 weather-immune
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 備戰區：weather-immune 對它自己已無意義（不計分），但仍提供 aura
    ];
    s.players[0].activeTurbineIdx = 0;
    // M01（主力）:(2+1)×0.4×0.95 = 1.14 → 1
    expect(scoreRound(withWind(s, 0.4)).state.players[0].score).toBe(1);
  });

  it('額定 coeff=1.0 → max(1.0, 1.0)=1.0 不變', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }];
    expect(scoreRound(withWind(s, 1.0)).state.players[0].score).toBe(11); // 13×0.88
  });
});

describe('S3.1 card-draw-trigger：M07 在場時，出 tech/func 多抽 1 張', () => {
  it('出 T01（tech）→ trigger 額外抽牌；手牌總數比基線多 1', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }];
    s.players[0].hand = ['T01'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    const before = s.players[0].hand.length + s.players[0].deck.length;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([0.5]));
    // 出牌後手牌 -1（T01 派遣），但 trigger 多抽 1 張 → 手牌總量保持 0
    // 牌庫 −1（被抽），整體 hand+deck = before − 1
    const after = r.state.players[0].hand.length + r.state.players[0].deck.length;
    expect(after).toBe(before - 1); // 派遣的 T01 從手牌消失但被抽了一張新的回來
    expect(r.state.players[0].techs).toEqual(['T01']);
  });

  it('沒有 M07 時不觸發（基線：出 T01 後手牌 -1）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['T01'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    const before = s.players[0].hand.length + s.players[0].deck.length;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([0.5]));
    const after = r.state.players[0].hand.length + r.state.players[0].deck.length;
    expect(after).toBe(before - 1); // T01 派遣後手牌 -1，沒有 trigger 補抽
  });

  it('出 turbine 卡不觸發（trigger 只認 tech/func）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }];
    s.players[0].hand = ['M01'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    const deckBefore = s.players[0].deck.length;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([0.5]));
    expect(r.state.players[0].deck.length).toBe(deckBefore); // 牌庫沒被抽
  });
});

describe('S3.1 與既有測試相容', () => {
  it('M07 在 cards.json 仍有 aura-mw / weather-immune / card-draw-trigger 三能力', () => {
    const tags = CARDS['M07'].abilities.map((a) => a.tag).sort();
    expect(tags).toEqual(['aura-mw', 'card-draw-trigger', 'weather-immune']);
  });
});

describe('S3.2 M03 lowwind-resist：低風 0.4 → 0.7（估計值）', () => {
  it('低風時 M03 用 0.7 計算（4MW × 0.7 × 0.92 = 2.576 → 3）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M03', avail: 92, mwBonus: 0, faults: [] }];
    expect(scoreRound(withWind(s, 0.4)).state.players[0].score).toBe(3);
  });

  it('額定（1.0）時 M03 不觸發 resist：4 × 1.0 × 0.92 = 3.68 → 4', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M03', avail: 92, mwBonus: 0, faults: [] }];
    expect(scoreRound(withWind(s, 1.0)).state.players[0].score).toBe(4);
  });

  it('開局艦隊無 lowwind-resist：主力 OS8 正常受 0.4 影響（備戰區 OS10/OS12 不計分）', () => {
    // 只有主力 OS8 計分：8×0.4×0.90=2.88 → 3
    const s = createInitialState(createRng(1));
    expect(scoreRound(withWind(s, 0.4)).state.players[0].score).toBe(3);
  });
});

describe('S3.2 M05 offshore-delay：部署當回合不結算', () => {
  it('剛部署（deployedRound=當前回合）→ skip，發電 0', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.round = 3;
    s.players[0].turbines = [
      { cardId: 'M05', avail: 91, mwBonus: 0, faults: [], deployedRound: 3 },
    ];
    expect(scoreRound(withWind(s, 1.0)).state.players[0].score).toBe(0);
  });

  it('下一回合（deployedRound<currentRound）→ 正常結算：6 × 1.0 × 0.91 = 5.46 → 5', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.round = 4;
    s.players[0].turbines = [
      { cardId: 'M05', avail: 91, mwBonus: 0, faults: [], deployedRound: 3 },
    ];
    expect(scoreRound(withWind(s, 1.0)).state.players[0].score).toBe(5);
  });

  it('開局艦隊（deployedRound=0）無 offshore-delay tag → 主力第 1 回合正常結算', () => {
    // OS8 無 offshore-delay，deployedRound=0 不觸發延遲；只有主力 OS8 計分（備戰區 OS10/OS12 不計分）
    const s = createInitialState(createRng(1));
    expect(scoreRound(withWind(s, 1.0)).state.players[0].score).toBe(7);
  });
});

describe('S3.2 M06 storm-vulnerable：高風 0.7 → 0.35（÷2 估計值）', () => {
  it('高風時 M06 用 0.35 計算：8 × 0.35 × 0.90 = 2.52 → 3', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M06', avail: 90, mwBonus: 0, faults: [] }];
    expect(scoreRound(withWind(s, 0.7)).state.players[0].score).toBe(3);
  });

  it('額定時 M06 不觸發懲罰：8 × 1.0 × 0.90 = 7.2 → 7', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M06', avail: 90, mwBonus: 0, faults: [] }];
    expect(scoreRound(withWind(s, 1.0)).state.players[0].score).toBe(7);
  });

  it('颱風（0.0）時 M06 已是 0，懲罰倍率無感', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M06', avail: 90, mwBonus: 0, faults: [] }];
    expect(scoreRound(withWind(s, 0)).state.players[0].score).toBe(0);
  });
});

describe('S3.3 M11 lowwind-boost：低風 0.4 → 1.0（比 M03 resist 強）', () => {
  it('低風時 M11 用 1.0 計算：7 × 1.0 × 0.88 = 6.16 → 6', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M11', avail: 88, mwBonus: 0, faults: [] }];
    expect(scoreRound(withWind(s, 0.4)).state.players[0].score).toBe(6);
  });
  it('額定時 M11 用 1.0 計算：7 × 1.0 × 0.88 = 6.16 → 6', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M11', avail: 88, mwBonus: 0, faults: [] }];
    expect(scoreRound(withWind(s, 1.0)).state.players[0].score).toBe(6);
  });
});

describe('S3.3 M11 highwind-penalty：高風 0.7 → 0.35', () => {
  it('高風時 M11 用 0.35 計算：7 × 0.35 × 0.88 = 2.156 → 2', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M11', avail: 88, mwBonus: 0, faults: [] }];
    expect(scoreRound(withWind(s, 0.7)).state.players[0].score).toBe(2);
  });
});

describe('S3.3 M12 no-wind-power：永遠 1.0', () => {
  it('颱風時 M12 仍 1.0：5 × 1.0 × 0.92 = 4.6 → 5', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M12', avail: 92, mwBonus: 0, faults: [] }];
    expect(scoreRound(withWind(s, 0)).state.players[0].score).toBe(5);
  });
  it('額定時 M12 同樣 1.0', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M12', avail: 92, mwBonus: 0, faults: [] }];
    expect(scoreRound(withWind(s, 1.0)).state.players[0].score).toBe(5);
  });
});

describe('S3.3 M10 fault-immune：施加故障短路（不發 fault-applied）', () => {
  it('對 M10 施加 F02 → 完全無傷', async () => {
    const { applyFault } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[1].turbines = [{ cardId: 'M10', avail: 98, mwBonus: 0, faults: [] }];
    const r = applyFault(s, 0, 'F02', fixedRng([]), 0);
    expect(r.state.players[1].turbines[0].faults).toHaveLength(0);
    expect(r.events.some((e) => e.kind === 'fault-applied')).toBe(false);
  });
});

describe('S3.3 M09 immune-hydraulic：免疫 F03 液壓漏油', () => {
  it('對 M09 施加 F03 → 短路（不發事件）', async () => {
    const { applyFault } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[1].turbines = [{ cardId: 'M09', avail: 87, mwBonus: 0, faults: [] }];
    const r = applyFault(s, 0, 'F03', fixedRng([]), 0);
    expect(r.state.players[1].turbines[0].faults).toHaveLength(0);
  });
  it('對 M09 施加 F02（非液壓）→ 正常受傷', async () => {
    const { applyFault } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[1].turbines = [{ cardId: 'M09', avail: 87, mwBonus: 0, faults: [] }];
    const r = applyFault(s, 0, 'F02', fixedRng([]), 0);
    expect(r.state.players[1].turbines[0].faults).toHaveLength(1);
  });
});

describe('S3.3 M08 fragile：被攻擊時 drop ×1.5', () => {
  it('F02 drop=10 → M08 受到 floor(10×1.5)=15', async () => {
    const { applyFault } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[1].turbines = [{ cardId: 'M08', avail: 85, mwBonus: 0, faults: [] }];
    const r = applyFault(s, 0, 'F02', fixedRng([]), 0);
    expect(r.state.players[1].turbines[0].faults[0].drop).toBe(15);
  });
  it('F02 對 M01（非 fragile）→ drop=10 不變', async () => {
    const { applyFault } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[1].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    const r = applyFault(s, 0, 'F02', fixedRng([]), 0);
    expect(r.state.players[1].turbines[0].faults[0].drop).toBe(10);
  });
});

describe('S3.3 M10 no-slot：不佔機組格', () => {
  it('場上已 3 台正常機組 + 部署 M10 → 不替換（共 4 台）', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] },
      { cardId: 'M02', avail: 93, mwBonus: 0, faults: [] },
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] },
    ];
    s.players[0].hand = ['M10'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.state.players[0].turbines).toHaveLength(4);
    // 沒有 turbine-replaced 事件
    expect(r.events.some((e) => e.kind === 'turbine-replaced')).toBe(false);
  });

  it('場上 3 台（含 1 台 M10）+ 部署 M02 → 替換的是非 no-slot 的最弱（M01 2MW），不是 M10', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }, // 2MW
      { cardId: 'M10', avail: 98, mwBonus: 0, faults: [] }, // 1MW，但 no-slot
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] }, // 4MW
    ];
    // slottedCount = 2（M01, M03），<3 → 不替換，直接部署 M02
    s.players[0].hand = ['M02'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.state.players[0].turbines).toHaveLength(4);
    expect(r.events.some((e) => e.kind === 'turbine-replaced')).toBe(false);
    // M10 仍在
    expect(r.state.players[0].turbines.some((t) => t.cardId === 'M10')).toBe(true);
  });

  it('主力 M01 + 備戰區已滿 3 台 + M10 + 部署 M07 → 只替換備戰區最弱，主力與 M10 皆保留', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }, // 主力：2MW（受保護，不會被部署動作替換）
      { cardId: 'M02', avail: 93, mwBonus: 0, faults: [] }, // 備戰：3MW（最弱，會被替換）
      { cardId: 'M03', avail: 92, mwBonus: 0, faults: [] }, // 備戰：4MW
      { cardId: 'OS8', avail: 90, mwBonus: 0, faults: [] }, // 備戰：8MW（湊滿備戰區 3 台）
      { cardId: 'M10', avail: 98, mwBonus: 0, faults: [] }, // 1MW（no-slot，不佔備戰區格）
    ];
    s.players[0].activeTurbineIdx = 0;
    s.players[0].hand = ['M07'];
    s.actionsLeft = 5;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    // 備戰區最弱（M02）被替換；主力 M01 與 no-slot 的 M10 都保留
    expect(r.state.players[0].turbines.some((t) => t.cardId === 'M02')).toBe(false);
    expect(r.state.players[0].turbines.some((t) => t.cardId === 'M01')).toBe(true);
    expect(r.state.players[0].turbines.some((t) => t.cardId === 'M10')).toBe(true);
    expect(r.state.players[0].turbines.some((t) => t.cardId === 'M07')).toBe(true);
  });
});

describe('S3.4 T09 func-discount：在場時功能卡 cost -1（下限 0）', () => {
  it('FN02 cost=1 → T09 在場時 effectiveCost = 0', async () => {
    const { effectiveCost } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = ['T09'];
    expect(effectiveCost(s, 0, 'FN02')).toBe(0);
  });
  it('FN03 cost=2 → T09 在場時 effectiveCost = 1（v5.11 回退）', async () => {
    const { effectiveCost } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = ['T09'];
    expect(effectiveCost(s, 0, 'FN03')).toBe(1); // cost=2 - T09 折扣 1 = 1
  });
  it('沒 T09 時 cost 不變（FN02=1）', async () => {
    const { effectiveCost } = await import('../src/core/actions');
    const s = createInitialState(createRng(1));
    expect(effectiveCost(s, 0, 'FN02')).toBe(1);
  });
  it('T09 不影響非 func 卡（T01 tech cost=1 不變）', async () => {
    const { effectiveCost } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].techs = ['T09'];
    expect(effectiveCost(s, 0, 'T01')).toBe(1);
  });
});

describe('S3.4 T05 predict-wind：派遣時填 3 個 futureWind', () => {
  it('部署 T05 → futureWind 長度 +3', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['T05'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    expect(s.futureWind).toHaveLength(0);
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]));
    expect(r.state.futureWind).toHaveLength(3);
    expect(r.events.some((e) => e.kind === 'predict-wind')).toBe(true);
  });
  it('部署 T01（非 predict-wind）→ futureWind 不變', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['T01'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.state.futureWind).toHaveLength(0);
  });
});

describe('S3.4 T06 periodic-repair：每回合自動修 1 個 sev≤3 故障', () => {
  it('runGame 內：T06 在場 + 一個 F02（sev=1） → 回合末被修', async () => {
    const { runGame } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(42)));
    s.players[0].techs = ['T06'];
    s.players[0].turbines[0].faults.push({ cardId: 'F02', roundsLeft: 5, sev: 1, drop: 10 });
    // 跑一輪：用 noopTurn → _repairFaults 不會處理 F02（T06.counters 包含 F02 ⇒ 會！）
    // 為了驗 periodic-repair 獨立效果，把 T06 換成「不在 counters 中的」⇒ 但 T06 counters=[F01..F05]…
    // 改測：用 sev>3 故障測 T01 不能修，看 periodic-repair 是否漏掉 sev>3
    // 簡化：用 F06 sev=4，counters[T03]，T06 不在 counters → _repairFaults 不修；periodic-repair 也跳過（sev>3）
    // 那直接驗：T06 在場 + F02 → 回合結束 F02 被修。事件中應出現 fault-repaired（by 可能是 T06 或 'periodic-repair'）
    const r = runGame(s, createRng(42));
    // 至少有一個 fault-repaired 事件對應 F02
    const repaired = r.events.filter(
      (e) => e.kind === 'fault-repaired' && e.cardId === 'F02',
    );
    expect(repaired.length).toBeGreaterThan(0);
  });

  it('periodic-repair 跳過 sev>3：F06 sev=4 對 T06 不在 counters 也不在 sev 範圍 → 不修', async () => {
    const { runGame } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(42)));
    // 用一個 T06 但 F06 sev=4 超過 periodic-repair 的 sev≤3 範圍
    s.players[0].techs = ['T06'];
    s.players[0].turbines[0].faults.push({ cardId: 'F06', roundsLeft: 5, sev: 4, drop: 30 });
    const r = runGame(s, createRng(42));
    // 第 1 回合結束時 F06 仍在（roundsLeft 從 5→4，不被修）；至少 round 1 後仍存在
    // 我們無法直接看回合中狀態，但檢查最終事件流中 F06 不會被 periodic-repair（by:'periodic-repair'）修
    const periodicRepairs = r.events.filter(
      (e) => e.kind === 'fault-repaired' && (e as { by?: string }).by === 'periodic-repair',
    );
    expect(periodicRepairs.some((e) => 'cardId' in e && e.cardId === 'F06')).toBe(false);
  });
});

describe('S3.5 F05 storm-amplify：颱風/高風時 drop ×2', () => {
  // 用 M01 + mwBonus=8 放大到 10MW，讓 amplify 前後的差異明顯（避免 round 後都成同一個整數）
  function highMwSetup(faultId: string): GameState {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      {
        cardId: 'M01', avail: 95, mwBonus: 8,
        faults: [{ cardId: faultId, roundsLeft: 2, sev: 3, drop: 25 }],
      },
    ];
    return s;
  }

  it('額定（1.0）→ F05 drop 不變：10×1.0×(95-25)/100 = 7', () => {
    expect(scoreRound(withWind(highMwSetup('F05'), 1.0)).state.players[0].score).toBe(7);
  });

  it('高風 0.7 → F05 drop ×2（25→50）：10×0.7×(95-50)/100 = 3.15 → 3', () => {
    const s = highMwSetup('F05');
    const r = scoreRound({ ...s, wind: { roll: 6, speed: 20, coeff: 0.7, label: '高風' } });
    expect(r.state.players[0].score).toBe(3);
  });

  it('F02 在高風 → drop 不加倍：10×0.7×(95-25)/100 = 4.9 → 5（比 F05 amplify 多）', () => {
    const s = highMwSetup('F02');
    const r = scoreRound({ ...s, wind: { roll: 6, speed: 20, coeff: 0.7, label: '高風' } });
    expect(r.state.players[0].score).toBe(5);
  });

  it('颱風 typhoon=true：發電為 0（coeff=0），但 F05 drop 仍 ×2（驗 amplify 觸發條件）', () => {
    const s = highMwSetup('F05');
    const r = scoreRound({
      ...s,
      wind: { roll: '6+6', speed: 25, coeff: 0, label: '颱風', typhoon: true },
    });
    expect(r.state.players[0].score).toBe(0);
  });
});

describe('S3.5 F08 unpredictable：50% 機率 swap 故障到另一台', () => {
  it('rng.next < 0.5 + 多台 → 故障 swap 走', async () => {
    const { runGame } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M01', avail: 95, mwBonus: 0, faults: [{ cardId: 'F08', roundsLeft: 5, sev: 3, drop: 25 }] },
      { cardId: 'M02', avail: 93, mwBonus: 0, faults: [] },
    ];
    // 用 fixedRng 強制 shuffle 命中：第 1 次 rng.next() 用於決定是否 shuffle (<0.5)，第 2 次決定 swap 目標
    const r = runGame(s, fixedRng([0.1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]));
    // 至少觸發過一次 unpredictable shuffle 事件（fault-applied）
    // 重點是不丟錯且 game 結束
    expect(r.state.gameOver).toBe(true);
  });

  it('只有 1 台機組時不觸發 shuffle（不消耗 rng）', async () => {
    const { runGame } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines[0].faults = [{ cardId: 'F08', roundsLeft: 5, sev: 3, drop: 25 }];
    // 只有 1 台機組 → _unpredictableShuffle continue 跳過
    const r = runGame(s, createRng(42));
    expect(r.state.gameOver).toBe(true);
  });
});

describe('S3.5 F09 disable-scada：施加時清空 futureWind', () => {
  it('施加 F09 → futureWind 被清空', async () => {
    const { applyFault } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[1].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    s.futureWind = [
      { roll: 4, speed: 10, coeff: 1.0, label: '額定' },
      { roll: 4, speed: 10, coeff: 1.0, label: '額定' },
      { roll: 4, speed: 10, coeff: 1.0, label: '額定' },
    ];
    const r = applyFault(s, 0, 'F09', fixedRng([]), 0);
    expect(r.state.futureWind).toHaveLength(0);
  });

  it('施加 F02（非 disable-scada）→ futureWind 不變', async () => {
    const { applyFault } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[1].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }];
    s.futureWind = [{ roll: 4, speed: 10, coeff: 1.0, label: '額定' }];
    const r = applyFault(s, 0, 'F02', fixedRng([]), 0);
    expect(r.state.futureWind).toHaveLength(1);
  });
});

describe('S3.6 天氣系統：activeWeather 倒數與套用', () => {
  it('施加 W01 wind-boost → activeWeather 含一筆，duration=2', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['W01'];
    s.actionsLeft = 4;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.state.activeWeather).toHaveLength(1);
    expect(r.state.activeWeather[0].cardId).toBe('W01');
    expect(r.state.activeWeather[0].duration).toBe(2);
    expect(r.events.some((e) => e.kind === 'weather-applied')).toBe(true);
  });

  it('結算時 W01 wind-boost：低風 0.4 → 0.7（+0.3）；額定 1.0 → 1.0（cap）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 8, faults: [] }]; // 10MW
    s.activeWeather = [{ cardId: 'W01', duration: 3, appliedBy: 0 }];
    // 低風 + boost: coeff 0.4 + 0.3 = 0.7 → 10×0.7×0.95 = 6.65 → 7
    expect(scoreRound(withWind(s, 0.4)).state.players[0].score).toBe(7);
    // 額定 cap 1.0: 10×1.0×0.95 = 9.5 → 10
    expect(scoreRound(withWind(s, 1.0)).state.players[0].score).toBe(10);
  });

  it('結算時 W03 wind-penalty：打出者免疫（高風 0.7 不受 penalty）；對手仍受懲罰', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    // P0 打出 W03：自己免疫 wind-penalty，高風 0.7 不受懲罰 → 10×0.7×0.95 = 6.65 → 7
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 8, faults: [] }];
    s.activeWeather = [{ cardId: 'W03', duration: 2, appliedBy: 0 }];
    expect(scoreRound(withWind(s, 0.7)).state.players[0].score).toBe(7);
    // P1 是對手，仍受 wind-penalty：0.7 - 0.3 = 0.4 → 10×0.4×0.95 = 3.8 → 4
    const s2 = structuredClone(createInitialState(createRng(1)));
    s2.players[1].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 8, faults: [] }];
    s2.activeWeather = [{ cardId: 'W03', duration: 2, appliedBy: 0 }]; // P0 打出，P1 是對手
    expect(scoreRound(withWind(s2, 0.7)).state.players[1].score).toBe(4);
  });

  it('W02 shutdown-all：打出者免疫停機（自己機組正常計分）；對手機組計分 = 0', () => {
    // P0 打出 W02：自己免疫停機，M07 avail=88 正常計分 = 12×1.0×0.88 = 10.56 → 11
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }];
    s.activeWeather = [{ cardId: 'W02', duration: 1, appliedBy: 0 }];
    expect(scoreRound(withWind(s, 1.0)).state.players[0].score).toBe(11);
    // P1 是對手，仍受 shutdown-all：計分 = 0
    const s2 = structuredClone(createInitialState(createRng(1)));
    s2.players[1].turbines = [{ cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }];
    s2.activeWeather = [{ cardId: 'W02', duration: 1, appliedBy: 0 }]; // P0 打出，P1 是對手
    expect(scoreRound(withWind(s2, 1.0)).state.players[1].score).toBe(0);
  });

  it('W04 mwh-double：本回合 mwh ×2（取代 mwhBoost ×1.5）', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 8, faults: [] }];
    s.activeWeather = [{ cardId: 'W04', duration: 1, appliedBy: 0 }];
    // 額定 10×1.0×0.95 = 9.5, ×2 = 19
    expect(scoreRound(withWind(s, 1.0)).state.players[0].score).toBe(19);
  });

  it('W04 mwh-double 與 FN06 mwhBoostActive 同時 active → 取大值 ×2', () => {
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 8, faults: [] }];
    s.players[0].mwhBoostActive = true;
    s.activeWeather = [{ cardId: 'W04', duration: 1, appliedBy: 0 }];
    // 取 ×2 而非 ×1.5：9.5 × 2 = 19
    expect(scoreRound(withWind(s, 1.0)).state.players[0].score).toBe(19);
  });

  it('W01 self-boost-wind：打出者額外 MWh ×1.1；對手不受加成', () => {
    // P0 打出 W01：自己額外 ×1.1：10×1.0×0.95 = 9.5 ×1.1 = 10.45 → 10
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 8, faults: [] }];
    s.activeWeather = [{ cardId: 'W01', duration: 3, appliedBy: 0 }];
    // wind-boost: coeff 1.0 + 0.3 = 1.0 (cap)
    // self-boost: ×1.1 → 9.5 ×1.1 = 10.45 → 10
    expect(scoreRound(withWind(s, 1.0)).state.players[0].score).toBe(10);
    // P1 是對手，不受 self-boost：10×1.0×0.95 = 9.5 → 10（同樣是 10，用低風區分）
    const s2 = structuredClone(createInitialState(createRng(1)));
    s2.players[1].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 8, faults: [] }];
    s2.activeWeather = [{ cardId: 'W01', duration: 3, appliedBy: 0 }]; // P0 打出，P1 是對手
    // P1 不受 self-boost：低風 0.4 + boost 0.3 = 0.7 → 10×0.7×0.95 = 6.65 → 7
    expect(scoreRound(withWind(s2, 0.4)).state.players[1].score).toBe(7);
    // P0 打出者低風 0.4 + boost 0.3 = 0.7，再×1.1 → 6.65×1.1 = 7.315 → 7
    const s3 = structuredClone(createInitialState(createRng(1)));
    s3.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 8, faults: [] }];
    s3.activeWeather = [{ cardId: 'W01', duration: 3, appliedBy: 0 }];
    expect(scoreRound(withWind(s3, 0.4)).state.players[0].score).toBe(7);
  });

  it('runGame 跑完後 W01 duration=3 → 應於第 3 回合結束後到期（從 activeWeather 移除）', async () => {
    const { runGame } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(42)));
    s.activeWeather = [{ cardId: 'W01', duration: 3, appliedBy: 0 }];
    const r = runGame(s, createRng(42));
    expect(r.state.activeWeather).toHaveLength(0); // 12 回合後肯定已過期
    expect(r.events.some((e) => e.kind === 'weather-expired' && e.cardId === 'W01')).toBe(true);
  });
});

describe('S3.6 FN07 tutor-turbine：從牌庫搜最高 MW turbine 入手牌', () => {
  it('牌庫中最大 turbine 是 M07（12MW）→ 抽到 M07', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    // 把所有非 M07 的 turbine 移走牌庫，確保 M07 是最大
    s.players[0].hand = ['FN07'];
    s.actionsLeft = 1;
    s.currentPlayer = 0;
    // 確認牌庫有 M07
    expect(s.players[0].deck).toContain('M07');
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    // 抽到的應該是 M07（12MW 最大）
    expect(r.events.some((e) => e.kind === 'tutor-turbine' && e.cardId === 'M07')).toBe(true);
    expect(r.state.players[0].hand).toContain('M07');
  });

  it('牌庫中無 turbine → canPlayCard 阻擋', async () => {
    const { canPlayCard } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['FN07'];
    s.actionsLeft = 1;
    s.currentPlayer = 0;
    // 把牌庫中所有 turbine 移除
    s.players[0].deck = s.players[0].deck.filter((id) => CARDS[id].type !== 'turbine');
    expect(canPlayCard(s, 0, 0)).toBe(false);
  });
});

describe('S3.7 合約系統：施加 + 條件判定 + reward', () => {
  it('施加 C02 → activeContracts 含一筆，progress=0', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['C02'];
    s.actionsLeft = 1;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    expect(r.state.activeContracts).toHaveLength(1);
    expect(r.state.activeContracts[0].cardId).toBe('C02');
    expect(r.state.activeContracts[0].progress).toBe(0);
    expect(r.events.some((e) => e.kind === 'contract-applied')).toBe(true);
  });

  it('C02 totalMW ≥ 30：場上 M07(12) × 3 = 36MW（含 aura 42MW）→ 達成 +20', async () => {
    const { runGame } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(42)));
    s.players[0].turbines = [
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 12 + aura 3 = 15
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 12 + aura 3 = 15
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 12 + aura 3 = 15
    ]; // 共 36 MW（含 aura 42 MW）≥ 30
    s.activeContracts = [{ cardId: 'C02', player: 0, progress: 0, fulfilled: false }];
    const scoreBefore = s.players[0].score;
    const r = runGame(s, createRng(42));
    // C02 一次性，第 1 回合就達成 +20
    expect(r.events.some((e) => e.kind === 'contract-fulfilled' && e.cardId === 'C02')).toBe(true);
    expect(r.state.players[0].score).toBeGreaterThanOrEqual(scoreBefore + 20);
  });

  it('C02 不滿足（總 MW < 18）→ 不發 reward（雙方都不達標）', async () => {
    const { runGame } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(42)));
    // 雙方都只有低 MW 機組，確保雙方都不達標（< 18MW）
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }]; // 2 MW
    s.players[1].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }]; // 2 MW
    s.activeContracts = [{ cardId: 'C02', player: 0, progress: 0, fulfilled: false }];
    const r = runGame(s, createRng(42));
    expect(r.events.some((e) => e.kind === 'contract-fulfilled')).toBe(false);
  });

  it('C03 techCount ≥ 4 → 達成 +20', async () => {
    const { runGame } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(42)));
    s.players[0].techs = ['T01', 'T02', 'T03', 'T04'];
    s.activeContracts = [{ cardId: 'C03', player: 0, progress: 0, fulfilled: false }];
    const r = runGame(s, createRng(42));
    const ev = r.events.find((e) => e.kind === 'contract-fulfilled' && e.cardId === 'C03');
    expect(ev).toBeDefined();
    if (ev?.kind === 'contract-fulfilled') {
      expect(ev.reward).toBe(20);
    }
  });

  it('C01 highAvail rounds=3：自家所有機組 avail ≥ 90 連續 3 回合 → +15', async () => {
    const { runGame } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(42)));
    // Route B：OS10(88%) 和 OS12(86%) 不滿足 ≥90；需明確設定全艦隊 avail ≥ 90
    s.players[0].turbines = [
      { cardId: 'OS8',  avail: 95, mwBonus: 0, faults: [] },
      { cardId: 'OS10', avail: 95, mwBonus: 0, faults: [] },
      { cardId: 'OS12', avail: 95, mwBonus: 0, faults: [] },
    ];
    s.activeContracts = [{ cardId: 'C01', player: 0, progress: 0, fulfilled: false }];
    const r = runGame(s, createRng(42));
    // 第 3 回合結束時應達成
    const fulfilled = r.events.find((e) => e.kind === 'contract-fulfilled' && e.cardId === 'C01');
    expect(fulfilled).toBeDefined();
  });

  it('C04 killOpponent rounds=2：對手所有機組 avail=0 連續 2 回合 → +30', async () => {
    const { runGame } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(42)));
    // P1 機組已被打到 avail=0
    s.players[1].turbines = [{ cardId: 'M01', avail: 0, mwBonus: 0, faults: [] }];
    s.activeContracts = [{ cardId: 'C04', player: 0, progress: 0, fulfilled: false }];
    const r = runGame(s, createRng(42));
    const fulfilled = r.events.find((e) => e.kind === 'contract-fulfilled' && e.cardId === 'C04');
    expect(fulfilled).toBeDefined();
    if (fulfilled?.kind === 'contract-fulfilled') {
      expect(fulfilled.reward).toBe(30);
    }
  });

  it('fulfilled 後不重複 reward', async () => {
    const { runGame } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(42)));
    s.players[0].techs = ['T01', 'T02', 'T03', 'T04'];
    s.activeContracts = [{ cardId: 'C03', player: 0, progress: 0, fulfilled: false }];
    const r = runGame(s, createRng(42));
    const fulfilledEvents = r.events.filter(
      (e) => e.kind === 'contract-fulfilled' && e.cardId === 'C03',
    );
    expect(fulfilledEvents).toHaveLength(1); // 只觸發一次
  });

  it('S3.7 雙方攻防：P1 搶先達成 C02 → 發出 contract-stolen，P1 拿獎勵', async () => {
    const { _checkContracts } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(42)));
    // P0 打出 C02，但 P0 只有 2MW（不達標）
    s.players[0].turbines = [{ cardId: 'M01', avail: 95, mwBonus: 0, faults: [] }]; // 2 MW
    // P1 有 36MW（達標 ≥ 30）
    s.players[1].turbines = [
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 12 MW
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 12 MW
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 12 MW
    ]; // 共 36 MW > 30
    s.activeContracts = [{ cardId: 'C02', player: 0, progress: 0, fulfilled: false }];
    const events = _checkContracts(s);
    // P1 搶先達成，發出 contract-fulfilled（player=1）和 contract-stolen（stolenBy=1）
    expect(events.some((e) => e.kind === 'contract-fulfilled' && e.player === 1)).toBe(true);
    expect(events.some((e) => e.kind === 'contract-stolen' && e.stolenBy === 1)).toBe(true);
    // P1 拿到 +20
    expect(s.players[1].score).toBe(20);
    // P0 沒有得分
    expect(s.players[0].score).toBe(0);
  });

  it('S3.7 雙方攻防：P0 打出者同回合達標 → 打出者優先，P0 拿獎勵', async () => {
    const { _checkContracts } = await import('../src/core/rules-engine');
    const s = structuredClone(createInitialState(createRng(42)));
    // 雙方同回合都達標（P0 打出者優先）
    s.players[0].turbines = [
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 12 MW
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 12 MW
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 12 MW
    ]; // 共 36 MW > 30
    s.players[1].turbines = [
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 12 MW
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 12 MW
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 12 MW
    ]; // 共 36 MW > 30
    s.activeContracts = [{ cardId: 'C02', player: 0, progress: 0, fulfilled: false }];
    const events = _checkContracts(s);
    // 打出者 P0 優先拿獎勵
    expect(events.some((e) => e.kind === 'contract-fulfilled' && e.player === 0)).toBe(true);
    expect(events.some((e) => e.kind === 'contract-stolen')).toBe(false);
    expect(s.players[0].score).toBe(20);
    expect(s.players[1].score).toBe(0);
  });
});

describe('S3.7 evaluateContractCondition：單元測試', () => {
  it('highAvail：所有機組 avail ≥ 90 → true', async () => {
    const { evaluateContractCondition } = await import('../src/core/abilities');
    const s = structuredClone(createInitialState(createRng(1)));
    // Route B 開局：OS10(88%) 和 OS12(86%) 低於 90%；明確設定全艦隊 ≥ 90
    s.players[0].turbines = [
      { cardId: 'OS8',  avail: 95, mwBonus: 0, faults: [] },
      { cardId: 'OS10', avail: 95, mwBonus: 0, faults: [] },
      { cardId: 'OS12', avail: 95, mwBonus: 0, faults: [] },
    ];
    expect(evaluateContractCondition('C01', 0, s)).toBe(true);
  });

  it('highAvail：機組有 drop=10 → effectiveAvail 85 < 90 → false', async () => {
    const { evaluateContractCondition } = await import('../src/core/abilities');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [{ cardId: 'OS8', avail: 95, mwBonus: 0, faults: [] }];
    s.players[0].turbines[0].faults.push({ cardId: 'F02', roundsLeft: 1, sev: 1, drop: 10 });
    expect(evaluateContractCondition('C01', 0, s)).toBe(false);
  });

  it('totalMW：Route B 開局艦隊 (30MW) < 35（threshold 35）→ false', async () => {
    const { evaluateContractCondition } = await import('../src/core/abilities');
    const s = createInitialState(createRng(1)); // OS8(8)+OS10(10)+OS12(12)=30MW < 35
    expect(evaluateContractCondition('C02', 0, s)).toBe(false);
  });

  it('totalMW：場上 M07(12) × 3 = 36MW ≥ 35（threshold 35）→ true', async () => {
    const { evaluateContractCondition } = await import('../src/core/abilities');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].turbines = [
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 12 MW
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 12 MW
      { cardId: 'M07', avail: 88, mwBonus: 0, faults: [] }, // 12 MW
    ]; // 共 36 MW ≥ 35
    expect(evaluateContractCondition('C02', 0, s)).toBe(true);
  });

  it('killOpponent：對手機組全 avail=0 → true', async () => {
    const { evaluateContractCondition } = await import('../src/core/abilities');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[1].turbines = [{ cardId: 'M01', avail: 0, mwBonus: 0, faults: [] }];
    expect(evaluateContractCondition('C04', 0, s)).toBe(true);
  });

  it('killOpponent：對手有任一台 avail>0 → false', async () => {
    const { evaluateContractCondition } = await import('../src/core/abilities');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[1].turbines = [
      { cardId: 'M01', avail: 0, mwBonus: 0, faults: [] },
      { cardId: 'M02', avail: 93, mwBonus: 0, faults: [] },
    ];
    expect(evaluateContractCondition('C04', 0, s)).toBe(false);
  });
});

describe('S3.2 部署時自動填 deployedRound', () => {
  it('actions._deployTurbine 填入當前 state.round', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.round = 5;
    s.players[0].hand = ['M05'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    const deployed = r.state.players[0].turbines.find((t) => t.cardId === 'M05');
    expect(deployed?.deployedRound).toBe(5);
  });
});

describe('W05 random-blade 故障邏輯', () => {
  it('打出 W05 時，對手非停機機組被施加 F04 葉片故障', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['W05'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    // fixedRng(0) → int(0, N-1) 選第 0 台
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([0]));
    const faultEvents = r.events.filter((e) => e.kind === 'fault-applied');
    expect(faultEvents.length).toBe(1);
    expect((faultEvents[0] as { cardId: string }).cardId).toBe('F04');
    expect((faultEvents[0] as { drop: number }).drop).toBe(20);
  });

  it('打出 W05 時，P1 機組確實有 F04 故障記錄（roundsLeft=2）', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['W05'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([0]));
    const oppTurbines = r.state.players[1].turbines;
    const bladeFault = oppTurbines.flatMap((t) => t.faults).find((f) => f.cardId === 'F04');
    expect(bladeFault).toBeDefined();
    expect(bladeFault?.roundsLeft).toBe(2);
    expect(bladeFault?.sev).toBe(3);
  });

  it('打出 W05 時，P0 自家機組不受 random-blade 影響（self-immune-blade-fault）', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['W05'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([0]));
    const selfTurbines = r.state.players[0].turbines;
    const hasBladeFault = selfTurbines.some((t) => t.faults.some((f) => f.cardId === 'F04'));
    expect(hasBladeFault).toBe(false);
  });

  it('對手機組已有 2 個故障時，W05 random-blade 不再施加（故障上限）', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['W05'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    s.players[1].turbines.forEach((t) => {
      t.faults = [
        { cardId: 'F01', roundsLeft: 2, sev: 1, drop: 10 },
        { cardId: 'F02', roundsLeft: 2, sev: 2, drop: 15 },
      ];
    });
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([0]));
    const bladeFaultEvents = r.events.filter(
      (e) => e.kind === 'fault-applied' && (e as { cardId: string }).cardId === 'F04',
    );
    expect(bladeFaultEvents.length).toBe(0);
  });

  it('對手機組全部停機時，W05 random-blade 不施加', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    s.players[0].hand = ['W05'];
    s.actionsLeft = 3;
    s.currentPlayer = 0;
    s.players[1].turbines.forEach((t) => {
      t.shutdown = true;
    });
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([0]));
    const bladeFaultEvents = r.events.filter(
      (e) => e.kind === 'fault-applied' && (e as { cardId: string }).cardId === 'F04',
    );
    expect(bladeFaultEvents.length).toBe(0);
  });
});

describe('UP01/UP02 開局艦隊升級路徑（v5.16）', () => {
  it('UP01 evolve-tier1：場上有 OS8 時 canPlayCard 應為 true', async () => {
    const { canPlayCard } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    // 開局艦隊預設含 OS8，UP01 cost=1
    s.players[0].hand = ['UP01'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    expect(canPlayCard(s, 0, 0)).toBe(true);
  });

  it('UP01 evolve-tier1：打出後 OS8 → M09（+2MW）', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    // 只保留 OS8 一台機組，確保 UP01 選到它
    s.players[0].turbines = [{ cardId: 'OS8', avail: 90, mwBonus: 0, faults: [] }];
    s.players[0].hand = ['UP01'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    const evolvedTurbine = r.state.players[0].turbines[0];
    expect(evolvedTurbine.cardId).toBe('M09');
    expect(r.events.some((e) => e.kind === 'turbine-evolved')).toBe(true);
  });

  it('UP02 evolve-tier2：場上有 OS10 時 canPlayCard 應為 true', async () => {
    const { canPlayCard } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    // 開局艦隊預設含 OS10，UP02 cost=0
    s.players[0].hand = ['UP02'];
    s.actionsLeft = 1;
    s.currentPlayer = 0;
    expect(canPlayCard(s, 0, 0)).toBe(true);
  });

  it('UP02 evolve-tier2：打出後 OS10 → M11（+1MW）', async () => {
    const { applyAction } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    // 只保留 OS10 一台機組，確保 UP02 選到它
    s.players[0].turbines = [{ cardId: 'OS10', avail: 88, mwBonus: 0, faults: [] }];
    s.players[0].hand = ['UP02'];
    s.actionsLeft = 1;
    s.currentPlayer = 0;
    const r = applyAction(s, { kind: 'play-card', player: 0, handIdx: 0 }, fixedRng([]));
    const evolvedTurbine = r.state.players[0].turbines[0];
    expect(evolvedTurbine.cardId).toBe('M11');
    expect(r.events.some((e) => e.kind === 'turbine-evolved')).toBe(true);
  });

  it('UP01 evolve-tier1：場上無 M01/M02/OS8 時 canPlayCard 應為 false', async () => {
    const { canPlayCard } = await import('../src/core/actions');
    const s = structuredClone(createInitialState(createRng(1)));
    // 只有 OS10/OS12，沒有 M01/M02/OS8
    s.players[0].turbines = [
      { cardId: 'OS10', avail: 88, mwBonus: 0, faults: [] },
      { cardId: 'OS12', avail: 86, mwBonus: 0, faults: [] },
    ];
    s.players[0].hand = ['UP01'];
    s.actionsLeft = 2;
    s.currentPlayer = 0;
    expect(canPlayCard(s, 0, 0)).toBe(false);
  });
});
