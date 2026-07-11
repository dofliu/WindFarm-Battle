import { describe, it, expect } from 'vitest';
import { tickStamina } from '../src/core/stamina';
import { createInitialState } from '../src/core/game-state';
import { createRng } from '../src/core/rng';
import type { GameEvent } from '../src/core/types';

describe('Stamina tick operations', () => {
  it('depletes stamina of active and bench technicians', () => {
    const rng = createRng(12345);
    const state = createInitialState(rng);
    const player = state.players[0];

    // Set up active and bench techs
    player.field.active = {
      cardId: 'T01',
      level: 1,
      stamina: 10,
      maxStamina: 10,
      roundsOnField: 0,
      attachedToolId: null,
      usedSkillThisTurn: false,
    };
    player.field.bench = [
      {
        cardId: 'T02',
        level: 1,
        stamina: 2,
        maxStamina: 10,
        roundsOnField: 0,
        attachedToolId: null,
        usedSkillThisTurn: false,
      }
    ];

    const events: GameEvent[] = [];

    tickStamina(player, 0, events);

    // Active technician didn't use skill, should lose 3 stamina: 10 - 3 = 7
    expect(player.field.active?.stamina).toBe(7);

    // Bench technician has 2 stamina, loses 3 -> stamina <= 0, should be retired
    expect(player.field.bench.length).toBe(0);
    expect(player.retired).toContain('T02');
    expect(events.some((e: any) => e.kind === 'stamina-depleted' && e.techId === 'T02')).toBe(true);
  });
});
