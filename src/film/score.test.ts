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

describe('finale responsive beats', () => {
  it('parks at 1.0s on desktop and 4.6s on mobile portrait', async () => {
    const { BEATS, getBeatPark } = await import('./score');
    const finaleScreen = BEATS.find((b) => b.id === 'finale-screen')!;
    expect(getBeatPark(finaleScreen, false)).toBe(1.0);
    expect(getBeatPark(finaleScreen, true)).toBe(4.6);
  });

  it('plays forward from 1.0s on desktop and from 4.6s on mobile portrait', async () => {
    const { BEATS, getBeatEnter } = await import('./score');
    const finale = BEATS.find((b) => b.id === 'finale')!;
    expect(getBeatEnter(finale, false)).toEqual({ from: 1.0, to: 11.0, rate: 1.8 });
    expect(getBeatEnter(finale, true)).toEqual({ from: 4.6, to: 11.0, rate: 1.8 });
  });
});

