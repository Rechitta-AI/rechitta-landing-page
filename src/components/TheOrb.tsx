'use client';

import { useRef, useEffect, useState } from 'react';
import styles from './TheOrb.module.css';

interface TheOrbProps {
  innerFilter?: string;
}

export default function TheOrb({ innerFilter }: TheOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGl, setIsGl] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    let splineApp: any = null;
    let isMounted = true;

    const initSpline = async () => {
      try {
        // Bypass Turbopack/Webpack static analysis by using a Function constructor
        // to dynamically import the ES module from unpkg, exactly like your Nuxt project did!
        const loadSpline = new Function("return import('https://unpkg.com/@splinetool/runtime@1.12.95/build/runtime.js')");
        const mod = await loadSpline();
        const Application = mod.Application;

        const app = new Application(canvasRef.current!);
        
        // Load the scene directly
        await app.load('https://prod.spline.design/IsMZdCzuXM91-03p/scene.splinecode');
        if (!isMounted) return;

        // Ensure the scene fits correctly
        app.setSize(800, 800);
        
        // Use the exact zoom factor from the Nuxt project
        app.setZoom(0.9);

        // Force transparent background using the hacks from ScrollFilm.client.vue
        // Wrapped in a polling loop to guarantee it works on slower Vercel production networks!
        const forceTransparent = () => {
          let attempts = 0;
          const interval = setInterval(() => {
            attempts++;
            if (!isMounted || attempts > 100) {
              clearInterval(interval); // Give up after 10 seconds
              return;
            }
            try {
              // @ts-ignore - accessing internal Spline properties
              const pg = app._scene?.activePage;
              if (pg && pg.bgColor) {
                pg.bgColor.a = 0;
                clearInterval(interval); // Success!
              }
            } catch {}
          }, 100);
        };
        forceTransparent();

        const patchRenderer = () => {
          let attempts = 0;
          const interval = setInterval(() => {
            attempts++;
            if (!isMounted || attempts > 100) {
              clearInterval(interval);
              return;
            }
            try {
              // @ts-ignore
              if (app._renderer && app._renderer.setClearColor) {
                // @ts-ignore
                const orig = app._renderer.setClearColor.bind(app._renderer);
                // @ts-ignore
                app._renderer.setClearColor = (color: any, _a: number) => orig(color, 0);
                clearInterval(interval); // Success!
              }
            } catch {}
          }, 100);
        };
        patchRenderer();
        
        app.play();
        
        // Hide the CSS fallback orb and show the GL canvas
        setIsGl(true);
        splineApp = app;

      } catch (e) {
        console.warn('Spline scene load failed - CSS fallback orb stays.', e);
      }
    };

    initSpline();

    return () => {
      isMounted = false;
      if (splineApp && typeof splineApp.dispose === 'function') {
        splineApp.dispose();
      }
    };
  }, []);

  return (
    <div className={`${styles.orb} ${isGl ? styles.gl : ''}`}>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={800}
        style={innerFilter ? { filter: innerFilter } : undefined}
      />
      <div className={styles.ring}></div>
      <div className={styles.core}></div>
    </div>
  );
}
