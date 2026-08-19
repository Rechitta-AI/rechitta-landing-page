/**
 * Thin tracking wrapper around PostHog. Safe to call anywhere — no-ops when
 * PostHog is not configured (e.g. local dev without a key).
 *
 * Event naming convention: `area:action` — e.g. `cta:upload_project_click`,
 * `waitlist:submitted`, `hero:conversation_loop_completed`.
 */
export function useTrack() {
  const { $posthog } = useNuxtApp()

  function track(event: string, properties?: Record<string, unknown>) {
    $posthog?.capture(event, properties)
  }

  return { track }
}
