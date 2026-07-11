import { describe, it, expect } from 'vitest';
import { aiTakeTurn } from '../src/core/ai';
import { createInitialState } from '../src/core/game-state';
import { createRng } from '../src/core/rng';

describe('AI decision maker', () => {
  it('runs AI decision loop and generates a sequence of events without crashing', () => {
    const rng = createRng(12345);
    const state = createInitialState(rng);
    
    // Set AI's turn
    state.currentPlayer = 1;

    // AI should execute cards and action steps
    const result = aiTakeTurn(state, 'medium', rng);

    expect(result).toBeDefined();
    expect(result.state).toBeDefined();
  });
});
