/**
 * The scroll threshold, as a pure state machine.
 *
 * A wheel tick does nothing on its own. Input accumulates into an intent, and
 * only once that intent crosses THRESHOLD does the film commit to the next
 * beat. Everything below the threshold is discarded, which is what stops a
 * trackpad's resting drift from nudging the film a frame at a time.
 *
 * The threshold is direction-agnostic: scrolling back commits exactly the
 * same way as scrolling on, and only the forward direction is ever gated (see
 * `gate` and `isBlocked` below).
 *
 * Three further rules keep a commit from being accidental:
 *   - Intent decays to nothing after IDLE_RESET_MS of quiet, so a slow scroll
 *     spread over seconds never adds up to a move.
 *   - Reversing direction clears the intent rather than subtracting from it.
 *   - Everything is swallowed while a transition is playing, and for
 *     COOLDOWN_MS after it lands.
 *
 * No DOM, no time source, no video. The stage decides nothing; it asks this
 * module what the input meant.
 */

import type { Beat } from './score';

/**
 * Accumulated input needed to commit to a move.
 *
 * This has to sit *below* MAX_DELTA, not above it. When it sat above, a single
 * wheel event could never reach it however hard it was thrown, so a mouse
 * wheel - which fires one discrete event per detent, often more than
 * IDLE_RESET_MS apart - could never move the film in either direction, and a
 * short backward flick on a trackpad stalled at the cap.
 */
export const THRESHOLD = 60;

/** Per-event cap, so one violent wheel spin is still one step. */
export const MAX_DELTA = 90;

/** Quiet for this long and the accumulator forgets what it was doing. */
export const IDLE_RESET_MS = 260;

/**
 * Dead time after a transition lands, so its tail-off is not read as input.
 *
 * A trackpad keeps sending momentum for the best part of a second after the
 * fingers have left it, and with one decisive event now enough to commit, a
 * short cooldown let that tail carry the film two beats on one gesture.
 */
export const COOLDOWN_MS = 320;

/** Cooldown between sub-steps (e.g. boardroom slides) so one swipe only advances 1 step. */
export const STEP_COOLDOWN_MS = 300;

/** Grace period after transition starts before any mid-flight skip is permitted. */
export const SKIP_GRACE_MS = 650;

/** How many refusals a gated beat gives before it lets the viewer through. */
export const NUDGE_LIMIT = 3;

export type Phase = 'idle' | 'moving';

export type DirectorState = {
  index: number;
  /** Sub-step inside the current beat — the boardroom's slide. */
  step: number;
  phase: Phase;
  intent: number;
  lastInputAt: number;
  lockedUntil: number;
  nudges: number;
  transitionStartedAt: number;
};

export type Command =
  | { type: 'none' }
  /** A gated beat refused to advance. */
  | { type: 'nudge'; index: number }
  /**
   * A beat refused to let go because something on it is unfinished — the
   * boardroom's last slide asks a question, and the film should not move on
   * before it is answered. Unlike a nudge this never relents.
   */
  | { type: 'blocked'; index: number }
  /** Movement inside the current beat: the boardroom changed slide. */
  | { type: 'step'; index: number; step: number; dir: 1 | -1 }
  /** Commit to a transition. */
  | { type: 'move'; from: number; to: number; dir: 1 | -1 }
  /** Scrolled forward again mid-transition: cut to the end of the shot. */
  | { type: 'skip' };

export function createDirector(index = 0): DirectorState {
  return {
    index,
    step: 0,
    phase: 'idle',
    intent: 0,
    lastInputAt: -Infinity,
    lockedUntil: -Infinity,
    nudges: 0,
    transitionStartedAt: -Infinity,
  };
}

const sign = (n: number): 1 | -1 => (n < 0 ? -1 : 1);

/**
 * Feeds one input event in. Mutates `state` and returns what it meant.
 *
 * `delta` is positive going forward through the film. Callers should hand over
 * raw pixel deltas; clamping happens here so every input device lands on the
 * same scale.
 */
