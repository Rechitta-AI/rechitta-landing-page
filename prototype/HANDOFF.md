# HANDOFF — Rechitta "One Source of Truth" scroll film · 2026-07-13

Read this first, then CLAUDE.md (design law), PLAN.md (ratified roadmap),
gen-queue.md (owner's generation prompts). Everything is mirrored in
`~/Codes/Rechitta/landing-page/prototype/` (branch `v2-nuxt`) — commit there.

## Where things stand

**The film prototype (v0.7) is asset-complete except the three transit clips.**
- Working dir: `~/Downloads/rechitta-landing-workspace 2/` (this folder).
- Run: `node build.js && python3 -m http.server 8080` →
  `http://localhost:8080/rechitta-scroll-prototype.html`. Serve the DIRECTORY —
  the Spline runtime lazy-loads sibling chunks (process.js etc.); that was the
  "plastic ball" bug. Asset review page: `/kf-review.html`.
- **Orb**: interaction repo `Orb.vue` — scene `IsMZdCzuXM91-03p`, runtime PINNED
  1.12.95 (+ chunk files in this dir), setSize(800,800)+setZoom(0.9),
  intensity ×0.2, transparency hacks. Orb2.vue is dead code. Never mask/unpin.
- **Stills 11/11 LOCKED**: KF-01, KF-02 (real 1280×720), KF-03/04/05 retouched
  (retouch.py — screens dissolved, faces softened, KF-04 regraded golden),
  KF-06, derived KF-03D/KF-07/KF-08. Originals in stills/orig/.
- **Montage DONE**: all 6 city plates live (plates/*.webp, ~154KB total; alts
  banked: london-cars, paris-soft). Foreground = owner's REAL hand+phone,
  matted with **Apple Vision subject-lift** (plates/vision-matte.swift — owner
  rejected the earlier keyed matte as "very very bad"; Vision fixed it). Sprite:
  screen centre norm (0.3554, 0.4561), wrist flush to frame bottom (dh=0.855H,
  bottom-anchored), per-city tint via cached offscreen canvases (HAND_GRADE in
  template). Screen glass aligns with #mont-screen at top 53.5%.
- QA: `window.__DBG = {S, PIM, taCount}` exposes asset readiness. Browser-pane
  screenshots go BLACK when the tab is hidden (rAF freeze) — verify with
  __DBG + canvas pixel sampling instead; only fronted tabs screenshot.
- Chat-pasted images never reach disk. Owner drops files in ~/Documents/
  (plates were `*_2K_2026…jpeg`, `KF2-Real_*.jpeg`) or ~/Downloads (WhatsApp).

## Owner's queue (his legwork, in order)
1. **Transits C → D → B** (8s, first→last conditioned; prompts + conditioning
   files in gen-queue.md; all endpoints final in stills/). Keep best 2 each;
   process with `process-footage.sh`; judge B on first/last 1.5s only.
2. Optional re-rolls: KF-03 (camera square to screen), KF-06 (first-person hands).
3. Spline editor export of scene `IsMZdCzuXM91-03p` as `.splinecode` (self-host).
4. GA4 property + Azure subscription access (gate Phases 3–4).

## Phase 1 — production engine port: DONE (2026-07-13, branch `film-production`)
Verified live in the Nuxt dev server, both orientations, by pixel sampling:
- **`components/film/ScrollFilm.client.vue`** — full engine port (segments,
  scenes, orb path, HUD, overlays, chip absorb, montage, loop). Scenes
  descend/toBeach/ret auto-swap procedural → real frames when `transit-b/c/d`
  land in the manifest. Tracking wired per PLAN Phase 3 schema (GA4-legal
  underscore names — the old `area:action` convention breaks GA4).
- **`public/film/manifest.json` v2** — orientation dimension (three portrait
  buckets: `{"reuse":"landscape"}` = crop-tolerant; real portrait entries
  supersede), width-named tiers, stills/plates/sprites/anchors.
  `scripts/process-footage.sh` v2 emits it (`transit-x-portrait.mp4` naming).
- **`utils/filmLoader.ts`** — priority-queue loader (hero+A first, approach
  boost −3/−2/−1, idle prefetch). `utils/homography.ts` — quad → matrix3d.
- **Calibration tool** `/?calibrate=kf-03-screen` (dev-only): drag 4 corners →
  normalized image-space quad JSON → paste into manifest `anchors`. The
  boardroom panel pins via matrix3d once `kf-03-screen.quad` is non-null
  (waits on the owner's KF-03 re-roll — don't calibrate the flagged still).
- **Orb self-host**: runtime 1.12.95 + all chunks in `public/spline/` (loads
  from there today; verified sibling chunk resolution). `scene.splinecode`
  still pending owner export → falls back to prod.spline.design.
- **`/?storyboard=1`** = reduced-motion still storyboard (auto for
  prefers-reduced-motion); SEO narrative shell prerendered in index.vue;
  `app.vue` hides site header/footer on `/` (film owns its chrome).
- Quirks: manifest is fetched client-side (`server:false` — Nitro's internal
  fetch routes public assets into the Vue router, dev SSR 404s); QA handle
  grew `__DBG.seek(t)` (skips scroll smoothing) + `__DBG.state()`; dev server
  via `.claude/launch.json` → `npm run dev` :3000. OG card = real JPG at
  `public/film/og-hero.jpg` (WhatsApp-safe, 99KB).

## Claude's next task: PLAN.md Phase 2 — pages & funnels
Port `/developers` `/brokers` `/buyers` to the film grade (Marcellus/Sora,
amber/teal), footer drawer (legal + quiet investor link), forms → Azure
Functions via the existing configurable apiBase. Then Phase 3 dual-fire
GA4+PostHog (track() calls already emit the ratified schema) → Phase 4 Azure
SWA + Blob (UAE North) + Front Door → Phase 5 DNS cutover (GitHub Pages stays
as instant rollback). Lighthouse/mid-Android gates run on staging in Phase 4.

## Decisions already ratified (do not relitigate)
Dual-fire GA4+PostHog · portrait launch-blocking · Azure SWA+Blob/Front Door ·
photoreal + flat-DOM overlays (no 3D-ish middle) · hero promise "One source of
truth" · diegetic storytelling · defensible numbers only · infinite loop, no
footer (drawer instead) · investors get a quiet link, never a section.

## Wider repo context
- `landing-page` repo, branch `v2-nuxt`: older Nuxt homepage (CityScrub photo
  journey) + persona pages/funnels + skills (.claude/skills: rechitta-design,
  scroll-cinema, truth-journey — the two scroll skills describe the OLDER
  homepage direction; the film supersedes it, port their pitfalls not their
  specifics) + prototype/ mirror of this folder.
- `rechitta-nuxt`: product repo checkout from May (can lag; confirm with owner).
- `interaction`: V2 product (voice AI). Local CLAUDE.md index inside. Orb truth
  lives at app/components/Orb.vue.
- Memory files (auto-loaded): rechitta-overview, landing-page-v2-decisions,
  rechitta-brand-corrections, interaction-v2-repo, scroll-film-prototype.

## Working style the owner expects
IIT/Microsoft/Google engineer-founder. Push back with reasons, debate
trade-offs, no flattery, defensible claims only. He generates/photographs;
you own engine, pipelines, integration. Verify with your own eyes (or pixels)
before claiming success — he checks.
