'use client';

import { useEffect, useRef } from 'react';
import { pickTier, proxyUrl, fullUrl } from '@/utils/videoTier';
import { setLoadProgress } from '@/utils/loadProgress';

export type SequenceClip = string | { key: string; in?: number; out?: number; holdWeight?: number };

interface ScrollFilmProps {
  scrollData: React.RefObject<{ progress: number }>;
  sequenceKeys: SequenceClip[];
  startProgress: number;
  endProgress: number;
  holdData?: React.RefObject<{ clipIndex: number; progress: number }>;
  /** Whether this film's loading counts toward the loader's number. */
  reportsProgress?: boolean;
  /** The film the visitor lands on. Its first clip loads immediately; every
   *  other clip waits so it isn't competing for bandwidth. */
  priority?: boolean;
}

/** How long the film takes to catch up to the scroll position, in seconds. */
const CATCH_UP = 0.1;

/** Don't re-seek for less than half a frame of difference. */
const SEEK_EPSILON = 1 / 48;

/** Fallback until a clip reports its real duration (24fps sources). */
const ASSUMED_DURATION = 8;

type Clip = {
  proxy: HTMLVideoElement;
  full: HTMLVideoElement;
  duration: number; // Playable duration (trimOut - trimIn)
  trimIn: number;
  trimOut: number;
  holdWeight: number;
};

function makeVideo(src: string): HTMLVideoElement {
  const v = document.createElement('video');
  v.src = src;
  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;
  // Metadata only to begin with — enough to learn the clip's duration, which
  // the scrub maths needs, without pulling the whole file. Clips are promoted
  // to full download as the visitor approaches them.
  v.preload = 'metadata';
  v.setAttribute('aria-hidden', 'true');
  Object.assign(v.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: '0',
  });
  return v;
}

/** How much of a clip has arrived, 0–1. */
function bufferedFraction(v: HTMLVideoElement): number {
  if (!v.duration || !Number.isFinite(v.duration)) return 0;
  let total = 0;
  for (let i = 0; i < v.buffered.length; i++) {
    total += v.buffered.end(i) - v.buffered.start(i);
  }
  return Math.min(1, total / v.duration);
}

