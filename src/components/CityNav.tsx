'use client';

import { BEATS, CITIES, beatIndexById } from '@/film/score';

const FIRST_CITY = beatIndexById('city-mumbai');

/**
 * Where each arrow goes, named, so the control can say so out loud.
 *
 * The ends of the chapter are not dead: stepping back off Mumbai returns to
 * the broker and stepping on from Paris opens the closing presentation, which
 * is exactly what scrolling does. An arrow that refused at the edges would be
 * a different, smaller promise than the one the scroll already makes.
 */
function destination(cityIndex: number, dir: -1 | 1): { index: number; label: string } | null {
  const index = FIRST_CITY + cityIndex + dir;
  if (index < 0 || index >= BEATS.length) return null;
  const city = CITIES[index - FIRST_CITY];
  return { index, label: city ? city.label : BEATS[index].label.replace(/^[IVX]+ · /, '') };
}

function Chevron({ dir }: { dir: -1 | 1 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-2/5 w-2/5"
      aria-hidden="true"
      style={{ transform: dir === -1 ? 'translateX(-6%)' : 'translateX(6%)' }}
    >
      <path d={dir === -1 ? 'M15 5 L8 12 L15 19' : 'M9 5 L16 12 L9 19'} />
    </svg>
  );
}

/**
 * Stepping through the multilingual chapter without scrolling.
 *
 * The chapter is six beats that all look the same — a phone, a city, a clock —
 * so a wheel gesture there reads as scrolling a page rather than as turning a
 * page, which is what it actually does. These say it plainly.
 *
 * It belongs to the city's name, not to the edges of the screen: pinned out
 * there the pair read as browser chrome laid over the shot, and the right-hand
 * one had to fight the name for the same line. Where exactly it sits is the
 * caller's business, because the two layouts want different things — a row
 * above the name on a wide screen, one arrow either side of it on a phone,
 * where the band above the name is barely two lines deep.
 *
 * The film still owns the move: the buttons publish the same
 * `rechitta:jump-to-beat` the chapter rail does, and the stage ignores it
 * while a transition is playing. Nothing here tracks its own position.
 */
export default function CityNav({
  cityIndex,
  isMoving = false,
  only,
  className = '',
  size = 'md',
}: {
  /** Index into CITIES — the city currently on screen. */
  cityIndex: number;
  isMoving?: boolean;
  /** Render one arrow rather than the pair, for the flanking layout. */
  only?: -1 | 1;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const step = (dir: -1 | 1) => {
    const target = destination(cityIndex, dir);
    if (!target) return;
    window.dispatchEvent(
      new CustomEvent('rechitta:jump-to-beat', { detail: { index: target.index } }),
    );
  };

  const box = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10 md:h-12 md:w-12';

  return (
    <div
      className={`flex items-center gap-2.5 transition-opacity duration-300 ${className}`}
      style={{ opacity: isMoving ? 0 : 1 }}
    >
      {(only ? [only] : ([-1, 1] as const)).map((dir) => {
        const target = destination(cityIndex, dir);
        if (!target) return null;
        return (
          <button
            key={dir}
            onClick={() => step(dir)}
            disabled={isMoving}
            aria-label={`Go to ${target.label}`}
            title={target.label}
            className={`group relative flex shrink-0 items-center justify-center rounded-full
                       ${box} text-white/70 hover:text-white
                       transition-[color,border-color,background-color,box-shadow,transform]
                       duration-300 cursor-pointer active:scale-95 disabled:cursor-default touch-manipulation`}
            style={{
              /* Barely there until it is asked for — the chapter is a held
                 shot, and a solid control parked on it reads as chrome. */
              background: 'rgba(7, 10, 16, 0.34)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              backdropFilter: 'blur(10px) saturate(140%)',
              WebkitBackdropFilter: 'blur(10px) saturate(140%)',
              touchAction: 'manipulation',
            }}
          >
            {/* Expanded thumb hit-area on touchscreens */}
            <span className="absolute -inset-2 pointer-events-auto md:hidden" aria-hidden="true" />
            {/* The accent ring, drawn only on hover so the resting state stays
                as quiet as the rest of the scene. */}
            <span
              aria-hidden="true"
              className="absolute inset-[-1px] rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                border: '1px solid rgba(143, 180, 255, 0.55)',
                boxShadow: '0 0 26px rgba(86, 141, 255, 0.35)',
              }}
            />
            <Chevron dir={dir} />
          </button>
        );
      })}
    </div>
  );
}
