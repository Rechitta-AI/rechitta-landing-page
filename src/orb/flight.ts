/**
 * Turning the authored path into a pose for the current moment.
 *
 * Everything here is pure — no DOM, no refs, no time. The renderer in
 * OrbStage decides nothing; it asks this module where the orb is and draws it.
 */

import type {
  Anchor,
  ExclusionZone,
  FilmTiming,
  Keyframe,
  Pose,
  ResolvedKeyframe,
  Violation,
} from './types';

const EASINGS: Record<Keyframe['ease'], (p: number) => number> = {
  linear: (p) => p,
  in: (p) => p * p,
  out: (p) => 1 - (1 - p) * (1 - p),
  inOut: (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

/** Where the orb sits before the path can be resolved: centre frame, unseen. */
const FALLBACK_POSE: Pose = { x: 50, y: 50, scale: 1, opacity: 0, blur: 0 };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Global scroll progress for an anchor, or null when it cannot be placed —
 * an unknown clip, a time outside the clip's trimmed range, or timing that has
 * not arrived yet.
 */
export function resolveAnchor(anchor: Anchor, timing: FilmTiming | null): number | null {
  if ('progress' in anchor) return anchor.progress;
  if (!timing || timing.totalUnits <= 0) return null;

  const clip = timing.clips.find((c) => c.key === anchor.clip);
  if (!clip) return null;

  // Anchoring outside the trim is always an authoring mistake: the frame the
  // beat was placed against is not in the edit any more.
  if (anchor.t < clip.trimIn || anchor.t > clip.trimOut) return null;

  const units = clip.offsetUnits + (anchor.t - clip.trimIn);
  const span = timing.endProgress - timing.startProgress;
  return timing.startProgress + (units / timing.totalUnits) * span;
}

/**
 * The path in scroll order. Keyframes that cannot resolve are dropped rather
 * than guessed at — a beat in the wrong place is worse than a beat missing,
 * and the dev-time check reports them.
 *
 * `minScale` is the floor no beat may shrink past. The path was authored with
 * depth in mind — the orb reads as far away by getting small — but past a
 * point "far away" just reads as "gone", and beats out over the film were
 * landing at a fifth of the hero's size. Clamping here rather than in the
 * renderer means the interpolation between two beats cannot dip under the
 * floor either: every value it lerps between is already at or above it.
 */
export function resolvePath(
  path: Keyframe[],
  timing: FilmTiming | null,
  portrait = false,
  minScale = 0,
): ResolvedKeyframe[] {
  const resolved: ResolvedKeyframe[] = [];
  for (const keyframe of path) {
    const progress = resolveAnchor(keyframe.anchor, timing);
    if (progress === null) continue;
    // On a portrait screen the overlays lay themselves out flat rather than
    // tracking the footage, so a beat that clears a mockup on a wide screen
    // can land straight on it. Those beats carry a second pose.
    const pose = portrait && keyframe.portrait ? { ...keyframe, ...keyframe.portrait } : keyframe;
    resolved.push({ ...pose, progress, scale: Math.max(pose.scale, minScale) });
  }
  return resolved.sort((a, b) => a.progress - b.progress);
}

/** The orb's pose at a moment. Clamps at both ends; never extrapolates. */
export function poseAt(resolved: ResolvedKeyframe[], progress: number): Pose {
  if (resolved.length === 0) return { ...FALLBACK_POSE };
  if (resolved.length === 1 || progress <= resolved[0].progress) return toPose(resolved[0]);

  const last = resolved[resolved.length - 1];
  if (progress >= last.progress) return toPose(last);

  let hi = 1;
  while (hi < resolved.length - 1 && resolved[hi].progress < progress) hi++;

  const from = resolved[hi - 1];
  const to = resolved[hi];
  const span = to.progress - from.progress;

  // Two beats authored at the same moment: take the later one rather than
  // dividing by zero.
  if (span <= 0) return toPose(to);

  // The easing belongs to the keyframe being approached — it describes how the
  // orb arrives, which is what a shot list means by "eases in".
  const t = EASINGS[to.ease]((progress - from.progress) / span);

  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    scale: lerp(from.scale, to.scale, t),
    opacity: lerp(from.opacity, to.opacity, t),
    blur: lerp(from.blur, to.blur, t),
  };
}

function toPose(k: ResolvedKeyframe): Pose {
  return { x: k.x, y: k.y, scale: k.scale, opacity: k.opacity, blur: k.blur };
}

/**
 * Keyframes that land on a surface reserved for an app mockup.
 *
 * This is the "never on a screen" rule made enforceable. Without it the
 * constraint lives only in the design doc, and the next person nudging a beat
 * by eye quietly puts the orb back on a slide.
 */
export function findExclusionViolations(
  resolved: ResolvedKeyframe[],
  zones: ExclusionZone[],
  timing: FilmTiming | null,
): Violation[] {
  const violations: Violation[] = [];

  for (const zone of zones) {
    const window = 'clip' in zone.window
      ? {
          from: resolveAnchor({ clip: zone.window.clip, t: zone.window.from }, timing),
          to: resolveAnchor({ clip: zone.window.clip, t: zone.window.to }, timing),
        }
      : { from: zone.window.from, to: zone.window.to };

    if (window.from === null || window.to === null) continue;

    resolved.forEach((k, keyframeIndex) => {
      if (k.progress < window.from! || k.progress > window.to!) return;
      const inside =
        k.x >= zone.rect.x0 && k.x <= zone.rect.x1 &&
        k.y >= zone.rect.y0 && k.y <= zone.rect.y1;
      if (inside) violations.push({ keyframeIndex, note: k.note, zoneLabel: zone.label });
    });
  }

  return violations;
}
