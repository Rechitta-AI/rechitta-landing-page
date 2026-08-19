# Asset generation brief — v2 (high-res, multi-device)

> **Read [prototype/rechitta-veo-prompt-pack.md](../prototype/rechitta-veo-prompt-pack.md) first.**
> It is still authoritative for the Global Style Anchor, the negative prompt, the
> hard rules, every landscape keyframe prompt, and the transit conditioning.
> This document layers three things on top: **resolution**, **portrait**, and
> **which tool to use for what**. It does not replace a single prompt in the pack.

## Why we are regenerating

Measured across the shipped assets:

| | Value | Should be |
|---|---|---|
| Still resolution | 1280×720 | 3840×2160 |
| kf-01 encode | **0.204 bits/px** | 1.0–1.5 |
| kf-08 encode | 0.089 bits/px | 1.0–1.5 |
| kf-01 detail energy | 74.5 | `background.png`, a real photo, scores **878** |
| kf-01 luminance range | 39–207 | 0–255 |

The `prototype/stills/orig/` "originals" measure byte-identical to what ships, so
there is nothing to recover — the quality was lost at generation, not in the
pipeline. Grading cannot fix it; this was tested and the result looked worse
(dither grain, CLAHE halos) than the untouched original.

## Tooling

The pack was written for Veo/Flow end to end. Stills are now better served
elsewhere; video stays with Veo.

| Asset class | Tool | Why |
|---|---|---|
| **Master stills** | Gemini image (Nano Banana) or Flux Kontext | Image-conditioned editing — the only reliable way to get "the same room again". Gemini shares Aryaman's Google billing |
| **Look development** | Midjourney v7 with `--sref` | Best cinematic architecture output; pin one master frame as the style reference for everything |
| **Transits** | Veo (first→last conditioning), Kling as second roll | What the pack is written for; keep best 2 per transit |
| **Upscale, calibrated assets** | Topaz Gigapixel | Faithful. Required for anything the homography touches — invented detail moves edges |
| **Upscale, hero only** | Magnific | Hallucinates detail. Great on the aerial, wrong anywhere we measure geometry |
| **Video upscale** | Topaz Video AI | Transits to 4K |

Version numbers move monthly — confirm current releases before starting.

## Order of operations

Strictly sequential. Each step invalidates everything after it, so a change late
in the list is cheap and a change early is expensive.

```
1. KF-01 landscape at 4K          ← the master. Nothing else starts until this is right.
2. Remaining landscape stills      ← every one references KF-01's grade
3. Derive kf-03d / KF-07 / KF-08   ← edit, never regenerate (see below)
4. Portrait variants               ← same chain, same order
5. Re-calibrate screen anchors     ← both orientations
6. Transits                        ← conditioned on FINAL stills
7. One LUT across everything
8. Encode + manifest merge
```

**Step 1 is a gate.** KF-01 defines lens, haze, time of day, and grade for the
whole film. Generate nothing else until you would frame it on a wall.

**Step 6 after step 5, always.** Transits are first→last conditioned on stills.
Any still regenerated after its transits invalidates them.

## Derive, never regenerate

Three frames must be *edited* from an approved parent, not generated. The pack
already mandates this for KF-07 and KF-08; kf-03d is the same case and is not yet
documented there.

| Frame | Parent | Transformation |
|---|---|---|
| `kf-03d` | `kf-03` | Same boardroom at dusk. Kill the window daylight, drop ambient, push the screen to a cyan-green glow that lights the room |
| `KF-07` | `KF-02` | Blue hour, tower asleep, one warm boardroom window still lit |
| `KF-08` | `KF-01` | Night-into-dawn. Same vantage, city lights, thin warm horizon band |

The reason is structural, not convenience: **the loop and the god-view reveal only
land if the viewer recognises the same room and the same window.** Generated
lookalikes drift; edited pixels cannot. These are match frames.

Use Flux Kontext or Gemini image editing with the approved parent as input.

## Portrait

Cover-fit measurements of a 16:9 plate:

| Device | Aspect | Width surviving |
|---|---|---|
| Desktop 1920 | 1.78 | 100% |
| Desktop 1440 | 1.60 | 90% |
| iPad landscape | 1.43 | 81% |
| iPad portrait | 0.70 | **39%** |
| iPhone / Android | 0.46 | **26%** |

**Two sets cover all three devices** — tablet landscape behaves like desktop,
tablet portrait like a phone. No third variant.

### Native portrait required

Cropping produces nonsense for these; they are different compositions.

