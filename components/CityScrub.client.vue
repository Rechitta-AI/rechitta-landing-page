<script setup lang="ts">
/**
 * Photoreal Dubai backdrop — committed photoreal lane (no stylised middle).
 *
 * THREE modes, in order of quality (first one configured wins):
 *  1. FRAMES  — scroll-driven frame sequence (Apple-style). A pre-rendered
 *     cinematic flythrough exported as N stills; scroll maps to a frame index
 *     painted to <canvas>. Frame-perfect, buttery — the target experience.
 *  2. VIDEO_SRC — scroll-scrubbed video (smoothness limited by codec seeking).
 *  3. Photo journey — REAL Dubai photography shipped with v1, crossfading on
 *     scroll. The live fallback so the city is real TODAY while frames are
 *     produced. See docs/photoreal-dubai-spec.md to generate the frame set.
 *
 * The Spline orb (TheOrb) composites on top via mix-blend: screen — brand rule:
 * only the Spline orb, never a stand-in.
 */

// When the frame set is ready, set FRAMES, e.g.:
//   { count: 180, src: (i) => `/frames/dubai/${String(i + 1).padStart(4, '0')}.webp` }
const FRAMES: { count: number; src: (i: number) => string } | null = null
const VIDEO_SRC: string | null = null

const { t } = useScrollProgress()

/* ── Mode 3 (fallback): real-photo journey ── */
const scenes = [
  { img: '/scenes/background.png', show: [-0.01, 0, 0.28, 0.4] },
  { img: '/scenes/scene-canyon.png', show: [0.28, 0.4, 0.58, 0.68] },
  { img: '/scenes/scene-curtainwall.png', show: [0.58, 0.68, 0.82, 0.9] },
  { img: '/scenes/scene-lobby.png', show: [0.82, 0.9, 1, 1] }
]
function bandOpacity(tv: number, [a, b, c, d]: number[]) {
  if (tv <= a || tv >= d) return 0
  if (tv < b) return (tv - a) / (b - a)
  if (tv > c) return 1 - (tv - c) / (d - c)
  return 1
}
const layers = computed(() =>
  scenes.map((s, i) => ({
    img: s.img,
    opacity: bandOpacity(t.value, s.show),
    transform: `scale(${(1.08 + t.value * 0.16 + i * 0.01).toFixed(3)}) translateY(${(-t.value * 4).toFixed(2)}%)`
  }))
)

const orbStyle = computed(() => {
  const tv = t.value
  return {
    transform: `translate(-50%, -50%) translate(${multiMap(tv, [0, 0.5, 1], [0, -12, 0])}vw, ${multiMap(tv, [0, 0.5, 1], [-6, 4, -2])}vh) scale(${multiMap(tv, [0, 0.85, 1], [0.82, 0.82, 1.05])})`
  }
})

/* ── Mode 1: frame-sequence canvas scrubber ── */
const canvas = ref<HTMLCanvasElement>()
const framesReady = ref(false)

onMounted(() => {
  if (FRAMES) return setupFrames()
  if (VIDEO_SRC) return setupVideo()
})

function setupFrames() {
  const cv = canvas.value!
  const ctx = cv.getContext('2d')!
  const imgs: HTMLImageElement[] = []
  let loaded = 0

  for (let i = 0; i < FRAMES!.count; i++) {
    const img = new Image()
    img.onload = () => { if (++loaded === FRAMES!.count) framesReady.value = true }
    img.src = FRAMES!.src(i)
    imgs.push(img)
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2)
    cv.width = window.innerWidth * dpr
    cv.height = window.innerHeight * dpr
  }
  resize()
  window.addEventListener('resize', resize)

  function draw(img: HTMLImageElement) {
    if (!img?.complete || !img.naturalWidth) return
    const cw = cv.width, ch = cv.height
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
  }

  let raf = 0
  let lastIdx = -1
  function tick() {
    const idx = Math.max(0, Math.min(FRAMES!.count - 1, Math.round(t.value * (FRAMES!.count - 1))))
    if (idx !== lastIdx) {
      // draw nearest loaded frame so scrubbing never blanks while preloading
      let probe = idx
      while (probe > 0 && !imgs[probe].complete) probe--
      draw(imgs[probe])
      lastIdx = idx
    }
    raf = requestAnimationFrame(tick)
  }
  tick()
  onUnmounted(() => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) })
}

const video = ref<HTMLVideoElement>()
function setupVideo() {
  const v = video.value!
  let duration = 0, shown = 0, raf = 0
  v.addEventListener('loadedmetadata', () => { duration = v.duration || 0 })
  function tick() {
    if (duration) {
      const target = t.value * duration
      shown += (target - shown) * 0.12
      if (Math.abs(target - shown) > 0.001) v.currentTime = shown
    }
    raf = requestAnimationFrame(tick)
  }
  tick()
  onUnmounted(() => cancelAnimationFrame(raf))
}
</script>

<template>
  <div class="scrub">
    <canvas v-if="FRAMES" ref="canvas" class="layer" />
    <video
      v-else-if="VIDEO_SRC"
      ref="video"
      :src="VIDEO_SRC"
      muted playsinline webkit-playsinline preload="auto"
      class="layer"
    />
    <template v-else>
      <div
        v-for="(l, i) in layers"
        :key="i"
        class="photo layer"
        :style="{ backgroundImage: `url(${l.img})`, opacity: l.opacity, transform: l.transform }"
      />
    </template>

    <div class="tint" aria-hidden="true" />
    <div class="orb-layer" :style="orbStyle"><TheOrb /></div>
    <div class="vignette" aria-hidden="true" />
    <div class="grain" aria-hidden="true" />
  </div>
</template>

<style scoped>
.scrub { position: fixed; inset: 0; z-index: 0; overflow: hidden; background: #05070f; }
.layer { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.photo { background-size: cover; background-position: center; will-change: opacity, transform; }

.tint {
  position: absolute; inset: 0; pointer-events: none;
  background:
    linear-gradient(to bottom, rgba(5, 7, 15, 0.45) 0%, rgba(5, 7, 15, 0.1) 35%, rgba(5, 7, 15, 0.55) 78%, rgba(5, 7, 15, 0.92) 100%),
    radial-gradient(120% 90% at 50% 30%, rgba(20, 32, 74, 0.25), transparent 60%);
}
.orb-layer {
  position: absolute; top: 42%; left: 50%;
  width: clamp(220px, 26vw, 380px); aspect-ratio: 1;
  mix-blend-mode: screen; z-index: 2; pointer-events: none;
}
.vignette {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background: radial-gradient(120% 100% at 50% 42%, transparent 50%, rgba(3, 5, 12, 0.72) 100%);
}
.grain {
  position: absolute; inset: 0; pointer-events: none; z-index: 1; opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
</style>
