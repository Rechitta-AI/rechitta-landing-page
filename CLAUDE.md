# Rechitta Landing Page — Design & Copy Guide

> Drafted by Claude from the Notion brand manifesto, the v1 site, and the product
> repo. **Founders: correct anything wrong here — this file is treated as law.**

## What Rechitta is (one breath)

The communication layer for **off-plan** real estate selling in Dubai: developers
brief their brokers, brokers brief their clients, and Rechitta carries every one
of those conversations — live project inventory, branded briefings, the buyer's
language. Tagline: **"Curated Intelligence"**. Rechitta is referred to as
**"she"** in copy.

**POSITIONING GUARDRAIL (founder-corrected):** Rechitta knows the inventory of
developments **on the platform** — NOT the whole Dubai market. Never write copy
like "ask anything about any Dubai property" or imply market-wide data/search.
Off-plan only; per-project intelligence. Demo conversations must always be
scoped to a single (clearly fictional) development on Rechitta.

## Brand assets — always use these, never recreate

| Asset | Path | Use |
|---|---|---|
| Icon mark (the "R") | `public/brand/rechitta-icon.svg` | Orb centre, footer, favicons, small spaces |
| Full wordmark | `public/brand/rechitta-wordmark.svg` | Header, anywhere the name appears as a logo |
| Favicons | `public/favicon*.{ico,png}` | Already wired in nuxt.config |
| **The orb (current)** | Spline scene `https://my.spline.design/meeet-K190VICHbClCgQyBKYguhj6F/` | The brand orb. Render it exactly like v1 (`legacy/index.html` `#orb-*`): large wrapper (`clamp(260px, 32vw, 420px)`), iframe at 150% offset -25%, `mix-blend-mode: screen`, **no mask** (masks clip the scene's glow; smaller frames make Spline zoom and bleed), 7s drift, hidden until iframe `load`. R icon centred on it (design system §10.5) |

**Orb history (founder-corrected, twice):** the product used a video orb
(`rechitta-nuxt/public/orb-video.mp4`) in the past but has since moved to the
Spline orb — the video is deprecated, do not use it. The faithful v1 embed above
is the reference implementation.

**NEVER mask the orb iframe.** The Spline scene's glow periodically fills the
entire frame, so any edge fade/mask renders as a visible square or octagon.
Frame edges are hidden the way v1 hid them: composite the orb over scene
imagery (screen blend) and start it greyscale at the top of the page.

**Scroll choreography (home page, ported from v1):** `SceneStage.vue` — fixed
Dubai scene backdrops (skyline w/ dawn effect, curtainwall, canyon ×2, lobby)
crossfading per section; `OrbStage.vue` — fixed orb layer, greyscale→colour by
t=0.20 in step with the skyline cooling, journeys centre→right→left→centre,
then drifts INTO the demo phone (`#investor-phone`, playing the product
prototype video) and is absorbed — the page orb "becomes" the orb in the
product UI. This ending is a signature move; keep it. The hero "dawn" filter
math is v1's exactly (legacy/index.html:1422-1443).

**Asset weight warning:** `public/brand/prototype.mov` is 39MB — over
Cloudflare Pages' 25MiB/file limit. Compress (H.265/VP9, ~5MB target) before
the hosting cutover.

**ART DIRECTION — fully photoreal, committed (founder decision).** The
stylised/procedural middle was rejected as uncanny valley — "in between looks
very bad." The rule now: commit to ONE extreme. We chose **fully photoreal real
Dubai**, NOT stylised. (The alternatives considered and declined were anime /
Makoto Shinkai and Spider-Verse — only revisit if the founder reopens it.)

**Homepage (`pages/index.vue`) backdrop = `CityScrub.client.vue`:** a cinematic
flythrough of the REAL Downtown Dubai, scrubbed by scroll (the buildings are
real because it's footage of real Dubai — a licensed clip or a Google Earth
Studio export — not runtime 3D). The Spline orb (`TheOrb`) composites on top via
mix-blend screen + `OfficePresentation.vue` (flat 2D XYZ sales-review TV deck) +
gap narrative → resolution with audience router (→ persona pages) + press strip.
Real city, FLAT UI — never the muddy 3D-ish middle again.

NEEDED FROM FOUNDERS: the Dubai flythrough clip + confirmed commercial rights.
Full brief in [docs/photoreal-dubai-spec.md](docs/photoreal-dubai-spec.md). Drop
it at `public/video/dubai-flythrough.mp4` and set `VIDEO_SRC` in
`CityScrub.client.vue`. Until then a clean cinematic night gradient stands in
(no fake buildings).

`ThreeCity.client.vue` (the procedural WebGL city) is **deprecated** — kept only
for reference; do not put it back on the homepage.

More assets (flags, fonts, product screenshots) live in the product repo:
`../rechitta-nuxt/public/`. Source brand SVGs: `../rechitta-nuxt/public/assets/`.

## Design tokens

**Source of truth: [`docs/design-system.md`](docs/design-system.md)** — the full
system extracted from the official Figma files (color primitives + semantic
tokens, type ramp, spacing/radius/elevation scales, component patterns). Consult
it before inventing any value. Quick anchors:

- Background `#0A0A09` (neutral/950 — near-black, never pure black)
- Brand blue `#3D6FF5` (brand-blue/500; hover `#5C8DFF` in dark mode)
- Gold `#C5A572` (brand-gold/500 — section labels, accents; sparingly)
- Text (dark mode): `#FAFAF9` primary / `#E8E8E5` secondary / `#A8A8A1` tertiary
- Display: **Playfair Display** (headlines only). UI/body: **Inter**. Code: JetBrains Mono
- Cards: semi-transparent dark bg, 1px subtle border, 12px radius, 16–20px padding
- Labels: UPPERCASE Inter Medium, wide tracking (1.2px+), gold for primary labels
- Hierarchy pattern: gold label → display title → secondary supporting text
- 4px spacing grid
- Easings (v1 motion): `cubic-bezier(0.16,1,0.3,1)` expo / `cubic-bezier(0.25,1,0.5,1)` quart
- All tokens are CSS vars in `assets/css/tokens.css` — use the vars, not hex values

## Layout & motion rules

- Dark, cinematic, generous whitespace. Sections breathe; nothing cramped
- The orb is the brand's protagonist — it should always feel alive (breathing,
  listening, responding), never static decoration
