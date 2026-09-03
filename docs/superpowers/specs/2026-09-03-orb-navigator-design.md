# The Orb as Navigator — Design

Date: 2026-09-03
Status: approved, ready for implementation planning

## Problem

The orb is the site's signature object, but it only participates in two moments:
it lands on the hero "O", then drifts to the left edge between scroll 0.80 and
0.96. Everywhere else it holds a fixed position while the film moves behind it.
During the dive into the tower and the boardroom presentation — the most
dramatic camera moves on the site — it sits stranded on the left, doing nothing.

It should read as a guide: the thing that leads the visitor through the film.

## Intent

The orb is a navigator. It is always on screen, it always reaches the next
destination before the camera does, and it is never the content — it is the
cause. It arrives beside a surface and that surface wakes up.

Three rules, decided with the stakeholder and binding on every beat:

1. **Always present.** The orb never fully leaves the screen from hero to
   finale. It may shrink, dim, or move aside; it never exits.
2. **Leads, never rides.** It begins moving toward the next destination before
   the camera does. If it merely arrives with the cut, it is decoration.
3. **Never on a screen.** The boardroom presentation screen and every phone
   screen in the film will hold real app mockups. The orb's path must never
   enter those rectangles.

Rule 3 produced the strongest idea in the design: since the orb cannot *be* the
thing on the glass, it becomes the thing that *lights* the glass. It reaches the
credenza and the deck begins. It reaches the broker's hand and his app wakes.

## Constraints

**The orb cannot be occluded.** It is a Spline scene in an iframe composited
with `mix-blend-mode: screen`. There is no matte for the boardroom table or the
window frames, so the orb can never pass behind scene geometry. Depth is faked
with scale, blur and brightness: it recedes by getting small, soft and dim along
the shot's vanishing line. This makes alignment to the camera move matter more
than usual.

**The orb is invisible on white.** `screen` blending is what drops the Spline
scene's black background over dark footage — but screen over white is white. On
the transit-c whiteout, the beach plate and the transit-d clouds, the orb does
not dim, it vanishes. This was latent before because the orb never travelled;
the new path crosses several bright plates, so "always present" cannot survive
without a fix. Resolved by the shadow pad (below).

**Clip durations are runtime values.** `ScrollFilm` reads durations from video
metadata and derives each clip's slice of the scroll from them. Hardcoding a
keyframe at `progress: 0.033` silently desynchronises the orb from the footage
the moment a clip is retrimmed or a `holdWeight` changes.

**The site loops.** At scroll 0.998 `page.tsx` teleports back to zero. The orb
must not animate across that teleport, and its finale pose must equal its hero
pose exactly or the loop becomes visible.

## Architecture

### The path is data

`src/orb/path.ts` holds the whole flight as an ordered keyframe list, readable
top to bottom like a shot list. No motion logic lives in a component.

A keyframe is anchored one of two ways:

- `{ clip: 'scene1-3', t: 5.0 }` — a moment in a specific clip, in seconds of
  source time. Used for every beat over the film.
- `{ progress: 0.52 }` — raw global scroll progress. Used only for the
  multilingual and finale chapters, which have no scrubbed clip to key against.

Clip-time anchoring is what keeps the choreography attached to the edit: retrim
`scene1-3` and the orb follows, because the anchors resolve through the same
duration data the film itself uses.

Each keyframe carries a pose and an easing:

| Field | Meaning |
|---|---|
| `x`, `y` | Position, in viewport percent |
| `scale` | Holder scale; hero pose is `1.2` |
| `opacity` | Orb opacity |
| `blur` | Depth softening, px |
| `pad` | Shadow-pad strength, 0–1 (see below) |
| `ease` | Easing curve into this keyframe |
| `pulse` | Optional. Marks a hand-off beat where the orb flares and a mockup wakes |

### One shared clock

`src/utils/filmClock.ts` owns the inertia easing that converts raw scroll
progress into the eased value the film scrubs to, including the snap guard that
prevents a reverse-scrub glitch across the loop teleport.

`ScrollFilm` and `MasterScrollFilm` each carry their own copy of this easing
today. `OrbStage` adding a third would let the orb and the footage disagree
during fast scrubbing — fatal when the orb is meant to be pinned to a point on a
table. All three consume the one module instead. The loop-teleport snap guard is
fixed in one place rather than three as a side effect.

### Resolver and interpolator

`src/orb/flight.ts`, pure functions with no DOM access:

- **Resolver** — converts clip-time anchors into global scroll progress using
  the film's duration table. Runs once durations are known and re-runs on
  `loadedmetadata`, since early metadata can be revised.
- **Interpolator** — takes eased global progress, finds the bracketing
  keyframes, applies the segment's easing, returns a pose.
- **Velocity** — derived from the frame-to-frame pose delta. Drives trail length
  and opacity and the anticipation wind-up. Not authored by hand; a fast segment
  automatically grows a longer trail.

