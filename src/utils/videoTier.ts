export type Tier = 'av1' | 'hevc' | 'h264';

let cachedTier: Tier | null = null;

/**
 * Pick the best 4K codec this browser can actually decode in hardware.
 *   av1  — Chrome, Edge, Firefox, Safari 17.4+ (~69 MB total 4K payload)
 *   hevc — Apple devices without AV1 (~68.5 MB total 4K payload)
 *   h264 — Standard compatibility fallback (~168 MB total 4K payload)
 */
export function pickTier(): Tier {
  if (cachedTier) return cachedTier;
  if (typeof document === 'undefined') return 'h264';

  const v = document.createElement('video');
  // Check AV1 support
  if (v.canPlayType('video/mp4; codecs="av01.0.08M.08"') !== '') {
    cachedTier = 'av1';
    return 'av1';
  }
  // Check HEVC (H.265) support
  if (
    v.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"') !== '' ||
    v.canPlayType('video/mp4; codecs="hvc1.1.6.L93.B0"') !== ''
  ) {
    cachedTier = 'hevc';
    return 'hevc';
  }
  cachedTier = 'h264';
  return 'h264';
}

/** Pure 4K: all player pipelines resolve directly to native 4K media */
export const fullUrl = (key: string, tier: Tier = pickTier()) => `/film/video/${key}.${tier}.mp4`;
export const proxyUrl = (key: string) => fullUrl(key, pickTier());
