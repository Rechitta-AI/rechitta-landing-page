import { beforeEach, describe, expect, it } from 'vitest';
import { clearHolds, isHeld, setHold } from './holds';

describe('beat holds', () => {
  beforeEach(clearHolds);

  it('holds nothing to begin with', () => {
    expect(isHeld('boardroom')).toBe(false);
  });

  it('remembers a hold set before anyone asks', () => {
    // The point of the store: the overlay writes on mount, the stage reads
    // later, and nothing is lost in between.
    setHold('boardroom', true);
    expect(isHeld('boardroom')).toBe(true);
  });

  it('releases', () => {
    setHold('boardroom', true);
    setHold('boardroom', false);
    expect(isHeld('boardroom')).toBe(false);
  });

  it('keeps beats apart', () => {
    setHold('boardroom', true);
    expect(isHeld('broker')).toBe(false);
  });
});
