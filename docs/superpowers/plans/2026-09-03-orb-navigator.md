# Orb Navigator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Turn the orb into a scroll-keyed navigator that flies a authored path across the whole film, leading the camera and never landing on a surface that will hold an app mockup.

**Architecture:** The flight path becomes a keyframe data file anchored to clip time rather than raw scroll progress, resolved at runtime through the film's measured durations. Pure resolver/interpolator functions turn eased scroll progress into a pose; `OrbStage` becomes a dumb renderer that draws that pose plus a multiply-blended shadow pad and a pooled-div trail.

**Tech Stack:** Next.js 16 (App Router), React 19, GSAP, Lenis, TypeScript, Vitest (new).

**Spec:** `docs/superpowers/specs/2026-09-03-orb-navigator-design.md`

## Global Constraints

- The orb is always present — it never fully leaves the screen between hero and finale.
- The orb leads: it starts toward the next destination before the camera does.
- The orb never enters an exclusion rectangle (app mockup surfaces). Enforced by a dev-only check, not by convention.
- The orb cannot be occluded (`mix-blend-mode: screen` over video, no matte). Depth is scale + blur + brightness only.
- Trail glow uses `box-shadow`, never `filter: blur()` — stacked blur filters over 4K video playback is the known perf risk.
- Hero pose (K0) and finale pose (K16) resolve to the **same measured value** from `#hero-o-anchor`, or the infinite loop becomes visible.
- Existing behaviour that must not regress: the cinematic intro hand-off, the loop teleport at progress 0.998, and the loader's `orbReady` gate.

---

### Task 1: Vitest setup and the shared film clock

Pulls the inertia easing out of `ScrollFilm`/`MasterScrollFilm` into one module so the orb and the footage cannot disagree during fast scrubbing. Fixes the loop-teleport snap guard in one place.

**Files:**
- Create: `vitest.config.ts`
- Create: `src/utils/filmClock.ts`
- Create: `src/utils/filmClock.test.ts`
- Modify: `package.json` (devDeps + `test` script)
- Modify: `src/components/ScrollFilm.tsx` (replace local easing)
- Modify: `src/components/MasterScrollFilm.tsx` (replace local easing)

**Interfaces:**
- Consumes: nothing.
- Produces: `advanceClock(state: ClockState, target: number, dtSeconds: number): number` and `createClock(initial: number): ClockState`, where `ClockState = { eased: number }`. Exports `CATCH_UP = 0.1` and `SNAP_THRESHOLD = 0.25`.

- [x] **Step 1: Install Vitest**

```bash
npm install -D vitest
```

- [x] **Step 2: Add config and script**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
```

Add to `package.json` scripts: `"test": "vitest run"`.

- [x] **Step 3: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { createClock, advanceClock } from './filmClock';

describe('filmClock', () => {
  it('eases toward the target rather than jumping', () => {
    const c = createClock(0);
    const v = advanceClock(c, 1, 1 / 60);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(1);
  });

  it('snaps instantly across a loop teleport', () => {
    const c = createClock(0.99);
    expect(advanceClock(c, 0, 1 / 60)).toBe(0);
  });

  it('converges on the target when held', () => {
    const c = createClock(0);
    for (let i = 0; i < 600; i++) advanceClock(c, 0.5, 1 / 60);
    expect(c.eased).toBeCloseTo(0.5, 4);
  });
});
```

- [x] **Step 4: Run and verify it fails**

Run: `npm test`. Expected: FAIL — cannot resolve `./filmClock`.

- [x] **Step 5: Implement**

```ts
export const CATCH_UP = 0.1;
export const SNAP_THRESHOLD = 0.25;

export type ClockState = { eased: number };

export function createClock(initial: number): ClockState {
  return { eased: initial };
}

export function advanceClock(state: ClockState, target: number, dtSeconds: number): number {
  const dt = Math.min(Math.max(dtSeconds, 0), 0.1);
  if (Math.abs(target - state.eased) > SNAP_THRESHOLD) {
    state.eased = target;
  } else {
    state.eased += (target - state.eased) * (1 - Math.exp(-dt / CATCH_UP));
  }
  return state.eased;
}
```

- [x] **Step 6: Run and verify it passes**

Run: `npm test`. Expected: PASS.

- [x] **Step 7: Adopt it in both film components**

