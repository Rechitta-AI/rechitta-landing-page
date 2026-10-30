import { describe, expect, it } from 'vitest';
import {
  COOLDOWN_MS,
  IDLE_RESET_MS,
  MAX_DELTA,
  NUDGE_LIMIT,
  STEP_COOLDOWN_MS,
  THRESHOLD,
  arrive,
  createDirector,
  feedHorizontalInput,
  feedInput,
  nextIndex,
  release,
} from './director';

/** Comfortably past the step guard's idle window — a gap this size always reads as a genuine pause. */
const PAST_GUARD_MS = IDLE_RESET_MS + 400;
import type { Beat } from './score';

const beats: Beat[] = [
  { id: 'a', chapter: 'intro', label: 'a', park: 0 },
  { id: 'b', chapter: 'intro', label: 'b', park: 0, steps: 3 },
  { id: 'c', chapter: 'intro', label: 'c', park: 0, gate: true },
  { id: 'd', chapter: 'intro', label: 'd', park: 0 },
];

/** Enough input to cross the threshold in one go, given the per-event cap. */
const ticks = Math.ceil(THRESHOLD / MAX_DELTA);

function push(state: ReturnType<typeof createDirector>, delta: number, from = 0) {
  let last: ReturnType<typeof feedInput> = { type: 'none' };
  for (let i = 0; i < ticks; i++) {
    last = feedInput(state, delta, from + i * 10, beats);
  }
  return last;
}

function pushH(state: ReturnType<typeof createDirector>, delta: number, from = 0) {
  let last: ReturnType<typeof feedHorizontalInput> = { type: 'none' };
  for (let i = 0; i < ticks; i++) {
    last = feedHorizontalInput(state, delta, from + i * 10, beats);
  }
  return last;
}

describe('scroll threshold', () => {
  it('ignores input below the threshold', () => {
    const s = createDirector();
    expect(feedInput(s, 20, 0, beats)).toEqual({ type: 'none' });
    expect(feedInput(s, 20, 10, beats)).toEqual({ type: 'none' });
    expect(s.index).toBe(0);
  });

  it('commits once accumulated intent crosses the threshold', () => {
    const s = createDirector();
    expect(push(s, MAX_DELTA)).toEqual({ type: 'move', from: 0, to: 1, dir: 1 });
    expect(s.phase).toBe('moving');
  });

  it('forgets intent after a quiet gap, so a slow drift never commits', () => {
    const s = createDirector();
    for (let i = 0; i < 20; i++) {
      const out = feedInput(s, 40, i * (IDLE_RESET_MS + 50), beats);
      expect(out).toEqual({ type: 'none' });
    }
    expect(s.index).toBe(0);
  });

  it('clears intent when the direction reverses', () => {
    const s = createDirector();
    const half = Math.floor(THRESHOLD / 2);
    feedInput(s, half, 0, beats);
    feedInput(s, -half, 10, beats);
    expect(s.intent).toBe(-half);
  });

  it('lets one decisive event commit, forwards and backwards', () => {
    // The per-event cap has to clear the threshold, or a mouse wheel - one
    // discrete event per detent - can never move the film at all.
    expect(MAX_DELTA).toBeGreaterThanOrEqual(THRESHOLD);

    const forward = createDirector();
    expect(feedInput(forward, 120, 0, beats)).toEqual({ type: 'move', from: 0, to: 1, dir: 1 });

    const back = createDirector(3);
    expect(feedInput(back, -120, 0, beats)).toEqual({ type: 'move', from: 3, to: 2, dir: -1 });
  });

  it('commits a backward move on the same input a forward move takes', () => {
    const s = createDirector(2);
    // Well past the idle reset, so nothing is carried over from before.
    expect(push(s, -MAX_DELTA, 10_000)).toEqual({ type: 'move', from: 2, to: 1, dir: -1 });
  });

  it('ignores a backward scroll while a transition plays', () => {
    const s = createDirector();
    push(s, MAX_DELTA);
    expect(s.phase).toBe('moving');
    for (let i = 0; i < 20; i++) {
      expect(feedInput(s, -MAX_DELTA, 1000 + i, beats)).toEqual({ type: 'none' });
    }
    expect(s.phase).toBe('moving');
  });

  it('ignores skip requests during grace period, and cuts when scrolled forward after', () => {
    const s = createDirector();
    push(s, MAX_DELTA);
    expect(s.phase).toBe('moving');
    // During grace period (e.g. 100ms after start), skip inputs are discarded
    expect(feedInput(s, MAX_DELTA, 100, beats)).toEqual({ type: 'none' });
    // After grace period, accumulating enough intent commits to a skip
    expect(push(s, MAX_DELTA, 1000)).toEqual({ type: 'skip' });
    // Still moving: the stage decides when the skip has landed.
    expect(s.phase).toBe('moving');
  });

  it('swallows the tail of a gesture during the cooldown', () => {
    const s = createDirector();
    push(s, MAX_DELTA);
    arrive(s, 1, 1, 1000, beats);
    expect(push(s, MAX_DELTA, 1000)).toEqual({ type: 'none' });
    expect(s.index).toBe(1);
  });

  it('caps a violent wheel spin at one step', () => {
    const s = createDirector();
    expect(feedInput(s, 100000, 0, beats)).toEqual({ type: 'move', from: 0, to: 1, dir: 1 });
    // Everything after it is swallowed until the transition lands.
    for (let i = 1; i <= 20; i++) {
      expect(feedInput(s, 100000, i * 10, beats)).toEqual({ type: 'none' });
    }
    expect(s.index).toBe(0);
  });
});

