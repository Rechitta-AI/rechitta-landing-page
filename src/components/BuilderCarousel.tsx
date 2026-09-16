'use client';

import React from 'react';

export type LogoAsset = {
  /** Path under `public/`. */
  src: string;
  /** The company or project, for assistive tech only — never painted. */
  alt: string;
};

/**
 * The developers whose projects the briefing is built from.
 *
 * Artwork only: no names, no monograms. Every mark is normalised to white by
 * the reel (see `LOGO_FILTER`), so a logo drawn in any colour can be dropped
 * in here without being re-cut.
 */
export const DEVELOPER_LOGOS: LogoAsset[] = [
  { src: '/developers/dev/mantra.png', alt: 'Mantra Properties' },
  { src: '/developers/dev/west5.png', alt: 'WestF5 Developments' },
  { src: '/developers/dev/foster.png', alt: 'Foster Developers' },
  { src: '/developers/dev/CG.png', alt: 'CG Developers' },
  { src: '/developers/dev/anax.png', alt: 'Anax Developments' },
  { src: '/developers/dev/maaia.png', alt: 'MAAIA Developers' },
  { src: '/developers/dev/barco.png', alt: 'Barco Developers' },
  { src: '/developers/dev/aum.png', alt: 'AUM Development' },
  { src: '/developers/dev/arista.png', alt: 'Arista Properties' },
  { src: '/developers/dev/grovy.png', alt: 'Grovy Developers' },
];

/**
 * The projects themselves, for the wall on the right of the display.
 */
export const PROJECT_LOGOS: LogoAsset[] = [
  { src: '/developers/projects/jacob-logo.webp', alt: 'Jacob&Co Residences' },
  { src: '/developers/projects/the-archive.svg', alt: 'The Archive' },
  { src: '/developers/projects/doubletree.svg', alt: 'DoubleTree by Hilton' },
  { src: '/developers/projects/w-residences.svg', alt: 'W Residences' },
  { src: '/developers/projects/wadi-villas.svg', alt: 'Wadi Villas' },
  { src: '/developers/projects/jw-marriott.svg', alt: 'JW Marriott Al Marjan Island' },
  { src: '/developers/projects/241waterside.svg', alt: '241Waterside' },
  { src: '/developers/projects/il-vento.svg', alt: 'IL Vento' },
  { src: '/developers/projects/ryze.svg', alt: 'Ryze' },
  { src: '/developers/projects/marafid.svg', alt: 'Marafid Residences' },
  { src: '/developers/projects/livia.svg', alt: 'Livia Residences' },
  { src: '/developers/projects/la-vue.svg', alt: 'La Vue' },
  { src: '/developers/projects/v-suites.svg', alt: 'V Suites' },
  { src: '/developers/projects/rivo.svg', alt: 'Rivo' },
  { src: '/developers/projects/vedaresidences.svg', alt: 'VedaResidences' },
];

/**
 * Every mark painted as white artwork on its chip.
 *
 * The logos in hand are a mix of polarities — Emaar, Damac and Danube are
 * drawn white on transparent, Binghatti black on transparent — so painting
 * them as supplied would make half of them vanish against whatever they land
 * on. `brightness(0)` flattens every opaque pixel to black and `invert(1)`
 * lifts it to white, leaving the alpha channel alone. It costs nothing and it
 * means the next logo added does not have to match the last one.
 */
const LOGO_FILTER = 'brightness(0) invert(1)';

/*
 * How the reel meets its two ends.
 *
 * Long at the top and short at the bottom, deliberately. The bottom edge of
 * the window is laid on the credenza's top edge, so a mark there is coming out
 * of the woodwork and only needs the few pixels either side of the line to
 * stop being a hard cut. The top edge is open room, and a mark leaving into it
 * has to thin out over a real distance or it reads as hitting a ceiling
 * rather than dissolving into one.
 */
const MASK = 'linear-gradient(to bottom, transparent 0%, black 19%, black 91%, transparent 100%)';

export type WallLogoReelProps = {
  logos: LogoAsset[];
  /** Painted width of the strip, in pixels. Everything scales off it. */
  width: number;
  /** Height of the window the reel runs behind, in pixels. */
  height: number;
  /** Seconds for one full pass of the list. */
  duration?: number;
  /**
   * Drop the chip and stand the marks straight on the wall.
   *
   * The chip exists to guarantee contrast: every logo is normalised to white,
   * and a dark tile under it means that holds against whatever the wall is
   * doing behind. Bare is the other reading — the marks look printed on the
   * wall rather than hung on it — and it needs the wall behind to be dark
   * enough on its own. The shadow below is what buys the margin on a light
   * one.
   */
  bare?: boolean;
};

/**
 * A slow vertical reel of logos, run up one of the boardroom's wall panels.
 *
 * The list is rendered twice and the track travels exactly half its own
 * height, so the second copy is under the window the moment the first leaves
 * it and the loop has no seam. Both ends of the window are masked to nothing,
 * which is what sells the read the scene is after: marks rise out of the
 * credenza at the bottom of the wall and dissolve into the ceiling at the top,
 * rather than being clipped against an edge.
 *
 * Nothing here is interactive — it is set dressing beside the screen, and it
 * must never take a click the film is waiting on.
 */
