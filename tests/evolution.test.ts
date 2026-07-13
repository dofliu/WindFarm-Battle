import { describe, it, expect } from 'vitest';
import { tickEvolution } from '../src/core/stamina';
import { createInitialState } from '../src/core/game-state';
import { createRng } from '../src/core/rng';
import type { GameEvent } from '../src/core/types';

describe('Technician Evolution tick', () => {
  it('correctly upgrades tech levels and computes stamina using the damage-retaining formula', () => {
    const rng = createRng(12345);
    const state = createInitialState(rng);
    const player = state.players[0];

    // Set up active technician
    player.field.active = {
      cardId: 'T01',
      level: 1,
      stamina: 6, // 10 - 4 damage
      maxStamina: 10,
      roundsOnField: 2, // will become 3 after tick
      attachedToolId: null,
      usedSkillThisTurn: false,
    };

    const events: GameEvent[] = [];

    tickEvolution(player, 0, events);

    const active = player.field.active;
    expect(active?.level).toBe(2);
    expect(active?.maxStamina).toBe(15);
    // Damage was 4 (10 - 6). Evolved stamina should be 15 - 4 = 11.
    expect(active?.stamina).toBe(11);
    expect(events.some((e) => e.kind === 'tech-evolved' && e.level === 2)).toBe(true);
  });
});
