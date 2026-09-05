'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useDemoModal } from '@/contexts/DemoModalContext';
import { coverRect, toViewport, matrix3dFor } from '@/screens/warp';
import type { Quad } from '@/screens/types';

interface BrokerPresentationProps {
  holdData: React.RefObject<{
    clipIndex: number;
    progress: number;
    startProgress?: number;
    endProgress?: number;
  }>;
}

/** 4-CORNER FINAL CALIBRATED PHONE QUAD (transit-b @ 16.90s) */
export const BROKER_PHONE_CORNERS: Quad = [
  [0.4318, 0.12124], // 0: Top-Left
  [0.61894, 0.14064], // 1: Top-Right
  [0.59057, 0.89816], // 2: Bottom-Right
  [0.37124, 0.85839], // 3: Bottom-Left
];

export const BROKER_PHONE_RADIUS = 48;

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

/** Interactive Prompt Pills for instant AI testing */
const PROMPT_PILLS = [
  {
    id: 1,
    category: 'AVAILABILITY',
    query: 'Show available 2-beds under AED 2M',
    answer: '4 units found in Marina Vista from AED 1.85M. 60/40 payment terms with 0% interest.',
  },
  {
    id: 2,
    category: 'PAYMENT TERMS',
    query: "What's the payment plan for Tower 2?",
    answer: '10% on booking, 50% during construction, 40% on Q4 2026 handover. DLD waiver included.',
  },
  {
    id: 3,
    category: 'LEGAL & SPV',
    query: 'Can offshore SPVs purchase Penthouse 4B?',
    answer: 'Yes. 100% foreign freehold ownership compliant via standard DLD offshore registration.',
  },
];

