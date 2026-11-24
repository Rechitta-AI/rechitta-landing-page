import { describe, it, expect } from 'vitest';
import {
  armDockGate,
  dockHoldFor,
  releaseDockGate,
  stepDockGate,
  BROKER_SETTLE_MS,
  GATE_ABANDON,
  ABANDON_MS,
} from './dockGate';
import { resolvePath, poseAt } from './flight';
import { BROKER_HOLD_LEAD, ORB_PATH } from './path';
import { buildTiming, progressForClipTime } from '@/film/timing';
import { BEATS, getBeatProgress } from '@/film/score';
import type { DockGate } from './dockGate';
import type { Keyframe, ResolvedKeyframe } from './types';

const kf = (over: Partial<Keyframe>): Keyframe => ({
  anchor: { progress: 0 },
  x: 0, y: 0, scale: 1, opacity: 1, blur: 0,
  ease: 'linear',
  note: 'test',
  ...over,
});

/** The beat's park. Mirrors the real broker: 0.08 short of its own dock. */
const PARK = 0.42;

/** dock at 0.5, next beat at 0.6, so a 0.5 lead holds at 0.55. */
const fixture: ResolvedKeyframe[] = resolvePath(
  [
    kf({ anchor: { progress: 0.4 } }),
    kf({ anchor: { progress: 0.5 }, brokerDock: true }),
    kf({ anchor: { progress: 0.6 } }),
  ],
  null,
);

describe('dockHoldFor', () => {
  it('holds a fraction of the way toward the beat after the dock', () => {
    expect(dockHoldFor(fixture, 0.5)).toEqual({ dock: 0.5, hold: 0.55 });
  });

  it('takes the last dock beat when the path authors more than one', () => {
    const two = resolvePath(
      [
        kf({ anchor: { progress: 0.3 }, brokerDock: true }),
        kf({ anchor: { progress: 0.5 }, brokerDock: true }),
        kf({ anchor: { progress: 0.6 }, brokerDock: undefined }),
      ],
      null,
    );
    expect(dockHoldFor(two, 0.5)?.dock).toBe(0.5);
  });

  it('refuses a path with no dock beat', () => {
    expect(dockHoldFor(resolvePath([kf({ anchor: { progress: 0.5 } })], null), 0.5)).toBeNull();
  });

  it('refuses a dock beat with nothing after it to hold short of', () => {
    const last = resolvePath([kf({ anchor: { progress: 0.5 }, brokerDock: true })], null);
    expect(dockHoldFor(last, 0.5)).toBeNull();
  });

  it('refuses an empty path, so an unresolved film simply has no gate', () => {
    expect(dockHoldFor([], 0.5)).toBeNull();
  });

  it('refuses a lead outside (0, 1), which would hold on or past a real beat', () => {
    expect(dockHoldFor(fixture, 0)).toBeNull();
    expect(dockHoldFor(fixture, 1)).toBeNull();
    expect(dockHoldFor(fixture, 1.4)).toBeNull();
  });
});

describe('the gate while it is waiting', () => {
  const gate = armDockGate(fixture, 1000, 5000, 0.5, PARK)!;

  it('arms with the hold, the dock and a deadline', () => {
    expect(gate).toEqual({
      hold: 0.55, dock: 0.5, park: PARK,
      expiresAt: 6000, releasedAt: null, abandonedAt: null,
    });
  });

  it('floors the orb at the hold', () => {
    expect(stepDockGate(gate, 0.42, 1200).floor).toBe(0.55);
  });

  it('stays armed frame after frame until something releases it', () => {
    expect(stepDockGate(gate, 0.42, 1200).gate).not.toBeNull();
    expect(stepDockGate(gate, 0.42, 5999).gate).not.toBeNull();
  });

  it('is inert while the orb is still above the hold, so it cannot bind forward', () => {
    // A floor only ever raises progress; the caller takes Math.max.
    const { floor } = stepDockGate(gate, 0.58, 1200);
    expect(Math.max(0.58, floor!)).toBe(0.58);
  });
});

