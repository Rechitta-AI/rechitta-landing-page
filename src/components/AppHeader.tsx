'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useDemoModal } from '@/contexts/DemoModalContext';
import Image from 'next/image';
import Link from 'next/link';

const LINKS = [
  { label: 'Brokers', href: '/brokers' },
  { label: 'Developers', href: '/developers' },
  { label: 'Blog', href: '/blog' },
  {
    label: 'Live Briefing',
    href: 'https://beta.rechitta.com/d/Demo/demo-verakai',
    newTab: true,
  },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export default function AppHeader() {
  const pathname = usePathname();
  const { openModal } = useDemoModal();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when tapping outside, pressing Escape, or scrolling the outer page.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onWheel = (e: WheelEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      // Only close if scrolling outside the menu dropdown
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className={`fixed top-0 left-0 right-0 ${open ? 'z-[300]' : 'z-[150]'} flex items-center justify-between px-4 sm:px-6 md:px-12 py-3 sm:py-4 md:py-6 pt-[max(0.85rem,env(safe-area-inset-top))] pointer-events-auto transition-all duration-300`}>
      {/* Subtle backdrop blur only behind the header to keep it readable */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-md border-b border-white/5 pointer-events-none -z-10 [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <Link href="/" className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" aria-label="Rechitta - Home">
        <Image
          src="/brand/rechitta-wordmark.svg"
          alt="Rechitta"
          width={146}
          height={22}
          className="w-auto h-4.5 sm:h-5 md:h-6 drop-shadow-md"
          priority
        />
      </Link>

      <div className="flex items-center gap-2 md:gap-3" ref={menuRef}>
        <button
          onClick={openModal}
          type="button"
          /* The site's call to action: design.md's primary button. */
          className="hidden sm:inline-flex btn btn-primary btn-sm md:btn-md"
        >
          Try the Platform
        </button>

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            type="button"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="relative flex h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 min-w-[36px] min-h-[36px] flex-col items-center justify-center gap-[4px] sm:gap-[5px] rounded-full border btn-secondary transition-all duration-300 cursor-pointer shrink-0 touch-manipulation before:absolute before:-inset-2 before:content-['']"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block h-[1.5px] w-4 rounded-full bg-[var(--text-primary)] transition-all duration-300 pointer-events-none"
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
            className="absolute right-0 top-[calc(100%+0.75rem)] w-56 origin-top-right overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/95 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.7)] transition-all duration-300 z-[310]"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
              pointerEvents: open ? 'auto' : 'none',
              visibility: open ? 'visible' : 'hidden',
            }}
            aria-hidden={!open}
          >
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.newTab ? { target: '_blank', rel: 'noreferrer' } : {})}
                onClick={() => {
                  setTimeout(() => setOpen(false), 200);
                }}
                className="group flex items-center justify-between gap-3 border-b border-[var(--border-default)] px-5 py-3.5 text-sm text-[var(--text-secondary)] transition-colors last:border-b-0 hover:bg-[var(--bg-hover)] active:bg-[var(--bg-pressed)] hover:text-[var(--text-primary)] cursor-pointer touch-manipulation"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                <span>{link.label}</span>
                {/*
                  One arrow for every row. Splitting internal and external into
                  → and ↗ gave the column two different marks at two different
                  optical weights, which read as an inconsistency rather than
                  as a distinction — and the distinction is already carried by
                  the link opening in a new tab.
                */}
                <span className="text-[var(--text-link)] opacity-75 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100">
                  →
                </span>
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
