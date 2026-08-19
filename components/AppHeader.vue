<script setup lang="ts">
const { track } = useTrack()
</script>

<template>
  <header class="header">
    <a href="/" class="wordmark">
      <img src="/brand/rechitta-wordmark.svg" alt="Rechitta" height="18" />
    </a>
    <nav class="nav">
      <NuxtLink to="/developers" @click="track('nav:developers_click')">Developers</NuxtLink>
      <NuxtLink to="/brokers" @click="track('nav:brokers_click')">Brokers</NuxtLink>
      <NuxtLink to="/buyers" @click="track('nav:buyers_click')">Buyers</NuxtLink>
      <NuxtLink to="/media" @click="track('nav:media_click')">Press</NuxtLink>
    </nav>
    <div class="actions">
      <a href="mailto:aryaman@rechitta.com" class="btn btn-ghost" @click="track('cta:talk_to_us_click', { placement: 'header' })">
        Talk to us
      </a>
      <NuxtLink to="/developers#upload" class="btn btn-primary" @click="track('cta:upload_project_click', { placement: 'header' })">
        Upload your project
      </NuxtLink>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 50;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background: linear-gradient(to bottom, rgba(10, 10, 9, 0.85), rgba(10, 10, 9, 0));
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.wordmark { display: flex; align-items: center; }
.wordmark img { display: block; }

.nav {
  display: flex;
  gap: 32px;
  font-size: 14px;
  color: var(--text-secondary);
}
.nav a { transition: color 250ms; }
.nav a:hover { color: var(--text-primary); }

.actions {
  display: flex;
  gap: 12px;
}
.actions .btn { padding: 10px 20px; font-size: 14px; }

@media (max-width: 760px) {
  .nav { display: none; }
  .actions .btn-ghost { display: none; }
}
</style>
