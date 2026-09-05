'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useDemoModal } from '@/contexts/DemoModalContext';
import { coverRect, toViewport, matrix3dFor } from '@/screens/warp';
import { isPortraitFor, modeFor } from '@/hooks/useDeviceMode';
import type { Quad } from '@/screens/types';

interface BuyerPresentationProps {
  holdData: React.RefObject<{
    clipIndex: number;
    progress: number;
    startProgress?: number;
    endProgress?: number;
  }>;
}

/** 4-CORNER CALIBRATED BUYER PHONE QUAD (transit-c @ 6.80s) */
export const BUYER_PHONE_CORNERS: Quad = [
  [0.41107, 0.15325], // 0: Top-Left
  [0.59821, 0.17556], // 1: Top-Right
  [0.56329, 0.92144], // 2: Bottom-Right
  [0.36251, 0.87973], // 3: Bottom-Left
];

export const BUYER_PHONE_RADIUS = 46;

export interface RotoCutout {
  enabled: boolean;
  startY: number; // px from bottom along right edge
  endX: number;   // px from right along bottom edge
  apexX: number;  // px inward peak of the curve
  apexY: number;  // px height peak of the curve
}

export const BUYER_ROTO_CUTOUT: RotoCutout = {
  enabled: true,
  startY: 92,
  endX: 41,
  apexX: 25,
  apexY: 45,
};

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

/** Niche multilingual dataset from call notes & extracted copy */
export const LANGUAGES = [
  {
    id: 'en',
    code: 'EN',
    name: 'English',
    flag: '🇬🇧',
    stateLabel: 'English',
    isRTL: false,
    headerProject: 'MARINA VISTA // TOWER 1',
    mainTitle: 'Building Specifications',
    cardSubtitle: 'Elevator & Core Access Plan',
    category: 'BUILDING ARCHITECTURE & LIFTS',
    query: 'How many elevators does this building have?',
    answer:
      '4 high-speed passenger elevators (speed 4.0 m/s) + 1 dedicated service & freight elevator with direct basement-to-penthouse access.',
    specs: [
      { icon: '◻', label: '4 High-Speed Lifts', sub: '4.0 m/s passenger core' },
      { icon: '🏷', label: '1 Service Elevator', sub: 'Dedicated freight lift' },
      { icon: '⛵', label: 'Penthouse Direct', sub: 'Basement B3 to L58' },
      { icon: '🚪', label: '< 22s Wait Time', sub: 'Peak traffic verified' },
    ],
    voiceStatus: 'Live voice synthesis in English',
    quote: '“I’ve curated the complete architectural specification for you.”',
  },
  {
    id: 'ar',
    code: 'AR',
    name: 'العربية',
    flag: '🇦🇪',
    stateLabel: 'العربية (Arabic)',
    isRTL: true,
    headerProject: 'مارينا فيستا // البرج ١',
    mainTitle: 'المواصفات الهندسية',
    cardSubtitle: 'مخطط المصاعد والوصول المباشر',
    category: 'مخطط المصاعد والوصول المباشر',
    query: 'كم عدد المصاعد في هذا المبنى؟',
    answer:
      'يحتوي المبنى على ٤ مصاعد ركاب فائقة السرعة ومصعد خدمات مخصص مع وصول مباشر من المواقف السفلية إلى السطح.',
    specs: [
      { icon: '◻', label: '٤ مصاعد ركاب', sub: 'سرعة ٤.٠ م/ث فائقة' },
      { icon: '🏷', label: '١ مصعد خدمات', sub: 'شحن وأثاث مخصص' },
      { icon: '⛵', label: 'وصول مباشر للسطح', sub: 'من القبو حتى الطابق ٥٨' },
      { icon: '🚪', label: 'أقل من ٢٢ ثانية', sub: 'متوسط زمن الانتظار' },
    ],
    voiceStatus: 'جاري البث الصوتي باللغة العربية',
    quote: '“لقد قمت بإعداد المواصفات الحصرية للمشروع بالكامل.”',
  },
  {
    id: 'hi',
    code: 'HI',
    name: 'हिन्दी',
    flag: '🇮🇳',
    stateLabel: 'हिन्दी (INR)',
    isRTL: false,
    headerProject: 'मरीना विस्टा // टॉवर १',
    mainTitle: 'भवन विशिष्टताएँ एवं रूपांतरण',
    cardSubtitle: 'लाइव भारतीय मुद्रा एवं भुगतान योजना',
    category: 'लाइव मुद्रा रूपांतरण एवं भुगतान',
    query: 'यह कीमत भारतीय रुपये में कितनी होगी?',
    answer:
      'वर्तमान विनिमय दर (1 AED ≈ 22.85 INR) पर, 2.1M AED की संपत्ति लगभग ₹4.80 करोड़ होगी। 60/40 भुगतान योजना लागू है।',
    specs: [
      { icon: '◻', label: '1 AED ≈ 22.85 INR', sub: 'लाइव इंटरबैंक दर' },
      { icon: '🏷', label: 'कुल मूल्य: ₹4.80 Cr', sub: 'AED 2,100,000' },
      { icon: '⛵', label: 'बुकिंग: ₹48.0 Lakh', sub: '10% डाउन पेमेंट' },
      { icon: '🚪', label: '100% विदेशी SPV', sub: 'DLD फ्रीहोल्ड स्वीकृत' },
    ],
    voiceStatus: 'भारतीय मुद्रा एवं नियमों में लाइव विवरण',
    quote: '“मैंने आपके लिए लाइव मुद्रा रूपांतरण तैयार कर दिया है।”',
  },
];

