<script setup lang="ts">
/**
 * Spatial hero engine — a cinematic night skyline of Dubai that the page
 * scroll flies THROUGH, with the real Spline orb composited in as the
 * intelligence travelling with you. Client-only (.client.vue): Three.js
 * touches window/canvas and must never run during SSR.
 *
 * Polish levers that move it from "game" to "product":
 *  - emissive window-GRID textures (not dot sprites) so towers read as glass
 *  - UnrealBloom so lit windows glow filmically
 *  - an opaque graded night sky inside the scene + fog for real depth
 *  - a scroll-driven dolly down a central avenue between the towers
 *
 * The orb is the brand Spline scene only (TheOrb) — never a WebGL stand-in.
 */
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

const { t, viewportWidth } = useScrollProgress()

const host = ref<HTMLElement>()
let cleanup: (() => void) | undefined

/* Orb overlay position is scroll-driven: it leads you into the city, then
   settles centre as the gaps resolve. Kept as an HTML layer (the Spline
   iframe can't live inside WebGL) composited with mix-blend: screen. */
const orbStyle = computed(() => {
  const tv = t.value
  const x = multiMap(tv, [0, 0.5, 1], [0, -12, 0])
  const y = multiMap(tv, [0, 0.5, 1], [-6, 4, -2])
  const scale = multiMap(tv, [0, 0.85, 1], [0.82, 0.82, 1.05])
  return { transform: `translate(-50%, -50%) translate(${x}vw, ${y}vh) scale(${scale})` }
})

function makeWindowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 256
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#070b16'
  ctx.fillRect(0, 0, 64, 256)
  const cols = 6
  const rows = 26
  const pad = 3
  const cw = (64 - pad * (cols + 1)) / cols
  const ch = (256 - pad * (rows + 1)) / rows
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const lit = Math.random()
      if (lit < 0.42) {
        // warm interiors, a few cool-white, most off
        const warm = Math.random() < 0.8
        const a = 0.5 + Math.random() * 0.5
        ctx.fillStyle = warm
          ? `rgba(255,${180 + Math.random() * 40 | 0},${110 + Math.random() * 50 | 0},${a})`
          : `rgba(${190 + Math.random() * 50 | 0},${210 + Math.random() * 40 | 0},255,${a})`
        ctx.fillRect(pad + col * (cw + pad), pad + r * (ch + pad), cw, ch)
      }
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

