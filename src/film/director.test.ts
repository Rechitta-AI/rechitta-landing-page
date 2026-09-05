import { describe, expect, it } from 'vitest';
import {
  COOLDOWN_MS,
  IDLE_RESET_MS,
  MAX_DELTA,
  NUDGE_LIMIT,
  THRESHOLD,
  arrive,
  createDirector,
  feedInput,
  nextIndex,
  release,
} from './director';
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
    feedInput(s, MAX_DELTA, 0, beats);
    feedInput(s, -MAX_DELTA, 10, beats);
    expect(s.intent).toBe(-MAX_DELTA);
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

  it('cuts to the end of the shot when scrolled forward again mid-transition', () => {
    const s = createDirector();
    push(s, MAX_DELTA);
    expect(s.phase).toBe('moving');
    expect(feedInput(s, MAX_DELTA, 1000, beats)).toEqual({ type: 'none' });
    expect(feedInput(s, MAX_DELTA, 1010, beats)).toEqual({ type: 'skip' });
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
    const out = feedInput(s, 100000, 0, beats);
    expect(out).toEqual({ type: 'none' });
    expect(s.intent).toBe(MAX_DELTA);
  });
});

describe('beat steps', () => {
  it('walks a beat’s own steps before moving the film', () => {
    const s = createDirector();
    arrive(s, 1, 1, 0, beats);
    const t = COOLDOWN_MS + 100;
    expect(push(s, MAX_DELTA, t)).toEqual({ type: 'step', index: 1, step: 1, dir: 1 });
    expect(push(s, MAX_DELTA, t + 500)).toEqual({ type: 'step', index: 1, step: 2, dir: 1 });
    expect(push(s, MAX_DELTA, t + 1000)).toEqual({ type: 'move', from: 1, to: 2, dir: 1 });
  });

  it('lands on the last step when arriving backwards', () => {
    const s = createDirector();
    arrive(s, 1, -1, 0, beats);
    expect(s.step).toBe(2);
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
