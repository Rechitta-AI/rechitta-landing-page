'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDemoModal } from '@/contexts/DemoModalContext';
import Image from 'next/image';

const LINKS = [
  { label: 'Brokers', href: 'https://www.rechitta.com/brokers' },
  { label: 'Developers', href: 'https://www.rechitta.com/developers' },
  { label: 'Blog', href: 'https://www.rechitta.com/blog' },
  {
    label: 'Live Briefing',
    href: 'https://icy-sand-0d102fd00.7.azurestaticapps.net/?sessionId=0b555e4f-a0cf-4459-be58-a6d45a69ac68',
    newTab: true,
  },
];

export default function AppHeader() {
  const { openModal } = useDemoModal();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // A menu left hanging over the film would sit there through the next shot,
  // so any attempt to move on closes it.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const close = () => setOpen(false);

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', close, { passive: true });
    window.addEventListener('touchmove', close, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', close);
      window.removeEventListener('touchmove', close);
    };
  }, [open]);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-12 py-6 pointer-events-auto">
      {/* Subtle backdrop blur only behind the header to keep it readable */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-md border-b border-white/5 pointer-events-none -z-10 [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <div className="flex items-center gap-3">
        <Image
          src="/brand/rechitta-wordmark.svg"
          alt="Rechitta"
          width={146}
          height={22}
          className="w-auto h-5 md:h-6 drop-shadow-md"
          priority
        />
      </div>

      <div className="flex items-center gap-2 md:gap-3" ref={menuRef}>
        <button
          onClick={openModal}
          className="group relative px-4 md:px-6 py-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-lg border border-white/20 rounded-full text-white text-xs md:text-sm tracking-wide font-medium transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] overflow-hidden cursor-pointer"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
          <span className="relative z-10">Try the Platform</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full border border-white/20 bg-white/10 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 cursor-pointer"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block h-[1.5px] w-4 rounded-full bg-white transition-all duration-300"
                style={{
                  transform: open
                    ? i === 0
                      ? 'translateY(6.5px) rotate(45deg)'
                      : i === 2
                        ? 'translateY(-6.5px) rotate(-45deg)'
                        : 'scaleX(0)'
                    : 'none',
                  opacity: open && i === 1 ? 0 : 1,
                }}
              />
            ))}
          </button>

          <nav
            className="absolute right-0 top-[calc(100%+0.75rem)] w-56 origin-top-right overflow-hidden rounded-2xl border border-white/12 bg-[#0b0f19]/85 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.6)] transition-all duration-300"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
              pointerEvents: open ? 'auto' : 'none',
            }}
            aria-hidden={!open}
          >
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.newTab ? { target: '_blank', rel: 'noreferrer' } : {})}
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between gap-3 border-b border-white/6 px-5 py-3.5 text-sm text-white/75 transition-colors last:border-b-0 hover:bg-white/6 hover:text-white cursor-pointer"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                <span>{link.label}</span>
                <span className="text-[#568DFF] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100">
                  {link.newTab ? '↗' : '→'}
                </span>
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
