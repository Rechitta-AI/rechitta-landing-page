/**
 * The one inertia clock the film and the orb both run on.
 *
 * Every scrubbed surface — the intro film, the finale film, the orb — has to
 * agree on where "now" is. Running separate easings lets them disagree during a
 * fast scrub, which is invisible for video but obvious for the orb, whose whole
 * job is to look pinned to a point in the footage.
 */

/** How long a surface takes to catch up to the scroll position, in seconds. */
export const CATCH_UP = 0.1;

/**
 * A jump larger than this is a teleport, not a scroll — the loop reset at the
 * end of the experience. Easing across it plays the whole film backwards at
 * speed, so the clock snaps instead.
 */
export const SNAP_THRESHOLD = 0.25;

export type ClockState = { eased: number };

export function createClock(initial: number): ClockState {
  return { eased: initial };
}

/** Advances `state` toward `target` and returns the new eased value. */
export function advanceClock(state: ClockState, target: number, dtSeconds: number): number {
  // A backgrounded tab hands back one enormous frame; uncapped, it would land
  // the whole remaining distance in a single step.
  const dt = Math.min(Math.max(dtSeconds, 0), 0.1);

  if (Math.abs(target - state.eased) > SNAP_THRESHOLD) {
    state.eased = target;
  } else {
    state.eased += (target - state.eased) * (1 - Math.exp(-dt / CATCH_UP));
  }

  return state.eased;
}
