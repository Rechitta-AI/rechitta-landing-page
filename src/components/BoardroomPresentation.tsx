'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { coverRect } from '@/screens/warp';
import { isPortraitFor } from '@/hooks/useDeviceMode';
import { setHold } from '@/film/holds';

/** Interactive questions on Slide 3 showcasing Rechitta's instant intelligence */
const SLIDE_3_QUESTIONS = [
  {
    chip: 'SPV & Offshore Ownership',
    q: 'Can offshore SPVs purchase Penthouse 4B?',
    a: 'Yes. Fully SPV-compliant via DLD registration with standard offshore holding documentation approved within 24 hours.',
  },
  {
    chip: 'Yield & Payment Terms',
    q: 'What is the projected net yield for Tower 2?',
    a: '7.8% projected net yield based on prime waterfront comps. Includes a 5-year post-handover 0% interest payment plan.',
  },
  {
    chip: 'Elevator & Burj Views',
    q: 'Which units have sunset Burj Khalifa views?',
    a: 'Levels 42-58. West-facing 3-bed duplexes have private high-speed elevators and 270° unobstructed Burj skyline views.',
  },
];

/** The deck shown on the boardroom screen, matching docs/extracted_copy.md */
const SLIDES = [
  {
    id: 1,
    tag: '01 / THE STATUS QUO',
    headline: 'Every project starts with a pitch.',
    body: 'A deck, a brochure, a sales team working the phones. Repeated for every broker, every buyer, every question.',
  },
  {
    id: 2,
    tag: '02 / THE SHIFT',
    headline: 'Rechitta turns that pitch into a briefing.',
    body: 'Upload the project once: media, pricing, floor plans, the story. Every broker gets briefed exactly the same way, instantly.',
  },
  {
    id: 3,
    tag: '03 / INSTANT KNOWLEDGE',
    headline: 'Ask it anything.',
    body: "Payment plans, unit views, handover dates, answered in real time. The way a broker would if they'd built the project themselves.",
  },
  {
    id: 4,
    tag: '04 / THE REALITY',
    headline: "Reaching 40,000 brokers with a 30-person sales team shouldn't take three months.",
    body: 'There are 40,000+ registered brokers in Dubai. A typical sales team of 30 spends about three months trying to reach them all.',
    isInteractive: true,
  },
];

interface BoardroomPresentationProps {
  holdData: React.RefObject<{
    clipIndex: number;
    progress: number;
    startProgress?: number;
    endProgress?: number;
  }>;
}

