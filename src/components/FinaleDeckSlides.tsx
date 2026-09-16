'use client';

import React from 'react';
import { FONT_BODY, FONT_CODE, FONT_DISPLAY } from '@/design/fonts';
import { light } from '@/design/tokens';

/**
 * The two analytics slides on the closing boardroom monitor.
 *
 * Same deck as the opening boardroom, on the same design system (design.md):
 * Playfair Display for the headline and the figures, Inter for everything
 * that is read as interface, JetBrains Mono for the telemetry, the light
 * column of the colour tokens, gold section labels and brand-blue emphasis.
 * The film comes back to a room it has already been in, and the screen on
 * the wall has to look like the same product it did the first time.
 *
 * They are laid out on the 2000 x 1156 reference canvas the world map uses,
 * because all three slides are warped onto the monitor's calibrated quad as
 * one piece. Nothing here is responsive: the canvas is a fixed surface the
 * quad transform scales.
 *
 * Every size is the design system's own, multiplied by S. The opening deck's
 * canvas is 826 units across 43% of the frame; this one is 2000 across 61.5%
 * of it, so a unit here paints 1.69x smaller and the type has to be that much
 * larger to read at the same size in the room.
 */

const S = 1.69;
const px = (n: number) => Math.round(n * S * 10) / 10;

const ACCENT = light.bgBrand;

/** Card pattern: 1px border/default, radius/lg, Elevation/2 — scaled. */
const CARD: React.CSSProperties = {
  background: light.bgPrimary,
  border: `1px solid ${light.borderDefault}`,
  boxShadow: `0 ${px(2)}px ${px(4)}px rgba(0,0,0,0.05), 0 ${px(4)}px ${px(8)}px rgba(0,0,0,0.06)`,
};

