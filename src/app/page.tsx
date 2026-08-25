'use client';
import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollFilm from '@/components/ScrollFilm';
import TexturedGlobe from '@/components/TexturedGlobe';
import Loader from '@/components/Loader';
import ScrollRail from '@/components/ScrollRail';
import Cursor from '@/components/Cursor';
import OrbStage from '@/components/OrbStage';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

gsap.registerPlugin(ScrollTrigger);

export default function ExperiencePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const filmContainerRef = useRef<HTMLDivElement>(null);
  const whiteFlashRef = useRef<HTMLDivElement>(null);
  
  const finaleFilmContainerRef = useRef<HTMLDivElement>(null);
  const finaleWhiteFlashRef = useRef<HTMLDivElement>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  
  const [activeChapter, setActiveChapter] = useState('hero');
  const [ready, setReady] = useState(false);

  // Lenis inertia, paused until the loader clears.
  useSmoothScroll(ready);
  const scrollData = useRef({ progress: 0 });

  useEffect(() => {
    // Nothing should scroll while the loader is up — the film isn't there yet.
    document.documentElement.style.overflow = ready ? '' : 'hidden';
    if (ready) ScrollTrigger.refresh();
  }, [ready]);

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

          // 2. Determine what chapter we are in
          if (self.progress < 0.5) setActiveChapter('video');
          else if (self.progress >= 0.5 && self.progress < 0.85) setActiveChapter('globe');
          else setActiveChapter('finale');

          // 3. The Match-Cut: White Flash to Globe
          if (self.progress >= 0.5 && self.progress < 0.85) {
            const globeProgress = (self.progress - 0.5) / 0.35;
            
            gsap.set(filmContainerRef.current, { opacity: 0 });
            gsap.set(finaleFilmContainerRef.current, { opacity: 0 });
            
            const flashOpacity = Math.max(0, 1 - (globeProgress / 0.15));
            gsap.set(whiteFlashRef.current, { opacity: flashOpacity });
            gsap.set(finaleWhiteFlashRef.current, { opacity: 0 });
            
          } else if (self.progress < 0.5) {
            gsap.set(filmContainerRef.current, { opacity: 1 });
            gsap.set(finaleFilmContainerRef.current, { opacity: 0 });
            gsap.set(whiteFlashRef.current, { opacity: 0 });
            gsap.set(finaleWhiteFlashRef.current, { opacity: 0 });
          } else {
            // Finale Chapter (0.85 to 1.0)
            const finaleProgress = (self.progress - 0.85) / 0.15;
            
            gsap.set(filmContainerRef.current, { opacity: 0 });
            gsap.set(whiteFlashRef.current, { opacity: 0 });
            gsap.set(finaleFilmContainerRef.current, { opacity: 1 });
            
            // Fade out the second white flash rapidly (over the first 10% of finale)
            const finaleFlashOpacity = Math.max(0, 1 - (finaleProgress / 0.1));
            gsap.set(finaleWhiteFlashRef.current, { opacity: finaleFlashOpacity });
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
      {/* Overlays live outside the pinned container: ScrollTrigger wraps that
          container in a pin-spacer, and React mutating nodes inside it while
          GSAP restructures the DOM throws insertBefore errors. */}
      <Cursor />
      <Loader onDone={() => setReady(true)} />
      <ScrollRail scrollData={scrollData} />

      <div ref={containerRef} className="h-screen w-full relative bg-[#070A10]">

      {/* LAYER 1: The Background Globe */}
      <div
        className="absolute inset-0 z-0 flex items-center justify-center"
        style={{
          // Hidden rather than unmounted: mounting a node inside the pinned
          // container mid-scroll races with ScrollTrigger's DOM surgery.
          visibility: ['video', 'globe', 'finale'].includes(activeChapter)
            ? 'visible'
            : 'hidden',
        }}
      >
        <TexturedGlobe scrollData={scrollData} />
      </div>

      {/* LAYER 1.5: The White Flash Match-Cut Overlay */}
      <div ref={whiteFlashRef} className="absolute inset-0 z-[5] w-full h-full bg-white opacity-0 pointer-events-none" />

      {/* LAYER 2: The Intro 4K Video Sequence */}
      <div ref={filmContainerRef} className="absolute inset-0 z-10 w-full h-full">
         <ScrollFilm 
           scrollData={scrollData} 
           sequenceKeys={['scene1-3', 'transit-b', 'transit-c', 'transit-d']}
           startProgress={0}
           endProgress={0.5}
           reportsProgress
         />
      </div>

      {/* LAYER 2.5: The Finale White Flash */}
      <div ref={finaleWhiteFlashRef} className="absolute inset-0 z-[15] w-full h-full bg-white opacity-0 pointer-events-none" />

      {/* LAYER 3: The Finale Video Sequence */}
      <div ref={finaleFilmContainerRef} className="absolute inset-0 z-20 w-full h-full">
         <ScrollFilm 
           scrollData={scrollData} 
           sequenceKeys={['transit-e']}
           startProgress={0.85}
           endProgress={1.0}
         />
      </div>

      {/* LAYER 3.5: The Spline orb, blending over the film */}
      <OrbStage scrollData={scrollData} />

      {/* LAYER 4: Framer Motion HUD / UI */}
      <div className="absolute inset-0 z-[30] pointer-events-none">
        
        {/* The Hero Content */}
        <div 
          ref={heroRef} 
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-16"
        >
          <h1 className="text-5xl md:text-[6rem] leading-none text-white tracking-tight" style={{ fontFamily: 'var(--font-marcellus)' }}>
            One source of truth.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-3xl leading-relaxed" style={{ fontFamily: 'var(--font-sora)' }}>
            Live developer inventory, translated into conversation — so every broker and every buyer speaks the same language.
          </p>
        </div>

      </div>

      </div>
    </>
  );
}
