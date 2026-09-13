import { describe, it, expect } from 'vitest';
import { sanitizeCalibration, DEFAULT_CALIBRATION, MONITOR_CORNERS } from './MonitorCalibrator';

describe('MonitorCalibrator - sanitizeCalibration with 4 Corners', () => {
  it('exports the boardroom monitor corners, measured off the park frame', () => {
    expect(MONITOR_CORNERS).toEqual({
      tl: [20.39, 11.92],
      tr: [80.96, 12.30],
      br: [80.35, 75.13],
      bl: [20.73, 74.94],
    });
    expect(DEFAULT_CALIBRATION.tl).toEqual(MONITOR_CORNERS.tl);
    expect(DEFAULT_CALIBRATION.tr).toEqual(MONITOR_CORNERS.tr);
    expect(DEFAULT_CALIBRATION.br).toEqual(MONITOR_CORNERS.br);
    expect(DEFAULT_CALIBRATION.bl).toEqual(MONITOR_CORNERS.bl);
  });

  /*
   * The checks the literal above cannot make. A quad copied out of a
   * measurement is easy to paste in transposed, mirrored or with a stray
   * digit, and none of that shows up in an equality test against itself.
   */
  it('describes a plausible screen: wound clockwise, near-rectangular', () => {
    const { tl, tr, br, bl } = MONITOR_CORNERS;

    // Corners in the order the name says they are.
    expect(tl[0]).toBeLessThan(tr[0]);
    expect(bl[0]).toBeLessThan(br[0]);
    expect(tl[1]).toBeLessThan(bl[1]);
    expect(tr[1]).toBeLessThan(br[1]);

    // A wall-mounted screen shot near head-on: opposite edges within a
    // percent of frame of each other, and no edge tilted more than that.
    const topW = tr[0] - tl[0];
    const botW = br[0] - bl[0];
    const leftH = bl[1] - tl[1];
    const rightH = br[1] - tr[1];
    expect(Math.abs(topW - botW)).toBeLessThan(1);
    expect(Math.abs(leftH - rightH)).toBeLessThan(1);
    expect(Math.abs(tl[1] - tr[1])).toBeLessThan(1);
    expect(Math.abs(bl[0] - tl[0])).toBeLessThan(1);

    // Somewhere between a third and three quarters of the frame across, and
    // the right way up.
    expect(topW).toBeGreaterThan(33);
    expect(topW).toBeLessThan(75);
    expect(leftH).toBeGreaterThan(20);
    expect(leftH).toBeLessThan(80);

    // Foreshortened, but still recognisably a widescreen panel. The corners are
    // percentages of two different frame dimensions, so the ratio between them
    // has to be scaled by the frame's own 16:9 to mean anything.
    const aspect = (topW / leftH) * (16 / 9);
    expect(aspect).toBeGreaterThan(1.4);
    expect(aspect).toBeLessThan(2.1);
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
