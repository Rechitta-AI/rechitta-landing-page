/**
 * The score — every place the film can come to rest, in order.
 *
 * The experience is not a scrubbed timeline. It is a list of BEATS, and a
 * beat is a single frame the film parks on. Between two beats sits a
 * transition: a stretch of footage played once, at native speed, by the
 * hardware decoder. Nothing seeks, nothing scrubs, and nothing moves unless
 * the viewer asked for it.
 *
 * Clip beats anchor to source time rather than to scroll progress. Durations
 * are measured from video metadata at runtime, so a retrim moves the beats and
 * the orb's path together instead of sliding them apart.
 */

/** The intro film's clips, in cut order, with their trims. */
export const CLIP_SEQUENCE = [
  { key: 'scene1-3', in: 2, out: 11, holdWeight: 8 },
  { key: 'transit-b', in: 2, out: 16.9, holdWeight: 6 },
  { key: 'transit-c', in: 0, out: 6.8, holdWeight: 6 },
  { key: 'transit-d', in: 0, out: 6.0, holdWeight: 0 },
] as const;

/** The film's slice of the global 0–1 progress line the orb flies against. */
export const INTRO_SPAN = { start: 0, end: 0.5 };

/** Where the multilingual chapter and the finale sit on that same line. */
export const CITIES_SPAN = { start: 0.52, end: 0.93 };
export const FINALE_SPAN = { start: 0.95, end: 1.0 };

/**
 * The multilingual chapter.
 *
 * Every clock here reads the same instant — 04:11 UTC — which is the whole
 * point of the sequence: one briefing, delivered everywhere at once, in the
 * language of the person holding the phone. Change one time and the line
 * "THE SAME MOMENT" stops being true, so they are derived rather than typed.
 */
const BASE_UTC_MINUTES = 4 * 60 + 11;

