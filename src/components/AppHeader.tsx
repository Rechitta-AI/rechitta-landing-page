'use client';

import React from 'react';
import { useDemoModal } from '@/contexts/DemoModalContext';
import Image from 'next/image';

export default function AppHeader() {
  const { openModal } = useDemoModal();

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-12 py-6 pointer-events-auto">
      {/* Subtle backdrop blur only behind the header to keep it readable */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-md border-b border-white/5 pointer-events-none -z-10 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      
      {/* Logo Area */}
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

      {/* Try Demo Button */}
      <button
        onClick={openModal}
        className="group relative px-6 py-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-lg border border-white/20 rounded-full text-white text-sm tracking-wide font-medium transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] overflow-hidden"
        style={{ fontFamily: 'var(--font-sora)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
        <span className="relative z-10">Try the Platform</span>
      </button>
    </header>
  );
}
