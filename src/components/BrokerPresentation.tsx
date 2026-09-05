'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { coverRect, toViewport, matrix3dFor } from '@/screens/warp';
import { isPortraitFor, modeFor } from '@/hooks/useDeviceMode';
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

  // Active prompt pill interaction state
  const [activePillId, setActivePillId] = useState<number | null>(null);
  const [copiedPillId, setCopiedPillId] = useState<number | null>(null);

  // Perspective Switcher Dock & Scroll Lock State
  const isLockedRef = useRef(true);
  const [showScrollPrompt, setShowScrollPrompt] = useState(false);
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  /*
   * Below desktop the phone stops being composited into the shot.
   *
   * The homography puts the mockup exactly where the phone is in the footage,
   * which is the whole trick — but the footage is 16:9 and `object-fit: cover`
   * crops it hard on a narrower window. By tablet width the phone has drifted
   * under the copy panel, and on a portrait screen it is barely in frame at
   * all. So below 1200px the scene lays itself out instead: the live app on
   * one side, the copy on the other, or stacked when there is no room for two
   * columns. The film keeps playing behind it either way.
   */
  const deviceMode = modeFor(viewport.width);
  const stacked = isPortraitFor(viewport.width, viewport.height);
  const composited = deviceMode === 'desktop' && !stacked;

  /** The flat phone's painted height, and the width that follows from it. */
  const flatPhoneHeight = stacked
    ? Math.min(viewport.height * 0.50, viewport.width * 0.62 * (PHONE_HEIGHT / PHONE_WIDTH))
    : Math.min(viewport.height * 0.80, 660);
  const flatPhoneWidth = flatPhoneHeight * (PHONE_WIDTH / PHONE_HEIGHT);
  /** Clears the fixed site header when the scene is stacked. */
  const STACK_TOP = 88;

  // Proportional scale-to-fit on compact, short, or zoomed viewports
  // Prevents HUD panel from overflowing vertically or colliding with bottom dock and phone
  const hudScale = Math.min(
    1,
    Math.max(0.72, Math.min((viewport.height - 120) / 570, (viewport.width - 520) / 470))
  );

  /*
   * The copy panel goes wherever the phone is not: opposite it in the shot on
   * desktop, in the other column when the scene is laid out flat, and below it
   * once the screen is too narrow for two columns.
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
          top: `${STACK_TOP + flatPhoneHeight + 18}px`,
          width: 'min(92vw, 460px)',
          transform: 'translateX(-50%)',
          transformOrigin: 'top center',
        }
      : {
          left: `calc(6% + ${flatPhoneWidth}px + 5%)`,
          right: '5%',
          top: '50%',
          transform: `translateY(-50%) scale(${hudScale})`,
          transformOrigin: 'left center',
        };

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

  // Launch the 60fps hardware flight to the Buyer's Phone
  const handleFlyToBuyer = () => {
    isLockedRef.current = false;

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

    // 2. Hand control back to the film, which flies to the buyer.
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
      {/*
        Off the footage, the phone in the shot is still there behind the
        layout — two phones on screen at once, with the copy sitting across
        the wrong one. Dropping the film back to a backdrop resolves it.
      */}
      {!composited && (
        <div
          className="absolute inset-0 -z-10 pointer-events-none bg-[#070A10]/78 backdrop-blur-[14px]"
          aria-hidden="true"
        />
      )}

      {/* ===================================================================
          1. THE CALIBRATED 4-CORNER WARPED PHONE SCREEN
          Precision homography transform mapping 390x844 onto the user's
          exact calibrated corners.
         =================================================================== */}
      <div
        ref={phoneRef}
        className={
          composited
            ? 'absolute inset-0 pointer-events-none overflow-visible'
            : 'absolute inset-0 flex items-center justify-center pointer-events-none'
        }
      >
        <div
          style={
            composited
              ? {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: PHONE_WIDTH,
                  height: PHONE_HEIGHT,
                  transformOrigin: '0 0',
                  transform: matrix,
                  borderRadius: `${BROKER_PHONE_RADIUS}px`,
                  overflow: 'hidden',
                  boxShadow: '0 30px 70px -10px rgba(0, 0, 0, 0.95), 0 0 35px rgba(6, 182, 212, 0.12), inset 0 0 0 1.5px rgba(255, 255, 255, 0.18)',
                  pointerEvents: 'auto',
                }
              : {
                  position: 'absolute',
                  width: `${flatPhoneWidth}px`,
                  height: `${flatPhoneHeight}px`,
                  // Left column on a wide-enough screen, top of the stack on
                  // a portrait one.
                  left: stacked ? '50%' : '6%',
                  // Below the site header, which is fixed over everything.
                  top: stacked ? `${STACK_TOP}px` : '50%',
                  transform: stacked ? 'translateX(-50%)' : 'translateY(-50%)',
                  borderRadius: `${Math.round(flatPhoneHeight * 0.055)}px`,
                  overflow: 'hidden',
                  boxShadow: '0 30px 70px -10px rgba(0, 0, 0, 0.95), 0 0 35px rgba(6, 182, 212, 0.12), inset 0 0 0 1.5px rgba(255, 255, 255, 0.18)',
                  pointerEvents: 'auto',
                }
          }
        >
          <iframe
            src="https://icy-sand-0d102fd00.7.azurestaticapps.net/?sessionId=0b555e4f-a0cf-4459-be58-a6d45a69ac68"
            className="w-full h-full border-none relative z-10"
            title="Rechitta Live Broker Assistant"
            allow="autoplay; fullscreen; microphone"
          />
        </div>
      </div>

      {/*
        Projects synced, in the empty half of the frame beside the phone. It
        used to ride the top of the copy panel, which was already the densest
        part of the layout.
      */}
      {!stacked && (
        <div
          className="hud-header-reveal absolute left-[6%] top-1/2 -translate-y-1/2 z-40 select-none pointer-events-none
                     max-w-[22ch] lg:max-w-[26ch]"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#568DFF] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#568DFF] shadow-sm shadow-[#568DFF]" />
            </span>
            <span className="font-mono text-[9px] tracking-[0.28em] text-neutral-400 uppercase">
              Synced
            </span>
          </div>
          <div
            className="text-white/95 font-semibold leading-[1.05] tracking-tight text-[clamp(1.5rem,2.4vw,2.25rem)]"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            40,000
          </div>
          <p className="mt-1.5 font-mono text-[10px] leading-relaxed tracking-[0.14em] text-neutral-400 uppercase">
            Brokers briefed the same way, at the same moment
          </p>
        </div>
      )}

      {/* ===================================================================
          2. SPATIAL EDITORIAL HUD (RIGHT SIDE)
          Matches Boardroom Presentation & Live App design language.
         =================================================================== */}
      <div
        ref={hudContentRef}
        className="absolute z-50 pointer-events-auto select-none"
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
          {/*
            The count moves out to the empty half beside the phone when there
            is one; on a stacked screen it stays here, where it fits.
          */}
          {stacked && (
            <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-300 font-mono">
              40,000 SYNCED
            </span>
          )}
        </div>

        {/* --- OPTICAL MASK SPLIT-REVEAL HERO HEADLINE (PUNCHY 5 WORDS) --- */}
        <div className="mb-2">
          {/* Line 1 */}
          <div className="flex flex-wrap items-baseline gap-x-[0.25em]">
            {headlineLine1.map((token, i) => (
              <span key={i} className="inline-flex overflow-hidden pb-1 pt-0.5">
                <span
                  className="split-word inline-block translate-y-[115%] opacity-0 filter blur-[8px] transform-gpu text-xl sm:text-2xl md:text-[clamp(1.4rem,2.1vw,2.05rem)] font-bold text-white tracking-tight leading-[1.08]"
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
                  className="split-word inline-block translate-y-[115%] opacity-0 filter blur-[8px] transform-gpu text-xl sm:text-2xl md:text-[clamp(1.4rem,2.1vw,2.05rem)] font-bold tracking-tight leading-[1.08] text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-neutral-400"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {token.text}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* --- 1 CLEAN SUB-HEADLINE SENTENCE --- */}
        <div className={`overflow-hidden mb-5 ${stacked ? 'hidden' : ''}`}>
          <p className="split-sub text-[11px] sm:text-xs md:text-[13px] text-neutral-400 font-normal leading-relaxed translate-y-[110%] opacity-0 filter blur-[4px]">
            Every unit, price, and payment plan across Dubai — queried live by voice or text.
          </p>
        </div>

        {/*
          Stacked, there is only room under the phone for the headline and the
          buttons — and the live app the pills demonstrate is already on screen
          right above them.
        */}
        <div className={`mb-5 flex-col gap-2.5 ${stacked ? 'hidden' : 'flex'}`}>
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
                      <span className="text-sky-600 font-bold flex items-center gap-1">
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
                    <span className="text-sky-600 text-xs shrink-0 mt-0.5">✦</span>
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
        <div className="hud-action-reveal flex flex-row flex-wrap sm:flex-row items-center gap-2.5 sm:gap-3 pt-1">
          <a
            href="https://rechitta.com/brokers"
            target="_blank"
            rel="noreferrer"
            className="flex-1 min-w-0 py-3 sm:py-3.5 px-4 sm:px-5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 text-xs sm:text-[13px] font-bold tracking-tight transition-all flex items-center justify-center gap-2 group shadow-xl hover:shadow-white/10 cursor-pointer text-center"
          >
            <span className="whitespace-nowrap">{stacked ? 'Broker Experience' : 'Explore Broker Experience'}</span>
            <span className="text-neutral-600 font-bold transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>

          <button
            onClick={handleFlyToBuyer}
            className={`flex-1 min-w-0 py-3 sm:py-3.5 px-4 sm:px-5 rounded-xl text-white text-xs sm:text-[13px] font-bold tracking-tight transition-all flex items-center justify-center gap-2 cursor-pointer group border ${
              showScrollPrompt
                ? 'bg-[#568DFF] border-[#8FB4FF] shadow-[0_0_28px_rgba(86,141,255,0.55)] scale-[1.02]'
                : 'bg-gradient-to-r from-blue-600 to-[#568DFF] border-blue-400/30 shadow-md shadow-blue-500/25 hover:shadow-blue-500/40'
            }`}
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            <span className="whitespace-nowrap">Buyer&apos;s Perspective</span>
            <span className="text-white/80 font-bold transition-transform group-hover:translate-x-1">
              →
            </span>
          </button>
        </div>
      </div>

    </div>
  );
}
