# Rechitta Landing — Production Plan (prototype → rechitta.com)

**Ratified by owner 2026-07-12:** dual-fire GA4 + PostHog · portrait/mobile is
LAUNCH-BLOCKING (Phase-1 scope, not fast-follow) · hosting = Azure SWA + Blob
(UAE North) behind Front Door/CDN.

Owner = generation/photography/accounts. Engine/pipeline/integration = Claude.
Phases 1–2 are NOT gated on Phase 0 — the engine ports with current assets and
swaps footage as re-rolls land. Run them in parallel.

---

## Phase 0 — Finish the film's assets (owner-gated)

### Keyframe stills

| Asset | Status | Action needed | Who |
|---|---|---|---|
| KF-01 hero sky | ✅ approved | none — it's the anchor for 3 frames | — |
| KF-02 window portal | ✅ handled | extracted from Transit A final frame, upscaled 1280×720 + sharpened (owner delegated the quality lift) | done |
| KF-03 boardroom | ⚠️ have, flagged | re-roll: camera square to the screen, presenter's back to camera, softer slide blur (current has a resolved face + pseudo-text) | owner |
| KF-03D dusk boardroom | derive | regrade approved KF-03 → blue hour, green-cyan screen glow (prompt pack §2 Transit D) | Claude |
| KF-04 street broker | ⚠️ have, flagged | warm regrade (drifted to dusk; Act II is golden hour) + signage inpaint | Claude regrade / owner if inpaint fails |
| KF-05 phone macro | ⚠️ have, flagged | retouch reflected face off the screen; brighten glow to match KF-04 | Claude/owner |
| KF-06 beach | ⚠️ have, flagged | preferred re-roll: first-person hands (matches broker POV grammar) | owner |
| KF-07 lit window | ✅ derived from REAL KF-02 | style ref for Transit D | done |
| KF-08 finale sky | derive | night regrade of KF-01 — pre-bake for production (engine currently grades live) | Claude |
| Montage plates ×6 | ✅ ALL GENERATED | converted 1600w WebP, live in the montage (alts banked: london-cars, paris-soft) | done |
| Hand + phone plate | ✅ SHOT (4 variants incl. portrait) | cut out via keyed matte, screen flattened, live in the montage scene; portrait variant banked | done |

### Transit clips (8s, first→last frame conditioned)

| Clip | Status | Notes |
|---|---|---|
| Transit A (KF-01→KF-02) | ✅ have, 96f processed | done, delogo'd |
| Transit C (KF-05→KF-06) | ❌ | generate next — white-light portal forgives seams; can be 2×4s stitched at pure white |
| Transit D (KF-03D→KF-08) | ❌ | mirrors B's window exit in reverse; needs KF-03D first |
| Transit B (KF-03→KF-04) | ❌ | HARDEST — do last, after prompt intuition builds (per pack §5) |

Selection: score every clip against prompt pack §4 (endpoint fidelity, no invented
text, no camera reversals, one motion direction, no faces, clean portals). Keep best 2.

### Production frame quality
Prototype frames are 960w q55 (soft, intentional). Production: 1080p source (Flow
tier or Topaz/Real-ESRGAN upscale of 720p) → `process-footage.sh` → 1600w/900w
WebP q62 tiers + manifest. Full film ≈15–18MB desktop, lazy per scene, first paint
needs only hero + Transit A (~4MB).

### The orb, self-hosted (standing decision)
Owner exports the **Orb.vue scene** (`IsMZdCzuXM91-03p`) as `.splinecode` from the
Spline editor → we serve it + `@splinetool/runtime@1.12.95` + ALL its chunk files
from our own origin. Re-verify the transparency hacks against the exported file
(the pin exists because they reach private APIs). Zero third-party requests in the
brand's critical path.

---

## Phase 1 — Production engine (Nuxt port) — Claude, starts now

Target: `Rechitta-AI/landing-page`, new branch `film-production`. The v2-nuxt
branch already has the Nuxt scaffold, persona pages, forms, tracking wrapper,
and project skills — reuse, don't rebuild.

1. **`<ScrollFilm>` component** — port the vanilla engine as-is (it's dependency-free
   by design): segments/scenes/orb-path/HUD intact, `manifest.json`-driven sequences
   replacing embedded base64.
2. **Asset loading** — per-scene lazy with a priority queue (hero+A first; B/C/D
   prefetch on idle + on approach), tier picked by viewport×DPR, `<link rel=preload>`
   for the first 12 frames. Frames served from CDN (Phase 4), NOT bundled.
