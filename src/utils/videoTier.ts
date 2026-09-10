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
 * Pick the codec this browser can decode **in hardware**, which is not the
 * same question as which codec it can decode at all.
 *
 * HEVC comes first, not AV1. A browser only reports HEVC support when the
 * platform has a decoder for it, and on Apple hardware that decoder is always
 * silicon. AV1 is the opposite: every recent browser can decode it, but only
 * fairly new chips do so in hardware, and 4K AV1 on the CPU cannot hold the
 * playback rates the transitions run at. Preferring AV1 there is how you get a
 * film that stutters on a two-year-old Mac.
 */
export function pickTier(): Tier {
  if (cachedTier) return cachedTier;
  if (typeof document === 'undefined') return 'h264';

  const forced = override();
  if (forced) {
    cachedTier = forced;
    return forced;
  }

  // On mobile phone screens (< 810px), 1080p delivers razor-sharp Full HD quality
  // with zero pixelation on Retina screens, while consuming ~60% less decoder memory
  // than 4K. Desktop and iPads (>= 810px) continue receiving pristine full 4K.
  if (typeof window !== 'undefined' && window.innerWidth < 810) {
    cachedTier = '1080p';
    return '1080p';
  }

  const v = document.createElement('video');
  const can = (type: string) => v.canPlayType(type) === 'probably';

  if (
    can('video/mp4; codecs="hvc1.1.6.L93.B0"') ||
    can('video/mp4; codecs="hev1.1.6.L93.B0"')
  ) {
    cachedTier = 'hevc';
    return 'hevc';
  }
  if (can('video/mp4; codecs="av01.0.08M.08"')) {
    cachedTier = 'av1';
    return 'av1';
  }
  cachedTier = 'h264';
  return 'h264';
}

export const fullUrl = (key: string, tier: Tier = pickTier()) => {
  const resolvedKey = key === 'last' ? 'last-scene' : key;
  return `/film/video/${resolvedKey}.${tier}.mp4`;
};
