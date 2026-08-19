<script setup lang="ts">
/**
 * The Rechitta orb — the Spline scene, ported faithfully from v1
 * (legacy/index.html #orb-*): iframe at 150% in a mix-blend-mode:screen
 * wrapper, NO mask of any kind. The scene's glow periodically fills the whole
 * frame, so any frame-edge fade reads as a visible square/octagon — v1 solved
 * this by compositing the orb over scene imagery (screen blend hides the
 * frame) and by the greyscale-at-top choreography, not by masking.
 *
 * `innerFilter` (e.g. the scroll-driven grayscale) must land on the SAME
 * element that carries mix-blend-mode — a filter on any wrapper would create
 * a new blending context and break the screen blend against the page.
 */
defineProps<{ innerFilter?: string }>()

const SPLINE_URL = 'https://my.spline.design/meeet-K190VICHbClCgQyBKYguhj6F/'

const revealed = ref(false)
function onIframeLoad() {
  setTimeout(() => (revealed.value = true), 150)
}

// The iframe `load` event is unreliable on client-side navigation (it can fire
// from cache before the listener attaches) — reveal after a grace period
// regardless, so the orb can never get stuck invisible.
onMounted(() => {
  setTimeout(() => (revealed.value = true), 2500)
})
</script>

<template>
  <div class="orb" :class="{ revealed }" aria-hidden="true">
    <div class="orb-inner" :style="innerFilter ? { filter: innerFilter } : undefined">
      <iframe :src="SPLINE_URL" title="Rechitta orb" allow="autoplay" @load="onIframeLoad" />
    </div>

    <img class="brand-icon" src="/brand/rechitta-icon.svg" alt="" />
  </div>
</template>

<style scoped>
.orb {
  position: relative;
  width: clamp(260px, 32vw, 420px);
  aspect-ratio: 1;
  opacity: 0;
  transition: opacity 1s ease;
}
.orb.revealed { opacity: 1; }

.orb-inner {
  position: absolute;
  inset: 0;
  mix-blend-mode: screen;
  animation: orbDrift 7s ease-in-out infinite;
  will-change: transform, filter;
}
/* v1 sizing — do not change: Spline's camera zoom is tied to frame size,
   so resizing the iframe rescales the orb itself. */
.orb-inner iframe {
  position: absolute;
  top: -25%;
  left: -25%;
  width: 150%;
  height: 150%;
  border: none;
  pointer-events: none;
}

@keyframes orbDrift {
  0%, 100% { transform: translate(0, 0); }
  30% { transform: translate(5px, -8px); }
  60% { transform: translate(-4px, 6px); }
}

.brand-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(36px, 5vw, 64px);
  z-index: 2;
  animation: orbDriftIcon 7s ease-in-out infinite;
}
@keyframes orbDriftIcon {
  0%, 100% { transform: translate(-50%, -50%) translate(0, 0); }
  30% { transform: translate(-50%, -50%) translate(5px, -8px); }
  60% { transform: translate(-50%, -50%) translate(-4px, 6px); }
}
</style>
