# Rechitta — "One Source of Truth" Scroll Film
## Veo / Flow Prompt Pack — v1.0

**How this works:** You never generate a transit video from a text prompt alone. You first generate and approve **keyframe stills** (cheap, fast to iterate), then use Flow's **first-frame → last-frame conditioning** to generate the 8-second transit *between* two approved stills. Where a transit ends at a portal (window, phone screen, bright sky), the next transit's first frame does NOT need to match perfectly — the portal hides the seam.

---

## 0 · Global Style Anchor

Paste this block at the end of **every** prompt (stills and video). Consistency comes from repetition.

```
Cinematic film still, shot on anamorphic lens, shallow depth of field,
golden-hour light: warm amber sun, deep teal shadows, gentle atmospheric haze.
Ultra-premium real estate film aesthetic. Photorealistic with subtle stylization,
clean modern architecture, immaculate surfaces. Rich contrast, filmic color grade
(teal and amber), soft bloom on highlights. No visible text, no logos, no signage,
no watermarks, no readable screens. 16:9 aspect ratio.
```

**Negative prompt (where the tool supports it):**

```
text, letters, numbers, logos, watermarks, signage, readable screens, UI elements,
distorted faces, extra fingers, cartoon, illustration, oversaturated, lens flare spam,
fisheye, low detail, motion blur smear
```

**Hard rules for every generation:**
- **No readable text or screens, ever.** Slides, phones, and dashboards are generated *blank or blurred* — the real content is a live HTML overlay I'm building. If a generation invents readable text, it's an automatic re-roll.
- **No close-up faces.** Silhouettes, backs of heads, hands. AI faces at rest-stop proximity break the premium feel and date the footage instantly.
- **Lock time-of-day per act** (see continuity table at the end).
- Generate at the highest resolution/quality tier available. We downscale later; we can never upscale honestly.

---

## 1 · Keyframe Stills

Iterate each until you'd frame it on a wall. These are the anchors — a mediocre keyframe poisons both transits touching it.

### KF-01 — Hero: The Sky Above Downtown
*(Hero backdrop · first frame of Transit A)*

```
Extreme high-altitude aerial view above Downtown Dubai at golden hour, looking down
and slightly forward at the Burj Khalifa and surrounding towers piercing through a
thin layer of warm haze. Vast open sky occupies the upper two-thirds of frame —
calm, gradient from deep teal-blue at top to warm amber at the horizon. The city
below feels miniature, orderly, glowing. Serene, godlike vantage point. Space in
the upper-center of the sky left visually clean and uncluttered.
+ [Global Style Anchor]
```
*Note: the clean upper-center sky is where the live Spline orb and "One source of truth" title sit. Re-roll anything with cloud clutter or birds in that zone.*

### KF-02 — The Window
*(last frame of Transit A · establishes the portal)*

```
Aerial camera position hovering close to the glass facade of a modern Dubai
skyscraper, roughly 40 floors up, golden hour. One large floor-to-ceiling boardroom
window dominates the frame, glass slightly reflective with the amber skyline
mirrored in it, but the warm-lit interior visible through it: a long dark
conference table, blurred silhouettes of people in business attire, a large bright
presentation screen glowing on the far wall — screen content completely out of
focus, just soft blocks of light. The glass fills the frame edge to edge, window
mullions visible only at the extreme edges of frame — the entire image is glass,
reflection, and warm interior light.
+ [Global Style Anchor]
```
*Note: full-frame glass is deliberate — it's the portal. At this frame, "outside"
and "inside" are optically identical, which is what lets the engine cross the
threshold with a reflection-wipe + bloom instead of generated footage.*

### KF-03 — Inside the Boardroom
*(Rest Stop 1 backdrop · first frame of Transit B)*

```
Interior of a premium high-rise boardroom in Dubai, golden hour light streaming
through floor-to-ceiling windows on the left showing the hazy skyline. Camera at
seated eye level, mid-room. A long dark walnut conference table, five or six people
seen from behind or in silhouette facing a large wall-mounted presentation screen.
The screen glows brightly but its content is completely blurred and unreadable —
abstract soft rectangles suggesting charts. One standing figure gestures toward the
screen. Quiet tension, high-stakes atmosphere. The screen occupies the upper-right
third of frame.
+ [Global Style Anchor]
```
*Note: the blurred screen's position in frame matters — my HTML overlay renders the real slide (stats, clickable problem chips) exactly over it. Upper-right third, generously sized.*

