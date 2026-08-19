/**
 * Page scroll progress t ∈ [0,1] (rAF-throttled), same definition as v1:
 * scrollY / (scrollHeight - viewportHeight). Drives the orb journey and
 * scene crossfades.
 */
export function useScrollProgress() {
  const t = ref(0)
  const viewportWidth = ref(0)

  let ticking = false
  function measure() {
    const max = document.documentElement.scrollHeight - window.innerHeight
    t.value = max > 0 ? window.scrollY / max : 0
    viewportWidth.value = window.innerWidth
    ticking = false
  }
  function onScroll() {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(measure)
    }
  }

  onMounted(() => {
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
  })
  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  })

  return { t, viewportWidth }
}

/** v1's multiMap: piecewise-linear interpolation over breakpoints. */
export function multiMap(value: number, stops: number[], outputs: number[]): number {
  if (value <= stops[0]) return outputs[0]
  for (let i = 1; i < stops.length; i++) {
    if (value <= stops[i]) {
      const p = (value - stops[i - 1]) / (stops[i] - stops[i - 1])
      return outputs[i - 1] + (outputs[i] - outputs[i - 1]) * p
    }
  }
  return outputs[outputs.length - 1]
}
