<script setup lang="ts">
/**
 * Homepage — the "One Source of Truth" scroll film. Scroll is the playhead of
 * a pre-rendered photoreal film (see prototype/CLAUDE.md, PLAN.md): sky →
 * boardroom → broker → buyer → world montage → return → night finale →
 * infinite loop back to dawn. The film is canvas, so this SSG shell carries
 * the real DOM copy for SEO; reduced-motion visitors get the still storyboard
 * with the full narrative instead. (The previous CityScrub homepage lives on
 * branch v2-nuxt — the film supersedes it.)
 */
import type { FilmManifest } from '~/utils/filmLoader'

const config = useRuntimeConfig()
const filmBase = config.public.filmBase as string

// Client-only fetch: the manifest is a static asset (public/film in dev, the
// CDN origin in production) — SSR's internal fetch routes it into the Vue
// router instead of the static handler, and the film is <ClientOnly> anyway.
const { data: manifest } = useFetch<FilmManifest>(`${filmBase}/manifest.json`, { server: false })

const reduced = ref(false)
const route = useRoute()
// dev-only calibration mode: /?calibrate=kf-03-screen
const calibrateId = import.meta.dev ? (route.query.calibrate as string | undefined) : undefined
// ?storyboard=1 deep-links the still storyboard (QA + shareable no-motion version)
const wantsStoryboard = computed(() => reduced.value || route.query.storyboard !== undefined)
onMounted(() => {
  reduced.value = matchMedia('(prefers-reduced-motion: reduce)').matches
})

useHead({
  title: 'Rechitta — One source of truth',
  meta: [
    { name: 'description', content: 'Live developer inventory, delivered as conversation — to every broker, and every buyer, in their language. The AI briefing layer for Dubai off-plan real estate.' },
    { property: 'og:title', content: 'Rechitta — One source of truth' },
    { property: 'og:description', content: 'Live developer inventory, delivered as conversation — to every broker and every buyer, in their language.' },
    { property: 'og:image', content: 'https://rechitta.com/film/og-hero.jpg' },
    { property: 'og:url', content: 'https://rechitta.com' }
  ],
  link: [
    // Film typography — ratified: Marcellus + Sora supersede Playfair/Inter
    // on film surfaces; IBM Plex Mono for HUD/labels.
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Marcellus&family=Sora:wght@300;400;600&family=IBM+Plex+Mono:wght@400;500&display=swap' }
  ]
})
</script>

<template>
  <main>
    <!-- SEO shell: the film is canvas, so the narrative lives here as real,
         prerendered DOM. Visually hidden, never display:none — crawlers and
         screen readers both get the full story. -->
    <div class="narrative">
      <h2>The story</h2>
      <p>
        Rechitta is the communication layer for off-plan real estate in Dubai.
        A developer launches a project: thousands of brokers to brief, buyers in
        dozens of languages, prices that move weekly. Rechitta carries the
        launch as one living briefing — from the boardroom to every broker's
        phone, to every buyer, in their language, grounded in live developer
        inventory. One launch, thousands of briefings, one source of truth.
      </p>
      <p>
        For developers: control and reach — your project briefed identically to
        the entire market, updated live. For brokers: speed — ask in plain
        words, match against live inventory, send a briefing that answers back.
        For buyers: trust — answers in your language, grounded in the
        developer's own data.
      </p>
    </div>

    <ClientOnly>
      <FilmCalibrationTool v-if="calibrateId && manifest" :anchor-id="calibrateId" :manifest="manifest" :film-base="filmBase" />
      <FilmStoryboard v-else-if="wantsStoryboard && manifest" :manifest="manifest" :film-base="filmBase" />
      <FilmScrollFilm v-else-if="manifest" :manifest="manifest" :film-base="filmBase" />
    </ClientOnly>
  </main>
</template>

<style scoped>
/* visually hidden, crawlable */
.narrative {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
