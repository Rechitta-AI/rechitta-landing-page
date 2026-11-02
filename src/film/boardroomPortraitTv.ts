/**
 * Where the boardroom TV sits inside a portrait viewport, and how far it may
 * be zoomed — the one geometry both the HTML deck (BoardroomPresentation.tsx)
 * and the video's own CSS zoom (FilmStage.tsx's playForward/settle) have to
 * agree on, so the two can never silently drift apart.
 *
 * All pure: no DOM, no time. See src/screens/warp.ts for the same convention.
 */
import { coverRect } from '@/screens/warp';

/*
 * Calibrated values for mobile 9:16 video (upscaled-video_first-mobile).
 * Inner whiteboard face at Frame 120 (5.0s): leaves all 4 outer TV bezels
 * (top: 31.33%, bottom: 58.52%, left: 11.67%, right: 88.61%) 100% exposed.
 */
export const PORTRAIT_TV_TOP = 32.65;
export const PORTRAIT_TV_WIDTH = 73.5;
export const PORTRAIT_TV_HEIGHT = 25.65;

/**
 * The TV's top edge as a % of viewport height — the fixed pivot every
 * portrait zoom of the TV scales from, so the top edge (and everything
 * placed above it, like the brand-logo strips) never moves.
 */
export function portraitTvTopYPercent(viewportWidth: number, viewportHeight: number): number {
  const rect = coverRect(viewportWidth, viewportHeight, 9 / 16);
  const topY = rect.y + (PORTRAIT_TV_TOP / 100) * rect.height;
  return (topY / viewportHeight) * 100;
}

/**
 * Caps a nominal zoom against two independent safety margins, so it
 * gracefully gives way instead of overflowing either. Shared by the HTML
 * deck and the video's own CSS scale so both land on the identical number
 * for a given viewport.
 */
export function portraitTvZoom(
  viewportWidth: number,
  viewportHeight: number,
  nominalZoom: number,
): number {
  const rect = coverRect(viewportWidth, viewportHeight, 9 / 16);

  // 1. Side margin — unchanged from the original 14px-margin clamp.
  const sideMarginZoom = (viewportWidth - 28) / (rect.width * 0.77);

  // 2. Room below the TV, down to the orb's fixed resting point. The TV's
  // top edge is pinned (see portraitTvTopYPercent), so 100% of its growth
  // lands on its bottom edge — exactly where the slide-controls dock sits,
  // and, on a short phone, where the "projects" brand strip falls back to
  // when it no longer fits above the TV (BoardroomPresentation.tsx's
  // `!stackAbove` branch). Nothing stops that content from being pushed
  // into the orb's fixed 90%-down resting spot (src/orb/path.ts, K4) unless
  // the zoom itself is capped before that happens.
  //
  // The sizes below mirror BoardroomPresentation.tsx's own defaults
  // (dockHeight/stripHeight's initial state, controlsTop's and
  // stripGapBelow's fixed terms) rather than live-measured values — this
  // runs in a different file with no access to that component's refs, and
  // it only needs to be a safety margin, not a pixel-exact budget (the
  // original side-margin clamp already works the same way, via its own
  // `* 0.77` fudge factor). Reserves room for the fallen-below strip
  // unconditionally, even on tall phones where it never actually falls
  // there — harmless, since those phones have the most room to spare and
  // this branch of the clamp will never be the one that binds for them.
  const compactDock = viewportHeight < 760;
  const screenTop = rect.y + (PORTRAIT_TV_TOP / 100) * rect.height;
  const H0 = (PORTRAIT_TV_HEIGHT / 100) * rect.height;
  const APPROX_DOCK_HEIGHT = 30;
  const APPROX_STRIP_HEIGHT = compactDock ? 44 : 58;
  const CONTROLS_GAP = compactDock ? 12 : 22;
  const STRIP_GAP_BELOW = compactDock ? 10 : 14;
  const reservedBelow = CONTROLS_GAP + APPROX_DOCK_HEIGHT + STRIP_GAP_BELOW + APPROX_STRIP_HEIGHT;
  const ORB_Y_PERCENT = 90; // src/orb/path.ts K4 — never changed by this fix
  const ORB_CLEARANCE = 16;
  const maxHeight = viewportHeight * (ORB_Y_PERCENT / 100) - ORB_CLEARANCE - screenTop - reservedBelow;
  // Never shrinks below today's un-zoomed baseline — this clamp only caps
  // how much *extra* zoom is allowed, it never retroactively shrinks a
  // layout that already ships today.
  const verticalRoomZoom = maxHeight > H0 ? maxHeight / H0 : 1.0;

  return Math.min(nominalZoom, sideMarginZoom, verticalRoomZoom);
}

/**
 * Like `portraitTvZoom`, but floored at 1.0 — for the video's own CSS scale
 * specifically, never for the HTML overlay's `containScale`.
 *
 * `sideMarginZoom` above can legitimately land just under 1.0 on an ordinary
 * phone, not just an ultra-narrow one: on any viewport taller/narrower than
 * 9:16 (most modern phones — an iPhone 14 at 390×844 computes ~0.99, a
 * Pixel 7 at 412×915 ~0.97), the un-cropped 9:16 cover-rect is wider than
 * the real viewport, so the 14px-margin formula alone comes out just below
 * 1. That is harmless for `containScale` — the HTML deck is free-floating
 * content with no hard edge, so shrinking it a fraction of a percent is
 * invisible, and this is the pre-existing, intended margin-safety behavior.
 *
 * It is not harmless for the video: it is full-bleed (`width/height: 100%`,
 * `object-fit: cover`) with no margin of its own, so a `transform: scale()`
 * below 1 pulls its edges in from its container's edges and reveals
 * whatever is behind it — a visible black border around the TV, seen on
 * exactly the ordinary phones above. The video must only ever zoom in or
 * stay at its native size, never shrink, so this floors the result at 1.0.
 */
export function portraitTvVideoPush(
  viewportWidth: number,
  viewportHeight: number,
  nominalZoom: number,
): number {
  return Math.max(1, portraitTvZoom(viewportWidth, viewportHeight, nominalZoom));
}