/** Label/Small, uppercase. */
const labelSmall = (compactSize?: number): React.CSSProperties => ({
  fontFamily: FONT_BODY,
  fontWeight: 500,
  fontSize: compactSize ?? px(11),
  lineHeight: compactSize ? 1.27 : `${px(14)}px`,
  letterSpacing: compactSize ? '0.09em' : px(1),
  textTransform: 'uppercase',
  color: light.textTertiary,
});

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
  stroke: light.iconBrand,
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
      */
      className="relative h-full w-full overflow-hidden"
      style={{ fontFamily: FONT_BODY, color: light.textPrimary }}
    >
      {/* The paper, exactly as the opening deck mixes it. */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-70"
        style={{ background: `radial-gradient(ellipse at top, ${light.bgTertiary}, transparent 70%)` }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.55]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(10,10,9,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,9,0.03) 1px, transparent 1px)',
          backgroundSize: `${px(48)}px ${px(48)}px`,
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
          opacity: 0.6,
          background: `linear-gradient(to right, transparent, ${light.borderBrand} 18%, ${light.borderBrand} 82%, transparent)`,
        }}
        aria-hidden="true"
      />

      {/* Top chrome. One label across the deck, the way the opening one runs
          "Today's briefing problems" across its own. Label/Small, gold. */}
      {!compact && (
      <div
        className="absolute z-20 flex items-center justify-between"
        style={{
          ...labelSmall(),
          color: light.textAccent,
          top: SAFE_Y + 30,
          left: SAFE_X + 74,
          right: SAFE_X + 74,
          paddingBottom: px(8),
          borderBottom: `1px solid ${light.borderDefault}`,
        }}
      >
        <div className="flex min-w-0 items-center" style={{ gap: px(8) }}>
          <span
            className="block shrink-0 rounded-full"
            style={{ width: px(6), height: px(6), background: light.bgAccent }}
          />
          <span className="truncate">{PROJECT}</span>
        </div>
      </div>
      )}

      {/* Bottom chrome. Code/Small. */}
      {!compact && (
      <div
        className="absolute z-20 flex items-center justify-between uppercase"
        style={{
          fontFamily: FONT_CODE,
          fontSize: px(12),
          lineHeight: `${px(16)}px`,
          color: light.textTertiary,
          bottom: SAFE_Y + 28,
          left: SAFE_X + 74,
          right: SAFE_X + 74,
          paddingTop: px(8),
          borderTop: `1px solid ${light.borderDefault}`,
        }}
      >
        <span className="truncate">Confidential developer dossier</span>
        <span className="shrink-0" style={{ color: light.textSecondary }}>0{index} / 03</span>
      </div>
      )}

      {/* The numeral, set into the paper rather than printed on it. Display/2XL. */}
      {!compact && (
      <div
        className="pointer-events-none absolute select-none"
        style={{
          bottom: SAFE_Y + 82,
          right: SAFE_X + 88,
          fontFamily: FONT_DISPLAY,
          fontSize: px(128),
          lineHeight: 1,
          fontWeight: 400,
          letterSpacing: px(-1.5),
          color: 'transparent',
          WebkitTextStroke: '2px rgba(10, 10, 9, 0.06)',
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
        {/* Section eyebrow: Label/Default, gold. */}
        {!compact && (
          <div
            className="deck-tier flex flex-col items-center"
            style={{ marginBottom: px(16), gap: px(8), '--tier': 0 } as React.CSSProperties}
          >
            <span
              style={{
                fontFamily: FONT_BODY,
                fontWeight: 500,
                fontSize: px(12),
                lineHeight: `${px(16)}px`,
                letterSpacing: px(1.2),
                textTransform: 'uppercase',
                color: light.textAccent,
              }}
            >
              {tag}
            </span>
            <span
              className="block"
              style={{
                width: px(36),
                height: 2,
                background: `linear-gradient(to right, transparent, ${light.borderAccent}, transparent)`,
              }}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Display/L. */}
        <h2
          className="deck-tier"
          style={
            {
              fontFamily: FONT_DISPLAY,
              fontWeight: 400,
              fontSize: compact ? 132 : px(48),
              lineHeight: compact ? 1.17 : `${px(56)}px`,
              letterSpacing: compact ? -2.4 : px(-0.8),
              color: light.textPrimary,
              textWrap: 'balance',
              '--tier': 1,
            } as React.CSSProperties
          }
        >
          {headline}
        </h2>

        {/* Body/Large. */}
        <p
          className="deck-tier"
          style={
            {
              fontFamily: FONT_BODY,
              fontWeight: 400,
              fontSize: compact ? 62 : px(18),
              lineHeight: compact ? 1.55 : `${px(28)}px`,
              color: light.textSecondary,
              marginTop: compact ? 18 : px(12),
              maxWidth: '62ch',
              textWrap: 'pretty',
              '--tier': 2,
            } as React.CSSProperties
          }
        >
          {body}
        </p>

        <div
          className="deck-tier w-full"
          style={{ marginTop: compact ? 34 : px(28), '--tier': 3 } as React.CSSProperties}
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
      className="flex flex-col justify-center text-left"
      style={{
        ...CARD,
        gridColumn: `span ${span}`,
        borderRadius: compact ? 34 : px(12),
        padding: compact ? '26px 32px' : `${px(20)}px ${px(20)}px`,
      }}
    >
      <div
        className="flex items-center"
        style={{ gap: compact ? 16 : px(8), marginBottom: compact ? 14 : px(12) }}
      >
        <svg
          width={compact ? 34 : px(12)}
          height={compact ? 34 : px(12)}
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          {s.icon}
        </svg>
        <span style={labelSmall(compact ? 30 : undefined)}>{s.label}</span>
      </div>
      {/* Display/M. */}
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 400,
          fontSize: compact ? 104 : px(40),
          lineHeight: compact ? 1 : `${px(48)}px`,
          letterSpacing: compact ? -1 : px(-0.4),
          color: light.textPrimary,
        }}
      >
        {s.value}
      </div>
      {/* The note is the first thing to go: at this scale it is a grey smear
          under a number that already says what it is. Caption/Default. */}
      {!compact && (
        <div
          style={{
            fontSize: px(12),
            lineHeight: `${px(16)}px`,
            letterSpacing: px(0.1),
            marginTop: px(6),
            color: light.textTertiary,
          }}
        >
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
          gap: compact ? 22 : px(16),
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
      <div className="flex items-stretch text-left" style={{ gap: px(20) }}>
        {/* The ranked list. */}
        <div className="flex flex-col" style={{ flex: '1 1 auto', gap: compact ? 20 : px(8) }}>
          {rows.map((q) => (
            <div
              key={q.rank}
              className="relative overflow-hidden"
              style={{
                ...CARD,
                borderRadius: compact ? 30 : px(12),
                padding: compact ? '30px 34px' : `${px(12)}px ${px(16)}px`,
              }}
            >
              {/* The share, drawn as the row's own fill rather than as a
                  separate bar — the ranking is the shape of the column. */}
              <div
                className="pointer-events-none absolute inset-y-0 left-0"
                style={{
                  width: `${q.share * 5.4}%`,
                  background:
                    'linear-gradient(90deg, rgba(61, 111, 245, 0.14), rgba(61, 111, 245, 0.02))',
                }}
                aria-hidden="true"
              />
              <div className="relative flex items-center" style={{ gap: compact ? 26 : px(12) }}>
                {/* Code/Default. */}
                <span
                  style={{
                    width: compact ? 70 : px(24),
                    fontFamily: FONT_CODE,
                    fontSize: compact ? 36 : px(14),
                    lineHeight: compact ? 1 : `${px(20)}px`,
                    color: q.rank <= 2 ? light.textBrand : light.textTertiary,
                  }}
                >
                  {String(q.rank).padStart(2, '0')}
                </span>
                {/* Body/Default Bold. */}
                <span
                  style={{
                    flex: '1 1 auto',
                    fontSize: compact ? 50 : px(16),
                    lineHeight: compact ? 1.3 : `${px(24)}px`,
                    fontWeight: 600,
                    color: light.textPrimary,
                  }}
                >
                  &ldquo;{q.text}&rdquo;
                </span>
                {/* Heading/H5. */}
                <span
                  style={{
                    fontSize: compact ? 46 : px(18),
                    lineHeight: compact ? 1.3 : `${px(26)}px`,
                    fontWeight: 600,
                    letterSpacing: px(-0.1),
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: compact ? 190 : px(64),
                    textAlign: 'right',
                    color: light.textPrimary,
                  }}
                >
                  {q.asks.toLocaleString()}
                </span>
                {/* Body/Small. */}
                {!compact && (
                  <span
                    style={{
                      fontSize: px(14),
                      lineHeight: `${px(20)}px`,
                      fontVariantNumeric: 'tabular-nums',
                      minWidth: px(48),
                      textAlign: 'right',
                      color: light.textTertiary,
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
          className="flex flex-col"
          style={{
            ...CARD,
            flex: `0 0 ${px(308)}px`,
            borderRadius: px(12),
            padding: `${px(20)}px ${px(20)}px`,
          }}
        >
          <span style={labelSmall()}>What they care about</span>

          <div className="flex flex-col" style={{ marginTop: px(16), gap: px(14) }}>
            {CATEGORIES.map((c, i) => (
              <div key={c.name}>
                <div className="flex items-baseline justify-between" style={{ marginBottom: px(6) }}>
                  {/* Body/Default. */}
                  <span
                    style={{
                      fontSize: px(16),
                      lineHeight: `${px(24)}px`,
                      fontWeight: 400,
                      color: light.textSecondary,
                    }}
                  >
                    {c.name}
                  </span>
                  {/* Body/Default Bold. */}
                  <span
                    style={{
                      fontSize: px(16),
                      lineHeight: `${px(24)}px`,
                      fontWeight: 600,
                      color: i === 0 ? light.textBrand : light.textTertiary,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {c.share}%
                  </span>
                </div>
                <div style={{ height: px(4), borderRadius: 9999, background: light.bgTertiary }}>
                  <div
                    style={{
                      width: `${c.share * 2.4}%`,
                      height: '100%',
                      borderRadius: 9999,
                      background: i === 0 ? ACCENT : light.borderStrong,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/*
            The payoff for the opening deck's third slide, which is the one
            that complained there was no way to hear any of this: 30,000
            brochures out, nothing back. Body/Small.
          */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: px(16),
              borderTop: `1px solid ${light.borderDefault}`,
              fontSize: px(14),
              lineHeight: `${px(20)}px`,
              color: light.textSecondary,
            }}
          >
            <div>
              Captured from{' '}
              <span style={{ fontWeight: 600, color: light.textPrimary }}>12,480</span> live
              briefings.
            </div>
            <div style={{ marginTop: px(4) }}>
              A brochure would have returned{' '}
              <span style={{ fontWeight: 600, color: light.textBrand }}>nothing</span>.
            </div>
          </div>
        </div>
        )}
      </div>
    </DeckSlide>
  );
}