describe('releasing the gate', () => {
  const gate = releaseDockGate(armDockGate(fixture, 1000, 5000, 0.5, PARK)!, 2000);

  it('eases from the hold down onto the dock', () => {
    expect(stepDockGate(gate, 0.42, 2000).floor).toBeCloseTo(0.55, 6);
    const mid = stepDockGate(gate, 0.42, 2000 + BROKER_SETTLE_MS / 2).floor!;
    expect(mid).toBeLessThan(0.55);
    expect(mid).toBeGreaterThan(0.5);
  });

  it('descends monotonically', () => {
    let previous = Infinity;
    for (let ms = 0; ms < BROKER_SETTLE_MS; ms += 20) {
      const floor = stepDockGate(gate, 0.42, 2000 + ms).floor!;
      expect(floor).toBeLessThanOrEqual(previous);
      previous = floor;
    }
  });

  it('drops once the settle has run, handing the orb back to the film', () => {
    const done = stepDockGate(gate, 0.42, 2000 + BROKER_SETTLE_MS);
    expect(done.floor).toBeNull();
    expect(done.gate).toBeNull();
  });

  it('ignores a second release rather than restarting the ramp', () => {
    expect(releaseDockGate(gate, 9000).releasedAt).toBe(2000);
  });
});

describe('the safety nets', () => {
  it('releases itself on expiry rather than stranding the orb off its dock', () => {
    const gate = armDockGate(fixture, 1000, 5000, 0.5, PARK)!;
    const expired = stepDockGate(gate, 0.42, 6000);
    expect(expired.gate?.releasedAt).toBe(6000);
    expect(expired.floor).toBeCloseTo(0.55, 6);
    // and then settles through the same ramp
    expect(stepDockGate(expired.gate!, 0.42, 6000 + BROKER_SETTLE_MS).gate).toBeNull();
  });

  it('drops when the film has jumped somewhere above the dock', () => {
    const gate = armDockGate(fixture, 1000, 5000, 0.5, PARK)!;
    // A jump to the finale. Below the park the gate leaves gracefully
    // instead — see 'leaving mid-hold' below.
    expect(stepDockGate(gate, 0.96, 1200)).toEqual({ floor: null, gate: null });
  });

  it('tolerates the gap the portrait park sits short of the dock', () => {
    // The broker parks at 0.42 against a dock at 0.500 — deliberately inside
    // the stretch K7 and K9 share a pose across (see score.ts). The gate must
    // not read that as the film having gone somewhere else.
    expect(GATE_ABANDON).toBeGreaterThan(0.08);
    expect(stepDockGate(armDockGate(fixture, 1000, 5000, 0.5, PARK)!, PARK, 1200).gate).not.toBeNull();
  });
});

describe('leaving mid-hold', () => {
  /*
   * The regression this suite exists for.
   *
   * A one-sided floor goes inert on its own when the viewer heads toward the
   * cities, because progress rises above it. Heading the other way — back
   * toward the boardroom — progress stays below the floor, so the orb used to
   * be pinned at centre frame for the whole first stretch of the retreat and
   * then jumped about 20vw in one frame when the gate finally went stale.
   */
  const armed = () => armDockGate(fixture, 1000, 5000, 0.5, PARK)!;

  it('holds while the film is still arriving at the park', () => {
    // The arrival tween converges on the park from above; that is not leaving.
    expect(stepDockGate(armed(), PARK + 0.05, 1200).floor).toBe(0.55);
    expect(stepDockGate(armed(), PARK, 1200).floor).toBe(0.55);
  });

  it('starts decaying the moment the film drops below the park', () => {
    const left = stepDockGate(armed(), PARK - 0.02, 1200);
    expect(left.gate?.abandonedAt).toBe(1200);
    expect(left.floor).toBeCloseTo(0.55, 6);
  });

  it('never pins the orb for the length of the retreat', () => {
    // 0.42 -> 0.12 over ~420ms, which is what dissolveTo does.
    let gate: DockGate | null = armed();
    let pinnedFrames = 0;
    for (let ms = 0; ms <= 600 && gate; ms += 16) {
      const eased = PARK - (PARK - 0.12) * Math.min(1, ms / 420);
      const step = stepDockGate(gate, eased, 1200 + ms);
      gate = step.gate;
      if (step.floor !== null && step.floor >= 0.5) pinnedFrames++;
    }
    expect(gate).toBeNull();                       // it let go
    expect(pinnedFrames).toBeLessThanOrEqual(6);   // ~100ms, not the whole retreat
  });

  it('hands over by crossing the film, not by jumping to it', () => {
    let gate: DockGate | null = armed();
    let lastFloor = Infinity;
    let lastEased = PARK;
    for (let ms = 0; ms <= 600 && gate; ms += 16) {
      const eased = PARK - (PARK - 0.12) * Math.min(1, ms / 420);
      const step = stepDockGate(gate, eased, 1200 + ms);
      if (step.floor !== null) {
        expect(step.floor).toBeLessThanOrEqual(lastFloor + 1e-9);  // monotonic
        lastFloor = step.floor;
        lastEased = eased;
      }
      gate = step.gate;
    }
    // The gap the orb closes in the hand-off frame, in progress. Small enough
    // that advanceClock absorbs it; the old code handed over a gap of ~0.15.
    expect(lastFloor - lastEased).toBeLessThan(0.05);
  });

  it('gives up decaying rather than running forever', () => {
    // A film that stops dead mid-retreat still releases the orb.
    let gate: DockGate | null = armed();
    for (let ms = 0; ms <= ABANDON_MS + 100 && gate; ms += 16) {
      gate = stepDockGate(gate, PARK - 0.02, 1200 + ms).gate;
    }
    expect(gate).toBeNull();
  });

  it('prefers the settle over the decay once the panel has reported in', () => {
    // Released first, then the viewer leaves: the ramp onto the dock wins, so
    // the pulse still fires on the dock rather than being skipped.
    const gate = releaseDockGate(armed(), 1200);
    const step = stepDockGate(gate, PARK - 0.02, 1300);
    expect(step.gate?.abandonedAt ?? null).toBeNull();
    expect(step.floor!).toBeLessThan(0.55);
    expect(step.floor!).toBeGreaterThanOrEqual(0.5);
  });
});