onMounted(async () => {
  await nextTick()
  const el = host.value
  if (!el) return
  const W = () => el.clientWidth || window.innerWidth
  const H = () => el.clientHeight || window.innerHeight

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return // CSS sky + the orb overlay carry the hero; no WebGL

  const mobile = window.innerWidth < 768
  const scene = new THREE.Scene()

  // Graded night sky as the scene background (opaque, so bloom reads right)
  const sky = document.createElement('canvas')
  sky.width = 2
  sky.height = 256
  const sctx = sky.getContext('2d')!
  const grd = sctx.createLinearGradient(0, 0, 0, 256)
  grd.addColorStop(0, '#05070f')
  grd.addColorStop(0.55, '#0a1024')
  grd.addColorStop(0.82, '#162145')
  grd.addColorStop(1, '#39305a')
  sctx.fillStyle = grd
  sctx.fillRect(0, 0, 2, 256)
  scene.background = new THREE.CanvasTexture(sky)
  scene.fog = new THREE.FogExp2(0x0a1024, 0.0042)

  const camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 900)
  camera.position.set(0, 18, 70)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2))
  renderer.setSize(W(), H())
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  el.appendChild(renderer.domElement)

  // Lighting: cool moon key + faint warm bounce
  scene.add(new THREE.AmbientLight(0x223052, 0.8))
  const moon = new THREE.DirectionalLight(0x9fb6ff, 1.1)
  moon.position.set(-40, 60, 20)
  scene.add(moon)
  const bounce = new THREE.DirectionalLight(0xffb066, 0.4)
  bounce.position.set(30, 8, -30)
  scene.add(bounce)

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshStandardMaterial({ color: 0x05070f, roughness: 0.6, metalness: 0.5 })
  )
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  // Towers along a central avenue so the camera can fly between them
  const city = new THREE.Group()
  scene.add(city)
  const seed = (() => { let s = 9; return () => (s = (s * 16807) % 2147483647) / 2147483647 })()
  const winBase = makeWindowTexture()
  const tints = [0x0a1226, 0x0d1830, 0x111f3c]

  const COUNT = mobile ? 70 : 130
  const towers: { mesh: THREE.Mesh; targetH: number }[] = []
  for (let i = 0; i < COUNT; i++) {
    const side = seed() > 0.5 ? 1 : -1
    const x = side * (15 + seed() * 56)
    const z = 45 - seed() * 460
    const w = 3 + seed() * 5
    const d = 3 + seed() * 5
    let h = 12 + seed() * 64
    let geo: THREE.BufferGeometry
    if (i === 0) { h = 190; geo = new THREE.CylinderGeometry(0.5, 5, h, 4) }
    else geo = new THREE.BoxGeometry(w, h, d)

    const tex = winBase.clone()
    tex.needsUpdate = true
    tex.repeat.set(Math.max(1, Math.round(w / 3)), Math.max(2, Math.round(h / 9)))
    const mat = new THREE.MeshStandardMaterial({
      color: tints[Math.floor(seed() * tints.length)],
      roughness: 0.5,
      metalness: 0.55,
      emissive: 0xffffff,
      emissiveMap: tex,
      emissiveIntensity: 1.35
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, h / 2, z)
    mesh.scale.y = 0.001
    city.add(mesh)
    towers.push({ mesh, targetH: h })
  }

  // ── Burj Khalifa anchor — tiered tapering setbacks + spire = unmistakably Downtown ──
  const burj = new THREE.Group()
  const burjMat = new THREE.MeshStandardMaterial({
    color: 0x0e1a36, roughness: 0.4, metalness: 0.7, emissive: 0xffffff,
    emissiveMap: (() => { const tx = winBase.clone(); tx.needsUpdate = true; tx.repeat.set(2, 30); return tx })(),
    emissiveIntensity: 1.1
  })
  let by = 0
  const tiers = 9
  for (let s = 0; s < tiers; s++) {
    const tw = 9 - s * 0.85
    const th = 30 - s * 1.6
    const seg = new THREE.Mesh(new THREE.BoxGeometry(tw, th, tw), burjMat)
    seg.position.set(0, by + th / 2, 0)
    burj.add(seg)
    by += th
  }
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 1.2, 60, 6), new THREE.MeshStandardMaterial({ color: 0x2a3a5e, metalness: 0.9, roughness: 0.3 }))
  spire.position.set(0, by + 30, 0)
  burj.add(spire)
  burj.position.set(16, 0, -120)
  scene.add(burj)

  // HYBRID-REALISM HOOK (founder decision): drop a licensed Burj Khalifa model
  // at public/models/burj.glb and it replaces the procedural anchor above.
  // Left null until a real model is sourced — no request fires for a missing
  // file, so there's no console noise. See CLAUDE.md "hybrid realism".
  const BURJ_MODEL_URL: string | null = null
  if (BURJ_MODEL_URL) {
    import('three/addons/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      new GLTFLoader().load(BURJ_MODEL_URL!, (gltf) => {
        scene.remove(burj)
        gltf.scene.position.copy(burj.position)
        scene.add(gltf.scene)
      })
    })
  }

  // ── Hero "XYZ Developers" tower — the one the first scroll zooms into ──
  const heroH = 88
  const heroTower = new THREE.Mesh(
    new THREE.BoxGeometry(13, heroH, 10),
    new THREE.MeshStandardMaterial({
      color: 0x0b1530, roughness: 0.35, metalness: 0.6,
      emissive: 0xffffff, emissiveMap: (() => { const tx = winBase.clone(); tx.needsUpdate = true; tx.repeat.set(4, 26); return tx })(),
      emissiveIntensity: 0.5
    })
  )
  heroTower.position.set(-9, heroH / 2, 14)
  scene.add(heroTower)
  // One brightly-lit office window the camera homes in on
  const officeWin = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 4),
    new THREE.MeshBasicMaterial({ color: 0xfff0d0 })
  )
  officeWin.position.set(-9, 52, 14 + 5.05)
  scene.add(officeWin)

  // Atmosphere
  const dustGeo = new THREE.BufferGeometry()
  const dust = new Float32Array(500 * 3)
  for (let i = 0; i < 500; i++) {
    dust[i * 3] = (seed() - 0.5) * 240
    dust[i * 3 + 1] = seed() * 120
    dust[i * 3 + 2] = 60 - seed() * 480
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3))
  const dustField = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x9fb6ff, size: 0.45, transparent: true, opacity: 0.3, depthWrite: false }))
  scene.add(dustField)

  // Post: bloom makes the windows glow like a real night city
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  let bloom: UnrealBloomPass | undefined
  if (!mobile) {
    bloom = new UnrealBloomPass(new THREE.Vector2(W(), H()), 0.85, 0.5, 0.22)
    composer.addPass(bloom)
  }
  composer.setSize(W(), H())

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  function onPointer(e: PointerEvent) {
    pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2
    pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2
  }
  window.addEventListener('pointermove', onPointer)

  const start = performance.now()
  let raf = 0
  const cam = new THREE.Vector3(2, 20, 70)
  // keyframes: wide skyline → zoom into the XYZ office window → fly the avenue
  const K = [0, 0.14, 0.3, 0.46, 1]

  function tick() {
    const time = (performance.now() - start) / 1000

    // towers rise once on load
    towers.forEach((tw, i) => {
      const p = Math.max(0, Math.min(1, (time - i * 0.01) / 1.1))
      const e = 1 - Math.pow(1 - p, 4)
      tw.mesh.scale.y = Math.max(0.001, e)
      tw.mesh.position.y = (tw.targetH * tw.mesh.scale.y) / 2
    })
    // the office window pulses to pull the eye during the approach
    ;(officeWin.material as THREE.MeshBasicMaterial).color.setHSL(0.1, 0.5, 0.78 + Math.sin(time * 2) * 0.08)

    pointer.x += (pointer.tx - pointer.x) * 0.05
    pointer.y += (pointer.ty - pointer.y) * 0.05
    const tv = t.value

    const tx = multiMap(tv, K, [2, -6, -9, -6, 0]) + pointer.x * 6
    const ty = multiMap(tv, K, [20, 30, 50, 40, 18]) - pointer.y * 3
    const tz = multiMap(tv, K, [70, 46, 27, 24, -360])
    cam.x += (tx - cam.x) * 0.08
    cam.y += (ty - cam.y) * 0.08
    cam.z += (tz - cam.z) * 0.08
    camera.position.copy(cam)
    camera.lookAt(
      multiMap(tv, K, [0, -9, -9, -6, 0]),
      multiMap(tv, K, [24, 50, 52, 40, 22]),
      multiMap(tv, K, [-40, 14, 14, -30, -420])
    )

    dustField.position.z = cam.z
    composer.render()
    raf = requestAnimationFrame(tick)
  }
  tick()

  function onResize() {
    camera.aspect = W() / H()
    camera.updateProjectionMatrix()
    renderer.setSize(W(), H())
    composer.setSize(W(), H())
  }
  window.addEventListener('resize', onResize)

  cleanup = () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('pointermove', onPointer)
    window.removeEventListener('resize', onResize)
    composer.dispose()
    renderer.dispose()
    el.removeChild(renderer.domElement)
  }
})

onUnmounted(() => cleanup?.())
</script>

<template>
  <div class="city-wrap">
    <div ref="host" class="canvas-host" />
    <div class="orb-layer" :style="orbStyle">
      <TheOrb />
    </div>
    <div class="grain" aria-hidden="true" />
    <div class="vignette" aria-hidden="true" />
  </div>
</template>

<style scoped>
.city-wrap {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  /* fallback sky for reduced-motion / pre-WebGL paint */
  background: linear-gradient(to bottom, #05070f 0%, #0a1024 55%, #162145 82%, #39305a 100%);
}
.canvas-host { position: absolute; inset: 0; }

.orb-layer {
  position: absolute;
  top: 42%;
  left: 50%;
  width: clamp(220px, 26vw, 380px);
  aspect-ratio: 1;
  mix-blend-mode: screen;
  z-index: 1;
  pointer-events: none;
}

.vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(120% 100% at 50% 42%, transparent 52%, rgba(3, 5, 12, 0.7) 100%);
}
.grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
</style>
