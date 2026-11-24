import { describe, it, expect } from 'vitest';
import {
  CHIP_MIN_SEPARATION,
  GLOBAL_HUBS,
  HEADER_BAND_BOTTOM,
  MAP_BAND,
  PORTRAIT_CHIP,
  chipRects,
  chipsOverlap,
  makeArcPath,
  STREAM_ARCS,
  DUBAI_HQ,
} from './finaleHubs';

/**
 * The portrait chips replaced seven 232-unit pill badges whose anti-collision
 * offsets were hand-tuned for that width. A 112-unit chip needs its own, and
 * the first pass at them put MOSCOW over LONDON and HQ under HI. These are the
 * assertions that stop that happening again.
 */
describe('portrait hub chips', () => {
  const rects = chipRects();

  it('gives every hub a chip', () => {
    expect(rects).toHaveLength(GLOBAL_HUBS.length);
    GLOBAL_HUBS.forEach((h) => {
      expect(h.portraitChipOffset, h.key).toBeDefined();
    });
  });

  it('never lets two chips overlap', () => {
    const collisions: string[] = [];
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        if (chipsOverlap(rects[i], rects[j])) collisions.push(`${rects[i].key}/${rects[j].key}`);
      }
    }
    expect(collisions).toEqual([]);
  });

  it('keeps every pair clear on at least one axis by the full chip size', () => {
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const clear =
          Math.abs(a.cx - b.cx) >= CHIP_MIN_SEPARATION ||
          Math.abs(a.cy - b.cy) >= PORTRAIT_CHIP.height;
        expect(clear, `${a.key}/${b.key}`).toBe(true);
      }
    }
  });

  it('stays out of the header band', () => {
    rects.forEach((r) => {
      expect(r.top, r.key).toBeGreaterThanOrEqual(HEADER_BAND_BOTTOM);
    });
  });

  it('stays inside the map band and the canvas', () => {
    rects.forEach((r) => {
      expect(r.bottom, r.key).toBeLessThanOrEqual(MAP_BAND.bottom);
      expect(r.left, r.key).toBeGreaterThanOrEqual(0);
      expect(r.right, r.key).toBeLessThanOrEqual(2000);
    });
  });

  it('leaves every hub its own dot showing beside its chip', () => {
    // The chip is the label, not the marker. If it covers the point, the
    // viewer can read which city it is but not where it is.
    GLOBAL_HUBS.forEach((h, i) => {
      const r = rects[i];
      const covered = h.x > r.left && h.x < r.right && h.y > r.top && h.y < r.bottom;
      expect(covered, `${h.key} chip sits on its own dot`).toBe(false);
    });
  });

  it('keeps the two letters large enough to read on a phone', () => {
    // 0.155 is the canvas scale on a 383px portrait viewport.
    expect(PORTRAIT_CHIP.text * 0.155).toBeGreaterThanOrEqual(9);
  });
});

describe('hub data', () => {
  it('has one HQ, and every arc runs to it', () => {
    expect(GLOBAL_HUBS.filter((h) => h.isHQ)).toHaveLength(1);
    expect(DUBAI_HQ.key).toBe('dubai');
    expect(STREAM_ARCS).toHaveLength(GLOBAL_HUBS.length - 1);
    STREAM_ARCS.forEach((a) => {
      expect(a.path.endsWith(`${DUBAI_HQ.x} ${DUBAI_HQ.y}`), a.key).toBe(true);
    });
  });

  it('bows each arc toward the top of the canvas', () => {
    // M x y Q mx my tx ty — the control point sits above the straight line.
    const path = makeArcPath(0, 400, 400, 400);
    expect(path).toBe('M 0 400 Q 200 312 400 400');
  });

  it('places every hub inside the map band', () => {
    GLOBAL_HUBS.forEach((h) => {
      expect(h.y, h.key).toBeGreaterThanOrEqual(MAP_BAND.top);
      expect(h.y, h.key).toBeLessThanOrEqual(MAP_BAND.bottom);
    });
  });
});
