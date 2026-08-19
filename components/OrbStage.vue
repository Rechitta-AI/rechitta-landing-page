<script setup lang="ts">
/**
 * Scroll-driven orb journey (ported from v1's updateOrb): the orb lives in a
 * fixed full-viewport layer, starts greyscale at the top of the page and
 * absorbs its colour by t=0.20 (in step with the skyline's dawn effect),
 * journeys right/left past the content sections, and — v1's signature ending —
 * drifts into the demo phone (#investor-phone) and is absorbed by the product.
 */
const { t, viewportWidth } = useScrollProgress()

const isMobile = computed(() => viewportWidth.value > 0 && viewportWidth.value <= 768)

/* v1 ease-in-out for the phone drift */
function easeInOut(p: number) {
  return p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p
}

/* Where the phone screen's centre sits relative to the viewport centre
   (v1 targeted 38% down the phone — where the orb appears in the product UI). */
function phoneTarget(): { xPx: number; yVh: number } {
  const phone = document.getElementById('investor-phone')
  if (!phone) return { xPx: 0, yVh: 0 }
  const r = phone.getBoundingClientRect()
  return {
    xPx: r.left + r.width * 0.5 - window.innerWidth * 0.5,
    yVh: ((r.top + r.height * 0.38 - window.innerHeight * 0.5) / window.innerHeight) * 100
  }
}

const DRIFT_START = 0.8
const DRIFT_END = 0.96

const orbStyle = computed(() => {
  const tv = t.value
  let xPx: number, yVh: number, scale: number, opacity: number

  if (tv <= DRIFT_START) {
    /* ── Journey: hero (centre, raised) → languages/developers (right)
       → brokers (left), v1 breakpoint style ── */
    let xVw: number
    if (isMobile.value) {
      xVw = 0
      yVh = multiMap(tv, [0, 0.12], [-16, 0])
      scale = multiMap(tv, [0, 0.12, 0.2], [1.05, 0.8, 0.62])
      opacity = multiMap(tv, [0, 0.1, 0.22, DRIFT_START], [0.9, 0.7, 0.3, 0.3])
    } else {
      xVw = multiMap(tv, [0, 0.1, 0.2, 0.42, 0.62, 0.7, DRIFT_START], [0, 0, 22, 22, 22, -22, -22])
      yVh = multiMap(tv, [0, 0.1, 0.2], [-14, -14, 0])
      scale = multiMap(tv, [0, 0.1, 0.2], [1.18, 1.18, 1])
      opacity = multiMap(tv, [0, 0.16, 0.24], [0.9, 0.9, 0.62])
    }
    xPx = (xVw / 100) * viewportWidth.value
  } else if (tv <= DRIFT_END) {
    /* ── v1 investor phase 2: drift into the demo phone ── */
    const e = easeInOut((tv - DRIFT_START) / (DRIFT_END - DRIFT_START))
    const startXPx = ((isMobile.value ? 0 : -22) / 100) * viewportWidth.value
    const end = phoneTarget()
    const startScale = isMobile.value ? 0.62 : 1
    const startOpacity = isMobile.value ? 0.3 : 0.62

    xPx = startXPx + (end.xPx - startXPx) * e
    yVh = end.yVh * e
    scale = startScale * (1 - e)
    opacity = startOpacity * (1 - e)
  } else {
    /* ── Fully absorbed into the demo ── */
    xPx = 0
    yVh = 0
    scale = 0
    opacity = 0
  }

  return {
    transform: `translateX(${xPx}px) translateY(${yVh}vh) scale(${scale})`,
    opacity: String(opacity)
  }
})

/* Slide under the finale content (its phone) once the drift begins */
const stageZ = computed(() => (t.value >= DRIFT_START ? 4 : 2))

/* v1: greyscale at top, full colour by t=0.20 (legacy/index.html:1656-1658) */
const innerFilter = computed(() => {
  const grey = Math.max(0, 1 - t.value / 0.2)
  const bright = 0.78 + (1 - grey) * 0.22
  return `grayscale(${grey.toFixed(3)}) brightness(${bright.toFixed(3)})`
})
</script>

<template>
  <div class="orb-stage" :style="{ zIndex: stageZ }" aria-hidden="true">
    <div class="orb-holder" :style="orbStyle">
      <TheOrb :inner-filter="innerFilter" />
    </div>
  </div>
</template>

<style scoped>
.orb-stage {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.orb-holder {
  will-change: transform, opacity;
}
</style>
