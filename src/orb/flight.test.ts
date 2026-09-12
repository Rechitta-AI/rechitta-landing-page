import { describe, it, expect } from 'vitest';
import { resolveAnchor, resolvePath, poseAt, findExclusionViolations } from './flight';
import { buildTiming } from '@/film/timing';
import type { ExclusionZone, FilmTiming, Keyframe, ResolvedKeyframe } from './types';

/**
 * A synthetic four-clip film, for exercising the resolver against fixed
 * numbers. It deliberately does not track the real cut — the tests below that
 * check the authored path use `buildTiming()` for that.
 */
const timing: FilmTiming = {
  startProgress: 0,
  endProgress: 0.5,
  totalUnits: 46.0417,
  clips: [
    { key: 'scene1-3', trimIn: 2, trimOut: 11, duration: 9, holdWeight: 8, offsetUnits: 0 },
    { key: 'transit-b', trimIn: 2, trimOut: 17, duration: 15, holdWeight: 0, offsetUnits: 17 },
    { key: 'transit-c', trimIn: 0, trimOut: 8, duration: 8, holdWeight: 0, offsetUnits: 32 },
    { key: 'transit-d', trimIn: 0, trimOut: 6.0417, duration: 6.0417, holdWeight: 0, offsetUnits: 40 },
  ],
};

const kf = (over: Partial<Keyframe>): Keyframe => ({
  anchor: { progress: 0 },
  x: 0, y: 0, scale: 1, opacity: 1, blur: 0,
  ease: 'linear',
  note: 'test',
  ...over,
});

describe('resolveAnchor', () => {
  it('maps a clip start to the clip start progress', () => {
    expect(resolveAnchor({ clip: 'scene1-3', t: 2 }, timing)).toBeCloseTo(0, 5);
  });

  it('maps a clip end to the clip end progress', () => {
    expect(resolveAnchor({ clip: 'scene1-3', t: 11 }, timing)).toBeCloseTo(0.0977, 3);
  });

  it('accounts for the hold weight of earlier clips', () => {
    expect(resolveAnchor({ clip: 'transit-b', t: 2 }, timing)).toBeCloseTo(0.1846, 3);
  });

  it('places the end of the film at its end progress', () => {
    expect(resolveAnchor({ clip: 'transit-d', t: 6.0417 }, timing)).toBeCloseTo(0.5, 4);
  });

  it('passes raw progress anchors through untouched', () => {
    expect(resolveAnchor({ progress: 0.52 }, timing)).toBe(0.52);
  });

  it('rejects a time outside the clip trim range', () => {
    expect(resolveAnchor({ clip: 'scene1-3', t: 20 }, timing)).toBeNull();
    expect(resolveAnchor({ clip: 'scene1-3', t: 0 }, timing)).toBeNull();
  });

  it('rejects an unknown clip', () => {
    expect(resolveAnchor({ clip: 'nope', t: 1 }, timing)).toBeNull();
  });

  it('returns null before timing is known', () => {
    expect(resolveAnchor({ clip: 'scene1-3', t: 5 }, null)).toBeNull();
  });

  it('follows a retrimmed clip instead of drifting', () => {
    const retrimmed: FilmTiming = {
      ...timing,
      totalUnits: 41.0417,
      clips: [
        { ...timing.clips[0], trimOut: 6, duration: 4 },
        { ...timing.clips[1], offsetUnits: 12 },
        { ...timing.clips[2], offsetUnits: 27 },
        { ...timing.clips[3], offsetUnits: 35 },
      ],
    };
    expect(resolveAnchor({ clip: 'scene1-3', t: 6 }, retrimmed)).toBeCloseTo((4 / 41.0417) * 0.5, 4);
  });
});

describe('resolvePath', () => {
  it('sorts by resolved progress and drops what will not resolve', () => {
    const path = [
      kf({ anchor: { progress: 0.9 }, note: 'late' }),
      kf({ anchor: { clip: 'scene1-3', t: 2 }, note: 'early' }),
      kf({ anchor: { clip: 'ghost', t: 1 }, note: 'unresolvable' }),
    ];
    const out = resolvePath(path, timing);
    expect(out.map((k) => k.note)).toEqual(['early', 'late']);
  });

  it('returns nothing while timing is unknown and no raw anchors exist', () => {
    expect(resolvePath([kf({ anchor: { clip: 'scene1-3', t: 3 } })], null)).toEqual([]);
  });

  it('still resolves raw progress anchors before the film has loaded', () => {
    expect(resolvePath([kf({ anchor: { progress: 0.6 } })], null)).toHaveLength(1);
  });
});

describe('poseAt', () => {
  const kfs: ResolvedKeyframe[] = [
    { ...kf({}), progress: 0 },
    { ...kf({ x: 100, y: 50, scale: 2, opacity: 0.5, blur: 4 }), progress: 1 },
  ];

  it('returns the exact authored pose at a keyframe', () => {
    expect(poseAt(kfs, 0)).toMatchObject({ x: 0, scale: 1 });
    expect(poseAt(kfs, 1)).toMatchObject({ x: 100, scale: 2 });
  });

  it('interpolates every field between keyframes', () => {
    const p = poseAt(kfs, 0.5);
    expect(p.x).toBeCloseTo(50, 5);
    expect(p.y).toBeCloseTo(25, 5);
    expect(p.blur).toBeCloseTo(2, 5);
  });

  it('clamps rather than extrapolating outside the path', () => {
    expect(poseAt(kfs, -1).x).toBe(0);
    expect(poseAt(kfs, 2).x).toBe(100);
  });

  it('applies the incoming keyframe easing, not the outgoing one', () => {
    const eased: ResolvedKeyframe[] = [
      { ...kf({ ease: 'linear' }), progress: 0 },
      { ...kf({ x: 100, ease: 'in' }), progress: 1 },
    ];
    // 'in' starts slow, so the midpoint sits below the linear halfway mark.
    expect(poseAt(eased, 0.5).x).toBeLessThan(50);
  });

  it('survives an empty path', () => {
    expect(poseAt([], 0.5)).toMatchObject({ x: 50, y: 50 });
  });
});

