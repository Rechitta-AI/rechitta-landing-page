<script setup lang="ts">
// The homepage is the scroll film: it owns its chrome (HUD, float CTA) and
// loops infinitely — no header overlay, no footer "bottom" (ratified: legal/
// investor links move to a drawer, Phase 2). Other routes keep site chrome.
const route = useRoute()
const isFilm = computed(() => route.path === '/')
</script>

<template>
  <div>
    <AppHeader v-if="!isFilm" />
    <NuxtPage />
    <AppFooter v-if="!isFilm" />
  </div>
</template>