export function feedInput(
  state: DirectorState,
  delta: number,
  now: number,
  beats: Beat[],
  isBlocked?: (index: number) => boolean,
): Command {
  if (delta === 0) return { type: 'none' };

  // A transition owns the screen while it plays. Scrolling forward through it
  // is only allowed after a grace period so residual momentum from the move's
  // trigger does not accidentally cut the video short.
  if (state.phase === 'moving') {
    if (now - (state.transitionStartedAt ?? 0) < SKIP_GRACE_MS) {
      state.intent = 0;
      state.lastInputAt = now;
      return { type: 'none' };
    }
    if (now - state.lastInputAt > IDLE_RESET_MS) state.intent = 0;
    if (state.intent < 0) state.intent = 0;
    state.lastInputAt = now;
    if (delta < 0) return { type: 'none' };
    state.intent += Math.min(MAX_DELTA, delta);
    if (state.intent < THRESHOLD) return { type: 'none' };
    state.intent = 0;
    return { type: 'skip' };
  }

  // The tail of the gesture that started the last move is not a new one.
  if (now < state.lockedUntil) {
    state.intent = 0;
    state.lastInputAt = now;
    return { type: 'none' };
  }

  if (now - state.lastInputAt > IDLE_RESET_MS) state.intent = 0;
  if (state.intent !== 0 && sign(delta) !== sign(state.intent)) state.intent = 0;

  state.lastInputAt = now;
  state.intent += Math.max(-MAX_DELTA, Math.min(MAX_DELTA, delta));

  if (Math.abs(state.intent) < THRESHOLD) return { type: 'none' };

  const dir = sign(state.intent);
  state.intent = 0;

  return commit(state, dir, now, beats, isBlocked);
}

/** Commits a move in `dir`, applying the beat's own step and gate rules. */
export function commit(
  state: DirectorState,
  dir: 1 | -1,
  now: number,
  beats: Beat[],
  /** Asked before a forward move whether the beat is ready to be left. */
  isBlocked?: (index: number) => boolean,
): Command {
  const beat = beats[state.index];
  const steps = beat?.steps ?? 1;

  // Sub-steps first: the boardroom walks its slides before the film moves on.
  // We lock input briefly so one continuous flick only advances one slide at a time.
  if (dir === 1 && state.step < steps - 1) {
    state.step += 1;
    state.lockedUntil = now + STEP_COOLDOWN_MS;
    return { type: 'step', index: state.index, step: state.step, dir };
  }
  if (dir === -1 && state.step > 0) {
    state.step -= 1;
    state.lockedUntil = now + STEP_COOLDOWN_MS;
    return { type: 'step', index: state.index, step: state.step, dir };
  }

  // An overlay can refuse to let go. This is not the gate below: a gate is a
  // preference the film relents on, this is a requirement it does not.
  if (dir === 1 && isBlocked?.(state.index)) {
    state.lockedUntil = now + COOLDOWN_MS;
    return { type: 'blocked', index: state.index };
  }

  // A gated beat wants its call to action pressed. It relents after a few
  // refusals rather than trapping anyone who cannot find the button.
  if (dir === 1 && beat?.gate) {
    state.nudges += 1;
    if (state.nudges < NUDGE_LIMIT) {
      state.lockedUntil = now + COOLDOWN_MS;
      return { type: 'nudge', index: state.index };
    }
  }

  const to = nextIndex(state.index, dir, beats.length);
  if (to === state.index) return { type: 'none' };

  state.phase = 'moving';
  state.transitionStartedAt = now;
  state.nudges = 0;
  return { type: 'move', from: state.index, to, dir };
}

/** The film loops at the end and stops at the top. */
export function nextIndex(index: number, dir: 1 | -1, count: number): number {
  if (dir === 1) return index >= count - 1 ? 0 : index + 1;
  return index <= 0 ? 0 : index - 1;
}

/** Called by the stage once a transition has landed on `index`. */
export function arrive(
  state: DirectorState,
  index: number,
  dir: 1 | -1,
  now: number,
  beats: Beat[],
): void {
  state.index = index;
  state.phase = 'idle';
  state.intent = 0;
  state.lockedUntil = now + COOLDOWN_MS;
  state.nudges = 0;
  // Arriving backwards lands on the far side of the beat, so the next
  // backward scroll continues out of it rather than replaying its steps.
  const steps = beats[index]?.steps ?? 1;
  state.step = dir === 1 ? 0 : steps - 1;
}

/** Clears a gate's refusal count: the viewer pressed the button after all. */
export function release(state: DirectorState, now: number, beats: Beat[]): Command {
  if (state.phase === 'moving') return { type: 'none' };
  const to = nextIndex(state.index, 1, beats.length);
  if (to === state.index) return { type: 'none' };
  state.phase = 'moving';
  state.transitionStartedAt = now;
  state.intent = 0;
  state.nudges = 0;
  return { type: 'move', from: state.index, to, dir: 1 };
}
