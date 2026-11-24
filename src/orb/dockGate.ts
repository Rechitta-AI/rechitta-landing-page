/**
 * Holding the orb off its dock until the scene it docks to is actually there.
 *
 * The broker's dock is measured off the answer column, and on a phone that
 * column only cascades in once the focus pull's curtain has already swapped
 * the stage over. Coming back from the multilingual chapter the orb reached
 * the dock well before the column did, so it sat pinned to the edge of a card
 * that was not on screen yet. Going the other way the problem does not exist:
 * the broker tears its own panel down before the film moves.
 *
 * The fix is a one-sided floor on the progress the orb reads. While the gate
 * is armed the orb may not descend past `hold` — a point just short of the
 * dock, taken from the path's own next beat rather than authored as a new one.
 * When the panel reports itself settled the floor eases down onto `dock` and
 * the gate drops.
 *
 * Everything here is pure: the caller passes `now`, so the whole state machine
 * is testable without a clock.
 */

import type { ResolvedKeyframe } from './types';

/**
 * How long the release takes to ease the orb from the hold onto the dock, ms.
 *
 * The hold is centre frame, so this is a real flight across to the column
 * rather than a nudge — slower than a UI transition, in the film's own tempo.
 */
export const BROKER_SETTLE_MS = 820;

/**
 * How long past the curtain the gate waits for a readiness signal that may
 * never come — a backgrounded tab stops the overlay's timeline, and its exit
 * branch can kill it mid-flight. On expiry the gate releases itself through
 * the same ramp, so the worst case is a settle that lands early, never an orb
 * stranded off its dock.
 */
export const SETTLE_GRACE_MS = 2200;

/**
 * Past this distance *above* the dock the film is somewhere else entirely —
 * a jump to the finale — and the gate is stale. Below the dock the park's own
 * threshold handles it instead, since the beat legitimately rests 0.08 short
 * of its dock on portrait and that must not read as having left.
 */
export const GATE_ABANDON = 0.15;

/**
 * How far below the beat's own park the film has to fall before the gate reads
 * it as the viewer leaving rather than arriving.
 *
 * The arrival tween converges on the park from above and `advanceClock` lags
 * it without overshooting, so anything at all would do; this is just clear of
 * float noise.
 */
export const PARK_EPS = 0.01;

/**
 * How long the floor takes to decay out of the way once the viewer leaves
 * mid-hold, ms. See `stepDockGate` for why it decays rather than being removed.
 */
export const ABANDON_MS = 420;

/**
 * How far the decaying floor travels. It only has to get below wherever the
 * film has reached, and it stops the moment it does — this is the ceiling on
 * that, big enough to cross the whole intro span.
 */
const ABANDON_SPAN = 0.45;

export type DockGate = {
  /** Where the orb waits: just short of the dock, in global progress. */
  hold: number;
  /** The dock itself — where the release ramp lands. */
  dock: number;
  /** Where the film parks on this beat. Below it, the viewer is leaving. */
  park: number;
  /** When the gate gives up waiting and releases itself. */
  expiresAt: number;
  /** When the destination reported itself settled; null while still waiting. */
  releasedAt: number | null;
  /** When the viewer left mid-hold; null unless that happened. */
  abandonedAt: number | null;
};

const smoothstep = (t: number) => t * t * (3 - 2 * t);

/**
 * The hold and dock progresses for the orb's broker dock, or null when the
 * path cannot supply them — timing has not arrived, the beat was retired, or
 * the dock is the last beat in the path and so has nothing to hold short of.
 *
 * `lead` is the fraction of the way toward the next beat the orb waits at. The
 * pose that falls out of it is the path's own approach, which is the point:
 * a hold keyframe inserted into ORB_PATH would also be traversed on the way
 * out and would put a dip into the forward exit.
 */
export function dockHoldFor(
  resolved: ResolvedKeyframe[],
  lead: number,
): { hold: number; dock: number } | null {
  if (!(lead > 0 && lead < 1)) return null;

  let dockIndex = -1;
  for (let i = resolved.length - 1; i >= 0; i--) {
    if (resolved[i].brokerDock) {
      dockIndex = i;
      break;
    }
  }
  if (dockIndex < 0) return null;

  const dockKeyframe = resolved[dockIndex];
  const next = resolved[dockIndex + 1];
  if (!next || next.progress <= dockKeyframe.progress) return null;

  return {
    dock: dockKeyframe.progress,
    hold: dockKeyframe.progress + (next.progress - dockKeyframe.progress) * lead,
  };
}

