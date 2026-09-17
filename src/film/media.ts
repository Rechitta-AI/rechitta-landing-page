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
import { coverRect } from '@/screens/warp';

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

      // If an existing pooled video already exists for this key, update its
      // src — but only while nobody can see it. Swapping the source of a
      // clip that is on screen or playing reloads it mid-shot, which is a
      // black frame at best. That one keeps streaming; the blob is used the
      // next time the clip is created.
      const existing = pool.get(key);
      const inUse = existing && (!existing.paused || existing.style.opacity !== '0');
      if (existing && !inUse && !existing.src.startsWith('blob:')) {
        const currentTime = existing.currentTime;
        const paused = existing.paused;
        existing.src = blobUrl;
        painted.delete(existing);
        existing.currentTime = currentTime;
        if (!paused) existing.play().catch(() => { });
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

/** How long `park` waits for a clip's metadata before giving up on it. */
const METADATA_TIMEOUT_MS = 8000;

/** How long `park` waits on the play() that primes the decoder after a seek. */
const PLAY_PRIME_TIMEOUT_MS = 1500;

/** The stage all pooled elements are appended into. */
let host: HTMLElement | null = null;

/**
 * Clips that must survive `keepOnly` — the one the background preloader is
 * streaming right now. Without this the pool tears down the element mid-fetch
 * and the preloader waits forever on a video that no longer exists.
 */
const pinned = new Set<string>();

/**
 * Elements that have spent a decoder on a real frame.
 *
 * iOS WebKit only paints a frame for an element that has been allowed to
 * play. In Low Power Mode it refuses every play() that is not inside a user
 * gesture, so a clip can be loaded, seeked and "parked" and still draw
 * nothing but black. Anything that wants to put footage on screen for the
 * first time asks here rather than trusting readyState.
 */
const painted = new WeakSet<HTMLVideoElement>();
const paintListeners = new Set<() => void>();

/** iPhone and iPad, where frames only paint for an element allowed to play. */
const paintsOnlyAfterPlay = () =>
  typeof navigator !== 'undefined' &&
  /AppleWebKit/.test(navigator.userAgent) &&
  navigator.maxTouchPoints > 0;

function markPainted(v: HTMLVideoElement) {
  if (painted.has(v)) return;
  painted.add(v);
  paintListeners.forEach((cb) => cb());
}

export function hasPainted(v: HTMLVideoElement): boolean {
  return painted.has(v);
}

/** Calls back each time any clip paints its first frame. */
export function onAnyPaint(cb: () => void): () => void {
  paintListeners.add(cb);
  return () => paintListeners.delete(cb);
}

/**
 * Low Power Mode, and the gesture that lifts it.
 *
 * WebKit lifts the restriction per element, for good, the first time play()
 * is called on it inside a user gesture. So every gesture primes whatever the
 * pool holds, released elements are kept and reused rather than thrown away,
 * and a few blank ones are primed ahead of the clips that will need them.
 */
const spares: HTMLVideoElement[] = [];
const MAX_SPARES = 6;
/** Pool plus spares worth of elements to have unlocked before they are needed. */
const PRIMED_ELEMENTS = 5;
const primed = new WeakSet<HTMLVideoElement>();
/** Any extra elements outside the pool that should be unlocked too. */
const extras = new Set<HTMLVideoElement>();
const unlockListeners = new Set<() => void>();

export function registerVideo(v: HTMLVideoElement): () => void {
  extras.add(v);
  return () => extras.delete(v);
}

function blankElement(): HTMLVideoElement {
  const v = document.createElement('video');
  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.setAttribute('webkit-playsinline', '');
  v.addEventListener('playing', () => markPainted(v));
  v.addEventListener('loadeddata', () => {
    if (!paintsOnlyAfterPlay()) markPainted(v);
  });
  return v;
}

function prime(v: HTMLVideoElement) {
  if (primed.has(v)) return;
  primed.add(v);
  if (!v.getAttribute('src')) {
    // Nothing to paint: the call is only for the permission. Paused straight
    // away, or the element would start playing the moment it is given a src.
    v.play().catch(() => {});
    v.pause();
    return;
  }
  // Already playing (or asked to), so the gesture is all it needed.
  if (!v.paused || v.dataset.playing === '1') {
    v.play().catch(() => {});
    return;
  }
  const t = v.currentTime;
  v.play()
    .then(() => {
      markPainted(v);
      // Someone started this clip for real in the meantime; leave it running.
      if (v.dataset.playing === '1') return;
      v.pause();
      if (Math.abs(v.currentTime - t) > 0.001) v.currentTime = t;
    })
    .catch((err: unknown) => {
      // Refused: try again on the next gesture.
      if (err instanceof DOMException && err.name === 'NotAllowedError') primed.delete(v);
    });
}

function onGesture() {
  while (pool.size + spares.length < PRIMED_ELEMENTS) spares.push(blankElement());
  pool.forEach(prime);
  spares.forEach(prime);
  extras.forEach(prime);
  unlockListeners.forEach((cb) => cb());
}

const GESTURE_EVENTS = ['touchend', 'click', 'keydown', 'pointerup'] as const;

function listenForGestures(on: boolean) {
  if (typeof window === 'undefined') return;
  GESTURE_EVENTS.forEach((e) =>
    on
      ? window.addEventListener(e, onGesture, { capture: true, passive: true })
      : window.removeEventListener(e, onGesture, { capture: true }),
  );
}

/**
 * play(), surviving Low Power Mode.
 *
 * A refused play() waits for the next gesture — on a phone that is the
 * touchend of the very swipe that asked for the shot — and tries again,
 * instead of leaving the transition frozen on its first frame. Resolves with
 * 'playing' when play() went straight through, 'after-gesture' when it had to
 * wait for one, and false when it never started.
 */
export type PlaybackStart = 'playing' | 'after-gesture' | false;

export function startPlayback(v: HTMLVideoElement, waitMs = 1500): Promise<PlaybackStart> {
  v.dataset.playing = '1';
  const onPause = () => {
    delete v.dataset.playing;
  };
  const running = () => {
    v.addEventListener('pause', onPause, { once: true });
    markPainted(v);
  };
  return v.play().then((): PlaybackStart => {
    running();
    return 'playing';
  }, (err: unknown) => {
    if (!(err instanceof DOMException && err.name === 'NotAllowedError')) {
      onPause();
      return false;
    }
    return new Promise<PlaybackStart>((resolve) => {
      let settled = false;
      const done = (ok: PlaybackStart) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        unlockListeners.delete(retry);
        if (!ok) onPause();
        resolve(ok);
      };
      // The gesture has arrived: the retried play() decides, not the clock. A
      // clip that needs a moment to start must not be cut for it.
      const retry = () => {
        window.clearTimeout(timer);
        unlockListeners.delete(retry);
        v.play().then(() => {
          running();
          done('after-gesture');
        }, () => done(false));
      };
      const timer = window.setTimeout(() => done(false), waitMs);
      unlockListeners.add(retry);
    });
  });
}

