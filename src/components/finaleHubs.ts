/**
 * The finale deck's seven hubs, and where their labels sit.
 *
 * Lifted out of FinaleWorldMapPresentation so the map and the portrait hub
 * panel below it read the same list, and so the portrait label placement can
 * be checked by a test rather than by eye.
 *
 * Global Hub Data matching the 6 Multilingual Cities + Dubai Headquarters.
 * Re-anchored to the 1.73:1 (2000 x 1156) reference canvas to eliminate
 * compression. All derived to read THE SAME MOMENT: 04:11 UTC.
 */

export interface GlobalHub {
  key: string;
  name: string;
  x: number;
  y: number;
  time: string;
  lang: string;
  status: string;
  isHQ?: boolean;
  /** Where the full pill badge sits. Landscape only. */
  labelOffset: { x: number; y: number };
  /** Where the two-letter chip sits on a portrait screen. See PORTRAIT_CHIP. */
  portraitChipOffset: { x: number; y: number };
}

/**
 * The two-letter chip the map carries instead of a full badge on a phone.
 *
 * On a portrait screen the 2000-unit canvas is painted onto the television at
 * about 0.155, so the authored 17-unit city name landed at 2.9 CSS px and the
 * 232-unit badge at 36 px wide — the labels were sub-pixel and the names
 * unreadable. A phone cannot carry "LONDON · 05:11" inside that television at
 * any size, so it carries "EN" instead and the names read in a real-pixel
 * panel under the set (FinaleHubPanel).
 *
 * `text` 62 units resolves to ~9.6 px, which is the smallest the two letters
 * stay legible. Everything else here follows from it.
 */
export const PORTRAIT_CHIP = {
  width: 112,
  height: 76,
  rx: 14,
  text: 62,
  stroke: 4,
  /** Half-extents, for the overlap arithmetic below. */
  halfW: 56,
  halfH: 38,
} as const;

/** The map image's own band on the canvas: `<image y="145" height="857">`. */
export const MAP_BAND = { top: 145, bottom: 1002 } as const;

/**
 * Reserved for the header. On portrait the header is enlarged to ~60 units so
 * it can be read at all, and a chip drifting up into this band sits on top of
 * it — which is exactly what the first pass did to "RECHITTA // GLOBAL".
 */
export const HEADER_BAND_BOTTOM = 150;

/** The least any two chips may be apart on one axis before they collide. */
export const CHIP_MIN_SEPARATION = 112;

export const GLOBAL_HUBS: GlobalHub[] = [
  {
    key: 'london',
    name: 'LONDON',
    x: 980,
    y: 310,
    time: '05:11',
    lang: 'EN',
    status: 'DELIVERED',
    labelOffset: { x: -68, y: -34 },
    // Up and left. London and Paris are 35 units apart, closer than one chip
    // is wide, so the pair is split vertically and both sit west of their dots.
    portraitChipOffset: { x: -80, y: -86 },
  },
  {
    key: 'paris',
    name: 'PARIS',
    x: 995,
    y: 345,
    time: '05:11',
    lang: 'FR',
    status: 'DELIVERED',
    labelOffset: { x: 68, y: 34 },
    portraitChipOffset: { x: -80, y: 78 },
  },
  {
    key: 'moscow',
    name: 'MOSCOW',
    x: 1185,
    y: 305,
    time: '07:11',
    lang: 'RU',
    status: 'DELIVERED',
    labelOffset: { x: 0, y: -34 },
    // Straight up, but not so far that it enters the header band.
    portraitChipOffset: { x: 0, y: -92 },
  },
  {
    key: 'riyadh',
    name: 'RIYADH',
    x: 1245,
    y: 480,
    time: '07:11',
    lang: 'AR',
    status: 'DELIVERED',
    labelOffset: { x: -85, y: -28 },
    // West, clear of Dubai's dot. Riyadh, Dubai and Mumbai sit within 140
    // units of each other; this is the cluster the full badges could not
    // resolve, so the three go west / south / east of the Gulf respectively.
    portraitChipOffset: { x: -104, y: -8 },
  },
  {
    key: 'dubai',
    name: 'DUBAI HQ',
    x: 1292,
    y: 485,
    time: '08:11',
    lang: 'HQ',
    status: 'GLOBAL ENGINE',
    isHQ: true,
    labelOffset: { x: 0, y: 40 },
    portraitChipOffset: { x: 0, y: 96 },
  },
  {
    key: 'mumbai',
    name: 'MUMBAI',
    x: 1385,
    y: 505,
    time: '09:41',
    lang: 'HI',
    status: 'DELIVERED',
    /*
     * Positioned southeast to guarantee zero overlap with Dubai HQ.
     * With Dubai HQ badge at width 250 (x: -125..+125), Dubai's right edge reaches x = 1417.
     * Mumbai at offset x: +152 places its left edge at x = 1421, ensuring complete clearance.
     */
    labelOffset: { x: 152, y: 56 },
    portraitChipOffset: { x: 112, y: -14 },
  },
  {
    key: 'shanghai',
    name: 'SHANGHAI',
    x: 1625,
    y: 455,
    time: '12:11',
    lang: 'ZH',
    status: 'DELIVERED',
    labelOffset: { x: 0, y: -34 },
    portraitChipOffset: { x: 36, y: -96 },
  },
];

/** Geodesic arc generator from hub to Dubai HQ */
export function makeArcPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const midX = (fromX + toX) / 2;
  const dist = Math.hypot(toX - fromX, toY - fromY);
  const midY = (fromY + toY) / 2 - dist * 0.22;
  return `M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`;
}

export const DUBAI_HQ = GLOBAL_HUBS.find((h) => h.isHQ)!;

export const STREAM_ARCS = GLOBAL_HUBS.filter((h) => !h.isHQ).map((h) => ({
  key: `${h.key}-dubai`,
  path: makeArcPath(h.x, h.y, DUBAI_HQ.x, DUBAI_HQ.y),
  hub: h,
}));

export type ChipRect = {
  key: string;
  cx: number;
  cy: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/** Where each portrait chip actually lands on the canvas. */
export function chipRects(hubs: GlobalHub[] = GLOBAL_HUBS): ChipRect[] {
  return hubs.map((h) => {
    const cx = h.x + h.portraitChipOffset.x;
    const cy = h.y + h.portraitChipOffset.y;
    return {
      key: h.key,
      cx,
      cy,
      left: cx - PORTRAIT_CHIP.halfW,
      right: cx + PORTRAIT_CHIP.halfW,
      top: cy - PORTRAIT_CHIP.halfH,
      bottom: cy + PORTRAIT_CHIP.halfH,
    };
  });
}

/** True when two chips share any pixel. Axis-aligned, so one axis clear is enough. */
export function chipsOverlap(a: ChipRect, b: ChipRect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}
