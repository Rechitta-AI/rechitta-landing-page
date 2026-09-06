'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { coverRect } from '@/screens/warp';
import { isPortraitFor } from '@/hooks/useDeviceMode';

export type CornerPoint = [number, number]; // [xPercent, yPercent] relative to coverRect (0-100)

export interface CalibrationCoords {
  // 4 Independent Corner Points (each in % of video cover rect)
  tl: CornerPoint;
  tr: CornerPoint;
  br: CornerPoint;
  bl: CornerPoint;

  // 2D & legacy fallback fields
  left: number;
  top: number;
  width: number;
  height: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
  perspective: number;
  isCalibrating?: boolean;
}

// 4-Corner 3D Calibrated Coordinates (% of video cover rect)
export const MONITOR_CORNERS = {
  tl: [20.05, 12.02] as CornerPoint,
  tr: [81.54, 11.90] as CornerPoint,
  br: [80.64, 75.21] as CornerPoint,
  bl: [21.30, 75.05] as CornerPoint,
};

export const DEFAULT_CALIBRATION: CalibrationCoords = {
  tl: MONITOR_CORNERS.tl,
  tr: MONITOR_CORNERS.tr,
  br: MONITOR_CORNERS.br,
  bl: MONITOR_CORNERS.bl,
  left: 20.05,
  top: 12.02,
  width: 61.49,
  height: 63.19,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  scale: 1.0,
  perspective: 1000,
  isCalibrating: false,
};

export function sanitizeCalibration(input: unknown): CalibrationCoords {
  if (!input || typeof input !== 'object') return { ...DEFAULT_CALIBRATION };
  const obj = input as Record<string, unknown>;

  const getNum = (val: unknown, fallback: number): number => {
    return typeof val === 'number' && !Number.isNaN(val) ? val : fallback;
  };

  const getPoint = (val: unknown, fallback: CornerPoint): CornerPoint => {
    if (Array.isArray(val) && val.length >= 2) {
      return [getNum(val[0], fallback[0]), getNum(val[1], fallback[1])];
    }
    return fallback;
  };

  const left = getNum(obj.left, DEFAULT_CALIBRATION.left);
  const top = getNum(obj.top, DEFAULT_CALIBRATION.top);
  const width = getNum(obj.width, DEFAULT_CALIBRATION.width);
  const height = getNum(obj.height, DEFAULT_CALIBRATION.height);

  const hasLegacy2D = typeof obj.left === 'number' && !Number.isNaN(obj.left) && typeof obj.width === 'number' && !Number.isNaN(obj.width);
  const fallbackTL: CornerPoint = hasLegacy2D ? [left, top] : DEFAULT_CALIBRATION.tl;
  const fallbackTR: CornerPoint = hasLegacy2D ? [left + width, top] : DEFAULT_CALIBRATION.tr;
  const fallbackBR: CornerPoint = hasLegacy2D ? [left + width, top + height] : DEFAULT_CALIBRATION.br;
  const fallbackBL: CornerPoint = hasLegacy2D ? [left, top + height] : DEFAULT_CALIBRATION.bl;

  return {
    tl: getPoint(obj.tl, fallbackTL),
    tr: getPoint(obj.tr, fallbackTR),
    br: getPoint(obj.br, fallbackBR),
    bl: getPoint(obj.bl, fallbackBL),
    left,
    top,
    width,
    height,
    rotateX: getNum(obj.rotateX, DEFAULT_CALIBRATION.rotateX),
    rotateY: getNum(obj.rotateY, DEFAULT_CALIBRATION.rotateY),
    rotateZ: getNum(obj.rotateZ, DEFAULT_CALIBRATION.rotateZ),
    scale: getNum(obj.scale, DEFAULT_CALIBRATION.scale),
    perspective: getNum(obj.perspective, DEFAULT_CALIBRATION.perspective),
    isCalibrating: Boolean(obj.isCalibrating),
  };
}

const STORAGE_KEY = 'rechitta:monitor-calibration';

