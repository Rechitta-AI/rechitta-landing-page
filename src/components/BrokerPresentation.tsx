'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { coverRect, toViewport, matrix3dFor } from '@/screens/warp';
import { isPortraitFor, modeFor } from '@/hooks/useDeviceMode';
import type { Quad } from '@/screens/types';
import ClickPrompt from './ClickPrompt';


interface BrokerPresentationProps {
  holdData: React.RefObject<{
    clipIndex: number;
    progress: number;
    startProgress?: number;
    endProgress?: number;
  }>;
}

/** Calibrated Broker Phone Corners (@ 60% stage) */
export const BROKER_PHONE_CORNERS: Quad = [
  [0.43230, 0.12300], // 0: Top-Left
  [0.61751, 0.13814], // 1: Top-Right
  [0.58984, 0.89882], // 2: Bottom-Right
  [0.36724, 0.85839], // 3: Bottom-Left
];

export const BROKER_PHONE_RADIUS = 48;

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

/** The live broker assistant, both in the tracked handset and in a new tab. */
export const BROKER_APP_URL =
  'https://icy-sand-0d102fd00.7.azurestaticapps.net/?sessionId=0b555e4f-a0cf-4459-be58-a6d45a69ac68';

/** Where the last objection's call to action goes. */
export const WAITLIST_URL = 'https://beta.rechitta.com/login';

export interface BrokerProblem {
  id: number;
  tabLabel: string;
  category: string;
  problem: string;
  query: string;
  solution: string;
  /** The last one ends in a sign-up rather than a feature. */
  isWaitlist?: boolean;
}

/*
 * The broker's own objections, in their own words, and what the briefing
 * answers back. One line each: the list is read at a glance and clicked, so
 * anything longer than a line would make the reading the interaction.
 */
export const BROKER_PROBLEMS: BrokerProblem[] = [
  {
    id: 1,
    tabLabel: 'Missed it',
    category: 'AVAILABLE 24/7',
    problem: 'Missed a briefing!',
    query: 'Give me the full briefing for Marina Vista',
    solution:
      'Rechitta gives you a presentation mode - take the whole briefing whenever you want to. It\u2019s available 24/7.',
  },
  {
    id: 2,
    tabLabel: 'Accent',
    category: 'YOUR LANGUAGE',
    problem: 'Didn\u2019t understand the presenter\u2019s accent!',
    query: 'Present this project to me in Mandarin',
    solution:
      'Ask in your language, and the whole presentation is given in your language.',
  },
  {
    id: 3,
    tabLabel: 'Deep dive',
    category: 'GO DEEPER',
    problem: 'I have technical questions about this project!',
    query: 'What is the payment plan and handover date for Tower 2?',
    solution:
      'Dive deep into the details - either interrupt the presentation, or go into chat mode.',
  },
  {
    id: 4,
    tabLabel: 'My client',
    category: 'YOUR OWN RECHITTA',
    problem: 'My client doesn\u2019t understand my language!',
    query: 'Build a briefing I can send straight to my client',
    solution:
      'Want to create a Rechitta of your own? Be the first ones to get your hands on it.',
    isWaitlist: true,
  },
];

export const PROMPT_PILLS = BROKER_PROBLEMS;

