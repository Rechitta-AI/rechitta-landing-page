'use client';

import { useEffect, useRef } from 'react';
import { pickTier, proxyUrl, fullUrl } from '@/utils/videoTier';
import { setLoadProgress } from '@/utils/loadProgress';

interface ScrollFilmProps {
  scrollData: React.RefObject<{ progress: number }>;
  sequenceKeys: string[];
  startProgress: number;
  endProgress: number;
  /** Whether this film's loading counts toward the loader's number. */
  reportsProgress?: boolean;
  /** The film the visitor lands on. Its first clip loads immediately; every
   *  other clip waits so it isn't competing for bandwidth. */
  priority?: boolean;
}

/** How long the film takes to catch up to the scroll position, in seconds. */
const CATCH_UP = 0.18;

/** Don't re-seek for less than half a frame of difference. */
const SEEK_EPSILON = 1 / 48;

/** Fallback until a clip reports its real duration (24fps sources). */
const ASSUMED_DURATION = 8;

type Clip = {
  proxy: HTMLVideoElement;
  full: HTMLVideoElement;
  duration: number;
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
    const clips: Clip[] = sequenceKeys.map((key) => {
      const proxy = makeVideo(proxyUrl(key));
      const full = makeVideo(fullUrl(key, tier));
      stage.append(proxy, full);
      return { proxy, full, duration: ASSUMED_DURATION };
    });

    const promote = (v: HTMLVideoElement) => {
      if (v.preload !== 'auto') v.preload = 'auto';
    };

    // Only the first clip of the landing film downloads up front. Everything
    // else would be competing with it for the same bandwidth.
    if (priority && clips.length > 0) {
      promote(clips[0].proxy);
      promote(clips[0].full);
    }

    const readDurations = () => {
      clips.forEach((clip) => {
        const d = clip.full.duration || clip.proxy.duration;
        if (d && Number.isFinite(d)) clip.duration = d;
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
        setLoadProgress(0.5 * proxyPart + 0.5 * fullPart);
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
      const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0);
      let remaining = local * totalDuration;
      let index = 0;
      while (index < clips.length - 1 && remaining > clips[index].duration) {
        remaining -= clips[index].duration;
        index += 1;
      }

      // The proxies are small, and one of them is what covers a chapter change
      // before its 4K version lands. On the landing film they wait until the
      // first 4K clip can render, so nothing competes with it; a film reached
      // later pulls them the moment it comes into range.
      const proxiesDue = priority
        ? clips[0]?.full.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        : true;
      if (!proxiesPromoted && proxiesDue) {
        proxiesPromoted = true;
        clips.forEach((c) => promote(c.proxy));
      }

      // Full quality is fetched for the clip in view and the one after it.
      for (let i = 0; i < clips.length; i++) {
        if (i === index || i === index + 1) promote(clips[i].full);
      }

      const clip = clips[index];
      if (clip) {
        // Prefer full quality; fall back to the proxy until it can render.
        const full = clip.full;
        const useFull = full.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
        const active = useFull ? full : clip.proxy;

        seek(active, remaining);
        // Keep the proxy in step so the swap between them is invisible.
        if (useFull) seek(clip.proxy, remaining);

        if (active !== shown) {
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
  }, [scrollData, sequenceKeys.join('|'), reportsProgress, priority]);

  return (
    <div
      ref={stageRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
    />
  );
}
