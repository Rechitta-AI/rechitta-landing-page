'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { coverRect, matrix3dFor } from '@/screens/warp';
import { isPortraitFor } from '@/hooks/useDeviceMode';
import { beatIndexById } from '@/film/score';
import WallLogoReel, { DEVELOPER_LOGOS, PROJECT_LOGOS } from './BuilderCarousel';
import { FinaleStatsSlide, FinaleQuestionsSlide } from './FinaleDeckSlides';
import DeckDock from './DeckDock';
import { FONT_BODY, FONT_CODE } from '@/design/fonts';
import { BRAND_BLUE, BRAND_GOLD, NEUTRAL, SUCCESS_400, light } from '@/design/tokens';
import { MONITOR_CORNERS, DEFAULT_CALIBRATION, sanitizeCalibration, type CalibrationCoords } from './MonitorCalibrator';

/**
 * 4-Corner 3D Calibrated Coordinates on mobile portrait (% of video cover rect)
 * measured at t = 5.2s where the boardroom monitor is 100% fully in view with all 4 bezels.
 */
export const MOBILE_MONITOR_CORNERS = {
  tl: [38.67, 22.57] as [number, number],
  tr: [59.09, 22.66] as [number, number],
  br: [59.00, 43.18] as [number, number],
  bl: [38.67, 42.97] as [number, number],
};

/**
 * Global Hub Data matching the 6 Multilingual Cities + Dubai Headquarters.
 * Re-anchored to the 1.73:1 (2000 x 1156) reference canvas to eliminate compression.
 * All derived to read THE SAME MOMENT: 04:11 UTC.
 */
interface GlobalHub {
  key: string;
  name: string;
  x: number;
  y: number;
  time: string;
  lang: string;
  status: string;
  isHQ?: boolean;
  labelOffset: { x: number; y: number };
}

const GLOBAL_HUBS: GlobalHub[] = [
  {
    key: 'london',
    name: 'LONDON',
    x: 980,
    y: 310,
    time: '05:11',
    lang: 'EN',
    status: 'DELIVERED',
    labelOffset: { x: -68, y: -34 },
  },
  {
    key: 'paris',
    name: 'PARIS',
    x: 995,
    y: 345,
    time: '05:11',
    lang: 'FR',
    status: 'DELIVERED',
    labelOffset: { x: 68, y: 34 },
  },
  {
    key: 'moscow',
    name: 'MOSCOW',
    x: 1185,
    y: 305,
    time: '07:11',
    lang: 'RU',
    status: 'DELIVERED',
    labelOffset: { x: 0, y: -34 },
  },
  {
    key: 'riyadh',
    name: 'RIYADH',
    x: 1245,
    y: 480,
    time: '07:11',
    lang: 'AR',
    status: 'DELIVERED',
    labelOffset: { x: -85, y: -28 },
  },
  {
    key: 'dubai',
    name: 'DUBAI HQ',
    x: 1292,
    y: 485,
    time: '08:11',
    lang: 'HQ',
    status: 'GLOBAL ENGINE',
    isHQ: true,
    labelOffset: { x: 0, y: 40 },
  },
  {
    key: 'mumbai',
    name: 'MUMBAI',
    x: 1385,
    y: 505,
    time: '09:41',
    lang: 'HI',
    status: 'DELIVERED',
    /*
     * Positioned southeast to guarantee zero overlap with Dubai HQ.
     * With Dubai HQ badge at width 250 (x: -125..+125), Dubai's right edge reaches x = 1417.
     * Mumbai at offset x: +152 places its left edge at x = 1421, ensuring complete clearance.
     */
    labelOffset: { x: 152, y: 56 },
  },
  {
    key: 'shanghai',
    name: 'SHANGHAI',
    x: 1625,
    y: 455,
    time: '12:11',
    lang: 'ZH',
    status: 'DELIVERED',
    labelOffset: { x: 0, y: -34 },
  },
];

/** Geodesic arc generator from hub to Dubai HQ */
function makeArcPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const midX = (fromX + toX) / 2;
  const dist = Math.hypot(toX - fromX, toY - fromY);
  const midY = (fromY + toY) / 2 - dist * 0.22;
  return `M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`;
}

const DUBAI_HQ = GLOBAL_HUBS.find((h) => h.isHQ)!;
const STREAM_ARCS = GLOBAL_HUBS.filter((h) => !h.isHQ).map((h) => ({
  key: `${h.key}-dubai`,
  path: makeArcPath(h.x, h.y, DUBAI_HQ.x, DUBAI_HQ.y),
  hub: h,
}));

