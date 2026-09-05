/**
 * The film's internal clock, built from the cut rather than measured from it.
 *
 * Trims are authored in `score.ts`, so the whole timing table can be built
 * before a single byte of video arrives. Metadata still revises it — a clip
 * shorter than its authored trim gets clamped — but the orb no longer has to
 * wait for `loadedmetadata` to know where its keyframes sit.
 */

import type { FilmTiming } from '@/orb/types';
import { CLIP_SEQUENCE, INTRO_SPAN } from './score';

/** `measured` maps a clip key to its real duration, where that is known. */
export function buildTiming(measured: Record<string, number> = {}): FilmTiming {
  let offsetUnits = 0;

  const clips = CLIP_SEQUENCE.map((conf) => {
    const real = measured[conf.key];
    const trimOut = real && Number.isFinite(real) ? Math.min(conf.out, real) : conf.out;
    const duration = Math.max(0.1, trimOut - conf.in);
    const entry = {
      key: conf.key,
      trimIn: conf.in,
      trimOut,
      duration,
      holdWeight: conf.holdWeight,
      offsetUnits,
    };
    offsetUnits += duration + conf.holdWeight;
    return entry;
  });

  return {
    clips,
    totalUnits: offsetUnits,
    startProgress: INTRO_SPAN.start,
    endProgress: INTRO_SPAN.end,
  };
}

/**
 * Global progress for a moment of a clip, or null when the clip is not part of
 * the intro film. The finale and the multilingual chapter carry their own
 * progress instead.
 */
export function progressForClipTime(
  timing: FilmTiming,
  clipKey: string,
  t: number,
): number | null {
  const clip = timing.clips.find((c) => c.key === clipKey);
  if (!clip || timing.totalUnits <= 0) return null;
  const clamped = Math.max(clip.trimIn, Math.min(t, clip.trimOut));
  const units = clip.offsetUnits + (clamped - clip.trimIn);
  const span = timing.endProgress - timing.startProgress;
  return timing.startProgress + (units / timing.totalUnits) * span;
}
