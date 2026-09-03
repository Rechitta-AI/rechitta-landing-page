'use client';

import { useEffect, useRef } from 'react';
import { pickTier, proxyUrl, fullUrl } from '@/utils/videoTier';
import { setLoadProgress, registerLoadTask } from '@/utils/loadProgress';
import { createClock, advanceClock } from '@/utils/filmClock';
import type { FilmTiming } from '@/orb/types';
import type { Playhead } from '@/screens/types';

export type SequenceClip = string | { key: string; in?: number; out?: number; holdWeight?: number };

interface ScrollFilmProps {
  scrollData: React.RefObject<{ progress: number }>;
  sequenceKeys: SequenceClip[];
  startProgress: number;
  endProgress: number;
  holdData?: React.RefObject<{ clipIndex: number; progress: number; startProgress?: number; endProgress?: number }>;
  /** Whether this film's loading counts toward the loader's number. Pass an ID string to register. */
  reportsProgress?: string | boolean;
  /** The film the visitor lands on. Its first full clip loads immediately. */
  priority?: boolean;
  /**
   * Receives the measured clip timings. The orb's flight path anchors to clip
   * time, so it needs the same duration table the scrub maths runs on.
   */
  timingRef?: React.RefObject<FilmTiming | null>;
  /**
   * Receives the exact clip and source time on screen each frame. Anything
   * composited onto the footage reads this rather than scroll progress, so it
   * cannot drift from the frame it is sitting on.
   */
  playheadRef?: React.RefObject<Playhead | null>;
}

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

    let isWarmedUp = false;

    // Promote ALL proxies and ALL 4K videos to download immediately
    clips.forEach(clip => {
      promote(clip.proxy);
      promote(clip.full);
    });

    // HARDWARE WARM-UP (THE "GPU PUMP")
    const warmup = async (v: HTMLVideoElement) => {
      try {
        await v.play();
        v.pause();
        v.currentTime = 0;
      } catch (err) {
        // Ignored
      }
    };

    const warmups: Promise<void>[] = [];
    clips.forEach(clip => {
      warmups.push(warmup(clip.proxy));
      warmups.push(warmup(clip.full));
    });

    // Safety net: force resolution after 3 seconds
    const fallbackTimeout = new Promise(resolve => setTimeout(resolve, 3000));
    
    Promise.race([
      Promise.all(warmups),
      fallbackTimeout
    ]).then(() => {
      isWarmedUp = true;
    });

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
    clips.forEach(({ proxy, full }) => {
      proxy.addEventListener('loadedmetadata', onMeta);
      full.addEventListener('loadedmetadata', onMeta);
    });

    // The loader's number
    let stopReporting = () => {};
    if (reportsProgress && clips.length > 0) {
      const loadId = typeof reportsProgress === 'string' ? reportsProgress : 'main';
      registerLoadTask(loadId);

      const report = () => {
        let proxyTotal = 0;
        let fullTotal = 0;
        clips.forEach(clip => {
          proxyTotal += clip.proxy.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA ? 1 : bufferedFraction(clip.proxy);
          fullTotal += clip.full.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA ? 1 : bufferedFraction(clip.full);
        });
        proxyTotal /= clips.length;
        fullTotal /= clips.length;

        let total = 0.5 * proxyTotal + 0.5 * fullTotal;
        
        // HARDWARE LOCK: Never report 100% until the GPU has fully warmed up
        if (total >= 1 && !isWarmedUp) {
          total = 0.99;
        }
        
        setLoadProgress(total, loadId);
      };

      const events = ['progress', 'canplay', 'canplaythrough', 'loadeddata'] as const;
      clips.forEach(clip => {
        events.forEach(e => {
          clip.proxy.addEventListener(e, report);
          clip.full.addEventListener(e, report);
        });
      });

      const poll = window.setInterval(report, 250);
      stopReporting = () => {
        window.clearInterval(poll);
        clips.forEach(clip => {
          events.forEach(e => {
            clip.proxy.removeEventListener(e, report);
            clip.full.removeEventListener(e, report);
          });
        });
      };
    }

    const clock = createClock(scrollData.current?.progress ?? 0);
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
              holdData.current.startProgress = from + (holdStartLocal * span);
              holdData.current.endProgress = from + (holdEndLocal * span);
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

      // Videos are now eagerly loaded upfront, so we no longer dynamically promote here.

      const clip = clips[activeIndex];
      if (clip) {
        // Prefer full quality; fall back to the proxy until it can render.
        const full = clip.full;
        const useFull = full.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
        const active = useFull ? full : clip.proxy;

        // Only the visible element is seeked. Driving both was decoding every
        // frame twice — at 4K that is the difference between smooth and not.
        const sourceTime = clip.trimIn + remaining;
        seek(active, sourceTime);

        if (playheadRef) {
          const conf = sequenceKeys[activeIndex];
          playheadRef.current = {
            clip: typeof conf === 'string' ? conf : conf.key,
            t: sourceTime,
          };
        }

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
  }, [scrollData, JSON.stringify(sequenceKeys), reportsProgress, priority, timingRef, playheadRef]);

  return (
    <div
      ref={stageRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
    />
  );
}