3. **Overlay registration** (roadmap #1) — anchor quads in image space per rest-stop
   keyframe; CSS `matrix3d` homography for non-perpendicular surfaces (KF-03 board).
   Build a dev-only calibration overlay (drag 4 corners, export quad JSON) — pays for
   itself immediately.
4. **Portrait mode** (roadmap #2) — manifest gains an orientation dimension; three
   buckets per the roadmap (reuse crop-tolerant transits; recompose stills 9:16;
   true portrait gens only Transit A + boardroom).
5. **Orb** — self-hosted scene + pinned runtime + sibling chunks under `/public/spline/`.
6. **Quality gates** — Lighthouse mobile ≥85; hero paint <2.5s on 4G; reduced-motion
   = still-based storyboard with full copy; scene labels announced (aria-live);
   mid-range Android scrub test (the all-intra video fallback in process-footage.sh
   stays our plan B if canvas scrub stutters there).
7. **SEO** — the film is canvas; the SSG shell carries real DOM copy (hero + a
   hidden narrative summary), per-route meta/OG. OG image = graded hero frame.

## Phase 2 — Pages & funnels — Claude

- Port `/developers` `/brokers` `/buyers` from v2-nuxt (heroes, value props, lead
  form, Founding-Broker waitlist) restyled to the film's grade (amber/teal, Marcellus
  + Sora — supersedes the old Playfair/Inter on these pages; ratify in the skill).
- Campaign links land on persona pages directly, skipping the film (per CLAUDE.md).
- Footer **drawer** (no bottom on an infinite loop): legal, privacy, investor
  data-room link (quiet, never a section).
- Forms backend: Azure Functions (SWA managed functions) + Table Storage; the Nuxt
  code already posts to a configurable API base. Final copy for chips/chat/briefing
  = roadmap #3, owner reviews.

## Phase 3 — Analytics & consent — Claude + owner's GA4 property

- **Recommendation: dual-fire.** GA4 for marketing (ads, UTM ecosystems, agencies
  expect it); PostHog (already the company standard) for product funnels, session
  replay, and cross-domain identity into the app. One `track()` wrapper, one event
  schema, both sinks — deciding later costs nothing, losing data now is forever.
- Event schema (from CLAUDE.md, extended): `scene_reached`, `chip_opened(id)`,
  `send_to_client_clicked`, `lang_toggled(lang)`, `cta_clicked(cta, scene)`,
  `loop_completed`, `scroll_depth_max`, form submit/success/fail per funnel,
  UTM capture on entry persisted onto every lead/waitlist submission.
- Consent: PDPL/GDPR banner; GA4 Consent Mode v2; PostHog cookieless pre-consent.

## Phase 4 — Hosting & CI — Claude + owner's Azure access

- **Architecture: Azure Static Web Apps (Standard) for the app + Azure Blob Storage
  (UAE North) behind Azure Front Door/CDN for the frame sequences.** SWA: GitHub
  Actions CI, per-PR preview environments, free SSL, custom domains, managed
  Functions for the forms. Blob+CDN: heavy assets cached at edge, origin stays in
  UAE North (data-residency story intact), repo stays lean.
- Honest alternative: Cloudflare Pages is simpler and its free CDN is excellent —
  but the Azure-consistency story (product already on Azure UAE North) is worth
  the extra setup; decided.
- Environments: PR previews → `stage.rechitta.com` → production. Owner reviews
  staging on a real phone before any cutover.
- `azcopy` step in CI ships `frames/` + `spline/` to Blob on change.

## Phase 5 — Cutover rechitta.com — joint, last

1. Freeze: staging approved on desktop + mobile + mid-range Android.
2. Smoke: analytics events visible in GA4 DebugView + PostHog; forms deliver to
   storage + notification; orb loads from self-host; OG cards render in WhatsApp
   (this market shares everything on WhatsApp).
3. DNS: drop TTL a day early → repoint rechitta.com (currently GitHub Pages CNAME)
   to SWA/Front Door → verify apex + www + SSL.
4. **Rollback = repoint DNS back to GitHub Pages** — keep the old site deployed
   and untouched for 2 weeks.
5. 48h watch: Core Web Vitals, error rate, event flow, form deliveries.

---

## Critical path & parallelism

```
Owner:  KF-02 → montage plates + hand photo → Transits C, D, B → re-rolls (KF-03, KF-06)
        Spline .splinecode export · GA4 property · Azure access        (any order, ASAP)
Claude: Phase 1 engine port (now) → Phase 2 pages → Phase 3 analytics → Phase 4 infra
Merge:  assets slot into the manifest as they land → staging → Phase 5 cutover
```

Estimate (working sessions, not calendar): Phase 1 ≈ 2–3 · Phase 2 ≈ 1–2 ·
Phase 3 ≈ 1 · Phase 4 ≈ 1 (+ owner credentials latency) · Phase 5 ≈ 1.
Asset generation runs on the owner's cadence and does not block any of it.