function localTime(offsetMinutes: number): string {
  const total = (((BASE_UTC_MINUTES + offsetMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export type City = {
  key: string;
  label: string;
  /** The language the briefing arrives in, as shown under the headline. */
  language: string;
  /** "Your briefing is ready", in that language. */
  briefing: string;
  /** Minutes ahead of UTC. */
  offset: number;
  rtl?: boolean;
};

export const CITIES: readonly City[] = [
  { key: 'mumbai', label: 'MUMBAI', language: 'HINDI', briefing: 'आपकी ब्रीफ़िंग तैयार है', offset: 330 },
  { key: 'moscow', label: 'MOSCOW', language: 'RUSSIAN', briefing: 'Ваш брифинг готов', offset: 180 },
  { key: 'london', label: 'LONDON', language: 'ENGLISH', briefing: 'Your briefing is ready', offset: 60 },
  { key: 'shanghai', label: 'SHANGHAI', language: 'MANDARIN', briefing: '您的简报已准备好', offset: 480 },
  { key: 'riyadh', label: 'RIYADH', language: 'ARABIC', briefing: 'ملخصك جاهز', offset: 180, rtl: true },
  { key: 'paris', label: 'PARIS', language: 'FRENCH', briefing: 'Votre briefing est prêt', offset: 120 },
];

export const cityTime = (city: City) => localTime(city.offset);

export type Chapter = 'intro' | 'cities' | 'finale';

export type Beat = {
  id: string;
  chapter: Chapter;
  label: string;

  /** The video key this beat parks on. Absent for poster-only beats. */
  clip?: string;
  /** The source second the film rests at. */
  park: number;

  /**
   * The footage played to arrive here, going forward. Absent on the first
   * beat, which is simply where the film opens.
   */
  enter?: { from: number; to: number; rate: number };

  /**
   * Published to `holdData.clipIndex` while parked, so the presentation
   * overlays know they are on screen. -1 means no overlay.
   */
  hold?: number;

  /**
   * Scroll steps consumed inside this beat before the film advances — the
   * boardroom's four slides. Each step fires `rechitta:beat-step`.
   */
  steps?: number;

  /**
   * Forward motion needs an explicit release, not a scroll: the broker and the
   * buyer both end on a call to action. Scrolling nudges instead of advancing,
   * up to NUDGE_LIMIT times.
   */
  gate?: boolean;

  /**
   * Fired before a forward move, to let an overlay play its own hand-off
   * choreography. The film waits for `rechitta:release`, or RELEASE_TIMEOUT_MS.
   */
  release?: string;

  /** Chapter change into this beat crosses a white flash. */
  flash?: boolean;

  /** Index into CITIES, for the multilingual chapter. */
  city?: number;

  /**
   * Explicit progress, for beats whose clip is outside the measured intro
   * timing. `progressFrom` is where the transition into the beat starts.
   */
  progress?: number;
  progressFrom?: number;
};

const cityProgress = (i: number) =>
  CITIES_SPAN.start + (i / (CITIES.length - 1)) * (CITIES_SPAN.end - CITIES_SPAN.start);

export const BEATS: Beat[] = [
  {
    id: 'hero',
    chapter: 'intro',
    label: 'I · Dawn',
    clip: 'scene1-3',
    park: 2.0,
  },
  {
    id: 'boardroom',
    chapter: 'intro',
    label: 'II · The boardroom',
    clip: 'scene1-3',
    park: 11.0,
    enter: { from: 2.0, to: 11.0, rate: 2.4 },
    hold: 0,
    steps: 4,
    release: 'rechitta:boardroom-upload',
  },
  {
    id: 'broker',
    chapter: 'intro',
    label: 'III · The broker',
    clip: 'transit-b',
    park: 16.9,
    enter: { from: 2.0, to: 16.9, rate: 3.6 },
    hold: 1,
    gate: true,
  },
  {
    id: 'buyer',
    chapter: 'intro',
    label: 'IV · The buyer',
    clip: 'transit-c',
    park: 6.8,
    enter: { from: 0, to: 6.8, rate: 2.4 },
    hold: 2,
    gate: true,
  },
  /*
   * The flight out of the buyer's phone into the clouds used to be a beat of
   * its own, so the film parked on a white frame and sat there until the
   * viewer scrolled again. It is a transition, not a destination: the footage
   * now plays as the way into Mumbai and the chapter turns over at the end of
   * it, in one move.
   */
  ...CITIES.map((city, i) => ({
    id: `city-${city.key}`,
    chapter: 'cities' as const,
    label: `V · ${city.label}`,
    park: 0,
    city: i,
    flash: i === 0,
    ...(i === 0
      ? { clip: 'transit-d', enter: { from: 0, to: 6.0, rate: 2.4 } }
      : null),
    progress: cityProgress(i),
    progressFrom: i === 0 ? INTRO_SPAN.end : cityProgress(i - 1),
  })),
  {
    id: 'finale-screen',
    chapter: 'finale',
    label: 'VI · Presentation',
    clip: 'last',
    park: 1.0,
    progress: 0.96,
    progressFrom: CITIES_SPAN.end,
  },
  {
    id: 'finale',
    chapter: 'finale',
    label: 'VII · Horizon',
    clip: 'last',
    park: 11.0,
    enter: { from: 1.0, to: 11.0, rate: 2.5 },
    flash: false,
    progress: FINALE_SPAN.end,
    progressFrom: 0.96,
  },
];

export const beatIndexById = (id: string) => BEATS.findIndex((b) => b.id === id);

/**
 * Clips the visitor meets before the boardroom. These block the loader; every
 * other clip streams in afterwards, in beat order, one at a time.
 */
export const EAGER_CLIPS = [{ key: 'scene1-3', from: 2, to: 11 }];

/** Fetched in this order once the loader is gone. */
export const LAZY_CLIPS = [
  { key: 'transit-b', from: 2, to: 17 },
  { key: 'transit-c', from: 0, to: 6.8 },
  { key: 'transit-d', from: 0, to: 6.0 },
  { key: 'last', from: 1.0, to: 11.0 },
];
