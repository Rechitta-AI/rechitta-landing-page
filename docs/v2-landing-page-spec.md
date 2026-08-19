# V2 landing page — spec

> Branch `v2-landing-page`, cut from `film-production` (the branch currently
> deployed to `landing-page-rechitta-full.vercel.app`). Two deliverables ship
> from this branch: a **polish pass on the existing film** (`/`) and a **second
> narrative concept** (`/homepage-2`). Aryaman picks one, or takes beats from
> both.
>
> Read alongside [CLAUDE.md](../CLAUDE.md) (design law), the `scroll-cinema`
> and `truth-journey` skills, and [prototype/HANDOFF.md](../prototype/HANDOFF.md).

## Why two pages

The existing film is structurally sound and asset-starved. Fixing it is a known
quantity with a high ceiling. Separately, there is a stronger *argument* the
same assets can make. Rather than debate which, we build both on one engine and
let the founder choose against something real.

`/` stays the storyline Aryaman described. `/homepage-2` is the alternative.
Both share `ScrollFilm`, the manifest, the orb, and the grade — the second page
is a different score played by the same orchestra, not a second orchestra.

---

# Part 1 — V1 polish (`/`)

## Diagnosis

The engine is complete and correct. `utils/homography.ts`, `useScrollProgress`,
`filmLoader`, the three-tier scrub in `CityScrub`, the calibration tool — all
working. What's missing is footage and finish.

| Symptom | Root cause | Evidence |
|---|---|---|
| Boardroom copy floats over the frame | All four screen anchors uncalibrated | `manifest.json` → every `anchors.*.quad` is `null` |
| Film jump-cuts instead of moving | 3 of 4 transits have no footage | `sequences.transit-b/c/d` = `null`; only `transit-a` (96 frames) exists |
| Backdrop looks soft | Frames are half-res | `transit-a` is 960×540, upscaled ~2× on a 1440p display |
| Reads as a slideshow, not a film | HUD announces the seams | `hud-scene` prints `SCENE 01 · THE SKY`; timeline is labelled per act |
| Scenes don't feel like one film | Stills come from different sources | kf-01 vs kf-03 differ in colour temp and contrast |

## Tier 1 — do these first

### 1.1 Calibrate the screen anchors

The highest-leverage change on the project, and the thing Aryaman explicitly
asked for on the call ("You want this text on that white screen?" / "Exactly").

`ScrollFilm.client.vue:651` already reads `anchors['kf-03-screen']` and pins the
panel with `quadToMatrix3d` — it bails only because the quad is `null`.

Procedure per anchor: `/?calibrate=<id>` → drag the four corners (TL, TR, BR, BL)
→ paste the exported normalized quad into `manifest.json`.

Anchors: `kf-03-screen`, `kf-03d-screen`, `kf-05-screen`, `kf-06-screen`.

**Known caveat:** HANDOFF flags KF-03 for a re-roll (camera not square to the
screen) and says not to calibrate a still that's about to change. We calibrate
anyway — it is ten minutes of clicking, it proves the diegetic effect
immediately, and recalibrating after a re-roll costs the same ten minutes. The
proof is worth more than the rework.

### 1.2 Generate the three missing transits

`transit-b`, `transit-c`, `transit-d`. Prompts, ordering (C → D → B), endpoint
conditioning files, and selection criteria already exist in
[prototype/gen-queue.md](../prototype/gen-queue.md). Endpoints are locked stills,
so each clip is first→last conditioned and must land on its endpoint exactly.

`ScrollFilm` auto-swaps procedural → real frames the moment a sequence appears
in the manifest, so this is drop-in.

Process with `scripts/process-footage.sh`. Keep the best two per transit.
Judge TRANSIT B on its first and last 1.5s only — the middle is a descent blur.

#### Transit generation brief

All three have their conditioning endpoints already on disk, so each clip is
first→last conditioned against locked stills:

| Seq | From | To | The move | Notes |
|---|---|---|---|---|
| `transit-c` | `kf-05` | `kf-06` | Push into the phone's screen light, engulf, resolve to a Mediterranean beach club, pull back to hands holding a phone | Palette shifts Dubai amber-teal → turquoise/white. Fallback: 2×4s stitched at pure white |
| `transit-d` | `kf-03d` | `kf-08` | Dusk boardroom, pull back out the window, rise into night sky | Dusk/night grade |
| `transit-b` | `kf-03` | `kf-04` | Boardroom → out the window → accelerating facade descent → settle at street level on the broker | Hardest; do last. Judge on first/last 1.5s only — the middle is descent blur |

