/**
 * Beats an overlay is holding the film on.
 *
 * The boardroom's last slide asks a question, and the film must not move past
 * it unanswered. That was first wired as an event, which lost the very first
 * message: the overlay mounts before the stage does, so it announced the hold
 * into a room with nobody listening and the film walked straight past.
 *
 * A store has no such ordering to get wrong. The overlay writes whenever its
 * state changes; the stage reads at the moment it is about to move.
 */

const held = new Set<string>();

export function setHold(beatId: string, isHeld: boolean): void {
  if (isHeld) held.add(beatId);
  else held.delete(beatId);
}

export function isHeld(beatId: string): boolean {
  return held.has(beatId);
}

/** Every hold, for tests and teardown. */
export function clearHolds(): void {
  held.clear();
}
