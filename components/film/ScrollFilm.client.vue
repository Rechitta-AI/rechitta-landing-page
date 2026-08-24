<template>
  <div class="film-root">
    <div ref="spacerEl" class="spacer"></div>
    <FilmEarthGlobe :progress="montProgress" :dash-progress="dashProgress" @orb-target="onOrbTarget" />
    <canvas ref="stageEl" id="film-stage"></canvas>
    <div class="flash-burn" :style="{ opacity: flashOpacity, pointerEvents: flashOpacity > 0 ? 'auto' : 'none' }"></div>

    <div ref="loaderEl" class="loader">
      <div class="mono">RECHITTA — LOADING FILM <span ref="ldEl">0%</span></div>
      <div class="bar"><i ref="ldbEl"></i></div>
    </div>

    <div ref="orbEl" class="orb"><canvas ref="orbGlEl" width="800" height="800"></canvas>
      <div class="ring"></div><div class="core"></div></div>

    <!-- Global HUD Overlays -->
    <div class="hud hud-badge">
      <div class="brand">RECHITTA</div>
      <div class="tag">REAL ESTATE INTELLIGENCE</div>
    </div>

    <div class="hud hud-context">
      <div class="line"></div>
      <div class="dot"></div>
      DUBAI <span>/ 2026</span>
    </div>

    <div ref="hudSceneEl" class="sr-only" aria-live="polite">SCENE 01 · THE SKY</div>
    
    <div class="hud hud-timeline">
      <div class="chapter-line"></div>
      <div class="chapter-dot" ref="chapterDotEl"></div>
      <div v-for="(s, i) in CHAPTERS" :key="s.id" class="chapter" :class="{ active: activeChapter === i }" :ref="(el) => { if (el) chapterEls[i] = el as HTMLElement }">
        <span class="num">{{ s.label.split(' ')[0] }}</span>
        <span class="lbl">{{ s.label.split(' ')[1] }}</span>
      </div>
    </div>

    <!-- Hero Overlay -->
    <div ref="ovHeroEl" class="ov on ov-hero">
      <div class="hero-grid">
        <div class="hero-content">
          <h1 class="display"><span ref="orbAnchorEl" class="orb-placeholder">O</span>ne source of truth.</h1>
          <p class="sub">Live developer inventory, translated into conversation — so every broker and every buyer speaks the same language.</p>
        </div>
      </div>
      <div class="scroll-indicator">
        <div class="lbl">SCROLL TO <span>DESCEND</span></div>
        <div class="line"></div>
        <div class="arrow-down"></div>
      </div>
    </div>

    <div ref="ovBoardEl" class="ov ov-board" style="opacity: 0; pointer-events: none; visibility: hidden;">
      <div class="slide-panel">
        <div class="eyebrow">Scene 03 · XYZ Developments — launch week</div>
        <h2 class="display">One launch. Thousands of briefings.</h2>
        <div class="chips">
          <button v-for="c in CHIPS" :key="c.id" class="chip" :data-d="c.id" @click="onChip(c.id)">{{ c.label }}</button>
        </div>
        <div v-for="c in CHIPS" :key="c.id + '-d'" class="chip-detail" :class="{ open: openChip === c.id }">{{ c.detail }}</div>
        <div class="slide-note">▸ Tap a stat. Keep scrolling — Rechitta takes it from here.</div>
      </div>
    </div>

    <div ref="ovMontEl" class="ov ov-montage">
      <div class="mont-caption"><span ref="mCityEl" class="m-city">MUMBAI</span><span ref="mTimeEl">09:41 local · the same moment</span></div>
      <div class="mont-screen">
        <div ref="mTxtEl" class="display">आपकी ब्रीफ़िंग तैयार है</div>
        <div ref="mSubEl" class="live">Hindi · live data</div>
      </div>
    </div>

    <div ref="ovDashEl" class="ov ov-dash">
      <div class="dash">
        <div class="eyebrow">The same screen · later that day</div>
        <div class="mapgrid" style="display: none;">
          <span v-for="(d, i) in DOTS" :key="i" class="dot" :class="{ hub: d.hub }"
            :style="{ left: d.x + '%', top: d.y + '%', '--d': d.d + 's' }"></span>
        </div>
        <div class="mapcap">One briefing · every market · the same day</div>
      </div>
    </div>

    <div ref="ovFinaleEl" class="ov ov-finale">
      <div class="wordmark">RECHITTA</div>
      <h2 class="display">One source of truth.</h2>
      <div class="ctas">
        <button class="btn" @click="onCta('developers')">For developers</button>
        <button class="btn ghost" @click="onCta('brokers')">For brokers</button>
      </div>
      <a class="inv" href="#" @click.prevent="onCta('investors')">Investors →</a>
    </div>

    <button ref="floatCtaEl" class="btn float-cta" @click="onCta('walkthrough')">Book a walkthrough</button>
  </div>
</template>

<script setup lang="ts">
/**
 * <ScrollFilm> — production port of the vanilla prototype engine
 * (prototype/template.html). The engine itself stays dependency-free
 * imperative canvas code by design; Vue only owns the DOM shell. Frames,
 * stills, plates and anchors come from manifest.json at `filmBase`
 * (public/film in dev, Blob/CDN in production) through a priority-queue
 * loader — nothing is bundled.
 *
 * Transits B/C/D: the descend/toBeach/ret scenes check the manifest for a
 * real sequence (transit-b/c/d) and scrub it when present; until then they
 * draw the prototype's procedural stand-ins. Assets slot in as they land —
 * no engine changes.
 */
import { quadToMatrix3d, imageQuadToViewport, type Quad } from '~/utils/homography'
import {
  createFilmLoader, resolveVariant, pickTier, frameUrl,
  type FilmManifest, type SeqVariant, type Orientation
} from '~/utils/filmLoader'
import gsap from 'gsap'

const props = defineProps<{ manifest: FilmManifest; filmBase: string }>()
const { track } = useTrack()

/* ---- template refs ---- */
const spacerEl = ref<HTMLElement>(); const stageEl = ref<HTMLCanvasElement>()
const loaderEl = ref<HTMLElement>(); const ldEl = ref<HTMLElement>(); const ldbEl = ref<HTMLElement>()
const orbEl = ref<HTMLElement>(); const orbGlEl = ref<HTMLCanvasElement>()
const orbAnchorEl = ref<HTMLElement>()
const hudSceneEl = ref<HTMLElement>()
const chapterDotEl = ref<HTMLElement>()
const chapterEls = ref<HTMLElement[]>([])
const ovHeroEl = ref<HTMLElement>(); const ovBoardEl = ref<HTMLElement>()
const ovMontEl = ref<HTMLElement>(); const ovDashEl = ref<HTMLElement>()
const ovFinaleEl = ref<HTMLElement>(); const floatCtaEl = ref<HTMLElement>()
const mCityEl = ref<HTMLElement>(); const mTimeEl = ref<HTMLElement>()
const mTxtEl = ref<HTMLElement>(); const mSubEl = ref<HTMLElement>()

/* ---- overlay copy (Vue-owned state; engine only drives opacity/transform) ---- */
const CHIPS = [
  { id: 'd1', label: 'Thousands of brokers to brief', detail: 'Every Dubai launch depends on an open broker network. Reaching it means roadshows, call centres, and repeated in-person sessions — for every single project.' },
  { id: 'd2', label: '40+ nationalities', detail: 'Brokers — and their buyers — work in dozens of languages. A PDF speaks one. The message fragments the moment it leaves the boardroom.' },
  { id: 'd3', label: 'Weeks-long briefing cycle', detail: 'By the time the last broker is briefed, the first briefing is already stale. The market pitches yesterday’s project.' },
  { id: 'd4', label: 'Prices move weekly', detail: 'Inventory and pricing shift constantly during a launch. There is no channel that keeps every broker current — until now.' }
]
const openChip = ref<string | null>(null)
function onChip(id: string) {
  openChip.value = openChip.value === id ? null : id
  if (openChip.value) track('chip_opened', { id })
}
const L: Record<string, { t: string; b: string; l: string }> = {
  en: { t: 'Your briefing is ready', b: 'Vela Bay Tower, Unit 1404 — one-bedroom, marina-facing, AED 2.05M. Handover Q4 2027. Ask me anything about it.', l: 'Answers grounded in live developer data' },
  it: { t: 'Il tuo briefing è pronto', b: 'Vela Bay Tower, Unità 1404 — monolocale con vista marina, AED 2,05M. Consegna Q4 2027. Chiedimi qualsiasi cosa.', l: 'Risposte basate su dati live dello sviluppatore' },
  ru: { t: 'Ваш брифинг готов', b: 'Vela Bay Tower, апартамент 1404 — одна спальня, вид на марину, AED 2,05M. Сдача — Q4 2027. Задайте мне любой вопрос.', l: 'Ответы на основе живых данных застройщика' }
}
const lang = ref('en')
function onLang(l: string) { lang.value = l; track('lang_toggled', { lang: l }) }
const DOTS = [
  { x: 58, y: 52, d: 0, hub: true }, { x: 66, y: 57, d: 0.15 }, { x: 46, y: 31, d: 0.3 },
  { x: 56, y: 24, d: 0.45 }, { x: 79, y: 44, d: 0.6 }, { x: 55, y: 47, d: 0.75 },
  { x: 49, y: 27, d: 0.9 }, { x: 71, y: 63, d: 1.05 }, { x: 38, y: 55, d: 1.2 }
]