### KF-04 — Street Level: The Broker
*(last frame of Transit B, standard variant)*

```
Street level in Downtown Dubai at golden hour, Sheikh Zayed Road-style boulevard
with soft bokeh traffic lights in the deep background. A man in a sharp business
shirt, seen from chest down or from behind at an angle — face not visible — leaning
against a parked luxury sedan, holding a smartphone. The phone screen glows
white-cyan, completely blank, the brightest object in frame, drawing the eye.
Shallow depth of field, city dissolved into warm bokeh.
+ [Global Style Anchor]
```

### KF-04L — Street Level: The Lexus Variant *(optional, higher risk)*

```
Interior of a luxury sedan driving through Downtown Dubai at golden hour, camera
just inside the open panoramic sunroof looking down into the cabin. A man's hand
on the center console holding a smartphone with a glowing blank white-cyan screen.
Leather interior, amber light sweeping across surfaces, city towers visible
through the windshield in soft focus.
+ [Global Style Anchor]
```
*Expect a much higher re-roll count here — interior + motion + hands is a hard combination. If it fights you for more than ~10 rolls, take the standard variant and move on. The story beat is identical.*

### KF-05 — The Phone, Macro
*(Rest Stop 2 backdrop · first frame of Transit C)*

```
Extreme close-up macro shot: a smartphone held in a man's hand fills the entire
frame, screen facing camera, perfectly centered and square to the lens. The screen
is on but completely blank — a soft dark gradient with a faint cyan glow, no UI,
no text. Behind the phone, golden-hour Dubai street bokeh, deeply out of focus.
Premium product-photography feel.
+ [Global Style Anchor]
```
*Note: screen blank and square-on is critical — my live chat UI (the Rechitta briefing conversation) renders inside this screen area. Any perspective tilt over ~5° makes the overlay mapping look pasted.*

### KF-06 — The Beach Club
*(last frame of Transit C · Rest Stop 3 backdrop)*

```
A sunlit Mediterranean beach club, early afternoon — Amalfi coast feel: turquoise
sea, striped umbrellas softly out of focus, warm stone terrace. In the foreground,
a woman's hands holding a smartphone, seen over her shoulder — face not visible.
The phone screen is blank with a soft white glow. Sun glitter on the water,
relaxed luxury, completely different color temperature from Dubai: brighter,
airier, blue-and-white palette with warm skin tones.
+ [Global Style Anchor — replace "golden-hour" wording with "bright Mediterranean early-afternoon light"]
```
*The palette shift here is deliberate — it tells the "your buyer is anywhere in the world" story without a single word.*

### KF-07 — The Return: One Lit Window
*(mid-anchor of Transit D · DERIVED, not generated)*

Do **not** generate this frame. Derive it from your approved **KF-02**:
1. Regrade the exact approved still to blue hour — pull exposure down, shift the
   grade from amber/teal to deep teal-purple, kill the warm sky reflections.
2. Darken the interior glow so the whole facade reads as asleep.
3. Composite ONE warm amber window glow (the boardroom) with a faint cool
   dashboard-like light inside it.

Any photo editor does this in 20 minutes, or programmatically (ImageMagick):
`magick KF-02.png -modulate 55,70,100 -fill "#1B2A4A" -colorize 28% KF-07-base.png`
then composite the window glow as a soft radial layer.

*Why derived: the return only lands if the audience instantly recognizes the SAME
window from the descent. Generated lookalikes drift; regraded pixels cannot. This
is a match frame — identical composition, transformed state. That transformation
(dark tower, one live window) IS the story's resolution.*

### KF-08 — Finale Sky
*(last frame of Transit D · finale backdrop · DERIVED, not generated)*

Do **not** generate this frame. Derive it from your approved **KF-01**: regrade
the exact hero still to night-into-dawn — deep teal sky, city lights glittering,
thin warm band on the horizon. Same composition test as KF-01: the upper-center
sky stays clean for the orb, wordmark, and CTAs.

*The finale is the hero's match frame. Same vantage point, same city — the day
resolved. And because finale and hero share exact geometry, the page can close
the loop: a "begin again" moment can crossfade the finale back into the hero
seamlessly. One source of truth, full circle.*

---

## 2 · Transit Video Prompts (8s each, first-frame → last-frame conditioned)

Condition each on the two approved keyframes noted. Describe **camera motion only** — the endpoints already define the world.