export default function BrokerPresentation({ holdData }: BrokerPresentationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const hudContentRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(false);
  const { openModal } = useDemoModal();

  // Active prompt pill interaction state
  const [activePillId, setActivePillId] = useState<number | null>(null);
  const [copiedPillId, setCopiedPillId] = useState<number | null>(null);

  // Perspective Switcher Dock & Scroll Lock State
  const [isLocked, setIsLocked] = useState(true);
  const isLockedRef = useRef(true);
  const lockedScrollYRef = useRef<number | null>(null);
  const [showScrollPrompt, setShowScrollPrompt] = useState(false);
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  // Responsive viewport tracking for homography mapping & leader line positioning
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute coverRect & viewport corners for homography
  const rect = coverRect(viewport.width, viewport.height);
  const viewportCorners: Quad = toViewport(BROKER_PHONE_CORNERS, rect);
  const matrix = matrix3dFor(PHONE_WIDTH, PHONE_HEIGHT, viewportCorners);

  // Proportional scale-to-fit on compact, short, or zoomed viewports
  // Prevents HUD panel from overflowing vertically or colliding with bottom dock and phone
  const hudScale = Math.min(
    1,
    Math.max(0.72, Math.min((viewport.height - 120) / 570, (viewport.width - 520) / 470))
  );

  // Handle prompt pill click: copies to clipboard & displays live simulated AI answer preview
  const handlePillClick = (pill: (typeof PROMPT_PILLS)[0]) => {
    setActivePillId(pill.id);
    setCopiedPillId(pill.id);
    navigator.clipboard?.writeText(pill.query);
    setTimeout(() => setCopiedPillId(null), 2500);
  };

  // Trigger brief highlight on the CTA dock when user attempts to scroll past
  const triggerScrollPrompt = () => {
    setShowScrollPrompt(true);
    if (promptTimeoutRef.current) clearTimeout(promptTimeoutRef.current);
    promptTimeoutRef.current = setTimeout(() => {
      setShowScrollPrompt(false);
    }, 2400);
  };

  // HARD SCROLL-LOCK: Capture-phase interception & scroll pinning
  useEffect(() => {
    const preventScroll = (e: Event) => {
      if (!isVisibleRef.current || !isLockedRef.current) return;

      // Stop event completely before Lenis or browser handles it
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      triggerScrollPrompt();

      // Ensure Lenis remains completely stopped
      const lenis = (window as any).lenis;
      if (lenis && typeof lenis.stop === 'function') lenis.stop();
      if (lenis && typeof lenis.velocity !== 'undefined') lenis.velocity = 0;

      if (lockedScrollYRef.current === null) {
        lockedScrollYRef.current = window.scrollY;
      }

      // Ensure window stays pinned to exact locked scroll position
      if (Math.abs(window.scrollY - lockedScrollYRef.current) > 0.5) {
        window.scrollTo(0, lockedScrollYRef.current);
      }
    };

    const preventKeyScroll = (e: KeyboardEvent) => {
      if (!isVisibleRef.current || !isLockedRef.current) return;
      const scrollKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Space', ' '];
      if (scrollKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        triggerScrollPrompt();
        if (lockedScrollYRef.current !== null) {
          window.scrollTo(0, lockedScrollYRef.current);
        }
      }
    };

    const handleScrollClamp = () => {
      if (!isVisibleRef.current || !isLockedRef.current) return;
      if (lockedScrollYRef.current !== null && Math.abs(window.scrollY - lockedScrollYRef.current) > 1) {
        window.scrollTo(0, lockedScrollYRef.current);
        triggerScrollPrompt();
      }
    };

    // Use CAPTURE phase so this handler runs before Lenis or any other listener!
    window.addEventListener('wheel', preventScroll, { capture: true, passive: false });
    window.addEventListener('touchmove', preventScroll, { capture: true, passive: false });
    window.addEventListener('keydown', preventKeyScroll, { capture: true, passive: false });
    window.addEventListener('scroll', handleScrollClamp, { capture: true, passive: false });

    return () => {
      window.removeEventListener('wheel', preventScroll, { capture: true } as any);
      window.removeEventListener('touchmove', preventScroll, { capture: true } as any);
      window.removeEventListener('keydown', preventKeyScroll, { capture: true } as any);
      window.removeEventListener('scroll', handleScrollClamp, { capture: true } as any);
    };
  }, []);

  // Launch the 60fps hardware flight to the Buyer's Phone
  const handleFlyToBuyer = () => {
    isLockedRef.current = false;
    setIsLocked(false);
    lockedScrollYRef.current = null;

    // 1. Smoothly dissolve the Broker Scene UI
    if (containerRef.current) {
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

    // 2. Dispatch the flight launch event to ScrollFilm
    window.dispatchEvent(new CustomEvent('rechitta:fly-to-buyer'));
  };

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
        setIsLocked(true);
        lockedScrollYRef.current = window.scrollY;

        // Hard stop Lenis and wipe residual inertia
        const lenis = (window as any).lenis;
        if (lenis) {
          if (typeof lenis.stop === 'function') lenis.stop();
          if (typeof lenis.velocity !== 'undefined') lenis.velocity = 0;
        }

        gsap.killTweensOf(containerRef.current);
        if (phoneRef.current) gsap.killTweensOf(phoneRef.current);
        if (hudContentRef.current) gsap.killTweensOf(hudContentRef.current);

        // Make container visible
        gsap.set(containerRef.current, { autoAlpha: 1 });

        // Master entrance choreography timeline
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // Step 1: Phone screen smooth fade-in and scale settle
        if (phoneRef.current) {
          tl.fromTo(
            phoneRef.current,
            { opacity: 0, scale: 0.97, filter: 'blur(8px)' },
            { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.65 },
            0
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
        setIsLocked(false);
        lockedScrollYRef.current = null;

        gsap.killTweensOf(containerRef.current);
        if (phoneRef.current) gsap.killTweensOf(phoneRef.current);
        if (hudContentRef.current) gsap.killTweensOf(hudContentRef.current);

        // Smooth Exit Fade Out
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.35,
          ease: 'power2.inOut',
          onComplete: () => {
            if (containerRef.current) gsap.set(containerRef.current, { autoAlpha: 0 });
          },
        });
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [holdData]);

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
      {/* ===================================================================
          1. THE CALIBRATED 4-CORNER WARPED PHONE SCREEN
          Precision homography transform mapping 390x844 onto the user's
          exact calibrated corners.
         =================================================================== */}
      <div
        ref={phoneRef}
        className="absolute inset-0 pointer-events-none overflow-visible"
      >
        {/* Homography Warped Phone Chassis */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: PHONE_WIDTH,
            height: PHONE_HEIGHT,
            transformOrigin: '0 0',
            transform: matrix,
            borderRadius: `${BROKER_PHONE_RADIUS}px`,
            overflow: 'hidden',
            boxShadow:
              '0 30px 70px -10px rgba(0, 0, 0, 0.95), 0 0 35px rgba(6, 182, 212, 0.12), inset 0 0 0 1.5px rgba(255, 255, 255, 0.18)',
            pointerEvents: 'auto',
          }}
        >
          {/* The Live Interactive Azure Sandbox Iframe (Clean edge-to-edge) */}
          <iframe
            src="https://icy-sand-0d102fd00.7.azurestaticapps.net/?sessionId=0b555e4f-a0cf-4459-be58-a6d45a69ac68"
            className="w-full h-full border-none relative z-10"
            title="Rechitta Live Broker Assistant"
            allow="autoplay; fullscreen; microphone"
          />
        </div>
      </div>

      {/* ===================================================================
          2. SPATIAL EDITORIAL HUD (RIGHT SIDE)
          Matches Boardroom Presentation & Live App design language.
         =================================================================== */}
      <div
        ref={hudContentRef}
        className="absolute right-4 sm:right-6 md:right-8 lg:right-12 top-1/2 z-50 pointer-events-auto max-w-[min(490px,46vw)] w-[92vw] md:w-[465px] select-none"
        style={{
          transform: `translateY(-50%) scale(${hudScale})`,
          transformOrigin: 'right center',
        }}
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
        <div className="hud-header-reveal flex items-center justify-between mb-3 border-b border-white/10 pb-2 text-[10px] font-mono tracking-widest text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#568DFF] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#568DFF] shadow-sm shadow-[#568DFF]" />
            </span>
            <span className="font-semibold text-neutral-200 uppercase tracking-wider">
              02 // THE BROKER BRIEFING
            </span>
          </div>
          <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-300 font-mono">
            40,000 BROKERS SYNCED
          </span>
        </div>

        {/* --- OPTICAL MASK SPLIT-REVEAL HERO HEADLINE (PUNCHY 5 WORDS) --- */}
        <div className="mb-2">
          {/* Line 1 */}
          <div className="flex flex-wrap items-baseline gap-x-[0.25em]">
            {headlineLine1.map((token, i) => (
              <span key={i} className="inline-flex overflow-hidden pb-1 pt-0.5">
                <span
                  className="split-word inline-block translate-y-[115%] opacity-0 filter blur-[8px] transform-gpu text-2xl sm:text-3xl md:text-[clamp(1.75rem,2.8vw,2.75rem)] font-bold text-white tracking-tight leading-[1.08]"
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
              <span key={i} className="inline-flex overflow-hidden pb-1 pt-0.5">
                <span
                  className="split-word inline-block translate-y-[115%] opacity-0 filter blur-[8px] transform-gpu text-2xl sm:text-3xl md:text-[clamp(1.75rem,2.8vw,2.75rem)] font-bold tracking-tight leading-[1.08] text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-neutral-400"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {token.text}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* --- 1 CLEAN SUB-HEADLINE SENTENCE --- */}
        <div className="overflow-hidden mb-5">
          <p className="split-sub text-xs sm:text-[13px] md:text-sm text-neutral-400 font-normal leading-relaxed translate-y-[110%] opacity-0 filter blur-[4px]">
            Every unit, price, and payment plan across Dubai — queried live by voice or text.
          </p>
        </div>

        {/* --- INTERACTIVE PROMPT CHIPS SECTION (MATCHING BOARDROOM SLIDE 3/4) --- */}
        <div className="mb-5 flex flex-col gap-2.5">
          <div className="hud-header-reveal flex items-center justify-between text-[10px] font-mono text-neutral-400 px-1">
            <span className="uppercase tracking-wider flex items-center gap-1.5 text-neutral-300 font-semibold">
              <span className="text-[#568DFF]">⚡</span>
              <span>TEST A LIVE BROKER QUERY</span>
            </span>
            <span className="text-[9px] text-neutral-500">CLICK TO TEST</span>
          </div>

          {/* The 3 Interactive Question Pills */}
          {PROMPT_PILLS.map((pill) => {
            const isSelected = activePillId === pill.id;
            const isCopied = copiedPillId === pill.id;

            return (
              <div
                key={pill.id}
                onClick={() => handlePillClick(pill)}
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
                    {pill.category}
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
                    ) : (
                      <span className="flex items-center gap-1">
                        <span>Test Query</span>
                        <span>→</span>
                      </span>
                    )}
                  </span>
                </div>

                {/* The Query Text */}
                <div
                  className={`text-xs sm:text-[13px] font-semibold leading-snug ${
                    isSelected ? 'text-neutral-950' : 'text-white'
                  }`}
                >
                  &ldquo;{pill.query}&rdquo;
                </div>

                {/* Instant Answer Preview on Click */}
                {isSelected && (
                  <div className="mt-2.5 pt-2.5 border-t border-neutral-200 text-[11px] text-neutral-700 leading-relaxed animate-fade-in flex items-start gap-1.5">
                    <span className="text-emerald-600 text-xs shrink-0 mt-0.5">✦</span>
                    <span>
                      <strong className="text-neutral-950 font-semibold">Verified Response:</strong>{' '}
                      {pill.answer}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* --- BOTTOM ACTION CONTROLS --- */}
        <div className="hud-action-reveal flex flex-col sm:flex-row items-center gap-3 pt-1">
          <a
            href="https://rechitta.com/brokers"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:flex-1 py-3.5 px-5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 text-xs sm:text-[13px] font-bold tracking-tight transition-all flex items-center justify-center gap-2 group shadow-xl hover:shadow-white/10 cursor-pointer text-center"
          >
            <span>Explore Broker Experience</span>
            <span className="text-neutral-600 font-bold transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>

          <button
            onClick={openModal}
            className="w-full sm:w-auto py-3.5 px-4.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-semibold tracking-tight border border-white/10 hover:border-white/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md"
            title="Open fullscreen sandbox modal"
          >
            <span>⛶</span>
            <span>Fullscreen Sandbox</span>
          </button>
        </div>
      </div>

      {/* ===================================================================
          3. OPTION B: PERSPECTIVE SWITCHER FLOATING DOCK (VISIONOS STYLE)
          Docked bottom-center, unlocks flight to Buyer's Perspective
         =================================================================== */}
      <div
        ref={dockRef}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto select-none"
      >
        <div
          className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 rounded-full bg-neutral-950/90 backdrop-blur-2xl border transition-all duration-500 shadow-2xl ${
            showScrollPrompt
              ? 'border-blue-500 shadow-[0_0_35px_rgba(86,141,255,0.5)] scale-105'
              : 'border-white/15 hover:border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_20px_rgba(255,255,255,0.05)]'
          }`}
        >
          {/* Left Capsule: Active Scene (Broker) */}
          <div className="flex items-center gap-2 pr-2.5 border-r border-white/15">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#568DFF] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#568DFF] shadow-sm shadow-[#568DFF]" />
            </span>
            <span className="text-[11px] font-mono font-semibold tracking-wider text-neutral-200 uppercase whitespace-nowrap">
              02 Broker
            </span>
          </div>

          {/* Center Trajectory Flight Indicator - Sleek Laser Track with Blue Pulse Bead */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-neutral-400 font-mono tracking-widest px-1">
            <span className="w-5 h-px bg-gradient-to-r from-blue-500/40 to-[#568DFF]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#568DFF] shadow-[0_0_8px_#568DFF] animate-pulse" />
            <span className="w-5 h-px bg-gradient-to-r from-[#568DFF] to-blue-500/40" />
          </div>

          {/* Right CTA Button: Switch to Buyer */}
          <button
            onClick={handleFlyToBuyer}
            className="flex items-center gap-2 px-4.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-[#568DFF] hover:from-blue-500 hover:to-blue-400 text-white text-xs font-semibold tracking-tight transition-all shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group whitespace-nowrap border border-blue-400/30"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            <span>03 Buyer&apos;s Perspective</span>
            <span className="text-white/80 font-bold transition-transform group-hover:translate-x-1">
              →
            </span>
          </button>
        </div>

        {/* Scroll Locked Floating Tooltip Hint (appears if user attempts to scroll) */}
        {showScrollPrompt && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-neutral-900/95 border border-blue-500/40 text-[10px] font-mono text-neutral-200 whitespace-nowrap shadow-xl animate-bounce">
            ⚡ Click button to fly to Buyer&apos;s Perspective!
          </div>
        )}
      </div>
    </div>
  );
}
