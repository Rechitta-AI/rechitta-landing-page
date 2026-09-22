'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function FramerHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="framer-kvjt16-container" ref={navRef}>
      {/* 1. Desktop Navbar (>= 1200px) */}
      <div className="framer-desktop-nav-wrapper">
        <nav
          className="framer-GYTmv framer-14epcrf framer-v-14epcrf"
          data-framer-name="Desktop Closed"
          data-highlight="true"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0)', width: '100%' }}
        >
          <div className="framer-mds9fs" data-framer-name="Content">
            {/* Home Link */}
            <div className="framer-kbmi72-container">
              <Link
                href="/"
                className="framer-TLfWE framer-TPaq9 framer-zo2ti framer-v-1fbmjci framer-1mtnv4g"
                data-framer-name="Out"
                data-highlight="true"
                style={{ height: '100%' }}
              >
                <div
                  className="framer-zk0tzl"
                  data-framer-component-type="RichTextContainer"
                  style={{
                    opacity: 1,
                    filter: 'none',
                    transform: 'none',
                  }}
                >
                  <p className="framer-text framer-styles-preset-141u1yr" data-styles-preset="pAzayDUZg">
                    Home
                  </p>
                </div>
              </Link>
            </div>

            {/* About Link */}
            <div className="framer-mez1yj-container">
              <Link
                href="/#about"
                className="framer-TLfWE framer-TPaq9 framer-zo2ti framer-v-1fbmjci framer-1mtnv4g"
                data-framer-name="Out"
                data-highlight="true"
                style={{ height: '100%' }}
              >
                <div
                  className="framer-zk0tzl"
                  data-framer-component-type="RichTextContainer"
                  style={{
                    opacity: 1,
                    filter: 'none',
                    transform: 'none',
                  }}
                >
                  <p className="framer-text framer-styles-preset-141u1yr" data-styles-preset="pAzayDUZg">
                    About
                  </p>
                </div>
              </Link>
            </div>

            {/* Logo -> Homepage */}
            <div className="framer-19opgm7" data-framer-name="Logo + Menu Icon">
              <Link
                href="/"
                className="framer-xb6sci framer-1sw0wfd"
                data-framer-name="Logo"
                aria-label="Rechitta - Home"
              >
                <div className="framer-120od3y" data-framer-name="Logo-white-full">
                  <div
                    data-framer-background-image-wrapper="true"
                    style={{
                      position: 'absolute',
                      borderRadius: 'inherit',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                    }}
                  >
                    <img
                      src="/framer/images/Eecajdn3GUPglEOojfJXGGXSagE.png"
                      alt="Rechitta Logo"
                      width={311}
                      height={46}
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        borderRadius: 'inherit',
                        objectPosition: 'center',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                </div>
              </Link>
            </div>

            {/* Blog Link */}
            <div className="framer-d3zajn-container">
              <Link
                href="/blog"
                className="framer-TLfWE framer-TPaq9 framer-zo2ti framer-v-1fbmjci framer-1mtnv4g"
                data-framer-name="Out"
                data-highlight="true"
                style={{ height: '100%' }}
              >
                <div
                  className="framer-zk0tzl"
                  data-framer-component-type="RichTextContainer"
                  style={{
                    opacity: 1,
                    filter: 'none',
                    transform: 'none',
                  }}
                >
                  <p className="framer-text framer-styles-preset-141u1yr" data-styles-preset="pAzayDUZg">
                    Blog
                  </p>
                </div>
              </Link>
            </div>

            {/* Contact Link */}
            <div className="framer-1yhtuvl-container">
              <a
                href="mailto:info@rechitta.com"
                className="framer-TLfWE framer-TPaq9 framer-zo2ti framer-v-1fbmjci framer-1mtnv4g"
                data-framer-name="Out"
                data-highlight="true"
                style={{ height: '100%' }}
              >
                <div
                  className="framer-zk0tzl"
                  data-framer-component-type="RichTextContainer"
                  style={{
                    opacity: 1,
                    filter: 'none',
                    transform: 'none',
                  }}
                >
                  <p className="framer-text framer-styles-preset-141u1yr" data-styles-preset="pAzayDUZg">
                    Contact
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Curved Notch Base */}
          <div className="framer-looqt4" data-framer-name="Base">
            <div
              className="framer-9jeimb"
              data-framer-name="Top"
              style={{
                backgroundColor: 'var(--token-a53beb93-2df8-4cea-8692-a810c05e478d, rgb(0, 0, 0))',
              }}
            />
            <div className="framer-1cjf4h0" data-framer-name="Notch">
              <div
                className="framer-asjn4q"
                data-framer-name="Left"
                style={{
                  boxShadow: '0px -2px 0px 0px var(--token-a53beb93-2df8-4cea-8692-a810c05e478d, rgb(0, 0, 0))',
                }}
              >
                <div
                  data-framer-component-type="SVG"
                  data-framer-name="SVG"
                  className="framer-1ubnhzz"
                  style={{ imageRendering: 'pixelated', flexShrink: 0 }}
                >
                  <div className="svgContainer" style={{ width: '100%', height: '100%' }}>
                    <svg style={{ width: '100%', height: '100%' }}>
                      <use href="#svg12437585915" />
                    </svg>
                  </div>
                </div>
              </div>
              <div
                className="framer-jyjdtl"
                data-framer-name="Mid"
                style={{
                  backgroundColor: 'var(--token-a53beb93-2df8-4cea-8692-a810c05e478d, rgb(0, 0, 0))',
                  boxShadow: '-2px 0px 0px 0px rgb(5, 5, 5), 2px 0px 0px 0px rgb(5, 5, 5), 0px -2px 0px 0px rgb(5, 5, 5)',
                }}
              />
              <div
                className="framer-1tm5xdj"
                data-framer-name="Right"
                style={{
                  boxShadow: '0px -2px 0px 0px var(--token-a53beb93-2df8-4cea-8692-a810c05e478d, rgb(0, 0, 0))',
                }}
              >
                <div
                  data-framer-component-type="SVG"
                  data-framer-name="SVG"
                  className="framer-af5by6"
                  style={{ imageRendering: 'pixelated', flexShrink: 0 }}
                >
                  <div className="svgContainer" style={{ width: '100%', height: '100%' }}>
                    <svg style={{ width: '100%', height: '100%' }}>
                      <use href="#svg9734401351" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* 2. Mobile & Tablet Navbar (< 1200px) */}
      <div className="framer-mobile-nav-wrapper">
        <nav
          className={`framer-GYTmv framer-14epcrf ${isOpen ? 'framer-v-8j8qfo' : 'framer-v-16hxzu9'}`}
          data-framer-name={isOpen ? 'Phone Open' : 'Phone Closed'}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0)', width: '100%' }}
        >
          <div className="framer-mds9fs" data-framer-name="Content">
            {/* Top Bar with Logo & Hamburger */}
            <div className="framer-19opgm7" data-framer-name="Logo + Menu Icon">
              <Link
                href="/"
                className="framer-xb6sci framer-1sw0wfd"
                data-framer-name="Logo"
                aria-label="Rechitta - Home"
                onClick={() => setIsOpen(false)}
              >
                <div className="framer-120od3y" data-framer-name="Logo-white-full">
                  <div
                    data-framer-background-image-wrapper="true"
                    style={{
                      position: 'absolute',
                      borderRadius: 'inherit',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                    }}
                  >
                    <img
                      src="/framer/images/Eecajdn3GUPglEOojfJXGGXSagE.png"
                      alt="Rechitta Logo"
                      width={311}
                      height={46}
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        borderRadius: 'inherit',
                        objectPosition: 'center',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                </div>
              </Link>

              {/* Hamburger Button */}
              <button
                type="button"
                className="framer-1ccfzfu-container"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
                style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                <div
                  className="framer-P5MjK framer-1ozrrcy framer-v-1ozrrcy"
                  data-framer-name={isOpen ? 'open' : 'closed'}
                  style={{ height: '100%', width: '100%' }}
                >
                  <div
                    className="framer-bpkmqc"
                    data-framer-name="line3"
                    style={{
                      backgroundColor: 'rgb(255, 255, 255)',
                      transform: isOpen ? 'translateY(6px) rotate(45deg)' : 'none',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                  <div
                    className="framer-1hypfvb"
                    data-framer-name="line2"
                    style={{
                      backgroundColor: 'rgb(255, 255, 255)',
                      opacity: isOpen ? 0 : 1,
                      transition: 'opacity 0.2s ease',
                    }}
                  />
                  <div
                    className="framer-l1dd45"
                    data-framer-name="line 1"
                    style={{
                      backgroundColor: 'rgb(255, 255, 255)',
                      transform: isOpen ? 'translateY(-6px) rotate(-45deg)' : 'none',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                </div>
              </button>
            </div>

            {/* Menu Links (expanded when open) */}
            {isOpen && (
              <>
                <div className="framer-kbmi72-container">
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className="framer-TLfWE framer-TPaq9 framer-zo2ti framer-v-1fbmjci framer-1mtnv4g"
                    data-framer-name="Out"
                    data-highlight="true"
                    style={{ height: '100%' }}
                  >
                    <div className="framer-zk0tzl" data-framer-component-type="RichTextContainer" style={{ opacity: 1, filter: 'none', transform: 'none' }}>
                      <p className="framer-text framer-styles-preset-141u1yr" data-styles-preset="pAzayDUZg">
                        Home
                      </p>
                    </div>
                  </Link>
                </div>

                <div className="framer-mez1yj-container">
                  <Link
                    href="/#about"
                    onClick={() => setIsOpen(false)}
                    className="framer-TLfWE framer-TPaq9 framer-zo2ti framer-v-1fbmjci framer-1mtnv4g"
                    data-framer-name="Out"
                    data-highlight="true"
                    style={{ height: '100%' }}
                  >
                    <div className="framer-zk0tzl" data-framer-component-type="RichTextContainer" style={{ opacity: 1, filter: 'none', transform: 'none' }}>
                      <p className="framer-text framer-styles-preset-141u1yr" data-styles-preset="pAzayDUZg">
                        About
                      </p>
                    </div>
                  </Link>
                </div>

                <div className="framer-d3zajn-container">
                  <Link
                    href="/blog"
                    onClick={() => setIsOpen(false)}
                    className="framer-TLfWE framer-TPaq9 framer-zo2ti framer-v-1fbmjci framer-1mtnv4g"
                    data-framer-name="Out"
                    data-highlight="true"
                    style={{ height: '100%' }}
                  >
                    <div className="framer-zk0tzl" data-framer-component-type="RichTextContainer" style={{ opacity: 1, filter: 'none', transform: 'none' }}>
                      <p className="framer-text framer-styles-preset-141u1yr" data-styles-preset="pAzayDUZg">
                        Blog
                      </p>
                    </div>
                  </Link>
                </div>

                <div className="framer-1yhtuvl-container">
                  <a
                    href="mailto:info@rechitta.com"
                    onClick={() => setIsOpen(false)}
                    className="framer-TLfWE framer-TPaq9 framer-zo2ti framer-v-1fbmjci framer-1mtnv4g"
                    data-framer-name="Out"
                    data-highlight="true"
                    style={{ height: '100%' }}
                  >
                    <div className="framer-zk0tzl" data-framer-component-type="RichTextContainer" style={{ opacity: 1, filter: 'none', transform: 'none' }}>
                      <p className="framer-text framer-styles-preset-141u1yr" data-styles-preset="pAzayDUZg">
                        Contact
                      </p>
                    </div>
                  </a>
                </div>
              </>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
