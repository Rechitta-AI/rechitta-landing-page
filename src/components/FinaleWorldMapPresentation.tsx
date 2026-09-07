'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { coverRect, matrix3dFor } from '@/screens/warp';
import { isPortraitFor } from '@/hooks/useDeviceMode';
import { MONITOR_CORNERS, DEFAULT_CALIBRATION, sanitizeCalibration, type CalibrationCoords } from './MonitorCalibrator';

/**
 * Global Hub Data matching the 6 Multilingual Cities + Dubai Headquarters.
 * Re-anchored to the 1.73:1 (2000 x 1156) reference canvas to eliminate compression.
 * All derived to read THE SAME MOMENT: 04:11 UTC.
 */
interface GlobalHub {
  key: string;
  name: string;
  x: number;
  y: number;
  time: string;
  lang: string;
  status: string;
  isHQ?: boolean;
  labelOffset: { x: number; y: number };
}

const GLOBAL_HUBS: GlobalHub[] = [
  {
    key: 'london',
    name: 'LONDON',
    x: 980,
    y: 310,
    time: '05:11',
    lang: 'EN',
    status: 'DELIVERED',
    labelOffset: { x: -50, y: -26 },
  },
  {
    key: 'paris',
    name: 'PARIS',
    x: 995,
    y: 345,
    time: '05:11',
    lang: 'FR',
    status: 'DELIVERED',
    labelOffset: { x: 50, y: 26 },
  },
  {
    key: 'moscow',
    name: 'MOSCOW',
    x: 1185,
    y: 305,
    time: '07:11',
    lang: 'RU',
    status: 'DELIVERED',
    labelOffset: { x: 0, y: -26 },
  },
  {
    key: 'riyadh',
    name: 'RIYADH',
    x: 1245,
    y: 480,
    time: '07:11',
    lang: 'AR',
    status: 'DELIVERED',
    labelOffset: { x: -55, y: -24 },
  },
  {
    key: 'dubai',
    name: 'DUBAI HQ',
    x: 1292,
    y: 485,
    time: '08:11',
    lang: 'HQ',
    status: 'GLOBAL ENGINE',
    isHQ: true,
    labelOffset: { x: 0, y: 34 },
  },
  {
    key: 'mumbai',
    name: 'MUMBAI',
    x: 1385,
    y: 505,
    time: '09:41',
    lang: 'HI',
    status: 'DELIVERED',
    /*
     * Out to the right and a little lower than the rest.
     *
     * Mumbai's node sits 93px from Dubai's, and the two badges are 176 and
     * 210 wide, so at a modest offset they overlapped by 70x17px. Dubai is
     * painted last so it always won, and Mumbai read as a clipped "...MBAI".
     * This clears the HQ badge in both axes rather than relying on paint
     * order to hide the problem.
     */
    labelOffset: { x: 118, y: 46 },
  },
  {
    key: 'shanghai',
    name: 'SHANGHAI',
    x: 1625,
    y: 455,
    time: '12:11',
    lang: 'ZH',
    status: 'DELIVERED',
    labelOffset: { x: 0, y: -26 },
  },
];

/** Geodesic arc generator from hub to Dubai HQ */
function makeArcPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const midX = (fromX + toX) / 2;
  const dist = Math.hypot(toX - fromX, toY - fromY);
  const midY = (fromY + toY) / 2 - dist * 0.22;
  return `M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`;
}

const DUBAI_HQ = GLOBAL_HUBS.find((h) => h.isHQ)!;
const STREAM_ARCS = GLOBAL_HUBS.filter((h) => !h.isHQ).map((h) => ({
  key: `${h.key}-dubai`,
  path: makeArcPath(h.x, h.y, DUBAI_HQ.x, DUBAI_HQ.y),
  hub: h,
}));

interface FinaleWorldMapPresentationProps {
  chapter: string;
  beatIndex: number;
  isMoving?: boolean;
}

