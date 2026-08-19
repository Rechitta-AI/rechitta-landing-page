<template>
  <!-- prefers-reduced-motion fallback: the film as a still storyboard with the
       full narrative copy (PLAN Phase 1 quality gates). No canvas, no scrub. -->
  <div class="sb-root">
    <section v-for="(sc, i) in SCENES" :key="i" class="sb-scene">
      <img v-if="sc.still" :src="stillSrc(sc.still)" :alt="sc.alt" loading="lazy" />
      <div class="sb-copy">
        <div class="eyebrow">{{ sc.eyebrow }}</div>
        <component :is="i === 0 ? 'h1' : 'h2'" class="display">{{ sc.title }}</component>
        <p>{{ sc.body }}</p>
      </div>
    </section>
    <section class="sb-scene sb-finale">
      <div class="sb-copy">
        <div class="wordmark">RECHITTA</div>
        <h2 class="display">One source of truth.</h2>
        <div class="ctas">
          <NuxtLink class="btn" to="/developers" @click="track('cta_clicked', { cta: 'developers', scene: 'storyboard' })">For developers</NuxtLink>
          <NuxtLink class="btn ghost" to="/brokers" @click="track('cta_clicked', { cta: 'brokers', scene: 'storyboard' })">For brokers</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { FilmManifest } from '~/utils/filmLoader'

const props = defineProps<{ manifest: FilmManifest; filmBase: string }>()
const { track } = useTrack()

function stillSrc(key: string) {
  const v = props.manifest.stills[key]?.landscape
  return v ? `${props.filmBase.replace(/\/$/, '')}/${v.src}` : ''
}

const SCENES = [
  { still: 'kf-01', eyebrow: 'Rechitta', title: 'One source of truth.', alt: 'Dawn over Downtown Dubai', body: 'Live developer inventory, delivered as conversation — to every broker, and every buyer, in their language.' },
  { still: 'kf-03', eyebrow: 'The developer', title: 'One launch. Thousands of briefings.', alt: 'A developer boardroom at launch week', body: 'Every Dubai launch depends on an open broker network — thousands of brokers, 40+ nationalities, briefing cycles that go stale in weeks while prices move weekly. Rechitta carries the launch to every one of them, live.' },
  { still: 'kf-05', eyebrow: 'The broker', title: 'Ask. Match. Send.', alt: 'A broker’s phone showing a live inventory match', body: '“Client budget AED 2.1M — one-bed, marina view, handover before 2028.” Two matches in live inventory, confirmed minutes ago. One tap sends the briefing to the client.' },
  { still: 'kf-06', eyebrow: 'The buyer', title: 'Your briefing is ready.', alt: 'A buyer abroad reading a briefing on their phone', body: 'The buyer reads it in their own language — English, Italian, Russian — with every answer grounded in live developer data.' },
  { still: 'kf-04', eyebrow: 'Every market', title: 'One briefing. Every market. The same day.', alt: 'A street-level view of a broker at golden hour', body: 'Mumbai, Moscow, London, Shanghai, Riyadh, Paris — the same moment, the same truth, each in its own language.' }
]
</script>

<style scoped>
.sb-root { background: #070E16; color: #F5F1E8; font-family: 'Sora', sans-serif; font-weight: 300; }
.sb-scene { min-height: 70vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 8vh 24px; gap: 28px; }
.sb-scene img { width: min(880px, 92vw); border-radius: 12px; box-shadow: 0 30px 80px rgba(0, 0, 0, .55); }
.sb-copy { max-width: 620px; text-align: center; }
.eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .22em; text-transform: uppercase; color: #E8A24B; margin-bottom: 14px; }
.display { font-family: 'Marcellus', serif; font-weight: 400; line-height: 1.15; font-size: clamp(28px, 4.6vw, 56px); }
.sb-copy p { margin-top: 16px; font-size: 15px; line-height: 1.7; color: #F2DCB8; opacity: .92; }
.wordmark { font-family: 'Marcellus', serif; letter-spacing: .55em; text-indent: .55em; color: #F2DCB8; opacity: .9; }
.ctas { display: flex; gap: 14px; margin-top: 34px; flex-wrap: wrap; justify-content: center; }
.btn { display: inline-block; font-family: 'Sora'; font-weight: 600; font-size: 13px; color: #070E16; background: #E8A24B; border-radius: 8px; padding: 12px 20px; text-decoration: none; }
.btn.ghost { background: transparent; color: #F2DCB8; border: 1px solid rgba(242, 220, 184, .22); }
</style>
