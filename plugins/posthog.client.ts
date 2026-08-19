import posthog from 'posthog-js'

export default defineNuxtPlugin(() => {
  const { posthogKey, posthogHost } = useRuntimeConfig().public

  if (!posthogKey) {
    // No key configured (local dev) — expose a no-op so call sites never branch.
    return { provide: { posthog: null as typeof posthog | null } }
  }

  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    session_recording: { maskAllInputs: true },
    // Pre-consent default: anonymous/cookieless so there is no tracking
    // blackout before the user accepts. Switch to identified on consent.
    persistence: 'memory'
  })

  return { provide: { posthog } }
})
