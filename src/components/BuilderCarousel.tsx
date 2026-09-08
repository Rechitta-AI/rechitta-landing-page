'use client';

import React from 'react';

/**
 * The developers whose projects the briefing is built from.
 *
 * These are placeholder marks: a monogram tile drawn from the name, not the
 * builder's own logo. Swap `mark` for an <img> once licensed artwork lands —
 * the tile is sized to a square so a real logo can drop straight into it.
 */
const BUILDERS = [
  { name: 'Emaar', mark: 'EM' },
  { name: 'Damac', mark: 'DM' },
  { name: 'Nakheel', mark: 'NK' },
  { name: 'Sobha', mark: 'SR' },
  { name: 'Meraas', mark: 'MR' },
  { name: 'Omniyat', mark: 'OM' },
  { name: 'Aldar', mark: 'AL' },
  { name: 'Ellington', mark: 'EL' },
  { name: 'Danube', mark: 'DN' },
  { name: 'Azizi', mark: 'AZ' },
];

export type BuilderCarouselProps = {
  /** Painted width, in pixels. The type scales with it. */
  width: number;
  /** How tall the reel's window is, in pixels. */
  height: number;
  /** Seconds for one full pass of the list. */
  duration?: number;
};

/**
 * A slow vertical reel of the builders behind the deck.
 *
 * The list is rendered twice and the track travels exactly half its own
 * height, so the second copy is under the window the moment the first leaves
 * it and the loop has no seam. Nothing here is interactive — it sits on the
 * wall beside the screen as set dressing, and it must never take a click the
 * film is waiting on.
 */
export default function BuilderCarousel({ width, height, duration = 26 }: BuilderCarouselProps) {
  // The strip is placed against the footage, so everything inside it is sized
  // off the painted width rather than off the root font size.
  const pad = Math.round(width * 0.09);
  const tile = Math.round(width * 0.2);
  const nameSize = Math.max(9, Math.round(width * 0.088));
  const eyebrowSize = Math.max(8, Math.round(width * 0.062));
  const rowGap = Math.round(width * 0.075);

  const reel = (
    <div className="flex flex-col" style={{ gap: `${rowGap}px`, paddingBottom: `${rowGap}px` }}>
      {BUILDERS.map((builder) => (
        <div key={builder.name} className="flex items-center" style={{ gap: `${pad * 0.6}px` }}>
          <span
            className="shrink-0 flex items-center justify-center rounded-[22%] font-bold text-white/85"
            style={{
              width: `${tile}px`,
              height: `${tile}px`,
              fontSize: `${Math.round(tile * 0.4)}px`,
              letterSpacing: '0.04em',
              background: 'linear-gradient(150deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.16)',
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
            }}
          >
            {builder.mark}
          </span>
          <span
            className="truncate font-semibold text-white/80"
            style={{
              fontSize: `${nameSize}px`,
              letterSpacing: '0.02em',
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
            }}
          >
            {builder.name}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div
      aria-hidden="true"
      className="select-none rounded-2xl overflow-hidden"
      style={{
        width: `${width}px`,
        padding: `${pad}px ${pad}px ${Math.round(pad * 0.7)}px`,
        background: 'rgba(10, 14, 24, 0.62)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(18px) saturate(150%)',
        WebkitBackdropFilter: 'blur(18px) saturate(150%)',
        boxShadow: '0 24px 60px -24px rgba(0,0,0,0.85)',
      }}
    >
      <div className="flex flex-col" style={{ gap: `${Math.round(pad * 0.45)}px` }}>
        <span
          className="text-white/45"
          style={{
            fontSize: `${eyebrowSize}px`,
            fontWeight: 600,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-inter), system-ui, sans-serif',
          }}
        >
          Projects by
        </span>
        <span
          aria-hidden="true"
          className="block h-px"
          style={{
            width: '2.25rem',
            background: 'linear-gradient(to right, var(--accent), transparent)',
          }}
        />
      </div>

      {/*
        The window the reel runs behind. The mask fades both ends so names
        arrive and leave rather than being clipped mid-letter.
      */}
      <div
        className="relative overflow-hidden"
        style={{
          height: `${height}px`,
          marginTop: `${Math.round(pad * 0.8)}px`,
          maskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
        }}
      >
        <div
          className="animate-builder-reel absolute inset-x-0 top-0"
          style={{ animationDuration: `${duration}s` }}
        >
          {reel}
          {reel}
        </div>
      </div>
    </div>
  );
}
