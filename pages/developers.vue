<script setup lang="ts">
const { track } = useTrack()

useHead({
  title: 'Rechitta for Developers & Master Brokers',
  meta: [
    {
      name: 'description',
      content:
        'Put your off-plan project on Rechitta. Every broker selling it gets an AI that knows your live inventory — and you see exactly how it is being pitched.'
    }
  ]
})

onMounted(() => track('persona:landing_view', { persona: 'developer' }))

const props = [
  {
    title: 'Brief every broker at once',
    body: 'No more assembling teams for repeated in-person sessions. Your project knowledge reaches the whole network the moment it changes.'
  },
  {
    title: 'Inventory that is never stale',
    body: 'Prices, availability and payment plans update live. Every pitch a broker makes is made from your current truth.'
  },
  {
    title: 'See how you are being sold',
    body: 'Analytics on briefings, engagement and broker performance for every development you put on the platform.'
  }
]
</script>

<template>
  <main>
    <PersonaHero
      eyebrow="FOR DEVELOPERS & MASTER BROKERS"
      title="One upload.&#10;One intelligent brief."
      subtitle="Put your project on Rechitta and every broker selling it gets an AI that knows your live inventory, prices and payment plans — while you see exactly how it's being pitched."
    >
      <a href="#upload" class="btn btn-primary" @click="track('cta:upload_project_click', { placement: 'developers_hero' })">
        Upload your project
      </a>
      <a href="mailto:aryaman@rechitta.com" class="btn btn-ghost" @click="track('cta:talk_to_us_click', { placement: 'developers_hero' })">
        Talk to us
      </a>
    </PersonaHero>

    <section class="section value-props">
      <article v-for="p in props" :key="p.title" class="card">
        <h3>{{ p.title }}</h3>
        <p>{{ p.body }}</p>
      </article>
    </section>

    <div id="upload">
      <SectionDeveloper />
    </div>

    <PressStrip />
  </main>
</template>

<style scoped>
.value-props {
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
.card h3 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 21px;
  margin-bottom: 10px;
}
.card p {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}
@media (max-width: 860px) {
  .value-props { grid-template-columns: 1fr; }
}
</style>
