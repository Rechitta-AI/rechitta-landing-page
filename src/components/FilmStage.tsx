'use client';

import { useEffect, useRef } from 'react';
import {
  BEATS,
  EAGER_CLIPS,
  LAZY_CLIPS,
  getBeatPark,
  getBeatEnter,
  type Beat,
  type Chapter,
} from '@/film/score';
import { isPortraitFor } from '@/hooks/useDeviceMode';
import {
  arrive,
  commit,
  createDirector,
  feedInput,
  release as releaseDirector,
  type Command,
} from '@/film/director';
import { buildTiming, progressForClipTime } from '@/film/timing';
import {
  acquire,
  keepOnly,
  park,
  preloadBlobUrl,
  preloadInBackground,
  poolReport,
  preloadSpan,
  setMediaHost,
} from '@/film/media';
import { isHeld } from '@/film/holds';
import { registerLoadTask, setLoadProgress } from '@/utils/loadProgress';
import type { FilmTiming } from '@/orb/types';
import type { Playhead } from '@/screens/types';

/** How long a crossfade between two parked frames takes, ms. */
const FADE_MS = 420;

/** The white flash that separates chapters, in and out, ms. */
const FLASH_IN_MS = 260;
const FLASH_OUT_MS = 420;

/** How long the film waits for an overlay's hand-off before moving anyway. */
const RELEASE_TIMEOUT_MS = 4000;

/** Give a shot this long to prove it can hold the rate it was asked for. */
const RATE_CHECK_MS = 900;

/** Below this share of the requested rate, the decoder is not keeping up. */
const RATE_TOLERANCE = 0.72;

/**
 * No transition may hold the screen longer than this, whatever the hardware.
 *
 * An earlier version scaled the limit by the rate the decoder turned out to
 * manage, which is backwards: the slower the machine, the longer it trapped
 * the viewer. A shot that has not arrived by now gets cut to its last frame
 * through a short dip, which is a far better outcome than waiting.
 */
const MAX_SHOT_MS = 9000;

/** A shot may still run a little past its natural length before that bites. */
const OVERRUN_FACTOR = 1.6;
const OVERRUN_GRACE_MS = 1200;

/** Events an overlay can fire to hand control back to the film. */
const RELEASE_EVENTS = [
  'rechitta:release',
  'rechitta:start-flight',
  'rechitta:fly-to-buyer',
  'rechitta:fly-to-global',
];

