'use client';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollFilm from '@/components/ScrollFilm';
import BoardroomPresentation from '@/components/BoardroomPresentation';
import TexturedGlobe from '@/components/TexturedGlobe';
import Loader from '@/components/Loader';
import ScrollRail from '@/components/ScrollRail';
import Cursor from '@/components/Cursor';
import OrbStage from '@/components/OrbStage';
import CityDroneBackground from '@/components/CityDroneBackground';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import type { FilmTiming } from '@/orb/types';
import type { Playhead } from '@/screens/types';
import ScreenTracks from '@/components/ScreenTracks';

gsap.registerPlugin(ScrollTrigger);

export default function ExperiencePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const filmContainerRef = useRef<HTMLDivElement>(null);

  const finaleFilmContainerRef = useRef<HTMLDivElement>(null);

  const multilingualContainerRef = useRef<HTMLDivElement>(null);
  const cityBgRef = useRef<HTMLDivElement>(null);
  const whiteFlashRef = useRef<HTMLDivElement>(null);
  const heroExitedRef = useRef(false);
  const isLoopingRef = useRef(false);

  const heroRef = useRef<HTMLDivElement>(null);

  const [activeChapter, setActiveChapter] = useState('hero');
  const currentChapterRef = useRef('hero');

  // Cinematic Intro Choreography
  const [introPhase, setIntroPhase] = useState<'loading' | 'moving' | 'revealing' | 'done'>('loading');
  const [orbReady, setOrbReady] = useState(false);
  const revealTextRef = useRef<HTMLDivElement>(null);

  // Lenis inertia, paused until the intro sequence completely finishes.
  useSmoothScroll(introPhase === 'done');
  const scrollData = useRef({ progress: 0 });
  const holdData = useRef({ clipIndex: -1, progress: 0 });

  // Measured clip durations for the intro film. The orb's flight path anchors
  // to clip time, so it resolves through this rather than hardcoded progress.
  const filmTiming = useRef<FilmTiming | null>(null);

  // The multilingual chapter has no camera move for the orb to lead, so it
  // leads the cities instead: it pulses as each one arrives.
  const cityPulse = useRef({ at: 0 });

  // Which frame of which clip is on screen, so the app mockups can be warped
  // onto the phones exactly where they are.
  const playhead = useRef<Playhead | null>(null);

  // The hero renders through a portal (see below), which can only happen once
  // there is a document to portal into.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // Nothing should scroll while the cinematic intro is playing.
    document.documentElement.style.overflow = introPhase === 'done' ? '' : 'hidden';
    if (introPhase === 'done') ScrollTrigger.refresh();
  }, [introPhase]);

  // UseEffect for matchCutTl removed.

  // Handle the text reveal phase
  useEffect(() => {
    if (introPhase === 'revealing' && revealTextRef.current) {
      const tl = gsap.timeline({ onComplete: () => setIntroPhase('done') });

      tl.to(revealTextRef.current, {
        clipPath: 'inset(0 0% 0 0)',
        opacity: 1,
        x: 0,
        filter: 'blur(0px)',
        duration: 1.5,
        ease: 'power3.inOut',
      }, 0);

      // Staggered reveal for the subheading words! Starts 0.5s into the main heading reveal.
      tl.to('.subheading-word', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.035,
        ease: 'power3.out'
      }, 0.5);
    }
  }, [introPhase]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "+=15000", // Total height of the experience
        pin: true,
        onUpdate: (self) => {
          // INFINITE LOOP: Clean, seamless teleport to top at the very end
          if (self.progress >= 0.998 && !isLoopingRef.current) {
            isLoopingRef.current = true;

            // 1. Immediately kill all active tweens
            gsap.killTweensOf(whiteFlashRef.current);
            gsap.killTweensOf(finaleFilmContainerRef.current);
            gsap.killTweensOf(filmContainerRef.current);
            gsap.killTweensOf(multilingualContainerRef.current);

            // 2. Snap containers directly to starting state with zero flashes or lingering blurs
            gsap.set(whiteFlashRef.current, { opacity: 0 });
            gsap.set(finaleFilmContainerRef.current, { opacity: 0, filter: 'blur(0px)', scale: 1 });
            gsap.set(multilingualContainerRef.current, { opacity: 0, visibility: 'hidden', filter: 'blur(0px)', scale: 1 });
            gsap.set(filmContainerRef.current, { opacity: 1, filter: 'blur(0px)', scale: 1 });

            // 3. Reset Hero Text Words & Subheading Words immediately
            heroExitedRef.current = false;
            if (heroRef.current) {
              const words = heroRef.current.querySelectorAll('.hero-word, .subheading-word');
              gsap.killTweensOf(words);
              gsap.set(words, {
                y: 0,
                opacity: 1,
                overwrite: true
              });
            }

            // 4. Reset chapter tracking
            currentChapterRef.current = 'video';
            setActiveChapter('video');
            scrollData.current.progress = 0;

            // 5. Instantly teleport scroll position and cancel residual wheel momentum
            const lenis = (window as any).lenis;
            if (lenis) {
              lenis.scrollTo(0, { immediate: true, force: true });
              if (typeof lenis.velocity !== 'undefined') lenis.velocity = 0;
            }

            // 6. Brief guard to swallow residual gesture ticks
            setTimeout(() => {
              isLoopingRef.current = false;
            }, 120);

            return;
          }

          if (isLoopingRef.current) return;

          // 1. Update the master scroll tracker
          scrollData.current.progress = self.progress;
          const p = self.progress;

          // 3. Cinematic Chapter Transitions
          const oldChapter = currentChapterRef.current;
          const newChapter = self.progress < 0.5 ? 'video' : self.progress < 0.95 ? 'globe' : 'finale';

          if (oldChapter !== newChapter) {
            currentChapterRef.current = newChapter;
            setActiveChapter(newChapter);

            gsap.killTweensOf(finaleFilmContainerRef.current);
            gsap.killTweensOf(multilingualContainerRef.current);
            gsap.killTweensOf(filmContainerRef.current);
            gsap.killTweensOf(whiteFlashRef.current);

            if (newChapter === 'video') {
              // Entering Intro
              gsap.set(finaleFilmContainerRef.current, { opacity: 0, filter: 'blur(0px)', scale: 1 });

              if (oldChapter === 'globe') {
                const tl = gsap.timeline();
                tl.to(whiteFlashRef.current, { opacity: 1, duration: 0.4, ease: 'power2.inOut' });
                tl.add(() => {
                  gsap.set(multilingualContainerRef.current, { opacity: 0, visibility: 'hidden', filter: 'blur(0px)', scale: 1 });
                  gsap.set(filmContainerRef.current, { opacity: 1 });
                });
                tl.to(whiteFlashRef.current, { opacity: 0, duration: 0.4, ease: 'power2.inOut' });
              } else if (oldChapter === 'finale') {
                // Direct loop reset from finale
                gsap.set(multilingualContainerRef.current, { opacity: 0, visibility: 'hidden', filter: 'blur(0px)', scale: 1 });
                gsap.set(filmContainerRef.current, { opacity: 1 });
                gsap.set(whiteFlashRef.current, { opacity: 0 });
              }

            } else if (newChapter === 'globe') {
              // Entering Multilingual (scrolling down from Intro, OR scrolling up from Finale)
              gsap.set(multilingualContainerRef.current, { visibility: 'visible' });

              if (oldChapter === 'video' || oldChapter === 'hero') {
                // Forward transition from intro (White Flash)
                const tl = gsap.timeline();
                tl.to(whiteFlashRef.current, { opacity: 1, duration: 0.4, ease: 'power2.inOut' });
                tl.add(() => {
                  gsap.set(filmContainerRef.current, { opacity: 0 });
                  gsap.set(multilingualContainerRef.current, { opacity: 1, visibility: 'visible' });
                });
                tl.to(whiteFlashRef.current, { opacity: 0, duration: 0.4, ease: 'power2.inOut' });
              } else {
                // Backward transition from Finale to Multilingual: Cinematic Lens Focus Pull
                gsap.set(multilingualContainerRef.current, { visibility: 'visible' });
                const tl = gsap.timeline();
                tl.to(finaleFilmContainerRef.current, {
                  opacity: 0,
                  filter: 'blur(20px)',
                  scale: 0.97,
                  duration: 0.45,
                  ease: 'power2.in'
                });
                tl.fromTo(multilingualContainerRef.current,
                  { opacity: 0, filter: 'blur(20px)', scale: 1.03 },
                  { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 0.45, ease: 'power2.out' },
                  "-=0.2"
                );
              }
            } else if (newChapter === 'finale') {
              // Entering Finale (scrolling down from Multilingual): Cinematic Lens Focus Pull
              gsap.set(finaleFilmContainerRef.current, { visibility: 'visible' });
              const tl = gsap.timeline();
              tl.to(multilingualContainerRef.current, {
                opacity: 0,
                filter: 'blur(20px)',
                scale: 1.03,
                duration: 0.45,
                ease: 'power2.in',
                onComplete: () => {
                  gsap.set(multilingualContainerRef.current, { visibility: 'hidden' });
                }
              });
              tl.fromTo(finaleFilmContainerRef.current,
                { opacity: 0, filter: 'blur(20px)', scale: 0.97 },
                { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 0.45, ease: 'power2.out' },
                "-=0.2"
              );
            }
          }

          // 4. Autonomous Fast Stagger-Out for Hero Text at the glass facade
          const pScroll = self.progress;
          const HERO_EXIT_THRESHOLD = 0.03; // Adjusted to match the exact glass facade timing

          if (heroRef.current) {
            const words = heroRef.current.querySelectorAll('.hero-word, .subheading-word');
            if (pScroll >= HERO_EXIT_THRESHOLD && !heroExitedRef.current) {
              heroExitedRef.current = true;
              gsap.to(words, {
                y: 60,
                opacity: 0,
                stagger: 0.015,
                duration: 0.3,
                ease: 'power3.in',
                overwrite: true
              });
            } else if (pScroll < HERO_EXIT_THRESHOLD && heroExitedRef.current) {
              heroExitedRef.current = false;
              gsap.to(words, {
                y: 0,
                opacity: 1,
                stagger: -0.015,
                duration: 0.4,
                ease: 'power3.out',
                overwrite: true
              });
            }
          }
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <Cursor />

      {/* 
        The loader now acts purely as the circular progress ring. 
        When it finishes loading the videos AND the 3D Orb is ready, it moves on.
      */}
      {introPhase === 'loading' && (
        <Loader onDone={() => setIntroPhase('moving')} orbReady={orbReady} />
      )}

      {/* LAYER 1: Scroll Rail UI */}
      <div
        className="fixed left-0 top-0 bottom-0 z-50 pointer-events-none transition-opacity duration-1000"
        style={{ opacity: introPhase === 'done' ? 1 : 0 }}
      >
        <ScrollRail scrollData={scrollData} />
      </div>

      <div ref={containerRef} className="relative w-full h-screen bg-[#070A10] overflow-hidden film-grain-overlay">

        {/* 
          Keep videos invisible during both 'loading' and 'moving' phases so the glowing 
          Orb can shine against the pure dark background while it glides. It will fade in when it lands.
        */}
        <div className="absolute inset-0 w-full h-full" style={{ opacity: (introPhase === 'loading' || introPhase === 'moving') ? 0 : 1, transition: 'opacity 1s ease-in-out' }}>

          {/* LAYER 1: The Background Globe */}
          <div
            className="absolute inset-0 z-0 flex items-center justify-center"
            style={{
              visibility: ['video', 'globe', 'finale'].includes(activeChapter)
                ? 'visible'
                : 'hidden',
            }}
          >
            {/* <TexturedGlobe scrollData={scrollData} /> */}
          </div>

          {/* LAYER 1.5: Multilingual Drone Shot Section */}
          <div
            ref={multilingualContainerRef}
            className="absolute inset-0 z-[15] w-full h-full opacity-0 invisible overflow-hidden"
          >
            {/* The auto-playing drone shot canvas (Mumbai -> Moscow -> etc) */}
            <div ref={cityBgRef} className="absolute inset-0 w-full h-full">
              <CityDroneBackground
                scrollData={scrollData}
                onCityChange={() => {
                  cityPulse.current.at = performance.now();
                }}
              />

              {/* Radial Vignette Blur Layer - Keeps the phone sharp, blurs the edges */}
              <div
                className="absolute inset-0 backdrop-blur-[6px] bg-black/40 pointer-events-none"
                style={{
                  maskImage: 'radial-gradient(ellipse at 35% center, transparent 15%, black 60%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at 35% center, transparent 15%, black 60%)'
                }}
              />
            </div>

            {/* Phone Mockup on the left side */}
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

          {/* LAYER 2: The Intro 4K Video Sequence */}
          <div ref={filmContainerRef} className="absolute inset-0 z-10 w-full h-full pointer-events-none">
            {/* Cinematic Vignette Pulse Overlay */}
            <div className="absolute inset-0 z-20 animate-vignette-pulse pointer-events-none" />

            {/* The Scroll-Locked UI Overlay */}
            <BoardroomPresentation holdData={holdData} />

            <ScrollFilm
              scrollData={scrollData}
              holdData={holdData}
              sequenceKeys={[
                { key: 'scene1-3', in: 2, out: 11, holdWeight: 8 }, // Holds here for 8 durations of video to slow down presentation scroll!
                { key: 'transit-b', in: 2 },
                'transit-c',
                'transit-d'
              ]}
              startProgress={0}
              endProgress={0.5}
              reportsProgress="intro"
              priority
              timingRef={filmTiming}
              playheadRef={playhead}
            />

            {/* The app screens, composited into the phones as they move. */}
            <ScreenTracks playheadRef={playhead} />
          </div>

          {/* LAYER 2.5: The White Crossfade Layer */}
          <div ref={whiteFlashRef} className="absolute inset-0 z-[20] w-full h-full bg-white opacity-0 pointer-events-none" />

          {/* LAYER 3: The Finale Video Sequence */}
          <div ref={finaleFilmContainerRef} className="absolute inset-0 z-[25] w-full h-full opacity-0 pointer-events-none">
            <ScrollFilm
              scrollData={scrollData}
              sequenceKeys={['last-scene']}
              startProgress={0.95}
              endProgress={1.0}
              reportsProgress="finale"
            />
          </div>
        </div>

        {/*
          The hero is portalled to the body rather than left inside the pinned
          container. ScrollTrigger's pin gives that container its own stacking
          context, so nothing inside it can paint above the orb's fixed layer —
          and the orb lands exactly on the "O", which would bury the letter.
          Out here it can sit above the orb, so the word reads "One" with the
          orb glowing behind its first letter.
        */}
        {mounted && createPortal(
          <div className="fixed inset-0 z-[31] pointer-events-none">

          {/* The Hero Content */}
          <div
            ref={heroRef}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-16"
          >
            <div
              ref={revealTextRef}
              style={{
                clipPath: 'inset(0 100% 0 0)',
                opacity: 0,
                filter: 'blur(10px)',
                transform: 'translateX(-20px)'
              }}
            >
              <h1 id="hero-heading" className="text-4xl md:text-[4.5rem] leading-none text-white tracking-tight flex flex-wrap items-center justify-center gap-x-[0.3em]" style={{ fontFamily: 'var(--font-inter)' }}>
                {/* The orb lands on this "O" — the letter stays visible beneath it. */}
                <span className="hero-word inline-block">
                  <span id="hero-o-anchor">O</span>ne
                </span>
                <span className="hero-word inline-block">source</span>
                <span className="hero-word inline-block">of</span>
                <span className="hero-word inline-block">truth.</span>
              </h1>
            </div>
            <p
              className="mt-6 text-base md:text-lg text-gray-300 max-w-2xl leading-relaxed flex flex-wrap justify-center gap-x-[0.4em] gap-y-2"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {"Live developer inventory, translated into conversation — so every broker and every buyer speaks the same language.".split(' ').map((word, i) => (
                <span key={i} className="inline-flex overflow-hidden">
                  <span
                    className="subheading-word inline-block"
                    style={{
                      opacity: 0,
                      transform: 'translateY(100%)',
                    }}
                  >
                    {word}
                  </span>
                </span>
              ))}
            </p>

            {/* Scroll Indicator */}
            <div
              className={`absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 transition-all duration-1000 ${introPhase === 'done' ? 'opacity-100 translate-y-0 delay-[1000ms]' : 'opacity-0 translate-y-4'
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

      {/* LAYER 3.5: The Spline orb, blending over the film */}
      {/* Moved OUTSIDE containerRef to prevent ScrollTrigger DOM-surgery from reloading the iframe! */}
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
