'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import FilmStage from '@/components/FilmStage';
import BoardroomPresentation from '@/components/BoardroomPresentation';
import BrokerPresentation from '@/components/BrokerPresentation';
import BuyerPresentation from '@/components/BuyerPresentation';
import Loader from '@/components/Loader';
import ScrollRail from '@/components/ScrollRail';
import Cursor from '@/components/Cursor';
import OrbStage from '@/components/OrbStage';
import CityBackdrop from '@/components/CityBackdrop';
import type { FilmTiming } from '@/orb/types';
import type { Playhead } from '@/screens/types';
import { BEATS, type Beat, type Chapter } from '@/film/score';

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
  const heroWordsRef = useRef<NodeListOf<Element> | null>(null);
  const heroExitedRef = useRef(false);

  const [chapter, setChapter] = useState<Chapter>('intro');
  const [railLabel, setRailLabel] = useState(BEATS[0].label);
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
  useEffect(() => setMounted(true), []);

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

  /** The hero copy staggers away the moment the film leaves its first beat. */
  const setHeroVisible = useCallback((visible: boolean) => {
    if (!heroRef.current) return;
    if (visible === !heroExitedRef.current) return;
    heroExitedRef.current = !visible;

    const words =
      heroWordsRef.current ??
      (heroWordsRef.current = heroRef.current.querySelectorAll('.hero-word, .subheading-word'));
    const indicator = heroRef.current.querySelector('#hero-scroll-indicator');

    gsap.to(words, {
      y: visible ? 0 : 60,
      opacity: visible ? 1 : 0,
      stagger: visible ? -0.015 : 0.015,
      duration: visible ? 0.4 : 0.3,
      ease: visible ? 'power3.out' : 'power3.in',
      overwrite: true,
    });
    if (indicator) {
      gsap.to(indicator, {
        opacity: visible ? 1 : 0,
        y: visible ? 0 : 20,
        scale: visible ? 1 : 0.95,
        duration: 0.35,
        ease: 'power2.inOut',
        overwrite: true,
      });
    }
  }, []);

  const handleBeat = useCallback(
    (beat: Beat) => {
      setHeroVisible(beat.id === 'hero');
      setRailLabel(beat.label);
    },
    [setHeroVisible],
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

      {introPhase === 'loading' && (
        <Loader onDone={() => setIntroPhase('moving')} orbReady={orbReady} />
      )}

      {/* The chapter rail */}
      <div
        className="fixed left-0 top-0 bottom-0 z-50 pointer-events-none transition-opacity duration-1000"
        style={{ opacity: introPhase === 'done' ? 1 : 0 }}
      >
        <ScrollRail scrollData={scrollData} label={railLabel} />
      </div>

      <div className="fixed inset-0 w-full h-full bg-[#070A10] overflow-hidden film-grain-overlay">
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
            className="absolute inset-0 z-[15] w-full h-full overflow-hidden"
            style={{
              opacity: chapter === 'cities' ? 1 : 0,
              visibility: chapter === 'cities' ? 'visible' : 'hidden',
            }}
          >
            <CityBackdrop
              index={cityIndex}
              active={chapter === 'cities'}
              onSwap={() => {
                cityPulse.current.at = performance.now();
              }}
            />

            {/* Keeps the phone sharp and softens everything around it. */}
            <div
              className="absolute inset-0 backdrop-blur-[6px] bg-black/40 pointer-events-none"
              style={{
                maskImage: 'radial-gradient(ellipse at 35% center, transparent 15%, black 60%)',
                WebkitMaskImage: 'radial-gradient(ellipse at 35% center, transparent 15%, black 60%)',
              }}
            />

            <div
              id="multilingual-phone"
              className="absolute left-[5%] md:left-[18%] top-1/2 -translate-y-1/2 w-[380px] h-auto pointer-events-none"
            >
              <img
                src="/film/frames/multilingual/phone-mockup.webp"
                alt="Phone Mockup"
                className="w-full h-auto object-contain animate-idle-float"
              />
            </div>
          </div>

          {/* The film itself, plus the overlays that ride specific frames. */}
          <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
            <div className="absolute inset-0 z-20 animate-vignette-pulse pointer-events-none" />

            <BoardroomPresentation holdData={holdData} />
            <BrokerPresentation holdData={holdData} />
            <BuyerPresentation holdData={holdData} />

            <FilmStage
              scrollData={scrollData}
              holdData={holdData}
              timingRef={filmTiming}
              playheadRef={playhead}
              enabled={introPhase === 'done'}
              onChapter={handleChapter}
              onBeat={handleBeat}
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
            <div className="fixed inset-0 z-[31] pointer-events-none">
              <div
                ref={heroRef}
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-16"
              >
                <div id="hero-orb-anchor" className="w-16 h-16 md:w-20 md:h-20 pointer-events-none mb-3 md:mb-6" />

                <div
                  ref={revealTextRef}
                  style={{
                    clipPath: 'inset(0 100% 0 0)',
                    opacity: 0,
                    filter: 'blur(10px)',
                    transform: 'translateX(-20px)',
                  }}
                >
                  <h1
                    id="hero-heading"
                    className="text-[clamp(2.25rem,5.5vw,4.5rem)] leading-none text-white tracking-tight flex flex-wrap items-center justify-center gap-x-[0.3em]"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    <span className="hero-word inline-block">
                      <span id="hero-o-anchor">O</span>ne
                    </span>
                    <span className="hero-word inline-block">source</span>
                    <span className="hero-word inline-block">of</span>
                    <span className="hero-word inline-block">truth.</span>
                  </h1>
                </div>

                <p
                  className="mt-4 md:mt-6 text-sm sm:text-base md:text-lg text-gray-300 max-w-xl md:max-w-2xl leading-relaxed flex flex-wrap justify-center gap-x-[0.4em] gap-y-2"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {'Live developer inventory, translated into conversation — so every broker and every buyer speaks the same language.'
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
                  className={`absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 transition-all duration-700 ${
                    introPhase === 'done' ? 'opacity-100 translate-y-0 delay-[1000ms]' : 'opacity-0 translate-y-4'
                  }`}
                >
                  <span className="text-[11px] tracking-[0.4em] text-white/50 font-medium font-sans">SCROLL</span>
                  <div className="w-[1px] h-12 bg-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white origin-top animate-scroll-line"></div>
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
