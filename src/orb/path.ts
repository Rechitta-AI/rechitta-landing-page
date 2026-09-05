/**
 * The orb's flight path — the whole choreography, top to bottom, as a shot
 * list.
 *
 * Three rules govern every beat here (see
 * docs/superpowers/specs/2026-09-03-orb-navigator-design.md):
 *
 *   1. Always present. The orb never fully leaves the screen.
 *   2. Leads, never rides. It starts toward the next destination before the
 *      camera does.
 *   3. Never on a screen. The boardroom display and every phone in the film
 *      will hold real app mockups; EXCLUSION_ZONES below make that enforceable
 *      rather than a matter of memory.
 *
 * Beats over the film anchor to clip time, not scroll progress: clip durations
 * are read from video metadata at runtime, so a retrim would silently slide
 * every hardcoded progress number out of sync with the footage.
 *
 * Positions are viewport percent, placed against extracted frames. Scale and
 * blur are calibrated by eye — tune them here and nowhere else.
 */

import type { ExclusionZone, Keyframe } from './types';

/** Scale of the orb at the hero, matching the intro's GSAP landing. */
const HERO_SCALE = 1.2;

export const ORB_PATH: Keyframe[] = [
  // ── Act I — the dive ────────────────────────────────────────────────
  {
    anchor: { clip: 'scene1-3', t: 2.0 },
    hero: true,
    x: 50, y: 36, scale: HERO_SCALE, opacity: 0.9, blur: 0,
    ease: 'inOut',
    note: 'K0 — centred above the headline. Text staggers away, the orb stays.',
  },
  {
    anchor: { clip: 'scene1-3', t: 5.0 },
    x: 40, y: 48, scale: 0.5, opacity: 0.9, blur: 0,
    ease: 'in',
    note: 'K1 — at the lit boardroom window while the camera is still outside the glass.',
  },
  {
    anchor: { clip: 'scene1-3', t: 6.6 },
    x: 55, y: 80, scale: 0.58, opacity: 0.95, blur: 0,
    ease: 'out',
    note: 'K2 — through the glass, low, touching down on the near end of the table.',
  },
  {
    anchor: { clip: 'scene1-3', t: 8.5 },
    x: 58, y: 74, scale: 0.4, opacity: 0.9, blur: 0,
    ease: 'inOut',
    note: 'K3 — sliding up the table centreline, shrinking along its vanishing line.',
  },
  {
    anchor: { clip: 'scene1-3', t: 11.0 },
    // Below the flat deck and its slide controls, not across them.
    portrait: { x: 50, y: 90, scale: 0.24 },
    x: 50, y: 78, scale: 0.3, opacity: 0.75, blur: 0,
    ease: 'out',
    note: 'K4 — rests on the credenza below the screen. Holds through the whole deck.',
  },

  // ── Act II — out to the broker ──────────────────────────────────────
  {
    anchor: { clip: 'transit-b', t: 4.0 },
    x: 47, y: 58, scale: 0.2, opacity: 0.8, blur: 1.2,
    ease: 'in',
    note: 'K5 — camera pulls wide; the orb lifts off first.',
  },
  {
    anchor: { clip: 'transit-b', t: 6.0 },
    x: 66, y: 41, scale: 0.62, opacity: 0.95, blur: 0,
    ease: 'out',
    note: 'K6 — out through the facade ahead of the camera. Longest trail in the film.',
  },
  {
    anchor: { clip: 'transit-b', t: 9.0 },
    x: 58, y: 44, scale: 0.5, opacity: 0.9, blur: 0,
    ease: 'inOut',
    note: 'K7 — on the terrace, arcing down toward the small figure.',
  },
  {
    anchor: { clip: 'transit-b', t: 13.0 },
    x: 57, y: 62, scale: 0.42, opacity: 0.9, blur: 0,
    ease: 'out',
    note: 'K8 — hovering above his hands. Slows to almost nothing.',
  },
  {
    anchor: { clip: 'transit-b', t: 16.8 },
    pulse: true,
    // Stacked, the live app sits centre screen; 23% lands on it.
    portrait: { x: 84, y: 20, scale: 0.5 },
    x: 23, y: 33, scale: 0.6, opacity: 1, blur: 0,
    ease: 'out',
    note: 'K9 — slides clear of the phone and flares. The app mockup lights.',
  },

  // ── Act III — through the phone ─────────────────────────────────────
  {
    anchor: { clip: 'transit-c', t: 4.0 },
    x: 50, y: 50, scale: 1.4, opacity: 1, blur: 0,
    ease: 'inOut',
    note: 'K10 — full whiteout. The orb is the only object on screen.',
  },
  {
    anchor: { clip: 'transit-c', t: 5.3 },
    x: 56, y: 56, scale: 0.68, opacity: 1, blur: 0,
    ease: 'inOut',
    note: 'K11a — re-condenses over the bay as the beach comes into view.',
  },
  {
    anchor: { clip: 'transit-c', t: 6.2 },
    x: 62, y: 72, scale: 0.42, opacity: 1, blur: 0,
    ease: 'out',
    note: 'K11b — sweeps in an arc clear of the phone screen toward the bottom dock.',
  },
  {
    anchor: { clip: 'transit-c', t: 6.8 },
    pulse: true,
    // The voice dock it touches down on is only there in the composite.
    portrait: { x: 84, y: 20, scale: 0.4 },
    x: 46.5, y: 84.1, scale: 0.26, opacity: 1, blur: 0,
    ease: 'out',
    note: 'K11c — smoothly touches down dead-centre into the buyer phone voice dock R circle and flares.',
  },
  {
    anchor: { clip: 'transit-d', t: 0.0 },
    portrait: { x: 84, y: 20, scale: 0.4 },
    x: 46.5, y: 84.1, scale: 0.26, opacity: 1, blur: 0,
    ease: 'in',
    note: 'K11d — holds docked in the phone voice dock through the presentation pause, then lifts off.',
  },
  {
    anchor: { clip: 'transit-d', t: 5.9 },
    x: 50, y: 48, scale: 0.9, opacity: 1, blur: 0,
    ease: 'inOut',
    note: 'K12 — expands into the cloud whiteout, seeding the white flash.',
  },

  // ── Act IV — the multilingual chapter ───────────────────────────────
  {
    anchor: { progress: 0.52 },
    // The mockup is centred on a portrait screen, so the orb takes the sky.
    portrait: { x: 82, y: 17, scale: 0.5 },
    x: 72, y: 19, scale: 0.62, opacity: 0.95, blur: 0,
    ease: 'out',
    note: 'K13 — arrives in the sky above the city name, opposite the phone.',
  },
  {
    anchor: { progress: 0.93 },
    portrait: { x: 82, y: 17, scale: 0.5 },
    x: 72, y: 19, scale: 0.62, opacity: 0.95, blur: 0,
    ease: 'linear',
    note: 'K14 — holds, pulsing on every city change with a filament to the phone.',
  },

  // ── Act V — home ────────────────────────────────────────────────────
  {
    anchor: { progress: 0.96 },
    x: 38, y: 62, scale: 0.5, opacity: 0.9, blur: 0,
    ease: 'in',
    note: 'K15 — rises from the tower over the dawn skyline.',
  },
  {
    anchor: { progress: 1.0 },
    hero: true,
    x: 50, y: 36, scale: HERO_SCALE, opacity: 0.9, blur: 0,
    ease: 'out',
    note: 'K16 — comes to rest mid-screen above headline, on the exact coordinates of K0. The orb is the stitch that hides the loop.',
  },
];