export type FilmStageProps = {
  /** Global 0–1 progress, written every frame for the orb and the rail. */
  scrollData: React.RefObject<{ progress: number }>;
  /** Which presentation overlay is on screen, if any. */
  holdData: React.RefObject<{ clipIndex: number; progress: number }>;
  /** The measured cut, for the orb's clip-anchored path. */
  timingRef?: React.RefObject<FilmTiming | null>;
  /** The exact clip and source second on screen. */
  playheadRef?: React.RefObject<Playhead | null>;
  /**
   * Where the film is as a fractional beat — 3.4 means "two fifths of the way
   * from beat 3 to beat 4". The chapter rail is drawn per beat, so raw
   * progress would fill its ticks unevenly: the six cities share as much of
   * the progress line as the whole intro.
   */
  beatPositionRef?: React.RefObject<number>;
  /** Motion is dead until the intro choreography finishes. */
  enabled: boolean;
  onChapter?: (chapter: Chapter) => void;
  onBeat?: (beat: Beat, index: number) => void;
  /**
   * Fired the instant a move is committed, before any footage plays.
   *
   * `onBeat` only fires on arrival, which is too late for anything that
   * should react to the scroll itself — the hero copy has to be gone by the
   * time the camera starts moving, not several seconds later.
   */
  onMoveStart?: (from: number, to: number, dir: 1 | -1) => void;
  onCity?: (index: number) => void;
  /** A gated beat refused to advance — the overlay should say so. */
  onNudge?: (beat: Beat) => void;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function FilmStage({
  scrollData,
  holdData,
  timingRef,
  playheadRef,
  beatPositionRef,
  enabled,
  onChapter,
  onBeat,
  onCity,
  onNudge,
  onMoveStart,
}: FilmStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  // Read inside long-lived listeners; kept current without rebuilding them.
  const enabledRef = useRef(enabled);
  const callbacks = useRef({ onChapter, onBeat, onCity, onNudge, onMoveStart });
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    callbacks.current = { onChapter, onBeat, onCity, onNudge, onMoveStart };
  }, [onChapter, onBeat, onCity, onNudge, onMoveStart]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setMediaHost(host);

    // Anyone who asked for less motion gets the same film as a slideshow: the
    // beats still change, but nothing travels across the screen to get there.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isPortrait = () =>
      typeof window !== 'undefined' ? isPortraitFor(window.innerWidth, window.innerHeight) : false;

    const state = createDirector(0);
    let timing = buildTiming();
    if (timingRef) timingRef.current = timing;

    /** Revised when metadata reveals a clip shorter than its authored trim. */
    const setTiming = (next: FilmTiming) => {
      timing = next;
      if (timingRef) timingRef.current = next;
    };

    /** The video currently painted. Only one is ever visible. */
    let shown: HTMLVideoElement | null = null;
    let disposed = false;
    let pendingRelease: (() => void) | null = null;
    /** Set when the viewer scrolls forward again mid-shot: cut to the end. */
    let skipRequested = false;

    // ── Progress ─────────────────────────────────────────────────────
    // Everything downstream — the orb, the rail, the chapter overlays — reads
    // one number. Parked beats hold it steady; transitions move it, driven by
    // the decoder's own clock so the orb cannot drift off the frame.

    const beatProgress = (beat: Beat): number => {
      if (beat.progress !== undefined) return beat.progress;
      if (beat.clip) {
        const p = progressForClipTime(timing, beat.clip, beat.park);
        if (p !== null) return p;
      }
      return 0;
    };

    const publish = (progress: number) => {
      if (scrollData.current) scrollData.current.progress = progress;
    };

    const setHold = (index: number) => {
      if (!holdData.current) return;
      holdData.current.clipIndex = index;
      holdData.current.progress = index >= 0 ? 0.5 : 0;
    };

    const show = (v: HTMLVideoElement | null, fadeMs = 0) => {
      if (shown === v) return;
      const previous = shown;
      shown = v;
      if (v) {
        v.style.transition = fadeMs ? `opacity ${fadeMs}ms ease` : 'none';
        v.style.opacity = '1';
      }
      if (previous) {
        previous.style.transition = fadeMs ? `opacity ${fadeMs}ms ease` : 'none';
        previous.style.opacity = '0';
      }
    };

    /** The clip layer steps aside while the multilingual chapter is up. */
    const setLayerVisible = (visible: boolean) => {
      host.style.transition = `opacity ${FADE_MS}ms ease`;
      host.style.opacity = visible ? '1' : '0';
    };

    const flash = (opacity: number, ms: number) => {
      const el = flashRef.current;
      if (!el) return;
      el.style.transition = `opacity ${ms}ms ease-in-out`;
      el.style.opacity = String(opacity);
    };

    // ── Beat arrival ─────────────────────────────────────────────────

    let currentChapter: Chapter = BEATS[0].chapter;

    const settle = async (index: number, dir: 1 | -1) => {
      const beat = BEATS[index];
      arrive(state, index, dir, performance.now(), BEATS);

      publish(beatProgress(beat));
      if (beatPositionRef) beatPositionRef.current = index;
      setHold(beat.hold ?? -1);

      if (beat.chapter !== currentChapter) {
        currentChapter = beat.chapter;
        callbacks.current.onChapter?.(beat.chapter);
      }
      if (beat.city !== undefined) callbacks.current.onCity?.(beat.city);
      callbacks.current.onBeat?.(beat, index);

      // Keep the neighbours' decoders alive and drop everything else.
      const neighbours = [BEATS[index - 1], beat, BEATS[index + 1], BEATS[0]]
        .map((b) => b?.clip)
        .filter((k): k is string => Boolean(k));
      keepOnly(neighbours);

      if (beat.clip) {
        const v = acquire(beat.clip);
        await park(v, getBeatPark(beat, isPortrait()));
        if (!disposed) {
          show(v, FADE_MS);
          if (playheadRef) playheadRef.current = { clip: beat.clip, t: getBeatPark(beat, isPortrait()) };
        }
      } else if (beat.id === 'city-paris' || beat.id === 'city-riyadh') {
        // Pre-park the finale presentation clip ('last') in the background
        // so the hardware decoder is already primed before the clouds appear.
        const nextBeat = BEATS.find((b) => b.id === 'finale-screen');
        if (nextBeat?.clip) {
          const v = acquire(nextBeat.clip);
          park(v, getBeatPark(nextBeat, isPortrait()));
        }
      }
    };

    // ── Transitions ──────────────────────────────────────────────────

    /**
     * Plays the footage between two beats once, at native speed.
     *
     * This is the whole point of the rebuild: the decoder runs the shot on its
     * own clock instead of being seeked to a new time sixty times a second
     * against twenty-four frames of source.
     */
    const playForward = async (beat: Beat, moveFrom = 0, moveTo = 0) => {
      const enterConf = getBeatEnter(beat, isPortraitFor(window.innerWidth, window.innerHeight));
      if (!beat.clip || !enterConf) return;
      const { from, to, rate } = enterConf;

      const v = acquire(beat.clip);
      // Enough of the clip to start without stalling. Short, because the
      // background preloader has usually seen to it already, and because the
      // shot's own deadline covers a decoder that turns out to be struggling.
      await preloadSpan(
        { key: beat.clip, from, to },
        { timeoutMs: 3000, parkAt: from, readyIsEnough: true },
      );
      if (disposed) return;

      if (reduceMotion) {
        await park(v, to);
        if (disposed) return;
        show(v, 0);
        publish(beatProgress(beat));
        if (playheadRef) playheadRef.current = { clip: beat.clip, t: to };
        return;
      }

      show(v, 180);
      await sleep(180);
      if (disposed) return;

      v.playbackRate = rate;
      try {
        await v.play();
      } catch {
        // Autoplay refused: fall through and let the watcher park the frame.
      }

      const startProgress =
        beat.progressFrom ??
        (beat.clip ? progressForClipTime(timing, beat.clip, from) : null) ??
        0;
      const endProgress = beatProgress(beat);
      const inTiming = progressForClipTime(timing, beat.clip, from) !== null;

      const startedAt = performance.now();
      const naturalMs = ((to - from) / rate) * 1000;
      const deadline =
        startedAt + Math.min(naturalMs * OVERRUN_FACTOR + OVERRUN_GRACE_MS, MAX_SHOT_MS);
      let rateChecked = false;
      let cutShort = false;

      await new Promise<void>((resolve) => {
        const watch = (now: number) => {
          if (disposed) return resolve();

          // Asking a software decoder for 2.5x of 4K gets a shot that crawls.
          // Rather than let it stutter, settle on the rate this machine can
          // actually hold. The deadline above is what bounds the wait.
          if (!rateChecked && now - startedAt > RATE_CHECK_MS) {
            rateChecked = true;
            const achieved = ((v.currentTime - from) / (now - startedAt)) * 1000;
            if (achieved > 0.05 && achieved < rate * RATE_TOLERANCE) {
              v.playbackRate = Math.max(1, achieved * 1.1);
            }
          }

          // Whatever happens, the shot ends: overrun, or the viewer scrolling
          // forward again to say they have seen enough of it (unless beat has noSkip).
          if (now > deadline || (skipRequested && !beat.noSkip)) {
            skipRequested = false;
            cutShort = true;
            v.pause();
            return resolve();
          }

          const t = v.currentTime;

          if (playheadRef) playheadRef.current = { clip: beat.clip!, t };
          if (beatPositionRef) {
            const ratio = Math.max(0, Math.min(1, (t - from) / (to - from || 1)));
            beatPositionRef.current = moveFrom + (moveTo - moveFrom) * ratio;
          }

          // Clips inside the measured cut resolve through the same table the
          // orb's keyframes do, so its path stays welded to the footage.
          if (inTiming) {
            const p = progressForClipTime(timing, beat.clip!, t);
            if (p !== null) publish(p);
          } else {
            const ratio = Math.max(0, Math.min(1, (t - from) / (to - from || 1)));
            publish(startProgress + ratio * (endProgress - startProgress));
          }

          if (t >= to - 0.02 || v.ended) {
            v.pause();
            resolve();
            return;
          }
          requestAnimationFrame(watch);
        };
        requestAnimationFrame(watch);
      });

      if (disposed) return;

      // A shot that was cut lands on its final frame through a dip, so the
      // jump reads as an edit rather than as a glitch.
      if (cutShort) {
        v.style.transition = 'opacity 200ms ease';
        v.style.opacity = '0';
        await sleep(200);
        if (disposed) return;
        await park(v, to);
        if (disposed) return;
        publish(endProgress);
        if (playheadRef) playheadRef.current = { clip: beat.clip, t: to };
        v.style.opacity = '1';
        await sleep(200);
      }
    };

    /** Backwards, and between cities: a parked frame dissolving into another. */
    const dissolveTo = async (beat: Beat, fromProgress: number, moveFrom = 0, moveTo = 0) => {
      const toProgress = beatProgress(beat);
      const started = performance.now();

      if (reduceMotion) {
        if (beat.clip) {
          const v = acquire(beat.clip);
          await park(v, getBeatPark(beat, isPortrait()));
          if (disposed) return;
          show(v, 0);
        }
        publish(toProgress);
        return;
      }

      if (beat.clip) {
        const v = acquire(beat.clip);
        await park(v, getBeatPark(beat, isPortrait()));
        if (disposed) return;
        show(v, FADE_MS);
      }

      await new Promise<void>((resolve) => {
        const step = (now: number) => {
          if (disposed) return resolve();
          if (skipRequested) {
            skipRequested = false;
            publish(toProgress);
            return resolve();
          }
          const t = Math.min(1, (now - started) / FADE_MS);
          // Smoothstep, so the orb eases rather than sliding linearly.
          const e = t * t * (3 - 2 * t);
          publish(fromProgress + (toProgress - fromProgress) * e);
          if (beatPositionRef) beatPositionRef.current = moveFrom + (moveTo - moveFrom) * e;
          if (t >= 1) return resolve();
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    };

    /** Chapters are separated by a white flash, the film's only hard cut. */
    /** Chapters are separated by a white flash, the film's only hard cut. */
    const crossChapter = async (target: Beat, swap: () => void | Promise<void>) => {
      if (reduceMotion) {
        await swap();
        return;
      }
      flash(1, FLASH_IN_MS);
      await sleep(FLASH_IN_MS);
      if (disposed) return;
      await swap();
      if (disposed) return;
      // A beat to let the incoming layer paint before the flash lifts.
      await sleep(80);
      flash(0, FLASH_OUT_MS);
      void target;
    };

    /**
     * "6/6 Briefings Delivered" — Macro UI Focus Pull transition between the
     * multilingual cities chapter and the finale presentation.
     */
    const runFocusPullTransition = (
      dir: 1 | -1,
      swap: () => void | Promise<void>,
    ): Promise<void> =>
      new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          resolve();
        };
        const timer = window.setTimeout(done, 800);

        window.dispatchEvent(
          new CustomEvent('rechitta:macro-focus-pull-transition', {
            detail: {
              dir,
              swap,
              done,
            },
          }),
        );
      });

    // ── The move ─────────────────────────────────────────────────────

    const runMove = async (from: number, to: number, dir: 1 | -1) => {
      const source = BEATS[from];
      const target = BEATS[to];
      const fromProgress = beatProgress(source);

      skipRequested = false;
      callbacks.current.onMoveStart?.(from, to, dir);

      // Let the overlay play its own hand-off first — the boardroom's upload
      // and sync sequence — before the camera leaves the room. It is still on
      // screen at this point on purpose: dismissing it first would make it
      // think it had already been scrolled away from, and it would hand
      // control straight back without playing anything.
      if (dir === 1 && source.release) {
        await waitForRelease(source.release);
        if (disposed) return;
      }

      setHold(-1);

      const chapterChange = source.chapter !== target.chapter;

      // Footage that belongs to the chapter being left has to play before the
      // flash, not after it — the flight into the clouds is the way out of the
      // buyer's phone, so it runs while the film layer is still up.
      const playsOut =
        dir === 1 &&
        chapterChange &&
        Boolean(target.enter) &&
        Boolean(target.clip) &&
        progressForClipTime(timing, target.clip!, target.enter!.from) !== null;

      if (playsOut) {
        await playForward(target, from, to);
        if (disposed) return;
      }

      if (chapterChange) {
        const isCitiesFinaleBoundary =
          (source.chapter === 'cities' && target.chapter === 'finale') ||
          (source.chapter === 'finale' && target.chapter === 'cities');

        if (isCitiesFinaleBoundary) {
          await runFocusPullTransition(dir, async () => {
            if (target.chapter === 'cities') {
              setLayerVisible(false);
              show(null, 0);
            } else {
              setLayerVisible(true);
              if (target.clip) {
                const v = acquire(target.clip);
                const enterConf = getBeatEnter(target, isPortrait());
                await park(
                  v,
                  dir === 1 && enterConf && !playsOut ? enterConf.from : getBeatPark(target, isPortrait()),
                );
                show(v, 0);
              }
            }
            if (target.city !== undefined) callbacks.current.onCity?.(target.city);
            if (target.chapter !== currentChapter) {
              currentChapter = target.chapter;
              callbacks.current.onChapter?.(target.chapter);
            }
          });
          if (disposed) return;

          if (!playsOut && dir === 1 && target.enter && target.chapter !== 'cities') {
            await playForward(target, from, to);
          } else {
            publish(beatProgress(target));
          }
        } else {
          await crossChapter(target, async () => {
            if (target.chapter === 'cities') {
              setLayerVisible(false);
              show(null, 0);
            } else {
              setLayerVisible(true);
              if (target.clip) {
                const v = acquire(target.clip);
                const enterConf = getBeatEnter(target, isPortrait());
                await park(
                  v,
                  dir === 1 && enterConf && !playsOut ? enterConf.from : getBeatPark(target, isPortrait()),
                );
                show(v, 0);
              }
            }
            if (target.city !== undefined) callbacks.current.onCity?.(target.city);
            if (target.chapter !== currentChapter) {
              currentChapter = target.chapter;
              callbacks.current.onChapter?.(target.chapter);
            }
          });
          if (disposed) return;

          if (!playsOut && dir === 1 && target.enter && target.chapter !== 'cities') {
            await playForward(target, from, to);
          } else {
            publish(beatProgress(target));
          }
        }
      } else if (target.chapter === 'cities') {
        // Cities move by dissolve; the backdrop runs its own short push-in and
        // then freezes, so nothing drifts while the viewer reads.
        callbacks.current.onCity?.(target.city ?? 0);
        await dissolveTo(target, fromProgress, from, to);
      } else if (dir === 1 && target.enter) {
        await playForward(target, from, to);
      } else {
        await dissolveTo(target, fromProgress, from, to);
      }

      if (disposed) return;
      await settle(to, dir);
    };

    // ── Release handshake ────────────────────────────────────────────

    const waitForRelease = (eventName: string) =>
      new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          pendingRelease = null;
          window.clearTimeout(timer);
          resolve();
        };
        pendingRelease = done;
        const timer = window.setTimeout(done, RELEASE_TIMEOUT_MS);
        window.dispatchEvent(new CustomEvent(eventName));
      });

    const onReleaseEvent = () => {
      // Either the film is already waiting on this overlay, or the viewer
      // pressed the button without scrolling first.
      if (pendingRelease) {
        pendingRelease();
        return;
      }
      if (!enabledRef.current) return;
      const cmd = releaseDirector(state, performance.now(), BEATS);
      dispatch(cmd);
    };

    // ── Input ────────────────────────────────────────────────────────

    /** An overlay can hold the film on its beat — see film/holds.ts. */
    const isBlocked = (index: number) => isHeld(BEATS[index]?.id ?? '');

    const dispatch = (cmd: Command) => {
      switch (cmd.type) {
        case 'move':
          void runMove(cmd.from, cmd.to, cmd.dir);
          break;
        case 'step':
          window.dispatchEvent(
            new CustomEvent('rechitta:beat-step', {
              detail: { beat: BEATS[cmd.index].id, step: cmd.step, dir: cmd.dir },
            }),
          );
          break;
        case 'skip':
          skipRequested = true;
          break;
        case 'blocked':
          window.dispatchEvent(
            new CustomEvent('rechitta:blocked', { detail: { beat: BEATS[cmd.index].id } }),
          );
          break;
        case 'nudge':
          callbacks.current.onNudge?.(BEATS[cmd.index]);
          window.dispatchEvent(
            new CustomEvent('rechitta:nudge', { detail: { beat: BEATS[cmd.index].id } }),
          );
          break;
        default:
          break;
      }
    };

    // A window onto the beat machine, for calibration and for the browser
    // checks that drive the film end to end. Dev only.
    if (process.env.NODE_ENV !== 'production') {
      (window as unknown as { __film?: unknown }).__film = {
        state,
        beats: BEATS,
        get beat() {
          return BEATS[state.index];
        },
        get enabled() {
          return enabledRef.current;
        },
        get progress() {
          return scrollData.current?.progress ?? 0;
        },
        pool: poolReport,
        step: (dir: 1 | -1) => dispatch(commit(state, dir, performance.now(), BEATS)),
      };
    }

    const feed = (delta: number) => {
      if (!enabledRef.current) return;
      if (modalOpen()) return;
      dispatch(feedInput(state, delta, performance.now(), BEATS, isBlocked));
    };

    const modalOpen = () => document.documentElement.hasAttribute('data-modal-open');

    const onWheel = (e: WheelEvent) => {
      if (modalOpen()) return;
      e.preventDefault();
      // deltaMode 1 is lines, 2 is pages. Normalise both to pixels.
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      feed(e.deltaY * scale);
    };

    let touchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (modalOpen()) return;
      e.preventDefault();
      const y = e.touches[0]?.clientY;
      if (y === undefined || touchY === null) return;
      // Dragging a finger up means going forward, the same way a page scrolls.
      feed((touchY - y) * 2.0);
      touchY = y;
    };
    const onTouchEnd = () => {
      touchY = null;
    };

    const FORWARD_KEYS = ['ArrowDown', 'PageDown', ' ', 'Spacebar'];
    const BACK_KEYS = ['ArrowUp', 'PageUp'];
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (modalOpen()) return;
      if (FORWARD_KEYS.includes(e.key)) {
        e.preventDefault();
        if (!enabledRef.current || state.phase === 'moving') return;
        dispatch(commit(state, 1, performance.now(), BEATS, isBlocked));
      } else if (BACK_KEYS.includes(e.key)) {
        e.preventDefault();
        if (!enabledRef.current || state.phase === 'moving') return;
        dispatch(commit(state, -1, performance.now(), BEATS));
      }
    };

    /**
     * The boardroom's dots and arrow keys change the slide without going
     * through the threshold. Without this the counters drift apart, and the
     * next scroll jumps back to whichever slide the film thought it was on.
     */
    const onStepSync = (e: Event) => {
      const detail = (e as CustomEvent<{ beat?: string; step?: number }>).detail;
      if (!detail || typeof detail.step !== 'number') return;
      if (BEATS[state.index]?.id !== detail.beat) return;
      const steps = BEATS[state.index]?.steps ?? 1;
      state.step = Math.max(0, Math.min(steps - 1, detail.step));
    };
    /** Jump directly to a beat from Navbar or ScrollRail */
    const onJumpEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ index: number }>).detail;
      if (typeof detail?.index === 'number' && detail.index >= 0 && detail.index < BEATS.length) {
        if (state.index === detail.index || state.phase === 'moving') return;
        const dir = detail.index > state.index ? 1 : -1;
        void runMove(state.index, detail.index, dir);
      }
    };
    window.addEventListener('rechitta:beat-sync', onStepSync);
    window.addEventListener('rechitta:jump-to-beat', onJumpEvent);

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKey);
    RELEASE_EVENTS.forEach((e) => window.addEventListener(e, onReleaseEvent));

    // ── Loading ──────────────────────────────────────────────────────
    // The loader only waits on what the viewer meets before the boardroom.
    // Everything past it streams in afterwards, one clip at a time, in the
    // order the film needs them.

    registerLoadTask('film');
    let stopBackground = () => {};

    (async () => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 810;
      const spans = EAGER_CLIPS;
      const fractions = new Array(spans.length).fill(0);
      await Promise.all(
        spans.map((span, i) =>
          preloadSpan(span, {
            parkAt: BEATS[0].park,
            timeoutMs: isMobile ? 1200 : 12000,
            readyIsEnough: true,
            onProgress: (f) => {
              fractions[i] = f;
              setLoadProgress(
                fractions.reduce((a, b) => a + b, 0) / spans.length,
                'film',
              );
            },
          }),
        ),
      );
      setLoadProgress(1, 'film');
      if (disposed) return;

      const first = BEATS[0];
      if (first.clip) show(acquire(first.clip), 0);
      publish(beatProgress(first));
      if (beatPositionRef) beatPositionRef.current = 0;

      // Metadata may reveal a clip shorter than its authored trim.
      const measured: Record<string, number> = {};
      spans.forEach((s) => {
        const v = acquire(s.key);
        if (v.duration && Number.isFinite(v.duration)) measured[s.key] = v.duration;
      });
      setTiming(buildTiming(measured));

      // Idle time is when the rest of the film arrives.
      const start = () => {
        if (!disposed) stopBackground = preloadInBackground(LAZY_CLIPS);
      };
      if ('requestIdleCallback' in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void) => void })
          .requestIdleCallback(start);
      } else {
        setTimeout(start, 1200);
      }
    })();

    return () => {
      disposed = true;
      stopBackground();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('rechitta:beat-sync', onStepSync);
      window.removeEventListener('rechitta:jump-to-beat', onJumpEvent);
      RELEASE_EVENTS.forEach((e) => window.removeEventListener(e, onReleaseEvent));
      setMediaHost(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        ref={hostRef}
        id="film-stage-host"
        className="absolute inset-0 z-10 w-full h-full overflow-hidden pointer-events-none"
      />
      <div
        ref={flashRef}
        className="absolute inset-0 z-30 w-full h-full bg-white opacity-0 pointer-events-none"
        aria-hidden="true"
      />
    </>
  );
}
