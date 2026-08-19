# Rechitta — Framer Code Components

Seven drop-in code components that build the full Rechitta landing page in Framer.

---

## Components (in page order)

| File | Section | Position |
|------|---------|----------|
| `RechittaOrb.tsx` | Animated orb | Fixed, 100vw × 100vh, z-index 2 |
| `RechittaHeader.tsx` | Navigation bar | Fixed, 100% width, 72px height, z-index 50 |
| `RechittaHero.tsx` | Scroll hero | 100% width, **420vh** height |
| `RechittaLanguages.tsx` | Multilingual section | 100% width, fit content |
| `RechittaDeveloper.tsx` | For Developers | 100% width, fit content |
| `RechittaBroker.tsx` | For Brokers | 100% width, fit content |
| `RechittaInvestor.tsx` | Investor Finale | 100% width, fit content |

---

## Framer Setup

### 1 · Fonts
In **Project Settings → Fonts**, add:
- **Playfair Display** — used for all display/headline text
- **Inter** — used for all UI/body text

### 2 · Page background
Set the page canvas background to `#0A0A09` (near-black).  
All sections have `background: transparent` so the dark page shows through.

### 3 · Layer order & z-index
```
RechittaOrb     → Fixed, z-index: 2   (behind everything)
RechittaHeader  → Fixed, z-index: 50  (always on top)
RechittaHero    → z-index: 6–8 internally
(all other sections) → z-index: 6 internally
```

### 4 · RechittaOrb placement
- Position: **Fixed**
- Width: **100vw**, Height: **100vh**
- Pin to all 4 edges
- **Pointer Events → None** (in Framer's layer panel)
- The orb is scroll-driven — it moves right/left/up/down and fades in colour automatically

### 5 · RechittaHeader placement
- Position: **Fixed**
- Width: **100%**, Height: **72px**
- Pin to top
- z-index: 50

### 6 · Hero height
`RechittaHero` **must** be set to exactly **420vh** so the sticky scroll sequence plays correctly.  
Everything else is "fit content".

---

## Property Controls

Every component exposes editable properties in the Framer canvas right panel:

### RechittaOrb
| Property | Default |
|---------|---------|
| Spline URL | `https://my.spline.design/meeet-...` |
| Icon Size (vw) | 7 |

### RechittaHeader
| Property | Default |
|---------|---------|
| CTA Label | `Book a demo` |
| CTA Link | `#` |

### RechittaHero
| Property | Default |
|---------|---------|
| CTA Label | `Start a briefing →` |
| CTA Link | `#` |

### RechittaLanguages
| Property | Default |
|---------|---------|
| Headline | `She speaks\nyour language.` |
| Eyebrow | `MULTILINGUAL BY DESIGN` |
| CTA Label | `How it works →` |
| CTA Link | `#` |

### RechittaDeveloper
| Property | Default |
|---------|---------|
| Headline | `One upload.\nOne intelligent brief.` |
| CTA Label | `See it for developers →` |
| CTA Link | `#` |

### RechittaBroker
| Property | Default |
|---------|---------|
| Headline | `Send the link.\nClose the deal.` |
| CTA Label | `See it for brokers →` |
| CTA Link | `#` |

### RechittaInvestor
| Property | Default |
|---------|---------|
| Headline | `Your private property curator.\nAvailable now.` |
| Body | (full body text) |
| CTA Label | `Experience it yourself →` |
| CTA Link | `#` |
| Learn More Link | `#` |

---

## How the Orb Journeys

The `RechittaOrb` is scroll-driven. As the user scrolls the page:

| Scroll % | Orb Position | Section |
|---------|-------------|---------|
| 0–46% | Centre, greyscale → colour | Hero |
| 54–66% | Right (+26vw) | Developer / Languages |
| 71–83% | Left (−26vw) | Broker |
| 92–100% | Centre, large | Investor Finale |

The orb passes **behind** section content (z-index 2 vs 6) so text is always readable.
