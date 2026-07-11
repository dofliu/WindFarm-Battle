import { describe, it, expect } from 'vitest';
import { applySkill } from '../src/core/skills';
import { createInitialState } from '../src/core/game-state';
import { createRng } from '../src/core/rng';
import type { GameEvent, DeployedTech } from '../src/core/types';

describe('Technician Skills application', () => {
  it('correctly repairs fault and handles specialty matches', () => {
    const rng = createRng(12345);
    const state = createInitialState(rng);
    state.waveHeight = 2; // moderate waves (not 4)
    state.wind = { roll: 3, speed: 10, coeff: 1.0, label: 'Rated' };

    // Deploy a technician
    const tech: DeployedTech = {
      cardId: 'T02', // Blade specialist
      level: 1,
      stamina: 10,
      maxStamina: 10,
      roundsOnField: 0,
      attachedToolId: null,
      usedSkillThisTurn: false,
    };
    state.players[0].field.active = tech;

    // Apply a blade fault to OS8
    state.players[0].windFarm[0].faults = [
      {
        cardId: 'F04',
        faultCategory: 'blade',
        roundsLeft: 5,
        sev: 4,
        drop: 30,
      }
    ];

    const events: GameEvent[] = [];

    // Apply skill
    applySkill(state, 0, 0, events, rng);

    // Fault should be repaired (T02 basic-repair power is 4. Match = 1.5x -> 6. Updated drop = 30 - 6 = 24)
    const turbine = state.players[0].windFarm[0];
    expect(turbine.faults[0].drop).toBe(24);
    expect(events.some((e) => e.kind === 'skill-used')).toBe(true);
  });
});
