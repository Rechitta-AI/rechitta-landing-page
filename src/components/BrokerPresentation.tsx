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

export interface BrokerProblem {
  id: number;
  tabLabel: string;
  category: string;
  problem: string;
  query: string;
  solution: string;
}

export const BROKER_PROBLEMS: BrokerProblem[] = [
  {
    id: 1,
    tabLabel: '40k at Launch',
    category: 'NETWORK SCALE',
    problem: '40,000 brokers simultaneously demanding inventory specs at launch',
    query: 'Show available 2-beds under AED 2M in Marina Vista',
    solution: 'Autonomous multi-agent briefing across 12 languages with zero queue time and instant live inventory.',
  },
  {
    id: 2,
    tabLabel: 'Live DLD Sync',
    category: 'LIVE INVENTORY',
    problem: 'Brokers pitching sold-out units with obsolete static PDF brochures',
    query: "What's the real-time payment plan and availability for Tower 2?",
    solution: 'Direct DLD & ERP sync: real-time unit availability, dynamic pricing, and escrow-verified payment schedules.',
  },
  {
    id: 3,
    tabLabel: 'Cross-Border SPVs',
    category: 'LEGAL & COMPLIANCE',
    problem: 'Offshore buyers delayed weeks waiting for legal and AML clearance',
    query: 'Can foreign offshore SPVs purchase Penthouse 4B directly?',
    solution: 'Instant DLD compliance check, automated KYC/AML verification, and digital contract generation in 60 seconds.',
  },
];

export const PROMPT_PILLS = BROKER_PROBLEMS;

