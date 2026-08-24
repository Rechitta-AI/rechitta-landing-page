<template>
  <div class="earth-globe-container" ref="containerRef" :style="{ opacity: rootOpacity }">
    <div v-if="errorMessage" class="error-toast">{{ errorMessage }}</div>
    <!-- WebGPU canvas will be appended here -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three/webgpu'
import { step, normalWorldGeometry, output, texture, vec3, vec4, normalize, positionWorld, bumpMap, cameraPosition, color, uniform, mix, uv, max } from 'three/tsl'

const props = defineProps<{
  progress: number
  dashProgress?: number
}>()

const emit = defineEmits<{
  (e: 'orb-target', pos: { x: number, y: number, s: number, visible: boolean }): void
}>()

const containerRef = ref<HTMLElement>()
const rootOpacity = ref(0)
const errorMessage = ref('')

let renderer: any
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let globe: THREE.Mesh
let atmosphere: THREE.Mesh
let raf: number

// Cities
const CITIES = {
  dubai: { lat: 25.2048, lon: 55.2708 },
  mumbai: { lat: 19.0760, lon: 72.8777 },
  moscow: { lat: 55.7558, lon: 37.6173 },
  shanghai: { lat: 31.2304, lon: 121.4737 },
  riyadh: { lat: 24.7136, lon: 46.6753 },
  paris: { lat: 48.8566, lon: 2.3522 },
  london: { lat: 51.5074, lon: -0.1278 }
}

const WAYPOINTS = [
  // Initial fade-in pulling out from Dubai
  { p: 0.00, lat: CITIES.dubai.lat, lon: CITIES.dubai.lon, camZ: 1.05, opacity: 0 },
  { p: 0.10, lat: CITIES.dubai.lat, lon: CITIES.dubai.lon, camZ: 8.0, opacity: 1 },

  // Mumbai
  { p: 0.15, lat: CITIES.mumbai.lat, lon: CITIES.mumbai.lon, camZ: 8.0, opacity: 1 },
  { p: 0.25, lat: CITIES.mumbai.lat, lon: CITIES.mumbai.lon, camZ: 3.5, opacity: 1 },

  // Moscow
  { p: 0.27, lat: CITIES.moscow.lat, lon: CITIES.moscow.lon, camZ: 8.0, opacity: 1 },
  { p: 0.37, lat: CITIES.moscow.lat, lon: CITIES.moscow.lon, camZ: 3.5, opacity: 1 },

  // Shanghai
  { p: 0.39, lat: CITIES.shanghai.lat, lon: CITIES.shanghai.lon, camZ: 8.0, opacity: 1 },
  { p: 0.49, lat: CITIES.shanghai.lat, lon: CITIES.shanghai.lon, camZ: 3.5, opacity: 1 },

  // Riyadh
  { p: 0.51, lat: CITIES.riyadh.lat, lon: CITIES.riyadh.lon, camZ: 8.0, opacity: 1 },
  { p: 0.61, lat: CITIES.riyadh.lat, lon: CITIES.riyadh.lon, camZ: 3.5, opacity: 1 },

  // Paris
  { p: 0.63, lat: CITIES.paris.lat, lon: CITIES.paris.lon, camZ: 8.0, opacity: 1 },
  { p: 0.73, lat: CITIES.paris.lat, lon: CITIES.paris.lon, camZ: 3.5, opacity: 1 },

  // London
  { p: 0.75, lat: CITIES.london.lat, lon: CITIES.london.lon, camZ: 8.0, opacity: 1 },
  { p: 0.85, lat: CITIES.london.lat, lon: CITIES.london.lon, camZ: 3.5, opacity: 1 },

  // Dubai (Return)
  { p: 0.87, lat: CITIES.dubai.lat, lon: CITIES.dubai.lon, camZ: 8.0, opacity: 1 },
  { p: 0.95, lat: CITIES.dubai.lat, lon: CITIES.dubai.lon, camZ: 3.5, opacity: 1 },
  { p: 1.00, lat: CITIES.dubai.lat, lon: CITIES.dubai.lon, camZ: 3.5, opacity: 1 }
]

