export type Tier = 'av1' | 'hevc' | 'h264';

/**
 * Pick the best codec this browser can actually decode.
 *   av1  — Chrome, Edge, Firefox, Safari 17.4+. Smallest at 4K.
 *   hevc — Apple devices without AV1. Full 4K, hardware-decoded.
 *   h264 — 1080p last resort.
 */
export function pickTier(): Tier {
  return 'h264';
}

export const proxyUrl = (key: string) => `/film/video/${key}.h264.mp4`;
export const fullUrl = (key: string, tier: Tier) => `/film/video/${key}.${tier}.mp4`;