In `ScrollFilm.tsx`, delete the local `CATCH_UP`/`SEEK_EPSILON` easing block and the inline snap guard; replace with `createClock` + `advanceClock`. Keep `SEEK_EPSILON` (it is seek logic, not clock logic). Do the same in `MasterScrollFilm.tsx`.

- [x] **Step 8: Verify no visual regression, then commit**

Run `npm run dev`, scroll the film top to bottom including the loop. Expected: identical scrub behaviour.

```bash
git add -A && git commit -m "refactor: extract shared film clock, add vitest"
```

---

### Task 2: The film timing table

`ScrollFilm` already computes clip durations and their slice of the scroll internally. This exposes that as a ref so orb keyframes can resolve clip-time anchors.

**Files:**
- Create: `src/orb/types.ts`
- Modify: `src/components/ScrollFilm.tsx`
- Modify: `src/app/page.tsx` (create and pass the ref)

**Interfaces:**
- Produces: `FilmTiming = { clips: ClipTiming[]; totalUnits: number; startProgress: number; endProgress: number }` where `ClipTiming = { key: string; trimIn: number; trimOut: number; duration: number; holdWeight: number; offsetUnits: number }`. `offsetUnits` is the clip's start position in the film's internal unit timeline.

- [x] **Step 1: Define the types** in `src/orb/types.ts` exactly as in Interfaces above.

- [x] **Step 2: Publish timing from ScrollFilm**

Add an optional `timingRef?: React.RefObject<FilmTiming | null>` prop. Inside `readDurations()`, after durations are known, write the table — including `offsetUnits` accumulated as `duration + holdWeight` per clip — and `totalUnits`, `startProgress`, `endProgress`.

- [x] **Step 3: Wire it in page.tsx**

```tsx
const filmTiming = useRef<FilmTiming | null>(null);
// pass timingRef={filmTiming} to the intro ScrollFilm
```

- [x] **Step 4: Verify and commit**

Log the ref once in dev and confirm `scene1-3` reports `duration: 9`, `holdWeight: 8`, and `totalUnits ≈ 46.04`.

```bash
git add -A && git commit -m "feat: expose film clip timing for orb path resolution"
```

---

### Task 3: The path data

**Files:**
- Create: `src/orb/path.ts`

**Interfaces:**
- Produces: `ORB_PATH: Keyframe[]` and `EXCLUSION_ZONES: ExclusionZone[]`.
  `Keyframe = { anchor: { clip: string; t: number } | { progress: number }; x: number; y: number; scale: number; opacity: number; blur: number; pad: number; ease: EaseName; pulse?: boolean; hero?: true }`.
  `ExclusionZone = { window: { clip: string; from: number; to: number } | { from: number; to: number }; rect: { x0: number; y0: number; x1: number; y1: number }; label: string }`.
  `EaseName = 'linear' | 'inOut' | 'out' | 'in'`.

- [x] **Step 1: Transcribe every keyframe** from the spec's Act I–V tables, in order, with `hero: true` on K0 and K16 (their x/y/scale are overridden at runtime by the measured `#hero-o-anchor` pose).

- [x] **Step 2: Transcribe the five exclusion zones** from the spec's table.

- [x] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: author the orb flight path as data"
```

---

### Task 4: The resolver

**Files:**
- Create: `src/orb/flight.ts`
- Create: `src/orb/flight.test.ts`

**Interfaces:**
- Consumes: `FilmTiming` (Task 2), `Keyframe` (Task 3).
- Produces: `resolveAnchor(anchor: Anchor, timing: FilmTiming | null): number | null` — global scroll progress, or `null` when the clip is unknown or `t` falls outside its trimmed range. `resolvePath(path: Keyframe[], timing: FilmTiming | null): ResolvedKeyframe[]` — sorted by progress, dropping unresolvable entries. `ResolvedKeyframe = Keyframe & { progress: number }`.

- [x] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { resolveAnchor } from './flight';
import type { FilmTiming } from './types';

const timing: FilmTiming = {
  startProgress: 0, endProgress: 0.5, totalUnits: 46.0417,
  clips: [
    { key: 'scene1-3', trimIn: 2, trimOut: 11, duration: 9, holdWeight: 8, offsetUnits: 0 },
    { key: 'transit-b', trimIn: 2, trimOut: 17, duration: 15, holdWeight: 0, offsetUnits: 17 },
  ],
};

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

  it('passes raw progress anchors through', () => {
    expect(resolveAnchor({ progress: 0.52 }, timing)).toBe(0.52);
  });

  it('rejects a time outside the clip trim range', () => {
    expect(resolveAnchor({ clip: 'scene1-3', t: 20 }, timing)).toBeNull();
  });

  it('returns null before timing is known', () => {
    expect(resolveAnchor({ clip: 'scene1-3', t: 5 }, null)).toBeNull();
  });

  it('follows a retrimmed clip', () => {
    const retrimmed = { ...timing, totalUnits: 41.0417,
      clips: [{ ...timing.clips[0], trimOut: 6, duration: 4 }, { ...timing.clips[1], offsetUnits: 12 }] };
    expect(resolveAnchor({ clip: 'scene1-3', t: 6 }, retrimmed))
      .toBeCloseTo((4 / 41.0417) * 0.5, 4);
  });
});
```

