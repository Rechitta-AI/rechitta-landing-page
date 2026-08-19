<template>
  <footer class="footer">
    <img class="brand-icon" src="/brand/rechitta-icon.svg" alt="Rechitta" width="26" />
    <p class="tagline">Real Estate Consciousness · Dubai</p>
    <nav class="links personas">
      <NuxtLink to="/developers">For developers</NuxtLink>
      <NuxtLink to="/brokers">For brokers</NuxtLink>
      <NuxtLink to="/buyers">For buyers</NuxtLink>
      <NuxtLink to="/media">Press</NuxtLink>
    </nav>
    <nav class="links">
      <a href="https://linkedin.com/company/rechitta" target="_blank" rel="noopener">LinkedIn</a>
      <a href="https://instagram.com/rechitta.ai" target="_blank" rel="noopener">Instagram</a>
      <a href="https://beta.rechitta.com/login" target="_blank" rel="noopener">Platform login</a>
      <a href="mailto:aryaman@rechitta.com">aryaman@rechitta.com</a>
    </nav>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid rgba(250, 250, 249, 0.06);
  padding: 48px 24px 64px;
  text-align: center;
}
.brand-icon { display: block; margin: 0 auto 10px; }
.tagline {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 22px;
}
.links {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 28px;
  font-size: 14px;
  color: var(--text-secondary);
}
.personas { margin-bottom: 16px; }
.links a:hover { color: var(--text-primary); }
</style>
