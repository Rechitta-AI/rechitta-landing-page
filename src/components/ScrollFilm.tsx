'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { pickTier, fullUrl } from '@/utils/videoTier';
import { setLoadProgress, registerLoadTask } from '@/utils/loadProgress';
import { createClock, advanceClock } from '@/utils/filmClock';
import type { FilmTiming } from '@/orb/types';
import type { Playhead } from '@/screens/types';

gsap.registerPlugin(ScrollTrigger);

export type SequenceClip = string | { key: string; in?: number; out?: number; holdWeight?: number };

interface ScrollFilmProps {
  scrollData: React.RefObject<{ progress: number }>;
  sequenceKeys: SequenceClip[];
  startProgress: number;
  endProgress: number;
  holdData?: React.RefObject<{ clipIndex: number; progress: number; startProgress?: number; endProgress?: number }>;
  /** Whether this film's loading counts toward the loader's number. Pass an ID string to register. */
  reportsProgress?: string | boolean;
  /** The film the visitor lands on. */
  priority?: boolean;
  /**
   * Receives the measured clip timings. The orb's flight path anchors to clip
   * time, so it needs the same duration table the scrub maths runs on.
   */
  timingRef?: React.RefObject<FilmTiming | null>;
  /**
   * Receives the exact clip and source time on screen each frame.
   */
  playheadRef?: React.RefObject<Playhead | null>;
}

/** Don't re-seek for less than half a frame of difference. */
const SEEK_EPSILON = 1 / 48;

/** Fallback until a clip reports its real duration (24fps sources). */
const ASSUMED_DURATION = 8;