export default function BoardroomPresentation({ holdData }: BoardroomPresentationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);

  const isVisibleRef = useRef(false);

  // Pure button & keyboard driven slide navigation (decoupled from scroll)
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [streamedText, setStreamedText] = useState(SLIDE_3_QUESTIONS[0].a);
  const [isStreaming, setIsStreaming] = useState(false);

  // Real-Time AI Token Stream when switching questions on Slide 3
  useEffect(() => {
    const fullText = SLIDE_3_QUESTIONS[selectedQuestion].a;
    setStreamedText('');
    setIsStreaming(true);

    let charIndex = 0;
    // Rapid streaming: 2 characters every 14ms (~450ms total for responsive feel)
    const timer = setInterval(() => {
      charIndex += 2;
      if (charIndex >= fullText.length) {
        setStreamedText(fullText);
        setIsStreaming(false);
        clearInterval(timer);
      } else {
        setStreamedText(fullText.slice(0, charIndex));
      }
    }, 14);

    return () => clearInterval(timer);
  }, [selectedQuestion]);

  // Slide 4 interactive state machine
  const [quizState, setQuizState] = useState<'prompt' | 'yes' | 'no'>('prompt');
  const [isUploading, setIsUploading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ==========================================
  // EXACT CALIBRATED VALUES FROM TEST BOARDROOM (relative to 16:9 video frame)
  // ==========================================
  const TOP = 17;
  const LEFT = 29;
  const WIDTH = 43;
  const HEIGHT = 48.6;

  const ROTATE_X = -1.7;
  const ROTATE_Y = 1;
  const ROTATE_Z = 0.3;
  const SCALE = 1.03;

  // The deck is laid out on a fixed reference canvas and scaled to fit, so it
  // stays one piece however large the screen it is painted onto is.
  const LANDSCAPE_BASE = { w: 826, h: 462 };
  /** Portrait needs its own canvas: 826px of reference width scaled down to
   *  fit a phone puts the body copy at about seven pixels. */
  const PORTRAIT_BASE = { w: 430, h: 620 };

  /*
   * On a wide screen the deck is pinned to the display in the footage, which
   * is what sells it as a real briefing. That cannot work on a portrait phone:
   * the shot is 16:9, `object-fit: cover` crops it hard, and the display it
   * is pinned to is mostly off the side of the screen. There the deck comes
   * off the wall and sits flat in the middle instead.
   */
  const flat = isPortraitFor(viewport.width, viewport.height);
  const BASE_W = flat ? PORTRAIT_BASE.w : LANDSCAPE_BASE.w;
  const BASE_H = flat ? PORTRAIT_BASE.h : LANDSCAPE_BASE.h;

  let screenLeft: number;
  let screenTop: number;
  let screenWidth: number;
  let screenHeight: number;

  if (flat) {
    // Room for the header above and the slide controls below.
    const availableW = viewport.width * 0.94;
    const availableH = viewport.height * 0.70;
    const scale = Math.min(availableW / BASE_W, availableH / BASE_H);
    screenWidth = BASE_W * scale;
    screenHeight = BASE_H * scale;
    screenLeft = (viewport.width - screenWidth) / 2;
    screenTop = (viewport.height - screenHeight) / 2 - viewport.height * 0.03;
  } else {
    const rect = coverRect(viewport.width, viewport.height);
    screenLeft = rect.x + (LEFT / 100) * rect.width;
    screenTop = rect.y + (TOP / 100) * rect.height;
    screenWidth = (WIDTH / 100) * rect.width;
    screenHeight = (HEIGHT / 100) * rect.height;
  }

  /*
   * Where the slide controls sit, measured from the top of the screen area.
   *
   * The display in the footage runs from 17% to 65.6% down the frame, its
   * casing ends around 69%, and the credenza starts around 76%. Putting the
   * controls a little over a tenth of the frame below the screen lands them in
   * that gap — clear of the picture, clear of the furniture.
   */
  const controlsTop = flat
    ? screenHeight + 18
    : screenHeight + coverRect(viewport.width, viewport.height).height * 0.055;

  const scaleRatio = screenWidth / BASE_W;
  // A deck lying flat should not carry the wall's perspective.
  const tilt = flat
    ? ''
    : `rotateY(${ROTATE_Y}deg) rotateX(${ROTATE_X}deg) rotateZ(${ROTATE_Z}deg) scale(${SCALE})`;
  // ==========================================

  const slideBy = (direction: -1 | 1) => {
    setActiveSlide((prev) => Math.min(3, Math.max(0, prev + direction)));
  };

  /** Smooth animated slide transition whenever activeSlide updates */
  useEffect(() => {
    // Tell the film which slide is up, however it got here — a scroll step, a
    // dot, or an arrow key — so its own counter cannot drift out of step.
    window.dispatchEvent(
      new CustomEvent('rechitta:beat-sync', { detail: { beat: 'boardroom', step: activeSlide } }),
    );

    if (!slidesRef.current) return;

    // Animate the sliding track with high-end spring ease
    gsap.to(slidesRef.current, {
      x: `-${activeSlide * 25}%`,
      duration: 0.65,
      ease: 'power3.inOut',
      overwrite: 'auto',
    });
  }, [activeSlide]);

  /**
   * Scroll steps drive the deck.
   *
   * A scroll inside this beat turns a slide rather than moving the film. Only
   * once the deck runs out does the next scroll hand off to the hallway, and
   * the film asks for that hand-off through `rechitta:boardroom-upload` so the
   * upload-and-sync choreography still plays either way.
   */
  useEffect(() => {
    const onStep = (e: Event) => {
      const detail = (e as CustomEvent<{ beat?: string; step?: number }>).detail;
      if (detail?.beat !== 'boardroom' || typeof detail.step !== 'number') return;
      if (!isVisibleRef.current) return;
      setActiveSlide(Math.min(SLIDES.length - 1, Math.max(0, detail.step)));
    };

    const onHandOff = () => {
      if (!isVisibleRef.current) {
        window.dispatchEvent(new CustomEvent('rechitta:release'));
        return;
      }
      handleUploadClickRef.current();
    };

    window.addEventListener('rechitta:beat-step', onStep);
    window.addEventListener('rechitta:boardroom-upload', onHandOff);
    return () => {
      window.removeEventListener('rechitta:beat-step', onStep);
      window.removeEventListener('rechitta:boardroom-upload', onHandOff);
    };
  }, []);

  /** Keyboard arrow navigation when boardroom is active */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisibleRef.current) return;
      if (e.key === 'ArrowRight') {
        setActiveSlide((prev) => Math.min(3, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveSlide((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * The deck's last slide asks a question, and the film waits for the answer.
   *
   * Scrolling past it used to carry on to the broker regardless, which made
   * the question decorative. The film asks before every forward move whether
   * a beat is ready to be left; while this one is not, it holds.
   */
  const [nudgeQuiz, setNudgeQuiz] = useState(false);
  useEffect(() => {
    setHold('boardroom', quizState === 'prompt');
  }, [quizState]);

  useEffect(() => {
    // Never leave the film held by an overlay that has gone away.
    return () => setHold('boardroom', false);
  }, []);

  /** The film refused to move on; draw the eye to the question. */
  useEffect(() => {
    const onBlocked = (e: Event) => {
      const detail = (e as CustomEvent<{ beat?: string }>).detail;
      if (detail?.beat !== 'boardroom') return;
      setActiveSlide(SLIDES.length - 1);
      setNudgeQuiz(true);
      window.setTimeout(() => setNudgeQuiz(false), 1400);
    };
    window.addEventListener('rechitta:blocked', onBlocked);
    return () => window.removeEventListener('rechitta:blocked', onBlocked);
  }, []);

  /** Advance from Boardroom scene into the Broker phone scene */
  const handleUploadClick = () => {
    if (isUploading || isSynced) {
      // Already handed off. Let the film move rather than wait on us.
      window.dispatchEvent(new CustomEvent('rechitta:release'));
      return;
    }
    setIsUploading(true);

    // 1. Simulate data indexing & packaging (micro-spinner)
    setTimeout(() => {
      setIsSynced(true);

      // 2. 350ms "sight pause" after notification appears, initiate native hardware video playback flight!
      setTimeout(() => {
        // Immediately dissolve the boardroom slides so the hallway flight is 100% unobstructed
        if (containerRef.current) {
          isVisibleRef.current = false;
          gsap.killTweensOf(containerRef.current);
          gsap.to(containerRef.current, {
            opacity: 0,
            scale: 0.95,
            duration: 0.45,
            ease: 'power2.inOut',
            onComplete: () => {
              if (containerRef.current) gsap.set(containerRef.current, { autoAlpha: 0 });
              setActiveSlide(0);
            },
          });
        }

        window.dispatchEvent(new CustomEvent('rechitta:start-flight'));
      }, 350);
    }, 900);
  };

  const handleUploadClickRef = useRef(handleUploadClick);
  handleUploadClickRef.current = handleUploadClick;

  /** Entrance and Exit visibility watcher */
  useEffect(() => {
    let frame: number;

    const render = () => {
      if (!holdData.current || !containerRef.current) {
        frame = requestAnimationFrame(render);
        return;
      }

      const { clipIndex } = holdData.current;
      const isNowVisible = clipIndex === 0;

      // Detect Entrance
      if (isNowVisible && !isVisibleRef.current) {
        isVisibleRef.current = true;
        gsap.killTweensOf(containerRef.current);
        gsap.set(containerRef.current, { autoAlpha: 1 });

        // Smooth Framer-level Fade & Scale In
        gsap.fromTo(
          containerRef.current,
          { opacity: 0, scale: 0.96 },
          { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }
        );
      }
      // Detect Exit
      else if (!isNowVisible && isVisibleRef.current) {
        isVisibleRef.current = false;
        gsap.killTweensOf(containerRef.current);

        // Smooth Fade Out
        gsap.to(containerRef.current, {
          opacity: 0,
          scale: 0.96,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: () => {
            gsap.set(containerRef.current, { autoAlpha: 0 });
            setActiveSlide(0);
          },
        });
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [holdData]);

  return (
    <div
      ref={containerRef}
      className="absolute pointer-events-none opacity-0 invisible select-none"
      style={{
        top: `${screenTop}px`,
        left: `${screenLeft}px`,
        width: `${screenWidth}px`,
        height: `${screenHeight}px`,
        perspective: '1000px',
        zIndex: 50,
      }}
    >
      {/* The 3D Skewed Presentation Canvas (Proportionally Scaled Reference Canvas) */}
      <div
        className={`overflow-hidden relative pointer-events-auto ${
          flat ? 'rounded-[18px]' : 'rounded-sm'
        }`}
        style={{
          width: `${BASE_W}px`,
          height: `${BASE_H}px`,
          transformOrigin: 'top left',
          transform: `scale(${scaleRatio}) ${tilt}`.trim(),
          transformStyle: 'preserve-3d',
          // Pinned to the wall the deck borrows the lit display underneath it.
          // Lying flat there is nothing under it, so it brings its own.
          ...(flat
            ? {
                background: 'linear-gradient(180deg, #f6f7f9 0%, #e9ecf1 100%)',
                boxShadow: '0 30px 70px -20px rgba(0,0,0,0.75), inset 0 0 0 1px rgba(255,255,255,0.6)',
              }
            : null),
        }}
      >
        {/* Ambient Display Backlight */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-200/50 via-transparent to-transparent opacity-60" />

        {/* Top Header Chrome */}
        <div className="absolute top-3 left-6 right-6 sm:left-8 sm:right-8 z-20 flex items-center justify-between gap-3 border-b border-neutral-900/10 pb-2 pointer-events-none text-[10px] md:text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-neutral-900" />
            <span className="font-semibold text-neutral-800 tracking-wider truncate">
              {/* The narrow canvas has no room for the full slug. */}
              {flat ? 'RECHITTA' : 'RECHITTA // DEVELOPER PRESENTATION'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-neutral-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span>{flat ? 'SYNC READY' : 'DLD INTEGRATED // SYNC READY'}</span>
          </div>
        </div>

        {/* Bottom Footer Chrome */}
        <div className="absolute bottom-2.5 left-6 right-6 sm:left-8 sm:right-8 z-20 flex items-center justify-between gap-3 border-t border-neutral-900/10 pt-1.5 pointer-events-none text-[9px] md:text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
          <span className="truncate">{flat ? 'CONFIDENTIAL' : 'CONFIDENTIAL DEVELOPER DOSSIER'}</span>
          <span className="shrink-0 font-bold text-neutral-800">0{activeSlide + 1} / 04</span>
        </div>

        {/* The Sliding Track (4x width for 4 slides) */}
        <div ref={slidesRef} className="absolute inset-0 w-[400%] h-full flex z-10">
          {SLIDES.map((slide) => (
            <div
              key={slide.id}
              className="w-1/4 h-full flex flex-col items-center justify-center px-8 md:px-12 py-3 text-center relative overflow-hidden"
            >
              {/* Giant Architectural Watermark Numeral */}
              <div
                className="absolute right-4 sm:right-8 -bottom-6 text-[130px] sm:text-[160px] md:text-[190px] font-bold text-neutral-900/[0.035] leading-none select-none pointer-events-none font-mono"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                0{slide.id}
              </div>

              <div
                className="max-w-xl flex flex-col items-center justify-center relative z-10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  transform:
                    slide.id === 4 && quizState !== 'prompt' ? 'translateY(-16px)' : 'translateY(0)',
                }}
              >
                {/* Section eyebrow, on the shared editorial tier. */}
                <div className="mb-2 flex flex-col items-center gap-1.5">
                  <span
                    className="eyebrow text-neutral-500"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {slide.tag}
                  </span>
                  <span className="eyebrow-rule" data-align="center" aria-hidden="true" />
                </div>

                {/* Headline in Clean Editorial Sans (Inter) */}
                <div className="overflow-hidden mb-2">
                  <h2
                    className="text-2xl sm:text-3xl md:text-[2.65rem] lg:text-[2.9rem] font-bold text-neutral-900 tracking-tight leading-[1.12]"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {slide.headline}
                  </h2>
                </div>

                {/* Body in Clean Editorial Sans (Inter) */}
                <p
                  className="text-sm sm:text-[15px] md:text-base text-neutral-600 font-normal leading-relaxed max-w-[34ch] text-balance mb-3"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {slide.body}
                </p>

                {/* SLIDE 1 VISUAL CENTERPIECE: The Unread Document Graveyard */}
                {slide.id === 1 && (
                  <div className="mt-2.5 w-full max-w-md flex flex-col items-center">
                    {/* Simulated Overlapping Document Dossiers */}
                    <div className="relative w-full h-18 flex items-center justify-center">
                      {/* Document 3 (Back / Offset) */}
                      <div className="absolute w-[86%] h-11 bg-neutral-100/80 border border-neutral-200/70 rounded-xl shadow-xs -rotate-2 -translate-y-2 flex items-center px-4 justify-between opacity-50">
                        <span className="text-[10px] text-neutral-400 font-mono truncate">Architectural_Floorplans_2026.dwg</span>
                        <span className="text-[9px] text-neutral-400 font-medium shrink-0">180 MB</span>
                      </div>
                      {/* Document 2 (Middle) */}
                      <div className="absolute w-[93%] h-12 bg-neutral-50/90 border border-neutral-200/80 rounded-xl shadow-xs rotate-1 -translate-y-1 flex items-center px-4 justify-between opacity-80">
                        <span className="text-[10px] text-neutral-500 font-mono truncate">TowerB_Price_Sheet_May_Rev4.xlsx</span>
                        <span className="text-[9px] text-neutral-400 font-medium shrink-0">84 Units</span>
                      </div>
                      {/* Document 1 (Front / Active) */}
                      <div className="absolute w-full h-13 bg-white border border-neutral-200 rounded-xl shadow-md flex items-center px-3.5 justify-between z-10">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-300 text-slate-500 flex items-center justify-center text-[9px] font-bold shrink-0">
                            PDF
                          </div>
                          <div className="flex flex-col text-left overflow-hidden">
                            <span className="text-[11px] md:text-xs font-semibold text-neutral-800 tracking-tight truncate">
                              Master_Launch_Brochure.pdf
                            </span>
                            <span className="text-[9px] text-neutral-400 font-normal">
                              142 Pages • Unindexed • Static
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/80 shrink-0">
                          Unread
                        </span>
                      </div>
                    </div>

                    {/* Warning Stat Pill */}
                    <div className="mt-2.5 flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50/90 border border-sky-200/90 text-[10px] text-sky-800 font-medium shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                      <span>94% of Brokers Never Read It</span>
                      <span className="text-sky-300">•</span>
                      <span>3 Months to Circulate</span>
                    </div>
                  </div>
                )}

                {/* SLIDE 2 VISUAL CENTERPIECE: CAD to Neural Agent Pipeline */}
                {slide.id === 2 && (
                  <div className="mt-2.5 w-full max-w-md p-3 rounded-2xl bg-neutral-50/95 border border-neutral-200/90 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      {/* Left: Raw Project Data */}
                      <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white border border-neutral-200/80 shadow-2xs w-[40%]">
                        <div className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center text-[11px] text-neutral-600 mb-1">
                          📁
                        </div>
                        <span className="text-[10px] md:text-[11px] font-semibold text-neutral-800">Static Files</span>
                        <span className="text-[8px] md:text-[9px] text-neutral-400 mt-0.5">CAD • PDF • Excel</span>
                      </div>

                      {/* Center: Live Neural Transformation */}
                      <div className="flex flex-col items-center justify-center flex-1 px-1">
                        <span className="text-[8px] md:text-[9px] text-sky-600 font-bold uppercase tracking-wider mb-1">
                          Vectorized
                        </span>
                        <div className="w-full h-1 bg-neutral-200 rounded-full relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-neutral-300 via-sky-500 to-sky-400 animate-pulse" />
                        </div>
                        <span className="text-[8px] md:text-[9px] text-neutral-400 font-mono mt-1">12.4s</span>
                      </div>

                      {/* Right: Instant AI Agent */}
                      <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white border border-sky-200/80 shadow-2xs w-[40%] relative">
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center text-[11px] text-sky-600 mb-1">
                          ⚡
                        </div>
                        <span className="text-[10px] md:text-[11px] font-semibold text-sky-900">Rechitta Brain</span>
                        <span className="text-[8px] md:text-[9px] text-sky-600 mt-0.5">40,000 Brokers</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE 3 VISUAL ARTIFACT: 3 Interactive Question Chips + Live AI Response */}
                {slide.id === 3 && (
                  <div className="w-full flex flex-col items-center mt-2">
                    {/* Chips */}
                    <div className="flex flex-wrap justify-center gap-1.5 max-w-lg pointer-events-auto">
                      {SLIDE_3_QUESTIONS.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedQuestion(idx)}
                          className={`px-3 py-1 rounded-full text-[11px] md:text-xs transition-all duration-200 font-medium border cursor-pointer ${selectedQuestion === idx
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs scale-102'
                            : 'bg-white/90 text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:bg-white'
                            }`}
                          style={{ fontFamily: 'var(--font-inter)' }}
                        >
                          {item.chip}
                        </button>
                      ))}
                    </div>

                    {/* Live AI Response Card */}
                    <div className="mt-2.5 max-w-md w-full p-3 rounded-xl bg-neutral-50/95 border border-neutral-200/80 shadow-xs text-left pointer-events-auto min-h-[76px] flex flex-col justify-start">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                          <span className="relative flex h-2 w-2">
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 ${isStreaming ? 'duration-300' : 'duration-1000'
                                }`}
                            />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                          </span>
                          <span
                            className={
                              isStreaming
                                ? 'text-sky-700 font-bold'
                                : 'text-neutral-600 font-semibold'
                            }
                          >
                            {isStreaming
                              ? 'Streaming Vector Knowledge...'
                              : 'Verified by Rechitta Agent'}
                          </span>
                        </div>
                        <span className="text-[9px] text-neutral-400 font-mono tracking-tight">
                          {isStreaming ? '0.04s' : '0.00s latency'}
                        </span>
                      </div>
                      <p
                        className="text-[11px] md:text-xs text-neutral-800 leading-relaxed font-normal"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        {streamedText}
                        {isStreaming && (
                          <span className="inline-block w-1.5 h-3 bg-sky-500 ml-1 translate-y-0.5 animate-pulse" />
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* SLIDE 4: Concept 3 - Slide-Up OS Command Bar (Apple TV / Tesla Style) */}
                {slide.isInteractive && (
                  <div className="w-full flex flex-col items-center pointer-events-auto mt-2 min-h-[116px] justify-center transition-all duration-500 ease-out">
                    {quizState === 'prompt' ? (
                      <div className="flex flex-col items-center gap-2.5 animate-hud-expand">
                        <span
                          className="text-xs md:text-sm font-semibold text-neutral-800 tracking-wide"
                          style={{ fontFamily: 'var(--font-inter)' }}
                        >
                          Think there&apos;s a solution?
                        </span>
                        {/*
                          Matched styling on purpose. The filled-dark "Yes"
                          against an outlined "No" read as an answer already
                          given, which is exactly what this slide must not do.
                        */}
                        <div className="flex items-center gap-3">
                          {(['yes', 'no'] as const).map((choice) => (
                            <button
                              key={choice}
                              onClick={() => setQuizState(choice)}
                              className={`px-7 py-2 rounded-full border text-xs md:text-sm font-semibold capitalize transition-all duration-200 cursor-pointer bg-white/70 hover:bg-white hover:scale-[1.04] active:scale-95 ${
                                nudgeQuiz
                                  ? 'border-[#568DFF] text-neutral-900 shadow-[0_0_0_3px_rgba(86,141,255,0.18)]'
                                  : 'border-neutral-300 text-neutral-700 hover:border-neutral-500 hover:text-neutral-900 shadow-xs'
                              }`}
                              style={{ fontFamily: 'var(--font-inter)' }}
                            >
                              {choice}
                            </button>
                          ))}
                        </div>
                        <span
                          className={`text-[10px] font-medium transition-colors duration-200 ${
                            nudgeQuiz ? 'text-[#3f74e0]' : 'text-neutral-400'
                          }`}
                        >
                          {nudgeQuiz ? 'Pick one to continue' : 'Select an option to activate deployment OS'}
                        </span>
                      </div>
                    ) : (
                      /* CONCEPT 3: SLIDE-UP OS COMMAND BAR (APPLE TV / TESLA STYLE) */
                      <div className="w-full max-w-lg flex flex-col items-center animate-slide-up-dock">
                        {/* Architectural Verdict Pill */}
                        <div className="mb-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-950 text-[11px] md:text-xs font-medium flex items-center gap-1.5 animate-fade-in text-center shadow-xs">
                          <span className="text-blue-600 font-bold">
                            {quizState === 'yes' ? '✓ Instinct Confirmed:' : '⚡ Bottleneck Solved:'}
                          </span>
                          <span className="text-neutral-700">
                            {quizState === 'yes'
                              ? '12-second instant AI briefing replaces 3 months of manual WhatsApp outreach.'
                              : 'Rechitta replaces 3 months of sales lag with 40,000 live conversational agents.'}
                          </span>
                        </div>

                        {/* Floating Low-Profile OS Command Bar Dock */}
                        <div
                          className="w-full h-14 px-3 sm:px-4 rounded-2xl bg-neutral-950 text-white shadow-2xl flex items-center justify-between border border-neutral-800/80 relative overflow-hidden"
                          style={{
                            boxShadow:
                              '0 20px 40px -10px rgba(0, 0, 0, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)',
                          }}
                        >
                          {/* Left: System Status & Intelligence */}
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#568DFF] opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#568DFF] shadow-sm shadow-[#568DFF]/80" />
                            </span>
                            <div className="flex flex-col text-left overflow-hidden">
                              <span className="text-[9px] tracking-widest font-bold uppercase text-[#568DFF] leading-none">
                                {quizState === 'yes' ? 'SYSTEM READY' : 'AGENTS ARMED'}
                              </span>
                              <span className="text-[11px] font-medium text-neutral-300 truncate mt-0.5 leading-none">
                                {quizState === 'yes' ? '40,000 Brokers Live' : 'Instant 0s Response'}
                              </span>
                            </div>
                          </div>

                          {/* Subtle Divider */}
                          <div className="h-6 w-px bg-neutral-800 shrink-0 mx-1 sm:mx-2 hidden xs:block" />

                          {/* Right: Master Action CTA & Reset */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={handleUploadClick}
                              disabled={isUploading || isSynced}
                              className="py-2 px-3.5 sm:px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 text-xs sm:text-[13px] font-semibold tracking-tight hover:shadow-md active:scale-98 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer relative overflow-hidden group shadow-sm disabled:opacity-80"
                              style={{ fontFamily: 'var(--font-inter)' }}
                            >
                              {/* Shimmer on hover */}
                              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                              {isSynced ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-[#568DFF]" />
                                  <span>Synced Worldwide ✓</span>
                                </>
                              ) : isUploading ? (
                                <>
                                  <span className="w-3.5 h-3.5 border-2 border-neutral-400 border-t-neutral-950 rounded-full animate-spin" />
                                  <span>Broadcasting to 40k Brokers...</span>
                                </>
                              ) : (
                                <>
                                  <span className="hidden sm:inline">Upload Project Data & Deploy Agents</span>
                                  <span className="sm:hidden">Deploy Agents</span>
                                  <span className="text-[#568DFF] font-bold text-sm">→</span>
                                </>
                              )}
                            </button>

                            {/* Reset Control Button */}
                            <button
                              onClick={() => setQuizState('prompt')}
                              title="Reset"
                              className="w-7 h-7 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer text-xs shrink-0"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Trust Footnote */}
                        <div className="mt-1.5 flex items-center justify-center gap-3 text-[9px] md:text-[10px] text-neutral-400 font-medium animate-fade-in">
                          <span>✓ DLD Verified</span>
                          <span>•</span>
                          <span>✓ Instant Briefing</span>
                          <span>•</span>
                          <span>✓ 0s Latency</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/*
        The slide controls, in the gap between the display and the credenza.

        The canvas overflows this container by design — it is a fixed reference
        size scaled down — so they cannot simply follow it in flow, and are
        placed against the screen's painted height instead.
      */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-auto"
        style={{ top: `${controlsTop}px`, zIndex: 100 }}
      >
        <div
          className="flex items-center gap-1 rounded-full px-1.5 py-1.5 shadow-[0_12px_36px_-12px_rgba(0,0,0,0.7)]"
          style={{
            background: 'rgba(12, 16, 24, 0.55)',
            backdropFilter: 'blur(18px) saturate(160%)',
            WebkitBackdropFilter: 'blur(18px) saturate(160%)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
          }}
        >
          <button
            onClick={() => slideBy(-1)}
            disabled={activeSlide === 0}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] leading-none transition-all duration-200 ${
              activeSlide === 0
                ? 'text-white/25'
                : 'text-white/80 hover:bg-white/12 hover:text-white active:scale-90 cursor-pointer'
            }`}
            aria-label="Previous slide"
          >
            ←
          </button>

          <div className="flex items-center gap-1.5 px-2">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => setActiveSlide(i)}
                className="h-1.5 rounded-full transition-all duration-[400ms] ease-out cursor-pointer"
                style={{
                  width: i === activeSlide ? '1.5rem' : '0.375rem',
                  backgroundColor: i === activeSlide ? '#8FB4FF' : '#ffffff',
                  opacity: i === activeSlide ? 1 : 0.3,
                }}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === activeSlide}
              />
            ))}
          </div>

          <button
            onClick={() => slideBy(1)}
            disabled={activeSlide === SLIDES.length - 1}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] leading-none transition-all duration-200 ${
              activeSlide === SLIDES.length - 1
                ? 'text-white/25'
                : 'text-white/80 hover:bg-white/12 hover:text-white active:scale-90 cursor-pointer'
            }`}
            aria-label="Next slide"
          >
            →
          </button>
        </div>
      </div>

    </div>
  );
}