**KF-01-P — Hero, vertical**

```
Vertical aerial composition above Downtown Dubai at golden hour. The Burj Khalifa
rises through the centre of the frame from a hazy city floor in the lower third,
its spire reaching into a vast open sky that fills the upper two-thirds — gradient
from deep teal-blue at the top to warm amber at the horizon. Surrounding towers
recede into warm haze on both sides. Serene, vertical, monumental. The upper-centre
sky is left visually clean and uncluttered.
+ [Global Style Anchor, with "9:16 aspect ratio" replacing "16:9 aspect ratio"]
```
*The clean upper-centre sky carries the orb and the title, same as landscape.*

**KF-03-P — Boardroom, vertical**

```
Interior of a premium high-rise Dubai boardroom at golden hour, camera at seated
eye level looking straight down the room. A large wall-mounted presentation screen
is centred in the upper half of frame, square to the lens, glowing brightly with
its content completely blurred and unreadable — abstract soft rectangles. Below it,
the near end of a long dark walnut table with silhouetted figures seen from behind
in the lower third. Warm window light spills in from the left edge. Quiet,
high-stakes atmosphere.
+ [Global Style Anchor, 9:16]
```
*Critical difference from landscape: the screen must be **centred and square to the
lens**, not in the upper-right third. In portrait, anything at x 0.43–0.85 gets
cropped off. The screen is the subject here.*

**KF-05-P / KF-06-P — the phone shots**

Portrait is the *native* framing for a hand holding a phone; landscape is the
compromise. Generate these portrait-first and derive landscape by outpainting the
sides. Prompts are unchanged from the pack apart from the 9:16 anchor.

### Safe-square masters

The six city plates already specify "centre of frame dim, soft, uncluttered"
because a phone composites over them — they are centre-safe by design. Generate
these **1:1 at 4096×4096** and crop both ways.

The region surviving **both** a 16:9 and a 9:16 crop of a square master is the
**central 56.25% square**. Subject inside it; treat everything outside as
disposable.

## Targets

- Native-per-orientation stills: **3840×2160** and **2160×3840**
- Square masters: **4096×4096**
- Transits: 1080p minimum from the generator, upscaled to 4K
- Keep a lossless master per asset; encode delivery copies separately
- Delivery encode: **1.0–1.5 bits/px**, never below 0.8

## Acceptance checks

Run `scripts/check-assets.py` before anything enters the manifest. It fails an
asset that would repeat the current problem.

| Check | Threshold | Catches |
|---|---|---|
| Resolution | ≥ 2560 on the long edge | undersized generations |
| Encode | ≥ 0.8 bits/px | over-compression |
| Detail energy | ≥ 300 Laplacian variance | soft or upscale-mush output |
| Luminance range | p1 ≤ 12 and p99 ≥ 235 | washed-out grade, no black or white point |
| Gradient levels | ≥ 180 distinct in the smoothest quarter | banding |

These are the exact metrics on which the current assets fail.

## Manifest changes this requires

**`anchors` are not orientation-aware.** `stills`, `plates`, and `sequences` all
resolve through the `portrait → reuse → landscape` chain in
[utils/filmLoader.ts](../utils/filmLoader.ts), but an anchor holds one quad:

```json
"kf-03-screen": { "still": "kf-03", "quad": [...] }
```

A native portrait boardroom frames the screen differently and needs its own quad.
The schema needs an orientation level matching the others. **This must land before
portrait stills do.** Until then the engine fails safe — the guard added in
`applyBoardAnchor` refuses to pin when the projected quad is under 86% on-screen —
but it will not project on mobile either.

Also needs re-tuning for portrait: the `ORB[]` path is a hardcoded list of
percentage positions choreographed against landscape framing, and the montage hand
sprite carries a normalized `screenCenter` that assumes its landscape plate.

## Weight budget

The ≤10MB preload target in the `scroll-cinema` skill was set around 960px assets.
It does not survive HD, and frame sequences are the reason:

| Approach | Estimated total |
|---|---|
| 4 transits × 96 frames @ 1600px | ~34MB |
| Same content, scroll-scrubbed video, H.264 `-g 1` | ~8–16MB |

WebP frames pay full price per frame; video uses interframe compression. The
engine already supports a `VIDEO_SRC` tier. The skill chose frames because naive
`currentTime` seeking stutters on sparse keyframes — encoding with `-g 1` (every
frame a keyframe) removes that at roughly 3× filesize, still far below the frame
sequence. **Revisit this decision when the HD assets land; measure before
committing.**
