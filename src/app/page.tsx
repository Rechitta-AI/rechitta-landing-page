'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import FilmStage from '@/components/FilmStage';
import BoardroomPresentation from '@/components/BoardroomPresentation';
import BrokerPresentation from '@/components/BrokerPresentation';
// The buyer scene is retired; the film goes broker -> clouds -> multilingual.
// import BuyerPresentation from '@/components/BuyerPresentation';
import Loader from '@/components/Loader';
import ScrollRail from '@/components/ScrollRail';
import Cursor from '@/components/Cursor';
import OrbStage from '@/components/OrbStage';
import CityBackdrop from '@/components/CityBackdrop';
import MacroFocusPullTransition from '@/components/MacroFocusPullTransition';
import dynamic from 'next/dynamic';

const FinaleWorldMapPresentation = dynamic(
  () => import('@/components/FinaleWorldMapPresentation'),
  { ssr: false }
);

import type { FilmTiming } from '@/orb/types';
import type { Playhead } from '@/screens/types';
import { CITIES, type Beat, type Chapter } from '@/film/score';

type HeroCopy = 'all' | 'heading' | 'none';

const heroCopyFor = (beatId: string): HeroCopy =>
  beatId === 'hero' ? 'all' : beatId === 'finale' ? 'heading' : 'none';
import { BoardroomCta } from '@/components/CityNav';

/**
 * The experience is a fixed stage, not a tall page.
 *
 * Nothing here scrolls. Wheel, touch and key input all go to the film's own
 * threshold in FilmStage, which commits to one beat at a time. That is what
 * removed the judder: there used to be three separate things writing the
 * scroll position every frame — smooth-scroll inertia, the film driving the
 * page from video time, and the presentation overlays clamping it back — and
 * they fought each other on every gesture.
 */
