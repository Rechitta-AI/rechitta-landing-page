'use client';

import React from 'react';
import { FONT_BODY, FONT_CODE } from '@/design/fonts';
import { BRAND_GOLD, NEUTRAL, SUCCESS_400 } from '@/design/tokens';
import { GLOBAL_HUBS } from './finaleHubs';

/**
 * The hub list, in real pixels, under the television.
 *
 * The map itself lives on a 2000-unit canvas painted onto the monitor in the
 * footage, which on a phone is about 0.155 — so a city name authored at 17
 * units arrived at 2.9 CSS px and nobody could read where the briefings went.
 * The map keeps the dots, the arcs and a two-letter chip per hub so a viewer
 * can still see *which* place is *where*; the names and local times read here
 * instead, outside the warped canvas, at sizes that do not get divided by
 * anything. Same reasoning as DeckDock, which is the only finale UI that has
 * always been legible on a phone for exactly this reason.
 *
 * Portrait only. On a landscape screen the monitor is big enough to carry the
 * full badges and this never mounts.
 */
export default function FinaleHubPanel({
  /**
   * Two columns on a short screen. Seven rows is about 270px, which clears the
   * orb on a 383x857 phone but runs straight into it on a 360x640.
   */
  twoColumn = false,
  className = '',
}: {
  twoColumn?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`w-full rounded-2xl border px-3.5 pt-3 pb-2 pointer-events-none ${className}`}
      style={{
        fontFamily: FONT_BODY,
        background: 'rgba(12, 15, 20, 0.92)',
        borderColor: 'rgba(255, 255, 255, 0.09)',
        boxShadow: '0 18px 44px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/*
        The status line the monitor used to carry in its top-right pill, which
        on a phone was 2.9px. It reads here and the pill is hidden up there.
      */}
      <div
        className="flex items-center gap-1.5 pb-2.5 mb-0.5 border-b"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <span
          className="h-[5px] w-[5px] shrink-0 rounded-full"
          style={{ background: SUCCESS_400, boxShadow: `0 0 6px ${SUCCESS_400}` }}
        />
        <span
          className="text-[10px] font-semibold leading-none"
          style={{ fontFamily: FONT_CODE, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.5)' }}
        >
          6/6 HUBS SYNCHRONIZED · 04:11 UTC
        </span>
      </div>

      {/*
        gap-x-5: at 360px wide each column is about 150px, and "DUBAI HQ" plus
        its chip and time nearly fills that — a narrower gutter had the two
        columns reading as one run-on line.
      */}
      <div className={twoColumn ? 'grid grid-cols-2 gap-x-5' : ''}>
        {GLOBAL_HUBS.map((hub) => (
          <div
            key={hub.key}
            className="flex items-center gap-2 py-1.5 border-b last:border-b-0"
            style={{ borderColor: 'rgba(255, 255, 255, 0.055)' }}
          >
            <span
              className="shrink-0 min-w-[22px] rounded px-1 py-[3px] text-center text-[9px] font-bold leading-none"
              style={{
                fontFamily: FONT_CODE,
                letterSpacing: '0.06em',
                background: hub.isHQ ? BRAND_GOLD[500] : 'rgba(255, 255, 255, 0.12)',
                color: hub.isHQ ? NEUTRAL[950] : '#FFFFFF',
              }}
            >
              {hub.lang}
            </span>

            <span
              className="text-[13px] font-semibold leading-none whitespace-nowrap"
              style={{ letterSpacing: '0.04em', color: '#FFFFFF' }}
            >
              {hub.name}
            </span>

            {/* The leader only earns its keep in one column, where the run is long. */}
            {!twoColumn && (
              <span
                className="flex-1 -translate-y-[2px] border-b border-dotted"
                style={{ borderColor: 'rgba(255, 255, 255, 0.16)' }}
              />
            )}

            <span
              className={`text-[12px] font-medium leading-none ${twoColumn ? 'ml-auto' : ''}`}
              style={{ fontFamily: FONT_CODE, color: 'rgba(255,255,255,0.62)' }}
            >
              {hub.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
