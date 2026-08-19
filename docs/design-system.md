# Rechitta Design System

> Comprehensive design reference extracted from the official Figma files.
>
> **Sources:**
> - [Design System](https://www.figma.com/design/he7QnB9auNrzqsvpj1LRE2/Rechitta-%C2%B7-Design-System?node-id=23-1838)
> - [Investor Prototype](https://www.figma.com/design/EEzljEgv1gL1xsRXEOhgkH/Investor-Prototype?node-id=571-10087)

---

## 1. Brand Identity

**Product:** Rechitta — AI-powered real estate investment concierge
**Tagline:** "Curated Intelligence"
**Tone:** Premium, trust-driven, conversational yet authoritative

### Visual Character
- **Dark-first aesthetic** — deep navy/charcoal backgrounds with warm gold accents
- **Luxury real estate feel** — large hero imagery, generous whitespace, cinematic compositions
- **AI personality** — the Rechitta "R" logo appears as a glowing orb with a cyan/blue halo, reinforcing the AI agent identity
- **Two interaction modes:** Concierge Mode (fully-guided) and Chat Mode (semi-guided)

---

## 2. Color Palette

### 2.1 Primitive Colors

#### Brand Blue
| Token | Hex |
|-------|-----|
| brand-blue/50 | `#EEF4FF` |
| brand-blue/100 | `#DCE7FF` |
| brand-blue/200 | `#B8CFFF` |
| brand-blue/300 | `#8BB0FF` |
| brand-blue/400 | `#5C8DFF` |
| brand-blue/500 | `#3D6FF5` |
| brand-blue/600 | `#2A55E0` |
| brand-blue/700 | `#1E40B8` |
| brand-blue/800 | `#162F8A` |
| brand-blue/900 | `#0E1F5C` |
| brand-blue/950 | `#06112E` |

#### Brand Gold
| Token | Hex |
|-------|-----|
| brand-gold/50 | `#FBF6EC` |
| brand-gold/100 | `#F5EBD3` |
| brand-gold/200 | `#EAD4A4` |
| brand-gold/300 | `#DDBB73` |
| brand-gold/400 | `#CFA34F` |
| brand-gold/500 | `#C5A572` |
| brand-gold/600 | `#A6803D` |
| brand-gold/700 | `#85632F` |
| brand-gold/800 | `#5C4421` |
| brand-gold/900 | `#3A2B14` |
| brand-gold/950 | `#1F170B` |

#### Neutral
| Token | Hex |
|-------|-----|
| base/black | `#000000` |
| base/white | `#FFFFFF` |
| neutral/50 | `#FAFAF9` |
| neutral/100 | `#F4F4F2` |
| neutral/200 | `#E8E8E5` |
| neutral/300 | `#D2D2CD` |
| neutral/400 | `#A8A8A1` |
| neutral/500 | `#7A7A72` |
| neutral/600 | `#535350` |
| neutral/700 | `#383836` |
| neutral/800 | `#222220` |
| neutral/900 | `#141413` |
| neutral/950 | `#0A0A09` |

#### Success
| Token | Hex |
|-------|-----|
| success/50 | `#F0F7F0` |
| success/100 | `#D9EBD9` |
| success/200 | `#B4D6B4` |
| success/300 | `#83BB85` |
| success/400 | `#56A05B` |
| success/500 | `#3B8240` |
| success/600 | `#2E6633` |
| success/700 | `#244F28` |
| success/800 | `#1A3A1D` |
| success/900 | `#102311` |

#### Warning
| Token | Hex |
|-------|-----|
| warning/50 | `#FEF7EC` |
| warning/100 | `#FCEAC9` |
| warning/200 | `#F9D28D` |
| warning/300 | `#F5B452` |
| warning/400 | `#F09827` |
| warning/500 | `#D97A10` |
| warning/600 | `#B05E0B` |
| warning/700 | `#854509` |
| warning/800 | `#5C3007` |
| warning/900 | `#341A04` |

#### Error
| Token | Hex |
|-------|-----|
| error/50 | `#FEF1F1` |
| error/100 | `#FDDDDD` |
| error/200 | `#FBBABA` |
| error/300 | `#F58D8D` |
| error/400 | `#EA5A5A` |
| error/500 | `#D63838` |
| error/600 | `#B22424` |
| error/700 | `#8A1C1C` |
| error/800 | `#5F1313` |
| error/900 | `#360A0A` |

#### Info
| Token | Hex |
|-------|-----|
| info/50 | `#ECF7F9` |
| info/100 | `#CFEAEF` |
| info/200 | `#A0D4DE` |
| info/300 | `#6BB8C7` |
| info/400 | `#3F98AB` |
| info/500 | `#2A7B8E` |
| info/600 | `#216171` |
| info/700 | `#1A4B57` |
| info/800 | `#13343C` |
| info/900 | `#0B1E22` |

### 2.2 Semantic Color Tokens (Light / Dark)

#### Backgrounds
| Token | Light | Dark |
|-------|-------|------|
| `bg/primary` | `#FFFFFF` | `#0A0A09` |
| `bg/secondary` | `#FAFAF9` | `#141413` |
| `bg/tertiary` | `#F4F4F2` | `#222220` |
| `bg/inverse` | `#0A0A09` | `#FFFFFF` |
| `bg/brand` | `#3D6FF5` | `#3D6FF5` |
| `bg/brand-subtle` | `#EEF4FF` | `#06112E` |
| `bg/accent` | `#C5A572` | `#C5A572` |
| `bg/accent-subtle` | `#FBF6EC` | `#1F170B` |
| `bg/overlay` | `#0A0A09` | `#000000` |
| `bg/disabled` | `#F4F4F2` | `#222220` |
| `bg/hover` | `#FAFAF9` | `#222220` |
| `bg/pressed` | `#F4F4F2` | `#383836` |

#### Text
| Token | Light | Dark |
|-------|-------|------|
| `text/primary` | `#0A0A09` | `#FAFAF9` |
| `text/secondary` | `#383836` | `#E8E8E5` |
| `text/tertiary` | `#7A7A72` | `#A8A8A1` |
| `text/disabled` | `#D2D2CD` | `#535350` |
| `text/inverse` | `#FFFFFF` | `#0A0A09` |
| `text/brand` | `#2A55E0` | `#8BB0FF` |
| `text/accent` | `#A6803D` | `#DDBB73` |
| `text/on-brand` | `#FFFFFF` | `#FFFFFF` |
| `text/on-accent` | `#0A0A09` | `#0A0A09` |
| `text/link` | `#2A55E0` | `#8BB0FF` |
| `text/success` | `#2E6633` | `#83BB85` |
| `text/warning` | `#854509` | `#F5B452` |
| `text/error` | `#B22424` | `#F58D8D` |

#### Borders
| Token | Light | Dark |
|-------|-------|------|
| `border/default` | `#E8E8E5` | `#222220` |
| `border/subtle` | `#F4F4F2` | `#141413` |
| `border/strong` | `#A8A8A1` | `#535350` |
| `border/inverse` | `#0A0A09` | `#FFFFFF` |
| `border/brand` | `#3D6FF5` | `#5C8DFF` |
| `border/accent` | `#C5A572` | `#CFA34F` |
| `border/focus` | `#3D6FF5` | `#5C8DFF` |
| `border/error` | `#D63838` | `#EA5A5A` |
| `border/success` | `#3B8240` | `#56A05B` |
| `border/disabled` | `#E8E8E5` | `#383836` |

#### Icons
| Token | Light | Dark |
|-------|-------|------|
| `icon/default` | `#383836` | `#E8E8E5` |
| `icon/subtle` | `#7A7A72` | `#A8A8A1` |
| `icon/strong` | `#0A0A09` | `#FFFFFF` |
| `icon/inverse` | `#FFFFFF` | `#0A0A09` |
| `icon/brand` | `#2A55E0` | `#5C8DFF` |
| `icon/accent` | `#A6803D` | `#CFA34F` |
| `icon/on-brand` | `#FFFFFF` | `#FFFFFF` |
| `icon/disabled` | `#D2D2CD` | `#535350` |

#### Actions
| Token | Light | Dark |
|-------|-------|------|
| `action/primary/default` | `#2A55E0` | `#3D6FF5` |
| `action/primary/hover` | `#1E40B8` | `#5C8DFF` |
| `action/primary/pressed` | `#162F8A` | `#1E40B8` |
| `action/primary/disabled` | `#E8E8E5` | `#222220` |
| `action/secondary/default` | `#F4F4F2` | `#222220` |
| `action/secondary/hover` | `#E8E8E5` | `#383836` |
| `action/secondary/pressed` | `#D2D2CD` | `#535350` |
| `action/accent/default` | `#C5A572` | `#C5A572` |
| `action/accent/hover` | `#A6803D` | `#CFA34F` |
| `action/accent/pressed` | `#85632F` | `#85632F` |
| `action/destructive/default` | `#B22424` | `#D63838` |
| `action/destructive/hover` | `#8A1C1C` | `#EA5A5A` |
| `action/destructive/pressed` | `#5F1313` | `#8A1C1C` |

#### Feedback
| Token | Light | Dark |
|-------|-------|------|
| `feedback/success/bg` | `#F0F7F0` | `#102311` |
| `feedback/success/border` | `#83BB85` | `#244F28` |
| `feedback/success/icon` | `#2E6633` | `#83BB85` |
| `feedback/warning/bg` | `#FEF7EC` | `#341A04` |
| `feedback/warning/border` | `#F5B452` | `#854509` |
| `feedback/warning/icon` | `#B05E0B` | `#F5B452` |
| `feedback/error/bg` | `#FEF1F1` | `#360A0A` |
| `feedback/error/border` | `#F58D8D` | `#8A1C1C` |
| `feedback/error/icon` | `#B22424` | `#F58D8D` |
| `feedback/info/bg` | `#ECF7F9` | `#0B1E22` |
| `feedback/info/border` | `#6BB8C7` | `#1A4B57` |
| `feedback/info/icon` | `#216171` | `#6BB8C7` |

---

## 3. Typography

### 3.1 Font Families

| Role | Family | Usage |
|------|--------|-------|
| **Display** | Playfair Display | Hero headings, display text, brand statements |
| **UI / Body** | Inter | Headings, body, labels, buttons, captions |
| **Quote** | Playfair Display (Italic) | Blockquotes, testimonials |
| **Code** | JetBrains Mono | Code snippets, monospace content |

### 3.2 Font Size Scale (Variables)

| Token | Size |
|-------|------|
| `font/size/2xs` | 10px |
| `font/size/xs` | 11px |
| `font/size/sm` | 12px |
| `font/size/base` | 14px |
| `font/size/md` | 16px |
| `font/size/lg` | 18px |
| `font/size/xl` | 20px |
| `font/size/2xl` | 24px |
| `font/size/3xl` | 28px |
| `font/size/4xl` | 32px |
| `font/size/5xl` | 40px |
| `font/size/6xl` | 48px |
| `font/size/7xl` | 56px |
| `font/size/8xl` | 64px |
| `font/size/9xl` | 72px |

### 3.3 Font Weights

| Token | Weight |
|-------|--------|
| `font/weight/light` | 300 |
| `font/weight/regular` | 400 |
| `font/weight/medium` | 500 |
| `font/weight/semibold` | 600 |
| `font/weight/bold` | 700 |
| `font/weight/black` | 900 |

### 3.4 Line Heights

| Token | Value |
|-------|-------|
| `font/lineheight/tight` | 14px |
| `font/lineheight/snug` | 18px |
| `font/lineheight/normal` | 22px |
| `font/lineheight/relaxed` | 26px |
| `font/lineheight/loose` | 32px |
| `font/lineheight/display-sm` | 40px |
| `font/lineheight/display-md` | 48px |
| `font/lineheight/display-lg` | 56px |
| `font/lineheight/display-xl` | 72px |
| `font/lineheight/display-2xl` | 88px |

### 3.5 Letter Spacing

| Token | Value |
|-------|-------|
| `font/letterspacing/tighter` | -0.5px |
| `font/letterspacing/tight` | -0.32px |
| `font/letterspacing/normal` | 0px |
| `font/letterspacing/wide` | 0.4px |
| `font/letterspacing/wider` | 1.2px |
| `font/letterspacing/widest` | 2.4px |

### 3.6 Text Styles (Composite)

#### Display (Playfair Display Regular)
| Style | Size | Line Height | Letter Spacing |
|-------|------|-------------|----------------|
| Display/2XL | 72px | 80px | -1.5px |
| Display/XL | 56px | 64px | -1px |
| Display/L | 48px | 56px | -0.8px |
| Display/M | 40px | 48px | -0.4px |
| Display/S | 32px | 40px | -0.2px |

#### Headings (Inter Semi Bold)
| Style | Size | Line Height | Letter Spacing |
|-------|------|-------------|----------------|
| Heading/H1 | 32px | 40px | -0.5px |
| Heading/H2 | 28px | 36px | -0.4px |
| Heading/H3 | 24px | 32px | -0.3px |
| Heading/H4 | 20px | 28px | -0.2px |
| Heading/H5 | 18px | 26px | -0.1px |
| Heading/H6 | 16px | 22px | 0px |

#### Body (Inter)
| Style | Weight | Size | Line Height |
|-------|--------|------|-------------|
| Body/Large | Regular | 18px | 28px |
| Body/Large Bold | Semi Bold | 18px | 28px |
| Body/Default | Regular | 16px | 24px |
| Body/Default Bold | Semi Bold | 16px | 24px |
| Body/Small | Regular | 14px | 20px |
| Body/Small Bold | Semi Bold | 14px | 20px |
| Body/XSmall | Regular | 12px | 16px |

#### Labels (Inter Medium, UPPERCASE)
| Style | Size | Line Height | Letter Spacing |
|-------|------|-------------|----------------|
| Label/Large | 14px | 20px | 1.4px |
| Label/Default | 12px | 16px | 1.2px |
| Label/Small | 11px | 14px | 1px |

#### Captions (Inter)
| Style | Weight | Size | Line Height | Letter Spacing |
|-------|--------|------|-------------|----------------|
| Caption/Default | Regular | 12px | 16px | 0.1px |
| Caption/Bold | Semi Bold | 12px | 16px | 0.1px |

#### Quotes (Playfair Display Italic)
| Style | Size | Line Height |
|-------|------|-------------|
| Quote/Default | 18px | 28px |
| Quote/Large | 24px | 34px |

#### Code (JetBrains Mono Regular)
| Style | Size | Line Height |
|-------|------|-------------|
| Code/Default | 14px | 20px |
| Code/Small | 12px | 16px |

#### Buttons (Inter Semi Bold)
| Style | Size | Line Height | Letter Spacing |
|-------|------|-------------|----------------|
| Button/Large | 16px | 24px | 0px |
| Button/Default | 14px | 20px | 0px |
| Button/Small | 12px | 16px | 0.2px |

---

## 4. Spacing

| Token | Value |
|-------|-------|
| `spacing/0` | 0px |
| `spacing/0-5` | 2px |
| `spacing/1` | 4px |
| `spacing/1-5` | 6px |
| `spacing/2` | 8px |
| `spacing/3` | 12px |
| `spacing/4` | 16px |
| `spacing/5` | 20px |
| `spacing/6` | 24px |
| `spacing/7` | 28px |
| `spacing/8` | 32px |
| `spacing/10` | 40px |
| `spacing/12` | 48px |
| `spacing/14` | 56px |
| `spacing/16` | 64px |
| `spacing/20` | 80px |
| `spacing/24` | 96px |
| `spacing/32` | 128px |

**Base unit:** 4px grid system (multiples of 4)

---

## 5. Border Radius

| Token | Value |
|-------|-------|
| `radius/none` | 0px |
| `radius/xs` | 2px |
| `radius/sm` | 4px |
| `radius/md` | 8px |
| `radius/lg` | 12px |
| `radius/xl` | 16px |
| `radius/2xl` | 20px |
| `radius/3xl` | 24px |
| `radius/4xl` | 32px |
| `radius/full` | 9999px |

---

## 6. Border Width

| Token | Value |
|-------|-------|
| `border-width/0` | 0px |
| `border-width/1` | 1px |
| `border-width/2` | 2px |
| `border-width/3` | 3px |
| `border-width/4` | 4px |
| `border-width/8` | 8px |

---

## 7. Sizing

### Icons
| Token | Value |
|-------|-------|
| `sizing/icon/2xs` | 8px |
| `sizing/icon/xs` | 12px |
| `sizing/icon/sm` | 16px |
| `sizing/icon/md` | 20px |
| `sizing/icon/lg` | 24px |
| `sizing/icon/xl` | 32px |
| `sizing/icon/2xl` | 40px |
| `sizing/icon/3xl` | 48px |

### Controls
| Token | Value |
|-------|-------|
| `sizing/control/sm` | 28px |
| `sizing/control/md` | 36px |
| `sizing/control/lg` | 44px |
| `sizing/control/xl` | 52px |

### Avatars
| Token | Value |
|-------|-------|
| `sizing/avatar/xs` | 24px |
| `sizing/avatar/sm` | 32px |
| `sizing/avatar/md` | 40px |
| `sizing/avatar/lg` | 56px |
| `sizing/avatar/xl` | 80px |
| `sizing/avatar/2xl` | 128px |

### Containers (Breakpoints)
| Token | Value |
|-------|-------|
| `sizing/container/sm` | 640px |
| `sizing/container/md` | 768px |
| `sizing/container/lg` | 1024px |
| `sizing/container/xl` | 1280px |
| `sizing/container/2xl` | 1536px |

### Touch Target
| Token | Value |
|-------|-------|
| `sizing/touch-target/min` | 44px |

---

## 8. Elevation (Shadows)

| Level | Shadow 1 | Shadow 2 |
|-------|----------|----------|
| **Elevation/0** | none | — |
| **Elevation/1** | `0 1px 2px rgba(0,0,0,0.04)` | `0 1px 3px rgba(0,0,0,0.06)` |
| **Elevation/2** | `0 2px 4px rgba(0,0,0,0.05)` | `0 4px 8px rgba(0,0,0,0.06)` |
| **Elevation/3** | `0 4px 8px rgba(0,0,0,0.06)` | `0 8px 16px rgba(0,0,0,0.08)` |
| **Elevation/4** | `0 8px 16px rgba(0,0,0,0.08)` | `0 16px 32px rgba(0,0,0,0.12)` |
| **Elevation/5** | `0 16px 24px rgba(0,0,0,0.10)` | `0 24px 48px rgba(0,0,0,0.16)` |

### Special Effects
| Name | CSS |
|------|-----|
| **Focus/Ring** | `0 0 0 3px rgba(0,0,0,0.30)` |
| **Inset/Subtle** | `inset 0 1px 2px rgba(0,0,0,0.06)` |
| **Glow/Brand** | `0 0 24px rgba(0,0,0,0.40), 0 0 48px 8px rgba(0,0,0,0.20)` |

---

## 9. Opacity

| Token | Value |
|-------|-------|
| `opacity/0` | 0% |
| `opacity/5` | 5% |
| `opacity/10` | 10% |
| `opacity/20` | 20% |
| `opacity/30` | 30% |
| `opacity/40` | 40% |
| `opacity/50` | 50% |
| `opacity/60` | 60% |
| `opacity/70` | 70% |
| `opacity/80` | 80% |
| `opacity/90` | 90% |
| `opacity/95` | 95% |
| `opacity/100` | 100% |

---

## 10. UI Patterns & Components (from Investor Prototype)

### 10.1 Navigation Bar
- **Top bar:** Fixed, dark background (`bg/overlay` or semi-transparent dark)
- **Left:** Back arrow + Rechitta "R" logo icon
- **Center:** Project/location name in Label/Default uppercase
- **Right:** Mode toggle (Concierge Mode / Chat Mode) with icon
- **Height:** ~56px, consistent across mobile and desktop

### 10.2 Mode Selection Cards
- **Layout:** Side-by-side on desktop, stacked on mobile
- **Border:** 1px `border/default` (subtle neutral border)
- **Background:** Semi-transparent dark (`bg/secondary` in dark mode)
- **Content structure:**
  - Icon (top-left)
  - Sub-label in `text/accent` (brand-gold) — e.g., "Fully-guided"
  - Title in `text/primary` bold uppercase — e.g., "CONCIERGE MODE"
  - Description in `text/secondary`
- **Corner radius:** `radius/lg` (12px)

### 10.3 Feature/Topic Cards
- **Layout:** Horizontal row on desktop (4 columns), vertical stack on mobile
- **Border:** 1px neutral border with slight transparency
- **Background:** Dark, semi-transparent
- **Content structure:**
  - Icon badge (square, brand-gold background with icon) — top-left
  - Chevron arrow — top-right
  - Title in `text/primary` bold
  - Description in `text/secondary`
- **Corner radius:** `radius/lg` (12px)
- **Icon badge radius:** `radius/md` (8px)

### 10.4 Chat Input Bar
- **Position:** Fixed bottom
- **Background:** Dark (`bg/tertiary` in dark mode)
- **Label:** "ASK RECHITTA" in Label/Default style, `text/accent` (brand-gold)
- **Input:** Placeholder text "Type your message here..."
- **Send button:** Circular, brand-blue gradient with glowing effect (Glow/Brand), contains send/arrow icon
- **Corner radius:** `radius/xl` (16px) for the container

### 10.5 AI Agent Orb
- **Shape:** Circle with the "R" logo centered
- **Glow:** Cyan/blue radial glow emanating from behind
- **Background:** Dark gradient sphere
- **Usage:** Splash screens, onboarding, as the send button accent

### 10.6 Property Overview Header
- **Section label:** "THE OVERVIEW" in Label/Default, `text/accent` (brand-gold)
- **Property name:** Display/S or Heading/H1, `text/primary`
- **Metadata:** "HANDOVER Q3 2026" in Label/Default, `text/secondary`
- **Hero image:** Full-bleed or edge-to-edge with scroll indicator
- **AI quote bar:** Bottom overlay with "RECHITTA" label and italic quote text

### 10.7 Advisor Card
- **Layout:** Horizontal, centered
- **Avatar:** Circular with online status indicator (green dot)
- **Name:** `text/primary` bold
- **Role:** `text/secondary`
- **Notification:** `text/accent` (brand-gold)
- **Background:** Dark, semi-transparent with slight border

### 10.8 Splash / Welcome Screen
- **Background:** Full-screen dark atmospheric image/gradient
- **Logo:** Centered Rechitta orb with glow
- **Headline:** "MEET" label + "Rechitta, Your AI Agent" in Display style
  - "Rechitta," is bold (Playfair Display Bold), rest is regular
- **CTA button:** "Let's get started →" with dark background, `radius/full`

---

## 11. Key Design Principles

### Dark Mode First
The investor prototype is entirely dark-mode. The design system supports both light and dark via semantic tokens, but the primary brand experience is dark with warm gold highlights.

### Label Convention
Section labels and category names consistently use:
- **Style:** Label/Default or Label/Large
- **Transform:** UPPERCASE
- **Color:** `text/accent` (brand-gold) for primary labels
- **Letter spacing:** Wide (1.2px+)

### Hierarchy Pattern
1. **Label** — Small uppercase gold text (category/context)
2. **Title** — Large display or heading text (primary info)
3. **Supporting text** — Body or caption in secondary color (description)

### Card Pattern
All cards follow:
- Semi-transparent dark background
- 1px subtle border
- 12px corner radius
- 16–20px internal padding
- Icon + title + description layout

### Responsive Breakpoints
| Device | Width |
|--------|-------|
| Mobile (iPhone 13/14) | 390px |
| Mobile (iPhone 16/17 Pro) | 402px |
| Mobile (iPhone 14 Plus) | 428px |
| Tablet (iPad Pro 12.9") | 1024px |
| Desktop (MacBook Air) | 1280px |

### Glass/Transparency Effect
Several UI elements use semi-transparent backgrounds over dark atmospheric imagery, creating a layered depth effect. This is achieved with:
- Background opacity ~80-90%
- Subtle backdrop blur (when supported)
- 1px border at reduced opacity

---

## 12. CSS Variable Mapping (Reference)

```css
:root {
  /* Brand Colors */
  --color-brand-blue-500: #3D6FF5;
  --color-brand-blue-600: #2A55E0;
  --color-brand-gold-300: #DDBB73;
  --color-brand-gold-500: #C5A572;
  --color-brand-gold-600: #A6803D;

  /* Fonts */
  --font-display: 'Playfair Display', serif;
  --font-body: 'Inter', sans-serif;
  --font-code: 'JetBrains Mono', monospace;

  /* Spacing (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-1: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
  --shadow-2: 0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.06);
  --shadow-3: 0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.08);
  --shadow-4: 0 8px 16px rgba(0,0,0,0.08), 0 16px 32px rgba(0,0,0,0.12);
  --shadow-5: 0 16px 24px rgba(0,0,0,0.10), 0 24px 48px rgba(0,0,0,0.16);
}
```

---

## 13. Figma File Structure

### Design System File
| Page | Contents |
|------|----------|
| Cover | File cover art |
| Getting Started | Onboarding/usage guide |
| Logo | Brand mark assets |
| Colors | Color primitives + semantic tokens |
| Typography | Type ramp and text styles |
| Spacing | Spacing scale documentation |
| Radius | Corner radius scale |
| Effects | Elevation + special effects |
| Sizing | Icon, control, avatar, container sizes |
| Component Index | Component library reference |
| Changelog | Version history |

### Investor Prototype File
| Page | Contents |
|------|----------|
| Cover | File cover art |
| Final | Main prototype screens (mobile + desktop) |

**Screen inventory:** Splash, Intro/Onboarding, Mode Selection, Chat Mode, Concierge Mode, Dashboard, Property Overview, Insights bar (responsive across 5 breakpoints)