export default function FinaleWorldMapPresentation({
  chapter,
  beatIndex,
  isMoving = false,
}: FinaleWorldMapPresentationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });
  const [calibration, setCalibration] = useState<CalibrationCoords>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('rechitta:monitor-calibration');
        if (saved) return sanitizeCalibration(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_CALIBRATION;
  });
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track viewport resize
  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to live calibrator updates
  useEffect(() => {
    const onCalibrate = (e: Event) => {
      const customEvent = e as CustomEvent<CalibrationCoords>;
      if (customEvent.detail) {
        const safe = sanitizeCalibration(customEvent.detail);
        setCalibration(safe);
        if (typeof customEvent.detail.isCalibrating === 'boolean') {
          setIsCalibrating(customEvent.detail.isCalibrating);
        }
      }
    };
    window.addEventListener('rechitta:calibrate-monitor', onCalibrate);
    return () => window.removeEventListener('rechitta:calibrate-monitor', onCalibrate);
  }, []);

  // Screen Placement based on live 4-corner calibration coordinates
  const flat = isPortraitFor(viewport.width, viewport.height);
  const rect = coverRect(viewport.width, viewport.height);

  const tlPx: [number, number] = [
    rect.x + (calibration.tl[0] / 100) * rect.width,
    rect.y + (calibration.tl[1] / 100) * rect.height,
  ];
  const trPx: [number, number] = [
    rect.x + (calibration.tr[0] / 100) * rect.width,
    rect.y + (calibration.tr[1] / 100) * rect.height,
  ];
  const brPx: [number, number] = [
    rect.x + (calibration.br[0] / 100) * rect.width,
    rect.y + (calibration.br[1] / 100) * rect.height,
  ];
  const blPx: [number, number] = [
    rect.x + (calibration.bl[0] / 100) * rect.width,
    rect.y + (calibration.bl[1] / 100) * rect.height,
  ];

  // Map onto the pristine 2000 x 1156 (1.73:1) uncompressed reference canvas
  const quadTransform = matrix3dFor(2000, 1156, [tlPx, trPx, brPx, blPx]);

  // Portrait phone fallback
  const availableW = viewport.width * 0.94;
  const availableH = viewport.height * 0.65;
  const portraitScale = Math.min(availableW / 960, availableH / 555);
  const portraitWidth = 960 * portraitScale;
  const portraitHeight = 555 * portraitScale;
  const portraitLeft = (viewport.width - portraitWidth) / 2;
  const portraitTop = (viewport.height - portraitHeight) / 2;

  /*
   * On screen while the film is parked on the presentation, and held through
   * the pull-back that follows.
   *
   * The map is warped onto the monitor using one calibrated quad, measured at
   * the frame the film parks on. That quad is only right for that frame, so
   * once the camera starts moving the map would slide off the screen it is
   * supposed to be on. Rather than cut it dead the moment the shot begins —
   * which read as the map blinking out — it now rides the start of the move
   * and dissolves over it, so the room pulls away from a lit screen.
   *
   * Holding it all the way through the pull-back needs the monitor's corners
   * tracked across the clip, the way the phones are in screens/tracks.ts.
   */
  const onPresentation = chapter === 'finale' && beatIndex === 10;
  const isVisible = (onPresentation && !isMoving) || isCalibrating;
  const isDissolving = onPresentation && isMoving && !isCalibrating;

  // Network ignition animation when landing via match-cut transition
  const triggerIgnition = () => {
    const el = containerRef.current;
    if (!el) return;

    const nodes = el.querySelectorAll('.city-hub-node');
    if (nodes.length > 0) {
      gsap.fromTo(
        nodes,
        { scale: 0.82, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, stagger: 0.04, ease: 'back.out(1.5)', delay: 0.08 }
      );
    }
    const arcs = el.querySelectorAll('.laser-stream-arc');
    if (arcs.length > 0) {
      gsap.fromTo(
        arcs,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, stagger: 0.03, ease: 'power2.out', delay: 0.04 }
      );
    }
  };

  useEffect(() => {
    const onIgnite = () => triggerIgnition();
    window.addEventListener('rechitta:ignite-world-map', onIgnite);
    return () => window.removeEventListener('rechitta:ignite-world-map', onIgnite);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (isVisible) {
      gsap.killTweensOf(el);
      gsap.set(el, { display: 'block' });
      gsap.fromTo(
        el,
        { opacity: 0 },
        { opacity: 1, duration: 0.42, ease: 'power2.out' }
      );
      triggerIgnition();
    } else {
      gsap.killTweensOf(el);
      gsap.to(el, {
        opacity: 0,
        // A dissolve across the camera move, rather than a cut at the start
        // of it. Anywhere else, the shorter exit.
        duration: isDissolving ? 1.5 : 0.3,
        ease: isDissolving ? 'power1.in' : 'power2.inOut',
        onComplete: () => {
          gsap.set(el, { display: 'none' });
        },
      });
    }
    // isDissolving only ever changes alongside isVisible.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      id="finale-world-map-screen"
      className="fixed pointer-events-none select-none"
      style={
        flat
          ? {
              display: 'none',
              left: `${portraitLeft}px`,
              top: `${portraitTop}px`,
              width: `${portraitWidth}px`,
              height: `${portraitHeight}px`,
              zIndex: 48,
              background: 'transparent',
            }
          : {
              display: 'none',
              left: 0,
              top: 0,
              width: '2000px',
              height: '1156px',
              transformOrigin: '0 0',
              transform: quadTransform !== 'none' ? quadTransform : undefined,
              zIndex: 48,
              background: 'transparent',
            }
      }
    >
      {/* 2000 x 1156 SVG canvas: matches screen aspect ratio 1.73:1 exactly */}
      <svg
        viewBox="0 0 2000 1156"
        className="w-full h-full pointer-events-auto"
      >
        <defs>
          {/* Subtle laser arc glow */}
          <filter id="arcGlow2k" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Dubai HQ luxury gold glow */}
          <filter id="hqGlow2k" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Obsidian badge drop shadow */}
          <filter id="pillShadow2k" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Subtle Architectural Distance Grid & Latitude Guide */}
        <g opacity="0.14" pointerEvents="none">
          <circle cx="1292" cy="485" r="180" fill="none" stroke="#568DFF" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="1292" cy="485" r="380" fill="none" stroke="#568DFF" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="1292" cy="485" r="620" fill="none" stroke="#568DFF" strokeWidth="1" strokeDasharray="4 6" />
          <line x1="80" y1="485" x2="1920" y2="485" stroke="#334155" strokeWidth="1" strokeDasharray="3 6" />
          <line x1="1292" y1="120" x2="1292" y2="980" stroke="#334155" strokeWidth="1" strokeDasharray="3 6" />
        </g>

        {/* 1. Top Header (y = 68) with generous margin above northern landmasses */}
        <g transform="translate(60, 68)">
          <circle cx="0" cy="0" r="4.5" fill="#568DFF" />
          <circle cx="0" cy="0" r="9" fill="none" stroke="#568DFF" strokeWidth="1.2" opacity="0.6">
            <animate attributeName="r" from="4.5" to="18" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite" />
          </circle>

          <text
            x="22"
            y="2"
            dominantBaseline="central"
            fill="#070A10"
            fontSize="17"
            fontFamily="var(--font-inter), monospace"
            fontWeight="700"
            letterSpacing="0.22em"
          >
            RECHITTA // GLOBAL DISTRIBUTION ENGINE
          </text>
        </g>

        {/* Top Right Status Badge - Obsidian Micro-Pill */}
        <g transform="translate(1940, 68)">
          <rect
            x="-370"
            y="-16"
            width="370"
            height="32"
            rx="16"
            fill="rgba(7, 10, 16, 0.90)"
            stroke="rgba(255, 255, 255, 0.16)"
            strokeWidth="1"
            filter="url(#pillShadow2k)"
          />
          <circle cx="-346" cy="0" r="4" fill="#10B981">
            <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <text
            x="-330"
            y="2"
            dominantBaseline="central"
            fill="#E8E4DC"
            fontSize="12.5"
            fontFamily="var(--font-inter), monospace"
            fontWeight="600"
            letterSpacing="0.14em"
          >
            6/6 HUBS SYNCHRONIZED · 04:11 UTC
          </text>
        </g>

        {/* 2. User's world.svg Map Vector Layer (y = 145, 100% uncompressed native 2000x857) */}
        <image
          href="/map/world.svg"
          x="0"
          y="145"
          width="2000"
          height="857"
          preserveAspectRatio="none"
          style={{
            mixBlendMode: 'multiply',
            opacity: 0.94,
            filter: 'drop-shadow(0 2px 5px rgba(15, 23, 42, 0.22))',
          }}
        />

        {/* 3. Streaming Data Arcs Connecting All 6 Hubs to Dubai HQ */}
        <g>
          {STREAM_ARCS.map((arc) => (
            <g key={arc.key} className="laser-stream-arc">
              {/* Underlying dashed guide rail */}
              <path
                d={arc.path}
                fill="none"
                stroke="rgba(86, 141, 255, 0.26)"
                strokeWidth="1.8"
                strokeDasharray="4 4"
              />
              {/* Flowing electric blue laser stream */}
              <path
                d={arc.path}
                fill="none"
                stroke="#568DFF"
                strokeWidth="3.2"
                filter="url(#arcGlow2k)"
                strokeDasharray="48 180"
                style={{
                  animation: 'dashPureStream2k 2.4s linear infinite',
                }}
              />
            </g>
          ))}
        </g>

        {/*
          4. Synchronized Hub Nodes & Anti-Collision Labels

          SVG has no z-index: it paints in document order. Dubai sits in the
          middle of the list and the hubs after it — Mumbai and Shanghai are
          right on top of it — were painting over the one node that is meant to
          read as the centre of the network. It goes last so it stays on top.
        */}
        {[...GLOBAL_HUBS]
          .sort((a, b) => Number(Boolean(a.isHQ)) - Number(Boolean(b.isHQ)))
          .map((hub) => {
          const isHQ = Boolean(hub.isHQ);

          return (
            <g
              key={hub.key}
              className="city-hub-node"
              transform={`translate(${hub.x}, ${hub.y})`}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              {/* Radar Ping Ripple */}
              <circle
                r="6"
                fill="none"
                stroke={isHQ ? '#D97706' : '#568DFF'}
                strokeWidth="1.8"
              >
                <animate attributeName="r" from="6" to={isHQ ? '38' : '26'} dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.85" to="0" dur="2.4s" repeatCount="indefinite" />
              </circle>

              {/* Node Center Dot */}
              <circle
                r={isHQ ? 8.5 : 5.5}
                fill={isHQ ? '#D97706' : '#568DFF'}
                stroke="#FFFFFF"
                strokeWidth="2"
                filter={isHQ ? 'url(#hqGlow2k)' : undefined}
              />

              {/* Floating Anti-Collision City Badge */}
              <g transform={`translate(${hub.labelOffset.x}, ${hub.labelOffset.y})`}>
                {isHQ ? (
                  /* Dubai HQ Luxury Obsidian Badge */
                  <g>
                    <rect
                      x="-105"
                      y="-16"
                      width="210"
                      height="32"
                      rx="16"
                      fill="rgba(7, 10, 16, 0.94)"
                      stroke="#D97706"
                      strokeWidth="1.5"
                      filter="url(#pillShadow2k)"
                    />
                    <rect
                      x="-95"
                      y="-9"
                      width="32"
                      height="18"
                      rx="4"
                      fill="rgba(217, 119, 6, 0.25)"
                      stroke="#D97706"
                      strokeWidth="1"
                    />
                    <text
                      x="-79"
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#FBBF24"
                      fontSize="10"
                      fontFamily="var(--font-inter), monospace"
                      fontWeight="800"
                    >
                      HQ
                    </text>
                    <text
                      x="-52"
                      y="1"
                      textAnchor="start"
                      dominantBaseline="central"
                      fill="#FFFFFF"
                      fontSize="12.5"
                      fontFamily="var(--font-inter), monospace"
                      fontWeight="700"
                      letterSpacing="0.08em"
                    >
                      DUBAI · <tspan fill="#FBBF24" fontWeight="600">{hub.time}</tspan>
                    </text>
                  </g>
                ) : (
                  /* Multilingual Partner City Obsidian Badge */
                  <g>
                    <rect
                      x="-88"
                      y="-15"
                      width="176"
                      height="30"
                      rx="15"
                      fill="rgba(7, 10, 16, 0.90)"
                      stroke="rgba(86, 141, 255, 0.45)"
                      strokeWidth="1.2"
                      filter="url(#pillShadow2k)"
                    />
                    <rect
                      x="-78"
                      y="-8"
                      width="26"
                      height="16"
                      rx="4"
                      fill="rgba(86, 141, 255, 0.2)"
                      stroke="rgba(86, 141, 255, 0.4)"
                      strokeWidth="0.8"
                    />
                    <text
                      x="-65"
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#8FB4FF"
                      fontSize="9.5"
                      fontFamily="var(--font-inter), monospace"
                      fontWeight="700"
                    >
                      {hub.lang}
                    </text>
                    <text
                      x="-44"
                      y="1"
                      textAnchor="start"
                      dominantBaseline="central"
                      fill="#FFFFFF"
                      fontSize="12"
                      fontFamily="var(--font-inter), monospace"
                      fontWeight="600"
                      letterSpacing="0.08em"
                    >
                      {hub.name} · <tspan fill="#94A3B8" fontWeight="500">{hub.time}</tspan>
                    </text>
                  </g>
                )}
              </g>
            </g>
          );
        })}

        {/* 5. Bottom Telemetry Ticker (y = 1090) */}
        <g transform="translate(60, 1090)">
          <circle cx="0" cy="0" r="4" fill="#10B981" />
          <text
            x="14"
            y="2"
            dominantBaseline="central"
            fill="#0F172A"
            fontSize="13.5"
            fontFamily="var(--font-inter), monospace"
            fontWeight="700"
            letterSpacing="0.14em"
          >
            BRIEFINGS DELIVERED: PARIS (FR) · LONDON (EN) · RIYADH (AR) · MOSCOW (RU) · MUMBAI (HI) · SHANGHAI (ZH)
          </text>
        </g>

        <g transform="translate(1940, 1090)">
          <text
            x="0"
            y="2"
            textAnchor="end"
            dominantBaseline="central"
            fill="#475569"
            fontSize="13.5"
            fontFamily="var(--font-inter), monospace"
            fontWeight="600"
            letterSpacing="0.16em"
          >
            LATENCY: 12ms · 100% CONCURRENCY · GLOBAL ENGINE
          </text>
        </g>
      </svg>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes dashPureStream2k {
          from {
            stroke-dashoffset: 220;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
