<script setup lang="ts">
const { track } = useTrack()

useHead({
  title: 'Rechitta for Brokers — Founding Cohort',
  meta: [
    {
      name: 'description',
      content:
        'Ask about any development on Rechitta and share a branded briefing in your client\'s language — in seconds, on WhatsApp. Join the Founding Broker waitlist.'
    }
  ]
})

onMounted(() => track('persona:landing_view', { persona: 'broker' }))

const props = [
  {
    title: 'Answers in seconds',
    body: 'Which units are left, at what price, on what plan — for any development on Rechitta. No PDFs, no portals, no calls to the sales office.'
  },
  {
    title: 'Briefings that close',
    body: 'Branded, shareable property briefings generated for your client — in the language they think in. Send the link on WhatsApp.'
  },
  {
    title: 'Founding Broker status',
    body: 'A numbered place in the first cohort, early access to every new project, and referrals that move you up the list.'
  }
]
</script>

<template>
  <main>
    <PersonaHero
      eyebrow="FOR BROKERS — FOUNDING COHORT"
      title="Send the link.&#10;Close the deal."
      subtitle="Ask about any development on Rechitta and share a branded briefing in your client's language — in seconds, on WhatsApp."
    >
      <a href="#waitlist" class="btn btn-gold" @click="track('cta:broker_waitlist_click', { placement: 'brokers_hero' })">
        Claim your spot →
      </a>
    </PersonaHero>

    <section class="section value-props">
      <article v-for="p in props" :key="p.title" class="card">
        <h3>{{ p.title }}</h3>
        <p>{{ p.body }}</p>
      </article>
    </section>

    <div id="waitlist">
      <SectionBroker />
    </div>
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
  border: 1px solid rgba(197, 165, 114, 0.22);
  border-radius: 12px;
  background: linear-gradient(160deg, rgba(197, 165, 114, 0.04), rgba(10, 10, 9, 0.3));
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