/**
 * Arms a gate, or returns null when the path cannot support one.
 *
 * `park` is where the film comes to rest on the beat being entered. The gate
 * needs it to tell arriving from leaving: both travel downward through this
 * stretch, and only one of them should be held.
 */
export function armDockGate(
  resolved: ResolvedKeyframe[],
  now: number,
  timeoutMs: number,
  lead: number,
  park: number,
): DockGate | null {
  const points = dockHoldFor(resolved, lead);
  if (!points) return null;
  return { ...points, park, expiresAt: now + timeoutMs, releasedAt: null, abandonedAt: null };
}

/** The destination has settled. Starts the ramp; a second call is a no-op. */
export function releaseDockGate(gate: DockGate, now: number): DockGate {
  if (gate.releasedAt !== null) return gate;
  return { ...gate, releasedAt: now };
}

/**
 * The floor for this frame, and the gate to carry into the next one.
 *
 * `floor` is null when the gate no longer constrains anything; `gate` is null
 * once it has been dropped. The caller raises its own progress to the floor
 * with `Math.max`.
 *
 * Four ways out, in priority order:
 *
 *  1. **Released** — the destination reported itself ready. The floor eases
 *     from the hold onto the dock and the gate drops. This is the settle the
 *     whole gate exists to produce.
 *  2. **Expired** — the readiness signal never came. Same ramp, so a timeout
 *     looks like an early settle rather than a stranded orb.
 *  3. **Abandoned** — the viewer left mid-hold. See below.
 *  4. **Stale** — the film is somewhere else entirely. Dropped outright,
 *     because the film itself has jumped and a snap is the correct reading.
 *
 * On (3) the floor *decays* rather than being removed. Removing it looked
 * right in the one-sided-floor argument — a viewer heading back toward the
 * cities pushes progress above the floor and `Math.max` goes inert on its own
 * — but that reasoning only covers travel upward. Heading the other way, back
 * toward the boardroom, progress stays *below* the floor, so the orb was
 * pinned at centre frame for the whole first stretch of the retreat and then
 * jumped about 20vw in a single frame when the gate finally went stale, with
 * the trail saturating across the jump. Decaying the floor past wherever the
 * film has reached lets `Math.max` cross over continuously instead: the two
 * meet, and from that frame on the orb is simply following the film again.
 */
export function stepDockGate(
  gate: DockGate,
  eased: number,
  now: number,
): { floor: number | null; gate: DockGate | null } {
  // (3) Leaving mid-hold — already decaying, or starting to.
  const abandonedAt = gate.abandonedAt ?? (eased < gate.park - PARK_EPS ? now : null);
  if (abandonedAt !== null && gate.releasedAt === null && now < gate.expiresAt) {
    const t = (now - abandonedAt) / ABANDON_MS;
    const floor = gate.hold - ABANDON_SPAN * Math.max(0, t);
    // The crossover: once the floor is under the film, it constrains nothing.
    if (t >= 1 || floor <= eased) return { floor: null, gate: null };
    return { floor, gate: gate.abandonedAt === null ? { ...gate, abandonedAt } : gate };
  }

  // (4) Somewhere else entirely.
  if (Math.abs(eased - gate.dock) > GATE_ABANDON) return { floor: null, gate: null };

  // (1) and (2).
  const releasedAt = gate.releasedAt ?? (now >= gate.expiresAt ? now : null);
  if (releasedAt === null) return { floor: gate.hold, gate };

  const t = (now - releasedAt) / BROKER_SETTLE_MS;
  if (t >= 1) return { floor: null, gate: null };

  const next = gate.releasedAt === null ? { ...gate, releasedAt } : gate;
  const e = smoothstep(Math.max(0, t));
  return { floor: gate.hold + (gate.dock - gate.hold) * e, gate: next };
}
