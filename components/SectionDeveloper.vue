<script setup lang="ts">
const { track } = useTrack()
const config = useRuntimeConfig()

const form = reactive({ name: '', company: '', contact: '', project: '' })
const state = ref<'idle' | 'sending' | 'done' | 'error'>('idle')

async function submit() {
  state.value = 'sending'
  track('lead:upload_project_submitted_attempt')
  try {
    await $fetch(`${config.public.apiBase}/leads`, { method: 'POST', body: { ...form } })
    state.value = 'done'
    track('lead:upload_project_submitted')
  } catch {
    state.value = 'error'
    track('lead:upload_project_failed')
  }
}
</script>

<template>
  <section id="developers" class="section developer">
    <div class="copy">
      <p class="eyebrow">FOR DEVELOPERS &amp; MASTER BROKERS</p>
      <h2 class="display">One upload.<br />One intelligent brief.</h2>
      <p class="body">
        Connect your inventory once. Every broker pitching your project gets an AI that
        knows your live units, prices and payment plans — and you see exactly how it's
        being pitched.
      </p>
    </div>

    <form v-if="state !== 'done'" class="lead-form" @submit.prevent="submit">
      <div class="field">
        <label for="lead-name">Your name</label>
        <input id="lead-name" v-model="form.name" required placeholder="Full name" />
      </div>
      <div class="field">
        <label for="lead-company">Company</label>
        <input id="lead-company" v-model="form.company" placeholder="Developer / brokerage" />
      </div>
      <div class="field">
        <label for="lead-contact">Email or WhatsApp</label>
        <input id="lead-contact" v-model="form.contact" required placeholder="How do we reach you?" />
      </div>
      <div class="field">
        <label for="lead-project">Project</label>
        <input id="lead-project" v-model="form.project" required placeholder="Which development do you want on Rechitta?" />
      </div>
      <button class="btn btn-primary" type="submit" :disabled="state === 'sending'">
        {{ state === 'sending' ? 'Sending…' : 'Upload your project →' }}
      </button>
      <p v-if="state === 'error'" class="form-error">Something went wrong — try again or write to aryaman@rechitta.com.</p>
    </form>

    <div v-else class="lead-done">
      <p class="display">We're on it.</p>
      <p class="body">The team will reach out within one business day to get your project live.</p>
    </div>
  </section>
</template>

<style scoped>
.developer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}
.developer h2 { font-size: clamp(34px, 4.5vw, 56px); margin: 18px 0 16px; }
.body { color: var(--text-secondary); line-height: 1.65; max-width: 440px; }

.lead-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 32px;
  border: 1px solid rgba(250, 250, 249, 0.1);
  border-radius: 18px;
  background: rgba(250, 250, 249, 0.02);
}
.lead-form .btn { justify-content: center; margin-top: 6px; }
.form-error { font-size: 13px; color: #e57373; }

.lead-done { text-align: center; }
.lead-done .display { font-size: 34px; margin-bottom: 10px; }

@media (max-width: 860px) {
  .developer { grid-template-columns: 1fr; gap: 40px; }
}
</style>
