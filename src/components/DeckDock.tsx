'use client';

import React from 'react';

/**
 * The slide control under a boardroom screen.
 *
 * One component for both decks — the opening room and the closing one — because
 * they had grown two copies of this that were already drifting apart in
 * padding, glyphs and dot sizes.
 *
 * Drawn as an instrument rather than a bubble. The previous version was a fat
 * pill of heavy blur with round dots and a pair of typed arrow characters,
 * which is the shape every glass dock defaults to. This one takes its language
 * from the rest of the film: hairline rules, a tight radius, marks that are
 * rectangles rather than circles, and chevrons drawn as paths so they are the
 * same weight as everything else instead of whatever the system font happens
 * to hand over.
 */

const ACCENT = '#8FB4FF';

function Chevron({ back }: { back?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path
        d={back ? 'M7.75 3.25 4.5 6.5l3.25 3.25' : 'M5.25 3.25 8.5 6.5l-3.25 3.25'}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DeckDock({
  count,
  active,
  onStep,
  onPick,
  backLabel,
  forwardLabel,
  /**
   * Grey the arrows out at the ends of the deck.
   *
   * The closing room's deck is a dead end in both directions. The opening
   * room's is not — its back arrow returns to the hero and its forward arrow
   * hands the project over — so there the ends are live and this stays off.
   */
  clampAtEnds = false,
}: {
  count: number;
  active: number;
  onStep: (dir: -1 | 1) => void;
  onPick: (index: number) => void;
  backLabel: string;
  forwardLabel: string;
  clampAtEnds?: boolean;
}) {
  const arm = (dir: -1 | 1, label: string) => {
    const spent = clampAtEnds && (dir === -1 ? active === 0 : active === count - 1);
    return (
      <button
        onClick={() => onStep(dir)}
        disabled={spent}
        className={`flex h-[22px] w-[22px] items-center justify-center rounded-[6px] text-white/70 transition-colors duration-200 ${
          spent
            ? 'cursor-default opacity-25'
            : 'cursor-pointer hover:bg-white/[0.09] hover:text-white active:bg-white/[0.14]'
        }`}
        aria-label={label}
        title={label}
      >
        <Chevron back={dir === -1} />
      </button>
    );
  };

  const rule = <span className="mx-[3px] h-[13px] w-px bg-white/[0.13]" aria-hidden="true" />;

  return (
    <div
      className="flex items-center rounded-[9px] px-[5px] py-[4px]"
      style={{
        background: 'rgba(9, 12, 19, 0.66)',
        backdropFilter: 'blur(10px) saturate(140%)',
        WebkitBackdropFilter: 'blur(10px) saturate(140%)',
        border: '1px solid rgba(255, 255, 255, 0.11)',
        /* A one-pixel highlight along the top edge, so the thing catches the
           room's light instead of sitting on it as a flat slab. */
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.07), 0 10px 28px -14px rgba(0,0,0,0.8)',
      }}
    >
      {arm(-1, backLabel)}
      {rule}

      <div className="flex items-center gap-[5px] px-[5px]">
        {Array.from({ length: count }, (_, i) => {
          const on = i === active;
          return (
            <button
              key={i}
              onClick={() => onPick(i)}
              className="h-[2px] cursor-pointer rounded-[1px] transition-all duration-[380ms] ease-out"
              style={{
                width: on ? 18 : 10,
                background: on ? ACCENT : 'rgba(255,255,255,0.24)',
              }}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={on}
            />
          );
        })}
      </div>

      {rule}
      {arm(1, forwardLabel)}
    </div>
  );
}