export default function BuyerPresentation({ holdData }: BuyerPresentationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const hudContentRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(false);
  const { openModal } = useDemoModal();

  // Calibrated production constants for Buyer Phone
  const corners = BUYER_PHONE_CORNERS;
  const borderRadius = BUYER_PHONE_RADIUS;
  const rotoConfig = BUYER_ROTO_CUTOUT;

  // Active language state with VisionOS Fluid Stagger & Voice Ripple (Option 1)
  const [activeLangIndex, setActiveLangIndex] = useState(0);
  const currentLang = LANGUAGES[activeLangIndex];
  const [isSwitchingLang, setIsSwitchingLang] = useState(false);
  const [langAnimState, setLangAnimState] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [voiceRipple, setVoiceRipple] = useState(false);
  const langTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const switchLanguage = useCallback((newIndex: number) => {
    if (newIndex === activeLangIndex || isSwitchingLang) return;

    if (langTimeoutRef.current) clearTimeout(langTimeoutRef.current);

    setIsSwitchingLang(true);
    setLangAnimState('exit');
    setVoiceRipple(true);

    // Out-phase completes after 180ms: swap the language text
    langTimeoutRef.current = setTimeout(() => {
      setActiveLangIndex(newIndex);
      setLangAnimState('enter');

      // Enter-phase settles after 280ms
      langTimeoutRef.current = setTimeout(() => {
        setLangAnimState('idle');
        setIsSwitchingLang(false);
        setVoiceRipple(false);
      }, 280);
    }, 180);
  }, [activeLangIndex, isSwitchingLang]);

  useEffect(() => {
    return () => {
      if (langTimeoutRef.current) clearTimeout(langTimeoutRef.current);
    };
  }, []);

  // Perspective Switcher Dock & Scroll Lock State
  const [isLocked, setIsLocked] = useState(true);
  const isLockedRef = useRef(true);
  const [showScrollPrompt, setShowScrollPrompt] = useState(false);
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  // Responsive viewport tracking for homography mapping
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
  const viewportCorners: Quad = toViewport(corners, rect);
  const matrix = matrix3dFor(PHONE_WIDTH, PHONE_HEIGHT, viewportCorners);

  /*
   * Below desktop the phone stops being composited into the shot — see the
   * same note in BrokerPresentation. The hand rotoscope goes with it: there is
   * no hand to cut the chassis around once it is off the footage.
   */
  const deviceMode = modeFor(viewport.width);
  const stacked = isPortraitFor(viewport.width, viewport.height);
  const composited = deviceMode === 'desktop' && !stacked;

  const flatPhoneHeight = stacked
    ? Math.min(viewport.height * 0.44, viewport.width * 0.62 * (PHONE_HEIGHT / PHONE_WIDTH))
    : Math.min(viewport.height * 0.80, 660);
  const flatPhoneWidth = flatPhoneHeight * (PHONE_WIDTH / PHONE_HEIGHT);
  const flatPhoneScale = flatPhoneHeight / PHONE_HEIGHT;
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
        right: '3rem',
        top: '50%',
        width: 'min(465px, 46vw)',
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

  // Trigger brief highlight on the CTA dock when user attempts to scroll past
  const triggerScrollPrompt = () => {
    setShowScrollPrompt(true);
    if (promptTimeoutRef.current) clearTimeout(promptTimeoutRef.current);
    promptTimeoutRef.current = setTimeout(() => {
      setShowScrollPrompt(false);
    }, 2400);
  };

  /**
   * The film holds here until the call to action is pressed. Showing the
   * prompt is all this has to do now — the beat machine simply declines to
   * advance, instead of the old capture-phase handler clamping the window
   * scroll position back every frame.
   */
  useEffect(() => {
    const onNudge = (e: Event) => {
      const detail = (e as CustomEvent<{ beat?: string }>).detail;
      if (detail?.beat && detail.beat !== 'buyer') return;
      if (!isVisibleRef.current) return;
      triggerScrollPrompt();
    };
    window.addEventListener('rechitta:nudge', onNudge);
    return () => window.removeEventListener('rechitta:nudge', onNudge);
  }, []);

  // Launch the flight leaving the Buyer's Phone into Global Reach (Chapter 4)
  const handleFlyToGlobal = () => {
    isLockedRef.current = false;
    setIsLocked(false);

    // 1. Smoothly dissolve the Buyer Scene UI
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

    // 2. Hand control back to the film, which opens the world chapter.
    window.dispatchEvent(new CustomEvent('rechitta:fly-to-global'));
  };

  // Entrance and Exit watcher synced to the buyer's phone hold (clipIndex === 2)
  useEffect(() => {
    let frame: number;

    const render = () => {
      if (!holdData.current || !containerRef.current) {
        frame = requestAnimationFrame(render);
        return;
      }

      const { clipIndex } = holdData.current;
      const isNowVisible = clipIndex === 2;

      // Detect Entrance (when camera lands on the buyer's phone)
      if (isNowVisible && !isVisibleRef.current) {
        isVisibleRef.current = true;
        isLockedRef.current = true;
        setIsLocked(true);

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

        // Step 2: Spatial HUD items cascade in
        if (hudContentRef.current) {
          // Top telemetry header
          const headers = hudContentRef.current.querySelectorAll('.buyer-header-reveal');
          tl.fromTo(
            headers,
            { opacity: 0, x: 25, filter: 'blur(4px)' },
            { opacity: 1, x: 0, filter: 'blur(0px)', stagger: 0.06, duration: 0.5 },
            0.25
          );

          // Optical mask split-reveal for headline words
          const headlineWords = hudContentRef.current.querySelectorAll('.buyer-split-word');
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
            0.35
          );

          // Subtitle line split reveal
          const subLines = hudContentRef.current.querySelectorAll('.buyer-split-sub');
          tl.fromTo(
            subLines,
            { y: '110%', opacity: 0, filter: 'blur(4px)' },
            { y: '0%', opacity: 1, filter: 'blur(0px)', duration: 0.65 },
            0.5
          );

          // Language selector bar reveal
          const langBar = hudContentRef.current.querySelectorAll('.buyer-lang-reveal');
          tl.fromTo(
            langBar,
            { opacity: 0, y: 20, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.5)' },
            0.6
          );

          // Interactive Question Showcase
          const showcase = hudContentRef.current.querySelectorAll('.buyer-showcase-reveal');
          tl.fromTo(
            showcase,
            { opacity: 0, x: 30, scale: 0.95 },
            { opacity: 1, x: 0, scale: 1, duration: 0.6, ease: 'power3.out' },
            0.7
          );

          // Bottom Action controls
          const actions = hudContentRef.current.querySelectorAll('.buyer-action-reveal');
          tl.fromTo(
            actions,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, stagger: 0.06, duration: 0.5 },
            0.8
          );
        }
      }
      // Detect Exit (when scrolling away into next chapter)
      else if (!isNowVisible && isVisibleRef.current) {
        isVisibleRef.current = false;
        isLockedRef.current = false;
        setIsLocked(false);

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
    { text: 'Ask', isHighlight: false },
    { text: 'anything', isHighlight: false },
    { text: '—', isHighlight: false },
  ];

  const headlineLine2 = [
    { text: 'get', isHighlight: true },
    { text: 'it', isHighlight: true },
    { text: 'back', isHighlight: true },
    { text: 'in', isHighlight: true },
    { text: 'your', isHighlight: true },
    { text: 'language.', isHighlight: true },
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
          100% DESIGN CONSISTENT WITH LIVE APP (live-inventory-final.jpeg)
          Precision homography mapping 390x844 onto buyer phone @ t = 6.80s
         =================================================================== */}
      <div
        ref={phoneRef}
        className={
          composited
            ? 'absolute inset-0 pointer-events-none overflow-visible'
            : 'absolute inset-0 flex items-center justify-center pointer-events-none'
        }
      >
        {/* Invisible SVG ClipPath Definition for Hand Rotoscope Cutout */}
        <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
          <defs>
            <clipPath id="buyer-phone-hand-roto" clipPathUnits="userSpaceOnUse">
              <path
                d={`
                  M 0 0
                  L ${PHONE_WIDTH} 0
                  L ${PHONE_WIDTH} ${PHONE_HEIGHT - rotoConfig.startY}
                  Q ${PHONE_WIDTH - rotoConfig.apexX} ${PHONE_HEIGHT - rotoConfig.apexY} ${PHONE_WIDTH - rotoConfig.endX} ${PHONE_HEIGHT}
                  L 0 ${PHONE_HEIGHT}
                  Z
                `}
              />
            </clipPath>
          </defs>
        </svg>

        {/* Homography Warped Phone Chassis */}
        <div
          style={{
            position: 'absolute',
            ...(composited
              ? {
                  top: 0,
                  left: 0,
                  width: PHONE_WIDTH,
                  height: PHONE_HEIGHT,
                  transformOrigin: '0 0',
                  transform: matrix,
                  borderRadius: `${borderRadius}px`,
                  // The cutout exists to let the hand in the shot pass in
                  // front of the chassis. Off the footage there is no hand.
                  clipPath: rotoConfig.enabled ? 'url(#buyer-phone-hand-roto)' : undefined,
                }
              : {
                  // This screen is hand-built at 390x844, not an iframe that
                  // reflows. Shrinking the box would crop the layout, so the
                  // box keeps its native size and the whole thing is scaled.
                  width: PHONE_WIDTH,
                  height: PHONE_HEIGHT,
                  left: stacked ? '50%' : '6%',
                  // Below the site header, which is fixed over everything.
                  top: stacked ? `${STACK_TOP}px` : '50%',
                  transformOrigin: stacked ? 'top center' : 'left center',
                  transform: stacked
                    ? `translateX(-50%) scale(${flatPhoneScale})`
                    : `translateY(-50%) scale(${flatPhoneScale})`,
                  borderRadius: `${borderRadius}px`,
                }),
            overflow: 'hidden',
            boxShadow:
              '0 30px 70px -10px rgba(0, 0, 0, 0.95), 0 0 35px rgba(6, 182, 212, 0.12), inset 0 0 0 1.5px rgba(255, 255, 255, 0.18)',
            pointerEvents: 'auto',
          }}
          className="bg-[#0B0F19] text-white flex flex-col justify-between select-none relative"
        >
          {/* Subtle architectural ambient background blur */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center"
            style={{ backgroundImage: "url('/presentation/3-FINAL.jpeg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F19]/90 via-[#0B0F19]/80 to-[#0B0F19]/95 pointer-events-none" />

          {/* --- PHONE TOP BAR (MATCHING APP MOCKUP: ← PROJECT NAME) --- */}
          <div className="relative z-10 px-5 pt-3.5 pb-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-2">
              <span className="font-semibold text-white">9:41</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">5G</span>
                <span className="w-4 h-2 rounded-xs border border-white/60 flex items-center p-0.5">
                  <span className="w-full h-full bg-white rounded-xs" />
                </span>
              </div>
            </div>

            {/* Header: ← PROJECT NAME */}
            <div
              className={`flex items-center justify-between border-b border-white/10 pb-2.5 transition-all duration-200 ease-out ${
                langAnimState === 'exit'
                  ? 'opacity-0 -translate-y-1.5 blur-[2px]'
                  : 'opacity-100 translate-y-0 blur-0'
              } ${
                currentLang.isRTL ? 'flex-row-reverse text-right' : 'text-left'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-neutral-300 text-sm font-light">←</span>
                <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-semibold">
                  {currentLang.headerProject}
                </span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-300">
                {currentLang.code} // VERIFIED
              </span>
            </div>
          </div>

          {/* --- PHONE MAIN CONTENT (PLAYFAIR HEADLINE + ARCHITECTURAL SPEC CARD) --- */}
          <div
            className={`relative z-10 px-5 flex-1 flex flex-col justify-center ${
              currentLang.isRTL ? 'text-right' : 'text-left'
            }`}
            dir={currentLang.isRTL ? 'rtl' : 'ltr'}
          >
            {/* Title in clean luxury Inter bold (matching app design) */}
            <h3
              className={`text-2xl sm:text-[1.7rem] font-bold text-white tracking-tight leading-tight mb-3 transition-all duration-200 ease-out ${
                langAnimState === 'exit'
                  ? 'opacity-0 -translate-y-2 blur-[4px]'
                  : 'opacity-100 translate-y-0 blur-0'
              }`}
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {currentLang.mainTitle}
            </h3>

            {/* The Luxury App Card Container */}
            <div
              className={`rounded-2xl border border-white/15 bg-[#161B26] overflow-hidden shadow-2xl transition-all duration-250 ease-out delay-[30ms] ${
                langAnimState === 'exit'
                  ? 'opacity-0 -translate-y-2 scale-[0.98] blur-[4px]'
                  : 'opacity-100 translate-y-0 scale-100 blur-0'
              }`}
            >
              {/* Upper Section: Architectural Blueprint Graphic / Floorplan Header */}
              <div className="bg-[#F6F4F0] p-3 border-b border-white/10 relative overflow-hidden flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-[11px]">
                    🏢
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-neutral-900 leading-none">
                      Tower 1 Core Layout
                    </span>
                    <span className="text-[9px] text-neutral-500 font-mono mt-0.5">
                      DLD Certified Schematic
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                  LIVE
                </span>
              </div>

              {/* Lower Section: Charcoal card with 2x2 specification matrix */}
              <div className="p-3.5 bg-[#161B26]">
                <div className="text-xs sm:text-[13px] font-bold text-white tracking-tight mb-2.5 flex items-center justify-between">
                  <span>{currentLang.cardSubtitle}</span>
                  <span className="text-[9px] text-[#568DFF] font-mono font-semibold">
                    {currentLang.category}
                  </span>
                </div>

                {/* 2x2 Clean Spec Grid with Icons (matching app mockup) */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  {currentLang.specs.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-start gap-2"
                    >
                      <span className="text-xs text-[#568DFF] shrink-0 mt-0.5 font-mono">
                        {item.icon}
                      </span>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-semibold text-neutral-100 truncate">
                          {item.label}
                        </span>
                        <span className="text-[8px] text-neutral-400 truncate mt-0.5">
                          {item.sub}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pagination Controls below the card (← ● ○ ○ →) matching mockup */}
            <div className="flex items-center justify-center gap-3 mt-3 text-neutral-400 text-xs">
              <span className="cursor-pointer hover:text-white">←</span>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-1.5 rounded-full bg-white" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              </div>
              <span className="cursor-pointer hover:text-white">→</span>
            </div>
          </div>

          {/* --- PHONE BOTTOM VOICE BAR (EXACT MATCH: Orb with monogram + mic + pause) --- */}
          <div className="relative z-10 px-5 pt-3 pb-6 border-t border-white/10 bg-black/70 backdrop-blur-md flex flex-col items-center gap-1.5">
            {/* The Floating Pill Bar */}
            <div className="w-full max-w-[280px] h-11 px-4 rounded-full bg-[#1A1F2D] border border-white/15 flex items-center justify-between shadow-xl">
              {/* Left: Pause button */}
              <span className="text-neutral-400 text-xs cursor-pointer hover:text-white">
                ⏸
              </span>

              {/* Center: Glowing Electric Orb-Blue Voice Orb with Rechitta Monogram & Ripple Effect */}
              <div
                id="buyer-voice-orb-dock"
                className={`relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-[#568DFF] shadow-[0_0_15px_rgba(86,141,255,0.6)] cursor-pointer transition-all duration-300 ${
                  voiceRipple ? 'scale-115 shadow-[0_0_30px_rgba(86,141,255,0.95)]' : 'scale-100'
                }`}
              >
                <span className="text-xs font-black text-white tracking-tighter">
                  R
                </span>
                <span className="animate-ping absolute inset-0 rounded-full bg-[#568DFF] opacity-40" />
                {voiceRipple && (
                  <span className="animate-ping absolute -inset-2.5 rounded-full border-2 border-[#D6ECFF] opacity-80" />
                )}
              </div>

              {/* Right: Microphone button */}
              <span className="text-neutral-400 text-xs cursor-pointer hover:text-white">
                🎙
              </span>
            </div>

            {/* Subtitle quote matching live-inventory-final.jpeg */}
            <span
              className={`text-[9px] text-neutral-400 italic text-center truncate max-w-[320px] transition-all duration-200 ease-out delay-[60ms] ${
                langAnimState === 'exit'
                  ? 'opacity-0 translate-y-1 blur-[2px]'
                  : 'opacity-100 translate-y-0 blur-0'
              } ${
                currentLang.isRTL ? 'font-sans' : ''
              }`}
            >
              {currentLang.quote}
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================
          2. MULTILINGUAL SPATIAL HUD (RIGHT SIDE)
          Consistent with Boardroom Presentation & Live App design system
         =================================================================== */}
      <div
        ref={hudContentRef}
        className="absolute z-50 pointer-events-auto select-none"
        style={hudStyle}
      >
        {/* Soft Organic Atmospheric Wash (Executive Obsidian + Subtle Cyan Glow) */}
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
        <div className="buyer-header-reveal flex items-center justify-between mb-3 border-b border-white/10 pb-2 text-[10px] font-mono tracking-widest text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#568DFF] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#568DFF] shadow-sm shadow-[#568DFF]" />
            </span>
            <span className="font-semibold text-neutral-200 uppercase tracking-wider">
              03 // THE BUYER&apos;S PERSPECTIVE
            </span>
          </div>

          {/* State label near the toggle: Now speaking: [Language] */}
          <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-300 font-mono flex items-center gap-1.5 shadow-sm">
            <span className={`w-1.5 h-1.5 rounded-full bg-[#568DFF] ${voiceRipple ? 'animate-ping' : 'animate-pulse'}`} />
            <span>Now speaking:</span>
            <strong
              className={`text-white font-bold transition-all duration-200 ${
                langAnimState === 'exit'
                  ? 'opacity-0 -translate-y-1 blur-[2px]'
                  : 'opacity-100 translate-y-0 blur-0'
              }`}
            >
              {currentLang.stateLabel}
            </strong>
          </span>
        </div>

        {/* --- OPTICAL MASK SPLIT-REVEAL HERO HEADLINE (PUNCHY) --- */}
        <div className="mb-2">
          {/* Line 1 */}
          <div className="flex flex-wrap items-baseline gap-x-[0.25em]">
            {headlineLine1.map((token, i) => (
              <span key={i} className="inline-flex overflow-hidden pb-1 pt-0.5">
                <span
                  className="buyer-split-word inline-block translate-y-[115%] opacity-0 filter blur-[8px] transform-gpu text-2xl sm:text-3xl md:text-[clamp(1.75rem,2.8vw,2.75rem)] font-bold text-white tracking-tight leading-[1.08]"
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
                  className="buyer-split-word inline-block translate-y-[115%] opacity-0 filter blur-[8px] transform-gpu text-2xl sm:text-3xl md:text-[clamp(1.75rem,2.8vw,2.75rem)] font-bold tracking-tight leading-[1.08] text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-neutral-400"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {token.text}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* --- 1 CLEAN SUB-HEADLINE SENTENCE --- */}
        <div className={`overflow-hidden mb-4 ${stacked ? 'hidden' : ''}`}>
          <p className="buyer-split-sub text-xs sm:text-[13px] md:text-sm text-neutral-400 font-normal leading-relaxed translate-y-[110%] opacity-0 filter blur-[4px]">
            From elevator wait times to offshore currency conversion — answered in real time with native cultural fluency.
          </p>
        </div>

        {/* --- MINIMALIST LANGUAGE SELECTOR TOGGLE BAR (MATCHING BOARDROOM SLIDE 3) --- */}
        <div className="buyer-lang-reveal mb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 px-1">
            <span className="uppercase tracking-wider flex items-center gap-1.5 text-neutral-300 font-semibold">
              <span className="text-[#568DFF]">🌐</span>
              <span>SELECT BUYER DIALECT</span>
            </span>
            <span className="text-[9px] text-neutral-500">SWITCHES LIVE PHONE</span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-neutral-950/80 border border-white/10 backdrop-blur-md">
            {LANGUAGES.map((lang, idx) => {
              const isSelected = activeLangIndex === idx;
              return (
                <button
                  key={lang.id}
                  onClick={() => switchLanguage(idx)}
                  disabled={isSwitchingLang}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border ${
                    isSelected
                      ? 'bg-white text-neutral-950 border-white shadow-[0_4px_20px_rgba(255,255,255,0.15)] scale-[1.02]'
                      : 'bg-transparent text-neutral-400 hover:text-white border-transparent hover:bg-white/5'
                  } ${isSwitchingLang ? 'pointer-events-none' : ''}`}
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  <span className="text-sm">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/*
          The sample answer card is the tallest thing in this panel, and the
          column under the phone cannot carry it. The dialect switcher above it
          still drives the live phone, which is the interaction that matters.
        */}
        <div className={`buyer-showcase-reveal mb-5 ${stacked ? 'hidden' : ''}`}>
          <div
            className={`p-4 rounded-2xl border bg-neutral-900/80 border-white/15 backdrop-blur-xl relative overflow-hidden transition-all duration-260 ease-out shadow-2xl text-left ${
              langAnimState === 'exit'
                ? 'opacity-0 translate-x-2 blur-[4px] scale-[0.98]'
                : 'opacity-100 translate-x-0 blur-0 scale-100'
            }`}
            dir={currentLang.isRTL ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[8px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-300">
                {currentLang.category}
              </span>
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-sky-400 font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
                </span>
                <span>Verified by Rechitta Agent</span>
              </div>
            </div>

            <div className="text-xs sm:text-[13px] font-semibold text-white leading-snug mb-2.5">
              &ldquo;{currentLang.query}&rdquo;
            </div>

            <div className="pt-2.5 border-t border-white/10 text-[11px] text-neutral-300 leading-relaxed flex items-start gap-1.5">
              <span className="text-[#568DFF] text-xs shrink-0 mt-0.5">✦</span>
              <span>
                <strong className="text-white font-semibold">Verified Response:</strong>{' '}
                {currentLang.answer}
              </span>
            </div>
          </div>
        </div>

        {/* --- BOTTOM ACTION CONTROLS --- */}
        <div className="buyer-action-reveal flex flex-row flex-wrap sm:flex-row items-center gap-2.5 sm:gap-3 pt-1">
          <a
            href="https://rechitta.com/buyers"
            target="_blank"
            rel="noreferrer"
            className="flex-1 min-w-0 py-3 sm:py-3.5 px-4 sm:px-5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 text-xs sm:text-[13px] font-bold tracking-tight transition-all flex items-center justify-center gap-2 group shadow-xl hover:shadow-white/10 cursor-pointer text-center"
          >
            <span className="whitespace-nowrap">{stacked ? 'Buyer Experience' : 'Explore Buyer Experience'}</span>
            <span className="text-neutral-600 font-bold transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>

          <button
            onClick={openModal}
            className="w-auto py-3 sm:py-3.5 px-3.5 sm:px-4.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-semibold tracking-tight border border-white/10 hover:border-white/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md"
            title="Open fullscreen sandbox modal"
          >
            <span>⛶</span>
            <span className="whitespace-nowrap">{stacked ? 'Sandbox' : 'Fullscreen Sandbox'}</span>
          </button>
        </div>
      </div>

      {/* ===================================================================
          3. OPTION B: PERSPECTIVE SWITCHER FLOATING DOCK (BUYER -> GLOBAL)
          Docked bottom-center, unlocks flight to Global Analytics / Finale
         =================================================================== */}
      <div
        ref={dockRef}
        className="fixed bottom-[5.5rem] md:bottom-[6rem] left-1/2 -translate-x-1/2 z-50 pointer-events-auto select-none"
      >
        <div
          className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 rounded-full bg-neutral-950/90 backdrop-blur-2xl border transition-all duration-500 shadow-2xl ${
            showScrollPrompt
              ? 'border-blue-500 shadow-[0_0_35px_rgba(86,141,255,0.5)] scale-105'
              : 'border-white/15 hover:border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_20px_rgba(255,255,255,0.05)]'
          }`}
        >
          {/* Left Capsule: Active Scene (Buyer) */}
          <div className="flex items-center gap-2 pr-2.5 border-r border-white/15">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#568DFF] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#568DFF] shadow-sm shadow-[#568DFF]" />
            </span>
            <span className="text-[11px] font-mono font-semibold tracking-wider text-neutral-200 uppercase whitespace-nowrap">
              03 Buyer
            </span>
          </div>

          {/* Center Trajectory Flight Indicator - Sleek Laser Track with Blue Pulse Bead */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-neutral-400 font-mono tracking-widest px-1">
            <span className="w-5 h-px bg-gradient-to-r from-blue-500/40 to-[#568DFF]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#568DFF] shadow-[0_0_8px_#568DFF] animate-pulse" />
            <span className="w-5 h-px bg-gradient-to-r from-[#568DFF] to-blue-500/40" />
          </div>

          {/* Right CTA Button: Advance to Global Reach */}
          <button
            onClick={handleFlyToGlobal}
            className="flex items-center gap-2 px-4.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-[#568DFF] hover:from-blue-500 hover:to-blue-400 text-white text-xs font-semibold tracking-tight transition-all shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group whitespace-nowrap border border-blue-400/30"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            <span>04 Global Reach</span>
            <span className="text-white/80 font-bold transition-transform group-hover:translate-x-1">
              →
            </span>
          </button>
        </div>

        {/* Scroll Locked Floating Tooltip Hint (appears if user attempts to scroll) */}
        {showScrollPrompt && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-neutral-900/95 border border-blue-500/40 text-[10px] font-mono text-neutral-200 whitespace-nowrap shadow-xl animate-bounce">
            ⚡ Click button to advance to Global Reach!
          </div>
        )}
      </div>
    </div>
  );
}
