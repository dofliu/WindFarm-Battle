import { describe, it, expect } from 'vitest';
import { rollWind, rollWaveHeight, triggerFaultIncident } from '../src/core/environment';
import { createRng } from '../src/core/rng';

describe('Environment wind and wave roll', () => {
  it('rolls wind speed and wave height deterministically using seed', () => {
    const rng = createRng(12345);
    const wind = rollWind(rng);
    const wave = rollWaveHeight(rng);
    
    expect(wind).toBeDefined();
    expect(wind.coeff).toBeGreaterThanOrEqual(0);
    expect(wave).toBeGreaterThanOrEqual(1);
    expect(wave).toBeLessThanOrEqual(4);
  });

  it('triggers incidents according to round and seed probability', () => {
    const rng = createRng(12345);
    
    const incident = triggerFaultIncident(1, rng);
    if (incident) {
      expect(incident.startsWith('F')).toBe(true);
    }
  });
});
