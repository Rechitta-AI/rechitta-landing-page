'use client';

import React from 'react';

/**
 * The two analytics slides on the closing boardroom monitor.
 *
 * Same deck as the opening boardroom — same white ground, same Inter display
 * cut through the shared `.deck-*` classes, same neutral scale and the same
 * #3f74e0 accent, same chrome top and bottom, same outlined numeral, same
 * tiered entrance. The film comes back to a room it has already been in, and
 * the screen on the wall has to look like the same product it did the first
 * time.
 *
 * They are laid out on the 2000 x 1156 reference canvas the world map uses,
 * because all three slides are warped onto the monitor's calibrated quad as
 * one piece. Nothing here is responsive: the canvas is a fixed surface the
 * quad transform scales.
 *
 * Sizes are the opening deck's own, multiplied by 1.69. That canvas is 826
 * units across 43% of the frame; this one is 2000 across 61.5% of it, so a
 * unit here paints 1.69x smaller and the type has to be that much larger to
 * read at the same size in the room.
 */

const ACCENT = '#3f74e0';

/*
 * The safe area, in canvas units.
 *
 * The monitor paints this canvas onto a quad grown a hairline past the
 * measured one — 0.3% on each edge, 6 units across and 3 down (see
 * SCREEN_BLEED in FinaleWorldMapPresentation). These clear that with room to
 * spare, so nothing that has to be read is ever the thing hanging off the side
 * of the screen.
 */
const SAFE_X = 10;
const SAFE_Y = 6;

/** The project on the monitor — the same one the broker's handset is briefing. */
const PROJECT = 'DoubleTree by Hilton';

/**
 * Six tiles, matching the product dashboard.
 *
 * The numbers are internally consistent rather than picked one at a time:
 * 12,480 sessions over 2.9 sessions per client puts roughly 4,300 clients
 * behind them, of whom 1,204 came back more than once. A boardroom reads a
 * grid like this across, and a set that does not add up is the first thing
 * anyone in the room will catch.
 */
type Stat = { label: string; value: string; note: string; icon: React.ReactNode };

