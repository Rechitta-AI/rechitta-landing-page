<script setup lang="ts">
const { track } = useTrack()
const config = useRuntimeConfig()

const form = reactive({ name: '', agency: '', whatsapp: '', languages: '' })
const state = ref<'idle' | 'sending' | 'done' | 'error'>('idle')
const result = ref<{ position: number; referralCode: string } | null>(null)

async function submit() {
  state.value = 'sending'
  track('waitlist:submit_attempt')
  try {
    result.value = await $fetch(`${config.public.apiBase}/waitlist`, { method: 'POST', body: { ...form } })
    state.value = 'done'
    track('waitlist:submitted', { position: result.value?.position })
  } catch {
    state.value = 'error'
    track('waitlist:failed')
  }
}
</script>

<template>
  <section id="brokers" class="section broker">
    <div class="copy">
      <p class="eyebrow">FOR BROKERS — FOUNDING COHORT</p>
      <h2 class="display">Send the link.<br />Close the deal.</h2>
      <p class="body">
        Founding Brokers get early access to every development on Rechitta, briefings in
        the buyer's language, and a place in line that you can move up by referring
        brokers you rate.
      </p>
    </div>

    <form v-if="state !== 'done'" class="waitlist-form" @submit.prevent="submit">
      <div class="field">
        <label for="wl-name">Your name</label>
        <input id="wl-name" v-model="form.name" required placeholder="Full name" />
      </div>
      <div class="field">
        <label for="wl-agency">Agency</label>
        <input id="wl-agency" v-model="form.agency" placeholder="Brokerage you work with" />
      </div>
      <div class="field">
        <label for="wl-whatsapp">WhatsApp</label>
        <input id="wl-whatsapp" v-model="form.whatsapp" required placeholder="+971 …" />
      </div>
      <div class="field">
        <label for="wl-langs">Languages you sell in</label>
        <input id="wl-langs" v-model="form.languages" placeholder="e.g. English, Arabic, Hindi" />
      </div>
      <button class="btn btn-gold" type="submit" :disabled="state === 'sending'">
        {{ state === 'sending' ? 'Joining…' : 'Claim your spot →' }}
      </button>
      <p v-if="state === 'error'" class="form-error">Something went wrong — try again or write to aryaman@rechitta.com.</p>
    </form>

    <div v-else class="waitlist-done">
      <p class="eyebrow">YOU'RE IN</p>
      <p class="display position">Founding Broker #{{ result?.position }}</p>
      <p class="body">
        We'll WhatsApp you when your access opens. Want to move up the list?
        Share your referral code with brokers you rate:
      </p>
      <p class="referral">{{ result?.referralCode }}</p>
    </div>
  </section>
</template>

<style scoped>
.broker {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}
.broker h2 { font-size: clamp(34px, 4.5vw, 56px); margin: 18px 0 16px; }
.body { color: var(--text-secondary); line-height: 1.65; max-width: 440px; }

.waitlist-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 32px;
  border: 1px solid rgba(197, 165, 114, 0.25);
  border-radius: 18px;
  background: linear-gradient(160deg, rgba(197, 165, 114, 0.05), rgba(10, 10, 9, 0.3));
}
.waitlist-form .btn { justify-content: center; margin-top: 6px; }
.form-error { font-size: 13px; color: #e57373; }

.waitlist-done { text-align: center; }
.position { font-size: 36px; margin: 14px 0; color: var(--gold); }
.referral {
  margin-top: 14px;
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: 22px;
  letter-spacing: 0.12em;
  color: var(--gold);
}

@media (max-width: 860px) {
  .broker { grid-template-columns: 1fr; gap: 40px; }
}
</style>
