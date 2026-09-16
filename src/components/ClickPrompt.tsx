'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

/** How far the prompt floats off the control it belongs to. */
const OFFSET = 9;

/**
 * Is the box this prompt wants covered by something that is not its own
 * target?
 *
 * Hit-testing rather than geometry, because the prompt has no way of knowing
 * which of its neighbours it might land on. Anything the test hits that
 * *contains* the anchor is a container — the scene, the overlay, the footage
 * behind it — and sits underneath by definition; anything the anchor contains
 * is part of the control itself. Anything else is a sibling in the way.
 *
 * The prompt never takes pointer events, so it cannot hit itself.
 */
function isObstructed(anchor: Element, box: DOMRect): boolean {
  if (box.top < 8 || box.bottom > window.innerHeight - 8) return true;

  const y = box.top + box.height / 2;
  // Three points across the width: a caret landing in a gap between two cards
  // is still a prompt sitting on both of them.
  const xs = [box.left + 4, box.left + box.width / 2, box.right - 4];

  return xs.some((x) => {
    if (x < 0 || x > window.innerWidth) return false;
    const hit = document.elementFromPoint(x, y);
    if (!hit) return false;
    return !hit.contains(anchor) && !anchor.contains(hit);
  });
}

/**
 * The tooltip that points at a control the film is waiting on.
 *
 * Three beats do not advance on a scroll: the boardroom's question, and the
 * calls to action in the broker and buyer scenes. Each of those used to say so
 * only after the viewer had already tried to scroll past, and only by glowing
 * a little - which reads as decoration, not as an instruction. This says it
 * up front, in words, attached to the thing that has to be pressed.
 *
 * It is absolutely positioned, so the element it belongs to needs `relative`
 * and nothing else. It never takes pointer events: the target underneath it
 * stays the only thing that can be clicked.
 */
export default function ClickPrompt({
  label,
  visible,
  placement = 'top',
  /** The film has actually refused to move on. Louder, and in the accent. */
  urgent = false,
  /**
   * Move to the other side of the control when the preferred side is taken.
   *
   * Off by default: most of these sit in space that was laid out around them,
   * and a prompt that decides its own side is a prompt that can move when a
   * neighbour re-renders. It is for the ones whose neighbours are not fixed —
   * the broker's call to action sits under a panel whose height changes with
   * whichever objection is open.
   */
  autoPlace = false,
}: {
  label: string;
  visible: boolean;
  placement?: 'top' | 'bottom';
  urgent?: boolean;
  autoPlace?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  /*
   * Null until a measurement has actually been taken. Holding the side as
   * plain state seeded from the prop meant the non-auto case had to write it
   * back on every render of a value it already knew — the side is derived
   * below instead, and this is only the override a measurement produces.
   */
  const [measuredSide, setMeasuredSide] = useState<'top' | 'bottom' | null>(null);

  const place = useCallback(() => {
    const host = hostRef.current;
    const anchor = host?.parentElement;
    if (!host || !anchor) return;

    const self = host.getBoundingClientRect();
    const target = anchor.getBoundingClientRect();
    if (self.height === 0 || target.height === 0) return;

    /*
     * The box each side would occupy, worked out from the anchor rather than
     * read off the live element. Measuring where the prompt actually is would
     * make the answer depend on the side it is already on, and the two would
     * chase each other.
     */
    const boxFor = (at: 'top' | 'bottom') =>
      new DOMRect(
        target.left + target.width / 2 - self.width / 2,
        at === 'top' ? target.top - OFFSET - self.height : target.bottom + OFFSET,
        self.width,
        self.height,
      );

    const other = placement === 'top' ? 'bottom' : 'top';
    // Only give up the preferred side for one that is actually clear.
    setMeasuredSide(
      !isObstructed(anchor, boxFor(placement))
        ? placement
        : isObstructed(anchor, boxFor(other))
          ? placement
          : other,
    );
  }, [placement]);

  useEffect(() => {
    if (!autoPlace) return;

    // After the frame the label lands in: the prompt's own width follows it.
    const frame = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', place);
    };
  }, [autoPlace, visible, placement, label, place]);

  const top = (autoPlace ? (measuredSide ?? placement) : placement) === 'top';

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={`pointer-events-none absolute left-1/2 z-[60] -translate-x-1/2 transition-all duration-300 ease-out ${
        top ? 'bottom-[calc(100%+9px)]' : 'top-[calc(100%+9px)]'
      } ${visible ? 'opacity-100 translate-y-0' : `opacity-0 ${top ? 'translate-y-1' : '-translate-y-1'}`}`}
    >
      <div
        className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-tight shadow-[0_8px_24px_-6px_rgba(0,0,0,0.55)] ${
          urgent
            ? 'bg-[#3D6FF5] text-white ring-2 ring-[#3D6FF5]/30'
            : 'bg-white text-neutral-900 ring-1 ring-black/10'
        } ${visible ? 'animate-click-prompt-bob' : ''}`}
      >
        <span
          className={`relative flex h-1.5 w-1.5 shrink-0 ${urgent ? 'text-white' : 'text-[#3D6FF5]'}`}
        >
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
        <span>{label}</span>

        {/* The caret, pointing back at the control. */}
        <span
          className={`absolute left-1/2 h-0 w-0 -translate-x-1/2 border-x-[5px] border-x-transparent ${
            top
              ? `top-full border-t-[5px] ${urgent ? 'border-t-[#3D6FF5]' : 'border-t-white'}`
              : `bottom-full border-b-[5px] ${urgent ? 'border-b-[#3D6FF5]' : 'border-b-white'}`
          }`}
        />
      </div>
    </div>
  );
}
