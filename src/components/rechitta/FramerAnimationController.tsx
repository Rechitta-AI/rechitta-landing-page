'use client';

import { useEffect } from 'react';

/**
 * FramerAnimationController
 * 
 * Activates dynamic interactions across imported Framer pages:
 * 1. Rolling-text character stagger indexes for button hover animations.
 * 2. Scroll-triggered entrance animations (spring/cubic-bezier reveals)
 *    for sections, badges, headings, cards, and demo embeds.
 */
export default function FramerAnimationController() {
  useEffect(() => {
    // 1. Initialize rolling text staggered indexes
    const rollingContainers = document.querySelectorAll<HTMLElement>('[class*="rolling-text-inner-"]');
    rollingContainers.forEach((container) => {
      const spans = container.querySelectorAll<HTMLSpanElement>('span');
      spans.forEach((span, index) => {
        span.style.setProperty('--i', index.toString());
      });
    });

    // 2. Setup scroll-triggered reveals
    const revealSelectors = [
      '[data-framer-appear-id]',
      '.framer-1yifvyx',
      '.framer-1bw02m4',
      '.framer-1j02ymg',
      '.framer-1y68enf',
      '.framer-4mc8eh-container',
      '.framer-ad7geq-container',
      '.framer-1gvepnu-container',
      '.framer-1o5qjhb-container',
      '.framer-w4kibl-container',
      '.framer-1yckpw8-container',
      '.framer-1aqtqtj-container',
      '.framer-ziefp7-container',
      '.framer-sxoGm',
      '.framer-iwge05',
      '.framer-1hghg6w-container',
      '.framer-1ymwg3e-container',
      '.framer-1bk39o9',
      '.framer-1qijrst',
      '.framer-fr8pzb',
      '.framer-1gzyrrp',
      '.framer-11ku6un',
      '.framer-1mls9yd',
      '.framer-13lboxo',
      '.framer-1sqq9e7',
      '.framer-1mdsod2',
      '.framer-n25k51',
      '.framer-18gs1jh',
      '.framer-1uvpn1c',
      '.framer-tqt7w1',
      '.framer-n0g48q',
      '.framer-1d5ds6w',
      '.framer-1vbzq9h',
      '.framer-o85fdo',
      '.framer-17cjfn0',
      '.framer-1ub2tpk-container',
      '.framer-sl3uaf',
      '.framer-w8a9pw'
    ];

    const elementsToReveal = document.querySelectorAll<HTMLElement>(revealSelectors.join(', '));
    
    if (!('IntersectionObserver' in window)) {
      // Fallback if IntersectionObserver is not available
      elementsToReveal.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            // Clear any inline transform or opacity that Framer SSR hardcoded
            el.style.removeProperty('transform');
            el.style.removeProperty('opacity');
            el.classList.add('framer-revealed');
            observer.unobserve(el);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    elementsToReveal.forEach((el, index) => {
      // If already in top viewport, animate in immediately with a tiny stagger
      const rect = el.getBoundingClientRect();
      el.classList.add('framer-reveal-init');
      
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setTimeout(() => {
          el.style.removeProperty('transform');
          el.style.removeProperty('opacity');
          el.classList.add('framer-revealed');
        }, Math.min(index * 60, 400));
      } else {
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