describe('findExclusionViolations', () => {
  const zones: ExclusionZone[] = [
    {
      label: 'screen',
      window: { clip: 'scene1-3', from: 6.2, to: 11 },
      rect: { x0: 26, y0: 10, x1: 75, y1: 64 },
    },
  ];

  it('flags a keyframe inside a zone during its window', () => {
    const path = [kf({ anchor: { clip: 'scene1-3', t: 8 }, x: 50, y: 40, note: 'on the screen' })];
    const found = findExclusionViolations(resolvePath(path, timing), zones, timing);
    expect(found).toHaveLength(1);
    expect(found[0].zoneLabel).toBe('screen');
  });

  it('permits the same position outside the zone window', () => {
    const path = [kf({ anchor: { clip: 'scene1-3', t: 3 }, x: 50, y: 40 })];
    expect(findExclusionViolations(resolvePath(path, timing), zones, timing)).toHaveLength(0);
  });

  it('permits a position clear of the rectangle', () => {
    const path = [kf({ anchor: { clip: 'scene1-3', t: 8 }, x: 50, y: 78 })];
    expect(findExclusionViolations(resolvePath(path, timing), zones, timing)).toHaveLength(0);
  });
});

describe('the authored path', () => {
  // The path anchors to the film as it is actually cut, so these read the
  // real timing table rather than the fixture above.
  const cut = buildTiming();

  it('never enters a mockup surface', async () => {
    const { ORB_PATH, EXCLUSION_ZONES } = await import('./path');
    const resolved = resolvePath(ORB_PATH, cut);
    expect(findExclusionViolations(resolved, EXCLUSION_ZONES, cut)).toEqual([]);
  });

  it('resolves every keyframe it authors', async () => {
    const { ORB_PATH } = await import('./path');
    expect(resolvePath(ORB_PATH, cut)).toHaveLength(ORB_PATH.length);
  });

  it('starts and ends on the same pose so the loop is invisible', async () => {
    const { ORB_PATH } = await import('./path');
    const heroes = ORB_PATH.filter((k) => k.hero);
    expect(heroes).toHaveLength(2);
    expect(heroes[0].x).toBe(heroes[1].x);
    expect(heroes[0].y).toBe(heroes[1].y);
    expect(heroes[0].scale).toBe(heroes[1].scale);
  });

  it('authors docked keyframes centered horizontally for the phone mockup', async () => {
    const { ORB_PATH } = await import('./path');
    const docks = ORB_PATH.filter((k) => k.dock);
    expect(docks).toHaveLength(2);
    expect(docks[0].portrait?.x).toBe(50);
    expect(docks[1].portrait?.x).toBe(50);
    expect(docks[0].portrait?.y).toBe(docks[1].portrait?.y);
  });

  it('authors finale dock centered horizontally below content', async () => {
    const { ORB_PATH } = await import('./path');
    const finaleDocks = ORB_PATH.filter((k) => k.finaleDock);
    expect(finaleDocks).toHaveLength(1);
    expect(finaleDocks[0].portrait?.x).toBe(50);
    expect(finaleDocks[0].portrait?.y).toBeGreaterThan(75);
    expect(finaleDocks[0].ease).toBe('out');
  });
});

describe('minimum scale floor', () => {
  const timing: FilmTiming = {
    clips: [
      { key: 'a', trimIn: 0, trimOut: 10, duration: 10, holdWeight: 0, offsetUnits: 0 },
    ],
    totalUnits: 10,
    startProgress: 0,
    endProgress: 1,
  };

  const tiny: Keyframe[] = [
    { anchor: { clip: 'a', t: 0 }, x: 0, y: 0, scale: 1.2, opacity: 1, blur: 0, ease: 'linear', note: 'hero' },
    { anchor: { clip: 'a', t: 5 }, x: 0, y: 0, scale: 0.2, opacity: 1, blur: 0, ease: 'linear', note: 'speck' },
    { anchor: { clip: 'a', t: 10 }, x: 0, y: 0, scale: 0.3, opacity: 1, blur: 0, ease: 'linear', note: 'small' },
  ];

  it('lifts every beat under the floor up to it', () => {
    const resolved = resolvePath(tiny, timing, false, 0.72);
    expect(resolved.map((k) => k.scale)).toEqual([1.2, 0.72, 0.72]);
  });

  it('leaves beats already above the floor alone', () => {
    const resolved = resolvePath(tiny, timing, false, 0.1);
    expect(resolved.map((k) => k.scale)).toEqual([1.2, 0.2, 0.3]);
  });

  it('never interpolates below the floor between two beats', () => {
    const resolved = resolvePath(tiny, timing, false, 0.72);
    for (let p = 0; p <= 1; p += 0.01) {
      expect(poseAt(resolved, p).scale).toBeGreaterThanOrEqual(0.72 - 1e-9);
    }
  });

  it('clamps a portrait override too', () => {
    const withPortrait: Keyframe[] = [
      {
        anchor: { clip: 'a', t: 0 },
        portrait: { scale: 0.24 },
        x: 0, y: 0, scale: 0.3, opacity: 1, blur: 0, ease: 'linear', note: 'flat deck',
      },
    ];
    expect(resolvePath(withPortrait, timing, true, 0.45)[0].scale).toBe(0.45);
  });

  it('defaults to no floor when none is given', () => {
    expect(resolvePath(tiny, timing)[1].scale).toBe(0.2);
  });
});
