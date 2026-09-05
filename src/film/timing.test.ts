import { describe, expect, it } from 'vitest';
import { buildTiming, progressForClipTime } from './timing';
import { CLIP_SEQUENCE, INTRO_SPAN } from './score';
import { resolveAnchor } from '@/orb/flight';

describe('film timing', () => {
  it('builds a table before any metadata arrives', () => {
    const timing = buildTiming();
    expect(timing.clips.map((c) => c.key)).toEqual(CLIP_SEQUENCE.map((c) => c.key));
    expect(timing.totalUnits).toBeGreaterThan(0);
    expect(timing.clips[0].offsetUnits).toBe(0);
  });

  it('lays clips out head to tail, hold included', () => {
    const timing = buildTiming();
    const [a, b] = timing.clips;
    expect(b.offsetUnits).toBeCloseTo(a.duration + a.holdWeight, 6);
  });

  it('clamps a trim that runs past the real footage', () => {
    const timing = buildTiming({ 'scene1-3': 8 });
    expect(timing.clips[0].trimOut).toBe(8);
    expect(timing.clips[0].duration).toBeCloseTo(6, 6);
  });

  it('puts the first frame at the start of the film and the last at its end', () => {
    const timing = buildTiming();
    const first = timing.clips[0];
    const last = timing.clips[timing.clips.length - 1];
    expect(progressForClipTime(timing, first.key, first.trimIn)).toBeCloseTo(INTRO_SPAN.start, 6);
    expect(progressForClipTime(timing, last.key, last.trimOut)).toBeCloseTo(INTRO_SPAN.end, 6);
  });

  it('agrees with the orb’s own anchor resolver', () => {
    const timing = buildTiming();
    const t = 6.6;
    expect(progressForClipTime(timing, 'scene1-3', t)).toBeCloseTo(
      resolveAnchor({ clip: 'scene1-3', t }, timing)!,
      9,
    );
  });

  it('rises monotonically through the cut', () => {
    const timing = buildTiming();
    const samples = [
      progressForClipTime(timing, 'scene1-3', 11)!,
      progressForClipTime(timing, 'transit-b', 16.9)!,
      progressForClipTime(timing, 'transit-c', 6.8)!,
      progressForClipTime(timing, 'transit-d', 6.0)!,
    ];
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThan(samples[i - 1]);
    }
  });

  it('returns null for a clip outside the intro film', () => {
    expect(progressForClipTime(buildTiming(), 'last-scene', 1)).toBeNull();
  });
});
