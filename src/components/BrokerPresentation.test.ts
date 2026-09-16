import { describe, it, expect } from 'vitest';
import {
  BROKER_PHONE_CORNERS,
  BROKER_PHONE_RADIUS,
  BROKER_PROBLEMS,
  PROMPT_PILLS,
  stageHeightFor,
} from './BrokerPresentation';

describe('BrokerPresentation Configuration & Data', () => {
  it('exports calibrated phone quad corners with 4 points', () => {
    expect(BROKER_PHONE_CORNERS).toHaveLength(4);
    expect(BROKER_PHONE_CORNERS[0]).toEqual([0.43230, 0.12300]);
    expect(BROKER_PHONE_CORNERS[1]).toEqual([0.61751, 0.13814]);
    expect(BROKER_PHONE_CORNERS[2]).toEqual([0.58984, 0.89882]);
    expect(BROKER_PHONE_CORNERS[3]).toEqual([0.36724, 0.85839]);
    expect(BROKER_PHONE_RADIUS).toBe(48);
  });

  it("exports the broker's four one-line objections with their answers", () => {
    expect(BROKER_PROBLEMS).toHaveLength(4);

    const [prob1, prob2, prob3, prob4] = BROKER_PROBLEMS;

    // 1: a briefing missed
    expect(prob1.id).toBe(1);
    expect(prob1.problem).toBe('Missed a briefing!');
    expect(prob1.category).toBe('AVAILABLE 24/7');
    expect(prob1.solution).toContain('presentation mode');
    expect(prob1.solution).toContain('24/7');

    // 2: the presenter's accent
    expect(prob2.id).toBe(2);
    expect(prob2.problem).toContain('accent');
    expect(prob2.category).toBe('YOUR LANGUAGE');
    expect(prob2.solution).toContain('Ask in your language');

    // 3: technical depth
    expect(prob3.id).toBe(3);
    expect(prob3.problem).toContain('technical questions');
    expect(prob3.category).toBe('GO DEEPER');
    expect(prob3.solution).toContain('chat mode');

    // 4: the one that ends in a sign-up rather than a feature
    expect(prob4.id).toBe(4);
    expect(prob4.problem).toContain('client');
    expect(prob4.category).toBe('YOUR OWN RECHITTA');
    expect(prob4.solution).toContain('Rechitta of your own');
    expect(prob4.isWaitlist).toBe(true);
  });

  it('marks only the last objection as the waitlist one', () => {
    expect(BROKER_PROBLEMS.filter((p) => p.isWaitlist)).toHaveLength(1);
    expect(BROKER_PROBLEMS[BROKER_PROBLEMS.length - 1].isWaitlist).toBe(true);
  });

  it('gives every objection a one-line statement and a sample query', () => {
    BROKER_PROBLEMS.forEach((prob) => {
      expect(prob.problem.length).toBeLessThanOrEqual(50);
      expect(prob.query.length).toBeGreaterThan(0);
      expect(prob.tabLabel.length).toBeGreaterThan(0);
    });
  });

  it('aliases PROMPT_PILLS to BROKER_PROBLEMS for backwards compatibility', () => {
    expect(PROMPT_PILLS).toBe(BROKER_PROBLEMS);
  });

  it('fits the handset and still leaves the panel its room, at every phone height', async () => {
    const { isPortraitFor } = await import('@/hooks/useDeviceMode');

    // The handset's foot, the chapter rail and the panel below it. These are
    // the numbers the height is solved against; if they drift, so must it.
    const PHONE_FOOT = BROKER_PHONE_CORNERS[2][1];
    const RAIL_RESERVE = 78;
    const PANEL_MIN = 216;

    // iPhone SE through Pro Max, and a short landscape-ish portrait for luck.
    [568, 667, 664, 736, 844, 852, 932].forEach((height) => {
      expect(isPortraitFor(390, height)).toBe(true);
      const stage = stageHeightFor(height);

      // The stage never eats the screen, however tall the screen is.
      expect(stage).toBeLessThanOrEqual(height * 0.73);

      // Whatever is left under the handset's foot has to hold the panel and
      // the rail. This is the whole point of the sum.
      const belowFoot = height - stage * PHONE_FOOT;
      expect(belowFoot).toBeGreaterThanOrEqual(RAIL_RESERVE + PANEL_MIN);
    });
  });

  it('projects the phone inside the stage it reports, so the live screen sits in the handset', async () => {
    const { coverRect, toViewport, matrix3dFor } = await import('@/screens/warp');

    const viewport = { width: 390, height: 844 };
    const stageHeight = stageHeightFor(viewport.height);
    expect(stageHeight).toBe(603);

    const rect = coverRect(viewport.width, stageHeight);
    expect(rect.height).toBe(stageHeight);
    expect(rect.y).toBe(0);

    const viewportCorners = toViewport(BROKER_PHONE_CORNERS, rect);

    // Every corner lands inside the stage the host is actually given.
    viewportCorners.forEach(([, y]) => {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(stageHeight);
    });

    const matrix = matrix3dFor(390, 844, viewportCorners);
    expect(matrix).toMatch(/^matrix3d\(/);

    // Centred horizontally on the viewport, not off in the cropped overscan.
    const [p0, p1, p2, p3] = viewportCorners;
    const phoneCx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4;
    expect(phoneCx).toBeGreaterThan(180);
    expect(phoneCx).toBeLessThan(210);
  });

  /*
   * The regression this file exists to hold.
   *
   * The resize handler used to carry its own copy of the sum, left over from a
   * taller panel: `min(h * 0.67, h - 235)`. It wrote that straight onto the
   * film stage while the overlay above kept projecting against the real one,
   * so the assistant slid off the handset by ~26px on every resize a phone
   * fires. There must be one answer per height, and `stageHeightFor` must be
   * the one giving it.
   */
  it('gives one stage height per viewport height, not two', () => {
    const stale = (h: number) => Math.round(Math.min(h * 0.67, h - 235));

    [568, 620, 664, 844].forEach((height) => {
      // Same input, same answer, however many times it is asked.
      expect(stageHeightFor(height)).toBe(stageHeightFor(height));
      // And it is no longer the height the old resize path was writing.
      expect(stageHeightFor(height)).not.toBe(stale(height));
    });

    // The exact seam that was reported: 390x664, stage snapping 403 -> 429.
    expect(stageHeightFor(664)).toBe(403);
    expect(stale(664)).toBe(429);
  });
});
