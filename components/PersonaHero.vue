<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <section class="persona-hero">
    <TheOrb class="orb-sized" />
    <p class="eyebrow">{{ eyebrow }}</p>
    <h1 class="display headline" style="white-space: pre-line">{{ title }}</h1>
    <p v-if="subtitle" class="subhead">{{ subtitle }}</p>
    <div class="ctas">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.persona-hero {
  min-height: 88vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120px 24px 60px;
  gap: 26px;
}

.orb-sized {
  width: clamp(200px, 24vw, 320px);
}

.headline {
  font-size: clamp(36px, 5.5vw, 64px);
}

.subhead {
  max-width: 540px;
  color: var(--text-secondary);
  line-height: 1.65;
  font-size: 16px;
}

.ctas {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
