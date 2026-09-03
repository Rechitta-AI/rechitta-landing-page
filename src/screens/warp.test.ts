import { describe, it, expect } from 'vitest';
import { coverRect, toViewport, cornersAt, trackAt, edgeFade, matrix3dFor } from './warp';
import type { Quad, ScreenTrack } from './types';

/** Applies a CSS matrix3d string back to a point, so the maths can be checked. */
function apply(matrix: string, x: number, y: number): [number, number] {
  const n = matrix.slice('matrix3d('.length, -1).split(',').map(Number);
  // Column-major: n[0..3] is column 1, n[4..7] column 2, n[12..15] column 4.
  const h11 = n[0], h21 = n[1], h31 = n[3];
  const h12 = n[4], h22 = n[5], h32 = n[7];
  const h13 = n[12], h23 = n[13];
  const w = h31 * x + h32 * y + 1;
  return [(h11 * x + h12 * y + h13) / w, (h21 * x + h22 * y + h23) / w];
}

const track: ScreenTrack = {
  clip: 'transit-b',
  from: 1,
  to: 3,
  image: '/broker.jpg',
  samples: [
    { t: 1, corners: [[0, 0], [0.2, 0], [0.2, 0.4], [0, 0.4]] },
    { t: 3, corners: [[0.4, 0.2], [0.8, 0.2], [0.8, 1], [0.4, 1]] },
  ],
};

describe('coverRect', () => {
  it('fills the width and crops top and bottom on a wide viewport', () => {
    const r = coverRect(1600, 800); // 2:1, wider than 16:9
    expect(r.width).toBe(1600);
    expect(r.height).toBeCloseTo(900, 5);
    expect(r.y).toBeCloseTo(-50, 5); // cropped evenly
  });

  it('fills the height and crops the sides on a tall viewport', () => {
    const r = coverRect(800, 800);
    expect(r.height).toBe(800);
    expect(r.width).toBeCloseTo(1422.22, 1);
    expect(r.x).toBeCloseTo(-311.11, 1);
  });

  it('matches exactly when the viewport is already 16:9', () => {
    const r = coverRect(1600, 900);
    expect(r).toMatchObject({ x: 0, y: 0, width: 1600 });
    expect(r.height).toBeCloseTo(900, 5);
  });
});

describe('toViewport', () => {
  it('maps frame corners through the cover crop', () => {
    const rect = { x: -100, y: 0, width: 1200, height: 800 };
    const out = toViewport([[0, 0], [1, 0], [1, 1], [0, 1]] as Quad, rect);
    expect(out[0]).toEqual([-100, 0]);
    expect(out[2]).toEqual([1100, 800]);
  });
});

describe('cornersAt', () => {
  it('returns an authored sample exactly', () => {
    expect(cornersAt(track, 1)![0]).toEqual([0, 0]);
  });

  it('interpolates between samples', () => {
    const q = cornersAt(track, 2)!;
    expect(q[0][0]).toBeCloseTo(0.2, 5);
    expect(q[0][1]).toBeCloseTo(0.1, 5);
  });

  it('clamps outside the sampled range instead of extrapolating', () => {
    expect(cornersAt(track, -5)![0]).toEqual([0, 0]);
    expect(cornersAt(track, 99)![0]).toEqual([0.4, 0.2]);
  });

  it('has nothing to say without samples', () => {
    expect(cornersAt({ ...track, samples: [] }, 2)).toBeNull();
  });
});

describe('trackAt', () => {
  it('finds the track showing at the playhead', () => {
    expect(trackAt([track], { clip: 'transit-b', t: 2 })).toBe(track);
  });

  it('ignores a different clip at the same time', () => {
    expect(trackAt([track], { clip: 'transit-c', t: 2 })).toBeNull();
  });

  it('ignores a time outside the window', () => {
    expect(trackAt([track], { clip: 'transit-b', t: 9 })).toBeNull();
  });

  it('shows nothing when the film has not reported a playhead', () => {
    expect(trackAt([track], null)).toBeNull();
  });
});

describe('edgeFade', () => {
  it('is out at both edges and in through the middle', () => {
    expect(edgeFade(track, 1)).toBe(0);
    expect(edgeFade(track, 3)).toBe(0);
    expect(edgeFade(track, 2)).toBe(1);
  });

  it('ramps rather than popping', () => {
    const f = edgeFade(track, 1.2);
    expect(f).toBeGreaterThan(0);
    expect(f).toBeLessThan(1);
  });
});

describe('matrix3dFor', () => {
  it('lands each corner of the image on its target corner', () => {
    const dst: Quad = [[100, 50], [400, 80], [380, 500], [120, 460]];
    const m = matrix3dFor(200, 400, dst);
    const src: [number, number][] = [[0, 0], [200, 0], [200, 400], [0, 400]];
    src.forEach(([x, y], i) => {
      const [u, v] = apply(m, x, y);
      expect(u).toBeCloseTo(dst[i][0], 6);
      expect(v).toBeCloseTo(dst[i][1], 6);
    });
  });

  it('handles a plain rectangle without perspective', () => {
    const m = matrix3dFor(10, 20, [[0, 0], [10, 0], [10, 20], [0, 20]]);
    const [u, v] = apply(m, 5, 10);
    expect(u).toBeCloseTo(5, 6);
    expect(v).toBeCloseTo(10, 6);
  });

  it('refuses a degenerate quad rather than emitting nonsense', () => {
    expect(matrix3dFor(10, 20, [[0, 0], [0, 0], [0, 0], [0, 0]])).toBe('none');
  });
});

describe('the generated tracks', () => {
  it('cover the broker and the buyer, with four ordered corners throughout', async () => {
    const { SCREEN_TRACKS } = await import('./tracks');
    expect(SCREEN_TRACKS.length).toBeGreaterThanOrEqual(4);

    const images = new Set(SCREEN_TRACKS.map((t) => t.image));
    expect(images).toContain('/live-inventory-final.jpeg');
    expect(images).toContain('/live-interruption-final.jpeg');

    for (const t of SCREEN_TRACKS) {
      expect(t.samples.length).toBeGreaterThan(4);
      let previous = -Infinity;
      for (const s of t.samples) {
        expect(s.corners).toHaveLength(4);
        expect(s.t).toBeGreaterThan(previous); // sorted, so interpolation is safe
        previous = s.t;
        const [tl, tr, br, bl] = s.corners;
        expect(tr[0]).toBeGreaterThan(tl[0]); // top edge runs left to right
        expect(bl[1]).toBeGreaterThan(tl[1]); // left edge runs top to bottom
        expect(br[0]).toBeGreaterThan(bl[0]);
      }
    }
  });
});
