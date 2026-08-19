// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/tokens.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Rechitta — Your private property curator',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        {
          name: 'description',
          content:
            'Rechitta is the AI briefing layer for Dubai off-plan real estate. Developers brief brokers, brokers brief buyers — live inventory, branded briefings, every language.'
        },
        { property: 'og:title', content: 'Rechitta — Your private property curator' },
        {
          property: 'og:description',
          content:
            'The AI briefing layer for off-plan Dubai. Developers brief brokers; brokers brief buyers.'
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://rechitta.com' }
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&display=swap'
        }
      ]
    }
  },

  runtimeConfig: {
    public: {
      // PostHog: leave key empty to disable tracking (local dev default).
      // On Cloudflare Pages set NUXT_PUBLIC_POSTHOG_KEY; host goes through the
      // first-party /ingest proxy so ad-blockers don't eat events.
      posthogKey: '',
      posthogHost: 'https://rechitta.com/ingest',
      // Forms post here. Local dev uses the Nitro stubs under server/api;
      // production points at the Azure Functions app (UAE North).
      apiBase: '/api',
      // Film assets (frames/stills/plates + manifest.json). Dev serves the
      // repo's public/film; production sets NUXT_PUBLIC_FILM_BASE to the
      // Azure Blob/Front Door origin (PLAN Phase 4) — frames never bundle.
      filmBase: '/film'
    }
  },

  nitro: {
    prerender: { routes: ['/', '/developers', '/brokers', '/buyers', '/media'] }
  }
})