/* ---- timeline (verbatim from the prototype) ---- */
type SegDef = { id: string; type: string; w: number; scene: string; label: string; shortLabel?: string; a: number; b: number }
const SEGS: SegDef[] = [
  { id: 'hero', type: 'hold', w: 0.9, scene: 'sky', label: 'SCENE 01 · THE SKY', shortLabel: 'HERO', a: 0, b: 0 },
  { id: 'tA', type: 'transit', w: 1.3, scene: 'approach', label: 'TRANSIT A · THE DESCENT', a: 0, b: 0 },
  { id: 'rest1', type: 'rest', w: 1.6, scene: 'boardroom', label: 'SCENE 03 · THE BOARDROOM', shortLabel: 'BOARDROOM', a: 0, b: 0 },
  { id: 'tB', type: 'transit', w: 2.5, scene: 'descend', label: 'SCENE 05 · THE BROKER', shortLabel: 'BROKER', a: 0, b: 0 },
  { id: 'tC', type: 'transit', w: 1.5, scene: 'toBeach', label: 'SCENE 07 · THE BUYER', shortLabel: 'BUYER', a: 0, b: 0 },
  { id: 'mont', type: 'transit', w: 1.3, scene: 'montage', label: 'SCENE 08 · ONE MOMENT, EVERY MARKET', shortLabel: 'WORLD', a: 0, b: 0 },
  { id: 'tD', type: 'transit', w: 1.5, scene: 'ret', label: 'TRANSIT D · THE RETURN', a: 0, b: 0 },
  { id: 'finale', type: 'hold', w: 1.0, scene: 'finale', label: 'SCENE 09 · ONE SOURCE OF TRUTH', shortLabel: 'RETURN', a: 0, b: 0 },
  { id: 'loop', type: 'transit', w: 0.9, scene: 'sunrise', label: 'SCENE 10 · A NEW DAY — BEGIN AGAIN', a: 0, b: 0 }
].map((s) => ({ ...s, a: 0, b: 0 }))
let acc = 0
SEGS.forEach((s) => { s.a = acc; acc += s.w; s.b = acc })
const TOTAL = acc

const CHAPTERS = [
  { id: 'hero', label: '01 HERO', map: ['hero', 'tA'] },
  { id: 'rest1', label: '02 BOARDROOM', map: ['rest1'] },
  { id: 'rest2', label: '03 BROKER', map: ['tB'] },
  { id: 'rest3', label: '04 BUYER', map: ['tC'] },
  { id: 'mont', label: '05 WORLD', map: ['mont', 'tD', 'finale', 'loop'] }
]
const activeChapter = ref(0)

const montProgress = ref(-1)
const dashProgress = ref(-1)
const flashOpacity = ref(0)
const earthOrbTarget = ref<{x: number, y: number, s: number, visible: boolean} | null>(null)
function onOrbTarget(val: any) {
  earthOrbTarget.value = val
}

function onSendClient() {
  track('send_to_client_clicked')
  const target = SEGS.find((s) => s.id === 'tC')!
  window.scrollTo({ top: (target.a + 0.1) * vh, behavior: 'smooth' })
}
function onCta(cta: string) {
  track('cta_clicked', { cta, scene: currentSegId })
  if (cta === 'developers' || cta === 'brokers') navigateTo('/' + cta)
}

/* ---- engine state ---- */
let vh = 0, W = 0, H = 0, DPR = 1
let currentSegId = 'hero'
let raf = 0
let cleanup: Array<() => void> = []

