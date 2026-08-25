export type Tier = 'av1' | 'hevc' | 'h264';

/**
 * Pick the best codec this browser can actually decode.
 *   av1  — Chrome, Edge, Firefox, Safari 17.4+. Smallest at 4K.
 *   hevc — Apple devices without AV1. Full 4K, hardware-decoded.
 *   h264 — 1080p last resort.
 */
export function pickTier(): Tier {
  if (typeof document === 'undefined') return 'h264';
  const probe = document.createElement('video');

  if (probe.canPlayType('video/mp4; codecs="av01.0.08M.10"') === 'probably') return 'av1';
  if (probe.canPlayType('video/mp4; codecs="hvc1.1.6.L120.B0"') !== '') return 'hevc';
  if (probe.canPlayType('video/mp4; codecs="av01.0.08M.10"') !== '') return 'av1';
  return 'h264';
}

export const proxyUrl = (key: string) => `/film/video/${key}.proxy.mp4`;
export const fullUrl = (key: string, tier: Tier) => `/film/video/${key}.${tier}.mp4`;