export function setMediaHost(el: HTMLElement | null) {
  host = el;
  listenForGestures(Boolean(el));
  if (!el) return;
  pool.forEach((v) => {
    if (v.parentElement !== el) el.append(v);
  });
}

function create(key: string): HTMLVideoElement {
  // A released element keeps any permission a gesture gave it.
  const v = spares.pop() ?? blankElement();
  painted.delete(v);
  delete v.dataset.playing;
  v.removeAttribute('poster');
  v.style.cssText = '';
  const blob = blobCache.get(key);
  v.src = blob ?? fullUrl(key);
  v.preload = 'auto';
  v.setAttribute('aria-hidden', 'true');
  v.dataset.clip = key;
  if (key === 'scene1-3') {
    v.poster = '/film/frames/scene1-3/f_120.webp';
  } else if (key === 'mobile-seq1-2') {
    v.poster = '/film/frames/mobile-seq1-2/poster.webp';
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
  if (key === 'last' && typeof window !== 'undefined' && window.innerHeight > window.innerWidth) {
    const shiftX = Math.round(coverRect(window.innerWidth, window.innerHeight).width * (21.5 / 1920));
    v.style.objectPosition = `calc(50% + ${shiftX}px) 50%`;
  }
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
  painted.delete(v);
  if (spares.length < MAX_SPARES) spares.push(v);
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
    } catch { }
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
      // A clip that errors or never answers must not deadlock the film, and
      // the loader waits on this too.
      const stop = () => {
        v.removeEventListener('loadedmetadata', onMeta);
        v.removeEventListener('error', onFail);
        window.clearTimeout(metaTimer);
      };
      const onMeta = () => {
        stop();
        park(v, time).then(resolve);
      };
      const onFail = () => {
        stop();
        resolve();
      };
      const metaTimer = window.setTimeout(onFail, METADATA_TIMEOUT_MS);
      v.addEventListener('loadedmetadata', onMeta);
      v.addEventListener('error', onFail);
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
      // primes the target frame, never frame 0. Never do this right at EOF
      // where starting playback would crash into the end of stream and flicker.
      const isNearEnd = Boolean(v.duration && target >= v.duration - 0.15);
      if (!isNearEnd && v.paused && Math.abs(v.currentTime - target) < 0.25) {
        const p = v.play();
        if (p && typeof p.then === 'function') {
          // A play() that never settles (a stalled network) must not hang the
          // park either.
          let primeSettled = false;
          const giveUp = window.setTimeout(() => {
            if (primeSettled) return;
            primeSettled = true;
            if (v.dataset.playing !== '1') v.pause();
            resolve();
          }, PLAY_PRIME_TIMEOUT_MS);
          p.then(() => {
            if (primeSettled) return;
            primeSettled = true;
            window.clearTimeout(giveUp);
            markPainted(v);
            // A gesture may have started this clip for real meanwhile.
            if (v.dataset.playing === '1') return resolve();
            v.pause();
            const onReseek = () => {
              v.removeEventListener('seeked', onReseek);
              window.clearTimeout(reseekTimer);
              resolve();
            };
            const reseekTimer = window.setTimeout(onReseek, 400);
            v.addEventListener('seeked', onReseek);
            v.currentTime = target;
          }).catch(() => {
            if (primeSettled) return;
            primeSettled = true;
            window.clearTimeout(giveUp);
            resolve();
          });
          return;
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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 810;

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