export default function MonitorCalibrator({ active = true }: { active?: boolean }) {
  const [coords, setCoords] = useState<CalibrationCoords>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return sanitizeCalibration(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load calibration:', e);
      }
    }
    return DEFAULT_CALIBRATION;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCorner, setSelectedCorner] = useState<'tl' | 'tr' | 'br' | 'bl'>('tl');
  const [forcePreview, setForcePreview] = useState(true);
  const [copied, setCopied] = useState(false);
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const activeDragRef = useRef<string | null>(null);

  // Track viewport resize
  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Broadcast coordinate changes to FinaleWorldMapPresentation
  const broadcast = useCallback((next: CalibrationCoords, calibratingActive: boolean) => {
    const payload: CalibrationCoords = {
      ...sanitizeCalibration(next),
      isCalibrating: calibratingActive,
    };
    window.dispatchEvent(
      new CustomEvent('rechitta:calibrate-monitor', { detail: payload })
    );
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const updateCoords = (updater: (prev: CalibrationCoords) => CalibrationCoords) => {
    setCoords((prev) => {
      const next = sanitizeCalibration(updater(prev));
      broadcast(next, isOpen && forcePreview);
      return next;
    });
  };

  // Broadcast on mount and when isOpen / forcePreview toggles
  useEffect(() => {
    broadcast(coords, isOpen && forcePreview);
  }, [broadcast, coords, isOpen, forcePreview]);

  // Keyboard shortcut: Press 'C' to toggle calibrator
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Calculate current pixel positions of the 4 corners based on coverRect
  const flat = isPortraitFor(viewport.width, viewport.height);
  const rect = coverRect(viewport.width, viewport.height);

  const tlPx: [number, number] = [
    rect.x + (coords.tl[0] / 100) * rect.width,
    rect.y + (coords.tl[1] / 100) * rect.height,
  ];
  const trPx: [number, number] = [
    rect.x + (coords.tr[0] / 100) * rect.width,
    rect.y + (coords.tr[1] / 100) * rect.height,
  ];
  const brPx: [number, number] = [
    rect.x + (coords.br[0] / 100) * rect.width,
    rect.y + (coords.br[1] / 100) * rect.height,
  ];
  const blPx: [number, number] = [
    rect.x + (coords.bl[0] / 100) * rect.width,
    rect.y + (coords.bl[1] / 100) * rect.height,
  ];

  // Direct Interactive Dragging for all 4 Corners
  const handleCornerMouseDown = (corner: 'tl' | 'tr' | 'br' | 'bl', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCorner(corner);
    activeDragRef.current = corner;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!activeDragRef.current) return;
      const currentRect = coverRect(window.innerWidth, window.innerHeight);
      const xPercent = ((moveEvent.clientX - currentRect.x) / currentRect.width) * 100;
      const yPercent = ((moveEvent.clientY - currentRect.y) / currentRect.height) * 100;

      const clampedX = parseFloat(Math.max(-10, Math.min(110, xPercent)).toFixed(2));
      const clampedY = parseFloat(Math.max(-10, Math.min(110, yPercent)).toFixed(2));

      updateCoords((prev) => ({
        ...prev,
        [activeDragRef.current!]: [clampedX, clampedY],
      }));
    };

    const onMouseUp = () => {
      activeDragRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Nudge individual corner by dx, dy
  const nudgeCorner = (corner: 'tl' | 'tr' | 'br' | 'bl', dx: number, dy: number) => {
    updateCoords((prev) => ({
      ...prev,
      [corner]: [
        parseFloat((prev[corner][0] + dx).toFixed(2)),
        parseFloat((prev[corner][1] + dy).toFixed(2)),
      ],
    }));
  };

  // Shift all 4 corners simultaneously
  const shiftAll = (dx: number, dy: number) => {
    updateCoords((prev) => ({
      ...prev,
      tl: [parseFloat((prev.tl[0] + dx).toFixed(2)), parseFloat((prev.tl[1] + dy).toFixed(2))],
      tr: [parseFloat((prev.tr[0] + dx).toFixed(2)), parseFloat((prev.tr[1] + dy).toFixed(2))],
      br: [parseFloat((prev.br[0] + dx).toFixed(2)), parseFloat((prev.br[1] + dy).toFixed(2))],
      bl: [parseFloat((prev.bl[0] + dx).toFixed(2)), parseFloat((prev.bl[1] + dy).toFixed(2))],
    }));
  };

  // Scale all 4 corners outward or inward from quad center
  const scaleAll = (factor: number) => {
    updateCoords((prev) => {
      const centerX = (prev.tl[0] + prev.tr[0] + prev.br[0] + prev.bl[0]) / 4;
      const centerY = (prev.tl[1] + prev.tr[1] + prev.br[1] + prev.bl[1]) / 4;

      const scalePoint = (p: CornerPoint): CornerPoint => [
        parseFloat((centerX + (p[0] - centerX) * factor).toFixed(2)),
        parseFloat((centerY + (p[1] - centerY) * factor).toFixed(2)),
      ];

      return {
        ...prev,
        tl: scalePoint(prev.tl),
        tr: scalePoint(prev.tr),
        br: scalePoint(prev.br),
        bl: scalePoint(prev.bl),
      };
    });
  };

  const copyValues = () => {
    const code = `// 4-Corner 3D Calibrated Coordinates (% of video cover rect)
export const MONITOR_CORNERS = {
  tl: [${coords.tl[0].toFixed(2)}, ${coords.tl[1].toFixed(2)}],
  tr: [${coords.tr[0].toFixed(2)}, ${coords.tr[1].toFixed(2)}],
  br: [${coords.br[0].toFixed(2)}, ${coords.br[1].toFixed(2)}],
  bl: [${coords.bl[0].toFixed(2)}, ${coords.bl[1].toFixed(2)}],
};`;

    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetValues = () => {
    updateCoords(() => DEFAULT_CALIBRATION);
  };

  if (!active || !mounted) return null;

  return (
    <>
      {/* 1. Toggle Button (Positioned at BOTTOM-LEFT) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-4 left-4 z-[9999] flex items-center gap-2 px-3.5 py-2 rounded-full
                   bg-slate-900/90 text-white font-mono text-[11px] tracking-wider border border-white/20
                   shadow-xl hover:bg-black transition-all cursor-pointer backdrop-blur-md"
        title="Toggle Monitor Calibrator (Hotkey: C)"
      >
        <span className="text-amber-400 font-bold">⚙</span>
        <span>{isOpen ? 'CLOSE CALIBRATOR' : 'CALIBRATE MONITOR'}</span>
      </button>

      {/* 2. Interactive 4 Corner Handles & 3D Quadrilateral Wireframe */}
      {isOpen && !flat && (
        <div className="fixed inset-0 pointer-events-none z-[9998]">
          {/* Wireframe Outline Polygon & 3D Diagonals */}
          <svg className="w-full h-full">
            <polygon
              points={`${tlPx[0]},${tlPx[1]} ${trPx[0]},${trPx[1]} ${brPx[0]},${brPx[1]} ${blPx[0]},${blPx[1]}`}
              fill="rgba(59, 130, 246, 0.08)"
              stroke="rgba(59, 130, 246, 0.85)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            {/* Perspective Crosshair Diagonals */}
            <line
              x1={tlPx[0]}
              y1={tlPx[1]}
              x2={brPx[0]}
              y2={brPx[1]}
              stroke="rgba(59, 130, 246, 0.25)"
              strokeDasharray="4 4"
            />
            <line
              x1={trPx[0]}
              y1={trPx[1]}
              x2={blPx[0]}
              y2={blPx[1]}
              stroke="rgba(59, 130, 246, 0.25)"
              strokeDasharray="4 4"
            />
          </svg>

          {/* Draggable Handle TL */}
          <div
            onMouseDown={(e) => handleCornerMouseDown('tl', e)}
            style={{ left: `${tlPx[0]}px`, top: `${tlPx[1]}px` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-move flex items-center justify-center group"
          >
            <div
              className={`w-8 h-8 rounded-full border-2 shadow-2xl flex items-center justify-center text-[10px] font-mono font-bold transition-transform group-hover:scale-125 ${
                selectedCorner === 'tl'
                  ? 'bg-amber-500 border-white text-slate-950 scale-110 ring-4 ring-amber-400/40'
                  : 'bg-blue-600 border-white text-white'
              }`}
            >
              TL
            </div>
            <div className="absolute top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900/90 text-[9.5px] text-white font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/20">
              [{coords.tl[0].toFixed(1)}%, {coords.tl[1].toFixed(1)}%]
            </div>
          </div>

          {/* Draggable Handle TR */}
          <div
            onMouseDown={(e) => handleCornerMouseDown('tr', e)}
            style={{ left: `${trPx[0]}px`, top: `${trPx[1]}px` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-move flex items-center justify-center group"
          >
            <div
              className={`w-8 h-8 rounded-full border-2 shadow-2xl flex items-center justify-center text-[10px] font-mono font-bold transition-transform group-hover:scale-125 ${
                selectedCorner === 'tr'
                  ? 'bg-amber-500 border-white text-slate-950 scale-110 ring-4 ring-amber-400/40'
                  : 'bg-blue-600 border-white text-white'
              }`}
            >
              TR
            </div>
            <div className="absolute top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900/90 text-[9.5px] text-white font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/20">
              [{coords.tr[0].toFixed(1)}%, {coords.tr[1].toFixed(1)}%]
            </div>
          </div>

          {/* Draggable Handle BR */}
          <div
            onMouseDown={(e) => handleCornerMouseDown('br', e)}
            style={{ left: `${brPx[0]}px`, top: `${brPx[1]}px` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-move flex items-center justify-center group"
          >
            <div
              className={`w-8 h-8 rounded-full border-2 shadow-2xl flex items-center justify-center text-[10px] font-mono font-bold transition-transform group-hover:scale-125 ${
                selectedCorner === 'br'
                  ? 'bg-amber-500 border-white text-slate-950 scale-110 ring-4 ring-amber-400/40'
                  : 'bg-blue-600 border-white text-white'
              }`}
            >
              BR
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900/90 text-[9.5px] text-white font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/20">
              [{coords.br[0].toFixed(1)}%, {coords.br[1].toFixed(1)}%]
            </div>
          </div>

          {/* Draggable Handle BL */}
          <div
            onMouseDown={(e) => handleCornerMouseDown('bl', e)}
            style={{ left: `${blPx[0]}px`, top: `${blPx[1]}px` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-move flex items-center justify-center group"
          >
            <div
              className={`w-8 h-8 rounded-full border-2 shadow-2xl flex items-center justify-center text-[10px] font-mono font-bold transition-transform group-hover:scale-125 ${
                selectedCorner === 'bl'
                  ? 'bg-amber-500 border-white text-slate-950 scale-110 ring-4 ring-amber-400/40'
                  : 'bg-blue-600 border-white text-white'
              }`}
            >
              BL
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900/90 text-[9.5px] text-white font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/20">
              [{coords.bl[0].toFixed(1)}%, {coords.bl[1].toFixed(1)}%]
            </div>
          </div>
        </div>
      )}

      {/* 3. Floating Control HUD Panel (Shifted to BOTTOM-LEFT) */}
      {isOpen && (
        <div
          className="fixed bottom-16 left-4 z-[9999] w-92 max-h-[75vh] overflow-y-auto p-4 rounded-2xl bg-slate-900/95 text-white
                     border border-slate-700 shadow-2xl backdrop-blur-md font-sans select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="font-mono text-xs font-bold tracking-wider text-slate-100 uppercase">
                4-Corner 3D Calibrator
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Film Stage Navigation & Preview Mode */}
          <div className="mt-2.5 mb-3 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('rechitta:jump-to-beat', { detail: { index: 10 } })
                );
              }}
              className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-mono text-[10px] cursor-pointer flex items-center justify-center gap-1 transition-colors"
              title="Jump the video straight to the boardroom finale scene"
            >
              <span>📺 Jump to Finale Beat 10</span>
            </button>
            <button
              onClick={() => setForcePreview((prev) => !prev)}
              className={`py-1.5 px-2 rounded-lg border font-mono text-[10px] cursor-pointer transition-colors ${
                forcePreview
                  ? 'bg-emerald-600/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Keep overlay map visible while calibrating"
            >
              {forcePreview ? '● Live Map Preview' : '○ Auto Hide'}
            </button>
          </div>

          {/* Presets Row */}
          <div className="mb-3">
            <div className="text-[10px] font-mono text-slate-400 mb-1">3D PERSPECTIVE PRESETS:</div>
            <div className="grid grid-cols-4 gap-1 font-mono text-[10px]">
              <button
                onClick={() =>
                  updateCoords((prev) => ({
                    ...prev,
                    tl: [20.05, 12.02],
                    tr: [81.54, 12.02],
                    br: [81.54, 75.13],
                    bl: [20.05, 75.13],
                  }))
                }
                className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                Flat
              </button>
              <button
                onClick={() =>
                  updateCoords((prev) => ({
                    ...prev,
                    tl: [20.05, 12.02],
                    tr: [81.54, 11.90],
                    br: [80.64, 75.21],
                    bl: [21.30, 75.05],
                  }))
                }
                className="py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 cursor-pointer"
              >
                Boardroom
              </button>
              <button
                onClick={() =>
                  updateCoords((prev) => ({
                    ...prev,
                    tl: [14.0, 9.0],
                    tr: [85.0, 13.0],
                    br: [84.0, 83.0],
                    bl: [14.0, 87.0],
                  }))
                }
                className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                Yaw Right
              </button>
              <button
                onClick={() =>
                  updateCoords((prev) => ({
                    ...prev,
                    tl: [16.0, 13.0],
                    tr: [87.0, 9.0],
                    br: [87.0, 87.0],
                    bl: [17.0, 83.0],
                  }))
                }
                className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                Yaw Left
              </button>
            </div>
          </div>

          {/* Section: Select Corner & Micro Nudge Controls */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] font-bold text-slate-200">
                DRAG OR NUDGE CORNER:
              </span>
              <span className="font-mono text-[11px] text-amber-400 font-bold">
                {selectedCorner.toUpperCase()}: [{coords[selectedCorner][0].toFixed(1)}%, {coords[selectedCorner][1].toFixed(1)}%]
              </span>
            </div>

            {/* Corner Select Buttons */}
            <div className="grid grid-cols-4 gap-1 mb-2.5 font-mono text-[11px]">
              {(['tl', 'tr', 'br', 'bl'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCorner(c)}
                  className={`py-1 rounded-md font-bold transition-all cursor-pointer ${
                    selectedCorner === c
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-750 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {c.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Micro Nudge Keypad */}
            <div className="flex items-center justify-center gap-1.5 py-1">
              <button
                onClick={() => nudgeCorner(selectedCorner, -0.2, 0)}
                className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-white font-mono text-sm font-bold flex items-center justify-center cursor-pointer shadow"
                title="Nudge Left 0.2%"
              >
                ◀
              </button>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => nudgeCorner(selectedCorner, 0, -0.2)}
                  className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-white font-mono text-sm font-bold flex items-center justify-center cursor-pointer shadow"
                  title="Nudge Up 0.2%"
                >
                  ▲
                </button>
                <button
                  onClick={() => nudgeCorner(selectedCorner, 0, 0.2)}
                  className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-white font-mono text-sm font-bold flex items-center justify-center cursor-pointer shadow"
                  title="Nudge Down 0.2%"
                >
                  ▼
                </button>
              </div>
              <button
                onClick={() => nudgeCorner(selectedCorner, 0.2, 0)}
                className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-white font-mono text-sm font-bold flex items-center justify-center cursor-pointer shadow"
                title="Nudge Right 0.2%"
              >
                ▶
              </button>
            </div>
          </div>

          {/* Global Operations: Shift All & Scale All */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 mb-3 font-mono text-[11px]">
            <div className="text-[10px] text-slate-400 mb-2">TRANSFORM ALL 4 CORNERS:</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded border border-slate-700">
                <span className="text-slate-400">PAN X:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => shiftAll(-0.5, 0)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => shiftAll(0.5, 0)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
                  >
                    ▶
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded border border-slate-700">
                <span className="text-slate-400">PAN Y:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => shiftAll(0, -0.5)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => shiftAll(0, 0.5)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded border border-slate-700 mt-2">
              <span className="text-slate-400">SCALE FROM CENTER:</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => scaleAll(0.98)}
                  className="px-3 py-0.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
                >
                  - 2%
                </button>
                <button
                  onClick={() => scaleAll(1.02)}
                  className="px-3 py-0.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
                >
                  + 2%
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={resetValues}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] cursor-pointer transition-colors"
            >
              Reset
            </button>
            <button
              onClick={copyValues}
              className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-[10px] font-bold tracking-wider cursor-pointer text-center transition-colors"
            >
              {copied ? '✓ COPIED ALL 4 CORNERS!' : 'COPY CODE VALUES'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