type Clip = {
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
  // Aggressively preload entire 4K video payload into browser memory
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

/** How much of a clip has arrived in memory, 0–1. */
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
  timingRef,
  playheadRef,
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
    // Pure 4K: One full-resolution video element per clip, eliminating duplicate decoders.
    const clips: Clip[] = sequenceKeys.map((item) => {
      const key = typeof item === 'string' ? item : item.key;
      const trimIn = typeof item === 'object' && item.in !== undefined ? item.in : 0;
      const holdWeight = typeof item === 'object' && item.holdWeight !== undefined ? item.holdWeight : 0;
      const full = makeVideo(fullUrl(key, tier));
      stage.append(full);
      return {
        full,
        duration: ASSUMED_DURATION,
        trimIn,
        trimOut: ASSUMED_DURATION,
        holdWeight,
      };
    });

    const promote = (v: HTMLVideoElement) => {
      if (v.preload !== 'auto') v.preload = 'auto';
    };

    let isWarmedUp = false;

    // HARDWARE WARM-UP (THE "GPU PUMP") - primes each clip directly to its trimIn point
    const warmup = async (v: HTMLVideoElement, initialTime = 0) => {
      try {
        await v.play();
        v.pause();
        v.currentTime = initialTime;
      } catch {
        // Ignored
      }
    };

    const warmups: Promise<void>[] = [];

    // All 4K footage preloads immediately in memory so 100% of footage is primed on loading screen
    clips.forEach((clip) => {
      promote(clip.full);
      warmups.push(warmup(clip.full, clip.trimIn));
    });

    // Safety net: force resolution after 1.5 seconds if browser autoplay policy delays warmup
    const fallbackTimeout = new Promise((resolve) => setTimeout(resolve, 1500));

    let triggerReport = () => {};

    Promise.race([Promise.all(warmups), fallbackTimeout]).then(() => {
      isWarmedUp = true;
      triggerReport();
    });

    const readDurations = () => {
      clips.forEach((clip, i) => {
        const d = clip.full.duration;
        if (d && Number.isFinite(d)) {
          const conf = sequenceKeys[i];
          const trimIn = typeof conf === 'object' && conf.in !== undefined ? conf.in : 0;
          let trimOut = typeof conf === 'object' && conf.out !== undefined ? conf.out : d;
          const holdWeight = typeof conf === 'object' && conf.holdWeight !== undefined ? conf.holdWeight : 0;

          // clamp trimOut to actual video duration just in case
          trimOut = Math.min(trimOut, d);

          clip.trimIn = trimIn;
          clip.trimOut = trimOut;
          clip.holdWeight = holdWeight;
          clip.duration = Math.max(0.1, trimOut - trimIn); // Prevent 0 duration
        }
      });
      publishTiming();
    };

    // Anything keyed to clip time — the orb's flight path — resolves through
    // this. Durations arrive per clip and can be revised, so it is republished
    // on every metadata event rather than computed once.
    const publishTiming = () => {
      if (!timingRef) return;
      let offsetUnits = 0;
      const table = clips.map((clip, i) => {
        const conf = sequenceKeys[i];
        const key = typeof conf === 'string' ? conf : conf.key;
        const entry = {
          key,
          trimIn: clip.trimIn,
          trimOut: clip.trimOut,
          duration: clip.duration,
          holdWeight: clip.holdWeight,
          offsetUnits,
        };
        offsetUnits += clip.duration + clip.holdWeight;
        return entry;
      });
      const { startProgress: from, endProgress: to } = rangeRef.current;
      timingRef.current = {
        clips: table,
        totalUnits: offsetUnits,
        startProgress: from,
        endProgress: to,
      };
    };

    const onMeta = () => readDurations();
    clips.forEach(({ full }) => {
      full.addEventListener('loadedmetadata', onMeta);
    });

    // The loader's number: tracks actual 4K byte buffer completion
    let stopReporting = () => {};
    if (reportsProgress && clips.length > 0) {
      const loadId = typeof reportsProgress === 'string' ? reportsProgress : 'main';
      registerLoadTask(loadId);

      const report = () => {
        // Measure the buffer progress of all 4K clips in this sequence
        let totalFraction = 0;
        let allReady = true;

        for (let i = 0; i < clips.length; i++) {
          const v = clips[i].full;
          const frac = bufferedFraction(v);
          totalFraction += frac;
          // Modern browsers cap paused video buffers at ~10-15s or signal HAVE_ENOUGH_DATA
          const isClipReady = frac >= 0.85 || v.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA;
          if (!isClipReady) {
            allReady = false;
          }
        }

        const avgFraction = totalFraction / clips.length;

        // Linear climb tracking actual 4K bytes received across all clips
        let total = Math.min(1, avgFraction / 0.85);

        // Require all 4K videos in this sequence to be primed before reporting 100%
        if (allReady) {
          total = 1.0;
        }

        // HARDWARE LOCK: If GPU hasn't warmed up yet, keep at 0.99 briefly
        if (total >= 1 && !isWarmedUp) {
          total = 0.99;
        }

        setLoadProgress(total, loadId);
      };

      triggerReport = report;

      const events = ['progress', 'canplay', 'canplaythrough', 'loadeddata'] as const;
      clips.forEach((clip) => {
        events.forEach((e) => {
          clip.full.addEventListener(e, report);
        });
      });

      const poll = window.setInterval(report, 200);
      stopReporting = () => {
        window.clearInterval(poll);
        clips.forEach((clip) => {
          events.forEach((e) => {
            clip.full.removeEventListener(e, report);
          });
        });
      };
    }

    const clock = createClock(scrollData.current?.progress ?? 0);
    let lastTime = performance.now();
    let frame: number;
    let shown: HTMLVideoElement | null = null;

    // Flight mode state: plays transit-b natively via hardware decoding
    let isFlying = false;
    let flightVideo: HTMLVideoElement | null = null;
    let flightStartT = 2.0;
    let flightEndT = 16.9;
    let flightStartScroll = 0.158;
    let flightEndScroll = 0.297;
    let flightClipKey = 'transit-b';
    let flightTargetHoldIndex = 1;

    const onStartFlight = () => {
      // Find clip 1 (transit-b)
      const transitClip = clips[1];
      if (!transitClip) return;

      const video = transitClip.full;

      flightVideo = video;
      flightStartT = 2.0;
      flightEndT = 16.9;
      flightStartScroll = 0.158;
      flightEndScroll = 0.297; // Centered inside broker hold
      flightClipKey = 'transit-b';
      flightTargetHoldIndex = 1;
      isFlying = true;

      // Stop Lenis during flight so user wheel gestures don't fight flight
      const lenis = (window as any).lenis;
      if (lenis && typeof lenis.stop === 'function') {
        lenis.stop();
      }

      // Exit boardroom hold state immediately
      if (holdData?.current) {
        holdData.current.clipIndex = -1;
        holdData.current.progress = 0;
      }

      // Prime start time & accelerated playback rate (fast, cinematic drone rush)
      video.currentTime = flightStartT;
      video.playbackRate = 2.5;

      // Immediately display this video
      if (shown && shown !== video) shown.style.opacity = '0';
      video.style.opacity = '1';
      shown = video;

      // Hardware playback via GPU decoder!
      video.play().catch(() => {});
    };

    const onFlyToBuyer = () => {
      // Find clip 2 (transit-c)
      const transitClip = clips[2];
      if (!transitClip) return;

      const video = transitClip.full;

      flightVideo = video;
      flightStartT = 0.0;
      flightEndT = 6.8;
      flightStartScroll = 0.297;
      flightEndScroll = 0.406;
      flightClipKey = 'transit-c';
      flightTargetHoldIndex = 2; // Parked on Buyer's Phone!
      isFlying = true;

      // Stop Lenis during flight
      const lenis = (window as any).lenis;
      if (lenis && typeof lenis.stop === 'function') {
        lenis.stop();
      }

      // Exit broker hold state immediately
      if (holdData?.current) {
        holdData.current.clipIndex = -1;
        holdData.current.progress = 0;
      }

      video.currentTime = flightStartT;
      video.playbackRate = 2.5;

      if (shown && shown !== video) shown.style.opacity = '0';
      video.style.opacity = '1';
      shown = video;

      video.play().catch(() => {});
    };

    const onFlyToGlobal = () => {
      // Find clip 3 (transit-d)
      const transitClip = clips[3];
      if (!transitClip) return;

      const video = transitClip.full;

      flightVideo = video;
      flightStartT = 0.0;
      flightEndT = 2.8;
      flightStartScroll = 0.406;
      flightEndScroll = 0.500;
      flightClipKey = 'transit-d';
      flightTargetHoldIndex = -1; // Transitions to Global/Multilingual chapter
      isFlying = true;

      // Stop Lenis during flight
      const lenis = (window as any).lenis;
      if (lenis && typeof lenis.stop === 'function') {
        lenis.stop();
      }

      // Exit buyer hold state immediately
      if (holdData?.current) {
        holdData.current.clipIndex = -1;
        holdData.current.progress = 0;
      }

      video.currentTime = flightStartT;
      video.playbackRate = 2.5;

      if (shown && shown !== video) shown.style.opacity = '0';
      video.style.opacity = '1';
      shown = video;

      video.play().catch(() => {});
    };

    window.addEventListener('rechitta:start-flight', onStartFlight);
    window.addEventListener('rechitta:fly-to-buyer', onFlyToBuyer);
    window.addEventListener('rechitta:fly-to-global', onFlyToGlobal);

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

      // --- NATIVE HARDWARE VIDEO PLAYBACK FLIGHT MODE ---
      if (isFlying && flightVideo) {
        const currentT = flightVideo.currentTime;

        // Keep phone screen overlay warped to current video frame at native 60fps
        if (playheadRef) {
          playheadRef.current = {
            clip: flightClipKey,
            t: currentT,
          };
        }

        // Map video time to scroll progress
        const ratio = Math.max(0, Math.min(1, (currentT - flightStartT) / (flightEndT - flightStartT || 1)));
        const curProgress = flightStartScroll + ratio * (flightEndScroll - flightStartScroll);

        if (scrollData.current) {
          scrollData.current.progress = curProgress;
        }
        clock.eased = curProgress;

        const maxST =
          ScrollTrigger.maxScroll(window) ||
          document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, curProgress * maxST);

        // Notify hold state as we arrive at destination
        if (holdData?.current) {
          if (ratio >= 0.95) {
            holdData.current.clipIndex = flightTargetHoldIndex; // parked on destination!
            holdData.current.progress = 0.5;
          } else {
            holdData.current.clipIndex = -1; // in transit
            holdData.current.progress = 0;
          }
        }

        // Arrival condition: reached destination!
        if (currentT >= flightEndT - 0.05 || flightVideo.ended || flightVideo.paused) {
          flightVideo.pause();
          flightVideo.currentTime = flightEndT;
          isFlying = false;
          flightVideo = null;

          if (scrollData.current) {
            scrollData.current.progress = flightEndScroll;
          }
          clock.eased = flightEndScroll;
          window.scrollTo(0, flightEndScroll * maxST);
          ScrollTrigger.update();

          if (holdData?.current) {
            holdData.current.clipIndex = flightTargetHoldIndex;
            holdData.current.progress = 0.5;
          }

          const lenis = (window as any).lenis;
          if (lenis) {
            if (flightTargetHoldIndex === 1) {
              // Stay completely stopped for the locked broker scene
              if (typeof lenis.stop === 'function') lenis.stop();
              if (typeof lenis.velocity !== 'undefined') lenis.velocity = 0;
            } else {
              if (typeof lenis.start === 'function') lenis.start();
            }
            if (typeof lenis.scrollTo === 'function') {
              lenis.scrollTo(flightEndScroll * maxST, { immediate: true });
            }
          }
        }

        frame = requestAnimationFrame(render);
        return;
      }
      // --- END FLIGHT MODE ---

      const { startProgress: from, endProgress: to } = rangeRef.current;
      const target = scrollData.current?.progress ?? 0;
      const eased = advanceClock(clock, target, dt);

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
      let timeAccumulator = 0;

      for (let i = 0; i < clips.length; i++) {
        const c = clips[i];

        // 1. Check if we fall within the playable video duration of this clip
        if (remaining < c.duration) {
          activeIndex = i;
          break;
        }
        remaining -= c.duration;
        timeAccumulator += c.duration;

        // 2. Check if we fall within the HOLD duration of this clip
        if (c.holdWeight > 0) {
          if (remaining <= c.holdWeight) {
            activeIndex = i;
            isHolding = true;
            holdProgress = remaining / c.holdWeight; // 0.0 to 1.0 progress inside the hold window

            // Expose the global boundaries!
            if (holdData?.current) {
              const holdStartLocal = timeAccumulator / totalDuration;
              const holdEndLocal = (timeAccumulator + c.holdWeight) / totalDuration;
              holdData.current.startProgress = from + holdStartLocal * span;
              holdData.current.endProgress = from + holdEndLocal * span;
            }

            // Park the video at the end of its playable duration!
            remaining = c.duration;
            break;
          }
          remaining -= c.holdWeight;
          timeAccumulator += c.holdWeight;
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

      const clip = clips[activeIndex];
      if (clip) {
        const full = clip.full;
        const sourceTime = clip.trimIn + remaining;

        seek(full, sourceTime);

        if (shown !== full) {
          if (shown) shown.style.opacity = '0';
          full.style.opacity = '1';
          shown = full;
        }

        if (playheadRef) {
          if (full.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            const conf = sequenceKeys[activeIndex];
            playheadRef.current = {
              clip: typeof conf === 'string' ? conf : conf.key,
              t: full.currentTime,
            };
          }
        }
      }

      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      stopReporting();
      window.removeEventListener('rechitta:start-flight', onStartFlight);
      window.removeEventListener('rechitta:fly-to-buyer', onFlyToBuyer);
      window.removeEventListener('rechitta:fly-to-global', onFlyToGlobal);
      clips.forEach(({ full }) => {
        full.removeEventListener('loadedmetadata', onMeta);
        full.pause();
        full.removeAttribute('src');
        full.load();
        full.remove();
      });
    };
    // sequenceKeys is a literal array in the parent; compare by contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollData, JSON.stringify(sequenceKeys), reportsProgress, priority, timingRef, playheadRef]);

  return (
    <div
      ref={stageRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
    />
  );
}