function getTargetQuaternion(lat: number, lon: number) {
  const targetRot = new THREE.Euler(
    THREE.MathUtils.degToRad(lat),
    THREE.MathUtils.degToRad(-(lon + 90)),
    0,
    'XYZ'
  )
  return new THREE.Quaternion().setFromEuler(targetRot)
}

function getCityLocalVector(lat: number, lon: number, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 90) * (Math.PI / 180)
  return new THREE.Vector3().setFromSphericalCoords(radius, phi, theta)
}

onMounted(async () => {
  if (!containerRef.value) return

  try {
    scene = new THREE.Scene()
    scene.background = null

    camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.01, 100)
    camera.position.set(0, 0, 8.0)

  const sun = new THREE.DirectionalLight('#ffffff', 2.5)
  sun.position.set(5, 1, 2)
  scene.add(sun)

  const atmosphereDayColor = uniform(color('#4db2ff'))
  const atmosphereTwilightColor = uniform(color('#E8A24B'))
  const roughnessLow = uniform(0.25)
  const roughnessHigh = uniform(0.35)

  const textureLoader = new THREE.TextureLoader()
  const BASE_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/'
  
  const dayTexture = textureLoader.load(BASE_URL + 'earth_day_4096.jpg')
  dayTexture.colorSpace = THREE.SRGBColorSpace
  dayTexture.anisotropy = 4

  const nightTexture = textureLoader.load(BASE_URL + 'earth_night_4096.jpg')
  nightTexture.colorSpace = THREE.SRGBColorSpace
  nightTexture.anisotropy = 4

  const bumpRoughnessCloudsTexture = textureLoader.load(BASE_URL + 'earth_bump_roughness_clouds_4096.jpg')
  bumpRoughnessCloudsTexture.anisotropy = 4

  const viewDirection = positionWorld.sub(cameraPosition).normalize()
  const fresnel = viewDirection.dot(normalWorldGeometry).abs().oneMinus().toVar()
  const sunOrientation = normalWorldGeometry.dot(normalize(sun.position)).toVar()
  const atmosphereColor = mix(atmosphereTwilightColor, atmosphereDayColor, sunOrientation.smoothstep(-0.25, 0.75))

  const globeMaterial = new THREE.MeshStandardNodeMaterial()
  const cloudsStrength = texture(bumpRoughnessCloudsTexture, uv()).b.smoothstep(0.2, 1)
  globeMaterial.colorNode = mix(texture(dayTexture), vec3(1), cloudsStrength.mul(2))
  
  const roughness = max(texture(bumpRoughnessCloudsTexture).g, step(0.01, cloudsStrength))
  globeMaterial.roughnessNode = roughness.remap(0, 1, roughnessLow, roughnessHigh)

  const night = texture(nightTexture)
  const dayStrength = sunOrientation.smoothstep(-0.25, 0.5)
  const atmosphereDayStrength = sunOrientation.smoothstep(-0.5, 1)
  const atmosphereMix = atmosphereDayStrength.mul(fresnel.pow(2)).clamp(0, 1)

  let finalOutput = mix(night.rgb, output.rgb, dayStrength)
  finalOutput = mix(finalOutput, atmosphereColor, atmosphereMix)
  globeMaterial.outputNode = vec4(finalOutput, output.a)

  const bumpElevation = max(texture(bumpRoughnessCloudsTexture).r, cloudsStrength)
  globeMaterial.normalNode = bumpMap(bumpElevation)

    const sphereGeometry = new THREE.SphereGeometry(1, 64, 64)
    globe = new THREE.Mesh(sphereGeometry, globeMaterial)
    scene.add(globe)

    // Add city markers (stored so we can scale them up during dashboard)
    const markerGeo = new THREE.CircleGeometry(0.015, 32)
    const markerMat = new THREE.MeshBasicMaterial({ 
      color: 0xE8A24B, 
      transparent: true, 
      opacity: 0.9,
      side: THREE.DoubleSide
    })
    
    // We add user data to identify it for scaling later
    Object.values(CITIES).forEach(city => {
      const marker = new THREE.Mesh(markerGeo, markerMat)
      const pos = getCityLocalVector(city.lat, city.lon, 1.002) // Slightly above surface
      marker.position.copy(pos)
      marker.lookAt(pos.clone().multiplyScalar(2)) // Orient to surface normal
      marker.userData.isMarker = true
      globe.add(marker)
    })

    const atmosphereMaterial = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, transparent: true })
  let alpha = fresnel.remap(0.73, 1, 1, 0).pow(3)
  alpha = alpha.mul(sunOrientation.smoothstep(-0.5, 1))
  atmosphereMaterial.outputNode = vec4(atmosphereColor, alpha)
  
  atmosphere = new THREE.Mesh(sphereGeometry, atmosphereMaterial)
  atmosphere.scale.setScalar(1.04)
  scene.add(atmosphere)

    renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    containerRef.value.appendChild(renderer.domElement)

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onWindowResize)
    
    // WebGPURenderer requires explicit initialization before manual rendering
    await renderer.init()

    const animate = () => {
      updateJourney(props.progress)
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()
  } catch (err: any) {
    errorMessage.value = "EarthGlobe Init Error: " + (err.message || err.toString())
    console.error("EarthGlobe Init Error:", err)
  }
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  if (renderer) renderer.dispose()
})

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function updateJourney(p: number) {
  if (!globe || p < 0 || p > 1) return

  let i = 0
  while (i < WAYPOINTS.length - 2 && WAYPOINTS[i + 1].p < p) i++
  
  const A = WAYPOINTS[i]
  const B = WAYPOINTS[i + 1]
  const localP = Math.max(0, Math.min(1, (p - A.p) / (B.p - A.p)))
  
  const ease = localP * localP * (3 - 2 * localP)

  const currentLat = lerp(A.lat, B.lat, ease)
  const currentLon = lerp(A.lon, B.lon, ease)
  
  let targetLat = currentLat
  let targetLon = currentLon
  let targetCamZ = lerp(A.camZ, B.camZ, ease)
  let markerScale = 1.0

  if (props.dashProgress !== undefined && props.dashProgress >= 0) {
    const dP = Math.pow(Math.min(props.dashProgress * 2, 1), 0.5) // ease out quickly
    // Interpolate from wherever we ended up, to the wide dashboard view (Dubai centered)
    targetLat = lerp(targetLat, 25, dP)
    targetLon = lerp(targetLon, 55, dP)
    targetCamZ = lerp(targetCamZ, 12, dP) // Wide angle
    markerScale = lerp(1.0, 3.0, dP) // Scale up markers
    rootOpacity.value = 1.0 // Keep it visible
  } else {
    rootOpacity.value = lerp(A.opacity, B.opacity, ease)
  }

  camera.position.z = targetCamZ

  const qA = getTargetQuaternion(A.lat, A.lon)
  const qB = getTargetQuaternion(B.lat, B.lon)
  const qTarget = new THREE.Quaternion().copy(qA).slerp(qB, ease)
  
  if (props.dashProgress !== undefined && props.dashProgress >= 0) {
    const dP = Math.pow(Math.min(props.dashProgress * 2, 1), 0.5)
    const qDash = getTargetQuaternion(25, 55)
    globe.quaternion.copy(qTarget).slerp(qDash, dP)
  } else {
    globe.quaternion.copy(qTarget)
  }

  // Update marker sizes
  globe.children.forEach(child => {
    if (child.userData.isMarker) {
      child.scale.setScalar(markerScale)
    }
  })
  
  const cityLocal = getCityLocalVector(targetLat, targetLon)
  const cityWorld = cityLocal.clone().applyMatrix4(globe.matrixWorld)
  
  cityWorld.project(camera)
  
  const screenX = (cityWorld.x * 0.5 + 0.5) * 100
  const screenY = (-cityWorld.y * 0.5 + 0.5) * 100

  const orbScale = lerp(1, 0.5, p)
  
  emit('orb-target', { 
    x: screenX, 
    y: screenY, 
    s: orbScale,
    visible: p > 0.1 && p < 0.95 
  })
}
</script>

<style scoped>
.earth-globe-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 0; /* Sits below the video canvas (z=1) */
  transition: opacity 0.1s linear;
}

.error-toast {
  position: absolute;
  top: 20px;
  left: 20px;
  background: red;
  color: white;
  padding: 10px;
  z-index: 9999;
  font-family: monospace;
}
</style>
