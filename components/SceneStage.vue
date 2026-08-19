<script setup lang="ts">
/**
 * Fixed full-viewport backdrop of Dubai scenes (ported from v1's scene-bg
 * system). Each scene is tied to a section on the home page and crossfades
 * in as that section approaches the viewport centre.
 *
 * The hero skyline carries v1's "dawn effect": warm golden-hour Dubai at
 * t=0 that cools to grey by t=0.20 — the moment the orb finishes absorbing
 * the colour.
 */
const { t } = useScrollProgress()

interface Scene {
  img: string
  target: string
  overlay: 'hero' | 'left' | 'right' | 'center'
  flip?: boolean
  position?: string
}

const scenes: Scene[] = [
  { img: '/scenes/background.png', target: '#hero', overlay: 'hero', position: 'center 78%' },
  { img: '/scenes/scene-curtainwall.png', target: '#languages', overlay: 'center' },
  { img: '/scenes/scene-canyon.png', target: '#developers', overlay: 'left' },
  { img: '/scenes/scene-canyon.png', target: '#brokers', overlay: 'right', flip: true },
  { img: '/scenes/scene-lobby.png', target: '#contact', overlay: 'center' }
]

const opacities = ref<number[]>(scenes.map((_, i) => (i === 0 ? 1 : 0)))

let raf = 0
function tick() {
  const vh = window.innerHeight
  opacities.value = scenes.map((s) => {
    const el = document.querySelector(s.target)
    if (!el) return 0
    const r = el.getBoundingClientRect()
    const center = r.top + r.height / 2
    // Fully visible when the section centre is near the viewport centre,
    // fading over ~0.9 viewport heights of distance.
    const dist = Math.abs(center - vh / 2)
    const span = Math.max(vh * 0.9, r.height / 2)
    return Math.max(0, Math.min(1, 1 - dist / span))
  })
  raf = requestAnimationFrame(tick)
}
onMounted(() => { raf = requestAnimationFrame(tick) })
onUnmounted(() => cancelAnimationFrame(raf))

/* v1 dawn effect (legacy/index.html:1422-1443): dawn=1 at t=0, 0 at t=0.20 */
const dawn = computed(() => Math.max(0, 1 - t.value / 0.2))
const heroFilter = computed(() => {
  const d = dawn.value
  const br = (1.0 + d * 0.35).toFixed(3)
  const sat = (1.0 + d * 0.9).toFixed(3)
  const sep = (d * 0.62).toFixed(3)
  const con = (1.0 - d * 0.18).toFixed(3)
  const hrot = Math.round(-22 * d)
  return `brightness(${br}) saturate(${sat}) sepia(${sep}) contrast(${con}) hue-rotate(${hrot}deg)`
})
const heroOverlayOpacity = computed(() => (0.6 + (1 - dawn.value) * 0.4).toFixed(3))
</script>

<template>
  <div class="scene-stage" aria-hidden="true">
    <div
      v-for="(s, i) in scenes"
      :key="s.target"
      class="scene"
      :style="{ opacity: opacities[i] }"
    >
      <img
        :src="s.img"
        alt=""
        :style="{
          objectPosition: s.position || 'center',
          transform: s.flip ? 'scaleX(-1)' : undefined,
          filter: i === 0 ? heroFilter : undefined
        }"
      />
      <div
        class="overlay"
        :class="`overlay--${s.overlay}`"
        :style="i === 0 ? { opacity: heroOverlayOpacity } : undefined"
      />
    </div>
  </div>
</template>

<style scoped>
.scene-stage {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.scene {
  position: absolute;
  inset: 0;
  will-change: opacity;
}
.scene img {
  position: absolute;
  left: 0;
  right: 0;
  top: -10%;
  width: 100%;
  height: 120%;
  object-fit: cover;
}
.overlay {
  position: absolute;
  inset: 0;
}

/* Ported from v1 scene overlays */
.overlay--hero {
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 9, 0.55) 0%,
    rgba(10, 10, 9, 0.1) 18%,
    rgba(10, 10, 9, 0) 38%,
    rgba(10, 10, 9, 0.6) 56%,
    rgba(10, 10, 9, 0.88) 70%,
    rgba(10, 10, 9, 0.97) 84%,
    rgba(10, 10, 9, 1) 100%
  );
}
.overlay--left {
  background:
    linear-gradient(105deg, rgba(10, 10, 9, 0.92) 0%, rgba(10, 10, 9, 0.78) 28%, rgba(10, 10, 9, 0.35) 50%, rgba(10, 10, 9, 0) 65%),
    linear-gradient(to bottom, rgba(10, 10, 9, 0.5) 0%, rgba(10, 10, 9, 0) 20%, rgba(10, 10, 9, 0) 65%, rgba(10, 10, 9, 0.6) 100%);
}
.overlay--right {
  background:
    linear-gradient(255deg, rgba(10, 10, 9, 0.92) 0%, rgba(10, 10, 9, 0.78) 28%, rgba(10, 10, 9, 0.35) 50%, rgba(10, 10, 9, 0) 65%),
    linear-gradient(to bottom, rgba(10, 10, 9, 0.5) 0%, rgba(10, 10, 9, 0) 20%, rgba(10, 10, 9, 0) 65%, rgba(10, 10, 9, 0.6) 100%);
}
.overlay--center {
  background:
    radial-gradient(ellipse 70% 80% at 50% 60%, rgba(10, 10, 9, 0.55) 0%, rgba(10, 10, 9, 0.85) 100%),
    linear-gradient(to bottom, rgba(10, 10, 9, 0.6) 0%, rgba(10, 10, 9, 0.2) 30%, rgba(10, 10, 9, 0.2) 65%, rgba(10, 10, 9, 0.75) 100%);
}
</style>