describe('beat steps', () => {
  it('walks a beat’s own steps before moving the film', () => {
    const s = createDirector();
    arrive(s, 1, 1, 0, beats);
    const t = COOLDOWN_MS + 100;
    // Gaps are comfortably past the step guard's idle window, so each push
    // lands after a genuine pause and is read as a new gesture.
    expect(push(s, MAX_DELTA, t)).toEqual({ type: 'step', index: 1, step: 1, dir: 1 });
    expect(push(s, MAX_DELTA, t + PAST_GUARD_MS)).toEqual({ type: 'step', index: 1, step: 2, dir: 1 });
    expect(push(s, MAX_DELTA, t + 2 * PAST_GUARD_MS)).toEqual({ type: 'move', from: 1, to: 2, dir: 1 });
  });

  it('lands on the last step when arriving backwards', () => {
    const s = createDirector();
    arrive(s, 1, -1, 0, beats);
    expect(s.step).toBe(2);
  });

  it('does not let a trackpad momentum tail commit a second step (regression)', () => {
    const s = createDirector();
    arrive(s, 1, 1, 0, beats);
    const t = COOLDOWN_MS + 100;
    expect(push(s, MAX_DELTA, t)).toEqual({ type: 'step', index: 1, step: 1, dir: 1 });
    // Decaying momentum: small events every ~25ms, i.e. never a gap bigger
    // than IDLE_RESET_MS, long after STEP_COOLDOWN_MS (300ms) and well past
    // the old flat 650ms window this used to leak through.
    for (let dt = 25; dt < 900; dt += 25) {
      expect(feedInput(s, MAX_DELTA, t + dt, beats)).toEqual({ type: 'none' });
    }
    expect(s.step).toBe(1);
  });

  it('does not let a single sustained gesture commit twice, however long it lasts (regression)', () => {
    const s = createDirector();
    arrive(s, 1, 1, 0, beats);
    let t = COOLDOWN_MS + 100;

    // The gesture's first event already clears THRESHOLD on its own, so it
    // commits immediately.
    expect(feedInput(s, MAX_DELTA, t, beats)).toEqual({ type: 'step', index: 1, step: 1, dir: 1 });

    // The physical gesture keeps going: events every 30ms, well under
    // IDLE_RESET_MS apart, sustained for 900ms total — comfortably past the
    // old flat 650ms window this used to leak through. None of these may commit.
    const end = t + 900;
    for (t += 30; t <= end; t += 30) {
      expect(feedInput(s, MAX_DELTA, t, beats)).toEqual({ type: 'none' });
    }
    expect(s.step).toBe(1);

    // A genuine pause ends the gesture, so a continued swipe afterward is
    // read as a new, independent step.
    t += PAST_GUARD_MS;
    expect(feedInput(s, MAX_DELTA, t, beats)).toEqual({ type: 'step', index: 1, step: 2, dir: 1 });
  });

  it('still commits a new step once a genuine pause has passed', () => {
    const s = createDirector();
    arrive(s, 1, 1, 0, beats);
    const t = COOLDOWN_MS + 100;
    expect(push(s, MAX_DELTA, t)).toEqual({ type: 'step', index: 1, step: 1, dir: 1 });
    expect(push(s, MAX_DELTA, t + PAST_GUARD_MS)).toEqual({ type: 'step', index: 1, step: 2, dir: 1 });
  });
});

