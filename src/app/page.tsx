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

          // 2. Determine what chapter we are in and ONLY update React if it changed
          const newChapter = self.progress < 0.5 ? 'video' : self.progress < 0.85 ? 'globe' : 'finale';
          if (currentChapterRef.current !== newChapter) {
            currentChapterRef.current = newChapter;
            setActiveChapter(newChapter);
          }

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

      <div ref={containerRef} className="relative w-full h-screen bg-[#070A10] overflow-hidden">
        
        {/* The White Flash overlays for smooth transitions */}
        <div ref={whiteFlashRef} className="absolute inset-0 z-[15] w-full h-full bg-white opacity-0 pointer-events-none" />
        <div ref={finaleWhiteFlashRef} className="absolute inset-0 z-[15] w-full h-full bg-white opacity-0 pointer-events-none" />

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

          {/* LAYER 2: The Intro 4K Video Sequence */}
          <div ref={filmContainerRef} className="absolute inset-0 z-10 w-full h-full">
             
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