/**
 * Surfaces that will hold app mockups. The orb's path may never enter these.
 *
 * The boardroom rectangle mirrors the real overlay geometry in
 * BoardroomPresentation.tsx (top 13%, left 28.4%, width 44.5%, height 48.6%),
 * widened to cover the slide controls beneath it.
 */
export const EXCLUSION_ZONES: ExclusionZone[] = [
  {
    label: 'boardroom presentation screen + slide controls',
    window: { clip: 'scene1-3', from: 6.2, to: 11 },
    rect: { x0: 26, y0: 10, x1: 75, y1: 64 },
  },
  {
    label: 'boardroom screen, wide shot',
    window: { clip: 'transit-b', from: 2, to: 5 },
    rect: { x0: 40, y0: 35, x1: 53, y1: 51 },
  },
  {
    label: "broker's phone",
    window: { clip: 'transit-b', from: 15, to: 17 },
    rect: { x0: 41, y0: 7, x1: 63, y1: 90 },
  },
  {
    label: "buyer's phone content area",
    window: { clip: 'transit-c', from: 5.5, to: 8 },
    rect: { x0: 40, y0: 15, x1: 60, y1: 76 },
  },
  {
    label: 'phone mockup, multilingual chapter',
    window: { from: 0.5, to: 0.95 },
    rect: { x0: 26, y0: 6, x1: 54, y1: 94 },
  },
  {
    label: 'city name, multilingual chapter',
    window: { from: 0.5, to: 0.95 },
    rect: { x0: 60, y0: 36, x1: 96, y1: 62 },
  },
];
