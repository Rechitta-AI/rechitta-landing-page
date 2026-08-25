'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemoModal } from '@/contexts/DemoModalContext';

export default function InteractiveDemoModal() {
  const { isOpen, closeModal } = useDemoModal();
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset loading state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsLoaded(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Lenis is now handled globally in useSmoothScroll via the DemoModalContext
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-black/60 backdrop-blur-2xl"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.8 }}
            className="relative w-full max-w-[1400px] w-[95vw] aspect-[4/3] md:aspect-[16/10]"
          >
            {/* CSS Bezel (Thin Black Border) */}
            <div className="absolute inset-0 bg-black p-[8px] md:p-[12px] lg:p-[16px] rounded-[24px] md:rounded-[36px] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.2),inset_0_0_0_3px_rgba(0,0,0,1),0_30px_60px_rgba(0,0,0,0.8)]">
              
              {/* Subtle Camera Lens in the top bezel */}
              <div className="absolute top-[4px] md:top-[6px] lg:top-[8px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#111] shadow-[inset_0_0_2px_rgba(255,255,255,0.3)]"></div>

              {/* Iframe Container */}
              <div className="w-full h-full rounded-[16px] md:rounded-[24px] overflow-hidden bg-[#0a0a0a] relative flex items-center justify-center">
                
                {/* Boot Sequence Loader */}
                <AnimatePresence>
                  {!isLoaded && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: 'easeInOut' }}
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0a0a]"
                    >
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col items-center gap-6"
                      >
                        <span 
                          className="text-2xl text-white/90 tracking-[0.2em] uppercase font-light drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] animate-pulse" 
                          style={{ fontFamily: 'var(--font-marcellus)' }}
                        >
                          Rechitta
                        </span>
                        
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-[1px] w-32 bg-white/10 relative overflow-hidden rounded-full">
                            <motion.div 
                              className="absolute top-0 left-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                              animate={{ x: ['-100%', '300%'] }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                            />
                          </div>
                          <span className="text-[10px] text-white/40 uppercase tracking-widest" style={{ fontFamily: 'var(--font-sora)' }}>
                            Initializing Experience...
                          </span>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* The Demo App */}
                <iframe
                  src="https://icy-sand-0d102fd00.7.azurestaticapps.net/?sessionId=0b555e4f-a0cf-4459-be58-a6d45a69ac68"
                  className="absolute inset-0 w-full h-full border-none z-0"
                  title="Interactive Demo"
                  allow="autoplay; fullscreen"
                  onLoad={() => setIsLoaded(true)}
                />
              </div>
            </div>
          </motion.div>

          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.2 }}
            onClick={closeModal}
            className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 transition-colors z-50 cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
}