describe('horizontal steps', () => {
  it('ignores a beat with no steps', () => {
    const s = createDirector(0); // beat 'a' has no steps
    expect(pushH(s, MAX_DELTA, 1000)).toEqual({ type: 'none' });
    expect(s.step).toBe(0);
  });

  it('steps forward and backward on a beat with steps', () => {
    const s = createDirector();
    arrive(s, 1, 1, 0, beats);
    const t = COOLDOWN_MS + 100;
    expect(pushH(s, MAX_DELTA, t)).toEqual({ type: 'step', index: 1, step: 1, dir: 1 });
    expect(pushH(s, -MAX_DELTA, t + PAST_GUARD_MS)).toEqual({ type: 'step', index: 1, step: 0, dir: -1 });
  });

  it('does nothing at the last slide rather than advancing the beat', () => {
    const s = createDirector();
    arrive(s, 1, 1, 0, beats); // beat 'b' has 3 steps: 0, 1, 2
    let t = COOLDOWN_MS + 100;
    expect(pushH(s, MAX_DELTA, t)).toEqual({ type: 'step', index: 1, step: 1, dir: 1 });
    t += PAST_GUARD_MS;
    expect(pushH(s, MAX_DELTA, t)).toEqual({ type: 'step', index: 1, step: 2, dir: 1 });
    t += PAST_GUARD_MS;
    // Already on the last step: horizontal input must not fall through to a
    // gate check or a cross-beat move the way vertical input does.
    expect(pushH(s, MAX_DELTA, t)).toEqual({ type: 'none' });
    expect(s.index).toBe(1);
    expect(s.step).toBe(2);
  });

  it('ignores input while a transition is playing', () => {
    const s = createDirector();
    push(s, MAX_DELTA); // beat 'a' has no steps, so this commits a move
    expect(s.phase).toBe('moving');
    expect(pushH(s, MAX_DELTA, 1000)).toEqual({ type: 'none' });
  });

  it('shares the step guard with vertical input', () => {
    const s = createDirector();
    arrive(s, 1, 1, 0, beats);
    const t = COOLDOWN_MS + 100;
    expect(push(s, MAX_DELTA, t)).toEqual({ type: 'step', index: 1, step: 1, dir: 1 });
    // Horizontal input right after a vertical step, still inside the shared
    // guard, must be swallowed the same as more vertical input would be.
    expect(pushH(s, MAX_DELTA, t + 50)).toEqual({ type: 'none' });
    expect(s.step).toBe(1);
  });

  it('keeps vertical and horizontal accumulators independent', () => {
    const s = createDirector();
    arrive(s, 1, 1, 0, beats);
    const t = COOLDOWN_MS + 100;
    const half = Math.floor(THRESHOLD / 2);
    // Sub-threshold vertical intent...
    expect(feedInput(s, half, t, beats)).toEqual({ type: 'none' });
    expect(s.intent).toBe(half);
    // ...plus enough horizontal intent to cross the threshold commits only
    // the horizontal step, leaving the vertical accumulator untouched.
    expect(pushH(s, MAX_DELTA, t + 10)).toEqual({ type: 'step', index: 1, step: 1, dir: 1 });
    expect(s.intent).toBe(half);
  });

  it('does not let a single sustained horizontal swipe commit twice, however long it lasts (regression)', () => {
    const s = createDirector();
    arrive(s, 1, 1, 0, beats);
    let t = COOLDOWN_MS + 100;

    expect(feedHorizontalInput(s, MAX_DELTA, t, beats)).toEqual({ type: 'step', index: 1, step: 1, dir: 1 });

    // Sustained drag: events every 30ms, well under IDLE_RESET_MS apart, for
    // 900ms total — comfortably past the old flat 650ms window. None commit.
    const end = t + 900;
    for (t += 30; t <= end; t += 30) {
      expect(feedHorizontalInput(s, MAX_DELTA, t, beats)).toEqual({ type: 'none' });
    }
    expect(s.step).toBe(1);

    // A genuine pause ends the gesture, so a continued swipe afterward is
    // read as a new, independent step.
    t += PAST_GUARD_MS;
    expect(feedHorizontalInput(s, MAX_DELTA, t, beats)).toEqual({ type: 'step', index: 1, step: 2, dir: 1 });
  });
});

describe('gated beats', () => {
  it('nudges instead of advancing', () => {
    const s = createDirector();
    arrive(s, 2, 1, 0, beats);
    expect(push(s, MAX_DELTA, COOLDOWN_MS + 100)).toEqual({ type: 'nudge', index: 2 });
    expect(s.phase).toBe('idle');
  });

  it('relents rather than trapping anyone', () => {
    const s = createDirector();
    arrive(s, 2, 1, 0, beats);
    let t = COOLDOWN_MS + 100;
    for (let i = 1; i < NUDGE_LIMIT; i++) {
      expect(push(s, MAX_DELTA, t).type).toBe('nudge');
      t += COOLDOWN_MS + 500;
    }
    expect(push(s, MAX_DELTA, t)).toEqual({ type: 'move', from: 2, to: 3, dir: 1 });
  });

  it('advances immediately when the call to action is pressed', () => {
    const s = createDirector();
    arrive(s, 2, 1, 0, beats);
    expect(release(s, 100, beats)).toEqual({ type: 'move', from: 2, to: 3, dir: 1 });
  });

  it('still lets the viewer scroll backwards out of a gate', () => {
    const s = createDirector();
    arrive(s, 2, 1, 0, beats);
    expect(push(s, -MAX_DELTA, COOLDOWN_MS + 100)).toEqual({ type: 'move', from: 2, to: 1, dir: -1 });
  });
});

describe('ends of the film', () => {
  it('loops from the last beat to the first', () => {
    expect(nextIndex(3, 1, 4)).toBe(0);
  });

  it('stops at the top rather than wrapping backwards', () => {
    expect(nextIndex(0, -1, 4)).toBe(0);
    const s = createDirector();
    expect(push(s, -MAX_DELTA)).toEqual({ type: 'none' });
  });
});