### OrbStage becomes a renderer

`OrbStage` stops deciding anything. Each frame it reads a pose and draws it:

- **The orb holder** — transform, opacity, blur, as today.
- **The shadow pad** — a soft dark radial disc beneath the orb, `mix-blend-mode:
  multiply`, its opacity driven by the keyframe's `pad`. It darkens the plate
  locally just enough for the screen-blended orb to read against white. On dark
  footage `pad` is 0 and the layer is invisible. This is what makes the orb
  survive the whiteout, the beach and the clouds, and it also solves the orb
  sitting beside a bright app mockup.
- **The trail** — roughly 8 pooled divs replaying recent positions, faded by
  age, `screen`-blended to match the orb. Glow comes from `box-shadow`, not
  `filter: blur()`: stacked blur filters composited over 4K video playback are
  the one real performance risk in this design.

### Exclusion zones

The mockup rectangles live in `path.ts` beside the keyframes, each scoped to the
clip-time window in which that surface is on screen. A dev-only check runs the
resolved path against them and fails loudly when a keyframe lands inside one,
with an optional overlay that draws the rectangles over the film.

This exists so the "never on a screen" rule has teeth. Without it the constraint
lives only in this document, and the next person tuning a beat by eye will
quietly put the orb back on a slide.

### Continuity seams

The hero pose is measured from `#hero-o-anchor` at runtime, exactly as the
existing GSAP intro already does, and injected as the first keyframe's resolved
value — so the hand-off from the intro animation to the scroll path has no jump.
The finale's final keyframe resolves to that *same measured value*, which is
what makes the loop back to the top invisible. One shared value, not two numbers
kept in sync by hand.

## The flight path

Global progress boundaries, derived from measured clip durations
(scene1-3 9s playable + 8 hold, transit-b 15s, transit-c 8s, transit-d 6.04s,
totalling 46.04 units across scroll 0 → 0.5):

| Segment | Global progress |
|---|---|
| scene1-3 (play) | 0.000 → 0.098 |
| scene1-3 (presentation hold) | 0.098 → 0.185 |
| transit-b | 0.185 → 0.348 |
| transit-c | 0.348 → 0.434 |
| transit-d | 0.434 → 0.500 |
| multilingual chapter | 0.500 → 0.950 |
| finale (last-scene) | 0.950 → 1.000 |

These are informational. The path anchors to clip time and re-derives them.

### Act I — the dive (0.000 → 0.185)

| # | Anchor | Pose | Beat |
|---|---|---|---|
| K0 | `scene1-3` t=2.0 | measured hero pose, scale 1.2 | The hero "O". Text staggers away, the orb stays. |
| K1 | `scene1-3` t=5.0 | 40%, 48% | Already at the lit boardroom window while the camera is still outside the glass. The one anticipation beat: a small wind-up before the plunge. |
| K2 | `scene1-3` t=6.6 | 55%, 80% | Through the glass, low, touching down on the near end of the table. |
| K3 | `scene1-3` t=8.5 | 58%, 74% | Sliding up the table's centreline, shrinking along its vanishing line. |
| K4 | `scene1-3` t=11.0 | 50%, 78% | Rests on the credenza, below the screen and below the slide controls. Holds through the entire deck with a slow breathing pulse on scale. |

### Act II — out to the broker (0.185 → 0.348)

| # | Anchor | Pose | Beat |
|---|---|---|---|
| K5 | `transit-b` t=4.0 | 47%, 58% | Camera pulls wide; the orb stays pinned under the now-small screen and lifts off first. |
| K6 | `transit-b` t=6.0 | 66%, 41% | Out through the facade ahead of the camera, growing as it comes toward us. Longest trail in the film. |
| K7 | `transit-b` t=9.0 | 58%, 44% | On the terrace, arcing down toward the small figure — picking the broker out before the visitor notices him. |
| K8 | `transit-b` t=13.0 | 57%, 62% | Hovering above his hands. Slows to almost nothing; the trail dies out. |
| K9 | `transit-b` t=16.8 | 23%, 33%, `pulse` | As the phone fills frame the orb slides clear of the glass and flares once. That flare is the cue the app mockup lights. |

### Act III — through the phone (0.348 → 0.500)

| # | Anchor | Pose | Beat |
|---|---|---|---|
| K10 | `transit-c` t=4.0 | 50%, 50%, scale 1.4, `pad` 0.85 | Full whiteout. The orb is the only object on screen, bloomed wide, carried by the shadow pad. |
| K11 | `transit-c` t=6.5 | 73%, 24%, `pulse` | Re-condenses over the sea, clear of the buyer's phone, and flares the same way. The repeated gesture is what sells "one source of truth". |
| K12 | `transit-d` t=5.9 | 50%, 48%, `pad` 0.5 | Expands into the cloud whiteout, seeding the white flash into the next chapter. |