### Transit A — The Descent *(KF-01 → KF-02)*

```
Smooth continuous aerial camera move: starting from a serene high-altitude view
above Downtown Dubai, the camera glides forward and descends in one graceful
uninterrupted motion toward a modern glass skyscraper, slowing as it approaches
a single large glowing boardroom window on an upper floor, ending with the glass
filling the entire frame — amber skyline reflections sliding off the edges as warm
interior light blooms through the glass. Constant gentle deceleration, no cuts,
no shake, drone-cinematography style, stately pace.
+ [Global Style Anchor]
```

#### The Glass Crossing (A → Rest Stop 1) — no generation needed
Transit A ends *outside* on full-frame glass; Rest Stop 1 opens *inside* (KF-03).
The crossing is an engine move, not a clip: as the scrub reaches the end of A,
skyline reflections wipe off and a warm bloom flash carries the frame across the
threshold, settling on KF-03. Same trick as Transit C's white-out — an amber
version at the window. (The reverse crossing needs nothing: Transit B *starts*
at KF-03 and exits through the window inside one continuous generated clip.)

**Fallback — micro-transit A2 (3–4s, KF-02 → KF-03), only if the bloom feels cheap:**

```
Short continuous camera move: the camera pushes slowly through a boardroom window
from outside to inside — skyline reflections on the glass wiping away as the warm
interior resolves into focus: dark conference table, silhouetted figures, glowing
blurred presentation screen. Refraction and soft bloom during the crossing.
+ [Global Style Anchor]
```

### Transit B — Out and Down *(KF-03 → KF-04 or KF-04L)*

```
Continuous camera move: starting inside a warm boardroom, the camera pulls back
and glides out through the floor-to-ceiling window into open air, then sweeps
downward along the glass facade of the tower in an accelerating descent, city
lights streaking gently, and decelerates smoothly at street level, settling on
a man holding a glowing smartphone beside a luxury sedan. One unbroken motion,
exhilarating but controlled, ending calm and stable.
+ [Global Style Anchor]
```
*The mid-clip facade descent is where Veo will drift most — that's fine, it's the fastest-moving moment and the eye can't audit it. Judge this clip on its first and last 1.5 seconds.*

### Transit C — Through the Screen *(KF-05 → KF-06)*

```
Continuous camera move: starting on an extreme close-up of a glowing smartphone
screen filling the frame, the camera pushes slowly forward INTO the screen's soft
white-cyan light until the frame is fully engulfed in bright light, then the light
resolves and recedes to reveal a sunlit Mediterranean beach club, the camera
pulling back and settling on a woman's hands holding a phone in the foreground,
turquoise sea behind. A portal transition through light, dreamlike but smooth.
+ [Global Style Anchor, noting the light/palette shift from Dubai golden hour to bright Mediterranean afternoon]
```
*The white-light engulfment is your friend: if the tool struggles with one continuous clip, generate this as TWO 4s clips — push-into-light and emerge-from-light — and I'll stitch them at the pure-white frame. Invisible.*

### Transit C2 — The World Montage *(COMPOSITED, not generated)*

The AHA beat: one briefing, every market, the same instant. Six hard match cuts —
phone and hands pixel-identical, the world changing behind them. Rest Stop 3
(Italy) plays first as the intimate buyer moment; the montage then bursts outward.

**Foreground — shoot it, don't generate it.** Photograph ONE plate: a hand holding
a phone, blank dark screen, soft neutral golden light, slightly over-the-shoulder.
A real hand survives six repeated viewings; AI hands do not. Cut it out once, keep
the screen clean — each language renders as a DOM overlay (also the only way to get
crisp Devanagari, Cyrillic, Arabic, and Han glyphs; Veo cannot typeset them).

**Backgrounds — six generated stills, no people, no hands.** Each prompt:
`background plate, no people, shallow depth of field, heavy bokeh, [scene], [local time]`
+ the Global Style Anchor with the grade swapped. All local times are the SAME
moment — Dubai 08:11 GST — the montage is literally simultaneous:

| Plate | Local time | Scene | Grade |
|---|---|---|---|
| Mumbai | 09:41 | Marine Drive curve, morning haze | Warm amber |
| Moscow | 07:11 | Stalinist high-rise silhouette, cold clear morning | Steel blue-grey |
| London | 05:11 | Terrace houses, pre-dawn drizzle glow | Deep navy |
| Shanghai | 12:11 | Pudong towers, bright noon haze | Cyan-white |
| Riyadh | 07:11 | Desert-modern villas, low early sun | Sand gold |
| Paris | 06:11 | Haussmann rooftops, lavender dawn | Violet-grey |