export default function ExperiencePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  /** Which of the hero's copy is up: all of it, the headline alone, or none. */
  const heroShownRef = useRef<HeroCopy>('all');

  const [chapter, setChapter] = useState<Chapter>('intro');
  const [beatIndex, setBeatIndex] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  /** Where the film is as a fractional beat, for the chapter rail. */
  const beatPosition = useRef(0);
  const [cityIndex, setCityIndex] = useState(0);

  // Cinematic intro choreography.
  const [introPhase, setIntroPhase] = useState<'loading' | 'moving' | 'revealing' | 'done'>('loading');
  const [orbReady, setOrbReady] = useState(false);
  const revealTextRef = useRef<HTMLDivElement>(null);

  const scrollData = useRef({ progress: 0 });
  const holdData = useRef({ clipIndex: -1, progress: 0 });

  /** Measured clip durations. The orb's path anchors to clip time via this. */
  const filmTiming = useRef<FilmTiming | null>(null);

  /** The multilingual chapter has no camera move, so the orb leads the cities. */
  const cityPulse = useRef({ at: 0 });

  /** Which frame of which clip is on screen, for the composited app screens. */
  const playhead = useRef<Playhead | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  // The page itself never scrolls. All navigation is the film's.
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previous;
      document.body.style.overflow = '';
    };
  }, []);

  // The text reveal, once the orb has landed on the headline.
  useEffect(() => {
    if (introPhase !== 'revealing' || !revealTextRef.current) return;
    const tl = gsap.timeline({ onComplete: () => setIntroPhase('done') });

    tl.to(
      revealTextRef.current,
      { clipPath: 'inset(0 0% 0 0)', opacity: 1, x: 0, filter: 'blur(0px)', duration: 1.5, ease: 'power3.inOut' },
      0,
    );
    tl.to('.subheading-word', { opacity: 1, y: 0, duration: 0.8, stagger: 0.035, ease: 'power3.out' }, 0.5);
  }, [introPhase]);

  /**
   * The hero copy staggers away the moment the film leaves its first beat.
   *
   * The last beat brings the headline back on its own, in the very place it
   * sits on the first. The film loops from there to the top, so the next
   * scroll only has to add the eyebrow and the sub-line around a headline
   * that never left — the end of the film reads straight into its opening.
   */
  const setHeroCopy = useCallback((next: HeroCopy) => {
    if (!heroRef.current) return;
    const previous = heroShownRef.current;
    if (next === previous) return;
    heroShownRef.current = next;

    const root = heroRef.current;
    const heading = root.querySelectorAll('.hero-heading-word');
    const rest = root.querySelectorAll('.hero-word:not(.hero-heading-word), .subheading-word');
    const indicator = root.querySelector('#hero-scroll-indicator');

    const reveal = (els: NodeListOf<Element> | Element[], visible: boolean) => {
      if (els.length === 0) return;
      gsap.to(els, {
        y: visible ? 0 : 60,
        opacity: visible ? 1 : 0,
        stagger: visible ? -0.015 : 0.015,
        duration: visible ? 0.4 : 0.3,
        ease: visible ? 'power3.out' : 'power3.in',
        overwrite: true,
      });
    };

    const headingVisible = next !== 'none';
    if (headingVisible !== (previous !== 'none')) reveal(heading, headingVisible);
    const restVisible = next === 'all';
    if (restVisible !== (previous === 'all')) reveal(rest, restVisible);

    if (indicator && restVisible !== (previous === 'all')) {
      gsap.to(indicator, {
        opacity: restVisible ? 1 : 0,
        y: restVisible ? 0 : 20,
        scale: restVisible ? 1 : 0.95,
        duration: 0.35,
        ease: 'power2.inOut',
        overwrite: true,
      });
    }
  }, []);

  const handleBeat = useCallback(
    (beat: Beat, index: number) => {
      setIsMoving(false);
      setHeroCopy(heroCopyFor(beat.id));
      setBeatIndex(index);
    },
    [setHeroCopy],
  );

  /** The copy leaves the moment the film commits, not when the shot lands. */
  const handleMoveStart = useCallback(
    (_from: number, to: number) => {
      setIsMoving(true);
      // Into the hero the copy comes up at once, around a headline the last
      // beat may already have up. Into the last beat, the headline waits for
      // the camera to land.
      setHeroCopy(to === 0 ? 'all' : 'none');
    },
    [setHeroCopy],
  );

  const handleCity = useCallback((index: number) => {
    setCityIndex(index);
  }, []);

  const handleChapter = useCallback((next: Chapter) => {
    setChapter(next);
  }, []);

  return (
    <>
      <Cursor />

      {/* "6/6 Briefings Delivered" — Macro UI Focus Pull Transition */}
      <MacroFocusPullTransition />

      {introPhase === 'loading' && (
        <Loader onDone={() => setIntroPhase('moving')} orbReady={orbReady} />
      )}

      {/*
        The chapter rail, along the bottom. It fades in with the film and
        nothing else is allowed to sit on top of it — the scenes' own docks
        clear the band it reserves, and the orb passes above it.
      */}
      <div
        className="transition-opacity duration-1000"
        style={{ opacity: introPhase === 'done' ? 1 : 0 }}
      >
        <ScrollRail beatPosition={beatPosition} beatIndex={beatIndex} />
      </div>

      <div className="fixed inset-0 w-full h-full bg-[#0A0A09] overflow-hidden film-grain-overlay">
        {/*
          The film stays dark through 'loading' and 'moving' so the orb glides
          against nothing but the sky, then fades up as it lands.
        */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            opacity: introPhase === 'loading' || introPhase === 'moving' ? 0 : 1,
            transition: 'opacity 1s ease-in-out',
          }}
        >
          {/* The multilingual chapter */}
          <div
            id="multilingual-chapter"
            className="absolute inset-0 z-[15] w-full h-full overflow-hidden"
            style={{
              opacity: chapter === 'cities' ? 1 : 0,
              visibility: chapter === 'cities' ? 'visible' : 'hidden',
            }}
          >
            {/*
              Turning the chapter by hand. Six beats that share a composition
              read as one long page to scroll through; an arrow says they are
              six things to step between. It sits with the city's name, which
              is the thing it turns.
            */}
            <CityBackdrop
              index={cityIndex}
              active={chapter === 'cities'}
              onSwap={() => {
                cityPulse.current.at = performance.now();
              }}
              isMoving={isMoving}
            />

            {/*
              Keeps the phone sharp and softens everything around it. The
              focus point follows the phone, which sits to the left on a wide
              screen and in the middle of a portrait one.
            */}
            <div
              className="absolute inset-0 backdrop-blur-[6px] bg-black/40 pointer-events-none [--focus-x:50%] md:[--focus-x:40%]"
              style={{
                maskImage:
                  'radial-gradient(ellipse at var(--focus-x) center, transparent 15%, black 60%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse at var(--focus-x) center, transparent 15%, black 60%)',
              }}
            />

            {/*
              The mockup is a frame, not a phone: every pixel inside its outline
              is transparent, the notch included. So the lit screen goes behind
              the artwork and fills the whole interior — anything less and the
              city shows through around the notch.
            */}
            <div
              id="multilingual-phone"
              className="absolute pointer-events-none
                         left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2
                         h-[clamp(370px,53dvh,490px)]
                         md:left-[40%] md:top-1/2 md:-translate-y-1/2 md:h-[min(78vh,780px)]"
            >
              <div className="relative h-full aspect-[388/800]">
                {/*
                  Inner screen background: sealed insets and corner radius
                  tucked cleanly under the bezel with zero gap above Dynamic Island
                  and zero outer leakage.
                */}
                <div
                  className="absolute inset-[0.8%_1.5%] rounded-[14%/7.5%] overflow-hidden"
                  style={{
                    background:
                      'radial-gradient(ellipse at 50% 50%, rgba(56, 56, 54,0.96) 0%, rgba(20, 20, 19,0.98) 60%, rgba(20, 20, 19,1) 100%)',
                  }}
                >
                  {/* Voice-dock ambient cradle glow at the bottom center of the phone screen */}
                  <div className="absolute bottom-[3%] left-1/2 -translate-x-1/2 w-28 h-20 rounded-full bg-[#3D6FF5]/20 blur-xl pointer-events-none" />
                  <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-[#3D6FF5]/15 blur-md pointer-events-none" />

                  {/* Sleek home indicator bar at bottom center */}
                  <div className="absolute bottom-[2.2%] left-1/2 -translate-x-1/2 w-24 h-[3.5px] rounded-full bg-white/20 pointer-events-none" />
                </div>

                <img
                  src="/film/frames/multilingual/phone-mockup.webp"
                  alt=""
                  className="relative h-full w-auto object-contain select-none pointer-events-none"
                />

                {/* Exact dock anchor for the orb at the bottom center of the phone screen */}
                <div
                  id="multilingual-dock-anchor"
                  className="absolute bottom-[7.5%] left-1/2 -translate-x-1/2 w-4 h-4 pointer-events-none"
                />

                {/* Briefing text: balanced typography, vertically centered inside screen */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-[14%] pb-[14%] px-[10%] text-center select-none pointer-events-none">
                  <p
                    key={cityIndex}
                    dir={CITIES[cityIndex]?.rtl ? 'rtl' : 'ltr'}
                    className="animate-briefing-in text-white/95 font-medium leading-snug text-balance
                               text-[clamp(1.08rem,2.6vh,1.75rem)] [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]"
                    style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
                  >
                    {CITIES[cityIndex]?.briefing}
                  </p>
                  {/*
                    Two lines, not one row.

                    Set side by side, a long language ran the row wider than
                    the handset and wrapped — so RIYADH read on one line and
                    SHANGHAI on two, and the block changed shape city to city.
                    Stacked, every city gets the same three centred lines.
                  */}
                  <div className="mt-[2.2vh] flex flex-col items-center gap-[0.6vh] font-mono text-white/55 text-[clamp(0.55rem,1.1vh,0.72rem)] tracking-[0.25em]">
                    <span className="-mr-[0.25em] whitespace-nowrap">
                      {CITIES[cityIndex]?.language}
                    </span>
                    <span className="flex items-center whitespace-nowrap">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3D6FF5] shadow-[0_0_8px_rgba(61,111,245,0.9)] mr-2" />
                      <span className="-mr-[0.25em]">LIVE DATA</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/*
              The chapter's call to action on a phone, pinned above the rail
              the way the broker's is. Wide screens carry it under the city's
              clock instead (CityBackdrop), where it cannot land on the phone.
            */}
            <div
              className="md:hidden absolute left-1/2 -translate-x-1/2 z-[60] w-[min(94vw,420px)]"
              style={{ bottom: 'calc(max(1rem, env(safe-area-inset-bottom)) + 3.85rem)' }}
            >
              <BoardroomCta isMoving={isMoving} className="w-full btn-sm" />
            </div>
          </div>

          {/* The film itself, plus the overlays that ride specific frames. */}
          <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
            {/* Instant 0ms visual underlay for Dawn scene (exact frame 120 at 60fps / t=2.0s) for iOS/mobile resilience */}
            <div
              className="absolute inset-0 -z-10 w-full h-full bg-cover bg-center pointer-events-none"
              style={{
                backgroundImage: "url('/film/frames/scene1-3/f_120.webp')",
              }}
              aria-hidden="true"
            />

            <div className="absolute inset-0 z-20 animate-vignette-pulse pointer-events-none" />

            <BoardroomPresentation holdData={holdData} />
            <BrokerPresentation holdData={holdData} />
            {/* <BuyerPresentation holdData={holdData} /> */}
            <FinaleWorldMapPresentation chapter={chapter} beatIndex={beatIndex} isMoving={isMoving} />

            <FilmStage
              scrollData={scrollData}
              holdData={holdData}
              timingRef={filmTiming}
              playheadRef={playhead}
              beatPositionRef={beatPosition}
              enabled={introPhase === 'done'}
              onChapter={handleChapter}
              onBeat={handleBeat}
              onMoveStart={handleMoveStart}
              onCity={handleCity}
            />
          </div>
        </div>

        {/*
          The hero is portalled to the body. The stage gives its children their
          own stacking context, so nothing inside it can paint above the orb's
          fixed layer — and the orb sits behind the headline, not under it.
        */}
        {mounted &&
          createPortal(
            <div className="fixed inset-0 z-[135] pointer-events-none">
              <div
                ref={heroRef}
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-[max(4.25rem,calc(env(safe-area-inset-top)+3.5rem))] pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] overflow-hidden"
              >
                <div id="hero-orb-anchor" className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 pointer-events-none mb-6 sm:mb-7 md:mb-8 shrink-0" />

                <div
                  ref={revealTextRef}
                  style={{
                    clipPath: 'inset(0 100% 0 0)',
                    opacity: 0,
                    filter: 'blur(10px)',
                    transform: 'translateX(-20px)',
                  }}
                >
                  {/*
                    The tier above the headline. The scenes downstream all open
                    on an eyebrow of their own, so the hero opening on a bare
                    headline left the film's first frame reading flatter than
                    every frame after it.
                  */}
                  <p className="hero-word eyebrow text-center text-[var(--text-accent)] mb-2 sm:mb-3 md:mb-4 text-[10px] sm:text-xs md:text-sm max-sm:tracking-[0.04em]! max-sm:leading-[1.5]!">
                    Real estate communication reimagined
                  </p>

                  <h1
                    id="hero-heading"
                    /* The brand statement: design.md's Display face. */
                    className="type-display text-[clamp(1.85rem,6vw,4.5rem)] leading-[1.08] md:leading-[1.1] text-[var(--text-primary)] flex flex-wrap items-center justify-center gap-x-[0.26em]"
                  >
                    <span className="hero-word hero-heading-word inline-block">
                      <span id="hero-o-anchor">O</span>ne
                    </span>
                    <span className="hero-word hero-heading-word inline-block">source</span>
                    <span className="hero-word hero-heading-word inline-block">of</span>
                    <span className="hero-word hero-heading-word inline-block">truth.</span>
                  </h1>
                </div>

                <p
                  className="mt-3 sm:mt-5 md:mt-7 text-xs sm:text-sm md:text-base text-white/55 max-w-[20rem] sm:max-w-md md:max-w-xl leading-relaxed flex flex-wrap justify-center gap-x-[0.32em] gap-y-1 sm:gap-y-1.5"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {'Project Briefings, 24/7, in all languages across the world.'
                    .split(' ')
                    .map((word, i) => (
                      <span key={i} className="inline-flex overflow-hidden">
                        <span
                          className="subheading-word inline-block"
                          style={{ opacity: 0, transform: 'translateY(100%)' }}
                        >
                          {word}
                        </span>
                      </span>
                    ))}
                </p>

                <div
                  id="hero-scroll-indicator"
                  /* Clear of the chapter rail, adapting to mobile safe areas */
                  className={`absolute bottom-[max(4.25rem,calc(env(safe-area-inset-bottom)+3.75rem))] md:bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 sm:gap-2.5 transition-all duration-700 ${
                    introPhase === 'done' ? 'opacity-100 translate-y-0 delay-[1000ms]' : 'opacity-0 translate-y-4'
                  }`}
                >
                  <span className="eyebrow text-white/40 text-[9px] sm:text-[10px] md:text-xs tracking-[0.25em]">Scroll</span>
                  <div className="w-[1.5px] h-6 sm:h-8 md:h-10 bg-white/15 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-white origin-top animate-scroll-line rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>

      <OrbStage
        scrollData={scrollData}
        timingRef={filmTiming}
        cityPulseRef={cityPulse}
        introPhase={introPhase}
        onOrbLanded={() => setIntroPhase('revealing')}
        onOrbLoaded={() => setOrbReady(true)}
      />
    </>
  );
}