- The brand R icon sits centred ON the orb (v1 composition)
- Motion is calm and expensive-feeling: slow expo easings, no bouncy springs
- Mobile first-paint matters: defer the Spline iframe, never block on it

## Copy voice

From the brand manifesto ("Real Estate Consciousness"):

- **Clarity over cleverness.** Short declarative sentences. "Only what helps
  someone decide better."
- Confident, calm, premium — never salesy, never exclamation marks
- Rechitta is "she" — a curator, not a chatbot or a tool
- Speak to each audience in their own stakes: developers (control, reach),
  brokers (speed, closing), buyers (trust, language)
- Numbers are powerful but must be REAL. Never invent stats, prices, yields,
  project names, or testimonials. Placeholder demo data must be flagged to the
  team before any launch
- Established headline bank (v1, approved): "She speaks your language." /
  "One upload. One intelligent brief." / "Send the link. Close the deal." /
  "Your private property curator. Available now."

### Copy corrections from founders

<!-- Add specific lines you hate and what they should be instead. Claude reads
     and applies this section on every pass. -->

## Hard don'ts

- No invented contact details, social links, press quotes, or inventory data
- No emojis in page copy
- No pure-white backgrounds; the site is dark, always
- Don't use Playfair for body text or UI elements
- Don't recreate the logo in CSS/text — use the SVGs

## Tracking conventions

Every interactive element fires a PostHog event via `useTrack()`:
`area:action` — e.g. `cta:upload_project_click` (with `placement`),
`waitlist:submitted`, `lead:upload_project_submitted`, `hero:conversation_loop_completed`.
New components must follow this or analytics funnels break.