These are Dubai off-plan's real top source markets — developers will recognize
their own buyer map. Keep the roster honest to that.

**Assembly:** composite the same foreground over each plate with one
color-temperature adjustment per plate (plus a soft rim-light pass where the
plate is strongly directional). Heavy bokeh hides composite seams. In the engine
these are HARD cuts stepped on scroll — one flick, one country. No crossfades;
the cut IS the effect.

### Transit D — The Return *(KF-03D → KF-08)*

First derive **KF-03D**: regrade approved KF-03 to blue hour — cool the palette,
darken the room, night skyline through the windows — and shift the screen glow
from neutral white to a faint green-cyan. The screen content stays blurred; the
live world map (green dots pinging across the planet, same day) is a DOM overlay.
This is the film's third match frame: the screen that carried the problem slide
in Act 1 now carries the resolution.

```
Continuous camera move: starting inside a dim boardroom at dusk, night skyline
visible through floor-to-ceiling windows, a large wall screen glowing softly
green-cyan with blurred abstract shapes, the camera pulls back and glides out
through the window into open night air, rising up and away from the tower as
city lights recede below, ending on a vast serene night sky above the glittering
city, stars above, a thin warm band of light on the horizon. Ascending,
resolving, peaceful.
+ [Global Style Anchor — dusk/night grade]
```
*This replaces the old beach→sky clip — the riskiest generation in the film
(largest conceptual distance in one shot). The new Transit D mirrors Transit B's
window exit in reverse: a move Veo will already have proven it can do for you.
KF-07 becomes optional — the receding lit window now happens naturally inside
this clip; keep the derived KF-07 as a style reference for the window's glow.*

---

## 3 · Continuity Lock Table

| Act | Scenes | Time of day | Palette |
|---|---|---|---|
| I | Hero, descent, boardroom | Golden hour | Amber + teal |
| II | Street, broker phone | Golden hour (same) | Amber + teal, cyan phone glow |
| III | Beach, buyer phone | Mediterranean early afternoon | Turquoise + white + warm skin |
| III-b | World montage (6 composited plates) | Per-location local time — one simultaneous moment | Per-location grade; phone pixel-identical |
| IV | Boardroom map, return, finale | Blue hour → night-dawn | Deep teal + green map glow + city glitter |

Never mix grades within an act. Between acts, the portal (window / screen / light) carries the shift.

---

## 4 · Selection Checklist (score every generation before keeping)

1. **Endpoint fidelity** — do the first and last ~1.5s match the conditioned keyframes closely? (Mid-clip drift is forgivable; endpoint drift breaks the stitch.)
2. **No invented text/UI** — anywhere, any frame. Scrub the whole clip.
3. **Camera never reverses or stutters** — scroll-scrubbing amplifies any hitch, because users scrub back and forth.
4. **Consistent motion direction** — the scroll maps to one spatial direction per transit (down, out, in, up). A clip that wanders sideways feels broken under scrub.
5. **No faces resolve into detail** at any point.
6. **Portal moments are clean** — the darkest/brightest frame should be genuinely near-black or near-white; that's our stitch insurance.

Keep the best 2 per transit, not just 1 — when we scrub-test in the animatic engine, sometimes the "worse" clip scrubs better.

---

## 5 · Generation Order (do it in this sequence)

1. **KF-01 first — it's now three frames in one**: the hero, the finale (KF-08 via
   regrade), and Transit D's end anchor. Iterate it until it's flawless; it carries
   more weight than any other generation. KF-02 second, for the same reason (it
   becomes KF-07 via regrade).
2. KF-03 and KF-05 (the two rest stops where overlays must land — I need these
   early to calibrate overlay positioning).
3. Remaining keyframes and the six montage background plates; then derive
   KF-07/KF-08 from approved KF-02/KF-01 and KF-03D from approved KF-03. Shoot
   your hands-and-phone foreground photo any time — it gates the montage composite.
4. Transits, easiest first: A → C → D → B. B last because it's the hardest; by
   then you'll have prompt intuition. Transit D is now short and proven — it
   starts on derived KF-03D and mirrors Transit B's window exit in reverse,
   ending on derived KF-08. The montage itself needs no video generation at all.