describe('the gate against the authored path', () => {
  const cut = buildTiming();

  it('can be armed from the real portrait path', () => {
    const resolved = resolvePath(ORB_PATH, cut, true);
    expect(dockHoldFor(resolved, BROKER_HOLD_LEAD)).not.toBeNull();
  });

  it('holds the orb clear of the dock it is waiting for', () => {
    const resolved = resolvePath(ORB_PATH, cut, true);
    const { hold, dock } = dockHoldFor(resolved, BROKER_HOLD_LEAD)!;
    const held = poseAt(resolved, hold);
    const docked = poseAt(resolved, dock);
    // Far enough that the wait reads as a wait, not as a nudge.
    expect(Math.hypot(held.x - docked.x, held.y - docked.y)).toBeGreaterThan(5);
  });

  it('lands the ramp exactly on the dock pose', () => {
    const resolved = resolvePath(ORB_PATH, cut, true);
    const { dock } = dockHoldFor(resolved, BROKER_HOLD_LEAD)!;
    const brokerDock = ORB_PATH.filter((k) => k.brokerDock);
    expect(brokerDock).toHaveLength(2);
    expect(poseAt(resolved, dock).y).toBe(brokerDock[1].portrait!.y);
  });

  it('parks portrait short of the dock, and the gate spans the gap', () => {
    /*
     * The broker parks at 0.42 on portrait against a dock that resolves to
     * 0.500, i.e. inside the stretch K7 and K9 share a pose across. That is
     * deliberate — it is what makes the forward hand-off hold on the dock and
     * leave late (score.ts) — so the gate has to cope with the gap rather than
     * the park being moved to close it.
     */
    const broker = BEATS.find((b) => b.id === 'broker')!;
    const onDock = progressForClipTime(cut, 'transit-b', 16.9)!;
    const resolved = resolvePath(ORB_PATH, cut, true);
    const { dock, hold } = dockHoldFor(resolved, BROKER_HOLD_LEAD)!;

    expect(dock).toBeCloseTo(onDock, 10);
    // Landscape parks on the dock; portrait short of it.
    expect(getBeatProgress(broker, false) ?? onDock).toBe(onDock);
    const portraitPark = getBeatProgress(broker, true)!;
    expect(portraitPark).toBeLessThan(dock);

    // The gap must not read as the film having gone elsewhere...
    expect(dock - portraitPark).toBeLessThan(GATE_ABANDON);
    // ...and the park must be low enough that the hold is a real wait above it.
    expect(hold).toBeGreaterThan(portraitPark);
    // The pose either side of the gap is identical, so dropping the floor onto
    // the dock while the film sits at the park cannot show a jump.
    const atPark = poseAt(resolved, portraitPark);
    const atDock = poseAt(resolved, dock);
    expect(atPark.x).toBeCloseTo(atDock.x, 6);
    expect(atPark.y).toBeCloseTo(atDock.y, 6);
  });

  it('waits near centre frame, not a nudge off the column', () => {
    const resolved = resolvePath(ORB_PATH, cut, true);
    const { hold } = dockHoldFor(resolved, BROKER_HOLD_LEAD)!;
    const held = poseAt(resolved, hold);
    expect(held.x).toBeGreaterThan(40);
    expect(held.x).toBeLessThan(60);
    expect(held.y).toBeGreaterThan(40);
    expect(held.y).toBeLessThan(60);
  });

  it('holds short of the dock, never past it', () => {
    const resolved = resolvePath(ORB_PATH, cut, true);
    const { hold, dock } = dockHoldFor(resolved, BROKER_HOLD_LEAD)!;
    expect(hold).toBeGreaterThan(dock);
  });
});
