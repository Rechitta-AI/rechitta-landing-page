<script setup lang="ts">
const { track } = useTrack()

useHead({
  title: 'Rechitta for Buyers — Your private property curator',
  meta: [
    {
      name: 'description',
      content:
        'When your broker sends a Rechitta briefing, you get a private guide to that development — floor plans, payment plans, live availability — in your language, no app required.'
    }
  ]
})

onMounted(() => track('persona:landing_view', { persona: 'buyer' }))

const steps = [
  {
    title: 'Your broker sends a link',
    body: 'A private briefing for the development you are considering. It opens in your browser — nothing to install, nothing to sign up for.'
  },
  {
    title: 'You ask, she answers',
    body: 'Floor plans, payment plans, what is actually still available — in your language, by voice or text, any hour of the day.'
  },
  {
    title: 'You decide with clarity',
    body: 'Everything comes from the developer\'s live inventory for that project. No guesswork, no stale brochures.'
  }
]
</script>

<template>
  <main>
    <PersonaHero
      eyebrow="FOR BUYERS"
      title="Your private&#10;property curator."
      subtitle="When your broker sends a Rechitta briefing, you get a private guide to that development — floor plans, payment plans, live availability — in your language, no app required."
    >
      <NuxtLink to="/" class="btn btn-primary" @click="track('cta:see_demo_click', { placement: 'buyers_hero' })">
        See how a briefing works
      </NuxtLink>
      <a href="mailto:aryaman@rechitta.com" class="btn btn-ghost" @click="track('cta:talk_to_us_click', { placement: 'buyers_hero' })">
        Talk to us
      </a>
    </PersonaHero>

    <section class="section steps">
      <article v-for="(s, i) in steps" :key="s.title" class="card">
        <p class="step-num">0{{ i + 1 }}</p>
        <h3>{{ s.title }}</h3>
        <p>{{ s.body }}</p>
      </article>
    </section>

    <SectionLanguages />
  </main>
</template>

<style scoped>
.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding-top: 0;
}
.card {
  border: 1px solid rgba(250, 250, 249, 0.1);
  border-radius: 12px;
  background: rgba(250, 250, 249, 0.02);
  padding: 24px;
}
.step-num {
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--gold);
  margin-bottom: 12px;
}
.card h3 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 21px;
  margin-bottom: 10px;
}
.card p:last-child {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}
@media (max-width: 860px) {
  .steps { grid-template-columns: 1fr; }
}
</style>
