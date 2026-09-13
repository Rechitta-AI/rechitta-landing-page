'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { coverRect } from '@/screens/warp';
import { isPortraitFor } from '@/hooks/useDeviceMode';
import { setHold } from '@/film/holds';
import ClickPrompt from './ClickPrompt';
import DeckDock from './DeckDock';
import WallLogoReel, {
  BuilderMarquee,
  DEVELOPER_LOGOS,
  PROJECT_LOGOS,
} from './BuilderCarousel';

/*
 * The briefing calendar on Slide 1: six months of appointments, booked solid
 * and still nowhere near the whole network.
 */
const CALENDAR_AGENCIES = [
  { name: 'Betterhomes', day: 1, slot: 0 },
  { name: 'Allsopp', day: 1, slot: 2 },
  { name: 'Espace', day: 2, slot: 1 },
  { name: 'Driven', day: 2, slot: 3 },
  { name: 'Provident', day: 3, slot: 0 },
  { name: 'haus & haus', day: 3, slot: 2 },
  { name: 'Metropolitan', day: 4, slot: 1 },
  { name: 'fäm', day: 4, slot: 3 },
  { name: 'Union Square', day: 5, slot: 0 },
  { name: '+ 1,191 more', day: 5, slot: 2, overflow: true },
];

/*
 * The relay on Slide 2. Each hop keeps less of the briefing than the one
 * before it, and the ring is drawn to match.
 */
const LANGUAGE_RELAY = [
  { label: 'Developer', loses: 'Speaks one language', solid: true },
  { label: 'Brokers', loses: 'Loses confidence', solid: false },
  { label: 'Buyers', loses: 'Loses trust', solid: false },
];