**Assumption at K10.** The transit-c whiteout is the broker's phone screen blown
up to fill the frame. This design treats those frames as a transition rather
than a mockup surface — no app UI will be composited into them — which is what
permits the orb to hold centre frame there. If a mockup is planned for the
whiteout, K10 moves to the frame edge instead and the orb yields the centre; no
other beat is affected.

### Act IV — the multilingual chapter (0.500 → 0.950)

There is no camera move here to lead: drone shots of six cities cycle behind a
phone mockup pinned to the left of the screen. "Leading" has to mean something
else, and this is 45% of the site's scroll, so the orb cannot sit it out.

| # | Anchor | Pose | Beat |
|---|---|---|---|
| K13 | `progress` 0.52 | 72%, 40%, `pad` 0.35 | Arrives right-of-centre, opposite the phone mockup. |
| K14 | `progress` 0.93 | holds | On every city change it pulses, and a thin filament of light runs from the orb across to the phone. One source, many cities, one app. |

The pulse is driven by the city crossfade in `CityDroneBackground`, not by a
scroll position, so it stays in step with the cities however long the visitor
lingers.

### Act V — home (0.950 → 1.000)

| # | Anchor | Pose | Beat |
|---|---|---|---|
| K15 | `progress` 0.96 | 30%, 60% | Rises from the tower over the dawn skyline. |
| K16 | `progress` 1.00 | measured hero pose | Comes to rest on the exact coordinates of K0. The orb is the stitch that hides the loop. |

### Exclusion zones

Measured off the frames; the boardroom rectangle matches the real overlay
geometry in `BoardroomPresentation.tsx` (top 13%, left 28.4%, width 44.5%,
height 48.6%) plus its slide controls and a small margin.

| Surface | Window | Rectangle (viewport %) |
|---|---|---|
| Boardroom presentation screen + controls | `scene1-3` t ≥ 6.2, and the hold | x 26–75, y 10–64 |
| Boardroom screen, wide shot | `transit-b` t 2–5 | x 40–53, y 35–51 |
| Broker's phone | `transit-b` t ≥ 15 | x 41–63, y 7–90 |
| Buyer's phone, beach | `transit-c` t 5.5–8 | x 40–60, y 15–90 |
| Phone mockup, multilingual | progress 0.50–0.95 | x 4–26, y 18–82 |

## Calibration record

The Act I positions above are the calibrated values, not the original
storyboard ones. Two corrections were made during implementation:

- K1–K3 were re-placed. The storyboard frames had been extracted with
  `ffmpeg -ss` before `-i`, which snaps to the nearest keyframe rather than
  seeking accurately, so those three beats had been positioned against frames
  up to a second away from the ones they resolve to. Re-extracted accurately,
  K1 now sits on the lit boardroom window rather than beside it.
- K3 was moved from y 62% to y 74%. At 62% it fell inside the boardroom
  exclusion rectangle — the dev-time check caught it before it ever rendered.

Verified in a headless browser: the film parks within 0.02s of every authored
frame, all seventeen keyframes resolve, and K0 and K16 land on identical
coordinates.

## Pose values are a first draft

Every coordinate above was placed against a real extracted frame, but scale,
blur and pad values are starting points, not final numbers. The path is expected
to need one calibration pass by eye in the browser. That is why the path is a
data file: tuning must not mean editing motion logic.

The dev tuner discussed during design — drag the orb, capture a keyframe — stays
unbuilt. This design is what makes it cheap to add later: it would write to
`path.ts` and change nothing else.

## Accessibility and viewport

- `prefers-reduced-motion`: the orb takes a simplified path — no trail, no
  anticipation, and it moves between destinations with plain fades rather than
  flights.
- Mobile: keyframes may carry an optional pose override. Where absent, the
  desktop pose applies. Overrides are added only where a beat actually breaks on
  a narrow viewport, not pre-emptively for every keyframe.

## Testing

Vitest, added for this work, covering only the pure modules:

- **Resolver** — clip-time anchors resolve to the correct global progress; a
  changed clip duration moves the resolved anchors with it; anchors outside a
  clip's trimmed range are rejected.
- **Interpolator** — a pose sampled between two keyframes lies between them;
  keyframe boundaries return their exact authored pose; progress outside the
  path clamps rather than extrapolating.
- **Exclusion check** — a keyframe inside a zone is rejected; a keyframe outside
  it passes; zones apply only within their own clip-time window.

No component or rendering tests. Whether the flight *looks* right is verified in
the browser, by eye.

## Out of scope

- The visual keyframe tuner.
- Any change to the film itself, the slide deck content, or the app mockups.
- Replacing the Spline orb with a native 3D object.
- Reworking chapter transitions, the white flash, or the loop mechanism beyond
  moving the shared easing into `filmClock`.
