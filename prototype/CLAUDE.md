# CLAUDE.md — Rechitta Landing Page · "One Source of Truth" Scroll Film

## What this is
A cinematic, scroll-driven landing page for Rechitta (AI real-estate assistant, Dubai off-plan).
The page is a frame-scrubbed film: descent from the sky over Downtown Dubai → developer
boardroom → broker's phone → buyer abroad → world montage → back to the boardroom (live
world map) → night sky finale → **infinite loop** back to dawn/frame one.
Current state: **prototype v0.7** — see **HANDOFF.md** for the live status, owner queue,
and next engine task. Stills/plates/hand-foreground are DONE; transits C/D/B pending.

## Files
- `template.html` — the entire engine (canvas scrub, rest-stop overlays, orb layer, HUD). Tokens `__TA__`, `__STILLS__`, `__RUNTIME__` are injected at build.
- `build.js` — embeds assets as base64, writes `rechitta-scroll-prototype.html`. Run: `node build.js`.
- `ta/` — 96 frames (12fps, 960w, WebP) extracted from the real Veo Transit A clip, watermark-delogo'd.
- `stills/` — real keyframes KF1 (hero), KF3 (boardroom), KF4 (street), KF5 (phone macro), KF-06 (beach).
- `runtime.js` — @splinetool/runtime **1.12.95** (matches Rechitta-AI/interaction package.json). Embedded into the build.
- `rechitta-veo-prompt-pack.md` — all Veo/Flow generation prompts, continuity rules, selection checklist.
- `process-footage.sh` — production frame pipeline (delogo coords for the Veo mark on 1280×720: x1100 y540 w120 h100, plus text x1170 y685 w100 h30; 12fps; desktop/mobile tiers).

## Run / test (IMPORTANT)
Always test over HTTP, never file://
```
node build.js && python3 -m http.server 8080
# open http://localhost:8080/rechitta-scroll-prototype.html  (serve from the output dir)
```

## ✅ RESOLVED (v0.7) — the "plastic ball" bug was hypothesis 4
Root cause, confirmed by console on local HTTP serve: the runtime imported fine, the scene
downloaded, then the runtime lazy-loaded its **`process.js` chunk** relative to its own URL →
404 → scene init aborted → CSS fallback stayed. Fix shipped:
- All `@splinetool/runtime@1.12.95` build chunks (`process.js`, `physics.js`, `boolean.js`,
  `howler.js`, `opentype.js`, `ui.js`, `navmesh.js`, `gaussian-splat-compression.js`) now sit
  next to the HTML in this folder — **serve this directory**, chunks resolve as siblings.
- `importRuntime()` now tries `./runtime.js` (real file, chunk-safe) FIRST, then the embedded
  base64 blob (single-file portability; chunks may 404 from blob base), then pinned CDNs.