/** The deck shown on the boardroom screen: today's briefing problems, then the fix. */
const SLIDES = [
  {
    id: 1,
    tag: '01 / SCHEDULING',
    headline: 'Time crunch, availability issues.',
    body: '40,000 brokers of Dubai, 1,200 agencies - briefing them is six months of scheduling and presenting.',
  },
  {
    id: 2,
    tag: '02 / LANGUAGE',
    headline: 'Language.',
    body: 'Urgently need Chinese, Russian and Arabic presenters. And a brochure in all languages.',
  },
  {
    id: 3,
    tag: '03 / FEEDBACK',
    headline: 'No proper way to clear brokers\u2019 queries',
    body: 'and understand the pulse of the market about our project.',
  },
  {
    id: 4,
    tag: '04 / THE SOLUTION',
    headline: 'Competitors are already using this; we should use it too.',
    /*
     * No body. The one line under the headline is the product name and the
     * promise, and it is set as part of the slide rather than as body copy so
     * the button below it stays the largest object on the slide.
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
  // Slide 4 hand-off state machine
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

  /*
   * The deck is laid out on a fixed reference canvas and scaled to fit, so it
   * stays one piece however large the surface it is painted onto is.
   *
   * Two canvases, because the deck is doing two different jobs. On a wide
   * screen it is pinned to the 4K display on the boardroom wall and has to be
   * that display's 16:9 shape. On a portrait screen the footage crops so hard
   * that the display runs off both sides of the viewport — the shot is 16:9
   * and the phone holding it is not — so the deck comes off the wall and
   * stands on its own as a centred card, and a card wants a portrait shape.
   */
  const LANDSCAPE_BASE = { w: 826, h: 462 };
  const PORTRAIT_BASE = { w: 520, h: 680 };
  const isPortrait = isPortraitFor(viewport.width, viewport.height);
  const BASE_W = isPortrait ? PORTRAIT_BASE.w : LANDSCAPE_BASE.w;
  const BASE_H = isPortrait ? PORTRAIT_BASE.h : LANDSCAPE_BASE.h;

  // Where the 16:9 footage actually lands in the viewport. Everything placed
  // against the room — the screen, the wall reels — is measured off this
  // rather than off the viewport.
  const rect = coverRect(viewport.width, viewport.height);

  /*
   * Painted size.
   *
   * Landscape takes it from the footage, because it is tracking a real object
   * in the shot. Portrait takes it from the viewport, because it is not: it
   * used to take 43% of the *footage* width there too, and a portrait
   * viewport's covering rect is its own height times 16/9, so on a 390pt
   * phone the deck came out 645pt wide and ran off both edges.
   */
  const screenWidth = isPortrait
    ? Math.min(
        viewport.width - 28,
        PORTRAIT_BASE.w,
        // And short viewports are capped by height, not width: an iPhone SE
        // has the width for a 454pt card and nowhere to put the controls and
        // the marquee underneath it. 230 is that furniture plus the rail.
        ((viewport.height - 230) * PORTRAIT_BASE.w) / PORTRAIT_BASE.h,
      )
    : (WIDTH / 100) * rect.width;
  const screenHeight = isPortrait
    ? screenWidth * (BASE_H / BASE_W)
    : (HEIGHT / 100) * rect.height;
  const screenLeft = isPortrait
    ? (viewport.width - screenWidth) / 2
    : rect.x + (LEFT / 100) * rect.width;
  /*
   * Portrait centres the whole stack — the card, the controls under it and the
   * marquee under those — rather than starting it 17% down as if it were still
   * tracking the display.
   */
  const portraitStackHeight = screenHeight + 120;
  const screenTop = isPortrait
    ? Math.max(viewport.height * 0.08, (viewport.height - portraitStackHeight) / 2)
    : rect.y + (TOP / 100) * rect.height;

  /*
   * Where the slide controls sit, measured from the top of the screen area.
   *
   * The display in the footage runs from 17% to 65.6% down the frame, its
   * casing ends around 69%, and the credenza starts around 76%. That gap is
   * where these go — clear of the picture, clear of the furniture.
   *
   * They sit at the top of it rather than the middle: the orb parks on the
   * credenza through the whole deck, and the scale floor made it large enough
   * to reach up into the space these used to occupy.
   */
  const controlsTop = isPortrait ? screenHeight + 14 : screenHeight + rect.height * 0.035;

  /*
   * The two wall panels the display is mounted between.
   *
   * Measured off the park frame rather than judged by eye: the wall is a flat
   * painted surface and the glazing either side of it carries city lights, so
   * scanning a column's variance down the frame separates them cleanly. The
   * flat runs are 16.8%-27.2% on the left and 74.9%-83.8% on the right. The
   * numbers these replace started at 14.5% and ran to 85.5%, both of which are
   * out in the glass, which is why marks were drifting off the wall.
   */
  const WALL_L = { from: 0.168, to: 0.272 };
  const WALL_R = { from: 0.749, to: 0.838 };
  /* How much of each panel stays clear either side of the strip. Tighter than
     the finale's, because these marks stand on the wall with no tile under
     them and want the room. */
  const WALL_INSET = 0.08;
  const MAX_REEL_W = 168;

  /* Clamped to what is actually on screen: a viewport narrower than 16:9 crops
     the footage, and part of a wall can be off the edge of it. */
  const wallRun = (w: { from: number; to: number }) => {
    const x0 = Math.max(rect.x + w.from * rect.width, 8);
    const x1 = Math.min(rect.x + w.to * rect.width, viewport.width - 8);
    return { x0, width: Math.max(0, x1 - x0) };
  };
  const leftRun = wallRun(WALL_L);
  const rightRun = wallRun(WALL_R);

  const WALL_TOP = 0.08;
  const WALL_BOTTOM = 0.745;
  const wallTop = rect.y + WALL_TOP * rect.height;
  const wallHeight = (WALL_BOTTOM - WALL_TOP) * rect.height;

  /* One width for both, taken from the narrower panel so the two sides match
     even though the camera does not see them equally. */
  const reelWidth = Math.min(
    MAX_REEL_W,
    Math.min(leftRun.width, rightRun.width) * (1 - 2 * WALL_INSET),
  );
  const leftWall = { left: leftRun.x0 + (leftRun.width - reelWidth) / 2, width: reelWidth };
  const rightWall = { left: rightRun.x0 + (rightRun.width - reelWidth) / 2, width: reelWidth };

  /* Too little wall left on screen to stand anything on. */
  const wallsFit = !isPortrait && reelWidth >= 76;

  const isSolutionSlide = activeSlide === SLIDES.length - 1;

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

    /*
      The track moves as one piece, on the GPU. `force3D` keeps it on a
      composited layer for the whole tween rather than promoting and demoting
      it at each end, which was showing up as a hitch on the first frame.
    */
    gsap.to(slidesRef.current, {
      xPercent: -activeSlide * 25,
      duration: 0.78,
      ease: 'power2.inOut',
      overwrite: 'auto',
      force3D: true,
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
   * The deck's last slide hands the project over, and the film waits for it.
   *
   * Scrolling past it used to carry on to the broker regardless, which made
   * the button decorative. The film asks before every forward move whether a
   * beat is ready to be left; until the project is sent, this one is not.
   */
  const [nudgeCta, setNudgeCta] = useState(false);
  useEffect(() => {
    setHold('boardroom', !isUploading && !isSynced);
  }, [isUploading, isSynced]);

  useEffect(() => {
    // Never leave the film held by an overlay that has gone away.
    return () => setHold('boardroom', false);
  }, []);

  /** The film refused to move on; draw the eye to the button. */
  useEffect(() => {
    const onBlocked = (e: Event) => {
      const detail = (e as CustomEvent<{ beat?: string }>).detail;
      if (detail?.beat !== 'boardroom') return;
      setActiveSlide(SLIDES.length - 1);
      setNudgeCta(true);
      window.setTimeout(() => setNudgeCta(false), 1400);
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
        Who the deck is about, and what they have built — running up the walls
        either side of the display. On a portrait screen the deck comes off the
        wall and fills the viewport, so there are no panels to run them up and
        the marquee in the control dock stands in for both.

        One wrapper for both strips: the entrance and exit tween it alongside
        the deck, and it has to be a single element for that.
      */}
      {wallsFit && (
        <div
          ref={reelRef}
          className="absolute inset-0 pointer-events-none opacity-0 invisible select-none"
          style={{ zIndex: 49 }}
        >
          <div
            className="absolute"
            style={{ left: `${leftWall.left}px`, top: `${wallTop}px` }}
          >
            <WallLogoReel
              logos={DEVELOPER_LOGOS}
              width={leftWall.width}
              height={wallHeight}
              duration={34}
              bare
            />
          </div>

          {/* The project set, standing in as the developer list until project
              artwork lands in `public/project_logos/`. */}
          <div
            className="absolute"
            style={{ left: `${rightWall.left}px`, top: `${wallTop}px` }}
          >
            <WallLogoReel
              logos={PROJECT_LOGOS}
              width={rightWall.width}
              height={wallHeight}
              duration={41}
              bare
            />
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
        className="overflow-hidden pointer-events-auto rounded-sm"
        style={{
          width: `${BASE_W}px`,
          height: `${BASE_H}px`,
          position: isPortrait ? 'absolute' : 'relative',
          left: isPortrait ? '50%' : undefined,
          top: 0,
          transformOrigin: isPortrait ? 'center top' : 'top left',
          transform: isPortrait
            ? `translateX(-50%) scale(${scaleRatio}) rotateX(${ROTATE_X}deg) scale(${SCALE})`
            : `scale(${scaleRatio}) ${tilt}`.trim(),
          transformStyle: 'preserve-3d',
        }}
      >
        {/*
          The paper the deck is printed on.

          A flat white panel on a wall screen has nothing for the eye to catch,
          which is most of why the slides read as a screenshot. A hairline
          measure across the top, a faint grid, and a wash that lifts toward
          the top edge give the surface somewhere to start.
        */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-200/45 via-transparent to-transparent opacity-70" />
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.55]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(23,23,23,0.028) 1px, transparent 1px), linear-gradient(to bottom, rgba(23,23,23,0.028) 1px, transparent 1px)',
            backgroundSize: '46px 46px',
            maskImage: 'radial-gradient(ellipse at 50% 40%, #000 25%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, #000 25%, transparent 78%)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px]"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(63,116,224,0.55) 18%, rgba(63,116,224,0.55) 82%, transparent)',
          }}
          aria-hidden="true"
        />

        {/* Top Header Chrome */}
        <div
          className={`absolute top-3.5 z-20 flex items-center justify-between gap-3 border-b border-neutral-900/10 pb-1.5 pointer-events-none text-[11px] font-mono tracking-widest text-neutral-400 uppercase ${
            isPortrait
              ? 'left-1/2 -translate-x-1/2 w-[82%] max-w-[400px]'
              : 'left-8 right-8'
          }`}
        >
          {/*
            One label, carried across the whole deck: this is the internal
            presentation about what briefing costs today. It only changes on
            the last slide, which is the one that answers it.
          */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-1.5 h-1.5 shrink-0 rounded-full ${
                isSolutionSlide ? 'bg-[#3f74e0]' : 'bg-neutral-900'
              }`}
            />
            <span
              className={`font-semibold tracking-wider truncate ${
                isSolutionSlide ? 'text-[#3f74e0]' : 'text-neutral-800'
              }`}
            >
              {isSolutionSlide ? 'The solution' : "Today's briefing problems"}
            </span>
          </div>
        </div>

        {/* Bottom Footer Chrome */}
        <div
          className={`absolute bottom-3 z-20 flex items-center justify-between gap-3 border-t border-neutral-900/10 pt-1.5 pointer-events-none text-[10px] font-mono tracking-widest text-neutral-400 uppercase ${
            isPortrait
              ? 'left-1/2 -translate-x-1/2 w-[82%] max-w-[400px]'
              : 'left-8 right-8'
          }`}
        >
          <span className="truncate">{isPortrait ? 'CONFIDENTIAL' : 'CONFIDENTIAL DEVELOPER DOSSIER'}</span>
          <span className="shrink-0 font-bold text-neutral-700">0{activeSlide + 1} / 04</span>
        </div>

        {/*
          The Sliding Track (4x width for 4 slides).

          Nothing below here carries a responsive prefix, on purpose. This is a
          fixed reference canvas that is scaled to fit its surface, so the
          scale is what adapts it — a `md:` inside it would change the design's
          shape on top of that scaling, off a viewport width the canvas has no
          relationship to. The sizes here are the design's own.
        */}
        <div
          ref={slidesRef}
          className="absolute inset-0 w-[400%] h-full flex z-10"
          style={{ willChange: 'transform' }}
        >
          {SLIDES.map((slide) => (
            <div
              key={slide.id}
              className="w-1/4 h-full flex flex-col items-center justify-center px-12 py-9 text-center relative overflow-hidden"
            >
              {/*
                The numeral, set into the paper rather than printed on it.

                It used to run off the bottom edge at 190px, which read as a
                crop rather than as a watermark. Outlined, sitting clear of the
                copy, it marks the slide without competing with it.
              */}
              <div
                className={`pointer-events-none absolute select-none text-[132px] leading-none font-semibold ${
                  isPortrait ? 'bottom-6 right-1/2 translate-x-1/2' : 'bottom-5 right-7'
                }`}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontVariationSettings: '"opsz" 32',
                  letterSpacing: '-0.06em',
                  color: 'transparent',
                  WebkitTextStroke: '1px rgba(23, 23, 23, 0.055)',
                }}
              >
                0{slide.id}
              </div>

              <div
                /* The live slide's tiers replay their entrance; the ones
                   sliding out of frame hold their finished state. */
                data-deck-live={SLIDES[activeSlide]?.id === slide.id}
                className="w-full max-w-[34rem] flex flex-col items-center justify-center relative z-10"
              >
                {/* Section eyebrow, on the shared editorial tier. */}
                <div className="deck-tier mb-5 flex flex-col items-center gap-2" style={{ '--tier': 0 } as React.CSSProperties}>
                  <span
                    className={`deck-eyebrow ${isSolutionSlide && slide.isInteractive ? 'text-[#3f74e0]' : 'text-neutral-400'}`}
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {slide.tag}
                  </span>
                  <span className="eyebrow-rule" data-align="center" aria-hidden="true" />
                </div>

                {/* The headline, in Inter's display cut. */}
                <h2
                  className="deck-tier deck-headline text-[2.6rem] text-neutral-900"
                  style={{ fontFamily: 'var(--font-inter)', '--tier': 1 } as React.CSSProperties}
                >
                  {slide.headline}
                </h2>

                {/* Body copy, on a measure wide enough to read at a distance. */}
                {slide.body && (
                  <p
                    className="deck-tier deck-body mt-3.5 max-w-[42ch] text-[16.5px] text-neutral-500"
                    style={{ fontFamily: 'var(--font-inter)', '--tier': 2 } as React.CSSProperties}
                  >
                    {slide.body}
                  </p>
                )}

                {/*
                  SLIDE 1: the briefing calendar.

                  Five weeks of it, booked wall to wall with agency names and
                  still only nine of twelve hundred — the point is the mess and
                  the counter under it, not any one appointment.
                */}
                {slide.id === 1 && (
                  <div
                    className="deck-tier mt-7 w-full max-w-[26rem] flex flex-col items-center"
                    style={{ '--tier': 3 } as React.CSSProperties}
                  >
                    <div className="w-full rounded-2xl border border-neutral-200/80 bg-white px-3.5 pt-3 pb-3.5 shadow-[0_2px_10px_-4px_rgba(23,23,23,0.12)]">
                      <div className="mb-2.5 flex items-center justify-between px-0.5">
                        <span className="deck-caption text-[8.5px] text-neutral-400">
                          Briefing calendar
                        </span>
                        <span className="deck-caption text-[8.5px] text-neutral-400">
                          Weeks 1-5 of 26
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5">
                        {[1, 2, 3, 4, 5].map((day) => (
                          <div key={day} className="flex flex-col gap-1.5">
                            <span className="deck-caption text-center text-[8px] text-neutral-300">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][day - 1]}
                            </span>
                            {/* Four slots a day. Most of them taken. */}
                            <div className="flex h-[74px] flex-col gap-[4px] rounded-lg bg-neutral-50 p-[4px] ring-1 ring-inset ring-neutral-200/70">
                              {[0, 1, 2, 3].map((slot) => {
                                const booking = CALENDAR_AGENCIES.find(
                                  (a) => a.day === day && a.slot === slot,
                                );
                                if (!booking) {
                                  return (
                                    <div
                                      key={slot}
                                      className="flex-1 rounded-[4px] border border-dashed border-neutral-200"
                                    />
                                  );
                                }
                                return (
                                  <div
                                    key={slot}
                                    /* Each card sits a hair off square on
                                       purpose: a calendar this oversubscribed
                                       never looks tidy. */
                                    className={`flex flex-1 items-center overflow-hidden rounded-[4px] px-1.5 ${
                                      booking.overflow
                                        ? 'bg-[#3f74e0] text-white'
                                        : 'bg-neutral-900 text-neutral-100'
                                    }`}
                                    style={{
                                      transform: `rotate(${((booking.slot % 2 ? 1 : -1) * (0.7 + (booking.day % 3) * 0.3)).toFixed(2)}deg)`,
                                    }}
                                  >
                                    <span className="truncate text-[7.5px] font-semibold leading-none tracking-tight">
                                      {booking.name}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2.5 text-[11px] font-medium text-neutral-500">
                      <span className="text-neutral-900 font-semibold">9 agencies booked</span>
                      <span className="h-3 w-px bg-neutral-200" />
                      <span className="text-[#3f74e0] font-semibold">1,191 still waiting</span>
                    </div>
                  </div>
                )}

                {/*
                  SLIDE 2: the relay, and what it costs at each hop.

                  The ring is drawn solid at the developer and dashes further
                  apart at every hand-off after it, so the loss is in the
                  drawing rather than only in the caption.
                */}
                {slide.id === 2 && (
                  <div
                    className="deck-tier mt-8 w-full max-w-[27rem]"
                    style={{ '--tier': 3 } as React.CSSProperties}
                  >
                    <div className="flex items-start justify-between gap-1">
                      {LANGUAGE_RELAY.map((stage, i) => (
                        <React.Fragment key={stage.label}>
                          {i > 0 && (
                            <div className="flex flex-1 items-center justify-center gap-[5px] pt-[34px]">
                              {[0, 1, 2, 3].map((n) => (
                                <span
                                  key={n}
                                  className="text-[11px] font-semibold leading-none text-neutral-400"
                                  style={{ opacity: 0.7 - i * 0.18 - n * 0.11 }}
                                >
                                  &rsaquo;
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex shrink-0 flex-col items-center gap-2.5">
                            <div
                              className="flex h-[76px] w-[76px] items-center justify-center rounded-full px-1.5 text-center"
                              style={{
                                border: stage.solid
                                  ? '1.5px solid #3f74e0'
                                  : `1.5px dashed rgba(115, 115, 115, ${0.7 - i * 0.2})`,
                              }}
                            >
                              <span
                                className="text-[11px] font-semibold leading-tight tracking-tight"
                                style={{
                                  color: stage.solid ? '#3f74e0' : '#404040',
                                  opacity: stage.solid ? 1 : 0.85 - i * 0.18,
                                }}
                              >
                                {stage.label}
                              </span>
                            </div>
                            <span
                              className="deck-caption text-[8px]"
                              style={{
                                color: stage.solid ? '#3f74e0' : '#737373',
                                opacity: stage.solid ? 1 : 0.9 - i * 0.2,
                              }}
                            >
                              {stage.loses}
                            </span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/*
                  SLIDE 3: what goes out against what comes back.

                  Two figures, the second of them nothing. The gap between them
                  is the whole slide, so nothing else is put on it.
                */}
                {slide.id === 3 && (
                  <div
                    className="deck-tier mt-8 flex w-full max-w-[25rem] items-stretch gap-5"
                    style={{ '--tier': 3 } as React.CSSProperties}
                  >
                    <div className="flex-1 py-1 text-center">
                      <div
                        className="text-[46px] leading-none text-neutral-900"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontVariationSettings: '"opsz" 32',
                          fontWeight: 660,
                          letterSpacing: '-0.04em',
                        }}
                      >
                        30,000
                      </div>
                      <div className="deck-caption mt-2.5 text-[8.5px] text-neutral-400">
                        Brochures sent
                      </div>
                    </div>

                    <div className="w-px shrink-0 bg-gradient-to-b from-transparent via-neutral-200 to-transparent" />

                    <div className="flex-1 py-1 text-center">
                      <div
                        className="text-[46px] leading-none text-[#3f74e0]"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontVariationSettings: '"opsz" 32',
                          fontWeight: 660,
                          letterSpacing: '-0.04em',
                        }}
                      >
                        0
                      </div>
                      <div className="deck-caption mt-2.5 text-[8.5px] text-[#3f74e0]/70">
                        Questions captured
                      </div>
                    </div>
                  </div>
                )}

                {/*
                  SLIDE 4: the name, then the one thing to press.

                  This slide used to ask the room a yes/no question and answer
                  it in a pill. The deck already argues the case over three
                  slides, so the answer is simply stated and the button — the
                  control the film is actually waiting on — is the only other
                  object here.
                */}
                {slide.isInteractive && (
                  <div className="w-full flex flex-col items-center pointer-events-auto mt-9 justify-center gap-16">
                    <div
                      className="deck-tier flex flex-col items-center gap-2"
                      style={{ '--tier': 2 } as React.CSSProperties}
                    >
                      <p
                        className="text-[2rem] leading-none text-[#3f74e0]"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontVariationSettings: '"opsz" 32',
                          fontWeight: 660,
                          letterSpacing: '-0.035em',
                        }}
                      >
                        Rechitta
                      </p>
                      <p
                        className="deck-body text-[15px] font-medium text-neutral-500"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Super simple to implement.
                      </p>
                    </div>

                    <div
                      className="deck-tier relative"
                      style={{ '--tier': 3 } as React.CSSProperties}
                    >
                      <ClickPrompt
                        label={nudgeCta ? 'Press this to continue' : 'Click to send'}
                        visible={!isUploading && !isSynced}
                        placement="top"
                        autoPlace
                        urgent={nudgeCta}
                      />
                      <button
                        onClick={handleUploadClick}
                        disabled={isUploading || isSynced}
                        className={`px-9 py-3.5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white text-base font-bold tracking-tight active:scale-[0.97] transition-all flex items-center gap-2.5 cursor-pointer relative overflow-hidden group disabled:cursor-default disabled:opacity-90 ${
                          nudgeCta ? 'scale-[1.04]' : ''
                        }`}
                        style={{
                          fontFamily: 'var(--font-inter)',
                          boxShadow: nudgeCta
                            ? '0 0 0 5px rgba(86,141,255,0.28), 0 18px 34px -12px rgba(0,0,0,0.55)'
                            : '0 18px 34px -12px rgba(0,0,0,0.55), inset 0 1px 1px 0 rgba(255,255,255,0.14)',
                        }}
                      >
                        {/* Shimmer on hover */}
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/18 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                        {isSynced ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-[#568DFF]" />
                            <span>Sent to every broker</span>
                          </>
                        ) : isUploading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
                            <span>Uploading project...</span>
                          </>
                        ) : (
                          <>
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#568DFF] opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#568DFF]" />
                            </span>
                            <span>Upload a project, send it to our brokers</span>
                            <span className="text-[#8FB4FF] font-bold transition-transform group-hover:translate-x-0.5">
                              &rarr;
                            </span>
                          </>
                        )}
                      </button>
                    </div>
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
        <DeckDock
          count={SLIDES.length}
          active={activeSlide}
          onStep={slideBy}
          onPick={setActiveSlide}
          backLabel={activeSlide === 0 ? 'Return to Dawn' : 'Previous slide'}
          forwardLabel={activeSlide === SLIDES.length - 1 ? 'Enter Hallway' : 'Next slide'}
        />

        {isPortrait && (
          <div className="w-full max-w-sm px-4">
            <BuilderMarquee />
          </div>
        )}
      </div>

    </div>
    </>
  );
}
