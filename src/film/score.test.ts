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
  it('parks at 1.0s on desktop and 5.2s on mobile portrait', async () => {
    const { BEATS, getBeatPark } = await import('./score');
    const finaleScreen = BEATS.find((b) => b.id === 'finale-screen')!;
    expect(getBeatPark(finaleScreen, false)).toBe(1.0);
    expect(getBeatPark(finaleScreen, true)).toBe(5.2);
  });

  it('plays forward from 1.0s on desktop and from 5.2s on mobile portrait', async () => {
    const { BEATS, getBeatEnter } = await import('./score');
    const finale = BEATS.find((b) => b.id === 'finale')!;
    expect(getBeatEnter(finale, false)).toEqual({ from: 1.0, to: 11.0, rate: 1.8 });
    expect(getBeatEnter(finale, true)).toEqual({ from: 5.2, to: 11.0, rate: 1.8 });
  });
});

describe('intro responsive sequence 1 & 2', () => {
  it('keeps desktop sequence 1 and 2 completely untouched', async () => {
    const { BEATS, getBeatClip, getBeatPark, getBeatEnter, EAGER_CLIPS } = await import('./score');
    expect(EAGER_CLIPS).toEqual([{ key: 'scene1-3', from: 2, to: 11 }]);

    const hero = BEATS.find((b) => b.id === 'hero')!;
    expect(getBeatClip(hero, false)).toBe('scene1-3');
    expect(getBeatPark(hero, false)).toBe(2.0);

    const boardroom = BEATS.find((b) => b.id === 'boardroom')!;
    expect(getBeatClip(boardroom, false)).toBe('scene1-3');
    expect(getBeatPark(boardroom, false)).toBe(11.0);
    expect(getBeatEnter(boardroom, false)).toEqual({ from: 2.0, to: 11.0, rate: 2.4 });

    const broker = BEATS.find((b) => b.id === 'broker')!;
    expect(getBeatClip(broker, false)).toBe('transit-b');
    expect(getBeatPark(broker, false)).toBe(16.9);
    expect(getBeatEnter(broker, false)).toEqual({ from: 2.0, to: 16.9, rate: 3.6 });
  });

  it('uses mobile-seq1-2 for Sequence 1 and transit-b for Sequence 2 in portrait mode', async () => {
    const { BEATS, getBeatClip, getBeatPark, getBeatEnter, MOBILE_EAGER_CLIPS, MOBILE_LAZY_CLIPS } =
      await import('./score');
    expect(MOBILE_EAGER_CLIPS).toEqual([{ key: 'mobile-seq1-2', from: 0, to: 5.0 }]);
    expect(MOBILE_LAZY_CLIPS[0]).toEqual({ key: 'transit-b', from: 2.0, to: 16.9 });

    const hero = BEATS.find((b) => b.id === 'hero')!;
    expect(getBeatClip(hero, true)).toBe('mobile-seq1-2');
    expect(getBeatPark(hero, true)).toBe(0.0);

    const boardroom = BEATS.find((b) => b.id === 'boardroom')!;
    expect(getBeatClip(boardroom, true)).toBe('mobile-seq1-2');
    expect(getBeatPark(boardroom, true)).toBe(5.0);
    expect(getBeatEnter(boardroom, true)).toEqual({ from: 0.0, to: 5.0, rate: 2.0 });

    const broker = BEATS.find((b) => b.id === 'broker')!;
    expect(getBeatClip(broker, true)).toBe('transit-b');
    expect(getBeatPark(broker, true)).toBe(16.9);
    expect(getBeatEnter(broker, true)).toEqual({ from: 2.0, to: 16.9, rate: 3.6 });
  });
});


