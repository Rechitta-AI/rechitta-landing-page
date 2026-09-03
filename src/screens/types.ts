/** A point in normalised video-frame space, 0..1. */
export type Corner = [number, number];

/** Four corners: top-left, top-right, bottom-right, bottom-left. */
export type Quad = [Corner, Corner, Corner, Corner];

export type TrackSample = { t: number; corners: Quad | number[][] };

/**
 * One continuous appearance of a phone screen in one clip, and what belongs
 * on it.
 */
export type ScreenTrack = {
  clip: string;
  /** Clip-time window, in seconds of source. */
  from: number;
  to: number;
  /** Public path of the app screen to composite in. */
  image: string;
  samples: TrackSample[];
};

/** Where the film's playhead is right now, published by ScrollFilm. */
export type Playhead = { clip: string; t: number };

export type Rect = { x: number; y: number; width: number; height: number };
