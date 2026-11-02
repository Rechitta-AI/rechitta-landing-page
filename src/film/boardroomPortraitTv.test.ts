import { describe, expect, it } from 'vitest';
import { portraitTvTopYPercent, portraitTvVideoPush, portraitTvZoom } from './boardroomPortraitTv';

describe('portrait TV geometry', () => {
  it('computes a top-Y inside the viewport for a typical phone', () => {
    const y = portraitTvTopYPercent(390, 844); // iPhone 12/13/14-ish
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(100);
  });

  it('never returns more than the nominal zoom', () => {
    expect(portraitTvZoom(1920, 1080, 1.2)).toBeLessThanOrEqual(1.2);
    expect(portraitTvZoom(320, 568, 1.2)).toBeLessThanOrEqual(1.2);
    expect(portraitTvZoom(400, 500, 1.2)).toBeLessThanOrEqual(1.2);
  });

  it('clamps down on an ultra-narrow phone (side-margin case)', () => {
    const z = portraitTvZoom(320, 568, 1.2); // iPhone SE (1st gen)-ish
    expect(z).toBeLessThan(1.2);
    expect(z).toBeGreaterThan(1.0);
  });

  it('clamps down on a short-but-wide portrait viewport (vertical-room case)', () => {
    const z = portraitTvZoom(400, 500, 1.2);
    expect(z).toBeLessThan(1.2);
    expect(z).toBeGreaterThan(1.0);
  });

  it('applies the full nominal zoom on a generously sized viewport', () => {
    // 500x700: wide and tall enough that neither the side-margin nor the
    // vertical-room clamp binds. Note a tall-and-narrow phone (e.g. an
    // iPhone Pro Max at 430x932) is *not* a good "generous" example here —
    // its aspect is narrower than 9:16, so coverRect's cover-crop makes
    // `rect.width` exceed the real viewport width, and the (pre-existing,
    // unrelated to this fix) side-margin formula binds below 1.2 there too.
    const z = portraitTvZoom(500, 700, 1.2);
    expect(z).toBeCloseTo(1.2, 5);
  });

  it('never returns less than 1.0, even on an extremely cramped viewport', () => {
    const z = portraitTvZoom(400, 420, 1.2);
    expect(z).toBeGreaterThanOrEqual(1.0);
  });

  it('can legitimately dip just under 1.0 on an ordinary tall phone — intended for containScale, not a bug', () => {
    // iPhone 12/13/14-class: taller/narrower than 9:16, so the un-cropped
    // cover-rect is wider than the real viewport and the 14px-margin term
    // alone lands just below 1. This is the pre-existing, correct shrink
    // behavior for the HTML overlay's containScale.
    const z = portraitTvZoom(390, 844, 1.2);
    expect(z).toBeLessThan(1.0);
    expect(z).toBeGreaterThan(0.95);
  });

  it('clamps down further at 1024x860 to protect the orb\'s real rendered footprint, not just its anchor point', () => {
    // Regression test: this exact viewport (a desktop window resized
    // narrow-and-short, classified portrait since 1024/860 < 1.25) reported
    // the fallen brand strip overlapping the orb when ORB_CLEARANCE was only
    // a gap to the orb's anchor *point* (16px) rather than its actual
    // rendered edge (core + glow). The fix tightens this clamp below its
    // previous ~1.11 value.
    const z = portraitTvZoom(1024, 860, 1.2);
    expect(z).toBeLessThan(1.1);
    expect(z).toBeGreaterThan(1.0);
  });
});

describe('portraitTvVideoPush', () => {
  it('floors at 1.0 on the exact viewport where portraitTvZoom dips below it', () => {
    // Regression test: applying portraitTvZoom's raw (sub-1.0) output as the
    // video element's CSS scale shrinks it below its native full-bleed size,
    // revealing the container's background behind it as a visible black
    // border — seen on this exact class of device.
    expect(portraitTvZoom(390, 844, 1.2)).toBeLessThan(1.0);
    expect(portraitTvVideoPush(390, 844, 1.2)).toBe(1.0);
  });

  it('still applies a genuine zoom-in on a generously sized viewport', () => {
    expect(portraitTvVideoPush(500, 700, 1.2)).toBeCloseTo(1.2, 5);
  });

  it('never returns less than 1.0 for any viewport', () => {
    const viewports: Array<[number, number]> = [
      [320, 568],
      [390, 844],
      [430, 932],
      [412, 915],
      [360, 780],
      [400, 420],
      [400, 500],
      [500, 700],
      [768, 1024],
    ];
    for (const [w, h] of viewports) {
      expect(portraitTvVideoPush(w, h, 1.2)).toBeGreaterThanOrEqual(1.0);
    }
  });
});