export default function WallLogoReel({
  logos,
  width,
  height,
  duration = 34,
  bare = false,
}: WallLogoReelProps) {
  if (logos.length === 0) return null;

  /* Bare rows sit further apart and give the mark the whole strip: with no
     tile edge to separate two marks, the space between them is the only thing
     that does, and with no padding to respect the artwork can run full width. */
  const gap = Math.round(width * (bare ? 0.44 : 0.3));
  const rowHeight = Math.round(width * (bare ? 0.48 : 0.46));

  const strip = (
    <div className="flex flex-col" style={{ gap: `${gap}px`, paddingBottom: `${gap}px` }}>
      {logos.map((logo) => (
        <div
          key={logo.src}
          className={`flex shrink-0 items-center justify-center ${bare ? '' : 'rounded-2xl'}`}
          style={
            bare
              ? { height: `${rowHeight}px` }
              : {
                  height: `${rowHeight}px`,
                  padding: `0 ${Math.round(width * 0.07)}px`,
                  background: 'rgba(20, 20, 19, 0.42)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(14px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(14px) saturate(150%)',
                  boxShadow: '0 18px 44px -22px rgba(0,0,0,0.9)',
                }
          }
        >
          {/*
            A plain <img>: these are fixed decorative marks of a handful of
            kilobytes, one of them an SVG, and routing them through the image
            optimiser would need SVG explicitly allowed for no gain.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.src}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              maxWidth: '100%',
              maxHeight: `${Math.round(rowHeight * (bare ? 0.88 : 0.74))}px`,
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              /* A white mark standing straight on a lit wall has nothing
                 holding its edge. The shadow is what separates it from the
                 plaster; on a chip the tile already does that. */
              filter: bare
                ? `${LOGO_FILTER} drop-shadow(0 2px 10px rgba(0,0,0,0.55))`
                : LOGO_FILTER,
              opacity: bare ? 0.96 : 0.9,
            }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div
      aria-hidden="true"
      className="relative select-none overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        maskImage: MASK,
        WebkitMaskImage: MASK,
      }}
    >
      <div
        className="animate-builder-reel absolute inset-x-0 top-0"
        style={{ animationDuration: `${duration}s` }}
      >
        {strip}
        {strip}
      </div>
    </div>
  );
}

/**
 * The portrait boardrooms' logo block: developers in one strip, their projects
 * in the other, each under its own title and running opposite ways so they
 * read as two lists. Shared by the opening and the closing boardroom so the
 * two stay identical.
 */
export function LogoCarousels({
  itemClassName = '',
  compact = false,
}: {
  itemClassName?: string;
  /** Shorter strips and tighter gaps, for phones where the orb docks close below. */
  compact?: boolean;
}) {
  const groups = [
    { title: 'Developers on Rechitta', logos: DEVELOPER_LOGOS, reverse: false },
    { title: 'Projects being briefed', logos: PROJECT_LOGOS, reverse: true },
  ];
  return (
    <div className={`w-full flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
      {groups.map((g) => (
        <div
          key={g.title}
          className={`w-full flex flex-col ${compact ? 'gap-1' : 'gap-1.5'} ${itemClassName}`}
        >
          <p
            className={`text-center font-semibold text-white/60 tracking-[0.02em] ${
              compact ? 'text-[10.5px]' : 'text-[11px]'
            }`}
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            {g.title}
          </p>
          <BuilderMarquee logos={g.logos} reverse={g.reverse} compact={compact} />
        </div>
      ))}
    </div>
  );
}

/**
 * A horizontal continuous marquee of the same marks, for the portrait dock,
 * where the deck comes off the wall and there are no panels to run them up.
 */
export function BuilderMarquee({
  className = '',
  logos,
  reverse = false,
  compact = false,
}: {
  className?: string;
  /** A thinner strip with smaller marks. */
  compact?: boolean;
  /** Defaults to every developer and project mark in one strip. */
  logos?: LogoAsset[];
  /** Runs the strip the other way, so two stacked strips don't move as one. */
  reverse?: boolean;
}) {
  const items = logos ?? [...DEVELOPER_LOGOS, ...PROJECT_LOGOS];
  // Repeat items twice so keyframes translate3d(-50%, 0, 0) loops seamlessly forever
  const repeatedItems = [...items, ...items];
  return (
    <div className={`w-full overflow-hidden select-none ${className}`} aria-hidden="true">
      <div
        className={`relative flex w-full items-center overflow-hidden rounded-xl border border-white/10 bg-black/35 shadow-inner backdrop-blur-md ${
          compact ? 'py-1' : 'py-2'
        }`}
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
        }}
      >
        <div
          className="animate-marquee flex shrink-0 items-center gap-7 whitespace-nowrap px-4"
          style={reverse ? { animationDirection: 'reverse' } : undefined}
        >
          {repeatedItems.map((logo, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={idx}
              src={logo.src}
              alt=""
              aria-hidden="true"
              draggable={false}
              style={{
                height: compact ? '15px' : '18px',
                width: 'auto',
                objectFit: 'contain',
                filter: LOGO_FILTER,
                opacity: 0.9,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

