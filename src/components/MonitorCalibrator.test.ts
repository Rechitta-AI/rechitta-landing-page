import { describe, it, expect } from 'vitest';
import { sanitizeCalibration, DEFAULT_CALIBRATION, MONITOR_CORNERS } from './MonitorCalibrator';

describe('MonitorCalibrator - sanitizeCalibration with 4 Corners', () => {
  it('exports MONITOR_CORNERS matching user calibrated boardroom values', () => {
    expect(MONITOR_CORNERS).toEqual({
      tl: [20.05, 12.02],
      tr: [81.54, 11.90],
      br: [80.64, 75.21],
      bl: [21.30, 75.05],
    });
    expect(DEFAULT_CALIBRATION.tl).toEqual(MONITOR_CORNERS.tl);
    expect(DEFAULT_CALIBRATION.tr).toEqual(MONITOR_CORNERS.tr);
    expect(DEFAULT_CALIBRATION.br).toEqual(MONITOR_CORNERS.br);
    expect(DEFAULT_CALIBRATION.bl).toEqual(MONITOR_CORNERS.bl);
  });

  it('returns DEFAULT_CALIBRATION when input is null or undefined', () => {
    expect(sanitizeCalibration(null)).toEqual(DEFAULT_CALIBRATION);
    expect(sanitizeCalibration(undefined)).toEqual(DEFAULT_CALIBRATION);
  });

  it('safely derives 4 corners from legacy 2D localStorage data', () => {
    const legacy2D = {
      left: 10,
      top: 15,
      width: 80,
      height: 70,
    };
    const sanitized = sanitizeCalibration(legacy2D);

    expect(sanitized.tl).toEqual([10, 15]);
    expect(sanitized.tr).toEqual([90, 15]);
    expect(sanitized.br).toEqual([90, 85]);
    expect(sanitized.bl).toEqual([10, 85]);
    expect(sanitized.isCalibrating).toBe(false);
  });

  it('filters out NaN or non-number corrupted values', () => {
    const corrupted = {
      tl: ['invalid', NaN],
      tr: null,
      left: 'bad',
      top: 'bad',
    };
    const sanitized = sanitizeCalibration(corrupted);

    expect(sanitized.tl).toEqual(DEFAULT_CALIBRATION.tl);
    expect(sanitized.tr).toEqual(DEFAULT_CALIBRATION.tr);
    expect(sanitized.perspective).toBe(1000);
  });

  it('preserves valid custom 4-corner 3D perspective coordinates', () => {
    const custom = {
      tl: [15.2, 10.4] as [number, number],
      tr: [86.2, 11.2] as [number, number],
      br: [85.8, 84.8] as [number, number],
      bl: [15.0, 85.6] as [number, number],
      left: 15.2,
      top: 10.4,
      width: 71.0,
      height: 74.4,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1,
      perspective: 1000,
      isCalibrating: true,
    };
    const sanitized = sanitizeCalibration(custom);

    expect(sanitized.tl).toEqual([15.2, 10.4]);
    expect(sanitized.tr).toEqual([86.2, 11.2]);
    expect(sanitized.br).toEqual([85.8, 84.8]);
    expect(sanitized.bl).toEqual([15.0, 85.6]);
    expect(sanitized.isCalibrating).toBe(true);
  });
});