export default function BrokerPresentation({ holdData }: BrokerPresentationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const hudContentRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(false);

  // Which objection is open. The scene always opens on the first.
  const [activeProblemId, setActiveProblemId] = useState<number>(1);

  // Perspective Switcher Dock & Scroll Lock State
  const isLockedRef = useRef(true);
  const [showScrollPrompt, setShowScrollPrompt] = useState(false);
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /*
   * The film will not leave this beat on a scroll: the call to action has to
   * be pressed. Rather than let the viewer find that out by trying to scroll
   * and failing, the prompt appears on its own once the scene has settled.
   */
  const [ctaHint, setCtaHint] = useState(false);
  const ctaHintTimerRef = useRef<NodeJS.Timeout | null>(null);
  const iframeSettleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isExitingRef = useRef(false);
  useEffect(() => () => {
    if (ctaHintTimerRef.current) clearTimeout(ctaHintTimerRef.current);
    if (iframeSettleTimerRef.current) clearTimeout(iframeSettleTimerRef.current);
  }, []);

  // Responsive viewport tracking for homography mapping & leader line positioning
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });

  const deviceMode = modeFor(viewport.width);
  const stacked = isPortraitFor(viewport.width, viewport.height);
  const composited = deviceMode === 'desktop' && !stacked;
  // On responsive stacked viewports, defer mounting the iframe until the phone has fully settled
  const [iframeActive, setIframeActive] = useState(!stacked);

  // Responsive phone calibration state (applies ONLY to responsive portrait mode)
  // 1. Desktop Homography
  const desktopRect = coverRect(viewport.width, viewport.height);
  const desktopViewportCorners: Quad = toViewport(BROKER_PHONE_CORNERS, desktopRect);
  const desktopMatrix = matrix3dFor(PHONE_WIDTH, PHONE_HEIGHT, desktopViewportCorners);

  // 2. Responsive Stage & Viewport Projection (Smart Content-Aware Split)
  const responsiveStageHeight = Math.round(
    Math.min(viewport.height * 0.67, viewport.height - 235)
  );
  const responsiveRect = coverRect(viewport.width, responsiveStageHeight);
  const responsiveViewportCorners: Quad = toViewport(BROKER_PHONE_CORNERS, responsiveRect);
  const responsiveMatrix = matrix3dFor(PHONE_WIDTH, PHONE_HEIGHT, responsiveViewportCorners);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewport({ width: w, height: h });
      if (isVisibleRef.current) {
        const filmHost = document.getElementById('film-stage-host');
        if (filmHost) {
          filmHost.style.transition = 'none';
          if (isPortraitFor(w, h)) {
            const stageH = Math.round(Math.min(h * 0.67, h - 235));
            filmHost.style.bottom = 'auto';
            filmHost.style.height = `${stageH}px`;
            filmHost.style.webkitMaskImage =
              'linear-gradient(to bottom, #000 0%, #000 calc(100% - 60px), transparent 100%)';
            filmHost.style.maskImage =
              'linear-gradient(to bottom, #000 0%, #000 calc(100% - 60px), transparent 100%)';
          } else {
            filmHost.style.bottom = '0px';
            filmHost.style.height = '100%';
            filmHost.style.webkitMaskImage = 'none';
            filmHost.style.maskImage = 'none';
          }
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Proportional scale-to-fit on compact, short, or zoomed viewports
  // Prevents HUD panel from overflowing vertically or colliding with bottom dock and phone
  const hudScale = Math.min(
    1,
    Math.max(0.72, Math.min((viewport.height - 120) / 570, (viewport.width - 520) / 540))
  );

  const flatPhoneHeight = Math.min(viewport.height * 0.80, 660);
  const flatPhoneWidth = flatPhoneHeight * (PHONE_WIDTH / PHONE_HEIGHT);

  /*
   * The two columns either side of the handset.
   *
   * The phone is projected onto the footage by homography, so where its edges
   * land moves with the viewport's aspect — measuring off the same covering
   * rect is the only way the columns stay beside it rather than under it. The
   * corners are the calibrated quad above: 0.367 is its leftmost, 0.618 its
   * rightmost.
   *
   * The layout is then made symmetric about the viewport's centre rather than
   * about the phone. Sizing each side to its own free space gave two different
   * widths and two different margins — the answer ended up pinned 165px off
   * the right edge while the objections sat 29px off the left. So the phone is
   * treated as a keep-out box centred on the viewport, wide enough to cover
   * whichever of its edges reaches further out; both columns are then the same
   * width, the same distance from their own edge of the screen, and the same
   * distance from that box.
   */
  const MARGIN = 48;
  const PHONE_GAP = 44;
  const MAX_COL = 400;
  const MIN_COL = 190;
  const phoneLeftEdge = desktopRect.x + 0.36724 * desktopRect.width;
  const phoneRightEdge = desktopRect.x + 0.61751 * desktopRect.width;
  const centreX = viewport.width / 2;
  const keepOut = Math.max(centreX - phoneLeftEdge, phoneRightEdge - centreX);
  // The free run on one side, from the margin in to where the phone begins.
  const band = Math.max(0, centreX - keepOut - PHONE_GAP - MARGIN);
  const colWidth = Math.max(MIN_COL, Math.min(MAX_COL, band));
  // Centred in that run, so the columns are neither jammed against the screen
  // edge nor crowding the handset.
  const colInset = MARGIN + Math.max(0, (band - colWidth) / 2);

  /*
   * The copy panel goes wherever the phone is not: opposite it in the shot on
   * desktop, docked in the bottom 40% on mobile portrait, and side-by-side on tablet landscape.
   * On mobile portrait, bottom clearance ensures all content floats safely above the ScrollRail progress bar.
   */
  // Exact physical bottom edge of the handset in mobile portrait
  const phoneBottomY = Math.round(responsiveStageHeight * 0.89882 + 10);

  const hudStyle: React.CSSProperties = composited
    ? {
        right: `${colInset}px`,
        top: '50%',
        width: `${colWidth}px`,
        transform: `translateY(-50%) scale(${hudScale})`,
        transformOrigin: 'right center',
      }
    : stacked
      ? {
          left: '50%',
          top: `${phoneBottomY + 8}px`,
          bottom: 'calc(max(1rem, env(safe-area-inset-bottom)) + 3.85rem)',
          width: 'min(94vw, 420px)',
          transform: 'translateX(-50%)',
          transformOrigin: 'top center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.45rem',
          paddingTop: '0px',
          paddingBottom: '0px',
          overflow: 'hidden',
        }
      : {
          left: `calc(6% + ${flatPhoneWidth}px + 5%)`,
          right: '5%',
          top: '50%',
          transform: `translateY(-50%) scale(${hudScale})`,
          transformOrigin: 'left center',
        };

  const activeProblem =
    BROKER_PROBLEMS.find((p) => p.id === activeProblemId) || BROKER_PROBLEMS[0];

  const handleProblemSelect = (prob: BrokerProblem) => {
    setActiveProblemId(prob.id);
  };

  const navigateProblem = (direction: -1 | 1) => {
    const currentIndex = BROKER_PROBLEMS.findIndex((p) => p.id === activeProblemId);
    const nextIndex = Math.max(0, Math.min(BROKER_PROBLEMS.length - 1, currentIndex + direction));
    setActiveProblemId(BROKER_PROBLEMS[nextIndex].id);
  };

  const cardTouchStart = useRef<{ x: number; y: number } | null>(null);

  const handleCardTouchStart = (e: React.TouchEvent) => {
    cardTouchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleCardTouchEnd = (e: React.TouchEvent) => {
    if (!cardTouchStart.current) return;
    const dx = e.changedTouches[0].clientX - cardTouchStart.current.x;
    const dy = e.changedTouches[0].clientY - cardTouchStart.current.y;
    cardTouchStart.current = null;

    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) {
        navigateProblem(1);
      } else {
        navigateProblem(-1);
      }
    }
  };

  /*
   * Scroll walks the list.
   *
   * The film hands each beat its own sub-steps, and the broker now declares
   * four of them — one per objection. A scroll inside this beat turns to the
   * next one instead of moving the film; only once the list is exhausted does
   * the beat's gate start asking for the call to action.
   */
  useEffect(() => {
    const onStep = (e: Event) => {
      const detail = (e as CustomEvent<{ beat?: string; step?: number }>).detail;
      if (detail?.beat !== 'broker' || typeof detail.step !== 'number') return;
      if (!isVisibleRef.current) return;
      const step = Math.max(0, Math.min(BROKER_PROBLEMS.length - 1, detail.step));
      setActiveProblemId(BROKER_PROBLEMS[step].id);
    };
    window.addEventListener('rechitta:beat-step', onStep);
    return () => window.removeEventListener('rechitta:beat-step', onStep);
  }, []);

  /*
   * Clicking one directly tells the film where the list got to, or its own
   * counter drifts and the next scroll jumps back to where it thought it was.
   */
  useEffect(() => {
    const step = BROKER_PROBLEMS.findIndex((p) => p.id === activeProblemId);
    if (step < 0) return;
    window.dispatchEvent(
      new CustomEvent('rechitta:beat-sync', { detail: { beat: 'broker', step } }),
    );
  }, [activeProblemId]);

  // Trigger brief highlight on the CTA dock when user attempts to scroll past
  const triggerScrollPrompt = () => {
    setShowScrollPrompt(true);
    if (promptTimeoutRef.current) clearTimeout(promptTimeoutRef.current);
    promptTimeoutRef.current = setTimeout(() => {
      setShowScrollPrompt(false);
    }, 2400);
  };

  /**
   * The film refuses to advance past this beat until the call to action is
   * pressed, and says so here. It used to be enforced by clamping the window's
   * scroll position from a capture-phase listener, which fought the smooth
   * scroller for the same pixels every frame. Now the film simply does not
   * move, and this only has to show the prompt.
   */
  useEffect(() => {
    const onNudge = (e: Event) => {
      const detail = (e as CustomEvent<{ beat?: string }>).detail;
      if (detail?.beat && detail.beat !== 'broker') return;
      if (!isVisibleRef.current) return;
      triggerScrollPrompt();
    };
    window.addEventListener('rechitta:nudge', onNudge);
    return () => window.removeEventListener('rechitta:nudge', onNudge);
  }, []);

  const proceedDesktopFlight = () => {
    // Reset film stage host height and transform back to 100%
    const filmHost = document.getElementById('film-stage-host');
    if (filmHost) {
      filmHost.style.height = '100%';
      filmHost.style.bottom = '0px';
      filmHost.style.transform = 'none';
      filmHost.style.webkitMaskImage = 'none';
      filmHost.style.maskImage = 'none';
    }

    if (containerRef.current) {
      containerRef.current.style.pointerEvents = 'none';
      gsap.to(containerRef.current, {
        opacity: 0,
        scale: 0.96,
        duration: 0.4,
        ease: 'power2.inOut',
        onComplete: () => {
          if (containerRef.current) gsap.set(containerRef.current, { autoAlpha: 0 });
          isExitingRef.current = false;
        },
      });
    }

    window.dispatchEvent(new CustomEvent('rechitta:fly-to-buyer'));
  };

  /*
   * Hands the film on out of the broker's hands.
   *
   * On responsive screens: First immediately fades out the phone/iframe (200ms),
   * and only after it has completely faded out, continues with the camera flight and movement!
   */
  const handleFlyOn = () => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    isLockedRef.current = false;

    if (iframeSettleTimerRef.current) clearTimeout(iframeSettleTimerRef.current);

    if (stacked) {
      // Step 1: Immediately fade out the iframe & phone screen
      if (phoneRef.current) {
        gsap.to(phoneRef.current, {
          opacity: 0,
          scale: 0.96,
          duration: 0.2,
          ease: 'power2.out',
          onComplete: () => {
            // Step 2: Only after the iframe has completely faded out, continue with movement!
            setIframeActive(false);

            // Reset film stage host height back to 100%
            const filmHost = document.getElementById('film-stage-host');
            if (filmHost) {
              filmHost.style.transition = 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
              filmHost.style.height = '100%';
              filmHost.style.bottom = '0px';
              filmHost.style.transform = 'none';
              filmHost.style.webkitMaskImage = 'none';
              filmHost.style.maskImage = 'none';
            }

            // Dissolve the rest of the Broker HUD UI
            if (containerRef.current) {
              containerRef.current.style.pointerEvents = 'none';
              gsap.to(containerRef.current, {
                opacity: 0,
                duration: 0.35,
                ease: 'power2.inOut',
                onComplete: () => {
                  if (containerRef.current) gsap.set(containerRef.current, { autoAlpha: 0 });
                  isExitingRef.current = false;
                },
              });
            }

            // Hand control back to the film, which begins the camera flight to the buyer
            window.dispatchEvent(new CustomEvent('rechitta:fly-to-buyer'));
          },
        });
      } else {
        proceedDesktopFlight();
      }
    } else {
      proceedDesktopFlight();
    }
  };

  useEffect(() => {
    return () => {
      const filmHost = document.getElementById('film-stage-host');
      if (filmHost) {
        filmHost.style.height = '100%';
        filmHost.style.bottom = '0px';
        filmHost.style.transform = 'none';
        filmHost.style.webkitMaskImage = 'none';
        filmHost.style.maskImage = 'none';
      }
    };
  }, []);

  // Entrance and Exit watcher synced to the broker's phone hold (clipIndex === 1)
  useEffect(() => {
    let frame: number;

    const render = () => {
      if (!holdData.current || !containerRef.current) {
        frame = requestAnimationFrame(render);
        return;
      }

      const { clipIndex } = holdData.current;
      const isNowVisible = clipIndex === 1;

      // Detect Entrance (when camera lands on the broker's phone)
      if (isNowVisible && !isVisibleRef.current) {
        isVisibleRef.current = true;
        isLockedRef.current = true;
        isExitingRef.current = false;

        // Smoothly adjust sequence's video stage into top 60% on mobile portrait
        if (stacked) {
          // Defer mounting the iframe until the phone in the footage has fully settled
          setIframeActive(false);
          if (phoneRef.current) gsap.set(phoneRef.current, { opacity: 0 });

          const filmHost = document.getElementById('film-stage-host');
          if (filmHost) {
            filmHost.style.transition = 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
            filmHost.style.bottom = 'auto';
            filmHost.style.height = `${responsiveStageHeight}px`;
            filmHost.style.transform = 'none';
            filmHost.style.webkitMaskImage =
              'linear-gradient(to bottom, #000 0%, #000 calc(100% - 60px), transparent 100%)';
            filmHost.style.maskImage =
              'linear-gradient(to bottom, #000 0%, #000 calc(100% - 60px), transparent 100%)';
          }

          // Once the phone in the footage has completely settled at its final position (~650ms):
          if (iframeSettleTimerRef.current) clearTimeout(iframeSettleTimerRef.current);
          iframeSettleTimerRef.current = setTimeout(() => {
            setIframeActive(true);
            if (phoneRef.current) {
              gsap.fromTo(
                phoneRef.current,
                { opacity: 0, scale: 0.98 },
                { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
              );
            }
          }, 650);
        } else {
          setIframeActive(true);
        }

        /*
          The scene always opens on the first objection, however the viewer
          left it last time.

          The sync goes out unconditionally rather than riding on the state
          change: arriving backwards lands the film's own step counter on the
          last objection, and if the list happened to already be on the first
          one there would be no state change to carry the correction.
        */
        setActiveProblemId(BROKER_PROBLEMS[0].id);
        window.dispatchEvent(
          new CustomEvent('rechitta:beat-sync', { detail: { beat: 'broker', step: 0 } }),
        );

        // After the HUD has finished cascading in, not on top of it.
        if (ctaHintTimerRef.current) clearTimeout(ctaHintTimerRef.current);
        ctaHintTimerRef.current = setTimeout(() => setCtaHint(true), 2200);

        gsap.killTweensOf(containerRef.current);
        if (phoneRef.current && !stacked) gsap.killTweensOf(phoneRef.current);
        if (hudContentRef.current) gsap.killTweensOf(hudContentRef.current);

        // Make container visible
        gsap.set(containerRef.current, { autoAlpha: 1 });
        if (containerRef.current) {
          containerRef.current.style.pointerEvents = 'auto';
        }

        // Master entrance choreography timeline
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // Step 1: On desktop, phone screen smooth fade-in and resolve
        if (phoneRef.current && !stacked) {
          tl.fromTo(
            phoneRef.current,
            { opacity: 0, filter: 'blur(8px)' },
            { opacity: 1, filter: 'blur(0px)', duration: 0.65 },
            0.1
          );
        }

        /*
          Step 2: the overlay cascades in.

          Scoped to the whole overlay rather than to the right-hand panel: the
          objections now live in their own column on the left of the handset,
          and querying only the answer panel left them to appear with no
          entrance at all.
        */
        if (containerRef.current) {
          const scope = containerRef.current;
          /*
            The objections come in from the left edge and the answer from the
            right, each toward the handset between them. They used to share one
            tween that pushed everything in from the right, which read as the
            left column being blown across the phone.
          */
          const objections = scope.querySelectorAll('.objection-reveal');
          tl.fromTo(
            objections,
            { opacity: 0, x: -28, scale: 0.96 },
            {
              opacity: 1,
              x: 0,
              scale: 1,
              stagger: 0.07,
              duration: 0.55,
              ease: 'back.out(1.4)',
            },
            0.35
          );

          const pills = scope.querySelectorAll('.prompt-pill-reveal');
          tl.fromTo(
            pills,
            { opacity: 0, x: 30, scale: 0.94 },
            {
              opacity: 1,
              x: 0,
              scale: 1,
              stagger: 0.08,
              duration: 0.6,
              ease: 'back.out(1.5)',
            },
            0.5
          );

          // Bottom Action controls
          const actions = scope.querySelectorAll('.hud-action-reveal');
          tl.fromTo(
            actions,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, stagger: 0.06, duration: 0.5 },
            0.72
          );
        }
      }
      // Detect Exit (when scrolling away into next chapter)
      else if (!isNowVisible && isVisibleRef.current) {
        isVisibleRef.current = false;
        isLockedRef.current = false;
        isExitingRef.current = false;
        if (iframeSettleTimerRef.current) clearTimeout(iframeSettleTimerRef.current);
        if (stacked) setIframeActive(false);

        const filmHost = document.getElementById('film-stage-host');
        if (filmHost) {
          filmHost.style.transition = 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
          filmHost.style.height = '100%';
          filmHost.style.bottom = '0px';
          filmHost.style.transform = 'none';
          filmHost.style.webkitMaskImage = 'none';
          filmHost.style.maskImage = 'none';
        }

        if (ctaHintTimerRef.current) clearTimeout(ctaHintTimerRef.current);
        setCtaHint(false);

        gsap.killTweensOf(containerRef.current);
        if (phoneRef.current) gsap.killTweensOf(phoneRef.current);
        if (hudContentRef.current) gsap.killTweensOf(hudContentRef.current);

        // Smooth Exit Fade Out
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.35,
          ease: 'power2.inOut',
          onComplete: () => {
            if (containerRef.current) {
              gsap.set(containerRef.current, { autoAlpha: 0 });
              containerRef.current.style.pointerEvents = 'none';
            }
          },
        });
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [holdData, stacked]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-30 pointer-events-none opacity-0 invisible overflow-hidden"
      style={{ fontFamily: 'var(--font-inter)' }}
    >
      {/*
        Off the footage, the phone in the shot is still there behind the
        layout — only for tablet landscape two-column layout do we blur behind it.
        On desktop AND mobile portrait, the footage is active and the live assistant
        is composited directly onto the physical phone in the sequence!
      */}
      {!composited && !stacked && (
        <div
          className="absolute inset-0 -z-10 pointer-events-none bg-[#070A10]/78 backdrop-blur-[14px]"
          aria-hidden="true"
        />
      )}

      {/* ===================================================================
          1. THE CALIBRATED PHONE SCREEN
          Desktop: precision 3D homography matrix3d.
          Mobile Portrait: affine 2D transform (center, scale, rotation)
          guaranteeing 100% click/touch interactivity into the cross-origin assistant.
         =================================================================== */}
      <div
        ref={phoneRef}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="absolute pointer-events-none overflow-visible"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: stacked ? `${responsiveStageHeight}px` : '100%',
          zIndex: 50,
          pointerEvents: 'none',
          touchAction: 'manipulation',
        }}
      >
        <div
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          style={
            composited
              ? {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: PHONE_WIDTH,
                  height: PHONE_HEIGHT,
                  transformOrigin: '0 0',
                  transform: desktopMatrix,
                  borderRadius: `${BROKER_PHONE_RADIUS}px`,
                  overflow: 'hidden',
                  boxShadow:
                    '0 30px 70px -10px rgba(0, 0, 0, 0.95), 0 0 35px rgba(6, 182, 212, 0.12), inset 0 0 0 1.5px rgba(255, 255, 255, 0.18)',
                  pointerEvents: 'auto',
                  touchAction: 'auto',
                  cursor: 'pointer',
                  WebkitOverflowScrolling: 'touch',
                }
              : stacked
                ? {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: PHONE_WIDTH,
                    height: PHONE_HEIGHT,
                    transformOrigin: '0 0',
                    transform: responsiveMatrix,
                    borderRadius: `${BROKER_PHONE_RADIUS}px`,
                    overflow: 'hidden',
                    boxShadow:
                      '0 30px 70px -10px rgba(0, 0, 0, 0.95), 0 0 35px rgba(6, 182, 212, 0.12), inset 0 0 0 1.5px rgba(255, 255, 255, 0.18)',
                    pointerEvents: 'auto',
                    touchAction: 'manipulation',
                    cursor: 'pointer',
                    WebkitOverflowScrolling: 'touch',
                  }
                : {
                    position: 'absolute',
                    width: `${flatPhoneWidth}px`,
                    height: `${flatPhoneHeight}px`,
                    left: '6%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: `${Math.round(flatPhoneHeight * 0.055)}px`,
                    overflow: 'hidden',
                    boxShadow:
                      '0 30px 70px -10px rgba(0, 0, 0, 0.95), 0 0 35px rgba(6, 182, 212, 0.12), inset 0 0 0 1.5px rgba(255, 255, 255, 0.18)',
                    pointerEvents: 'auto',
                    touchAction: 'manipulation',
                    cursor: 'pointer',
                    WebkitOverflowScrolling: 'touch',
                  }
          }
        >
          {iframeActive && (
            <iframe
              src={BROKER_APP_URL}
              className="w-full h-full border-none relative z-10 pointer-events-auto cursor-pointer"
              style={{
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                width: '100%',
                height: '100%',
              }}
              title="Rechitta Live Broker Assistant"
              allow="autoplay; fullscreen; microphone"
            />
          )}
        </div>
      </div>

      {/*
        Mobile Portrait: Seamless cinematic gradient scrim feathering the footage
        into deep obsidian base with zero harsh cuts, paired with soft ambient brand light.
      */}
      {stacked && (
        <>
          <div
            className="fixed left-0 right-0 bottom-0 pointer-events-none z-20"
            style={{
              top: `${phoneBottomY - 60}px`,
              background:
                'linear-gradient(to bottom, rgba(7, 10, 16, 0) 0px, rgba(7, 10, 16, 0.25) 15px, rgba(7, 10, 16, 0.6) 30px, rgba(7, 10, 16, 0.9) 45px, #070A10 60px, #070A10 100%)',
            }}
            aria-hidden="true"
          />

          {/* Soft ambient brand glow bridging the physical phone chin and the segmented dashes */}
          <div
            className="fixed left-1/2 -translate-x-1/2 pointer-events-none z-20 w-[300px] h-[70px] rounded-full blur-2xl opacity-20"
            style={{
              top: `${phoneBottomY - 25}px`,
              background:
                'radial-gradient(ellipse at center, rgba(86, 141, 255, 0.7) 0%, rgba(86, 141, 255, 0.25) 50%, transparent 80%)',
            }}
            aria-hidden="true"
          />
        </>
      )}

      {/* ===================================================================
          THE OBJECTIONS — the column on the left of the handset.

          Measured off the same covering rect the phone is projected onto, so
          the list sits beside the hand holding it at every aspect rather than
          at a fixed percentage that drifts under it.

          Composited only: on tablet landscape the handset is laid out flat at
          6% of the viewport rather than tracked into the shot, and a column
          measured off the footage would land on top of it. That mode carries
          the list inside the panel instead.
         =================================================================== */}
      {composited && (
        <div
          className="absolute z-[55] pointer-events-auto select-none flex flex-col gap-2"
          style={{
            left: `${colInset}px`,
            top: '50%',
            width: `${colWidth}px`,
            transform: `translateY(-50%) scale(${hudScale})`,
            transformOrigin: 'left center',
          }}
        >
          {BROKER_PROBLEMS.map((prob) => {
            const isSelected = activeProblemId === prob.id;
            return (
              <button
                key={prob.id}
                onClick={() => handleProblemSelect(prob)}
                className={`objection-reveal group relative overflow-hidden rounded-xl border px-3.5 py-3 text-left text-[13px] font-semibold leading-snug tracking-tight transition-all duration-300 cursor-pointer backdrop-blur-xl ${
                  isSelected
                    ? 'bg-white text-neutral-950 border-white shadow-[0_12px_34px_rgba(0,0,0,0.55)]'
                    : 'bg-neutral-900/55 text-neutral-300 border-white/10 hover:bg-neutral-900/85 hover:text-white hover:border-white/25'
                }`}
                style={{ fontFamily: 'var(--font-inter)' }}
                aria-pressed={isSelected}
              >
                {/* The lit edge, so which one is open reads from the shape of
                    the column and not only from its fill. */}
                <span
                  className={`absolute inset-y-0 left-0 w-[3px] transition-colors duration-300 ${
                    isSelected ? 'bg-[#568DFF]' : 'bg-transparent'
                  }`}
                  aria-hidden="true"
                />
                <span className="block pl-1.5">{prob.problem}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ===================================================================
          THE ANSWER COLUMN — on the right of the handset, opposite the
          objections. On anything narrower than a composited desktop it
          carries the list too.
         =================================================================== */}
      <div
        ref={hudContentRef}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="absolute z-[55] pointer-events-auto select-none"
        style={hudStyle}
      >
        {/* Soft Organic Atmospheric Wash (Executive Obsidian + Subtle Cyan Accent) - Desktop Only */}
        {!stacked && (
          <>
            <div
              className="pointer-events-none absolute -inset-12 rounded-full blur-3xl opacity-80 -z-10"
              style={{
                background:
                  'radial-gradient(ellipse at 70% 50%, rgba(11, 15, 25, 0.95) 0%, rgba(11, 15, 25, 0.6) 60%, transparent 100%)',
              }}
            />
            <div
              className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 rounded-full blur-3xl opacity-20 -z-10"
              style={{
                background:
                  'radial-gradient(circle, rgba(86, 141, 255, 0.5) 0%, rgba(40, 90, 220, 0.25) 40%, transparent 70%)',
              }}
            />
          </>
        )}

        {/* ===================================================================
            THE ANSWER — whichever objection is lit, explained.

            Everything that used to stand here (the telemetry strip, the
            "Thirty projects" headline, the sub-line, the platform link) is
            gone: the scene is now the broker's four objections and what the
            briefing says back to each one, and nothing else.
           =================================================================== */}

        {/* On tablet landscape, show the buttons list */}
        {!composited && !stacked && (
          <div className="prompt-pill-reveal flex flex-col gap-[3px] mb-2.5">
            {BROKER_PROBLEMS.map((prob) => {
              const isSelected = activeProblemId === prob.id;
              return (
                <button
                  key={prob.id}
                  onClick={() => handleProblemSelect(prob)}
                  className={`w-full rounded-lg border text-left font-semibold leading-tight tracking-tight transition-all duration-200 cursor-pointer px-3 py-2 text-[12.5px] ${
                    isSelected
                      ? 'bg-white text-neutral-950 border-white shadow-sm'
                      : 'bg-white/[0.05] text-neutral-300 border-white/10 hover:text-white hover:bg-white/[0.1]'
                  }`}
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {prob.problem}
                </button>
              );
            })}
          </div>
        )}

        {/* On mobile portrait, show the sleek Segmented Story Dashes */}
        {stacked && (
          <div className="prompt-pill-reveal flex items-center gap-1.5 w-full px-1 mb-2">
            {BROKER_PROBLEMS.map((prob, idx) => {
              const isSelected = activeProblemId === prob.id;
              const isWaitlistTab = Boolean(prob.isWaitlist);
              return (
                <button
                  key={prob.id}
                  onClick={() => handleProblemSelect(prob)}
                  className="h-1 rounded-full flex-1 transition-all duration-300 cursor-pointer relative group"
                  style={{
                    backgroundColor: isSelected
                      ? isWaitlistTab
                        ? '#FFFFFF'
                        : '#8FB4FF'
                      : isWaitlistTab
                        ? 'rgba(255, 255, 255, 0.45)'
                        : 'rgba(255, 255, 255, 0.22)',
                    boxShadow: isSelected
                      ? isWaitlistTab
                        ? '0 0 10px rgba(255, 255, 255, 0.85), 0 0 18px rgba(86, 141, 255, 0.5)'
                        : '0 0 8px rgba(143, 180, 255, 0.6)'
                      : isWaitlistTab
                        ? '0 0 6px rgba(255, 255, 255, 0.35)'
                        : 'none',
                  }}
                  aria-label={isWaitlistTab ? 'Go to waitlist objection' : `Go to objection ${idx + 1}`}
                  title={isWaitlistTab ? 'Waitlist' : `Objection ${idx + 1}`}
                />
              );
            })}
          </div>
        )}

        <div
          onTouchStart={stacked ? handleCardTouchStart : undefined}
          onTouchEnd={stacked ? handleCardTouchEnd : undefined}
          className={`prompt-pill-reveal flex flex-col rounded-2xl border border-white/15 bg-neutral-900/80 backdrop-blur-xl shadow-[0_14px_40px_rgba(0,0,0,0.5)] ${
            stacked ? 'p-4 flex-1 justify-between' : 'p-5'
          }`}
        >
          {/* Card Header: Category + Persistent Waitlist Pill + < 01 / 04 > Indicator */}
          <div className="flex items-center justify-between gap-1.5">
            <span
              className={`self-start rounded-full border border-[#568DFF]/30 bg-[#568DFF]/15 px-2.5 py-0.5 font-mono uppercase tracking-wider text-[#8FB4FF] ${
                stacked ? 'text-[8.5px]' : 'text-[8.5px]'
              }`}
            >
              {activeProblem.category}
            </span>

            {stacked && (
              <div className="flex items-center gap-1.5">
                {/* Jump to Waitlist Pill (Slides 1-3) */}
                {!activeProblem.isWaitlist && (
                  <button
                    type="button"
                    onClick={() => handleProblemSelect(BROKER_PROBLEMS[3])}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white text-[9.5px] font-semibold tracking-tight transition-all cursor-pointer group shadow-sm select-none"
                    title="Jump to Waitlist"
                    aria-label="Jump to Waitlist"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#568DFF] animate-pulse" />
                    <span>Waitlist</span>
                    <span className="text-[#8FB4FF] font-bold group-hover:translate-x-0.5 transition-transform text-[8.5px]">
                      &rarr;
                    </span>
                  </button>
                )}

                {/* Stepper Navigation */}
                <div className="flex items-center gap-1 text-[10.5px] font-mono text-white/50 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 select-none">
                  <button
                    type="button"
                    onClick={() => navigateProblem(-1)}
                    disabled={activeProblem.id === 1}
                    className="px-1 text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-default active:scale-90 transition-all cursor-pointer"
                    aria-label="Previous objection"
                  >
                    &lt;
                  </button>
                  <span className="font-semibold text-white/90 px-0.5 tracking-wider">
                    0{activeProblem.id} / 0{BROKER_PROBLEMS.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigateProblem(1)}
                    disabled={activeProblem.id === BROKER_PROBLEMS.length}
                    className="px-1 text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-default active:scale-90 transition-all cursor-pointer"
                    aria-label="Next objection"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Animated Card Content */}
          <div
            key={activeProblem.id}
            className={`${stacked ? 'animate-story-slide flex-1 flex flex-col justify-between' : 'animate-fade-in flex flex-col'}`}
          >
            <div className={`${stacked ? 'my-auto py-1 flex flex-col gap-1.5' : ''}`}>
              {stacked && (
                <h4 className="text-white text-[16px] sm:text-[17px] font-bold tracking-tight leading-snug">
                  &ldquo;{activeProblem.problem}&rdquo;
                </h4>
              )}

              <p
                className={`font-medium ${
                  stacked
                    ? 'text-[13px] sm:text-[13.5px] leading-[1.62] text-neutral-200'
                    : 'mt-3.5 text-[15px] leading-[1.55] text-neutral-100'
                }`}
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {activeProblem.solution}
              </p>
            </div>

            {activeProblem.isWaitlist ? (
              <a
                href={WAITLIST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full rounded-xl bg-white text-center font-bold tracking-tight text-neutral-950 transition-all duration-200 hover:bg-neutral-200 active:scale-[0.98] cursor-pointer ${
                  stacked ? 'mt-auto py-2.5 px-4 text-[12px]' : 'mt-4 px-4 py-2.5 text-[13px]'
                }`}
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Join the waitlist →
              </a>
            ) : (
              <a
                href={BROKER_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between gap-2 text-left font-mono text-neutral-300 transition-colors cursor-pointer group ${
                  stacked
                    ? 'mt-auto py-2.5 px-3 text-[10px] border border-white/12 rounded-xl bg-white/[0.06] hover:bg-white/10'
                    : 'mt-4 pt-3 text-[10px] border-t border-white/10'
                }`}
              >
                <span className="truncate text-white/85 group-hover:text-white">
                  &ldquo;{activeProblem.query}&rdquo;
                </span>
                <span className="shrink-0 text-[#568DFF] font-sans font-bold">
                  Try it ↗
                </span>
              </a>
            )}
          </div>
        </div>

        {/* The one control the film waits on. Present on every objection. */}
        <div className={`hud-action-reveal relative flex shrink-0 ${stacked ? 'mt-auto' : 'mt-4'}`}>
          {/*
            Auto-placed: on desktop, show the floating prompt tooltip.
            On mobile, we integrate the hint directly into the button to prevent rail overlap.
          */}
          {!stacked && (
            <ClickPrompt
              label={showScrollPrompt ? 'Click here to continue' : 'Click to continue'}
              visible={ctaHint || showScrollPrompt}
              placement="top"
              autoPlace
              urgent={showScrollPrompt}
            />
          )}
          <button
            onClick={handleFlyOn}
            className={`w-full rounded-xl text-white font-bold tracking-tight transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer group border ${
              stacked ? 'py-2.5 px-3.5 text-[12.5px]' : 'py-3.5 px-5 text-sm'
            } ${
              showScrollPrompt
                ? 'bg-[#568DFF] border-[#8FB4FF] shadow-[0_0_32px_rgba(86,141,255,0.7)] scale-[1.02]'
                : stacked && ctaHint
                  ? 'bg-[#568DFF] border-[#8FB4FF]/80 shadow-[0_0_24px_rgba(86,141,255,0.55)] scale-[1.01]'
                  : 'bg-[#568DFF]/90 hover:bg-[#568DFF] border-[#568DFF]/60 hover:border-[#8FB4FF] shadow-[0_0_20px_rgba(86,141,255,0.4)] hover:shadow-[0_0_28px_rgba(86,141,255,0.6)]'
            }`}
            style={{ fontFamily: 'var(--font-inter)' }}
            aria-label="Take the briefing global"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff] animate-pulse" />
            <span className="whitespace-nowrap">
              {stacked && showScrollPrompt
                ? 'Tap here to continue'
                : stacked && ctaHint
                  ? 'Tap to continue'
                  : 'Take it global'}
            </span>
            <span className="text-white/90 font-bold transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </button>
        </div>
      </div>

    </div>
  );
}