export default function BrokerPresentation({ holdData }: BrokerPresentationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const hudContentRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(false);

  // Active problem statement and copied query state
  const [activeProblemId, setActiveProblemId] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<number | null>(null);

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
  useEffect(() => () => {
    if (ctaHintTimerRef.current) clearTimeout(ctaHintTimerRef.current);
  }, []);

  // Responsive viewport tracking for homography mapping & leader line positioning
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });

  const deviceMode = modeFor(viewport.width);
  const stacked = isPortraitFor(viewport.width, viewport.height);
  const composited = deviceMode === 'desktop' && !stacked;

  // Responsive phone calibration state (applies ONLY to responsive portrait mode)
  // 1. Desktop Homography
  const desktopRect = coverRect(viewport.width, viewport.height);
  const desktopViewportCorners: Quad = toViewport(BROKER_PHONE_CORNERS, desktopRect);
  const desktopMatrix = matrix3dFor(PHONE_WIDTH, PHONE_HEIGHT, desktopViewportCorners);

  // 2. Responsive Stage & Viewport Projection (Top 60% Stage)
  const responsiveStageHeight = viewport.height * 0.6;
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
            filmHost.style.bottom = 'auto';
            filmHost.style.height = '60%';
          } else {
            filmHost.style.bottom = '0px';
            filmHost.style.height = '100%';
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
    Math.max(0.72, Math.min((viewport.height - 120) / 570, (viewport.width - 520) / 470))
  );

  const flatPhoneHeight = Math.min(viewport.height * 0.80, 660);
  const flatPhoneWidth = flatPhoneHeight * (PHONE_WIDTH / PHONE_HEIGHT);

  /*
   * The copy panel goes wherever the phone is not: opposite it in the shot on
   * desktop, docked in the bottom 40% on mobile portrait, and side-by-side on tablet landscape.
   * On mobile portrait, bottom clearance ensures all content floats safely above the ScrollRail progress bar.
   */
  const hudStyle: React.CSSProperties = composited
    ? {
        right: '4rem',
        top: '50%',
        width: 'min(400px, 38vw)',
        transform: `translateY(-50%) scale(${hudScale})`,
        transformOrigin: 'right center',
      }
    : stacked
      ? {
          left: '50%',
          top: '60%',
          bottom: 0,
          width: 'min(94vw, 420px)',
          transform: 'translateX(-50%)',
          transformOrigin: 'top center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          gap: '0.2rem',
          paddingTop: '0px',
          paddingBottom: 'calc(max(0.75rem, env(safe-area-inset-bottom)) + 3.75rem)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
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

  const handleProblemCopy = (prob: BrokerProblem) => {
    setActiveProblemId(prob.id);
    setCopiedId(prob.id);
    try {
      navigator.clipboard?.writeText(prob.query).catch(() => {});
    } catch {
      // ignore
    }
    setTimeout(() => setCopiedId(null), 2500);
  };

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

  /*
   * Hands the film on out of the broker's hands.
   *
   * The next stop used to be the buyer's phone, which is where the event name
   * comes from — it is one of the film's release events, so it is left alone
   * while the beat behind it is retired. What actually plays now is the flight
   * into the clouds and the multilingual chapter.
   */
  const handleFlyOn = () => {
    isLockedRef.current = false;

    // Reset film stage host height and transform back to 100%
    const filmHost = document.getElementById('film-stage-host');
    if (filmHost) {
      filmHost.style.transition = 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      filmHost.style.height = '100%';
      filmHost.style.bottom = '0px';
      filmHost.style.transform = 'none';
    }

    // 1. Smoothly dissolve the Broker Scene UI
    if (containerRef.current) {
      containerRef.current.style.pointerEvents = 'none';
      gsap.to(containerRef.current, {
        opacity: 0,
        scale: 0.96,
        duration: 0.4,
        ease: 'power2.inOut',
        onComplete: () => {
          if (containerRef.current) gsap.set(containerRef.current, { autoAlpha: 0 });
        },
      });
    }

    // 2. Hand control back to the film, which flies to the buyer.
    window.dispatchEvent(new CustomEvent('rechitta:fly-to-buyer'));
  };

  useEffect(() => {
    return () => {
      const filmHost = document.getElementById('film-stage-host');
      if (filmHost) {
        filmHost.style.height = '100%';
        filmHost.style.bottom = '0px';
        filmHost.style.transform = 'none';
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

        // Smoothly adjust sequence's video stage into top 60% on mobile portrait
        if (stacked) {
          const filmHost = document.getElementById('film-stage-host');
          if (filmHost) {
            filmHost.style.transition = 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
            filmHost.style.bottom = 'auto';
            filmHost.style.height = '60%';
            filmHost.style.transform = 'none';
          }
        }

        // After the HUD has finished cascading in, not on top of it.
        if (ctaHintTimerRef.current) clearTimeout(ctaHintTimerRef.current);
        ctaHintTimerRef.current = setTimeout(() => setCtaHint(true), 2200);

        gsap.killTweensOf(containerRef.current);
        if (phoneRef.current) gsap.killTweensOf(phoneRef.current);
        if (hudContentRef.current) gsap.killTweensOf(hudContentRef.current);

        // Make container visible
        gsap.set(containerRef.current, { autoAlpha: 1 });
        if (containerRef.current) {
          containerRef.current.style.pointerEvents = 'auto';
        }

        // Master entrance choreography timeline
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // Step 1: Phone screen smooth fade-in and resolve (NO scale, to avoid clobbering matrix/bounds)
        if (phoneRef.current) {
          tl.fromTo(
            phoneRef.current,
            { opacity: 0, filter: 'blur(8px)' },
            { opacity: 1, filter: 'blur(0px)', duration: 0.65 },
            0.1
          );
        }

        // Step 2: Editorial HUD items cascade in
        if (hudContentRef.current) {
          // Top telemetry header
          const headers = hudContentRef.current.querySelectorAll('.hud-header-reveal');
          tl.fromTo(
            headers,
            { opacity: 0, x: 25, filter: 'blur(4px)' },
            { opacity: 1, x: 0, filter: 'blur(0px)', stagger: 0.06, duration: 0.5 },
            0.35
          );

          // OPTICAL MASK SPLIT-REVEAL FOR HEADLINE WORDS
          const headlineWords = hudContentRef.current.querySelectorAll('.split-word');
          tl.fromTo(
            headlineWords,
            { y: '115%', opacity: 0, filter: 'blur(8px)' },
            {
              y: '0%',
              opacity: 1,
              filter: 'blur(0px)',
              duration: 0.75,
              stagger: 0.04,
              ease: 'power3.out',
            },
            0.42
          );

          // Subtitle line split reveal
          const subLines = hudContentRef.current.querySelectorAll('.split-sub');
          tl.fromTo(
            subLines,
            { y: '110%', opacity: 0, filter: 'blur(4px)' },
            { y: '0%', opacity: 1, filter: 'blur(0px)', duration: 0.65 },
            0.58
          );

          // INTERACTIVE PROMPT PILLS CASCADE IN (ELASTIC POP)
          const pills = hudContentRef.current.querySelectorAll('.prompt-pill-reveal');
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
            0.65
          );

          // Bottom Action controls
          const actions = hudContentRef.current.querySelectorAll('.hud-action-reveal');
          tl.fromTo(
            actions,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, stagger: 0.06, duration: 0.5 },
            0.85
          );
        }
      }
      // Detect Exit (when scrolling away into next chapter)
      else if (!isNowVisible && isVisibleRef.current) {
        isVisibleRef.current = false;
        isLockedRef.current = false;

        const filmHost = document.getElementById('film-stage-host');
        if (filmHost) {
          filmHost.style.transition = 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
          filmHost.style.height = '100%';
          filmHost.style.bottom = '0px';
          filmHost.style.transform = 'none';
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

  // Words for the Optical Mask Split-Reveal headline
  const headlineLine1 = [
    { text: 'Thirty', isHighlight: false },
    { text: 'projects.', isHighlight: false },
  ];

  const headlineLine2 = [
    { text: 'One', isHighlight: true },
    { text: 'instant', isHighlight: true },
    { text: 'brain.', isHighlight: true },
  ];

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
        className="absolute pointer-events-auto overflow-visible"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: stacked ? '60%' : '100%',
          zIndex: 50,
          pointerEvents: 'auto',
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
          <iframe
            src="https://icy-sand-0d102fd00.7.azurestaticapps.net/?sessionId=0b555e4f-a0cf-4459-be58-a6d45a69ac68"
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
        </div>

        {/* Subtle mobile interaction helper */}
        {stacked && (
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-2 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#070A10]/85 border border-white/20 backdrop-blur-md text-[8.5px] font-mono text-[#8FB4FF] tracking-wider uppercase shadow-lg shadow-black/50"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#568DFF] animate-pulse" />
            <span>Interactive Broker AI · Tap &quot;Let’s start&quot;</span>
          </div>
        )}
      </div>

      {/*
        Mobile Portrait: Seamless dark dissolve from the bottom edge of the top 60% video
        stage into the obsidian #070A10 bottom half.
      */}
      {stacked && (
        <div
          className="absolute left-0 right-0 pointer-events-none z-20"
          style={{
            top: 'calc(60% - 24px)',
            height: '24px',
            background: 'linear-gradient(to bottom, transparent, rgba(7, 10, 16, 0.85) 70%, #070A10 100%)',
          }}
          aria-hidden="true"
        />
      )}

      {/*
        The sync announcement, in the empty half of the frame beside the phone.
        It used to drop in as a toast over the boardroom, which said the same
        thing twice — the deck had just shown the upload complete. Here it
        belongs to the shot it describes, and it only exists inside this
        overlay, so it can only appear on the broker beat.
      */}
      {!stacked && (
        <div
          className="hud-header-reveal absolute left-[6%] top-1/2 -translate-y-1/2 z-40 select-none pointer-events-none
                     max-w-[15rem] lg:max-w-[17rem]"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#568DFF] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#568DFF] shadow-md shadow-[#568DFF]/80" />
            </span>
            <span className="font-mono text-[9px] tracking-[0.24em] text-[#8FB4FF] uppercase font-bold">
              Global Broadcast Live
            </span>
          </div>

          <p
            className="text-white font-semibold leading-[1.15] tracking-tight text-[clamp(1.05rem,1.5vw,1.4rem)]"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Project synced to 40,000 brokers
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
            Instant interactive briefing, live across the Dubai network.
          </p>
        </div>
      )}

      {/* ===================================================================
          2. SPATIAL EDITORIAL HUD (RIGHT SIDE)
          Matches Boardroom Presentation & Live App design language.
         =================================================================== */}
      <div
        ref={hudContentRef}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="absolute z-40 pointer-events-auto select-none"
        style={hudStyle}
      >
        {/* Soft Organic Atmospheric Wash (Executive Obsidian + Subtle Cyan Accent) */}
        <div
          className="pointer-events-none absolute -inset-12 rounded-full blur-3xl opacity-80 -z-10"
          style={{
            background:
              'radial-gradient(ellipse at 70% 50%, rgba(11, 15, 25, 0.95) 0%, rgba(11, 15, 25, 0.6) 60%, transparent 100%)',
          }}
        />

        {/* Ambient Orb-Blue Accent Glow matching the Rechitta Spline Orb */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 rounded-full blur-3xl opacity-20 -z-10"
          style={{
            background: 'radial-gradient(circle, rgba(86, 141, 255, 0.5) 0%, rgba(40, 90, 220, 0.25) 40%, transparent 70%)',
          }}
        />

        {/* --- SPATIAL HUD HEADER / TELEMETRY --- */}
        <div className={`hud-header-reveal flex items-center justify-between border-b border-white/10 ${stacked ? 'mb-0.5 pb-0.5 text-[8.5px]' : 'mb-1 sm:mb-2 pb-1 text-[9px] sm:text-[10px]'} font-mono tracking-widest text-neutral-400`}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#568DFF] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#568DFF] shadow-sm shadow-[#568DFF]" />
            </span>
            <span className="font-semibold text-neutral-200 uppercase tracking-wider text-[9px]">
              02 // THE BROKER BRIEFING
            </span>
          </div>
          {/*
            The count moves out to the empty half beside the phone when there
            is one; on a stacked screen it stays here, where it fits.
          */}
          {stacked && (
            <span className="text-[8.5px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-300 font-mono">
              40,000 SYNCED
            </span>
          )}
        </div>

        {/* --- OPTICAL MASK SPLIT-REVEAL HERO HEADLINE (PUNCHY 5 WORDS) --- */}
        <div className={stacked ? 'mb-0.5' : 'mb-1'}>
          {/* Line 1 */}
          <div className="flex flex-wrap items-baseline gap-x-[0.25em]">
            {headlineLine1.map((token, i) => (
              <span key={i} className="inline-flex overflow-hidden pb-0.5 pt-0.5">
                <span
                  className="split-word inline-block translate-y-[115%] opacity-0 filter blur-[8px] transform-gpu text-sm sm:text-xl md:text-[clamp(1.4rem,2.1vw,2.05rem)] font-bold text-white tracking-tight leading-[1.1]"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {token.text}
                </span>
              </span>
            ))}
          </div>

          {/* Line 2 */}
          <div className="flex flex-wrap items-baseline gap-x-[0.25em]">
            {headlineLine2.map((token, i) => (
              <span key={i} className="inline-flex overflow-hidden pb-0.5 pt-0.5">
                <span
                  className="split-word inline-block translate-y-[115%] opacity-0 filter blur-[8px] transform-gpu text-sm sm:text-xl md:text-[clamp(1.4rem,2.1vw,2.05rem)] font-bold tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-neutral-400"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {token.text}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* --- 1 CLEAN SUB-HEADLINE SENTENCE --- */}
        <div className={`overflow-hidden ${stacked ? 'mb-1' : 'mb-1.5 sm:mb-3'}`}>
          <p className="split-sub text-[9px] sm:text-xs text-neutral-400 font-normal leading-relaxed translate-y-[110%] opacity-0 filter blur-[4px]">
            {stacked
              ? 'Every unit, price, and payment plan. Queried live by voice or text.'
              : 'Every unit, price, and payment plan across Dubai. Queried live, by voice or text.'}
          </p>
        </div>

        {/* --- INTERACTIVE PROBLEM STATEMENTS & VERIFIED SOLUTIONS --- */}
        {stacked ? (
          /* Mobile Portrait: 3-Tab Segmented Selector + Instant Solution Reveal */
          <div className="prompt-pill-reveal mb-1 flex flex-col gap-1">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.06] border border-white/10 backdrop-blur-md">
              {BROKER_PROBLEMS.map((prob) => {
                const isSelected = activeProblemId === prob.id;
                return (
                  <button
                    key={prob.id}
                    onClick={() => handleProblemSelect(prob)}
                    className={`flex-1 py-1 px-1 rounded-md text-[9px] font-semibold tracking-tight transition-all duration-200 cursor-pointer text-center truncate ${
                      isSelected
                        ? 'bg-white text-neutral-950 font-bold shadow-sm'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                    title={prob.tabLabel}
                  >
                    {prob.tabLabel}
                  </button>
                );
              })}
            </div>

            {/* Active Problem's Verified Solution Card */}
            <div
              onClick={() => handleProblemCopy(activeProblem)}
              className="p-2 rounded-xl border border-white/15 bg-neutral-900/80 backdrop-blur-xl shadow-lg cursor-pointer group transition-all duration-300 hover:border-white/30"
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[7.5px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#568DFF]/15 text-[#8FB4FF] border border-[#568DFF]/30">
                  {activeProblem.category}
                </span>
                <span className="text-[8px] font-mono flex items-center gap-1 text-neutral-400 group-hover:text-white">
                  {copiedId === activeProblem.id ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span>✓</span> Copied Query
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#8FB4FF]">
                      <span>✦ Instant Solution</span>
                    </span>
                  )}
                </span>
              </div>

              <p className="text-[10px] text-neutral-200 font-medium leading-snug">
                {activeProblem.solution}
              </p>

              <div className="mt-0.5 pt-0.5 border-t border-white/10 flex items-center justify-between text-[8px] text-neutral-400 font-mono">
                <span className="truncate max-w-[78%] text-neutral-400">&ldquo;{activeProblem.query}&rdquo;</span>
                <span className="text-[#568DFF] group-hover:underline">Test ↗</span>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop & Tablet Landscape: 3 Interactive Problem Cards */
          <div className="mb-5 flex flex-col gap-2.5">
            <div className="hud-header-reveal flex items-center justify-between text-[10px] font-mono text-neutral-400 px-1">
              <span className="uppercase tracking-wider flex items-center gap-1.5 text-neutral-300 font-semibold">
                <span className="text-[#568DFF]">⚡</span>
                <span>SOLVING CORE BROKER BOTTLENECKS</span>
              </span>
              <span className="text-[9px] text-neutral-500">CLICK TO REVEAL SOLUTION</span>
            </div>

            {BROKER_PROBLEMS.map((prob) => {
              const isSelected = activeProblemId === prob.id;
              const isCopied = copiedId === prob.id;

              return (
                <div
                  key={prob.id}
                  onClick={() => handleProblemSelect(prob)}
                  className={`prompt-pill-reveal group p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer text-left relative overflow-hidden backdrop-blur-xl ${
                    isSelected
                      ? 'bg-white text-neutral-950 border-white shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(255,255,255,0.15)] scale-[1.01]'
                      : 'bg-neutral-900/60 hover:bg-neutral-900/90 text-white border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[8px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? 'bg-neutral-100 text-neutral-700 border-neutral-200'
                          : 'bg-white/5 text-neutral-400 border-white/10'
                      }`}
                    >
                      {prob.category}
                    </span>

                    <span
                      className={`text-[9px] font-mono flex items-center gap-1 ${
                        isSelected ? 'text-neutral-600' : 'text-neutral-400 group-hover:text-white'
                      }`}
                    >
                      {isCopied ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <span>✓</span> Copied & Injected
                        </span>
                      ) : isSelected ? (
                        <span className="text-[#2563EB] font-semibold flex items-center gap-1">
                          <span>✦ Verified Solution</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span>Reveal Solution</span>
                          <span>→</span>
                        </span>
                      )}
                    </span>
                  </div>

                  <div
                    className={`text-xs sm:text-[13px] font-semibold leading-snug ${
                      isSelected ? 'text-neutral-950' : 'text-white'
                    }`}
                  >
                    {prob.tabLabel}
                  </div>
                  <div
                    className={`text-[11px] leading-tight mt-0.5 ${
                      isSelected ? 'text-neutral-600' : 'text-neutral-400'
                    }`}
                  >
                    &ldquo;{prob.problem}&rdquo;
                  </div>

                  {isSelected && (
                    <div className="mt-2.5 pt-2.5 border-t border-neutral-200 text-[11px] text-neutral-700 leading-relaxed animate-fade-in flex flex-col gap-1.5">
                      <div className="flex items-start gap-1.5">
                        <span className="text-sky-600 text-xs shrink-0 mt-0.5">✦</span>
                        <span>
                          <strong className="text-neutral-950 font-semibold">AI Solution:</strong>{' '}
                          {prob.solution}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500 flex items-center justify-between pt-1">
                        <span className="truncate">Sample Query: &ldquo;{prob.query}&rdquo;</span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProblemCopy(prob);
                          }}
                          className="text-sky-600 font-semibold hover:underline shrink-0 ml-2"
                        >
                          Copy query ↗
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* --- BOTTOM ACTION CONTROLS --- */}
        <div className="hud-action-reveal flex flex-row items-center gap-2 sm:gap-3 pt-0.5">
          {/* External Platform Link */}
          <a
            href="https://rechitta.com/brokers"
            target="_blank"
            rel="noreferrer"
            className="flex-1 min-w-0 py-2 sm:py-3.5 px-2 sm:px-5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-200 hover:text-white text-[11px] sm:text-[13px] font-semibold tracking-tight transition-all duration-300 flex items-center justify-center gap-1.5 group border border-white/15 hover:border-white/30 backdrop-blur-md cursor-pointer text-center"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            <span className="whitespace-nowrap">{stacked ? 'Broker Platform' : 'Explore Broker Platform'}</span>
            <span className="text-neutral-400 group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              ↗
            </span>
          </a>

          {/* 3D Scene Flight Trigger. The film waits on this one. */}
          <div className="relative flex-1 min-w-0 flex">
            <ClickPrompt
              label={showScrollPrompt ? 'Click here to continue' : 'Click to continue'}
              visible={ctaHint || showScrollPrompt}
              placement="top"
              urgent={showScrollPrompt}
            />
            <button
              onClick={handleFlyOn}
              className={`w-full min-w-0 py-2 sm:py-3.5 px-2 sm:px-5 rounded-xl text-white text-[11px] sm:text-sm font-bold tracking-tight transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer group border ${
                showScrollPrompt
                  ? 'bg-[#568DFF] border-[#8FB4FF] shadow-[0_0_32px_rgba(86,141,255,0.7)] scale-[1.02]'
                  : 'bg-[#568DFF]/90 hover:bg-[#568DFF] border-[#568DFF]/60 hover:border-[#8FB4FF] shadow-[0_0_20px_rgba(86,141,255,0.4)] hover:shadow-[0_0_28px_rgba(86,141,255,0.6)]'
              }`}
              style={{ fontFamily: 'var(--font-inter)' }}
              aria-label="Take the briefing global"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff] animate-pulse" />
              <span className="whitespace-nowrap">Take it global</span>
              <span className="text-white/90 font-bold transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
