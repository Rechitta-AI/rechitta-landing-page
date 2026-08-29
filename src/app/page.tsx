'use client';
import { useRef, useState, useEffect } from 'react';
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

gsap.registerPlugin(ScrollTrigger);

export default function ExperiencePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const filmContainerRef = useRef<HTMLDivElement>(null);

  const finaleFilmContainerRef = useRef<HTMLDivElement>(null);

  const multilingualContainerRef = useRef<HTMLDivElement>(null);
  const cityBgRef = useRef<HTMLDivElement>(null);
  const handTrackerRef = useRef<HTMLDivElement>(null);
  const matchCutTl = useRef<gsap.core.Timeline | null>(null);
  const handSlidRef = useRef(false);

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

  useEffect(() => {
    // Nothing should scroll while the cinematic intro is playing.
    document.documentElement.style.overflow = introPhase === 'done' ? '' : 'hidden';
    if (introPhase === 'done') ScrollTrigger.refresh();
  }, [introPhase]);

  // Create the Master Timeline for the Match Cut ONCE on mount
  useEffect(() => {
    if (!filmContainerRef.current || !cityBgRef.current || !handTrackerRef.current) return;

    // We use ease: 'none' because the user's scroll speed provides the natural easing!
    const tl = gsap.timeline({ paused: true });

    // Phase 1: Dissolve background to drone footage (0.0 to 1.0 timeline progress)
    // We removed Phase 2 from this timeline so that the Crossfade takes up 100% of the allocated scroll distance!
    tl.fromTo(filmContainerRef.current, { opacity: 1 }, { opacity: 0, duration: 1.0, ease: 'none' }, 0);
    tl.fromTo(cityBgRef.current, { opacity: 0, filter: 'blur(20px)' }, { opacity: 1, filter: 'blur(0px)', duration: 1.0, ease: 'none' }, 0);

    matchCutTl.current = tl;
    return () => { tl.kill(); };
  }, []);

  // Handle the text reveal phase
  useEffect(() => {
    if (introPhase === 'revealing' && revealTextRef.current) {
      gsap.to(revealTextRef.current, {
        clipPath: 'inset(0 0% 0 0)',
        opacity: 1,
        x: 0,
        filter: 'blur(0px)',
        duration: 1.5,
        ease: 'power3.inOut',
        onComplete: () => setIntroPhase('done')
      });
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
          // 1. Update the master scroll tracker
          scrollData.current.progress = self.progress;
          const p = self.progress;

          // 3. Cinematic Chapter Transitions
          const oldChapter = currentChapterRef.current;
          const newChapter = self.progress < 0.5 ? 'video' : self.progress < 0.85 ? 'globe' : 'finale';

          // MANUAL SCRUBBER: Bind the Match Cut to the scrollbar (0.50 to 0.60)
          if (matchCutTl.current) {
            if (p >= 0.50 && p <= 0.60) {
              const localP = (p - 0.50) / 0.10; // Converts 0.50-0.60 to 0-1
              matchCutTl.current.progress(localP);
              gsap.set(multilingualContainerRef.current, { visibility: 'visible', opacity: 1 });
            } else if (p < 0.50) {
              matchCutTl.current.progress(0);
              gsap.set(multilingualContainerRef.current, { visibility: 'hidden' });
            } else {
              matchCutTl.current.progress(1);
            }
          }

          // HYBRID SLIDE: Automatic time-based hand slide AFTER the crossfade (0.60)
          if (p > 0.60 && !handSlidRef.current) {
            handSlidRef.current = true;
            // Overwrite: true ensures it smoothly reverses course if the user quickly scrolls back and forth!
            gsap.to(handTrackerRef.current, { x: '-25%', y: '1%', duration: 1.2, ease: 'power2.inOut', overwrite: true });
          } else if (p <= 0.60 && handSlidRef.current) {
            handSlidRef.current = false;
            gsap.to(handTrackerRef.current, { x: '0%', y: '0%', duration: 0.8, ease: 'power2.inOut', overwrite: true });
          }

          if (oldChapter !== newChapter) {
            currentChapterRef.current = newChapter;
            setActiveChapter(newChapter);

            // Removed killTweensOf because it permanently destroys the tweens inside matchCutTl
            // The timeline's own .play() and .reverse() methods safely handle overlap natively.
            gsap.killTweensOf(finaleFilmContainerRef.current);
            gsap.killTweensOf(multilingualContainerRef.current);

            if (newChapter === 'video') {
              // Entering Intro (scrolling up from Multilingual)
              gsap.set(finaleFilmContainerRef.current, { opacity: 0 });

            } else if (newChapter === 'globe') {
              // Entering Multilingual (scrolling down from Intro, OR scrolling up from Finale)
              gsap.set(multilingualContainerRef.current, { visibility: 'visible' });

              if (oldChapter === 'video' || oldChapter === 'hero') {
                // Forward transition from intro
                // No time-based GSAP here anymore! The Manual Scrubber above handles it.
                gsap.set(multilingualContainerRef.current, { opacity: 1 });
              } else {
                // Backward transition from Finale
                const tl = gsap.timeline();
                tl.to(finaleFilmContainerRef.current, { opacity: 0, duration: 1.5, ease: 'power2.inOut' }, 0);
                tl.to(multilingualContainerRef.current, { opacity: 1, duration: 1.5, ease: 'power2.inOut' }, 0);
                if (handTrackerRef.current) {
                  gsap.set(handTrackerRef.current, { x: '-25%', y: '1%' });
                }
              }
            } else if (newChapter === 'finale') {
              // Entering Finale (scrolling down from Multilingual)
              const tl = gsap.timeline();
              tl.to(multilingualContainerRef.current, {
                opacity: 0, duration: 1.5, ease: 'power2.inOut', onComplete: () => {
                  if (currentChapterRef.current === 'finale') {
                    gsap.set(multilingualContainerRef.current, { visibility: 'hidden' });
                  }
                }
              }, 0);
              tl.to(finaleFilmContainerRef.current, { opacity: 1, duration: 1.5, ease: 'power2.inOut' }, 0);
              gsap.set(filmContainerRef.current, { opacity: 0 });
            }
          }

          // 4. Fade out Hero Text as user scrolls past 15%
          const tv = self.progress;
          const heroOpacity = Math.max(0, 1 - tv / 0.15);
          gsap.set(heroRef.current, { opacity: heroOpacity });
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
              <CityDroneBackground scrollData={scrollData} />
            </div>

            {/* The hand anchored on the left side */}
            <div ref={handTrackerRef} className="absolute inset-0 w-full h-full pointer-events-none">
              <img
                src="/film/frames/multilingual/hand-transparent.png"
                alt="Hand holding phone"
                className="absolute inset-0 w-full h-full object-cover animate-idle-float"
                style={{ transformOrigin: 'center center' }}
              />
            </div>
          </div>

          {/* LAYER 2: The Intro 4K Video Sequence */}
          <div ref={filmContainerRef} className="absolute inset-0 z-10 w-full h-full">
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
                { key: 'transit-d', out: 2 }
              ]}
              startProgress={0}
              endProgress={0.5}
              reportsProgress
              priority
            />
          </div>

          {/* LAYER 3: The Finale Video Sequence */}
          <div ref={finaleFilmContainerRef} className="absolute inset-0 z-20 w-full h-full">
            <ScrollFilm
              scrollData={scrollData}
              sequenceKeys={['transit-e']}
              startProgress={0.85}
              endProgress={1.0}
            />
          </div>
        </div>

        <div className="absolute inset-0 z-[30] pointer-events-none">

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
              <h1 className="text-5xl md:text-[6rem] leading-none text-white tracking-tight flex items-center justify-center" style={{ fontFamily: 'var(--font-marcellus)' }}>
                {/* Invisible anchor for the Orb to land on */}
                <span id="hero-o-anchor" className="invisible">O</span>
                ne source of truth.
              </h1>
            </div>
            <p
              className="mt-6 text-lg md:text-xl text-gray-300 max-w-3xl leading-relaxed transition-all duration-1000"
              style={{
                fontFamily: 'var(--font-sora)',
                opacity: introPhase === 'done' ? 1 : 0,
                transform: introPhase === 'done' ? 'translateY(0)' : 'translateY(20px)'
              }}
            >
              Live developer inventory, translated into conversation — so every broker and every buyer speaks the same language.
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

        </div>

      </div>

      {/* LAYER 3.5: The Spline orb, blending over the film */}
      {/* Moved OUTSIDE containerRef to prevent ScrollTrigger DOM-surgery from reloading the iframe! */}
      <OrbStage
        scrollData={scrollData}
        introPhase={introPhase}
        onOrbLanded={() => setIntroPhase('revealing')}
        onOrbLoaded={() => setOrbReady(true)}
      />
    </>
  );
}