- [x] **Step 2: Run and verify failure.** Run: `npm test`. Expected: FAIL — `resolveAnchor` is not exported.

- [x] **Step 3: Implement `resolveAnchor` and `resolvePath`.** For a clip anchor: find the clip, reject if `t < trimIn || t > trimOut`, then `units = offsetUnits + (t - trimIn)` and `progress = startProgress + (units / totalUnits) * (endProgress - startProgress)`.

- [x] **Step 4: Run and verify pass.** Run: `npm test`.

- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: resolve clip-time orb anchors to scroll progress"
```

---

### Task 5: The interpolator

**Files:**
- Modify: `src/orb/flight.ts`
- Modify: `src/orb/flight.test.ts`

**Interfaces:**
- Produces: `poseAt(resolved: ResolvedKeyframe[], progress: number): Pose` where `Pose = { x: number; y: number; scale: number; opacity: number; blur: number; pad: number }`.

- [x] **Step 1: Write the failing tests**

```ts
import { poseAt } from './flight';

const kfs = [
  { progress: 0, x: 0, y: 0, scale: 1, opacity: 1, blur: 0, pad: 0, ease: 'linear' as const, anchor: { progress: 0 } },
  { progress: 1, x: 100, y: 50, scale: 2, opacity: 0.5, blur: 4, pad: 1, ease: 'linear' as const, anchor: { progress: 1 } },
];

describe('poseAt', () => {
  it('returns the exact authored pose at a keyframe', () => {
    expect(poseAt(kfs, 0)).toMatchObject({ x: 0, scale: 1 });
    expect(poseAt(kfs, 1)).toMatchObject({ x: 100, scale: 2 });
  });

  it('interpolates between keyframes', () => {
    const p = poseAt(kfs, 0.5);
    expect(p.x).toBeCloseTo(50, 5);
    expect(p.pad).toBeCloseTo(0.5, 5);
  });

  it('clamps rather than extrapolating outside the path', () => {
    expect(poseAt(kfs, -1).x).toBe(0);
    expect(poseAt(kfs, 2).x).toBe(100);
  });
});
```

- [x] **Step 2: Run and verify failure.**

- [x] **Step 3: Implement.** Binary-search or linear-scan for the bracketing pair, normalise, apply the segment's `ease`, lerp every numeric field.

- [x] **Step 4: Run and verify pass.**

- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: interpolate orb pose between keyframes"
```

---

### Task 6: The exclusion check

**Files:**
- Modify: `src/orb/flight.ts`
- Modify: `src/orb/flight.test.ts`

**Interfaces:**
- Produces: `findExclusionViolations(resolved: ResolvedKeyframe[], zones: ExclusionZone[], timing: FilmTiming | null): Violation[]` where `Violation = { keyframeIndex: number; zoneLabel: string }`.

- [x] **Step 1: Write the failing tests** — a keyframe inside a zone during that zone's window is a violation; the same keyframe outside the window is not; a keyframe clear of the rect is not.

- [x] **Step 2: Run and verify failure.**

- [x] **Step 3: Implement.** Resolve each zone's window to a progress range, then test every keyframe whose progress falls inside it against the rect.

- [x] **Step 4: Run and verify pass.**

- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: enforce orb exclusion zones"
```

---

### Task 7: OrbStage as a renderer

The behavioural core. `OrbStage` stops deciding and starts drawing.

**Files:**
- Modify: `src/components/OrbStage.tsx`
- Modify: `src/components/OrbStage.module.css`

**Interfaces:**
- Consumes: `poseAt`, `resolvePath`, `findExclusionViolations`, `advanceClock`, `FilmTiming`.
- Produces: no new exports; accepts a new `timingRef` prop.

- [x] **Step 1: Replace the scroll loop.** Delete the `DRIFT_START`/`DRIFT_END` arithmetic. Each frame: advance the shared clock from `scrollData.current.progress`, call `poseAt`, write `transform`/`opacity`/`filter` on the holder.

- [x] **Step 2: Inject the measured hero pose.** After the intro GSAP move lands, overwrite every `hero: true` keyframe's `x`/`y`/`scale` with the measured `#hero-o-anchor` pose, then re-resolve. Re-measure on `resize`.

- [x] **Step 3: Add the shadow pad.** A sibling div beneath the holder, `mix-blend-mode: multiply`, radial dark gradient, opacity `pose.pad`, following the same transform.

- [x] **Step 4: Add the trail.** Ring buffer of the last 8 poses; 8 pooled divs, `screen`-blended, opacity and scale falling off by age, shown only above a velocity threshold. `box-shadow` for glow — no `filter: blur()`.

- [x] **Step 5: Run the exclusion check in dev.** `if (process.env.NODE_ENV !== 'production')` — `console.error` each violation once when the path resolves.

- [x] **Step 6: Verify in the browser.** Scroll the whole film. The orb dives into the tower, slides the table, parks on the credenza, exits with the camera, reaches the broker, blooms through the whiteout, holds the multilingual chapter, returns home. Confirm the loop shows no jump.

- [x] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: fly the orb along the authored navigator path"
```

---

### Task 8: Pulses, the filament, and reduced motion

**Files:**
- Modify: `src/components/OrbStage.tsx`
- Modify: `src/components/CityDroneBackground.tsx` (expose city-change events)

- [x] **Step 1: Pulse on hand-off.** When progress crosses a `pulse: true` keyframe, flare the orb's glow briefly. Fires in both scroll directions, once per crossing.

- [x] **Step 2: City-change pulse + filament.** `CityDroneBackground` fires a callback on crossfade. On it, the orb pulses and a thin light line draws from the orb toward the phone mockup and fades.

- [x] **Step 3: Reduced motion.** Under `prefers-reduced-motion`, disable the trail, the anticipation, and the pulses; the orb cross-fades between keyframe poses instead of flying.

- [x] **Step 4: Verify and commit**

```bash
git add -A && git commit -m "feat: orb hand-off pulses, city filament, reduced motion"
```

---

### Task 9: Calibration pass

The spec states the pose numbers are a first draft placed against extracted frames, and expects one tuning pass by eye.

- [ ] **Step 1: Scroll each act slowly** and compare against the storyboard.
- [ ] **Step 2: Adjust `x`/`y`/`scale`/`blur`/`pad` in `path.ts` only.** No motion logic changes — if tuning requires a code change, the design is wrong; stop and say so.
- [x] **Step 3: Re-run `npm test`** to confirm no exclusion violations.
- [ ] **Step 4: Commit** `git commit -m "polish: calibrate orb flight path"`.

---

## Self-Review

**Spec coverage:** Keyframe data → Task 3. Clip-time anchoring → Tasks 2, 4. Shared clock → Task 1. Interpolator and velocity → Tasks 5, 7. Shadow pad → Task 7. Trail → Task 7. Exclusion zones → Tasks 3, 6, 7. Continuity seams → Task 7 Step 2. Pulses and filament → Task 8. Reduced motion → Task 8. Mobile overrides → deferred; the spec says add them only where a beat actually breaks, so they are part of Task 9 calibration rather than a task of their own. Testing → Tasks 1, 4, 5, 6.

**Placeholders:** none.

**Type consistency:** `FilmTiming`/`ClipTiming` defined in Task 2 and consumed unchanged in 4, 6, 7. `Keyframe`/`ExclusionZone` defined in Task 3, consumed in 4, 5, 6. `ResolvedKeyframe` produced in Task 4, consumed in 5, 6. `Pose` produced in Task 5, consumed in 7.
