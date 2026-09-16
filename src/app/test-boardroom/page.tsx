'use client';
import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollFilm from '@/components/ScrollFilm';
import BoardroomIframeTest from '@/components/BoardroomIframeTest';
import Loader from '@/components/Loader';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

gsap.registerPlugin(ScrollTrigger);

export default function TestBoardroomPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Cinematic Intro Choreography
  const [introPhase, setIntroPhase] = useState<'loading' | 'moving' | 'revealing' | 'done'>('loading');

  // Lenis inertia
  useSmoothScroll(introPhase === 'done');
  const scrollData = useRef({ progress: 0 });
  const holdData = useRef({ clipIndex: -1, progress: 0 });

  useEffect(() => {
    // Nothing should scroll while the cinematic intro is playing.
    document.documentElement.style.overflow = introPhase === 'done' ? '' : 'hidden';
    if (introPhase === 'done') ScrollTrigger.refresh();
  }, [introPhase]);

  // Handle the text reveal phase (just skip straight to done for the test page)
  useEffect(() => {
    if (introPhase === 'revealing') {
      requestAnimationFrame(() => setIntroPhase('done'));
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
          scrollData.current.progress = self.progress;
        }
      });
    }, containerRef);
    return () => ctx.revert();
  }, [introPhase]);

  return (
    <main className="bg-black min-h-screen text-white font-sans selection:bg-white/20 overflow-x-hidden">
      {introPhase === 'loading' && (
        <Loader onDone={() => setIntroPhase('revealing')} orbReady={true} />
      )}

      <div ref={containerRef} className="relative w-full h-screen bg-[#0A0A09] overflow-hidden film-grain-overlay">
        
        <div className="absolute inset-0 w-full h-full" style={{ opacity: (introPhase === 'loading') ? 0 : 1, transition: 'opacity 1s ease-in-out' }}>

          {/* The Intro 4K Video Sequence */}
          <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
            {/* Cinematic Vignette Pulse Overlay */}
            <div className="absolute inset-0 z-20 animate-vignette-pulse pointer-events-none" />

            {/* The Scroll-Locked Iframe Overlay */}
            <BoardroomIframeTest holdData={holdData} />

            <ScrollFilm
              scrollData={scrollData}
              holdData={holdData}
              sequenceKeys={[
                { key: 'scene1-3', out: 11, holdWeight: 8 }, 
                { key: 'transit-b', in: 2 },
                'transit-c',
                'transit-d'
              ]}
              startProgress={0}
              endProgress={1}
              reportsProgress="test"
              priority
            />
          </div>
        </div>

      </div>
    </main>
  );
}
