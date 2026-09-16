/**
 * Types shared between the film (which measures time) and the orb (which flies
 * against it).
 */

/** One clip's slice of the film's internal timeline, as measured at runtime. */
export type ClipTiming = {
  key: string;
  /** Seconds of source trimmed off the head. */
  trimIn: number;
  /** Seconds of source the clip plays until. */
  trimOut: number;
  /** Playable length, `trimOut - trimIn`. */
  duration: number;
  /** Extra scroll the clip holds on its last frame — the presentation pause. */
  holdWeight: number;
  /** Where this clip starts on the film's unit timeline. */
  offsetUnits: number;
};

/**
 * The whole film's timing. Durations come from video metadata, so this is only
 * populated once the clips have loaded — and it can be revised afterwards.
 */
export type FilmTiming = {
  clips: ClipTiming[];
  /** Sum of every clip's duration plus hold weight. */
  totalUnits: number;
  /** The film's slice of global scroll progress. */
  startProgress: number;
  endProgress: number;
};

/**
 * Where a keyframe sits. Clip anchors are preferred: they survive a retrim,
 * because they resolve through the same measured durations the film scrubs on.
 * Raw progress is for chapters with no scrubbed clip to key against.
 */
export type Anchor = { clip: string; t: number } | { progress: number };

export type EaseName = 'linear' | 'in' | 'out' | 'inOut';

/** Everything the renderer needs to draw the orb for one moment. */
export type Pose = {
  /** Viewport percent. */
  x: number;
  y: number;
  scale: number;
  opacity: number;
  /** Depth softening, px. */
  blur: number;
};

export type Keyframe = Pose & {
  anchor: Anchor;
  ease: EaseName;
  /** A hand-off beat: the orb flares and a mockup wakes. */
  pulse?: boolean;
  /**
   * Where the orb sits on a portrait screen, when that differs.
   *
   * The path is authored against the 16:9 frame. On a portrait viewport the
   * overlays lay themselves out flat instead of tracking the footage, so some
   * beats that are clear of a mockup on a wide screen land straight on it.
   * Only the fields given are replaced.
   */
  portrait?: Partial<Pick<Pose, 'x' | 'y' | 'scale'>>;
  /**
   * Pose is taken from the measured `#hero-o-anchor` instead of x/y/scale
   * above. The hero and the finale share it, which is what hides the loop.
   */
  hero?: true;
  /**
   * Portrait pose is taken from the measured `#multilingual-dock-anchor`
   * at the bottom center of the phone mockup.
   */
  dock?: true;
  /**
   * Pose is taken from the measured `#finale-dock-anchor` below all content
   * in the finale presentation scene.
   */
  finaleDock?: true;
  /**
   * Landscape desktop pose is taken from the measured `#broker-orb-anchor`,
   * above the broker scene's answer column.
   */
  brokerDock?: true;
  /** What this beat is, for the dev overlay and for anyone reading the path. */
  note: string;
};

export type ResolvedKeyframe = Keyframe & { progress: number };

/** A rectangle the orb must never enter, in viewport percent. */
export type Rect = { x0: number; y0: number; x1: number; y1: number };

/**
 * A surface that will hold an app mockup. Scoped to the window in which that
 * surface is actually on screen.
 */
export type ExclusionZone = {
  window: { clip: string; from: number; to: number } | { from: number; to: number };
  rect: Rect;
  label: string;
};

export type Violation = { keyframeIndex: number; note: string; zoneLabel: string };
