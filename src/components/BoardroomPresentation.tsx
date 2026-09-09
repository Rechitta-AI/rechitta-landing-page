'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { coverRect } from '@/screens/warp';
import { isPortraitFor } from '@/hooks/useDeviceMode';
import { setHold } from '@/film/holds';
import ClickPrompt from './ClickPrompt';
import BuilderCarousel, { BuilderMarquee } from './BuilderCarousel';

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
    /*
     * No body on purpose. It restated the headline's own numbers back at the
     * viewer, and on the one slide that asks for a click it was three lines of
     * reading between the question and the buttons.
     */
    body: '',
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
  /*
   * The builders' reel lives outside the screen container.
   *
   * It cannot be a child of it: the entrance scales that container, which
   * would make it a containing block for anything fixed inside, and the reel
   * is placed against the footage rather than against the display. It fades
   * on the same cues instead.
   */
  const reelRef = useRef<HTMLDivElement>(null);

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
  /*
   * On both wide and portrait screens, the presentation is pinned directly
   * to the 4K OLED display mounted on the boardroom wall in the footage.
   * There is NO separate pop-out modal or floating card.
   */
  const isPortrait = isPortraitFor(viewport.width, viewport.height);
  const BASE_W = LANDSCAPE_BASE.w;
  const BASE_H = LANDSCAPE_BASE.h;

  // Where the 16:9 footage actually lands in the viewport. Everything placed
  // against the room — the screen, the arrows on the wall, the builders' reel
  // — is measured off this rather than off the viewport.
  const rect = coverRect(viewport.width, viewport.height);

  const screenLeft = rect.x + (LEFT / 100) * rect.width;
  const screenTop = rect.y + (TOP / 100) * rect.height;
  const screenWidth = (WIDTH / 100) * rect.width;
  const screenHeight = (HEIGHT / 100) * rect.height;

  /*
   * Where the slide controls sit, measured from the top of the screen area.
   *
   * The display in the footage runs from 17% to 65.6% down the frame, its
   * casing ends around 69%, and the credenza starts around 76%. Putting the
   * controls a little over a tenth of the frame below the screen lands them in
   * that gap — clear of the picture, clear of the furniture.
   */
  const controlsTop = isPortrait ? screenHeight + 14 : screenHeight + rect.height * 0.055;

  /*
   * The arrows on the wall.
   *
   * The beige panel the display is mounted on runs from about 15.5% to 29% of
   * the frame on the left and mirrors that on the right. Half of that gap out
   * from the screen's edge puts each arrow in the middle of its own panel,
   * clear of both the bezel and the windows beyond it.
   */
  const armOffset = rect.width * 0.065;
  const armSize = Math.min(80, Math.max(56, rect.width * 0.04));

  /*
   * The builders' reel, over the window on the far left.
   */
  const reelWidth = Math.min(230, Math.max(150, rect.width * 0.125));
  const reelLeft = Math.max(16, rect.x + rect.width * 0.022);
  const reelCentreY = rect.y + rect.height * 0.42;
  const reelHeight = Math.min(rect.height * 0.34, 280);

  /*
   * A viewport far taller than 16:9 crops the footage hard from the sides, and
   * the outboard strip the reel wants stops existing. Rather than let it slide
   * under the arrow — or off the edge — it steps out until there is room.
   */
  const reelFits = !isPortrait && screenLeft - armOffset - armSize / 2 - (reelLeft + reelWidth) >= 16;

  const scaleRatio = screenWidth / BASE_W;
  const tilt = `rotateY(${ROTATE_Y}deg) rotateX(${ROTATE_X}deg) rotateZ(${ROTATE_Z}deg) scale(${SCALE})`;
  // ==========================================

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
        const leaving = [containerRef.current, reelRef.current].filter(Boolean);
        if (leaving.length) {
          isVisibleRef.current = false;
          gsap.killTweensOf(leaving);
          gsap.to(leaving, {
            opacity: 0,
            scale: 0.95,
            duration: 0.45,
            ease: 'power2.inOut',
            onComplete: () => {
              gsap.set(leaving, { autoAlpha: 0 });
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

  const slideBy = (direction: -1 | 1) => {
    if (direction === -1 && activeSlide === 0) {
      // Navigate back to Scene 1 (Dawn / Hero)
      window.dispatchEvent(new CustomEvent('rechitta:jump-to-beat', { detail: { index: 0 } }));
      return;
    }
    if (direction === 1 && activeSlide === SLIDES.length - 1) {
      // Navigate forward to Broker scene
      handleUploadClick();
      return;
    }
    setActiveSlide((prev) => Math.min(3, Math.max(0, prev + direction)));
  };

  const slideByRef = useRef(slideBy);
  slideByRef.current = slideBy;

  // Touch swipe support for changing slides on mobile & tablet
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isPortrait) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isPortrait || touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) {
        slideBy(1);
      } else {
        slideBy(-1);
      }
    }
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
        slideByRef.current(1);
      } else if (e.key === 'ArrowLeft') {
        slideByRef.current(-1);
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
      // The deck and the reel arrive and leave together.
      const panels = [containerRef.current, reelRef.current].filter(Boolean);

      // Detect Entrance
      if (isNowVisible && !isVisibleRef.current) {
        isVisibleRef.current = true;
        gsap.killTweensOf(panels);
        gsap.set(panels, { autoAlpha: 1 });

        // Smooth Framer-level Fade & Scale In
        gsap.fromTo(
          panels,
          { opacity: 0, scale: 0.96 },
          { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }
        );
      }
      // Detect Exit
      else if (!isNowVisible && isVisibleRef.current) {
        isVisibleRef.current = false;
        gsap.killTweensOf(panels);

        // Smooth Fade Out
        gsap.to(panels, {
          opacity: 0,
          scale: 0.96,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: () => {
            gsap.set(panels, { autoAlpha: 0 });
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
    <>
      {/*
        Who the deck is actually about. On a portrait screen the deck comes off
        the wall and fills the viewport, so there is nowhere to put this.
      */}
      {reelFits && (
        <div
          ref={reelRef}
          className="absolute pointer-events-none opacity-0 invisible select-none"
          style={{ left: `${reelLeft}px`, top: `${reelCentreY}px`, zIndex: 49 }}
        >
          {/* The centring lives on its own element: the fade tweens the
              wrapper's transform, and would eat a translate set alongside it. */}
          <div style={{ transform: 'translateY(-50%)' }}>
            <BuilderCarousel width={reelWidth} height={reelHeight} />
          </div>
        </div>
      )}

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
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="overflow-hidden relative pointer-events-auto rounded-sm"
        style={{
          width: `${BASE_W}px`,
          height: `${BASE_H}px`,
          transformOrigin: 'top left',
          transform: `scale(${scaleRatio}) ${tilt}`.trim(),
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Ambient Display Backlight */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-200/50 via-transparent to-transparent opacity-60" />

        {/* Top Header Chrome */}
        <div
          className={`absolute top-3.5 z-20 flex items-center justify-between gap-3 border-b border-neutral-900/10 pb-1.5 pointer-events-none text-[10px] md:text-[11px] font-mono tracking-widest text-neutral-400 uppercase ${
            isPortrait
              ? 'left-1/2 -translate-x-1/2 w-[82%] max-w-[400px]'
              : 'left-6 right-6 sm:left-8 sm:right-8'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-neutral-900" />
            <span className="font-semibold text-neutral-800 tracking-wider truncate">
              {isPortrait ? 'RECHITTA // BOARDROOM' : 'RECHITTA // DEVELOPER PRESENTATION'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-neutral-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isPortrait ? 'SYNC READY' : 'DLD INTEGRATED // SYNC READY'}</span>
          </div>
        </div>

        {/* Bottom Footer Chrome */}
        <div
          className={`absolute bottom-3 z-20 flex items-center justify-between gap-3 border-t border-neutral-900/10 pt-1.5 pointer-events-none text-[9px] md:text-[10px] font-mono tracking-widest text-neutral-400 uppercase ${
            isPortrait
              ? 'left-1/2 -translate-x-1/2 w-[82%] max-w-[400px]'
              : 'left-6 right-6 sm:left-8 sm:right-8'
          }`}
        >
          <span className="truncate">{isPortrait ? 'CONFIDENTIAL' : 'CONFIDENTIAL DEVELOPER DOSSIER'}</span>
          <span className="shrink-0 font-bold text-neutral-800">0{activeSlide + 1} / 04</span>
        </div>

        {/* The Sliding Track (4x width for 4 slides) */}
        <div ref={slidesRef} className="absolute inset-0 w-[400%] h-full flex z-10">
          {SLIDES.map((slide) => (
            <div
              key={slide.id}
              className="w-1/4 h-full flex flex-col items-center justify-center px-4 md:px-12 py-3 text-center relative overflow-hidden"
            >
              {/* Giant Architectural Watermark Numeral */}
              <div
                className={`absolute -bottom-6 text-[120px] sm:text-[160px] md:text-[190px] font-bold text-neutral-900/[0.035] leading-none select-none pointer-events-none font-mono ${
                  isPortrait ? 'right-1/2 translate-x-1/2' : 'right-4 sm:right-8'
                }`}
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                0{slide.id}
              </div>

              <div
                className="w-full max-w-[410px] md:max-w-xl flex flex-col items-center justify-center relative z-10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
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

                {/* Body in Clean Editorial Sans (Inter). Slide 4 has none. */}
                {slide.body && (
                  <p
                    className="text-sm sm:text-[15px] md:text-base text-neutral-600 font-normal leading-relaxed max-w-[34ch] text-balance mb-3"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {slide.body}
                  </p>
                )}

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
                    <div className="mt-2 max-w-md w-full p-2.5 sm:p-3 rounded-xl bg-neutral-50/95 border border-neutral-200/80 shadow-xs text-left pointer-events-auto min-h-[64px] sm:min-h-[76px] flex flex-col justify-start">
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

                {/*
                  SLIDE 4: the question, then the one thing to press.

                  This used to answer itself. Both branches paid out a full
                  sentence of explanation inside a pill, above a status dock
                  carrying a second headline, a status line, a footnote row and
                  the button - so the control the film is actually waiting on
                  was the smallest thing on the slide. Now the branch is four
                  words and the call to action is the only object under it.
                */}
                {slide.isInteractive && (
                  <div className="w-full flex flex-col items-center pointer-events-auto mt-1 min-h-[128px] justify-center transition-all duration-500 ease-out">
                    {quizState === 'prompt' ? (
                      <div className="flex flex-col items-center gap-4 animate-hud-expand">
                        <span
                          className="text-sm md:text-base font-semibold text-neutral-800 tracking-tight"
                          style={{ fontFamily: 'var(--font-inter)' }}
                        >
                          Think there&apos;s a solution?
                        </span>

                        {/*
                          Matched styling on purpose. The filled-dark "Yes"
                          against an outlined "No" read as an answer already
                          given, which is exactly what this slide must not do.
                        */}
                        <div className="relative flex items-center gap-3.5">
                          <ClickPrompt
                            label={nudgeQuiz ? 'Pick one to continue' : 'Choose one to continue'}
                            visible
                            placement="bottom"
                            urgent={nudgeQuiz}
                          />
                          {(['yes', 'no'] as const).map((choice) => (
                            <button
                              key={choice}
                              onClick={() => setQuizState(choice)}
                              className={`min-w-[6.5rem] px-9 py-3 rounded-full border-2 text-base md:text-lg font-bold capitalize transition-all duration-200 cursor-pointer bg-white hover:scale-[1.05] active:scale-95 ${
                                nudgeQuiz
                                  ? 'border-[#568DFF] text-neutral-900 shadow-[0_0_0_4px_rgba(86,141,255,0.2)]'
                                  : 'border-neutral-300 text-neutral-800 hover:border-neutral-900 hover:text-neutral-900 shadow-sm hover:shadow-md'
                              }`}
                              style={{ fontFamily: 'var(--font-inter)' }}
                            >
                              {choice}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* gap-12 rather than a tighter one: the click prompt
                         needs a lane of its own between the line and the
                         button, or it sits on the line's descenders. */
                      <div className="w-full max-w-lg flex flex-col items-center gap-6 sm:gap-12 animate-slide-up-dock">
                        {/* The whole branch, in one line. */}
                        <p
                          className="text-lg md:text-xl font-bold text-neutral-900 tracking-tight text-center"
                          style={{ fontFamily: 'var(--font-inter)' }}
                        >
                          {quizState === 'yes' ? 'Exactly. ' : 'There is. '}
                          <span className="text-[#3f74e0]">It&apos;s Rechitta.</span>
                        </p>

                        <div className="relative">
                          <ClickPrompt
                            label="Click to deploy"
                            visible={!isUploading && !isSynced}
                            placement="top"
                            urgent
                          />
                          <button
                            onClick={handleUploadClick}
                            disabled={isUploading || isSynced}
                            className="px-7 sm:px-9 py-3.5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white text-sm sm:text-base font-bold tracking-tight active:scale-[0.97] transition-all flex items-center gap-2.5 cursor-pointer relative overflow-hidden group disabled:cursor-default disabled:opacity-90"
                            style={{
                              fontFamily: 'var(--font-inter)',
                              boxShadow:
                                '0 18px 34px -12px rgba(0,0,0,0.55), inset 0 1px 1px 0 rgba(255,255,255,0.14)',
                            }}
                          >
                            {/* Shimmer on hover */}
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/18 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                            {isSynced ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-[#568DFF]" />
                                <span>Synced worldwide</span>
                              </>
                            ) : isUploading ? (
                              <>
                                <span className="w-4 h-4 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
                                <span>Broadcasting...</span>
                              </>
                            ) : (
                              <>
                                <span className="relative flex h-2 w-2 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#568DFF] opacity-75" />
                                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#568DFF]" />
                                </span>
                                <span>Brief 40,000 brokers</span>
                                <span className="text-[#8FB4FF] font-bold transition-transform group-hover:translate-x-0.5">
                                  &rarr;
                                </span>
                              </>
                            )}
                          </button>
                        </div>

                        {!isUploading && !isSynced && (
                          <button
                            onClick={() => setQuizState('prompt')}
                            className="-mt-8 text-[10px] font-medium text-neutral-500 underline underline-offset-2 decoration-neutral-300 hover:text-neutral-800 transition-colors cursor-pointer"
                          >
                            Ask me again
                          </button>
                        )}
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
        className="absolute left-0 right-0 flex flex-col items-center gap-3.5 pointer-events-auto"
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
          {/* Portrait keeps its arrows here: there is no wall to put them on. */}
          {isPortrait && (
            <button
              onClick={() => slideBy(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] leading-none transition-all duration-200 text-white/80 hover:bg-white/12 hover:text-white active:scale-90 cursor-pointer"
              aria-label={activeSlide === 0 ? 'Return to Dawn' : 'Previous slide'}
              title={activeSlide === 0 ? 'Return to Dawn' : 'Previous slide'}
            >
              ←
            </button>
          )}

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

          {isPortrait && (
            <button
              onClick={() => slideBy(1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] leading-none transition-all duration-200 text-white/80 hover:bg-white/12 hover:text-white active:scale-90 cursor-pointer"
              aria-label={activeSlide === SLIDES.length - 1 ? 'Enter Hallway' : 'Next slide'}
              title={activeSlide === SLIDES.length - 1 ? 'Enter Hallway' : 'Next slide'}
            >
              →
            </button>
          )}
        </div>

        {isPortrait && (
          <div className="w-full max-w-sm px-4">
            <BuilderMarquee />
          </div>
        )}
      </div>

      {/*
        The arrows, on the wall either side of the display.

        They are placed against the screen's own painted box rather than laid
        out in flow, for the same reason the dots are: the deck inside is a
        fixed reference canvas scaled to fit, so it overflows this container
        and nothing can simply follow it.
      */}
      {!isPortrait &&
        ([
          {
            dir: -1 as const,
            glyph: '←',
            label: activeSlide === 0 ? 'Return to Dawn' : 'Previous slide',
            at: -armOffset,
          },
          {
            dir: 1 as const,
            glyph: '→',
            label: activeSlide === SLIDES.length - 1 ? 'Enter Hallway' : 'Next slide',
            at: screenWidth + armOffset,
          },
        ]).map((arm) => (
          <button
            key={arm.dir}
            onClick={() => slideBy(arm.dir)}
            className="absolute flex items-center justify-center rounded-full transition-all duration-200 pointer-events-auto text-white/85 hover:text-white active:scale-90 cursor-pointer"
            style={{
              left: `${arm.at}px`,
              top: '50%',
              width: `${armSize}px`,
              height: `${armSize}px`,
              transform: 'translate(-50%, -50%)',
              fontSize: `${Math.round(armSize * 0.42)}px`,
              lineHeight: 1,
              zIndex: 100,
              background: 'rgba(12, 16, 24, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              backdropFilter: 'blur(18px) saturate(160%)',
              WebkitBackdropFilter: 'blur(18px) saturate(160%)',
              boxShadow: '0 16px 40px -14px rgba(0,0,0,0.8)',
            }}
            aria-label={arm.label}
            title={arm.label}
          >
            {arm.glyph}
          </button>
        ))}

    </div>
    </>
  );
}
