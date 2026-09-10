/**
 * The video pool.
 *
 * Two rules, both learned the hard way:
 *
 *   1. Only a handful of 4K decoders can be alive at once. Past that limit a
 *      browser does not error — it quietly starts dropping frames, which is
 *      what the flicker was. The pool keeps the current clip and its immediate
 *      neighbours and tears down everything else.
 *
 *   2. A clip is "ready" when the span the film actually plays has arrived and
 *      its first frame is decoded — not when the whole file has landed. The
 *      loader waits on that span, so it opens as soon as the footage the
 *      viewer is about to see is genuinely there.
 */

import { fullUrl } from '@/utils/videoTier';

export type ClipSpan = { key: string; from: number; to: number };

const pool = new Map<string, HTMLVideoElement>();
const blobCache = new Map<string, string>();
const activeFetches = new Map<string, Promise<string>>();

/**
 * Pre-fetches a clip's bytes via standard fetch() and creates an in-memory blob URL.
 * Standard fetch() is never throttled or paused by mobile Safari / Chrome in the background.
 */
export async function preloadBlobUrl(
  key: string,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  if (blobCache.has(key)) {
    onProgress?.(1);
    return blobCache.get(key)!;
  }
  if (activeFetches.has(key)) return activeFetches.get(key)!;

  const url = fullUrl(key);
  const promise = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      let blob: Blob;
      if (total > 0 && response.body && 'getReader' in response.body) {
        const reader = response.body.getReader();
        const chunks: BlobPart[] = [];
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value as BlobPart);
            received += value.length;
            onProgress?.(Math.min(1, received / total));
          }
        }
        blob = new Blob(chunks, { type: 'video/mp4' });
      } else {
        blob = await response.blob();
      }
      onProgress?.(1);

      const blobUrl = URL.createObjectURL(blob);
      blobCache.set(key, blobUrl);

      // If an existing pooled video already exists for this key, update its src
      const existing = pool.get(key);
      if (existing && !existing.src.startsWith('blob:')) {
        const currentTime = existing.currentTime;
        const paused = existing.paused;
        existing.src = blobUrl;
        existing.currentTime = currentTime;
        if (!paused) existing.play().catch(() => {});
      }
      return blobUrl;
    } catch (err) {
      console.warn(`[film] Failed to blob-preload ${key}, falling back to direct URL`, err);
      return url;
    } finally {
      activeFetches.delete(key);
    }
  })();

  activeFetches.set(key, promise);
  return promise;
}

/** The stage all pooled elements are appended into. */
let host: HTMLElement | null = null;

/**
 * Clips that must survive `keepOnly` — the one the background preloader is
 * streaming right now. Without this the pool tears down the element mid-fetch
 * and the preloader waits forever on a video that no longer exists.
 */
const pinned = new Set<string>();

export function setMediaHost(el: HTMLElement | null) {
  host = el;
  if (!el) return;
  pool.forEach((v) => {
    if (v.parentElement !== el) el.append(v);
  });
}

function create(key: string): HTMLVideoElement {
  const v = document.createElement('video');
  const blob = blobCache.get(key);
  v.src = blob ?? fullUrl(key);
  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.setAttribute('webkit-playsinline', '');
  v.preload = 'auto';
  v.setAttribute('aria-hidden', 'true');
  v.dataset.clip = key;
  if (key === 'scene1-3') {
    v.poster = '/film/frames/scene1-3/f_048.webp';
  }
  Object.assign(v.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: '0',
    // The decoder output goes straight to its own layer, so a crossfade never
    // costs a main-thread composite.
    willChange: 'opacity',
    transform: 'translateZ(0)',
  });
  host?.append(v);
  return v;
}

export function acquire(key: string): HTMLVideoElement {
  let v = pool.get(key);
  if (!v) {
    v = create(key);
    pool.set(key, v);
  }
  return v;
}

export function peek(key: string): HTMLVideoElement | undefined {
  return pool.get(key);
}

export function releaseClip(key: string) {
  const v = pool.get(key);
  if (!v) return;
  pool.delete(key);
  v.pause();
  v.removeAttribute('src');
  v.load();
  v.remove();
}

/** Drops every decoder except the ones named, and whatever is streaming. */
export function keepOnly(keys: string[]) {
  const keep = new Set([...keys, ...pinned]);
  [...pool.keys()].forEach((key) => {
    if (!keep.has(key)) releaseClip(key);
  });
}

/** What the pool is holding, and why. For the dev overlay. */
export function poolReport() {
  return { open: [...pool.keys()], pinned: [...pinned] };
}

export function releaseAll() {
  pinned.clear();
  [...pool.keys()].forEach(releaseClip);
  blobCache.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  });
  blobCache.clear();
  activeFetches.clear();
}

