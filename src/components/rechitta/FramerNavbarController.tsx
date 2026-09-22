'use client';

import { useEffect } from 'react';

/**
 * Handles client-side interactivity for imported Framer pages:
 * - Mobile hamburger menu open / close toggle
 * - Smooth scroll for hash links (#...)
 */
export default function FramerNavbarController() {
  useEffect(() => {
    // 1. Mobile menu toggle
    const nav = document.querySelector('nav.framer-GYTmv');
    const hamburger = document.querySelector(
      '.framer-1ccfzfu-container, [data-framer-name="closed"]'
    );

    if (nav && hamburger) {
      const toggleMenu = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = nav.classList.contains('framer-v-8j8qfo');
        if (isOpen) {
          nav.classList.remove('framer-v-8j8qfo');
          nav.classList.add('framer-v-16hxzu9');
          hamburger.setAttribute('data-framer-name', 'closed');
        } else {
          nav.classList.remove('framer-v-16hxzu9');
          nav.classList.add('framer-v-8j8qfo');
          hamburger.setAttribute('data-framer-name', 'open');
        }
      };

      hamburger.addEventListener('click', toggleMenu);

      return () => {
        hamburger.removeEventListener('click', toggleMenu);
      };
    }
  }, []);

  return null;
}