onMounted(() => {
  const M = props.manifest
  const base = props.filmBase.replace(/\/$/, '')
  const cv = stageEl.value!
  const cx = cv.getContext('2d')!
  const orb = orbEl.value!
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  /* ---- scroll proxy (GSAP) ---- */
  const scrollProxy = { t: 0 }
  const updateScroll = gsap.quickTo(scrollProxy, "t", { duration: 0.8, ease: "power2.out" })

  /* ---- orientation & tier (portrait is a first-class dimension) ---- */
  const orientation = (): Orientation => (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')

  /* ---- asset loading: priority queue, manifest-driven ---- */
  const loader = createFilmLoader(6)
  const still = (k: string, pr: number) => {
    const v = resolveVariant<{ src: string }>(M.stills[k], orientation())
    return v ? loader.image(`still:${k}:${orientation()}`, `${base}/${v.src}`, pr) : new Image()
  }
  const plate = (k: string, pr: number) => {
    const v = resolveVariant<{ src: string }>(M.plates[k], orientation())
    return v ? loader.image(`plate:${k}:${orientation()}`, `${base}/${v.src}`, pr) : new Image()
  }
  const seqCache = new Map<string, HTMLImageElement[]>()
  const seq = (name: string, basePr: number): HTMLImageElement[] | null => {
    const v = resolveVariant<SeqVariant>(M.sequences[name], orientation())
    if (!v) return null
    const tier = pickTier(v.tiers, window.innerWidth, devicePixelRatio || 1)
    const key = `seq:${name}:${orientation()}:${tier}`
    let imgs = seqCache.get(key)
    if (!imgs) {
      imgs = Array.from({ length: v.frames }, (_, i) =>
        loader.image(`${key}:${String(i).padStart(3, '0')}`, frameUrl(base, v, tier, i), i < 12 ? basePr : basePr + 1))
      seqCache.set(key, imgs)
    }
    return imgs
  }

  const S: Record<string, HTMLImageElement> = {
    kf1: still('kf-01', 0), kf3: still('kf-03', 2), kf4: still('kf-04', 3),
    kf5: still('kf-05', 2), kf6: still('kf-06', 2)
  }
  S.hand = loader.image('sprite:hand', `${base}/${M.sprites.hand.src}`, 3)
  const PIM: Record<string, HTMLImageElement> = {}
  ;['mumbai', 'moscow', 'london', 'shanghai', 'riyadh', 'paris'].forEach((k) => { PIM[k] = plate(k, 4) })
  const taImgs = seq('transit-a', 0)!  // hero transit always exists
  const s13Imgs = seq('scene1-3', 0)  // new scene 1-3 continuous sequence

  // QA handle (see HANDOFF): asset readiness + a seek() that skips the scroll
  // smoothing — headless verification and calibration both need to land on an
  // exact playhead without waiting for the lerp.
  ;(window as any).__DBG = {
    S, PIM, taCount: taImgs.length, s13Count: s13Imgs?.length, loader,
    seek: (tt: number) => { window.scrollTo(0, tt * vh); dT = tt },
    state: () => ({ T, dT, seg: currentSegId })
  }

  /* loader overlay clears when the film can start: hero still + first 12 frames */
  const firstPaintReady = () =>
    s13Imgs ? s13Imgs.slice(0, 12).every(ready) : (ready(S.kf1) && taImgs.slice(0, 12).every(ready))
  loader.onProgress(() => {
    const { loaded, total } = loader.stats()
    const pc = Math.round((loaded / Math.max(1, total)) * 100)
    if (ldEl.value) ldEl.value.textContent = pc + '%'
    if (ldbEl.value) ldbEl.value.style.width = pc + '%'
    if (firstPaintReady()) loaderEl.value?.classList.add('done')
  })
  const failsafe = setTimeout(() => loaderEl.value?.classList.add('done'), 5000)
  cleanup.push(() => clearTimeout(failsafe))

  /* approach-based priority boost: current segment −3, next −2, after −1 */
  const SEG_ASSETS: Record<string, string[]> = {
    hero: s13Imgs ? ['seq:scene1-3'] : ['still:kf-01'], tA: s13Imgs ? ['seq:scene1-3'] : ['seq:transit-a'], rest1: s13Imgs ? ['seq:scene1-3'] : ['still:kf-03'],
    tB: ['seq:transit-b'], tC: ['seq:transit-c'],
    mont: ['plate:', 'sprite:hand'], tD: ['seq:transit-d'],
    finale: ['still:kf-01'], loop: ['still:kf-01']
  }
  function boostAround(segIdx: number) {
    for (let d = 0; d < 3; d++) {
      const s = SEGS[segIdx + d]
      if (!s) break
      SEG_ASSETS[s.id]?.forEach((prefix) => loader.boost(prefix, d - 3))
    }
  }

  /* ---- canvas sizing ---- */
  function resize() {
    vh = document.documentElement.clientHeight || window.innerHeight
    DPR = Math.min(devicePixelRatio || 1, 2)
    W = window.innerWidth; H = vh
    cv.width = W * DPR; cv.height = H * DPR
    cv.style.width = W + 'px'; cv.style.height = H + 'px'
    cx.setTransform(DPR, 0, 0, DPR, 0, 0)
    spacerEl.value!.style.height = (TOTAL + 1) * 100 + 'vh'
  }
  addEventListener('resize', resize)
  cleanup.push(() => removeEventListener('resize', resize))
  resize()

  /* ---- draw helpers (verbatim port) ---- */
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const easeF = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t))
  const rng = (s: number) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const r1 = rng(7)
  const FAR = [...Array(34)].map((_, i) => ({ x: i / 34 + r1() * 0.02, w: 0.018 + r1() * 0.03, h: 0.10 + r1() * 0.16 }))
  const NEAR = [...Array(15)].map((_, i) => ({ x: i / 15 + r1() * 0.03, w: 0.035 + r1() * 0.05, h: 0.18 + r1() * 0.30, spire: r1() > 0.85 }))
  const STARS = [...Array(120)].map(() => ({ x: r1(), y: r1() * 0.6, s: r1() * 1.4 + 0.3, tw: r1() * 6 }))
  const BOKEH = [...Array(26)].map(() => ({ x: r1(), y: r1(), r: 8 + r1() * 38, c: r1() }))
  const MONT = [
    { k: 'mumbai', city: 'MUMBAI', t: '09:41', g: ['#F5C069', '#8A4A2A', '#3A1F14'], txt: 'आपकी ब्रीफ़िंग तैयार है', sub: 'Hindi' },
    { k: 'moscow', city: 'MOSCOW', t: '07:11', g: ['#9FB6C8', '#4A5E72', '#1C2836'], txt: 'Ваш брифинг готов', sub: 'Russian' },
    { k: 'london', city: 'LONDON', t: '05:11', g: ['#33415A', '#1E2A40', '#0C1220'], txt: 'Your briefing is ready', sub: 'English' },
    { k: 'shanghai', city: 'SHANGHAI', t: '12:11', g: ['#BFDCE8', '#6FA3B8', '#2E5866'], txt: '您的简报已准备好', sub: 'Mandarin' },
    { k: 'riyadh', city: 'RIYADH', t: '07:11', g: ['#E8C08A', '#A87840', '#503418'], txt: 'ملخصك جاهز', sub: 'Arabic' },
    { k: 'paris', city: 'PARIS', t: '06:11', g: ['#C6B8D8', '#7A6E96', '#302A48'], txt: 'Votre briefing est prêt', sub: 'French' }
  ]

  const ready = (img?: HTMLImageElement) => !!img && img.complete && img.naturalWidth > 0
  let boardZoom = 1.02 // current boardroom zoom — anchor overlay tracks it
  function drawCover(img: HTMLImageElement, zoom = 1) {
    if (!ready(img)) return false
    const k = Math.max(W / img.naturalWidth, H / img.naturalHeight) * zoom
    const dw = img.naturalWidth * k, dh = img.naturalHeight * k
    cx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
    return true
  }
  function seqFrame(imgs: HTMLImageElement[], idx: number) {
    for (let i = Math.min(idx, imgs.length - 1); i >= 0; i--) if (ready(imgs[i])) return imgs[i]
    return null
  }
  function skyGrad(topC: string, midC: string, botC: string, hb = 0.72) {
    const g = cx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, topC); g.addColorStop(hb, midC); g.addColorStop(1, botC)
    cx.fillStyle = g; cx.fillRect(0, 0, W, H)
  }
  function sun(x: number, y: number, r: number, c1: string, c2: string) {
    const g = cx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, c1); g.addColorStop(1, c2)
    cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill()
  }
  function skyline(scale: number, cxp: number, cyp: number, horizon: number, alphaFar = 1, alphaNear = 1) {
    const hx = W * cxp, hy = H * cyp
    cx.save(); cx.translate(hx, hy); cx.scale(scale, scale); cx.translate(-hx, -hy)
    cx.globalAlpha = alphaFar; cx.fillStyle = '#132638'
    FAR.forEach((b) => cx.fillRect(b.x * W, H * horizon - b.h * H, b.w * W, b.h * H + H * 0.3))
    cx.globalAlpha = alphaNear; cx.fillStyle = '#0B1826'
    NEAR.forEach((b) => {
      const bx = b.x * W, bw = b.w * W, bh = b.h * H, by = H * horizon - bh
      cx.fillRect(bx, by, bw, bh + H * 0.3)
      if (b.spire) { cx.beginPath(); cx.moveTo(bx + bw * 0.5 - bw * 0.08, by); cx.lineTo(bx + bw * 0.5, by - bh * 0.5); cx.lineTo(bx + bw * 0.5 + bw * 0.08, by); cx.fill() }
    })
    cx.globalAlpha = 1; cx.restore()
  }
  function rr(x: number, y: number, w: number, h: number, r: number) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath() }
  function phoneFrame(cxp: number, cyp: number, ph: number, warm = false, glow = 1) {
    const pw = ph * 0.48, x = W * cxp - pw / 2, y = H * cyp - ph / 2
    const g = cx.createRadialGradient(W * cxp, H * cyp, 10, W * cxp, H * cyp, ph * 0.9)
    g.addColorStop(0, warm ? `rgba(245,230,200,${0.28 * glow})` : `rgba(88,200,230,${0.22 * glow})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    cx.fillStyle = g; cx.fillRect(x - ph * 0.6, y - ph * 0.4, pw + ph * 1.2, ph * 1.6)
    cx.fillStyle = '#05090F'; rr(x - 6, y - 6, pw + 12, ph + 12, 26); cx.fill()
    cx.fillStyle = warm ? 'rgba(28,36,44,.96)' : 'rgba(9,16,24,.96)'; rr(x, y, pw, ph, 20); cx.fill()
    cx.strokeStyle = 'rgba(159,232,255,.25)'; cx.lineWidth = 1.2; rr(x, y, pw, ph, 20); cx.stroke()
  }
  function vignette(a: number) {
    const g = cx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95)
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`)
    cx.fillStyle = g; cx.fillRect(0, 0, W, H)
  }
  function duskRoom(dx: number) {
    const g = cx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#101A28'); g.addColorStop(1, '#05070C')
    cx.fillStyle = g; cx.fillRect(0, 0, W, H)
    cx.save(); cx.beginPath(); cx.rect(-dx * 0.4, 0, W * 0.24, H); cx.clip()
    skyGrad('#060D1A', '#16243A', '#2E2438', 0.75)
    cx.fillStyle = 'rgba(232,162,75,.5)'
    for (let i = 0; i < 26; i++) { cx.fillRect((i * 53) % Math.max(1, Math.floor(W * 0.24)), H * (0.5 + ((i * 37) % 40) / 100), 3, 2) }
    cx.restore()
    const sx = W * 0.5 + dx, sy = H * 0.12, sw = W * 0.42, sh = H * 0.5
    sun(sx + sw / 2, sy + sh / 2, sw * 0.72, 'rgba(111,232,168,.15)', 'rgba(111,232,168,0)')
    cx.fillStyle = '#0D0F12'
    cx.beginPath(); cx.ellipse(W * 0.45 + dx * 0.6, H * 0.94, W * 0.42, H * 0.14, 0, 0, 7); cx.fill()
    cx.fillStyle = '#030405'
    ;[[0.2, 0.86], [0.76, 0.87]].forEach(([fx, fy]) => {
      cx.beginPath(); cx.arc(W * fx + dx * 0.8, H * fy - H * 0.14, H * 0.045, 0, 7); cx.fill()
      cx.beginPath(); cx.ellipse(W * fx + dx * 0.8, H * fy, H * 0.085, H * 0.12, 0, Math.PI, 0); cx.fill()
    })
    vignette(0.55)
  }

  /* per-city hand grading: cached offscreen sprites (see HANDOFF — Vision matte) */
  const HAND_GRADE: Record<string, [string, string]> = {
    mumbai: ['brightness(1.32) saturate(1.02)', 'rgba(255,178,96,.16)'],
    moscow: ['brightness(1.18) saturate(.92)', 'rgba(150,178,214,.18)'],
    london: ['brightness(1.02)', 'rgba(70,92,140,.14)'],
    shanghai: ['brightness(1.42) saturate(.9)', 'rgba(214,228,238,.20)'],
    riyadh: ['brightness(1.28)', 'rgba(242,204,132,.16)'],
    paris: ['brightness(1.14)', 'rgba(178,158,208,.16)']
  }
  const handTints: Record<string, HTMLCanvasElement> = {}
  function tintedHand(k: string) {
    if (handTints[k]) return handTints[k]
    const [flt, tint] = HAND_GRADE[k] || ['brightness(1)', 'rgba(0,0,0,0)']
    const c = document.createElement('canvas')
    c.width = S.hand.naturalWidth; c.height = S.hand.naturalHeight
    const g = c.getContext('2d')!
    g.filter = flt; g.drawImage(S.hand, 0, 0); g.filter = 'none'
    g.globalCompositeOperation = 'source-atop'
    g.fillStyle = tint; g.fillRect(0, 0, c.width, c.height)
    handTints[k] = c; return c
  }

  /* ---- scenes (verbatim port; transits swap procedural → real when footage lands) ---- */
  const SCENES: Record<string, (p: number, t: number) => void> = {
    sky(p) {
      if (s13Imgs) {
        // Scene 1-3: hero occupies ~first 14% of the 156 frames (scene 1 of 3)
        const heroEnd = 0.14
        const idx = Math.round(p * heroEnd * (s13Imgs.length - 1))
        const img = seqFrame(s13Imgs, idx)
        if (img) drawCover(img, 1)
        else { skyGrad('#0E2233', '#7A4E33', '#E8A24B', 0.78); skyline(1 + p * 0.06, 0.55, 0.8, 0.8, 0.9, 1) }
      } else if (!drawCover(S.kf1, 1 + p * 0.06)) {
        skyGrad('#0E2233', '#7A4E33', '#E8A24B', 0.78)
        skyline(1 + p * 0.06, 0.55, 0.8, 0.8, 0.9, 1)
      }
      vignette(0.18)
    },
    approach(p) {
      if (s13Imgs) {
        // Scene 1-3: approach/descent occupies ~14%–72% of the 156 frames (scene 2)
        const startFrac = 0.14, endFrac = 0.72
        const frac = startFrac + p * (endFrac - startFrac)
        const idx = Math.round(frac * (s13Imgs.length - 1))
        const img = seqFrame(s13Imgs, idx)
        if (img) drawCover(img, 1)
        else { skyGrad('#0E2233', '#8A5636', '#E8A24B', 0.7); skyline(1 + easeF(p) * 2.6, 0.62, 0.62, 0.8, 0.85, 1) }
      } else {
        const idx = Math.round(p * (taImgs.length - 1))
        const img = seqFrame(taImgs, idx)
        if (img) drawCover(img, 1)
        else { skyGrad('#0E2233', '#8A5636', '#E8A24B', 0.7); skyline(1 + easeF(p) * 2.6, 0.62, 0.62, 0.8, 0.85, 1) }
      }
      vignette(0.22)
    },
    boardroom(p) {
      if (s13Imgs) {
        // Scene 1-3: boardroom occupies ~72%–100% of the 156 frames (scene 3)
        const startFrac = 0.72
        const frac = startFrac + p * (1 - startFrac)
        const idx = Math.round(frac * (s13Imgs.length - 1))
        const img = seqFrame(s13Imgs, idx)
        if (img) drawCover(img, 1)
        else drawCover(S.kf3, 1.02)
      } else {
        boardZoom = 1.02 + Math.sin(p * Math.PI) * 0.015
        drawCover(S.kf3, boardZoom)
      }
      vignette(0.34)
    },
    descend(p) {
      const real = seq('transit-b', 5)
      if (real && ready(real[0])) {
        const img = seqFrame(real, Math.round(p * (real.length - 1)))
        if (img) drawCover(img, 1)
        vignette(0.3)
        return
      }
      if (p < 0.3) {
        const q = easeF(p / 0.3)
        drawCover(S.kf3, 1 + q * 1.15)
        cx.fillStyle = `rgba(7,10,16,${q * 0.55})`; cx.fillRect(0, 0, W, H)
        cx.globalAlpha = q * 0.5; cx.strokeStyle = 'rgba(190,210,230,.35)'; cx.lineWidth = 2
        for (let i = 0; i < 10; i++) { const lx = (i / 10 + 0.05) * W; cx.beginPath(); cx.moveTo(lx, H * (0.2 - q * 0.4)); cx.lineTo(lx, H * (0.8 + q * 0.4)); cx.stroke() }
        cx.globalAlpha = 1
      } else if (p < 0.72) {
        const q = (p - 0.3) / 0.42
        skyGrad('#0B1B29', '#5A3A28', '#C4823B', 0.85)
        BOKEH.forEach((b) => {
          const by = (b.y - q * 2.2 * (0.4 + b.c)) % 1, y = (((by % 1) + 1) % 1) * H
          const col = b.c > 0.5 ? '232,162,75' : '88,200,230'
          sun(b.x * W, y, b.r * (1 + q), `rgba(${col},.35)`, `rgba(${col},0)`)
        })
        vignette(0.45)
      } else {
        const q = easeF((p - 0.72) / 0.28)
        cx.fillStyle = '#0A141E'; cx.fillRect(0, 0, W, H)
        cx.globalAlpha = q; drawCover(S.kf4, 1.12 - q * 0.12); cx.globalAlpha = 1
        vignette(0.3)
      }
    },

    toBeach(p) {
      const real = seq('transit-c', 5)
      if (real && ready(real[0])) {
        const img = seqFrame(real, Math.round(p * (real.length - 1)))
        if (img) drawCover(img, 1)
        vignette(0.25)
        return
      }
      if (p < 0.35) {
        const q = easeF(p / 0.35)
        drawCover(S.kf5, 1 + q * 1.9)
        sun(W * 0.5, H * 0.5, lerp(H * 0.12, H * 1.5, q * q), 'rgba(240,248,252,.98)', 'rgba(240,248,252,0)')
        if (q > 0.8) { cx.fillStyle = `rgba(244,250,252,${(q - 0.8) / 0.2})`; cx.fillRect(0, 0, W, H) }
      } else {
        const q = easeF((p - 0.35) / 0.65)
        cx.fillStyle = '#F4FAFC'; cx.fillRect(0, 0, W, H)
        cx.globalAlpha = Math.min(1, q * 1.5); drawCover(S.kf6, 1.1 - q * 0.1); cx.globalAlpha = 1
        if (q < 0.25) { cx.fillStyle = `rgba(244,250,252,${1 - q / 0.25})`; cx.fillRect(0, 0, W, H) }
      }
    },

    montage(p) {
      // The canvas fades to transparent so the EarthGlobe handles the visual
      const q = clamp(p * 8, 0, 1) // Quick fade out in first 12% of the montage
      cx.clearRect(0, 0, W, H) // Clear previous drawings
      if (q < 1) {
        const real = seq('transit-c', 5)
        if (real && ready(real[real.length - 1])) {
          cx.globalAlpha = 1 - q
          drawCover(real[real.length - 1], 1)
          cx.globalAlpha = 1
        }
      }
    },
    ret(p, t) {
      const real = seq('transit-d', 5)
      if (real && ready(real[0])) {
        const img = seqFrame(real, Math.round(p * (real.length - 1)))
        if (img) drawCover(img, 1)
        vignette(0.3)
        return
      }
      if (p < 0.28) {
        const q = easeF(p / 0.28)
        duskRoom(0)
        cx.fillStyle = `rgba(240,248,252,${1 - q})`; cx.fillRect(0, 0, W, H)
      } else if (p < 0.62) {
        const q = (p - 0.28) / 0.34
        duskRoom(Math.sin(q * Math.PI) * 6)
      } else {
        const q = easeF((p - 0.62) / 0.38)
        skyGrad('#060D1A', '#122036', '#3A2C3E', 0.8)
        STARS.forEach((s) => {
          cx.globalAlpha = Math.min(1, q * 1.6) * (0.3 + 0.6 * Math.abs(Math.sin(t * 0.0012 + s.tw)))
          cx.fillStyle = '#DCEFF8'; cx.fillRect(s.x * W, s.y * H, s.s, s.s)
        })
        cx.globalAlpha = 1
        const ww = lerp(W * 1.15, W * 0.09, q * q), wh = ww * 0.62, wx = W * 0.5 - ww / 2, wy = H * 0.52 - wh / 2
        cx.save(); rr(wx, wy, ww, wh, 10); cx.clip(); duskRoom(0); cx.restore()
        cx.strokeStyle = 'rgba(88,200,230,.3)'; cx.lineWidth = 1.5; rr(wx, wy, ww, wh, 10); cx.stroke()
        sun(W * 0.5, H * 0.92, H * 0.3, 'rgba(232,162,75,.28)', 'rgba(232,162,75,0)')
        skyline(lerp(1.3, 0.9, q), 0.5, 0.94, 0.94, 0.9, 1)
      }
    },
    finale(p, t) {
      if (drawCover(S.kf1, 1.04)) {
        cx.globalCompositeOperation = 'multiply'
        cx.fillStyle = '#22345E'; cx.fillRect(0, 0, W, H)
        cx.fillStyle = 'rgba(16,26,52,.55)'; cx.fillRect(0, 0, W, H)
        cx.globalCompositeOperation = 'screen'
        const g = cx.createLinearGradient(0, H * 0.55, 0, H)
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(120,70,20,.5)')
        cx.fillStyle = g; cx.fillRect(0, H * 0.55, W, H * 0.45)
        cx.globalCompositeOperation = 'lighter'
        STARS.forEach((s) => {
          cx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 0.0012 + s.tw))
          cx.fillStyle = '#C8E2F0'; cx.fillRect(s.x * W, s.y * H * 0.55, s.s, s.s)
        })
        cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over'
      } else {
        skyGrad('#060D1A', '#10203A', '#33283A', 0.82)
      }
      vignette(0.3)
    },
    sunrise(p, t) {
      const k = 1 - easeF(p)
      const zoom = lerp(1.04, 1.0, easeF(p))
      if (drawCover(S.kf1, zoom)) {
        if (k > 0.003) {
          cx.globalCompositeOperation = 'multiply'
          cx.fillStyle = `rgba(34,52,94,${k})`; cx.fillRect(0, 0, W, H)
          cx.fillStyle = `rgba(16,26,52,${0.55 * k})`; cx.fillRect(0, 0, W, H)
          cx.globalCompositeOperation = 'screen'
          const g = cx.createLinearGradient(0, H * 0.55, 0, H)
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(120,70,20,${0.5 * k})`)
          cx.fillStyle = g; cx.fillRect(0, H * 0.55, W, H * 0.45)
          cx.globalCompositeOperation = 'lighter'
          STARS.forEach((s) => {
            cx.globalAlpha = k * (0.25 + 0.5 * Math.abs(Math.sin(t * 0.0012 + s.tw)))
            cx.fillStyle = '#C8E2F0'; cx.fillRect(s.x * W, s.y * H * 0.55, s.s, s.s)
          })
          cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over'
        }
      } else {
        skyGrad('#060D1A', '#10203A', '#33283A', 0.82)
      }
      vignette(lerp(0.3, 0.18, easeF(p)))
    }
  }

  /* ---- orb: pinned runtime, self-hosted first (see public/spline/README) ---- */
  const ORB_ZOOM = 0.9
  let splineApp: any = null
  let orbLayers: Array<{ layer: any; bi: number; bm: number }> = []
  let forceTransparent: (() => void) | null = null
  let pulseT = -9999, sAmp = 0
  async function initSpline() {
    let mod: any = null
    for (const src of [
      '/spline/runtime.js',
      'https://cdn.jsdelivr.net/npm/@splinetool/runtime@1.12.95/build/runtime.js',
      'https://unpkg.com/@splinetool/runtime@1.12.95/build/runtime.js'
    ]) {
      try { mod = await import(/* @vite-ignore */ src); break }
      catch (e) { console.warn('Spline runtime source failed:', src, e) }
    }
    if (!mod) return // CSS fallback orb stays
    try {
      const c = orbGlEl.value!
      const app = new mod.Application(c, { renderMode: 'continuous' })
      // Owner's standing decision: self-hosted scene once exported from the editor.
      try { await app.load('/spline/scene.splinecode') }
      catch { await app.load('https://prod.spline.design/IsMZdCzuXM91-03p/scene.splinecode') }
      app.setSize(800, 800)
      app.setZoom(ORB_ZOOM) // Orb.vue does this after load — skip it and framing is wrong
      forceTransparent = () => { try { const pg = app._scene?.activePage; if (pg?.bgColor) pg.bgColor.a = 0 } catch {} }
      forceTransparent()
      try {
        const orig = app._renderer?.setClearColor?.bind(app._renderer)
        if (orig) app._renderer.setClearColor = (color: any, _a: number) => orig(color, 0)
      } catch {}
      app.play()
      try {
        app.getAllObjects().forEach((obj: any) => obj.material?.layers?.forEach((layer: any) => {
          if (layer.type === 'displace' && layer.displacementType === 'noise')
            orbLayers.push({ layer, bi: layer.intensity ?? 8, bm: layer.movement ?? 1 })
        }))
      } catch {}
      splineApp = app
      orb.classList.add('gl')
    } catch (e) { console.warn('Spline scene load failed — CSS fallback orb stays.', e) }
  }
  initSpline()

  /* ---- orb path (verbatim) ---- */
  // The new trajectory descends with the camera from T=0.9 to T=2.2, then enters the boardroom glass to the screen.
  // Boardroom (T=2.2 -> 3.8). We want it to land inside the presentation screen by T=3.4.
  const ORB: Array<[number, number, number, number]> = [
    // T=0 is handled dynamically via orbAnchorEl, so these first two points are fallback paths
    [0, 50, 33, 1.15], [0.9, 50, 33, 1.15], 
    // T=0.9 to 2.2: Camera diving towards building. Orb moves downwards but stays in frame.
    [1.5, 50, 75, 0.9], [2.2, 50, 85, 0.5], 
    // T=2.2 to 3.8: Enter the glass. We shrink and land in the center of the presentation screen
    [2.8, 50, 60, 0.4], [3.4, 50, 35, 0.35],
    [3.8, 50, 35, 0.35], [4.6, 42, 72, 0.6], [5.1, 50, 16, 0.55], [6.55, 50, 16, 0.55],
    [6.9, 50, 46, 0.3], [7.3, 50, 34, 0.5], [7.8, 74, 22, 0.55], [9.1, 74, 22, 0.5],
    [9.5, 50, 13, 0.45], [10.4, 50, 13, 0.45], [11.0, 66, 38, 0.7], [11.35, 66, 38, 0.7],
    [12.0, 50, 44, 0.9], [12.4, 50, 26, 1.35], [12.9, 50, 26, 1.35], [13.8, 50, 33, 1.15]
  ]
  function orbAt(T: number) {
    let i = 0; while (i < ORB.length - 2 && ORB[i + 1][0] < T) i++
    const A = ORB[i], B = ORB[i + 1]
    const t = easeF(clamp((T - A[0]) / (B[0] - A[0] || 1), 0, 1))
    return { x: lerp(A[1], B[1], t), y: lerp(A[2], B[2], t), s: lerp(A[3], B[3], t) }
  }

  /* ---- overlay registration: anchored overlays follow their image quad ---- */
  const boardAnchor = M.anchors['kf-03-screen']

  // Pinning is only honest when the screen is actually on screen. The quad is
  // normalized to a 16:9 still, but cover-fit on a portrait viewport keeps just
  // the middle ~26% (phone) to ~39% (tablet) of the image width — and the
  // boardroom screen lives at x 0.43..0.85, so most of it is cropped away and a
  // pinned panel runs off the right edge. Rather than guess a breakpoint, test
  // the projected quad: pin only when it is substantially visible and big
  // enough to read. Everything else falls back to the CSS layout.
  const MIN_ON_SCREEN = 0.86  // fraction of the quad's bbox inside the viewport
  const MIN_QUAD_W = 340      // px; below this the projected copy is unreadable
  function unpinBoard(el: HTMLElement) {
    el.style.transform = ''; el.style.transformOrigin = ''
    el.style.left = ''; el.style.top = ''; el.style.right = ''; el.style.width = ''
  }
  function applyBoardAnchor() {
    const el = ovBoardEl.value!
    if (!boardAnchor?.quad || !ready(S.kf3)) { unpinBoard(el); return }
    const vq = imageQuadToViewport(boardAnchor.quad as Quad, S.kf3.naturalWidth, S.kf3.naturalHeight, W, H, boardZoom)
    const xs = vq.map((p) => p[0]), ys = vq.map((p) => p[1])
    const bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys), by1 = Math.max(...ys)
    const area = (bx1 - bx0) * (by1 - by0)
    const vis = Math.max(0, Math.min(bx1, W) - Math.max(bx0, 0)) * Math.max(0, Math.min(by1, H) - Math.max(by0, 0))
    if (!area || vis / area < MIN_ON_SCREEN || bx1 - bx0 < MIN_QUAD_W) { unpinBoard(el); return }
    const panel = el.firstElementChild as HTMLElement
    el.style.left = '0'; el.style.top = '0'; el.style.right = 'auto'; el.style.width = 'auto'
    el.style.transformOrigin = '0 0'
    el.style.transform = quadToMatrix3d(panel.offsetWidth, panel.offsetHeight, vq)
  }

  /* ---- interactions: chip absorb (engine-timed, so imperative) ---- */
  let absorbed = false
  function absorb(on: boolean) {
    const chips = ovBoardEl.value!.querySelectorAll<HTMLElement>('.chip')
    if (on && !absorbed) {
      absorbed = true
      const ob = orb.getBoundingClientRect(), ox = ob.left + ob.width / 2, oy = ob.top + ob.height / 2
      chips.forEach((c, i) => {
        const r = c.getBoundingClientRect()
        c.style.setProperty('--ax', ox - r.left - r.width / 2 + 'px')
        c.style.setProperty('--ay', oy - r.top - r.height / 2 + 'px')
        c.style.transitionDelay = i * 70 + 'ms'
        c.classList.add('absorbed')
      })
      orb.classList.remove('pulse'); void orb.offsetWidth; orb.classList.add('pulse')
      pulseT = performance.now()
    } else if (!on && absorbed) {
      absorbed = false
      chips.forEach((c) => { c.classList.remove('absorbed'); c.style.transitionDelay = '0ms' })
    }
  }

  /* ---- main loop ---- */
  const restO = (p: number) => clamp((p - 0.06) / 0.14, 0, 1) * clamp((0.96 - p) / 0.12, 0, 1)
  const setO = (el: HTMLElement | undefined, v: number) => { if (!el) return; el.style.opacity = String(v); el.classList.toggle('on', v > 0.5) }
  let T = 0, dT = 0, lastLabel = '', lastSegIdx = -1, maxT = 0, depthSent = false

  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    if (scrollY >= TOTAL * vh - 2) { 
      window.scrollTo(0, 0)
      scrollProxy.t = 0
      updateScroll(0)
      track('loop_completed') 
    }
    
    T = clamp(scrollY / vh, 0, TOTAL)
    maxT = Math.max(maxT, T)
    
    if (reduced) {
      scrollProxy.t = T
    } else {
      updateScroll(T)
    }
    
    const t = scrollProxy.t
    dT = t // Keep dT synced for state debugger

    let seg = SEGS[0], segIdx = 0
    for (let i = 0; i < SEGS.length; i++) { const s = SEGS[i]; if (t >= s.a && t <= s.b) { seg = s; segIdx = i; break } if (t > s.b) { seg = s; segIdx = i } }
    const p = clamp((t - seg.a) / seg.w, 0, 1)

    if (segIdx !== lastSegIdx) {
      lastSegIdx = segIdx
      currentSegId = seg.id
      boostAround(segIdx)
      track('scene_reached', { scene: seg.scene, segment: seg.id })
    }

    SCENES[seg.scene](p, now)

    const o = orbAt(t)
    const os = clamp(Math.min(W, H) * 0.155, 64, 230) * o.s // aspect-safe: short edge, clamped
    let ox = (W * o.x) / 100
    let oy = (H * o.y) / 100
    let ok = os / 300
    
    // Smoothly blend the dynamic anchor position into the script trajectory between T=0.7 and T=1.1
    if (t < 1.1 && orbAnchorEl.value) {
      const rect = orbAnchorEl.value.getBoundingClientRect()
      const anchorX = rect.left + rect.width / 2
      const anchorY = rect.top + rect.height / 2
      const blend = t < 0.7 ? 1 : 1 - clamp((t - 0.7) / 0.4, 0, 1)
      const targetSize = Math.max(rect.width, rect.height) * 1.15 
      const targetScale = targetSize / 300
      
      ox = lerp(ox, anchorX, blend)
      oy = lerp(oy, anchorY, blend)
      ok = lerp(ok, targetScale, blend)
    }

    // Hijack Orb for WebGPU Earth
    if (earthOrbTarget.value && earthOrbTarget.value.visible) {
      ox = (W * earthOrbTarget.value.x) / 100
      oy = (H * earthOrbTarget.value.y) / 100
      ok = (os / 300) * earthOrbTarget.value.s
    }

    const bob = reduced ? 0 : Math.sin(now * 0.0016) * 6
    // We adjust the centering to account for the orb's internal padding/offset if needed,
    // but standard centering based on 300 base size should work with the new scale.
    orb.style.transform = `translate(${ox - (300 * ok) / 2}px,${oy - (300 * ok) / 2 + bob}px) scale(${ok})`
    
    if (splineApp && orbLayers.length) {
      // Synthetic bands choreographed to the film (constant low breathing; pulse
      // on chip absorb; "speech" cadence docked over the broker phone).
      const pulse = Math.max(0, 1 - (now - pulseT) / 900)
      const talking = seg.id === 'tB' && p > 0.8
      const breathe = 0.06 + 0.05 * Math.abs(Math.sin(now * 0.0016))
      const speech = talking ? 0.22 + 0.18 * Math.abs(Math.sin(now * 0.0061)) * Math.abs(Math.sin(now * 0.0023)) : 0
      const amp = clamp(breathe + speech + pulse * 0.7, 0, 1)
      sAmp = lerp(sAmp, amp, amp > sAmp ? 0.6 : 0.15) // attack/release
      const bass = sAmp * 0.9
      const mid = Math.max(0, sAmp * (0.5 + 0.3 * Math.sin(now * 0.004)))
      const high = Math.max(0, sAmp * (0.3 + 0.3 * Math.sin(now * 0.009)))
      orbLayers.forEach(({ layer, bi, bm }) => {
        layer.intensity = (bi + bass * 120 + sAmp * 30) * 0.2 // Orb.vue formula (×0.2)
        layer.movement = bm + mid * 16 + high * 8
      })
      forceTransparent?.()
    }

    setO(ovHeroEl.value, seg.id === 'hero' ? 1 - clamp((p - 0.3) / 0.5, 0, 1) : t < SEGS[0].b ? 1 : 0)
    setO(ovBoardEl.value, seg.id === 'rest1' ? restO(p) : 0)
    if (seg.id === 'rest1') applyBoardAnchor()
    setO(ovFinaleEl.value, seg.id === 'finale' ? clamp((p - 0.12) / 0.3, 0, 1) : seg.id === 'loop' ? 1 - clamp(p * 2.2, 0, 1) : 0)
    setO(ovDashEl.value, seg.id === 'tD' ? clamp((p - 0.32) / 0.08, 0, 1) * clamp((0.6 - p) / 0.08, 0, 1) : 0)
    setO(ovMontEl.value, seg.id === 'mont' ? clamp(p * 12, 0, 1) * clamp((0.98 - p) * 12, 0, 1) : 0)
    if (seg.id === 'mont') {
      montProgress.value = clamp(p, 0, 1)
      dashProgress.value = -1
      const cIdx = Math.min(6, Math.max(0, Math.floor((p - 0.15) / 0.12)))
      const mCities = ['MUMBAI', 'MOSCOW', 'SHANGHAI', 'RIYADH', 'PARIS', 'LONDON', 'DUBAI']
      if (mCityEl.value) mCityEl.value.textContent = mCities[cIdx] || ''
      
      // Flash Burn Effect
      flashOpacity.value = p < 0.15 ? 1 - (p / 0.15) : 0
      
      if (stageEl.value) {
        stageEl.value.style.webkitMaskImage = 'none'
        stageEl.value.style.maskImage = 'none'
        // Canvas fades out instantly behind the flash
        stageEl.value.style.opacity = p < 0.05 ? '1' : '0'
      }
    } else if (seg.id === 'tD') {
      montProgress.value = 1
      dashProgress.value = clamp(p, 0, 1)
      flashOpacity.value = 0
      if (stageEl.value) {
        stageEl.value.style.webkitMaskImage = 'none'
        stageEl.value.style.maskImage = 'none'
        // Fade the canvas (starry sky) back in over the globe at the end of the dashboard scene
        stageEl.value.style.opacity = p < 0.62 ? '0' : String(clamp((p - 0.62) / 0.15, 0, 1))
      }
    } else if (seg.id === 'finale' || seg.id === 'loop') {
      montProgress.value = 1
      dashProgress.value = -1
      flashOpacity.value = 0
      if (stageEl.value) {
        stageEl.value.style.webkitMaskImage = 'none'
        stageEl.value.style.maskImage = 'none'
        stageEl.value.style.opacity = '1'
      }
    } else {
      montProgress.value = -1
      dashProgress.value = -1
      flashOpacity.value = 0
      if (stageEl.value) {
        stageEl.value.style.webkitMaskImage = 'none'
        stageEl.value.style.maskImage = 'none'
        stageEl.value.style.opacity = '1'
      }
    }

    absorb(t > SEGS[2].a + SEGS[2].w * 0.8)

    floatCtaEl.value!.classList.toggle('on', t > 1.4 && seg.id !== 'finale' && seg.id !== 'loop')

    if (seg.label !== lastLabel) { hudSceneEl.value!.textContent = seg.label; lastLabel = seg.label }
    
    // Update Chapter tracking and active dot position
    const cIdx = CHAPTERS.findIndex((c) => c.map.includes(currentSegId))
    if (cIdx !== -1 && cIdx !== activeChapter.value) {
      activeChapter.value = cIdx
    }
    
    // Animate the gold chapter dot
    if (chapterEls.value.length && chapterDotEl.value) {
      const activeEl = chapterEls.value[activeChapter.value]
      if (activeEl) {
        // Move dot to the left center of the active chapter label
        const targetX = activeEl.offsetLeft - 16
        // Simple easing for the dot position
        const currentX = parseFloat(chapterDotEl.value.style.transform.replace('translateX(', '') || '0')
        const nextX = currentX === 0 ? targetX : lerp(currentX, targetX, 0.1)
        chapterDotEl.value.style.transform = `translateX(${nextX}px)`
      }
    }
  }
  let mIdx = -1
  raf = requestAnimationFrame(frame)

  const sendDepth = () => {
    if (!depthSent && maxT > 0) { depthSent = true; track('scroll_depth_max', { depth: +(maxT / TOTAL).toFixed(3) }) }
  }
  const onHide = () => { if (document.visibilityState === 'hidden') sendDepth() }
  document.addEventListener('visibilitychange', onHide)
  cleanup.push(() => document.removeEventListener('visibilitychange', onHide))
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  cleanup.forEach((f) => f())
  cleanup = []
})
</script>

<style scoped>
/* Film palette is scene-graded and deliberately independent of the site-wide
   design tokens — ratified: Marcellus/Sora supersede Playfair/Inter here. */
.film-root {
  --sky-deep: #0B1826; --ink: #070E16; --amber: #E8A24B; --amber-hot: #F5C069;
  --sand: #F2DCB8; --teal: #2E7180; --paper: #F5F1E8; --cyan: #58C8E6; --glow: #9FE8FF;
  --panel: rgba(6, 12, 20, .88); --line: rgba(242, 220, 184, .22);
  --ivory: #F2EBDD; --ivory-muted: rgba(242, 235, 221, 0.68); --champagne: #C8A36A;
  background: var(--ink); color: var(--ivory); font-family: 'Inter', system-ui, sans-serif; font-weight: 400;
}
.spacer { width: 100%; }
#film-stage { position: fixed; inset: 0; width: 100vw; height: 100vh; display: block; z-index: 1; }

.loader { position: fixed; inset: 0; z-index: 20; background: var(--ink); display: flex; flex-direction: column; gap: 18px; align-items: center; justify-content: center; transition: opacity .5s; }
.loader.done { opacity: 0; pointer-events: none; }
.loader .mono { font-family: 'Inter', system-ui, sans-serif; font-size: 11px; letter-spacing: .24em; text-transform: uppercase; color: var(--sand); }
.loader .bar { width: min(280px, 60vw); height: 2px; background: rgba(242, 220, 184, .15); }
.loader .bar i { display: block; height: 100%; width: 0; background: var(--amber); }

.orb { position: fixed; left: 0; top: 0; width: 300px; height: 300px; z-index: 6; pointer-events: none; will-change: transform; transform-origin: 0 0; filter: drop-shadow(0 0 26px rgba(159, 232, 255, .45)); }
.orb canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.orb.gl .core, .orb.gl .ring { display: none; }
.orb .core { position: absolute; inset: 0; border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, #ffffff 0%, var(--glow) 22%, #4FB6D8 48%, #16537A 78%, #0A2740 100%);
  box-shadow: inset -12px -14px 30px rgba(6, 24, 44, .85), inset 8px 8px 22px rgba(255, 255, 255, .35), 0 0 44px rgba(88, 200, 230, .35); }
.orb .ring { position: absolute; inset: -14%; border-radius: 50%; border: 1px solid rgba(159, 232, 255, .28); animation: ringspin 9s linear infinite; }
.orb.pulse .core { animation: orbpulse .9s ease-out 1; }
@keyframes ringspin { to { transform: rotate(360deg); } }
@keyframes orbpulse { 0% { filter: brightness(1); } 30% { filter: brightness(2.1); } 100% { filter: brightness(1); } }

.hud { position: fixed; z-index: 9; font-family: 'Inter', system-ui, sans-serif; font-weight: 400; font-size: 10px; letter-spacing: .12em; color: var(--ivory); pointer-events: none; }

.hud-badge { top: 32px; left: 40px; display: flex; flex-direction: column; gap: 4px; }
.hud-badge .brand { font-family: 'Inter', system-ui, sans-serif; font-weight: 400; font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: var(--ivory); opacity: 0.85; }
.hud-badge .tag { font-family: 'Inter', system-ui, sans-serif; font-weight: 400; font-size: 8.5px; letter-spacing: .18em; opacity: 0.6; color: var(--ivory); }

.hud-context { top: 32px; right: 40px; display: flex; align-items: center; gap: 12px; font-family: 'Inter', system-ui, sans-serif; font-weight: 400; font-size: 9.5px; letter-spacing: .12em; color: var(--ivory); opacity: 0.9; }
.hud-context .line { width: 1px; height: 16px; background: var(--ivory-muted); opacity: 0.4; }
.hud-context .dot { width: 4px; height: 4px; background: var(--ivory-muted); border-radius: 50%; }
.hud-context span { opacity: 0.6; }

.hud-timeline { bottom: 0; left: 0; right: 0; padding: 60px 40px 32px 40px; display: flex; align-items: center; justify-content: center; gap: 32px; background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%); pointer-events: auto; }
.hud-timeline .chapter-line { display: none; }
.hud-timeline .chapter-dot { position: absolute; left: 0; width: 6px; height: 6px; background: var(--champagne); border-radius: 50%; transform: translateX(0); transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); will-change: transform; z-index: 2; margin-top: 1px; pointer-events: none; }
.hud-timeline .chapter { position: relative; display: flex; align-items: baseline; gap: 6px; cursor: pointer; }
.hud-timeline .chapter .num { font-family: 'Inter', system-ui, sans-serif; font-size: 17px; font-weight: 500; color: rgba(242, 235, 221, 0.4); transition: color 0.4s; }
.hud-timeline .chapter .lbl { font-family: 'Inter', system-ui, sans-serif; font-size: 9.5px; font-weight: 400; letter-spacing: .18em; text-transform: uppercase; color: rgba(242, 235, 221, 0.4); transition: color 0.4s; }
.hud-timeline .chapter.active .num { color: var(--ivory); }
.hud-timeline .chapter.active .lbl { color: var(--champagne); }

.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
  clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; border: 0; }

.ov { position: fixed; z-index: 5; opacity: 0; pointer-events: none; }
.ov.on { pointer-events: auto; }
.eyebrow { font-family: 'Inter', system-ui, sans-serif; font-weight: 400; font-size: 10.5px; letter-spacing: .22em; text-transform: uppercase; color: var(--champagne); margin-bottom: 14px; }
.display { font-family: 'Cormorant Garamond', serif; font-weight: 400; line-height: 1.08; letter-spacing: -0.025em; word-spacing: -0.02em; color: var(--ivory); }

.ov-hero { inset: 0; display: flex; flex-direction: column; }
.hero-grid { flex: 1; display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; padding: 0 40px; align-items: center; }
.hero-content { grid-column: 3 / 11; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; z-index: 2; }
/* Subtle invisible gradient for text contrast */
.hero-content::before { content: ''; position: absolute; inset: -40% -20%; background: radial-gradient(ellipse at center, rgba(7, 14, 22, 0.4) 0%, rgba(7, 14, 22, 0) 70%); z-index: -1; pointer-events: none; }

.hero-content .display { font-size: clamp(48px, 7vw, 100px); display: flex; align-items: baseline; justify-content: center; text-shadow: 0 4px 60px rgba(7, 14, 22, 0.8); }
.orb-placeholder { color: transparent; user-select: none; }
.hero-content .sub { margin-top: 28px; font-family: 'Inter', system-ui, sans-serif; font-size: clamp(15px, 1.4vw, 17px); line-height: 1.5; letter-spacing: 0.02em; color: var(--ivory-muted); max-width: 520px; font-weight: 400; text-shadow: 0 2px 24px rgba(7, 14, 22, 0.9); }

.scroll-indicator { position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 12px; }
.scroll-indicator .lbl { font-family: 'Inter', system-ui, sans-serif; font-weight: 400; font-size: 8.5px; letter-spacing: .2em; text-transform: uppercase; color: var(--ivory-muted); }
.scroll-indicator .lbl span { color: var(--ivory); }
.scroll-indicator .line { width: 1px; height: 32px; background: linear-gradient(to bottom, rgba(242, 235, 221, 0.4), transparent); }
.scroll-indicator .arrow-down { width: 6px; height: 6px; border-right: 1px solid rgba(242, 235, 221, 0.4); border-bottom: 1px solid rgba(242, 235, 221, 0.4); transform: rotate(45deg); margin-top: -8px; animation: hintbob 2.4s ease-in-out infinite; }
@keyframes hintbob { 50% { transform: rotate(45deg) translate(4px, 4px); } }

.ov-board { top: 12vh; right: 5vw; width: min(480px, 86vw); }
.slide-panel { background: var(--panel); backdrop-filter: blur(12px); border: 1px solid var(--line); border-radius: 10px; padding: 26px 28px; box-shadow: 0 30px 80px rgba(0, 0, 0, .55); max-height: 72vh; overflow-y: auto; }
.slide-panel .display { font-size: clamp(22px, 2.6vw, 32px); margin-bottom: 18px; }
.chips { display: flex; flex-wrap: wrap; gap: 10px; }
.chip { font-family: 'Inter', system-ui, sans-serif; font-weight: 400; font-size: 13px; color: var(--paper); background: rgba(46, 113, 128, .28); border: 1px solid rgba(88, 200, 230, .4); border-radius: 999px; padding: 9px 16px; cursor: pointer; transition: transform .8s cubic-bezier(.5, 0, .2, 1), opacity .8s, background .2s; }
.chip:hover { background: rgba(88, 200, 230, .22); }
.chip.absorbed { transform: translate(var(--ax), var(--ay)) scale(.08); opacity: 0; pointer-events: none; }
.chip-detail { display: none; margin-top: 16px; font-size: 13.5px; line-height: 1.65; color: var(--sand); border-top: 1px solid var(--line); padding-top: 14px; }
.chip-detail.open { display: block; }
.slide-note { margin-top: 16px; font-family: 'Inter', system-ui, sans-serif; font-size: 10px; opacity: .5; letter-spacing: .1em; }

.ov-broker { left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(300px, 76vw); }
.chat { display: flex; flex-direction: column; gap: 12px; }
.bubble { border-radius: 14px; padding: 12px 14px; font-size: 12.5px; line-height: 1.5; max-width: 94%; }
.bubble.user { align-self: flex-end; background: rgba(20, 26, 34, .82); border: 1px solid rgba(232, 162, 75, .45); color: var(--sand); backdrop-filter: blur(6px); }
.bubble.ai { align-self: flex-start; background: rgba(10, 22, 30, .85); border: 1px solid rgba(88, 200, 230, .4); backdrop-filter: blur(6px); }
.wave { display: inline-flex; gap: 3px; align-items: flex-end; height: 12px; margin-right: 8px; vertical-align: middle; }
.wave i { width: 3px; background: var(--amber); border-radius: 2px; animation: wv 1s ease-in-out infinite; }
.wave i:nth-child(1) { height: 6px; } .wave i:nth-child(2) { height: 12px; animation-delay: .15s; }
.wave i:nth-child(3) { height: 8px; animation-delay: .3s; } .wave i:nth-child(4) { height: 11px; animation-delay: .45s; }
@keyframes wv { 50% { transform: scaleY(.35); } }
.unit-card { margin-top: 10px; border: 1px solid var(--line); border-radius: 10px; padding: 11px 13px; background: rgba(7, 14, 22, .6); }
.unit-card .name { font-family: 'Cormorant Garamond', serif; font-size: 15px; color: var(--amber-hot); }
.unit-card .meta { font-size: 11.5px; color: var(--sand); opacity: .9; margin-top: 5px; line-height: 1.55; }
.live { display: inline-flex; align-items: center; gap: 6px; font-family: 'Inter', system-ui, sans-serif; font-size: 9px; letter-spacing: .12em; color: var(--cyan); margin-top: 8px; text-transform: uppercase; }
.live::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 8px var(--cyan); animation: blink 1.6s infinite; }
@keyframes blink { 50% { opacity: .25; } }
.btn { display: inline-block; margin-top: 12px; font-family: 'Inter', system-ui, sans-serif; font-weight: 600; font-size: 12.5px; color: var(--ink); background: var(--amber); border: none; border-radius: 8px; padding: 11px 18px; cursor: pointer; transition: transform .15s, box-shadow .15s; }
.btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232, 162, 75, .35); }

.ov-buyer { left: 48%; top: 50%; transform: translate(-50%, -50%); width: min(300px, 74vw); }
.brief { background: rgba(255, 255, 255, .93); color: #1A2430; border-radius: 14px; padding: 18px 20px; box-shadow: 0 24px 70px rgba(10, 30, 40, .4); }
.brief .display { color: #14202C; font-size: 20px; }
.brief p { font-size: 12.5px; line-height: 1.6; margin-top: 8px; color: #33414F; }
.langs { display: flex; gap: 8px; margin-bottom: 12px; }
.lang { font-family: 'Inter', system-ui, sans-serif; font-size: 11px; padding: 5px 12px; border-radius: 999px; border: 1px solid #C8D4DC; background: #fff; cursor: pointer; color: #33414F; }
.lang.sel { background: #14536B; color: #fff; border-color: #14536B; }
.brief .live { color: #14536B; } .brief .live::before { background: #14536B; box-shadow: none; }

.ov-dash { right: 8vw; top: 20vh; width: min(340px, 78vw); }
.dash { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 18px 20px; backdrop-filter: blur(8px); }
.mapgrid { position: relative; height: 150px; margin-top: 12px; border: 1px solid rgba(159, 232, 255, .18); border-radius: 8px; overflow: hidden;
  background: linear-gradient(rgba(88, 200, 230, .07) 1px, transparent 1px), linear-gradient(90deg, rgba(88, 200, 230, .07) 1px, transparent 1px);
  background-size: 22px 22px; }
.dot { position: absolute; width: 7px; height: 7px; border-radius: 50%; background: #6FE8A8; box-shadow: 0 0 10px #6FE8A8; }
.dot::after { content: ''; position: absolute; inset: -6px; border-radius: 50%; border: 1px solid rgba(111, 232, 168, .7); animation: ping 1.8s ease-out infinite; animation-delay: var(--d); }
.dot.hub { background: var(--amber); box-shadow: 0 0 12px var(--amber); }
.dot.hub::after { border-color: rgba(232, 162, 75, .8); }
@keyframes ping { 0% { transform: scale(.3); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
.mapcap { margin-top: 12px; font-family: 'Inter', system-ui, sans-serif; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--sand); opacity: .7; }

.ov-montage { inset: 0; }
.mont-caption { position: fixed; top: 11vh; left: 50%; transform: translateX(-50%); display: flex; gap: 16px; white-space: nowrap;
  font-family: 'Inter', system-ui, sans-serif; font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: var(--paper); text-shadow: 0 1px 14px rgba(0, 0, 0, .65); }
.mont-caption .m-city { color: var(--amber-hot); }
.mont-screen { position: fixed; left: 50%; top: 53.5%; transform: translate(-50%, -50%); width: min(250px, 58vw); text-align: center; }
.mont-screen .display { font-size: 20px; line-height: 1.4; }
.mont-screen .live { display: flex; justify-content: center; margin-top: 10px; }

.ov-finale { inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 24px; }
.ov-finale .wordmark { font-family: 'Cormorant Garamond', serif; font-size: clamp(15px, 1.6vw, 19px); letter-spacing: .55em; text-indent: .55em; color: var(--sand); opacity: .9; }
.ov-finale .display { font-size: clamp(34px, 5.6vw, 74px); margin-top: 14px; }
.ov-finale .ctas { display: flex; gap: 14px; margin-top: 34px; flex-wrap: wrap; justify-content: center; }
.btn.ghost { background: transparent; color: var(--sand); border: 1px solid var(--line); }
.btn.ghost:hover { box-shadow: 0 8px 24px rgba(242, 220, 184, .15); }
.ov-finale .inv { margin-top: 46px; font-family: 'Inter', system-ui, sans-serif; font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase; opacity: .45; color: var(--sand); text-decoration: none; }
.ov-finale .inv:hover { opacity: .8; }

.float-cta { position: fixed; right: 20px; bottom: 44px; z-index: 8; opacity: 0; pointer-events: none; transition: opacity .3s; }
.float-cta.on { opacity: 1; pointer-events: auto; }

@media (max-width: 640px) {
  .ov-board { right: 50%; transform: translateX(50%); top: 10vh; }
  .ov-dash { right: 50%; transform: translateX(50%); }
}
@media (max-height: 640px) {
  .slide-panel { padding: 16px 18px; }
  .slide-panel .display { font-size: 19px; margin-bottom: 12px; }
  .ov-broker { transform: translate(-50%, -50%) scale(.9); }
  .ov-buyer { transform: translate(-50%, -50%) scale(.9); }
}
@media (min-aspect-ratio: 21/9) {
  .ov-hero { padding-top: 10vh; }
}
@media (prefers-reduced-motion: reduce) {
  .orb .ring, .ov-hero .hint, .wave i, .live::before, .dot::after { animation: none; }
  .chip { transition: opacity .3s; }
}

.flash-burn {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at 55% 45%, #FFFFFF 10%, #E8A24B 50%, transparent 90%);
  mix-blend-mode: screen;
  z-index: 4;
  pointer-events: none;
}
</style>
