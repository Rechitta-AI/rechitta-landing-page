<template>
  <div class="cal-root">
    <img ref="imgEl" class="cal-img" :src="stillUrl" alt="" @load="onImgLoad" />
    <svg class="cal-svg">
      <polygon :points="polyPoints" class="cal-poly" />
    </svg>
    <div v-for="(pt, i) in vpQuad" :key="i" class="cal-handle" :style="{ left: pt[0] + 'px', top: pt[1] + 'px' }"
      @pointerdown.prevent="startDrag(i, $event)">{{ CORNERS[i] }}</div>
    <div class="cal-preview" ref="previewEl" :style="{ transform: previewMatrix }">
      <div class="cal-preview-inner">OVERLAY PREVIEW<br />{{ anchorId }}</div>
    </div>
    <div class="cal-panel">
      <div class="cal-title">CALIBRATION · {{ anchorId }} · {{ stillKey }}</div>
      <div class="cal-hint">Drag corners TL→TR→BR→BL onto the surface. Quad is stored in normalized image space (zoom-independent).</div>
      <code class="cal-json">{{ quadJson }}</code>
      <button class="cal-btn" @click="copyJson">{{ copied ? 'Copied ✓' : 'Copy quad JSON' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Dev-only overlay-registration calibration tool (PLAN Phase 1 §3).
 * Open /?calibrate=<anchorId> (dev only). The still renders with the same
 * cover math the engine uses at zoom 1; the four handles define the anchor
 * quad; the preview div shows the resulting matrix3d live. Copy the JSON
 * into manifest.json → anchors[anchorId].quad.
 */
import { quadToMatrix3d, imageQuadToViewport, type Quad } from '~/utils/homography'
import type { FilmManifest } from '~/utils/filmLoader'

const props = defineProps<{ anchorId: string; manifest: FilmManifest; filmBase: string }>()

const CORNERS = ['TL', 'TR', 'BR', 'BL']
const anchor = props.manifest.anchors[props.anchorId]
const stillKey = anchor?.still ?? 'kf-03'
const stillEntry = props.manifest.stills[stillKey]?.landscape
const stillUrl = `${props.filmBase.replace(/\/$/, '')}/${stillEntry?.src ?? ''}`

const imgEl = ref<HTMLImageElement>()
const previewEl = ref<HTMLElement>()
const natural = ref<[number, number]>(stillEntry?.size ?? [1280, 720])

// image-space normalized quad; seed from manifest or a centered default
const quad = ref<Quad>(
  (anchor?.quad as Quad) ?? [[0.35, 0.3], [0.65, 0.3], [0.65, 0.6], [0.35, 0.6]]
)
const vw = ref(0); const vhh = ref(0)
function measure() { vw.value = window.innerWidth; vhh.value = window.innerHeight }
onMounted(() => { measure(); addEventListener('resize', measure) })
onBeforeUnmount(() => removeEventListener('resize', measure))
function onImgLoad() {
  if (imgEl.value) natural.value = [imgEl.value.naturalWidth, imgEl.value.naturalHeight]
}

const vpQuad = computed<Quad>(() =>
  imageQuadToViewport(quad.value, natural.value[0], natural.value[1], vw.value || 1, vhh.value || 1, 1))
const polyPoints = computed(() => vpQuad.value.map((p) => p.join(',')).join(' '))
const previewMatrix = computed(() => {
  const el = previewEl.value
  return quadToMatrix3d(el?.offsetWidth || 300, el?.offsetHeight || 200, vpQuad.value)
})
const quadJson = computed(() =>
  '"quad": ' + JSON.stringify(quad.value.map((p) => p.map((x) => +x.toFixed(4)))))

let dragIdx = -1
function startDrag(i: number, e: PointerEvent) {
  dragIdx = i
  const move = (ev: PointerEvent) => {
    if (dragIdx < 0) return
    // invert the cover transform: viewport px → normalized image space
    const [iw, ih] = natural.value
    const k = Math.max(vw.value / iw, vhh.value / ih)
    const ox = (vw.value - iw * k) / 2, oy = (vhh.value - ih * k) / 2
    const q = quad.value.map((p) => [...p]) as Quad
    q[dragIdx] = [(ev.clientX - ox) / (iw * k), (ev.clientY - oy) / (ih * k)]
    quad.value = q
  }
  const up = () => { dragIdx = -1; removeEventListener('pointermove', move); removeEventListener('pointerup', up) }
  addEventListener('pointermove', move)
  addEventListener('pointerup', up)
}

const copied = ref(false)
async function copyJson() {
  await navigator.clipboard.writeText(quadJson.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
  console.log(`[calibration] ${props.anchorId} →`, quadJson.value)
}
</script>

<style scoped>
.cal-root { position: fixed; inset: 0; z-index: 100; background: #000; font-family: 'IBM Plex Mono', monospace; }
.cal-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.cal-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.cal-poly { fill: rgba(88, 200, 230, .12); stroke: #58C8E6; stroke-width: 1.5; stroke-dasharray: 6 4; }
.cal-handle { position: absolute; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%;
  background: rgba(232, 162, 75, .25); border: 2px solid #E8A24B; color: #F5C069; font-size: 9px;
  display: flex; align-items: center; justify-content: center; cursor: grab; user-select: none; touch-action: none; }
.cal-handle:active { cursor: grabbing; background: rgba(232, 162, 75, .5); }
.cal-preview { position: absolute; left: 0; top: 0; width: 300px; height: 200px; transform-origin: 0 0;
  background: rgba(6, 12, 20, .6); border: 1px dashed rgba(242, 220, 184, .5); pointer-events: none;
  display: flex; align-items: center; justify-content: center; }
.cal-preview-inner { color: #F2DCB8; font-size: 11px; letter-spacing: .15em; text-align: center; opacity: .8; }
.cal-panel { position: fixed; left: 18px; bottom: 18px; max-width: min(520px, 90vw); background: rgba(6, 12, 20, .92);
  border: 1px solid rgba(242, 220, 184, .25); border-radius: 10px; padding: 14px 16px; color: #F2DCB8; }
.cal-title { font-size: 11px; letter-spacing: .2em; color: #E8A24B; }
.cal-hint { font-size: 10px; opacity: .7; margin-top: 6px; line-height: 1.5; }
.cal-json { display: block; font-size: 10px; margin-top: 8px; color: #9FE8FF; word-break: break-all; }
.cal-btn { margin-top: 10px; font-family: inherit; font-size: 10.5px; letter-spacing: .1em; color: #070E16;
  background: #E8A24B; border: none; border-radius: 6px; padding: 8px 14px; cursor: pointer; }
</style>
