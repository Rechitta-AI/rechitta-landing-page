# Rechitta — Landing Page (v2)

Nuxt rebuild of [rechitta.com](https://rechitta.com). The v1 static site lives in
[`legacy/`](legacy/) and stays deployed from `main` (GitHub Pages) until cutover.

## North metrics

1. **Catchy** — the page demos the product (self-playing multilingual conversation hero). Measured by scroll completion + time on page.
2. **CTAs** — "Upload your project" (developer lead form) and "Talk to us" everywhere. Measured by conversion per placement.
3. **Broker waitlist** — numbered Founding Broker positions + referral codes. Measured by signups/week + referral coefficient.

## Dev

```bash
npm install
npm run dev     # http://localhost:3000
```

Forms post to Nitro stubs under `server/api/` in dev. No env vars needed locally;
copy `.env.example` to `.env` to override.

## Architecture

- **Hosting:** Cloudflare Pages (static, `npm run generate`), domain `rechitta.com`
- **Analytics:** PostHog via first-party proxy at `/ingest` (set `NUXT_PUBLIC_POSTHOG_KEY`)
- **Forms backend:** Azure Functions, UAE North (leads + waitlist) — `NUXT_PUBLIC_API_BASE`
- **Tracking convention:** `area:action` events via `useTrack()` — see `composables/useTrack.ts`