/** How much of [from, to] has arrived, 0–1. */
export function bufferedSpan(v: HTMLVideoElement, from: number, to: number): number {
  const need = Math.max(0.001, to - from);
  let have = 0;
  for (let i = 0; i < v.buffered.length; i++) {
    const s = Math.max(from, v.buffered.start(i));
    const e = Math.min(to, v.buffered.end(i));
    if (e > s) have += e - s;
  }
  return Math.min(1, have / need);
}

/**
 * Parks a clip on an exact frame and resolves once that frame is decoded.
 * This is the only place a seek happens outside a transition.
 */
export function park(v: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    if (v.readyState < HTMLMediaElement.HAVE_METADATA) {
      const onMeta = () => {
        v.removeEventListener('loadedmetadata', onMeta);
        park(v, time).then(resolve);
      };
      v.addEventListener('loadedmetadata', onMeta);
      return;
    }

    const target = Math.max(0, Math.min(time, (v.duration || 0) - 0.001));
    if (
      Math.abs(v.currentTime - target) < 1 / 48 &&
      v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      resolve();
      return;
    }

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      v.removeEventListener('seeked', done);
      window.clearTimeout(timer);

      // On iOS WebKit, kickstarting playback AFTER seek lands ensures the decoder
      // primes the target frame, never frame 0.
      if (v.paused && Math.abs(v.currentTime - target) < 0.25) {
        const p = v.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            v.pause();
            v.currentTime = target;
          }).catch(() => {});
        }
      }

      resolve();
    };
    // A seek that never lands must not deadlock the film.
    const timer = window.setTimeout(done, 1200);
    v.addEventListener('seeked', done);
    v.currentTime = target;
  });
}

export type PreloadOptions = {
  /** Called with 0–1 as the span fills. */
  onProgress?: (fraction: number) => void;
  /** Give up waiting after this long and let the film open anyway. */
  timeoutMs?: number;
  /** Leave the clip parked here once it is ready. */
  parkAt?: number;
  /**
   * Accept the browser's own judgement — `HAVE_ENOUGH_DATA` means it believes
   * it can play the clip through without stalling, and it weighs the download
   * rate to decide that. A paused element only ever buffers so far ahead, so
   * insisting on a full span as well means waiting out the timeout on a clip
   * that was ready all along.
   *
   * The loader still holds out for the span itself: the opening shot is the
   * one thing that must not stutter.
   */
  readyIsEnough?: boolean;
};

/**
 * Waits for a clip's playable span to arrive. Resolves with the fraction that
 * actually landed, so a caller can tell a real load from a timeout.
 */
export function preloadSpan(span: ClipSpan, options: PreloadOptions = {}): Promise<number> {
  const { onProgress, timeoutMs = 20000, parkAt, readyIsEnough = false } = options;
  const v = acquire(span.key);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (fraction: number) => {
      if (settled) return;
      settled = true;
      window.clearInterval(poll);
      window.clearTimeout(timer);
      events.forEach((e) => v.removeEventListener(e, check));
      const at = parkAt ?? span.from;
      park(v, at).then(() => resolve(fraction));
    };

    const check = () => {
      if (v.src.startsWith('blob:') && v.readyState >= HTMLMediaElement.HAVE_METADATA) {
        onProgress?.(1);
        finish(1);
        return;
      }
      const fraction = bufferedSpan(v, span.from, span.to);
      onProgress?.(fraction);
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 810;
      const enough =
        v.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA ||
        (isMobile && v.readyState >= HTMLMediaElement.HAVE_METADATA);
      if (fraction >= 0.995 || (enough && (readyIsEnough || fraction >= 0.9))) {
        onProgress?.(1);
        finish(1);
        return;
      }
    };

    const events = ['progress', 'loadeddata', 'canplay', 'canplaythrough'] as const;
    events.forEach((e) => v.addEventListener(e, check));
    const poll = window.setInterval(check, 150);
    const timer = window.setTimeout(() => {
      onProgress?.(1);
      finish(1);
    }, timeoutMs);
    check();
  });
}

/**
 * Streams the remaining clips in beat order, one at a time.
 *
 * Sequential rather than parallel on purpose: four 4K downloads at once starve
 * each other, and the one the viewer needs next is never the one that finishes.
 */
export function preloadInBackground(spans: ClipSpan[]): () => void {
  let cancelled = false;

  (async () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 810;
    for (const span of spans) {
      if (cancelled) return;
      pinned.add(span.key);
      try {
        if (isMobile) {
          await preloadBlobUrl(span.key);
        }
        await preloadSpan(span, { timeoutMs: 30000, readyIsEnough: true });
      } finally {
        pinned.delete(span.key);
      }
    }
  })();

  return () => {
    cancelled = true;
    pinned.clear();
  };
}
