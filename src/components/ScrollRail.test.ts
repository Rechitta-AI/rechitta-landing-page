import { describe, expect, it } from 'vitest';
import { BEATS } from '@/film/score';
import { RAIL_CHAPTERS, railFraction } from './ScrollRail';

/** Where each chapter's label sits, as a fraction of the rail. The row is
 *  laid out with `space-between`, so the last one is at the far end. */
const slot = (i: number) => i / (RAIL_CHAPTERS.length - 1);

describe('the chapter rail', () => {
  it('names the closing boardroom and the dusk', () => {
    const labels = RAIL_CHAPTERS.map((c) => c.label);
    expect(labels.slice(-2)).toEqual(['BOARDROOM', 'DUSK']);
  });

  it('starts empty and completes on the last beat', () => {
    expect(railFraction(0)).toBe(0);
    expect(railFraction(BEATS.length - 1)).toBeCloseTo(1, 5);
  });

  it('puts the fill under the chapter that is on screen', () => {
    // The multilingual chapter is six beats but one label. Filling in beat
    // space left the head under BROKER while GLOBAL was showing.
    RAIL_CHAPTERS.forEach((chapter, i) => {
      const f = railFraction(chapter.beatIndex);
      expect(f).toBeGreaterThanOrEqual(slot(i) - 1e-9);
      expect(f).toBeLessThanOrEqual(Math.min(1, slot(i + 1)) + 1e-9);
    });
  });

  it('crosses each city without leaving the global slot', () => {
    const global = RAIL_CHAPTERS.findIndex((c) => c.id === 'cities');
    for (let beat = 4; beat <= 9; beat++) {
      const f = railFraction(beat);
      expect(f).toBeGreaterThanOrEqual(slot(global));
      expect(f).toBeLessThan(slot(global + 1));
    }
  });

  it('never goes backwards', () => {
    let previous = -1;
    for (let p = 0; p <= BEATS.length - 1; p += 0.1) {
      const f = railFraction(p);
      expect(f).toBeGreaterThanOrEqual(previous);
      previous = f;
    }
  });

  it('clamps outside the film', () => {
    expect(railFraction(-5)).toBe(0);
    expect(railFraction(999)).toBeLessThanOrEqual(1);
  });
});
