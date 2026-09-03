'use client';

import { useEffect, useRef } from 'react';
import { setLoadProgress } from '@/utils/loadProgress';
import { createClock, advanceClock } from '@/utils/filmClock';

interface MasterScrollFilmProps {
  scrollData: React.RefObject<{ progress: number }>;
  src: string;
  startProgress: number;
  endProgress: number;
}

const SEEK_EPSILON = 1 / 48; // Don't re-seek for tiny differences

export default function MasterScrollFilm({
  scrollData,
  src,
  startProgress,
  endProgress,
}: MasterScrollFilmProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Props are read inside a long-lived rAF loop
  const rangeRef = useRef({ startProgress, endProgress });
  useEffect(() => {
    rangeRef.current = { startProgress, endProgress };
  }, [startProgress, endProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isWarmedUp = false;

    // HARDWARE WARM-UP (THE "GPU PUMP")
    const warmup = async () => {
      try {
        await video.play();
        video.pause();
        video.currentTime = 0;
      } catch (err) {
        // Browsers sometimes block programmatic play
      }
    };
    
    // Safety net: force resolution after 3 seconds
    const fallbackTimeout = new Promise(resolve => setTimeout(resolve, 3000));
    Promise.race([warmup(), fallbackTimeout]).then(() => {
      isWarmedUp = true;
    });

    // Loader logic
    const report = () => {
      if (!video.duration) return;
      
      let buffered = 0;
      for (let i = 0; i < video.buffered.length; i++) {
        buffered += video.buffered.end(i) - video.buffered.start(i);
      }
      
      let fraction = Math.min(1, buffered / video.duration);
      
      // Hardware Lock: Never report 100% until GPU is warm
      if (fraction >= 1 && !isWarmedUp) {
        fraction = 0.99;
      }
      
      setLoadProgress(fraction);
    };

    const events = ['progress', 'canplay', 'canplaythrough', 'loadeddata'] as const;
    events.forEach(e => video.addEventListener(e, report));
    const poll = window.setInterval(report, 250);

    const clock = createClock(scrollData.current?.progress ?? 0);
    let lastTime = performance.now();
    let frame: number;

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const { startProgress: from, endProgress: to } = rangeRef.current;
      const target = scrollData.current?.progress ?? 0;
      const eased = advanceClock(clock, target, dt);

      const span = to - from || 1;
      // Local progress from 0 to 1
      const local = Math.max(0, Math.min((eased - from) / span, 1));

      // Don't render until we are close
      const approaching = eased >= from - 0.08;
      if (!approaching) {
        frame = requestAnimationFrame(render);
        return;
      }

      // Promote to download if it hasn't already
      if (video.preload !== 'auto') video.preload = 'auto';

      if (video.readyState >= HTMLMediaElement.HAVE_METADATA && !video.seeking) {
        const targetTime = local * video.duration;
        const clamped = Math.max(0, Math.min(targetTime, video.duration - 0.001));
        
        if (Math.abs(video.currentTime - clamped) > SEEK_EPSILON) {
          video.currentTime = clamped;
        }
      }

      frame = requestAnimationFrame(render);
    };
    
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(poll);
      events.forEach(e => video.removeEventListener(e, report));
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [scrollData, src]);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
      />
    </div>
  );
}
