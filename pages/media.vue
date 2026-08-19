<script setup lang="ts">
const { track } = useTrack()

useHead({
  title: 'Rechitta — Press & Media',
  meta: [
    {
      name: 'description',
      content:
        'Press resources for Rechitta, the AI briefing layer for Dubai off-plan real estate. 52 placements across English and Arabic media in May 2026.'
    }
  ]
})

onMounted(() => track('persona:landing_view', { persona: 'media' }))
</script>

<template>
  <main>
    <PersonaHero
      eyebrow="PRESS & MEDIA"
      title="Rechitta, in the press."
      subtitle="52 placements across English and Arabic media in May 2026 — including Khaleej Times, Zawya, Gulf Today, Al Bayan, Dubai Eye 103.8, and the cover of Property Times."
    >
      <a
        href="mailto:aryaman@rechitta.com?subject=Press%20enquiry"
        class="btn btn-primary"
        @click="track('cta:press_contact_click', { placement: 'media_hero' })"
      >
        Press enquiries
      </a>
    </PersonaHero>

    <PressStrip />

    <section class="section boilerplate">
      <p class="eyebrow">BOILERPLATE</p>
      <p class="body">
        Rechitta is an AI platform for Dubai's off-plan real estate market. Developers
        put their projects on Rechitta; brokers get an AI agent that knows the live
        inventory and generates branded property briefings for buyers — in the buyer's
        language, by voice or text. Rechitta is live with real developments in Dubai.
      </p>
      <p class="body">
        Brand assets (logo, founder photos, product imagery) are available on request
        via the press contact above.
      </p>
    </section>
  </main>
</template>

<style scoped>
.boilerplate {
  max-width: 640px;
  text-align: center;
}
.boilerplate .eyebrow { margin-bottom: 18px; }
.body {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 16px;
}
</style>
