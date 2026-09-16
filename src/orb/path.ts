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

/**
 * The floor every beat is clamped to, as a fraction of the hero's own scale.
 *
 * Depth in this path is drawn by shrinking, and several beats over the film
 * took that far enough that the orb read as a speck rather than as a thing far
 * away. Six tenths of the opening size is the smallest it may get; the
 * renderer resolves the hero's measured scale and passes the product down.
 */
export const MIN_SCALE_FRACTION = 0.6;

export const ORB_PATH: Keyframe[] = [
  // ── Act I — the dive ────────────────────────────────────────────────
  {
    anchor: { clip: 'scene1-3', t: 2.0 },
    hero: true,
    portrait: { scale: 0.75 },
    x: 50, y: 36, scale: HERO_SCALE, opacity: 0.9, blur: 0,
    ease: 'inOut',
    note: 'K0 — centred above the headline. Text staggers away, the orb stays.',
  },
  /*
   * One waypoint between the headline and the credenza, not three.
   *
   * The dive used to zigzag — out to the window, down onto the near end of
   * the table, back up its centreline — and packed all of that into under two
   * seconds of footage played at 2.4x, so the orb raced the camera here when
   * everywhere else it keeps pace with it. With a single waypoint roughly
   * halfway along the distance and halfway through the shot, the orb covers
   * the room at an even speed: 'in' then 'out' meet at the same velocity, so
   * it never lurches at the waypoint either. It sits at 6.0s so it lands just
   * before the screen's exclusion window opens.
   */
  {
    anchor: { clip: 'scene1-3', t: 6.0 },
    x: 46, y: 60, scale: 0.5, opacity: 0.9, blur: 0,
    ease: 'in',
    note: 'K1 — following the camera through the glass and down into the room.',
  },
  {
    anchor: { clip: 'scene1-3', t: 11.0 },
    // Below the flat deck and its slide controls, not across them.
    portrait: { x: 50, y: 90, scale: 0.24 },
    /*
     * Lowered from 78 onto the credenza face. The floor lifted this beat from
     * 0.3 to 0.72, and at that size the orb was sitting on the deck's slide
     * controls rather than hovering clear of them. Two nudges down later it is
     * below the credenza's top edge, which is both out of the dock's way and
     * what the note here has always claimed: resting on the furniture.
     */
    x: 50, y: 87, scale: 0.3, opacity: 0.75, blur: 0,
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
    // Desktop measures its pose off the answer column instead (OrbStage).
    brokerDock: true,
    // Stacked, the live app sits centre screen; 23% lands on it.
    portrait: { x: 84, y: 20, scale: 0.5 },
    /*
     * Raised from 33. The objections now run down this side of the frame, and
     * at the floored size the orb was sitting on the first card's top corner.
     */
    x: 23, y: 25, scale: 0.6, opacity: 1, blur: 0,
    ease: 'out',
    note: 'K9 — slides clear of the phone and flares. The app mockup lights.',
  },

  /*
   * ── Act III — through the phone ───────────────────────────────────
   *
   * Retired with the buyer's scene. Every beat here was anchored to
   * transit-c or to the head of transit-d, which are no longer in the cut,
   * so they would resolve to nothing even if they were left in the list.
   *
   * {
   *   anchor: { clip: 'transit-c', t: 4.0 },
   *   x: 50, y: 50, scale: 1.4, opacity: 1, blur: 0,
   *   ease: 'inOut',
   *   note: 'K10 — full whiteout. The orb is the only object on screen.',
   * },
   * {
   *   anchor: { clip: 'transit-c', t: 5.3 },
   *   x: 56, y: 56, scale: 0.68, opacity: 1, blur: 0,
   *   ease: 'inOut',
   *   note: 'K11a — re-condenses over the bay as the beach comes into view.',
   * },
   * {
   *   anchor: { clip: 'transit-c', t: 6.2 },
   *   x: 62, y: 72, scale: 0.42, opacity: 1, blur: 0,
   *   ease: 'out',
   *   note: 'K11b — sweeps in an arc clear of the phone screen toward the bottom dock.',
   * },
   * {
   *   anchor: { clip: 'transit-c', t: 6.8 },
   *   pulse: true,
   *   portrait: { x: 84, y: 20, scale: 0.4 },
   *   x: 46.5, y: 84.1, scale: 0.26, opacity: 1, blur: 0,
   *   ease: 'out',
   *   note: 'K11c — touches down into the buyer phone voice dock and flares.',
   * },
   * {
   *   anchor: { clip: 'transit-d', t: 0.0 },
   *   portrait: { x: 84, y: 20, scale: 0.4 },
   *   x: 46.5, y: 84.1, scale: 0.26, opacity: 1, blur: 0,
   *   ease: 'in',
   *   note: 'K11d — holds docked through the presentation pause, then lifts off.',
   * },
   */

  // ── Act III — Focus pull into the multilingual chapter ─────────────
  {
    anchor: { progress: 0.47 },
    x: 50, y: 50, scale: 0.65, opacity: 1, blur: 0,
    ease: 'inOut',
    note: 'K11 — glides to the center optical focus line.',
  },
  {
    anchor: { progress: 0.495 },
    pulse: true,
    x: 50, y: 50, scale: 1.1, opacity: 1, blur: 0,
    ease: 'inOut',
    note: 'K12 — pulses at 04:11 UTC under the anamorphic blue streak.',
  },

  /*
   * ── Act IV — the multilingual chapter ─────────────────────────────
   *
   * The orb docks at the foot of the handset rather than hanging in the sky
   * opposite it. The chapter's whole claim is that the briefing arrives on
   * that phone, and an orb parked over the skyline was the one object on
   * screen not saying so. On its dock it reads as the agent that delivered
   * the message, which is what it is everywhere else in the film.
   *
   * The mockup's foot moves with the viewport — 78vh capped at 780px, so its
   * bottom edge sits between 82% and 89% down a landscape screen — so the
   * pose is a little inside the frame rather than on its very edge.
   */
  {
    anchor: { progress: 0.52 },
    dock: true,
    // Portrait centers the handset and docks the orb cleanly at its bottom center.
    portrait: { x: 50, y: 72.4, scale: 0.7 },
    x: 40, y: 82, scale: 0.85, opacity: 1, blur: 0,
    ease: 'out',
    note: 'K13 — settles onto the foot of the phone as the chapter opens.',
  },
  {
    anchor: { progress: 0.93 },
    dock: true,
    portrait: { x: 50, y: 72.4, scale: 0.7 },
    x: 40, y: 82, scale: 0.85, opacity: 1, blur: 0,
    ease: 'linear',
    note: 'K14 — holds on the dock, pulsing as each city takes over.',
  },

  // ── Act V — home ────────────────────────────────────────────────────
  {
    anchor: { progress: 0.96 },
    finaleDock: true,
    portrait: { x: 50, y: 90, scale: 0.52 },
    /*
     * On the screen rather than under it. At 86 the orb sat across the deck's
     * own control dock, which is the one thing on this beat that has to be
     * readable. 70 puts it on the lower third of the lit panel — inside the
     * picture at every aspect the frame crops to, with at least 3% of the
     * viewport between its underside and the bezel.
     */
    x: 50, y: 70, scale: 0.60, opacity: 0.95, blur: 0,
    ease: 'out',
    pulse: true,
    note: 'K15 — docks smoothly at the bottom below all content in the presentation scene.',
  },
  {
    anchor: { progress: 1.0 },
    hero: true,
    portrait: { scale: 0.75 },
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
  /* The buyer's phone, retired with its scene. The zone is kept against the
     day the scene comes back; it resolves to nothing while transit-c is out
     of the cut, so it costs nothing to leave here.
     {
       label: "buyer's phone content area",
       window: { clip: 'transit-c', from: 5.5, to: 8 },
       rect: { x0: 40, y0: 15, x1: 60, y1: 76 },
     }, */
  {
    /*
     * The lit part of the mockup only. The foot of the handset is the orb's
     * dock in this chapter, the way the voice dock was in the buyer's, so the
     * zone stops above it rather than covering the whole object.
     */
    label: 'phone mockup screen, multilingual chapter',
    window: { from: 0.52, to: 0.95 },
    rect: { x0: 26, y0: 6, x1: 54, y1: 60 },
  },
  {
    label: 'city name, multilingual chapter',
    window: { from: 0.52, to: 0.95 },
    rect: { x0: 60, y0: 36, x1: 96, y1: 62 },
  },
];
