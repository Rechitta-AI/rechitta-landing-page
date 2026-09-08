'use client';

import React from 'react';

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
}: {
  label: string;
  visible: boolean;
  placement?: 'top' | 'bottom';
  urgent?: boolean;
}) {
  const top = placement === 'top';

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute left-1/2 z-[60] -translate-x-1/2 transition-all duration-300 ease-out ${
        top ? 'bottom-[calc(100%+9px)]' : 'top-[calc(100%+9px)]'
      } ${visible ? 'opacity-100 translate-y-0' : `opacity-0 ${top ? 'translate-y-1' : '-translate-y-1'}`}`}
    >
      <div
        className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-tight shadow-[0_8px_24px_-6px_rgba(0,0,0,0.55)] ${
          urgent
            ? 'bg-[#568DFF] text-white ring-2 ring-[#568DFF]/30'
            : 'bg-white text-neutral-900 ring-1 ring-black/10'
        } ${visible ? 'animate-click-prompt-bob' : ''}`}
      >
        <span
          className={`relative flex h-1.5 w-1.5 shrink-0 ${urgent ? 'text-white' : 'text-[#568DFF]'}`}
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
        <span>{label}</span>

        {/* The caret, pointing back at the control. */}
        <span
          className={`absolute left-1/2 h-0 w-0 -translate-x-1/2 border-x-[5px] border-x-transparent ${
            top
              ? `top-full border-t-[5px] ${urgent ? 'border-t-[#568DFF]' : 'border-t-white'}`
              : `bottom-full border-b-[5px] ${urgent ? 'border-b-[#568DFF]' : 'border-b-white'}`
          }`}
        />
      </div>
    </div>
  );
}