Generate at 8s / 12fps to match `transit-a`'s 96 frames. Shared negative prompt
and selection criteria (endpoint fidelity, no invented text, no camera
reversals, one motion direction, no faces, clean portals) are in
[prototype/gen-queue.md](../prototype/gen-queue.md). Keep the best two per
transit; process with `scripts/process-footage.sh`, then merge its
`sequences.json` into the manifest by hand — that merge is deliberately manual
so a human approves every clip entering the film.

### 1.3 Raise frame resolution

`transit-a` on disk is 960×540 at ~19KB/frame, but `process-footage.sh` v2
already targets landscape tiers of **1600 and 900** — so the existing frames are
stale output from an older pipeline, not a deliberate choice. Re-running the
current script fixes it.

**Budget tension, needs a decision.** Four transits × 96 frames at the 1600 tier
is roughly 16–19MB, against the `scroll-cinema` budget of ≤10MB total preload:

| Config | Est. total | Verdict |
|---|---|---|
| 4 × 96 frames @ 960 (today's encode) | ~7.3MB | Within budget, visibly soft on desktop |
| 4 × 96 frames @ 1600 | ~16–19MB | Sharp, well over budget |

Three ways out, and they combine: the engine already picks the smallest tier
covering viewport×DPR, so phones pull 900 and only desktops pay for 1600;
`filmLoader` already prioritises hero + transit-A and idle-prefetches the rest,
so the 10MB ceiling applies to *preload*, not the whole journey; and dropping to
~72 frames per transit trades a little smoothness for a quarter of the weight.

Recommendation: re-encode at 1600/900, keep 96 frames, and measure real totals
before trimming — the estimate above is extrapolated from WebP scaling, not
measured. Individual frames stay far under Cloudflare's 25MiB per-file cap
either way.

### 1.4 Self-host the Spline scene

`public/spline/` already holds runtime 1.12.95 and every lazy-loaded chunk. Only
`scene.splinecode` is missing, so every visitor currently reaches
`prod.spline.design` on load. Download it to `public/spline/scene.splinecode` —
the fallback chain at `ScrollFilm.client.vue:612` already prefers local.

### 1.5 Cut the HUD

`SCENE 01 · THE SKY` and a per-act labelled timeline tell the viewer they are
watching eleven scenes. That directly undermines the one-continuous-move
premise. Remove the scene label and the act labels; keep at most a hairline
progress thread. The `RECHITTA` badge stays.

## Tier 2 — craft

### 2.1 One grade

A single LUT applied across every still, plate, and frame so the film reads as
one DP's work. Bake into the asset pipeline, not the runtime — cheaper per frame
and consistent with the reduced-motion storyboard.

### 2.2 Camera language

Static holds read as screensavers. Add, all as functions of `t`:

- slow drift and scale on every hold (never a frozen frame)
- parallax between the orb layer and the backdrop
- one shared post pass — grain, vignette, faint chromatic aberration, restrained
  bloom — in a single canvas layer over the composite

### 2.3 Real product UI

The broker chat and buyer briefing (`ScrollFilm.client.vue:41–68`) are
hand-built HTML approximations of the app. With the Figma screens, composite the
real UI through `kf-05-screen` / `kf-06-screen` — the anchors exist for exactly
this. Material credibility gain for a page backing a seed round.

### 2.4 Orb reacts to the world

Currently screen-blended and path-driven; it never touches the scene. Add:

- glow tinted by the plate's dominant colour, sampled per scene
- intensity and saturation driven by `t`
- a soft contact shadow where it nears a surface

Prefer Spline Variables over the current approach of reaching into
`material.layers` for `displace`/`noise` — that spelunks undocumented internals
and breaks on any re-export. Variables need editor access; until then the
existing hack stays, isolated behind one function.

### 2.5 Pacing

Segment weights currently run 0.9–1.6 — almost uniform. Films aren't. Transits
should move; holds should be long enough to read and then sit. Every beat needs
≥ ~0.08 of scroll to be legible.

### 2.6 Sound

Off by default, one toggle, remembered. Per-scene room tone plus a soft
transition swell. Among the cheapest cinematic multipliers available.

### 2.7 Close the loop

SCENE 10 (`A NEW DAY — BEGIN AGAIN`) exists, but the final frame must match the
opening frame exactly or the infinite loop reads as a cut.

---

# Part 2 — V2 concept (`/homepage-2`)

## The argument

Aryaman's framing is speed — *"in one day, the whole thing happened."* The
stronger claim is **fidelity**, and it comes straight out of his own business: a
Dubai off-plan launch must reach thousands of brokers across 40+ nationalities;
prices move weekly; briefings go stale in weeks; the buyer is abroad and doesn't
read the brochure's language.

**The truth degrades as it travels.** A telephone game with eight-figure stakes.

## The device — one sentence

A single fact is born on the boardroom screen, projected through the same
homography as V1. Clearly fictional, per the XYZ-Developers rule:

> **Vela Bay Tower · Unit 1404 · AED 2.05M · Handover Q4 2027**

That string is an object on the page. You follow *it*, not a camera.

### Pass one — the world as it is

The sentence leaves the room and visibly decays in transit. The price drifts.
The handover slips to `2028?`. The unit number blurs. It reaches a phone abroad
three weeks stale, in a language the buyer half-reads.

No marketing copy. No "developers struggle to…". You watch it rot.

Rechitta is not mentioned — consistent with the `truth-journey` rule that acts
1–2 belong to the world and she enters at act 3.

### The hinge — rewind

The page reverses itself once, briefly, and the orb enters.

### Pass two — the same journey, carried

Same route, same rooms, same cities. The sentence arrives intact: same numbers,
same timestamp, rendered in Russian, Mandarin, Arabic — meaning unchanged. The
orb carries it the whole way.

### Resolution — the god view

Back in the boardroom, on the same screen, the sentence is now one row in the
dashboard, with everywhere it went and who opened it. Then the page returns to
the opening frame.

The signature ending stands: the orb delivers the sentence and is absorbed into
the product UI. It lands harder here, because the orb has been visibly *carrying
something* the whole way.

## Why this is worth building

- It is an argument, not a tour. The decay pass earns the second pass.
- It gives the orb a job. Carrier of the truth, not decoration.
- It keeps every beat Aryaman asked for — boardroom, broker, global/languages,
  god view, infinite loop — reordered into a thesis.
- It reuses the entire V1 asset set. No new stills, no new transits. The second
  pass is the same footage with different overlays and a different grade.

## The risk

A page that scrolls backwards on its own can read as broken. Mitigations:

- keep it under a second, motion-blurred, unmistakably a film rewind
- the sentence visibly un-corrupts during it, so the motion is legible as meaning
- **fallback:** hard cut to black, same room, sentence restored — same beat, no
  scroll inversion

**This is the first thing to prototype.** The whole structure leans on it. If it
doesn't feel great in isolation, we take the fallback before building around it.

---

# Shared constraints

Non-negotiable, from `CLAUDE.md` and the skills. Several are founder-corrected.

- **Off-plan only, on-platform inventory only.** Never imply market-wide Dubai
  data or search.
- **Fully photoreal.** The stylised/procedural middle was built and rejected as
  uncanny. Real footage, flat UI overlays. No WebGL city.
- **Never mask the orb.** Its glow fills the frame periodically; any mask reads
  as a visible square. Never resize beyond the 150%/-25% geometry — Spline's
  camera zoom is coupled to frame size.
- **Rechitta is "she."** Calm, declarative, premium. No exclamation marks, no
  emoji, no invented statistics, prices, projects, or testimonials.
- **Typography is settled.** Marcellus + Sora + IBM Plex Mono supersede
  Playfair/Inter on film surfaces. Amber/teal, background `#070E16`.
- **One scroll authority.** `useScrollProgress` only. Do not add GSAP
  ScrollTrigger or Framer Motion `useScroll` — two smoothed scroll systems
  disagree sub-frame and the composite feels seasick.
- **Budgets.** ≤ ~10MB total preload; first paint never waits on media; test at
  390px; `prefers-reduced-motion` gets the still storyboard.
- **Tracking.** GA4-legal underscore event names via `useTrack()`. The old
  `area:action` convention breaks GA4.

# Dependencies on Aryaman

| Need | Blocks | Priority |
|---|---|---|
| Figma app screens | 2.3 real product UI; overlay content for both pages | High |
| Confirm rights on existing stills | Anything shipping publicly | High |
| Spline editor access | 2.4 via Variables (hack works meanwhile) | Medium |
| Which Spline scene is canonical | Iframe is `meeet-K190VICHbClCgQyBKYguhj6F`, runtime is `IsMZdCzuXM91-03p` | Medium |
| Veo credits | 1.2 transit generation | High |
| KF-03 re-roll, camera square to screen | Improves 1.1; not blocking | Low |

# Verification

Per `scroll-cinema`: a scroll film cannot be judged from one screenshot. After
any choreography change, capture `t=0`, each overlay band's hold point, one
mid-transition, and `t=1` — then check the console. `__DBG.seek(t)` skips scroll
smoothing; `__DBG.state()` dumps current state. Browser screenshots go black
when the tab is hidden (rAF freeze) — verify with `__DBG` and pixel sampling,
not backgrounded captures.

If a beat looks wrong, check whether its band overlaps a neighbour's before
touching visuals.

# Sequence

1. Tier 1 — calibrate anchors, self-host splinecode, cut the HUD, scope transits
2. Prototype the V2 rewind in isolation, decide rewind vs. fallback
3. Tier 2 craft on `/`
4. Build `/homepage-2` on the finished engine
5. Review both with Aryaman and the design team
