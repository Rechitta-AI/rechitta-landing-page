<template>
  <section class="press">
    <p class="kicker">AS FEATURED IN · 52 placements · 13.2M readers · May 2026</p>
    <ul class="outlets">
      <li>Khaleej Times</li>
      <li>Zawya</li>
      <li>Gulf Today</li>
      <li>Al Bayan</li>
      <li>Dubai Eye 103.8</li>
      <li>Property Times</li>
    </ul>
  </section>
</template>

<style scoped>
.press {
  padding: 36px 24px 56px;
  text-align: center;
  border-top: 1px solid rgba(250, 250, 249, 0.06);
  border-bottom: 1px solid rgba(250, 250, 249, 0.06);
}
.kicker {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 22px;
}
.outlets {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 18px 40px;
  font-family: var(--font-display);
  font-size: 19px;
  color: var(--text-secondary);
}
</style>