/** The closing monitor's deck: the map, the numbers, the questions. */
const FINALE_SLIDES = 3;

interface FinaleWorldMapPresentationProps {
  chapter: string;
  beatIndex: number;
  isMoving?: boolean;
}

/** The closing boardroom's logo reels, switched off. */
const SHOW_WALL_REELS: boolean = false;

export default function FinaleWorldMapPresentation({
  chapter,
  beatIndex,
  isMoving = false,
}: FinaleWorldMapPresentationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  /* The builders' reel sits beside the monitor, not on it: the map container
     is warped onto the screen's quad and everything inside it warps with it. */
  const reelRef = useRef<HTMLDivElement>(null);
  const rightReelRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  /* The closing deck: the map, the numbers, the questions. */
  const slidesRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });
  const [calibration, setCalibration] = useState<CalibrationCoords>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('rechitta:monitor-calibration');
        if (saved) return sanitizeCalibration(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_CALIBRATION;
  });
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track viewport resize
  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to live calibrator updates
  useEffect(() => {
    const onCalibrate = (e: Event) => {
      const customEvent = e as CustomEvent<CalibrationCoords>;
      if (customEvent.detail) {
        const safe = sanitizeCalibration(customEvent.detail);
        setCalibration(safe);
        if (typeof customEvent.detail.isCalibrating === 'boolean') {
          setIsCalibrating(customEvent.detail.isCalibrating);
        }
      }
    };
    window.addEventListener('rechitta:calibrate-monitor', onCalibrate);
    return () => window.removeEventListener('rechitta:calibrate-monitor', onCalibrate);
  }, []);

  // Screen Placement based on live 4-corner calibration coordinates
  const flat = isPortraitFor(viewport.width, viewport.height);
  const rect = coverRect(viewport.width, viewport.height);

  // On mobile portrait, center the physical presentation monitor horizontally
  // The monitor in the 1920x1078 frame at t=5.2s is centered at x=938.5 (21.5px left of video center 960).
  // Shifting by +21.5/1920 * rect.width places the monitor exactly in the horizontal center.
  const shiftX = flat ? Math.round(rect.width * (21.5 / 1920)) : 0;
  const effectiveRectX = rect.x + shiftX;

  const quadCoords = flat ? MOBILE_MONITOR_CORNERS : calibration;

  const tlPx: [number, number] = [
    effectiveRectX + (quadCoords.tl[0] / 100) * rect.width,
    rect.y + (quadCoords.tl[1] / 100) * rect.height,
  ];
  const trPx: [number, number] = [
    effectiveRectX + (quadCoords.tr[0] / 100) * rect.width,
    rect.y + (quadCoords.tr[1] / 100) * rect.height,
  ];
  const brPx: [number, number] = [
    effectiveRectX + (quadCoords.br[0] / 100) * rect.width,
    rect.y + (quadCoords.br[1] / 100) * rect.height,
  ];
  const blPx: [number, number] = [
    effectiveRectX + (quadCoords.bl[0] / 100) * rect.width,
    rect.y + (quadCoords.bl[1] / 100) * rect.height,
  ];

  /*
   * The quad the canvas is actually painted onto, grown a little past the
   * calibrated one.
   *
   * The corners themselves are now measured off the footage rather than tuned
   * by eye (see MONITOR_CORNERS), so this is no longer correcting anything —
   * it is a hairline, 0.3% of the screen on each edge, roughly three pixels at
   * 1080p. Enough that the perspective transform cannot leave a one-pixel seam
   * of bare screen down an edge, small enough that the bezel around the
   * monitor stays a bezel: it eats about a sixth of the black surround, which
   * reads as screen light spilling onto it rather than as a slide that has
   * outgrown the television.
   */
  const SCREEN_BLEED = 0.006;
  const quadCx = (tlPx[0] + trPx[0] + brPx[0] + blPx[0]) / 4;
  const quadCy = (tlPx[1] + trPx[1] + brPx[1] + blPx[1]) / 4;
  const bleed = (p: [number, number]): [number, number] => [
    quadCx + (p[0] - quadCx) * (1 + SCREEN_BLEED),
    quadCy + (p[1] - quadCy) * (1 + SCREEN_BLEED),
  ];
  const bledTl = bleed(tlPx);
  const bledTr = bleed(trPx);
  const bledBr = bleed(brPx);
  const bledBl = bleed(blPx);

  // Map onto the pristine 2000 x 1156 (1.73:1) uncompressed reference canvas
  const quadTransform = matrix3dFor(2000, 1156, [bledTl, bledTr, bledBr, bledBl]);

  // Portrait phone fallback
  const availableW = viewport.width * 0.94;
  const availableH = viewport.height * 0.65;
  const portraitScale = Math.min(availableW / 960, availableH / 555);
  const portraitWidth = 960 * portraitScale;
  const portraitHeight = 555 * portraitScale;
  const portraitLeft = (viewport.width - portraitWidth) / 2;
  const portraitTop = (viewport.height - portraitHeight) / 2;

  /*
   * The logo reels, on the walls either side of the presentation monitor.
   *
   * The wall panels are measured off this scene's own park frame the same way
   * the opening boardroom's are — the wall is flat and the glazing either side
   * of it carries city lights, so a column's variance separates them. The flat
   * runs are 4.9%-18.2% on the left and 82.9%-96.2% on the right. Placing the
   * strips by symmetry about the viewport instead, as they were, walked them
   * off the wall and into the glass.
   *
   * Both strips run the monitor's full height and a little beyond it at each
   * end, so they read as running up the wall rather than as two floating
   * cards.
   */
  const WALL_L = { from: 0.049, to: 0.182 };
  const WALL_R = { from: 0.829, to: 0.962 };
  /*
   * Sized so a bare mark paints at the size the chipped one did.
   *
   * Dropping the tile hands the logo the chip's own padding and lifts the cap
   * ratio, so the same strip width renders it around a quarter larger; the
   * strip gives that back. 0.525 of the panel against the 0.64 it used to
   * take, and 103 against 126, is the 0.82 that lands a height-limited mark
   * within 2% of where it was.
   */
  const WALL_INSET = 0.31;
  const MAX_REEL_W = 75;

  const monitorL = Math.min(bledTl[0], bledBl[0]);
  const monitorR = Math.max(bledTr[0], bledBr[0]);


  const wallRun = (w: { from: number; to: number }) => {
    const x0 = Math.max(rect.x + w.from * rect.width, 8);
    const x1 = Math.min(rect.x + w.to * rect.width, viewport.width - 8);
    return { x0, width: Math.max(0, x1 - x0) };
  };
  const leftRun = wallRun(WALL_L);
  const rightRun = wallRun(WALL_R);

  const reelWidth = Math.min(
    MAX_REEL_W,
    Math.min(leftRun.width, rightRun.width) * (1 - 2 * WALL_INSET),
  );
  const reelLeft = leftRun.x0 + (leftRun.width - reelWidth) / 2;
  const rightReelLeft = rightRun.x0 + (rightRun.width - reelWidth) / 2;

  /*
   * The full height of the page, not of the screen.
   *
   * Bounding these to the monitor's own span made them read as two columns
   * standing beside it. Running edge to edge, with the mask taking both ends
   * to nothing, a mark rises in off the bottom of the frame and leaves through
   * the top — the wall carries on past the shot in both directions, which is
   * what the room actually looks like.
   */
  const reelTop = 0;
  const reelHeight = viewport.height;

  /* The floor follows the cap down: at 75 a strip is still a legible mark, and
     gating at the old 76 would have switched these off altogether. */
  /* The closing boardroom carries no logos: the opening one already made that
     point, and here the map is the only thing on the wall. The geometry above
     is kept so the reels can be switched back on in one place. */
  const reelFits = SHOW_WALL_REELS && !flat && reelWidth >= 52 && reelHeight > 120;
  const rightReelFits = reelFits;

  /*
   * The deck's controls, in the gap under the monitor.
   *
   * The screen's bottom edge is at about 75% of the frame and the orb parks at
   * 86% for this beat, so there is roughly a fourteenth of the frame between
   * them. These go at the top of that, clear of both.
   */
  /*
   * The dock, in the gap between the television and the chapter rail.
   *
   * It used to hang off the lit panel's own bottom edge, which is 4.5% of the
   * frame above where the set actually ends — so it sat on the bezel. Scanning
   * down the park frame, the screen fades out at 75.5% and the black surround
   * runs to 80.5% before the wall picks up again, so that is the real bottom
   * of the object.
   *
   * Centred in what is left between there and the band the rail reserves,
   * rather than hung under the set: at 16:9 that gap is over 150px and hugging
   * the bezel left the dock stranded well above the rail.
   */
  const TV_BOTTOM = 0.805;
  /* What the chapter rail actually occupies: its 1.25rem bottom padding, the
     track, and the chapter names under it. Measured rather than rounded up,
     because on a wide short viewport the television leaves barely 40px of
     wall between itself and the rail and every pixel of it is needed. */
  const RAIL_BAND = 64;
  const DOCK_H = 30;
  const bezelBottom = rect.y + TV_BOTTOM * rect.height;
  const railTop = viewport.height - RAIL_BAND;
  const dockTop = Math.min(
    Math.max(bezelBottom + (railTop - bezelBottom - DOCK_H) / 2, bezelBottom + 8),
    railTop - DOCK_H,
  );
  const dockLeft = (bledBl[0] + bledBr[0]) / 2;

  /*
   * How small the monitor is actually painting.
   *
   * The slides are authored on a 2000-unit canvas. On a wide screen the
   * monitor takes 880 to 1280 of those points, so a unit paints at roughly a
   * half and the deck reads as a deck. On a portrait phone the same canvas
   * lands on a 260-point screen in the shot — a sixth — and the chrome would
   * be two pixels tall. Below a third, the slides drop to a compact layout.
   */
  const deckScale = (monitorR - monitorL) / 2000;
  const deckCompact = deckScale < 0.34;

  /*
   * On screen while the film is parked on the presentation, and held through
   * the pull-back that follows.
   *
   * The map is warped onto the monitor using one calibrated quad, measured at
   * the frame the film parks on. That quad is only right for that frame, so
   * once the camera starts moving the map would slide off the screen it is
   * supposed to be on. Rather than cut it dead the moment the shot begins —
   * which read as the map blinking out — it now rides the start of the move
   * and dissolves over it, so the room pulls away from a lit screen.
   *
   * Holding it all the way through the pull-back needs the monitor's corners
   * tracked across the clip, the way the phones are in screens/tracks.ts.
   */
  const onPresentation = chapter === 'finale' && beatIndex === beatIndexById('finale-screen');
  const isVisible = (onPresentation && !isMoving) || isCalibrating;
  const isDissolving = onPresentation && isMoving && !isCalibrating;

  // Network ignition animation when landing via match-cut transition
  const triggerIgnition = () => {
    const el = containerRef.current;
    if (!el) return;

    const nodes = el.querySelectorAll('.city-hub-node');
    if (nodes.length > 0) {
      gsap.fromTo(
        nodes,
        { scale: 0.82, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, stagger: 0.04, ease: 'back.out(1.5)', delay: 0.08 }
      );
    }
    const arcs = el.querySelectorAll('.laser-stream-arc');
    if (arcs.length > 0) {
      gsap.fromTo(
        arcs,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, stagger: 0.03, ease: 'power2.out', delay: 0.04 }
      );
    }
  };

  useEffect(() => {
    const onIgnite = () => triggerIgnition();
    window.addEventListener('rechitta:ignite-world-map', onIgnite);
    return () => window.removeEventListener('rechitta:ignite-world-map', onIgnite);
  }, []);

  /*
   * The track moves as one piece, on the GPU, the way the opening deck's does.
   * Three panels, so a step is a third of the track's own width.
   */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('rechitta:beat-sync', { detail: { beat: 'finale-screen', step: activeSlide } }),
    );
    if (!slidesRef.current) return;
    gsap.to(slidesRef.current, {
      xPercent: (-activeSlide * 100) / FINALE_SLIDES,
      duration: 0.78,
      ease: 'power2.inOut',
      overwrite: 'auto',
      force3D: true,
    });
  }, [activeSlide]);

  /** Scroll steps walk the deck before the film leaves for the horizon. */
  useEffect(() => {
    const onStep = (e: Event) => {
      const detail = (e as CustomEvent<{ beat?: string; step?: number }>).detail;
      if (detail?.beat !== 'finale-screen' || typeof detail.step !== 'number') return;
      setActiveSlide(Math.max(0, Math.min(FINALE_SLIDES - 1, detail.step)));
    };
    window.addEventListener('rechitta:beat-step', onStep);
    return () => window.removeEventListener('rechitta:beat-step', onStep);
  }, []);

  const slideBy = (direction: -1 | 1) => {
    setActiveSlide((prev) => Math.max(0, Math.min(FINALE_SLIDES - 1, prev + direction)));
  };

  // Keep the physical boardroom monitor centered horizontally on mobile portrait
  useEffect(() => {
    const applyVideoPosition = () => {
      const videos = document.querySelectorAll<HTMLVideoElement>('#film-stage-host video');
      videos.forEach((v) => {
        if (v.dataset.clip === 'last') {
          if (flat && isVisible) {
            v.style.transition = 'object-position 0.4s ease-out';
            v.style.objectPosition = `calc(50% + ${shiftX}px) 50%`;
          } else {
            v.style.transition = 'object-position 0.4s ease-out';
            v.style.objectPosition = '50% 50%';
          }
        }
      });
    };

    applyVideoPosition();
    const rafId = requestAnimationFrame(applyVideoPosition);
    const timerId = setTimeout(applyVideoPosition, 100);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      const videos = document.querySelectorAll<HTMLVideoElement>('#film-stage-host video');
      videos.forEach((v) => {
        if (v.dataset.clip === 'last') {
          v.style.objectPosition = '50% 50%';
        }
      });
    };
  }, [isVisible, flat, shiftX]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // The map, the reel beside it, and the mobile marquee are lit and dimmed as one.
    const panels = [
      el,
      reelRef.current,
      rightReelRef.current,
      marqueeRef.current,
      dockRef.current,
    ].filter(Boolean);

    if (isVisible) {
      gsap.killTweensOf(panels);
      gsap.set(panels, { display: 'block' });

      /*
       * Open on the map, and say so.
       *
       * The exit fade resets the deck to slide 0, but the film's own step
       * counter does not follow it: arriving backwards from the horizon lands
       * that counter on the last slide. The sync goes out unconditionally
       * because there is no state change to ride on — the deck is already on
       * slide 0 — and the track is set rather than tweened so a fast
       * re-entry cannot catch it mid-travel.
       */
      if (slidesRef.current) gsap.set(slidesRef.current, { xPercent: 0 });
      window.dispatchEvent(
        new CustomEvent('rechitta:beat-sync', { detail: { beat: 'finale-screen', step: 0 } }),
      );
      gsap.fromTo(
        el,
        { opacity: 0 },
        { opacity: 1, duration: 0.42, ease: 'power2.out' }
      );
      if (reelRef.current) {
        gsap.fromTo(
          reelRef.current,
          { opacity: 0, x: -16, filter: 'blur(6px)' },
          { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.48, ease: 'power3.out' }
        );
      }
      if (rightReelRef.current) {
        gsap.fromTo(
          rightReelRef.current,
          { opacity: 0, x: 16, filter: 'blur(6px)' },
          { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.48, ease: 'power3.out' }
        );
      }

      // Option 1: The Cinematic Match-Cut & Staggered Reveal for texts, buttons & pills
      const marqueeEl = marqueeRef.current;
      if (marqueeEl) {
        gsap.killTweensOf(marqueeEl.querySelectorAll('.finale-stagger-item'));
        // Clean out any lingering filter blur or opacity styles to guarantee 100% sharp rendering
        gsap.set(marqueeEl.querySelectorAll('.finale-stagger-item'), {
          clearProps: 'filter',
        });
        gsap.set(marqueeEl, { opacity: 1 });

        const tl = gsap.timeline({ delay: 0.06 });

        // 1. Developer partner marquee softly rises into place
        tl.fromTo(
          marqueeEl.querySelectorAll('.finale-marquee-wrap'),
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.42, ease: 'power3.out' },
          0
        );
      }

      triggerIgnition();
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('rechitta:remeasure-dock'));
      });
    } else {
      gsap.killTweensOf(panels);
      if (el) gsap.killTweensOf(el.querySelectorAll('*'));
      const marqueeEl = marqueeRef.current;
      if (marqueeEl) {
        gsap.killTweensOf(marqueeEl.querySelectorAll('.finale-stagger-item'));
        // Swift lift-off for text, buttons and pills without any CSS filter blur to prevent smudging
        gsap.to(marqueeEl.querySelectorAll('.finale-stagger-item'), {
          opacity: 0,
          y: -8,
          duration: 0.20,
          stagger: 0.015,
          ease: 'power2.in',
          clearProps: 'filter',
        });
      }
      gsap.to(panels, {
        opacity: 0,
        // Fade out immediately as soon as the sequence starts playing
        duration: 0.25,
        ease: 'power2.out',
        onComplete: () => {
          gsap.set(panels, { display: 'none' });
          // Back to the map, so the beat always opens where it opened before.
          setActiveSlide(0);
        },
      });
    }
    // isDissolving only ever changes alongside isVisible.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  if (!mounted) return null;

  return (
    <>
      {reelFits && (
        <div
          ref={reelRef}
          className="fixed pointer-events-none select-none"
          style={{
            display: 'none',
            left: `${reelLeft}px`,
            top: `${reelTop}px`,
            zIndex: 49,
          }}
        >
          <WallLogoReel
            logos={DEVELOPER_LOGOS}
            width={reelWidth}
            height={reelHeight}
            duration={34}
            bare
          />
        </div>
      )}

      {rightReelFits && (
        <div
          ref={rightReelRef}
          className="fixed pointer-events-none select-none"
          style={{
            display: 'none',
            left: `${rightReelLeft}px`,
            top: `${reelTop}px`,
            zIndex: 49,
          }}
        >
          <WallLogoReel
            logos={PROJECT_LOGOS}
            width={reelWidth}
            height={reelHeight}
            duration={41}
            bare
          />
        </div>
      )}

      {/*
        The deck's controls, matching the opening boardroom's dock exactly:
        back, where you are, forward, in one object. Landscape hangs it in the
        gap under the monitor; portrait has no such gap, so it rides at the top
        of the table block below instead.
      */}
      {!flat && (
        <div
          ref={dockRef}
          className="fixed pointer-events-auto select-none"
          style={{
            display: 'none',
            left: `${dockLeft}px`,
            top: `${dockTop}px`,
            transform: 'translateX(-50%)',
            zIndex: 100,
          }}
        >
          <DeckDock
            count={FINALE_SLIDES}
            active={activeSlide}
            onStep={slideBy}
            onPick={setActiveSlide}
            backLabel="Previous slide"
            forwardLabel="Next slide"
            clampAtEnds
          />
        </div>
      )}

      {/* Mobile Boardroom Table Experience: Directly on the table surface (No card, matching Hero aesthetic) */}
      {flat && (
        <div
          ref={marqueeRef}
          className="fixed left-0 right-0 pointer-events-auto select-none px-4 sm:px-6 flex flex-col"
          style={{
            display: 'none',
            top: `${Math.round(blPx[1] + 24)}px`,
            zIndex: 50,
          }}
        >
          <div className="max-w-sm mx-auto w-full flex flex-col gap-2 sm:gap-2.5">
            <div className="finale-stagger-item finale-marquee-wrap flex justify-center">
              <DeckDock
            count={FINALE_SLIDES}
            active={activeSlide}
            onStep={slideBy}
            onPick={setActiveSlide}
            backLabel="Previous slide"
            forwardLabel="Next slide"
            clampAtEnds
          />
            </div>


            {/* Where the orb comes to rest. Measured by OrbStage; draws nothing. */}
            <div className="relative w-full h-10 pointer-events-none" aria-hidden="true">
              <div
                id="finale-dock-anchor"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              />
            </div>
          </div>
        </div>
      )}

    <div
      ref={containerRef}
      id="finale-world-map-screen"
      className="fixed pointer-events-none select-none"
      style={{
        display: 'none',
        left: 0,
        top: 0,
        width: '2000px',
        height: '1156px',
        transformOrigin: '0 0',
        transform: quadTransform !== 'none' ? quadTransform : undefined,
        zIndex: 48,
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      {/*
        The deck's track, three panels wide.

        The whole thing is warped onto the monitor's quad by the transform
        above, so the slides travel inside the screen rather than across the
        room. The map keeps its transparent ground and lets the lit monitor
        through; the two analytics panels paint their own.
      */}
      <div
        ref={slidesRef}
        className="absolute inset-0 flex"
        style={{ width: `${FINALE_SLIDES * 100}%`, height: '100%', willChange: 'transform' }}
      >
      <div style={{ width: '2000px', height: '1156px', flexShrink: 0 }}>
      {/* 2000 x 1156 SVG canvas: matches screen aspect ratio 1.73:1 exactly */}
      <svg
        viewBox="0 0 2000 1156"
        className="w-full h-full pointer-events-auto"
      >
        <defs>
          {/* Subtle laser arc glow */}
          <filter id="arcGlow2k" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Dubai HQ luxury gold glow */}
          <filter id="hqGlow2k" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Obsidian badge drop shadow */}
          <filter id="pillShadow2k" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Subtle Architectural Distance Grid & Latitude Guide */}
        <g opacity="0.14" pointerEvents="none">
          <circle cx="1292" cy="485" r="180" fill="none" stroke="#3D6FF5" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="1292" cy="485" r="380" fill="none" stroke="#3D6FF5" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="1292" cy="485" r="620" fill="none" stroke="#3D6FF5" strokeWidth="1" strokeDasharray="4 6" />
          <line x1="80" y1="485" x2="1920" y2="485" stroke={NEUTRAL[600]} strokeWidth="1" strokeDasharray="3 6" />
          <line x1="1292" y1="120" x2="1292" y2="980" stroke={NEUTRAL[600]} strokeWidth="1" strokeDasharray="3 6" />
        </g>

        {/* 1. Top Header (y = 68) with generous margin above northern landmasses */}
        {/* Label/Default, gold, at the canvas's 1.69 scale — the deck's section-label convention. */}
        <g transform="translate(60, 68)">
          <circle cx="0" cy="0" r="5" fill={light.bgAccent} />
          <circle cx="0" cy="0" r="10" fill="none" stroke={light.borderAccent} strokeWidth="1.2" opacity="0.45" />

          <text
            x="22"
            y="2"
            dominantBaseline="central"
            fill={light.textAccent}
            fontSize="20.3"
            fontWeight="500"
            letterSpacing="2"
            style={{ fontFamily: FONT_BODY }}
          >
            RECHITTA // GLOBAL DISTRIBUTION ENGINE
          </text>
        </g>

        {/* Top Right Status Badge - Obsidian Micro-Pill */}
        <g transform="translate(1940, 68)">
          {/* Label/Small on neutral/950, radius/full. */}
          <rect
            x="-470"
            y="-20"
            width="470"
            height="40"
            rx="20"
            fill="rgba(10, 10, 9, 0.9)"
            stroke="rgba(255, 255, 255, 0.16)"
            strokeWidth="1"
            filter="url(#pillShadow2k)"
          />
          <circle cx="-444" cy="0" r="5" fill={SUCCESS_400} />
          <text
            x="-426"
            y="2"
            dominantBaseline="central"
            fill={NEUTRAL[200]}
            fontSize="18.6"
            fontWeight="500"
            letterSpacing="1.7"
            style={{ fontFamily: FONT_BODY }}
          >
            6/6 HUBS SYNCHRONIZED · 04:11 UTC
          </text>
        </g>

        {/* 2. User's world.svg Map Vector Layer (y = 145, 100% uncompressed native 2000x857) */}
        <image
          href="/map/world.svg"
          x="0"
          y="145"
          width="2000"
          height="857"
          preserveAspectRatio="none"
          style={{
            mixBlendMode: 'multiply',
            opacity: 0.94,
            filter: 'drop-shadow(0 2px 5px rgba(10, 10, 9, 0.22))',
          }}
        />

        {/* 3. Streaming Data Arcs Connecting All 6 Hubs to Dubai HQ */}
        <g>
          {STREAM_ARCS.map((arc) => (
            <g key={arc.key} className="laser-stream-arc">
              {/* Underlying dashed guide rail */}
              <path
                d={arc.path}
                fill="none"
                stroke="rgba(61, 111, 245, 0.26)"
                strokeWidth="1.8"
                strokeDasharray="4 4"
              />
              {/* Flowing electric blue laser stream */}
              <path
                d={arc.path}
                fill="none"
                stroke="#3D6FF5"
                strokeWidth="3.2"
                filter="url(#arcGlow2k)"
                strokeDasharray="48 180"
                style={{
                  animation: 'dashPureStream2k 2.4s linear infinite',
                }}
              />
            </g>
          ))}
        </g>

        {/*
          4. Synchronized Hub Nodes & Anti-Collision Labels

          SVG has no z-index: it paints in document order. Dubai sits in the
          middle of the list and the hubs after it — Mumbai and Shanghai are
          right on top of it — were painting over the one node that is meant to
          read as the centre of the network. It goes last so it stays on top.
        */}
        {[...GLOBAL_HUBS]
          .sort((a, b) => Number(Boolean(a.isHQ)) - Number(Boolean(b.isHQ)))
          .map((hub) => {
          const isHQ = Boolean(hub.isHQ);

          return (
            <g
              key={hub.key}
              className="city-hub-node"
              transform={`translate(${hub.x}, ${hub.y})`}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              {/* Radar Ping Ripple */}
              <circle
                r="6"
                fill="none"
                stroke={isHQ ? BRAND_GOLD[500] : BRAND_BLUE[500]}
                strokeWidth="1.8"
              >
                <animate attributeName="r" from="6" to={isHQ ? '38' : '26'} dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.85" to="0" dur="2.4s" repeatCount="indefinite" />
              </circle>

              {/* Node Center Dot */}
              <circle
                r={isHQ ? 8.5 : 5.5}
                fill={isHQ ? BRAND_GOLD[500] : BRAND_BLUE[500]}
                stroke="#FFFFFF"
                strokeWidth="2"
                filter={isHQ ? 'url(#hqGlow2k)' : undefined}
              />

              {/* Floating Anti-Collision City Badge */}
              <g transform={`translate(${hub.labelOffset.x}, ${hub.labelOffset.y}) scale(${flat ? 1.12 : 1})`}>
                {isHQ ? (
                  /* Dubai HQ Luxury Obsidian Badge */
                  <g>
                    <rect
                      x="-125"
                      y="-20"
                      width="250"
                      height="40"
                      rx="20"
                      fill="rgba(10, 10, 9, 0.94)"
                      stroke={BRAND_GOLD[500]}
                      strokeWidth="1.5"
                      filter="url(#pillShadow2k)"
                    />
                    <rect
                      x="-115"
                      y="-11"
                      width="38"
                      height="22"
                      rx="5"
                      fill="rgba(197, 165, 114, 0.25)"
                      stroke={BRAND_GOLD[500]}
                      strokeWidth="1"
                    />
                    <text
                      x="-96"
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={BRAND_GOLD[300]}
                      fontSize="13.5"
                      fontWeight="600"
                      style={{ fontFamily: FONT_BODY }}
                    >
                      HQ
                    </text>
                    <text
                      x="-66"
                      y="1"
                      textAnchor="start"
                      dominantBaseline="central"
                      fill={NEUTRAL[50]}
                      fontSize="17.5"
                      fontWeight="600"
                      letterSpacing="1.4"
                      style={{ fontFamily: FONT_BODY }}
                    >
                      DUBAI · <tspan fill={BRAND_GOLD[300]} fontWeight="500">{hub.time}</tspan>
                    </text>
                  </g>
                ) : (
                  /* Multilingual Partner City Obsidian Badge */
                  <g>
                    <rect
                      x="-116"
                      y="-19"
                      width="232"
                      height="38"
                      rx="19"
                      fill="rgba(10, 10, 9, 0.9)"
                      stroke="rgba(61, 111, 245, 0.45)"
                      strokeWidth="1.2"
                      filter="url(#pillShadow2k)"
                    />
                    <rect
                      x="-106"
                      y="-10"
                      width="32"
                      height="20"
                      rx="4"
                      fill="rgba(61, 111, 245, 0.2)"
                      stroke="rgba(61, 111, 245, 0.4)"
                      strokeWidth="0.8"
                    />
                    <text
                      x="-90"
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={BRAND_BLUE[300]}
                      fontSize="13.5"
                      fontWeight="600"
                      style={{ fontFamily: FONT_BODY }}
                    >
                      {hub.lang}
                    </text>
                    <text
                      x="-64"
                      y="1"
                      textAnchor="start"
                      dominantBaseline="central"
                      fill={NEUTRAL[50]}
                      fontSize="17"
                      fontWeight="600"
                      letterSpacing="1.2"
                      style={{ fontFamily: FONT_BODY }}
                    >
                      {hub.name} · <tspan fill={NEUTRAL[400]} fontWeight="500">{hub.time}</tspan>
                    </text>
                  </g>
                )}
              </g>
            </g>
          );
        })}

        {/* 5. Bottom Telemetry Ticker (y = 1090) */}
        <g transform="translate(60, 1090)">
          {/* Code/Small at the canvas's scale, like the other two slides' footers. */}
          <circle cx="0" cy="0" r="5" fill={SUCCESS_400} />
          <text
            x="16"
            y="2"
            dominantBaseline="central"
            fill={light.textSecondary}
            fontSize="20.3"
            style={{ fontFamily: FONT_CODE }}
          >
            BRIEFINGS DELIVERED: PARIS (FR) · LONDON (EN) · RIYADH (AR) · MOSCOW (RU) · MUMBAI (HI) · SHANGHAI (ZH)
          </text>
        </g>

        <g transform="translate(1830, 1090)">
          <text
            x="0"
            y="2"
            textAnchor="end"
            dominantBaseline="central"
            fill={light.textTertiary}
            fontSize="20.3"
            style={{ fontFamily: FONT_CODE }}
          >
            LATENCY: 12ms · 100% CONCURRENCY
          </text>
        </g>

        {/*
          The counter, in the same corner the other two slides put theirs.
          This slide carries its own chrome rather than the deck shell's, so
          without this the map was the one panel in the deck that did not say
          where in it you were. The telemetry beside it gave up its last clause
          to make the room.
        */}
        <g transform="translate(1940, 1090)">
          <text
            x="0"
            y="2"
            textAnchor="end"
            dominantBaseline="central"
            fill={light.textSecondary}
            fontSize="20.3"
            style={{ fontFamily: FONT_CODE }}
          >
            01 / 03
          </text>
        </g>
      </svg>
      </div>

      <div style={{ width: '2000px', height: '1156px', flexShrink: 0 }}>
        <FinaleStatsSlide live={activeSlide === 1} compact={deckCompact} />
      </div>

      <div style={{ width: '2000px', height: '1156px', flexShrink: 0 }}>
        <FinaleQuestionsSlide live={activeSlide === 2} compact={deckCompact} />
      </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes dashPureStream2k {
          from {
            stroke-dashoffset: 220;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
    </>
  );
}
