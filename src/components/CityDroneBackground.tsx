'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const CITIES = [
  { key: 'mumbai',   src: '/film/places/mumbai.mp4' },
  { key: 'moscow',   src: '/film/places/moscow.mp4' },
  { key: 'london',   src: '/film/places/london.mp4' },
  { key: 'shanghai', src: '/film/places/shanghai.mp4' },
  { key: 'riyadh',   src: '/film/places/riyadh.mp4' },
  { key: 'paris',    src: '/film/places/paris.mp4' },
];

/**
 * A lightweight drone-shot background that auto-plays city videos one at a time.
 * Uses a single <canvas> as the rendering surface and keeps at most 2 <video>
 * elements alive (current + next during a brief crossfade).
 */
export default function CityDroneBackground({
  scrollData,
}: {
  scrollData: React.MutableRefObject<{ progress: number }>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Sizing ──────────────────────────────────────────────────
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Video Factory ───────────────────────────────────────────
    const makeVideo = (src: string): HTMLVideoElement => {
      const v = document.createElement('video');
      v.src = src;
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.loop = true;
      v.preload = 'auto';
      v.style.display = 'none';
      document.body.appendChild(v);
      return v;
    };

    const destroyVideo = (v: HTMLVideoElement) => {
      v.pause();
      v.removeAttribute('src');
      v.load();
      v.remove();
    };

    // ── State ───────────────────────────────────────────────────
    const posters = CITIES.map(c => {
      const img = new Image();
      const filename = c.src.split('/').pop();
      const basename = filename?.split('.')[0];
      img.src = `/film/places/frames/${basename}.jpg`;
      return img;
    });

    let currentIndex = 0;
    let currentVideo: HTMLVideoElement | null = makeVideo(CITIES[0].src);
    // Kickstart it so it preloads, but the render loop will immediately pause it if we aren't scrolled down yet
    currentVideo.play().catch(() => {});
    
    let nextVideo: HTMLVideoElement | null = null;

    // Crossfade state
    let isFading = false;
    let fadeProgress = 0; // 0 → 1
    const FADE_DURATION = 0.6; // seconds
    let fadeStart = 0;

    let frame: number;
    let lastTime = performance.now();

    // ── Draw helpers ────────────────────────────────────────────
    const drawCover = (
      media: HTMLVideoElement | HTMLImageElement,
      alpha: number
    ) => {
      if (media instanceof HTMLVideoElement && media.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      if (media instanceof HTMLImageElement && !media.complete) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const vw = media instanceof HTMLVideoElement ? (media.videoWidth || cw) : (media.width || cw);
      const vh = media instanceof HTMLVideoElement ? (media.videoHeight || ch) : (media.height || ch);

      // object-fit: cover math
      const canvasRatio = cw / ch;
      const videoRatio = vw / vh;
      let sx = 0, sy = 0, sw = vw, sh = vh;
      if (videoRatio > canvasRatio) {
        // Video is wider — crop sides
        sw = vh * canvasRatio;
        sx = (vw - sw) / 2;
      } else {
        // Video is taller — crop top/bottom
        sh = vw / canvasRatio;
        sy = (vh - sh) / 2;
      }

      ctx.globalAlpha = alpha;
      ctx.drawImage(media, sx, sy, sw, sh, 0, 0, cw, ch);
    };

    // ── Render Loop ─────────────────────────────────────────────
    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const p = scrollData.current.progress;

      // LAZY LOADING FIX: 
      // Do absolutely nothing until the exact millisecond of the match-cut (50% down the page).
      // This prevents the heavy drone videos from stealing bandwidth and GPU 
      // from the initial cinematic intro (especially transit-d).
      if (p < 0.499 || p > 0.96) {
        // If we are far away, pause the current video to save CPU
        if (currentVideo && !currentVideo.paused) currentVideo.pause();
        frame = requestAnimationFrame(render);
        return;
      } else {
        // Wake it back up if we scrolled back into view
        if (currentVideo && currentVideo.paused) currentVideo.play().catch(() => {});
      }

      // This component is active from progress 0.5 to 0.85
      let localP = (p - 0.5) / 0.35;
      localP = Math.max(0, Math.min(1, localP));

      // Which city should be showing?
      // CUSTOM TIMING: Give Mumbai (index 0) 15% of the scrollbar (from 0.50 to 0.65)
      // to ensure it stays locked in during the crossfade transition and while the phone slides in.
      // The remaining 5 cities share the remaining 30% (from 0.65 to 0.95).
      let targetIndex = 0;
      if (p >= 0.65) {
        const remainingP = Math.max(0, Math.min(1, (p - 0.65) / 0.30));
        const numRemainingCities = CITIES.length - 1; // 5 cities
        // Math.floor(remainingP * 5) yields 0, 1, 2, 3, 4
        let segmentIndex = Math.floor(remainingP * numRemainingCities);
        if (segmentIndex >= numRemainingCities) segmentIndex = numRemainingCities - 1;
        targetIndex = 1 + segmentIndex;
      }

      // ── City changed? Prepare crossfade ──
      if (targetIndex !== currentIndex && !isFading) {
        if (!nextVideo || !nextVideo.src.endsWith(CITIES[targetIndex].src)) {
          if (nextVideo) destroyVideo(nextVideo); // Destroy if we scrolled past it before it loaded
          nextVideo = makeVideo(CITIES[targetIndex].src);
          nextVideo.play().catch(() => {});
        }
      }

      // Start the crossfade ONLY when the next video has actually decoded its first frame
      if (nextVideo && !isFading) {
        if (nextVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          isFading = true;
          fadeStart = now;
          fadeProgress = 0;

          // Trigger GSAP Focus Pull for Typography
          if (textRef.current) {
            gsap.to(textRef.current, {
              opacity: 0,
              filter: 'blur(20px)',
              duration: 0.4,
              onComplete: () => {
                if (textRef.current) {
                  textRef.current.innerText = CITIES[targetIndex].key.toUpperCase();
                  gsap.fromTo(textRef.current,
                    { opacity: 0, filter: 'blur(20px)' },
                    { opacity: 1, filter: 'blur(0px)', duration: 0.4 }
                  );
                }
              }
            });
          }
        }
      }

      // ── Advance crossfade ──
      if (isFading && nextVideo) {
        fadeProgress = Math.min(1, (now - fadeStart) / (FADE_DURATION * 1000));

        if (fadeProgress >= 1) {
          // Crossfade complete — destroy old, promote next
          if (currentVideo) destroyVideo(currentVideo);
          currentVideo = nextVideo;
          nextVideo = null;
          currentIndex = targetIndex;
          isFading = false;
        }
      }

      // ── Paint ──
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (currentVideo && !isFading) {
        // Steady state — paint poster first to catch loop flashes, then video
        drawCover(posters[currentIndex], 1);
        drawCover(currentVideo, 1);
      } else if (isFading) {
        // During crossfade — blend both with a cinematic focus pull (blur)
        // Blur peaks at 15px in the middle of the transition (fadeProgress = 0.5)
        const blurAmount = Math.sin(fadeProgress * Math.PI) * 15;
        ctx.filter = `blur(${blurAmount}px)`;

        // Draw posters
        if (currentVideo) drawCover(posters[currentIndex], 1 - fadeProgress);
        if (nextVideo) drawCover(posters[targetIndex], fadeProgress);

        // Draw videos on top
        if (currentVideo) drawCover(currentVideo, 1 - fadeProgress);
        if (nextVideo) drawCover(nextVideo, fadeProgress);

        ctx.filter = 'none'; // reset filter for next frame
      }

      ctx.globalAlpha = 1;

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    // ── Cleanup ─────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      if (currentVideo) destroyVideo(currentVideo);
      if (nextVideo) destroyVideo(nextVideo);
    };
  }, [scrollData]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover' }}
      />
      {/* The Dynamic City Title (Positioned on the Right) */}
      <h1 
        ref={textRef}
        className="absolute top-1/2 -translate-y-1/2 right-[10%] text-6xl md:text-[6rem] text-white tracking-tighter"
        style={{ fontFamily: 'var(--font-monument)', zIndex: 20 }}
      >
        MUMBAI
      </h1>
    </>
  );
}