const stroke = {
  fill: 'none',
  stroke: ACCENT,
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const STATS: Stat[] = [
  {
    label: 'Total Sessions',
    value: '12,480',
    note: 'All project interactions',
    icon: (
      <>
        <circle cx="8" cy="7" r="3" {...stroke} />
        <path d="M2.5 17c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" {...stroke} />
        <path d="M15 7.5a2.6 2.6 0 0 1 0 5" {...stroke} />
      </>
    ),
  },
  {
    label: 'Avg Session Duration',
    value: '6.12 min',
    note: 'Minutes per session',
    icon: (
      <>
        <circle cx="10" cy="10" r="7.5" {...stroke} />
        <path d="M10 5.5V10l3 2" {...stroke} />
      </>
    ),
  },
  {
    label: 'Units Explored',
    value: '186',
    note: 'Unique units viewed',
    icon: (
      <>
        <rect x="3" y="3" width="14" height="14" rx="2" {...stroke} />
        <path d="M7 13V8M10 13v-3M13 13V6" {...stroke} />
      </>
    ),
  },
  {
    label: 'Units Per Session',
    value: '4.2',
    note: 'Average exploration depth',
    icon: <path d="M3 16V9M8 16V5M13 16v-4M18 16V7" {...stroke} />,
  },
  {
    label: 'Returning Clients',
    value: '1,204',
    note: 'Clients with multiple sessions',
    icon: (
      <>
        <path d="M16.5 8A6.5 6.5 0 0 0 4.6 5.6" {...stroke} />
        <path d="M3.5 12A6.5 6.5 0 0 0 15.4 14.4" {...stroke} />
        <path d="M4.5 2.5v3.2h3.2M15.5 17.5v-3.2h-3.2" {...stroke} />
      </>
    ),
  },
  {
    label: 'Avg Sessions/Client',
    value: '2.9',
    note: 'Session frequency',
    icon: (
      <>
        <circle cx="10" cy="10" r="7.5" {...stroke} />
        <path d="M10 10V6M10 10l3.5 2" {...stroke} />
      </>
    ),
  },
];

/**
 * What the market actually asked.
 *
 * Shares are of the 12,480 sessions on the tile above, so the two slides
 * report the same population.
 */
type Question = { rank: number; text: string; asks: number; share: number };

const QUESTIONS: Question[] = [
  { rank: 1, text: 'How deep is the swimming pool?', asks: 1842, share: 14.8 },
  { rank: 2, text: 'How big is the golf course?', asks: 1514, share: 12.1 },
  { rank: 3, text: 'What is the service charge per sq ft?', asks: 1203, share: 9.6 },
  { rank: 4, text: 'Is the payment plan post-handover?', asks: 1090, share: 8.7 },
  { rank: 5, text: 'Can an offshore SPV buy here?', asks: 874, share: 7.0 },
  { rank: 6, text: 'Which floors get the marina view?', asks: 806, share: 6.5 },
];

/** The same questions, grouped — what the room should take away. */
const CATEGORIES = [
  { name: 'Amenities & leisure', share: 38 },
  { name: 'Payment & pricing', share: 27 },
  { name: 'Legal & ownership', share: 19 },
  { name: 'Views & orientation', share: 16 },
];

/**
 * The slide shell: the paper, the chrome, the numeral and the editorial tiers.
 *
 * Every value in here is lifted from the opening deck's own slide, scaled by
 * the 1.69 the two canvases differ by. Keeping it in one place is what stops
 * the two decks drifting apart the next time either is touched.
 */
function DeckSlide({
  index,
  tag,
  headline,
  body,
  live,
  compact,
  children,
}: {
  index: number;
  tag: string;
  headline: string;
  body: string;
  live: boolean;
  /**
   * The monitor is painting small — a portrait viewport, where the screen in
   * the shot is a few hundred points wide and this canvas is 2000 units.
   *
   * At that scale the full slide's chrome lands at two or three pixels and the
   * headline at ten. Compact drops everything that is only there to furnish
   * the screen — the chrome, the numeral, the eyebrow — and spends the room it
   * frees on the type that carries the point.
   */
  compact: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      data-deck-live={live}
      /*
        No painted ground. The opening deck has none either — the display it
        sits on is lit white in the footage, and letting that through is what
        makes the slide look like it is on the screen rather than over it.
        Painting our own white also meant any error in the quad showed up as a
        rim of bare screen around the edge of it.
      */
      className="relative h-full w-full overflow-hidden"
      style={{ fontFamily: 'var(--font-inter)' }}
    >
      {/* The paper, exactly as the opening deck mixes it. */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-200/45 via-transparent to-transparent opacity-70"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.55]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(23,23,23,0.028) 1px, transparent 1px), linear-gradient(to bottom, rgba(23,23,23,0.028) 1px, transparent 1px)',
          backgroundSize: '112px 112px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, #000 25%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, #000 25%, transparent 78%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 z-20"
        style={{
          top: SAFE_Y,
          height: 5,
          background:
            'linear-gradient(to right, transparent, rgba(63,116,224,0.55) 18%, rgba(63,116,224,0.55) 82%, transparent)',
        }}
        aria-hidden="true"
      />

      {/* Top chrome. One label across the deck, the way the opening one runs
          "Today's briefing problems" across its own. */}
      {!compact && (
      <div
        className="absolute z-20 flex items-center justify-between border-b border-neutral-900/10 font-mono uppercase tracking-widest text-neutral-400"
        style={{
          top: SAFE_Y + 30,
          left: SAFE_X + 74,
          right: SAFE_X + 74,
          paddingBottom: 14,
          fontSize: 19,
        }}
      >
        <div className="flex min-w-0 items-center" style={{ gap: 14 }}>
          <span
            className="block shrink-0 rounded-full bg-neutral-900"
            style={{ width: 11, height: 11 }}
          />
          <span className="truncate font-semibold tracking-wider text-neutral-800">{PROJECT}</span>
        </div>
      </div>
      )}

      {/* Bottom chrome. */}
      {!compact && (
      <div
        className="absolute z-20 flex items-center justify-between border-t border-neutral-900/10 font-mono uppercase tracking-widest text-neutral-400"
        style={{
          bottom: SAFE_Y + 28,
          left: SAFE_X + 74,
          right: SAFE_X + 74,
          paddingTop: 14,
          fontSize: 17,
        }}
      >
        <span className="truncate">Confidential developer dossier</span>
        <span className="shrink-0 font-bold text-neutral-700">0{index} / 03</span>
      </div>
      )}

      {/* The numeral, set into the paper rather than printed on it. */}
      {!compact && (
      <div
        className="pointer-events-none absolute select-none"
        style={{
          bottom: SAFE_Y + 82,
          right: SAFE_X + 88,
          fontSize: 264,
          lineHeight: 1,
          fontWeight: 600,
          fontVariationSettings: '"opsz" 32',
          letterSpacing: '-0.06em',
          color: 'transparent',
          WebkitTextStroke: '2px rgba(23, 23, 23, 0.055)',
        }}
        aria-hidden="true"
      >
        0{index}
      </div>
      )}

      <div
        className="relative z-10 flex h-full w-full flex-col items-center justify-center text-center"
        style={{
          padding: compact
            ? `${SAFE_Y + 34}px ${SAFE_X + 30}px ${SAFE_Y + 34}px`
            : `${SAFE_Y + 112}px ${SAFE_X + 98}px ${SAFE_Y + 94}px`,
        }}
      >
        {/* Section eyebrow, on the shared editorial tier. */}
        {!compact && (
          <div
            className="deck-tier flex flex-col items-center"
            style={{ marginBottom: 34, gap: 14, '--tier': 0 } as React.CSSProperties}
          >
            <span className="deck-eyebrow text-neutral-400" style={{ fontSize: 17 }}>
              {tag}
            </span>
            <span
              className="eyebrow-rule"
              data-align="center"
              style={{ width: '3.8rem' }}
              aria-hidden="true"
            />
          </div>
        )}

        <h2
          className="deck-tier deck-headline text-neutral-900"
          style={{ fontSize: compact ? 132 : 70, '--tier': 1 } as React.CSSProperties}
        >
          {headline}
        </h2>

        <p
          className="deck-tier deck-body text-neutral-500"
          style={
            {
              fontSize: compact ? 62 : 28,
              marginTop: compact ? 18 : 24,
              maxWidth: '62ch',
              '--tier': 2,
            } as React.CSSProperties
          }
        >
          {body}
        </p>

        <div
          className="deck-tier w-full"
          style={{ marginTop: compact ? 34 : 56, '--tier': 3 } as React.CSSProperties}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** Slide 2: the numbers behind the briefing. */
export function FinaleStatsSlide({
  live = false,
  compact = false,
}: {
  live?: boolean;
  compact?: boolean;
}) {
  const tile = (s: Stat, span: number) => (
    <div
      key={s.label}
      className="flex flex-col justify-center border border-neutral-200/80 bg-white text-left"
      style={{
        gridColumn: `span ${span}`,
        borderRadius: compact ? 34 : 26,
        padding: compact ? '26px 32px' : '34px 38px',
        boxShadow: '0 2px 10px -4px rgba(23,23,23,0.12)',
      }}
    >
      <div
        className="flex items-center"
        style={{ gap: compact ? 16 : 13, marginBottom: compact ? 14 : 20 }}
      >
        <svg
          width={compact ? 34 : 21}
          height={compact ? 34 : 21}
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          {s.icon}
        </svg>
        <span
          className="deck-caption text-neutral-400"
          style={{ fontSize: compact ? 30 : 14.5, letterSpacing: compact ? '0.05em' : undefined }}
        >
          {s.label}
        </span>
      </div>
      <div
        className="text-neutral-900"
        style={{
          fontSize: compact ? 104 : 62,
          fontWeight: 660,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          fontVariationSettings: '"opsz" 32',
        }}
      >
        {s.value}
      </div>
      {/* The note is the first thing to go: at this scale it is a grey smear
          under a number that already says what it is. */}
      {!compact && (
        <div className="text-neutral-400" style={{ fontSize: 18, marginTop: 16 }}>
          {s.note}
        </div>
      )}
    </div>
  );

  return (
    <DeckSlide
      index={2}
      tag="02 / THE NUMBERS"
      headline="Stats of your briefing."
      body="Every conversation the project has had, since launch."
      live={live}
      compact={compact}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: compact ? 22 : 26,
        }}
      >
        {compact
          ? STATS.map((s) => tile(s, 1))
          : [...STATS.slice(0, 4).map((s) => tile(s, 1)), ...STATS.slice(4).map((s) => tile(s, 2))]}
      </div>
    </DeckSlide>
  );
}

/** Slide 3: what the market actually asked, ranked. */
export function FinaleQuestionsSlide({
  live = false,
  compact = false,
}: {
  live?: boolean;
  compact?: boolean;
}) {
  /* Compact drops the category panel and the tail of the list: four rows of
     readable type say more than six of unreadable. */
  const rows = compact ? QUESTIONS.slice(0, 4) : QUESTIONS;

  return (
    <DeckSlide
      index={3}
      tag="03 / THE MARKET"
      headline="Understand your project."
      body="Not our FAQs &mdash; theirs. The questions the market actually asked, ranked."
      live={live}
      compact={compact}
    >
      <div className="flex items-stretch text-left" style={{ gap: 34 }}>
        {/* The ranked list. */}
        <div className="flex flex-col" style={{ flex: '1 1 auto', gap: compact ? 20 : 13 }}>
          {rows.map((q) => (
            <div
              key={q.rank}
              className="relative overflow-hidden border border-neutral-200/80 bg-white"
              style={{
                borderRadius: compact ? 30 : 20,
                padding: compact ? '30px 34px' : '22px 30px',
                boxShadow: '0 2px 10px -4px rgba(23,23,23,0.12)',
              }}
            >
              {/* The share, drawn as the row's own fill rather than as a
                  separate bar — the ranking is the shape of the column. */}
              <div
                className="pointer-events-none absolute inset-y-0 left-0"
                style={{
                  width: `${q.share * 5.4}%`,
                  background:
                    'linear-gradient(90deg, rgba(63,116,224,0.14), rgba(63,116,224,0.02))',
                }}
                aria-hidden="true"
              />
              <div className="relative flex items-center" style={{ gap: compact ? 26 : 24 }}>
                <span
                  style={{
                    width: compact ? 70 : 40,
                    fontSize: compact ? 36 : 20,
                    fontWeight: 700,
                    color: q.rank <= 2 ? ACCENT : '#a3a3a3',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {String(q.rank).padStart(2, '0')}
                </span>
                <span
                  className="text-neutral-900"
                  style={{
                    flex: '1 1 auto',
                    fontSize: compact ? 50 : 27,
                    fontWeight: 560,
                    letterSpacing: '-0.015em',
                  }}
                >
                  &ldquo;{q.text}&rdquo;
                </span>
                <span
                  className="text-neutral-900"
                  style={{
                    fontSize: compact ? 46 : 25,
                    fontWeight: 660,
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: compact ? 190 : 112,
                    textAlign: 'right',
                    fontVariationSettings: '"opsz" 32',
                  }}
                >
                  {q.asks.toLocaleString()}
                </span>
                {!compact && (
                  <span
                    className="text-neutral-400"
                    style={{
                      fontSize: 19,
                      fontVariantNumeric: 'tabular-nums',
                      minWidth: 80,
                      textAlign: 'right',
                    }}
                  >
                    {q.share}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* What it adds up to. Landscape only: on a small monitor this is a
            second column of four-pixel type beside a list that already makes
            the point. */}
        {!compact && (
        <div
          className="flex flex-col border border-neutral-200/80 bg-white"
          style={{
            flex: '0 0 520px',
            borderRadius: 26,
            padding: '34px 38px',
            boxShadow: '0 2px 10px -4px rgba(23,23,23,0.12)',
          }}
        >
          <span className="deck-caption text-neutral-400" style={{ fontSize: 14.5 }}>
            What they care about
          </span>

          <div className="flex flex-col" style={{ marginTop: 30, gap: 24 }}>
            {CATEGORIES.map((c, i) => (
              <div key={c.name}>
                <div className="flex items-baseline justify-between" style={{ marginBottom: 11 }}>
                  <span className="text-neutral-800" style={{ fontSize: 22, fontWeight: 560 }}>
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: 21,
                      fontWeight: 660,
                      color: i === 0 ? ACCENT : '#737373',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {c.share}%
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: 'rgba(23,23,23,0.07)' }}>
                  <div
                    style={{
                      width: `${c.share * 2.4}%`,
                      height: '100%',
                      borderRadius: 99,
                      background: i === 0 ? ACCENT : 'rgba(115,115,115,0.4)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/*
            The payoff for the opening deck's third slide, which is the one
            that complained there was no way to hear any of this: 30,000
            brochures out, nothing back.
          */}
          <div
            style={{ marginTop: 'auto', paddingTop: 30, borderTop: '1px solid rgba(23,23,23,0.1)' }}
          >
            <div className="text-neutral-500" style={{ fontSize: 20, lineHeight: 1.5 }}>
              Captured from <span className="font-bold text-neutral-900">12,480</span> live
              briefings.
            </div>
            <div
              className="text-neutral-500"
              style={{ fontSize: 20, lineHeight: 1.5, marginTop: 6 }}
            >
              A brochure would have returned{' '}
              <span style={{ color: ACCENT, fontWeight: 700 }}>nothing</span>.
            </div>
          </div>
        </div>
        )}
      </div>
    </DeckSlide>
  );
}
