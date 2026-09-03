import { describe, it, expect } from 'vitest';
import { createClock, advanceClock } from './filmClock';

describe('filmClock', () => {
  it('eases toward the target rather than jumping', () => {
    const c = createClock(0);
    const v = advanceClock(c, 0.2, 1 / 60);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(0.2);
  });

  it('snaps instantly across a loop teleport', () => {
    const c = createClock(0.99);
    expect(advanceClock(c, 0, 1 / 60)).toBe(0);
  });

  it('converges on the target when held', () => {
    const c = createClock(0);
    for (let i = 0; i < 600; i++) advanceClock(c, 0.5, 1 / 60);
    expect(c.eased).toBeCloseTo(0.5, 4);
  });

  it('clamps an overlong frame so a stalled tab does not jump the film', () => {
    const a = createClock(0);
    const b = createClock(0);
    advanceClock(a, 0.2, 5);
    advanceClock(b, 0.2, 0.1);
    expect(a.eased).toBeCloseTo(b.eased, 10);
  });
});
