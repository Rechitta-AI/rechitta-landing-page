<script setup lang="ts">
/**
 * The investor finale, ported from v1: demo phone playing the product
 * prototype, with the orb's journey ending inside the phone screen
 * (see OrbStage — it targets #investor-phone).
 */
const { track } = useTrack()

const stats = [
  { value: '150+', label: 'Countries of buyers' },
  { value: '<2s', label: 'Response time' },
  { value: '0', label: 'Forms to fill' }
]
</script>

<template>
  <section id="contact" class="section finale">
    <div class="phone-col">
      <div id="investor-phone" class="phone">
        <video src="/brand/prototype.mov" autoplay loop muted playsinline />
      </div>
    </div>

    <div class="copy-col">
      <p class="eyebrow">AVAILABLE NOW</p>
      <h2 class="display">Your <em>private</em><br />property curator.</h2>
      <p class="body">
        Not a listing. Not an agent. The source of truth — in your language,
        at any hour, without a broker call.
      </p>

      <div class="stat-row">
        <div v-for="s in stats" :key="s.label" class="stat">
          <p class="stat-value display">{{ s.value }}</p>
          <p class="stat-label">{{ s.label }}</p>
        </div>
      </div>

      <div class="ctas">
        <a
          href="https://beta.rechitta.com/login"
          target="_blank"
          rel="noopener"
          class="btn btn-primary"
          @click="track('cta:talk_to_rechitta_click', { placement: 'finale' })"
        >
          Talk to Rechitta →
        </a>
        <NuxtLink
          to="/developers#upload"
          class="btn btn-ghost"
          @click="track('cta:upload_project_click', { placement: 'finale' })"
        >
          Upload your project
        </NuxtLink>
        <span class="live-badge"><span class="dot" />Live now</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.finale {
  display: flex;
  align-items: center;
  gap: clamp(32px, 4vw, 64px);
  padding-bottom: 160px;
}

.phone-col { flex-shrink: 0; }
.phone {
  width: clamp(200px, 22vw, 320px);
  background: var(--bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 32px 100px rgba(0, 0, 0, 0.85), 0 0 0 0.5px rgba(255, 255, 255, 0.06);
}
.phone video {
  display: block;
  width: 100%;
  height: auto;
}

.copy-col { flex: 1; }
.copy-col h2 {
  font-size: clamp(34px, 4.5vw, 56px);
  margin: 16px 0 14px;
}
.copy-col em { font-style: italic; }
.body {
  color: var(--text-secondary);
  line-height: 1.65;
  max-width: 440px;
  margin-bottom: 28px;
}

.stat-row {
  display: flex;
  gap: clamp(20px, 3vw, 40px);
  flex-wrap: wrap;
}
.stat-value {
  font-size: clamp(28px, 3.8vw, 52px);
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 10px;
}
.stat-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
}

.ctas {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
  flex-wrap: wrap;
}
.live-badge {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.7);
}

@media (max-width: 860px) {
  .finale {
    flex-direction: column;
    text-align: center;
  }
  .body { margin-inline: auto; }
  .stat-row, .ctas { justify-content: center; }
}
</style>
