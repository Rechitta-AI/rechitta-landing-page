'use client';

import { useEffect, useState } from 'react';

/**
 * Which of the three layouts is in play.
 *
 * These are the same boundaries the Tailwind breakpoints use (see the `@theme`
 * block in globals.css). Some of the film's overlays cannot be expressed in
 * classes alone — the phone composited into the footage has to stop being
 * composited on a portrait screen, because the shot is 16:9 and the phone in
 * it is cropped away — so those read the mode directly.
 */
export type DeviceMode = 'mobile' | 'tablet' | 'desktop';

export const TABLET_MIN = 810;
export const DESKTOP_MIN = 1200;

export function modeFor(width: number): DeviceMode {
  if (width >= DESKTOP_MIN) return 'desktop';
  if (width >= TABLET_MIN) return 'tablet';
  return 'mobile';
}

/**
 * A portrait viewport cannot show a 16:9 frame and the phone inside it at the
 * same time. Where that matters the overlays lay themselves out flat instead
 * of tracking the footage.
 */
export function isPortraitFor(width: number, height: number): boolean {
  return width / height < 1.25;
}

export function useDeviceMode(): { mode: DeviceMode; portrait: boolean; width: number; height: number } {
  // Server-rendered markup has to pick something; desktop is the common case
  // and the first client effect corrects it before paint matters.
  const [size, setSize] = useState({ width: DESKTOP_MIN, height: 900 });

  useEffect(() => {
    const measure = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  return {
    mode: modeFor(size.width),
    portrait: isPortraitFor(size.width, size.height),
    width: size.width,
    height: size.height,
  };
}
