import { describe, expect, it } from 'vitest';
import { CITIES, cityTime } from './score';

describe('the multilingual chapter', () => {
  it('reads the same instant on every clock', () => {
    const expected: Record<string, string> = {
      mumbai: '09:41',
      moscow: '07:11',
      london: '05:11',
      shanghai: '12:11',
      riyadh: '07:11',
      paris: '06:11',
    };
    CITIES.forEach((city) => expect(cityTime(city)).toBe(expected[city.key]));
  });

  it('gives every city a briefing in its own language', () => {
    CITIES.forEach((city) => {
      expect(city.briefing.length).toBeGreaterThan(3);
      expect(city.language).toMatch(/^[A-Z]+$/);
    });
    expect(new Set(CITIES.map((c) => c.language)).size).toBe(CITIES.length);
  });

  it('marks the right-to-left script', () => {
    expect(CITIES.find((c) => c.key === 'riyadh')?.rtl).toBe(true);
    expect(CITIES.filter((c) => c.rtl)).toHaveLength(1);
  });
});
