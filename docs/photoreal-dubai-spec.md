# Photoreal Dubai flythrough — asset spec

The homepage backdrop (`components/CityScrub.client.vue`) is a cinematic
flythrough of the **real** Downtown Dubai, scrubbed by scroll. We need one clip.
This doc is the exact brief to produce it. Once you hand it over, drop it at
`public/video/dubai-flythrough.mp4` and set `VIDEO_SRC` in `CityScrub.client.vue`
— it's plug-and-play.

## The shot (matches the scroll narrative)

A single continuous descending push-in, ~12–18s, that the scroll scrubs:

1. **0–25% — Establish.** High wide aerial of Downtown Dubai at dusk/night,
   Burj Khalifa centred, lights on. Slow forward drift.
2. **25–45% — Approach.** Push toward one tower in the cluster (this becomes the
   "XYZ Developers" building). The flat office/TV overlay fades in over this.
3. **45–100% — Glide through.** Continue past/over the towers down toward the
   waterfront/skyline so the later sections (gaps → resolution) have moving
   backdrop. End on a calm wide hold.

Mood: blue-hour to night, warm window lights, premium and still — not frantic.

## Two ways to get it

### Option A — Google Earth Studio (free, photoreal, fast)
`earth.google.com/studio` — free, browser-based, renders real photoreal 3D of
Dubai. Best balance of real + free.
- New project, search **"Burj Khalifa, Dubai"**.
- Set camera keyframes for the push-in above (Earth Studio is keyframe-based;
  ~3 keyframes: wide high → approach mid → low glide).
- Time of day: set to dusk for warm light.
- Render: **1920×1080** (or 2560×1440), 30fps, MP4. ~12–18s.
- **Licensing:** Earth Studio output requires attribution and is limited to
  certain uses — confirm commercial terms for a company site before shipping
  (Google's "Earth Studio acceptable use"). If commercial use is restricted,
  use Option B.

### Option B — Licensed stock aerial (cleanest rights)
Buy a 4K cinematic Dubai Downtown / Burj Khalifa aerial or drone clip from a
stock site (Artgrid, Getty, Shutterstock, Pond5). Search "Dubai Downtown aerial
night 4K". Pick a slow push-in/descending move. Clear commercial license, no
attribution headaches. ~$50–200.

## Encoding (for smooth scroll-scrubbing)

Video `currentTime` seeking is only as smooth as the keyframe density. Encode
with frequent keyframes:

```
ffmpeg -i source.mp4 -an -vf "scale=1920:-2" -c:v libx264 -g 6 -keyint_min 6 \
  -preset slow -crf 22 -movflags +faststart public/video/dubai-flythrough.mp4
```

`-g 6` (a keyframe every 6 frames) makes seeking glassy. Target < 15MB so it's
under Cloudflare's 25MiB/file cap. Provide a `dubai-poster.jpg` (first frame)
for the initial paint.

## PRIMARY PATH — frame sequence (scroll renders the flythrough)

This is the chosen experience: scroll maps to a frame index painted to a canvas,
Apple-AirPods style. Frame-perfect, no codec-seek stutter. The engine is built
in `CityScrub.client.vue` — it just needs the frames.

**Produce the frames:**
1. Render/obtain the flythrough (Earth Studio export, or a licensed clip).
2. Extract frames:
   ```
   ffmpeg -i flythrough.mp4 -vf "fps=30,scale=1600:-2" frames/%04d.webp
   ```
   Aim for **150–240 frames** (≈5–8s at 30fps). More frames = smoother scrub but
   more to preload.
3. Compress: WebP quality ~72, target **30–60KB/frame** → ~180 frames ≈ 6–10MB
   total preload. (Cloudflare's 25MiB cap is per-file, so individual frames are
   never an issue — unlike a single big video.)
4. Drop them at `public/frames/dubai/0001.webp …` and set `FRAMES` in
   `CityScrub.client.vue`:
   ```ts
   const FRAMES = { count: 180, src: (i) => `/frames/dubai/${String(i + 1).padStart(4, '0')}.webp` }
   ```

Earth Studio can also export an image sequence directly (PNG) — skip step 2 and
just convert PNG→WebP. Provide a poster (frame 1) for first paint.

**Preload budget:** the engine loads all frames up front and draws the nearest
loaded frame while the rest arrive, so scrubbing never blanks. Keep the set lean
(≤~240 frames, WebP) so the page is interactive fast.

## What I need from you
- The clip (Option A export or Option B purchase), **or** a link to the stock
  clip you want and I'll guide the licensing.
- Confirmation of commercial-use rights (so we don't ship something unlicensed).
