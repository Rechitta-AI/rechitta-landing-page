import { describe, expect, it } from 'vitest';
import { DESKTOP_MIN, TABLET_MIN, isPortraitFor, modeFor } from './useDeviceMode';

describe('device modes', () => {
  it('splits at the documented boundaries', () => {
    expect(modeFor(1920)).toBe('desktop');
    expect(modeFor(DESKTOP_MIN)).toBe('desktop');
    expect(modeFor(DESKTOP_MIN - 1)).toBe('tablet');
    expect(modeFor(TABLET_MIN)).toBe('tablet');
    expect(modeFor(TABLET_MIN - 1)).toBe('mobile');
    expect(modeFor(320)).toBe('mobile');
  });

  it('treats a tall viewport as portrait, whatever its width', () => {
    expect(isPortraitFor(390, 780)).toBe(true);
    expect(isPortraitFor(820, 1180)).toBe(true);
    expect(isPortraitFor(1440, 860)).toBe(false);
    expect(isPortraitFor(1000, 760)).toBe(false);
  });
});
