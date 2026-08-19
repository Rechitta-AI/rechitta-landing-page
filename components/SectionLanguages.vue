<template>
  <section id="languages" class="section languages">
    <p class="eyebrow">MULTILINGUAL BY DESIGN</p>
    <h2 class="display">She speaks<br />your language.</h2>
    <p class="body">
      Rechitta briefs buyers in the language they think in — live, in voice and text.
      Dubai sells to the world; your AI should too.
    </p>
    <div class="marquee" aria-hidden="true">
      <div class="marquee-track">
        <span v-for="(l, i) in [...langs, ...langs]" :key="i">{{ l }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const langs = [
  'English', 'العربية', 'हिन्दी', 'Русский', '中文', 'Français',
  'Deutsch', 'Türkçe', 'اردو', 'Español', 'Italiano', 'فارسی'
]
</script>

<style scoped>
.languages { text-align: center; }
.languages h2 { font-size: clamp(36px, 5vw, 60px); margin: 18px 0 16px; }
.body {
  max-width: 480px;
  margin: 0 auto 48px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.marquee {
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 15%, #000 85%, transparent);
  mask-image: linear-gradient(to right, transparent, #000 15%, #000 85%, transparent);
}
.marquee-track {
  display: flex;
  gap: 56px;
  width: max-content;
  animation: scroll 32s linear infinite;
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--text-dim);
}
@keyframes scroll {
  to { transform: translateX(-50%); }
}
</style>
