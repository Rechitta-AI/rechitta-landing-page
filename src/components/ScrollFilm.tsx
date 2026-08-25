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
  v.preload = 'auto';
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
        const value = 0.5 * bufferedFraction(first.proxy) + 0.5 * bufferedFraction(first.full);
        setLoadProgress(value);
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

    const seek = (v: HTMLVideoElement, time: number) => {
      if (v.readyState < HTMLMediaElement.HAVE_METADATA) return;
      const clamped = Math.max(0, Math.min(time, (v.duration || 0) - 0.001));
      if (Math.abs(v.currentTime - clamped) < SEEK_EPSILON) return;
      if (typeof v.fastSeek === 'function') v.fastSeek(clamped);
      else v.currentTime = clamped;
    };

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const { startProgress: from, endProgress: to } = rangeRef.current;
      const target = scrollData.current?.progress ?? 0;
      eased += (target - eased) * (1 - Math.exp(-dt / CATCH_UP));

      const span = to - from || 1;
      const local = Math.max(0, Math.min((eased - from) / span, 1));

      // Walk the clips to find which one this moment belongs to.
      const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0);
      let remaining = local * totalDuration;
      let index = 0;
      while (index < clips.length - 1 && remaining > clips[index].duration) {
        remaining -= clips[index].duration;
        index += 1;
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
  }, [scrollData, sequenceKeys.join('|'), reportsProgress]);

  return (
    <div
      ref={stageRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
    />
  );
}