- `build.js` outputs into this folder (was `/mnt/user-data/outputs/` — another sandbox's path).
- Console shows a "scene more recent than library" warning — expected consequence of the
  deliberate runtime pin; harmless.

## The orb (brand identity — handle with care) — CORRECTED against the repo
- **Orb2.vue is DEAD CODE** (confirmed in `interaction/app/CLAUDE.md` and by import search).
  The orb actually live in the product is **`Orb.vue`**, used in `SmartInteraction/Shell.vue`
  (persistent, orb-scale 0.3) and `widgets/general/OrbFullScreen.vue` (orb-scale 2.5).
- Scene: **`https://prod.spline.design/IsMZdCzuXM91-03p/scene.splinecode`** (Orb.vue). The
  previous prototype pointed at Orb2's `WD5QWWQdAs1XrQsA` — an unused experiment.
- After `app.load(...)`, Orb.vue calls **`app.setSize(800,800)` and `app.setZoom(0.9 × orbScale)`**
  — skip setZoom and the scene framing is wrong. (Template uses zoom 0.9; DOM box does scaling.)
- **Do not unpin the runtime.** The transparency hacks reach private APIs: `app._scene.activePage.bgColor.a = 0` and a monkey-patched `_renderer.setClearColor(color, 0)`. Version drift = opaque square over the film.
- Audio-reactive mechanism (Orb.vue, verbatim): layers where `type==='displace' &&
  displacementType==='noise'`; `intensity = (base + bass*120 + smoothAmp*30) × 0.2` (note the
  ×0.2 damping), `movement = base + mid*16 + high*8`; bases `intensity ?? 8`, `movement ?? 1`;
  smoothing attack 0.6 / release 0.15. In-product the layers hard-zero when not speaking; the
  film instead keeps constant low breathing (deliberate choreography choice).
- Orb.vue has NO mix-blend-mode (that was Orb2). Transparency comes from the bgColor/clearColor
  hacks alone.
- Film choreography (synthetic bands in `frame()`): constant low breathing; hard pulse when the orb absorbs the boardroom stat chips; "speech" cadence while docked over the broker phone (rest2).
- Owner's standing decision: **self-host the `.splinecode`** (export from Spline editor → Azure static origin) for data-residency consistency and zero third-party runtime deps. Once the file exists, embed or serve it and drop the prod.spline.design URL.

## Design decisions (do not relitigate without cause)
- **Hero makes ONE promise**: "One source of truth." Audiences split one scroll later and via routes, never in the headline.
- **Portals hide seams**: every transition between generated clips lands on glass / white light / darkness. New footage only needs endpoints "in the neighborhood" — the engine's blooms absorb the rest.
- **Rest stops**: scroll owns the camera in transit; camera locks at boardroom/broker/buyer stations where DOM overlays become interactive. All product text/UI is DOM, never baked into footage (also: Veo can't typeset Devanagari/Cyrillic/Arabic/Han).
- **Match frames**: KF-07 and KF-08 are DERIVED (regrades of approved KF-02/KF-01), never regenerated — geometric identity is the point. Same for KF-03D (dusk boardroom for the return; screen glow shifts green-cyan; live world map is a DOM overlay on the same screen that held the problem slide).
- **World montage is COMPOSITED, not generated**: one real photographed hand+phone foreground (owner shoots it) over 6 generated background plates — Mumbai, Moscow, London, Shanghai, Riyadh, Paris — all timestamped as the same instant (Dubai 08:11 GST). Hard cuts on scroll, no crossfades.
- **Numbers stay defensible**: "thousands of brokers, 40+ nationalities" — never "40,000 brokers / 120 languages." The buyers of this product will fact-check the villain.
- **Infinite loop**: finale = night-regraded KF1; a sunrise segment lerps the grade off and `scrollTo(0)` lands on identical pixels. No footer at "the bottom" (there is none) — plan a drawer for legal/investor links.
- Investors get a quiet footer/drawer link to the data room, never a section.

## Production quality plan (the prototype is intentionally soft)
Prototype embeds 960w q55 frames to stay single-file. Production: upscale 720p Veo output
(Topaz Video AI / Real-ESRGAN, or export 1080p from Flow if the tier allows) → extract 1920w
WebP q72 (~60–90KB/frame) → serve per-scene lazily from CDN (~6–8MB/transit desktop).
`process-footage.sh` already implements tiers + manifest.

## Owner's roadmap (his words, his order)
1. **Overlay registration** — pin DOM overlays to image-space anchor quads; use CSS `matrix3d` homography for angled surfaces (KF3 board isn't perpendicular). Preferred fixes: re-roll KF3 (camera square to screen, presenter's back to camera, softer slide blur — current has a resolved face + pseudo-text) and KF-06 as first-person hands (matches broker POV grammar). KF5 needs the reflected face retouched off the screen; brighten its glow to match KF4's for the match cut. KF4 needs a warm regrade (drifted to dusk; Act II is golden hour) + signage inpaint.
2. **Portrait mode** — three buckets: crop-tolerant transits reused; stills recomposed 9:16 (sky/finale/phone/beach are gifts in portrait); true portrait gens only for Transit A + boardroom. Engine gets an orientation dimension in the manifest.
3. Final copy for problems/statements (chips, chat, briefing).
4. Routes `/developers` `/brokers` `/buyers` (own CTAs, own funnels; campaign links skip the homepage), other pages, footer drawer.
- **Analytics**: GA4 (owner asked) — events: `scene_reached`, `chip_opened`, `send_to_client_clicked`, `lang_toggled`, `cta_clicked` (which CTA + which scene), `loop_completed`, plus UTM capture on routes. Note: Rechitta also runs PostHog — decide dual-fire vs split (GA4 marketing / PostHog product) with the owner.

## Target stack
Production site: Nuxt (matches the `interaction` repo), deployed on Azure UAE North. The scroll
engine is dependency-free vanilla JS by design — port it into a Nuxt page component, keep the
frame manifest external, keep the orb self-hosted.

## Working style the owner expects
IIT/Microsoft/Google engineer-founder. Push back with reasons, throw curveballs, debate trade-offs.
No flattery padding. Defensible claims only. He does the generation/photography legwork; you own
the engine, pipelines, and integration.
