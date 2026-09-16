export type Tier = 'av1' | 'hevc' | 'h264' | '1080p' | 'proxy';

let cachedTier: Tier | null = null;

/**
 * `?filmTier=proxy` or `?filmTier=1080p` forces specific cuts for QA and testing.
 */
function override(): Tier | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('filmTier');
  return value === 'av1' || value === 'hevc' || value === 'h264' || value === '1080p' || value === 'proxy'
    ? value
    : null;
}

/**
 * Which cut of the film to stream.
 *
 * 1080p H.264 on every device, unless `?filmTier=` asks for another.
 *
 * The 4K cuts were measured against it on an M2 with hardware HEVC decoding,
 * about as good a case as they will ever get, and they lost on every count.
 * The transitions play at 2.4–3.6x, which asks a decoder for up to ninety 4K
 * frames a second: a fifth to two fifths of them were dropped, the main
 * thread picked up 270–930ms blocking tasks on every scene change, and the
 * city chapter sat at 30fps while the next 4K clip preloaded behind it. At
 * 1080p every one of those went to zero. AV1 was worse again: 4K AV1 decodes
 * on the CPU even on that machine.
 *
 * H.264 at 1080p is decoded in hardware by effectively everything, which is
 * what makes it the one cut that is smooth on every device rather than on
 * the best ones.
 */
export function pickTier(): Tier {
  if (cachedTier) return cachedTier;
  cachedTier = override() ?? '1080p';
  return cachedTier;
}

export const fullUrl = (key: string, tier: Tier = pickTier()) => {
  const resolvedKey = key === 'last' ? 'last-scene' : key;
  return `/film/video/${resolvedKey}.${tier}.mp4`;
};