export default function ScrollFilm({
  scrollData,
  sequenceKeys,
  startProgress,
  endProgress,
  holdData,
  reportsProgress = false,
  priority = false,
}: ScrollFilmProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  // Props are read inside a long-lived rAF loop; keep them current without
  // tearing down the videos on every render.
  const rangeRef = useRef({ startProgress, endProgress });
  useEffect(() => {
    rangeRef.current = { startProgress, endProgress };
  }, [startProgress, endProgress]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const tier = pickTier();

    // Built imperatively rather than through JSX: these nodes live inside the
    // ScrollTrigger-pinned container, and letting React insert them mid-scroll
    // races with GSAP's DOM surgery.
    const clips: Clip[] = sequenceKeys.map((item) => {
      const key = typeof item === 'string' ? item : item.key;
      const proxy = makeVideo(proxyUrl(key));
      const full = makeVideo(fullUrl(key, tier));
      stage.append(proxy, full);
      return { 
        proxy, 
        full, 
        duration: ASSUMED_DURATION,
        trimIn: 0,
        trimOut: ASSUMED_DURATION,
        holdWeight: 0
      };
    });

    const promote = (v: HTMLVideoElement) => {
      if (v.preload !== 'auto') v.preload = 'auto';
    };

    let isWarmedUp = !priority;

    // Only the first clip of the landing film downloads up front. Everything
    // else would be competing with it for the same bandwidth.
    if (priority && clips.length > 0) {
      promote(clips[0].proxy);
      promote(clips[0].full);

      // HARDWARE WARM-UP (THE "GPU PUMP")
      // Secretly play and immediately pause the videos behind the loading screen.
      // This forces the browser's hardware decoder to allocate memory and process 
      // the first frames into the GPU buffer before the user ever touches the scroll wheel,
      // completely eliminating the initial scroll stutter.
      const warmup = async (v: HTMLVideoElement) => {
        try {
          await v.play();
          v.pause();
          v.currentTime = 0;
        } catch (err) {
          // Browsers sometimes block programmatic play, but since it's muted it usually passes.
        }
      };
      


      // Safety net: force resolution after 3 seconds just in case the browser hangs the promise
      const fallbackTimeout = new Promise(resolve => setTimeout(resolve, 3000));
      
      Promise.race([
        Promise.all([warmup(clips[0].proxy), warmup(clips[0].full)]),
        fallbackTimeout
      ]).then(() => {
        isWarmedUp = true;
      });
    }

    const readDurations = () => {
      clips.forEach((clip, i) => {
        const d = clip.full.duration || clip.proxy.duration;
        if (d && Number.isFinite(d)) {
          const conf = sequenceKeys[i];
          const trimIn = (typeof conf === 'object' && conf.in !== undefined) ? conf.in : 0;
          let trimOut = (typeof conf === 'object' && conf.out !== undefined) ? conf.out : d;
          const holdWeight = (typeof conf === 'object' && conf.holdWeight !== undefined) ? conf.holdWeight : 0;
          
          // clamp trimOut to actual video duration just in case
          trimOut = Math.min(trimOut, d);
          
          clip.trimIn = trimIn;
          clip.trimOut = trimOut;
          clip.holdWeight = holdWeight;
          clip.duration = Math.max(0.1, trimOut - trimIn); // Prevent 0 duration
        }
      });
    };

    const onMeta = () => readDurations();
    clips.forEach(({ proxy, full }) => {
      proxy.addEventListener('loadedmetadata', onMeta);
      full.addEventListener('loadedmetadata', onMeta);
    });

    // The loader's number: the low-res proxy of the first clip gets the film
    // moving, the full-quality version finishes the job.
    let stopReporting = () => {};
    if (reportsProgress && clips.length > 0) {
      const first = clips[0];
      const report = () => {
        // Readiness, not bytes. A browser decides for itself when it has
        // buffered enough and then stops, so waiting for 100% never arrives.
        // HAVE_FUTURE_DATA means the proxy can render and keep going;
        // HAVE_ENOUGH_DATA is the browser's own "this will play through".
        const proxyPart =
          first.proxy.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA
            ? 1
            : bufferedFraction(first.proxy);
        const fullPart =
          first.full.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA
            ? 1
            : bufferedFraction(first.full);
            
        let total = 0.5 * proxyPart + 0.5 * fullPart;
        
        // HARDWARE LOCK: Never report 100% until the GPU has fully warmed up
        if (total >= 1 && !isWarmedUp) {
          total = 0.99;
        }
        
        setLoadProgress(total);
      };
      const events = ['progress', 'canplay', 'canplaythrough', 'loadeddata'] as const;
      events.forEach((e) => {
        first.proxy.addEventListener(e, report);
        first.full.addEventListener(e, report);
      });
      const poll = window.setInterval(report, 250);
      stopReporting = () => {
        window.clearInterval(poll);
        events.forEach((e) => {
          first.proxy.removeEventListener(e, report);
          first.full.removeEventListener(e, report);
        });
      };
    }

    let eased = scrollData.current?.progress ?? 0;
    let lastTime = performance.now();
    let frame: number;
    let shown: HTMLVideoElement | null = null;
    let proxiesPromoted = false;

    const seek = (v: HTMLVideoElement, time: number) => {
      if (v.readyState < HTMLMediaElement.HAVE_METADATA) return;
      // A seek already in flight will land on a stale target if we queue
      // another on top of it. Waiting is what keeps scrubbing smooth.
      if (v.seeking) return;
      const clamped = Math.max(0, Math.min(time, (v.duration || 0) - 0.001));
      if (Math.abs(v.currentTime - clamped) < SEEK_EPSILON) return;
      v.currentTime = clamped;
    };

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const { startProgress: from, endProgress: to } = rangeRef.current;
      const target = scrollData.current?.progress ?? 0;
      eased += (target - eased) * (1 - Math.exp(-dt / CATCH_UP));

      const span = to - from || 1;
      const local = Math.max(0, Math.min((eased - from) / span, 1));

      // A film still well before its own window (the finale, at the top of the
      // page) stays at metadata so it never competes with what's on screen.
      const approaching = priority || eased >= from - 0.08;
      if (!approaching) {
        frame = requestAnimationFrame(render);
        return;
      }

      // Walk the clips to find which one this moment belongs to.
      let totalDuration = 0;
      clips.forEach((c) => {
        totalDuration += c.duration + c.holdWeight;
      });

      let remaining = local * totalDuration;
      let activeIndex = 0;
      let isHolding = false;
      let holdProgress = 0;

      for (let i = 0; i < clips.length; i++) {
        const c = clips[i];
        
        // 1. Check if we fall within the playable video duration of this clip
        if (remaining < c.duration) {
          activeIndex = i;
          break;
        }
        remaining -= c.duration;
        
        // 2. Check if we fall within the HOLD duration of this clip
        if (c.holdWeight > 0) {
          if (remaining <= c.holdWeight) {
            activeIndex = i;
            isHolding = true;
            holdProgress = remaining / c.holdWeight; // 0.0 to 1.0 progress inside the hold window
            // Park the video at the end of its playable duration!
            remaining = c.duration; 
            break;
          }
          remaining -= c.holdWeight;
        }

        if (i === clips.length - 1) {
          activeIndex = i;
          remaining = c.duration; // Clamp to very end
        }
      }

      // 3. Expose the hold state to the parent via Ref for performant UI tracking
      if (holdData?.current) {
        holdData.current.clipIndex = isHolding ? activeIndex : -1;
        holdData.current.progress = isHolding ? holdProgress : 0;
      }

      // Hide all other videos, show only the active one. The proxies are small, and one
      // of them is what covers a chapter change before its 4K version lands.
      // On the landing film they wait until the first 4K clip can render, so nothing 
      // competes with it; a film reached later pulls them the moment it comes into range.
      const proxiesDue = priority
        ? clips[0]?.full.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        : true;
      if (!proxiesPromoted && proxiesDue) {
        proxiesPromoted = true;
        clips.forEach((c) => promote(c.proxy));
      }

      // Full quality is fetched for the clip in view and the one after it.
      for (let i = 0; i < clips.length; i++) {
        if (i === activeIndex || i === activeIndex + 1) promote(clips[i].full);
      }

      const clip = clips[activeIndex];
      if (clip) {
        // Prefer full quality; fall back to the proxy until it can render.
        const full = clip.full;
        const useFull = full.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
        const active = useFull ? full : clip.proxy;

        // Only the visible element is seeked. Driving both was decoding every
        // frame twice — at 4K that is the difference between smooth and not.
        seek(active, clip.trimIn + remaining);

        // Swapping mid-seek would flash whatever frame the incoming element
        // happens to be parked on, so wait until it has landed.
        if (active !== shown && !active.seeking) {
          if (shown) shown.style.opacity = '0';
          active.style.opacity = '1';
          shown = active;
        }
      }

      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      stopReporting();
      clips.forEach(({ proxy, full }) => {
        proxy.removeEventListener('loadedmetadata', onMeta);
        full.removeEventListener('loadedmetadata', onMeta);
        [proxy, full].forEach((v) => {
          v.pause();
          v.removeAttribute('src');
          v.load();
          v.remove();
        });
      });
    };
    // sequenceKeys is a literal array in the parent; compare by contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollData, JSON.stringify(sequenceKeys), reportsProgress, priority]);

  return (
    <div
      ref={stageRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
    />
  );
}
