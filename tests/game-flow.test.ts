import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/core/game-state';
import { startRound } from '../src/core/rules-engine';
import { applyAction } from '../src/core/actions';
import { createRng } from '../src/core/rng';

describe('Complete Game Flow', () => {
  it('runs a full sequence of a single round gameplay', () => {
    const rng = createRng(12345);
    const state = createInitialState(rng);
    // 1. Start the round (roll wind/wave, draw cards)
    const roundEvents = startRound(state, rng);
    expect(roundEvents.length).toBeGreaterThan(0);
    expect(state.round).toBe(1);
    expect(state.players[0].hand.length).toBe(4);

    // 2. Play a technician card if available
    const hand = state.players[0].hand;
    const techIdx = hand.findIndex((id) => id.startsWith('T'));
    if (techIdx !== -1) {
      const result = applyAction(state, { kind: 'play-card', player: 0, handIdx: techIdx }, rng);
      expect(result.events.some((e) => e.kind === 'card-played')).toBe(true);
    }
  });
});
