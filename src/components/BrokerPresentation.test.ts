import { describe, it, expect } from 'vitest';
import {
  BROKER_PHONE_CORNERS,
  BROKER_PHONE_RADIUS,
  BROKER_PROBLEMS,
  PROMPT_PILLS,
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

  it('maps broker phone corners completely inside the top 60% stage on mobile portrait', async () => {
    const { coverRect, toViewport, matrix3dFor } = await import('@/screens/warp');
    const { isPortraitFor } = await import('@/hooks/useDeviceMode');

    // Standard mobile portrait phone (iPhone 12/13/14/15/16)
    const viewport = { width: 390, height: 844 };
    const stacked = isPortraitFor(viewport.width, viewport.height);
    expect(stacked).toBe(true);

    const stageHeight = stacked ? viewport.height * 0.6 : viewport.height;
    expect(stageHeight).toBeCloseTo(506.4, 1);

    const rect = coverRect(viewport.width, stageHeight);
    expect(rect.height).toBeCloseTo(506.4, 1);
    // 506.4 * 16 / 9 = 900.27
    expect(rect.width).toBeCloseTo(900.27, 1);
    expect(rect.y).toBe(0);

    const viewportCorners = toViewport(BROKER_PHONE_CORNERS, rect);

    // Verify all 4 corners are inside the top 60% stage (0 <= y <= 506.4)
    viewportCorners.forEach(([x, y]) => {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(stageHeight);
    });

    // Top corners sit comfortably with headroom at y ≈ 61px - 72px
    expect(viewportCorners[0][1]).toBeGreaterThan(55);
    expect(viewportCorners[0][1]).toBeLessThan(75);

    // Bottom corners sit comfortably above the 506px horizon at y ≈ 434px - 455px
    expect(viewportCorners[2][1]).toBeGreaterThan(430);
    expect(viewportCorners[2][1]).toBeLessThan(465);

    // Check that matrix3d is valid and starts with matrix3d(
    const matrix = matrix3dFor(390, 844, viewportCorners);
    expect(matrix).toMatch(/^matrix3d\(/);

    // Verify 2D affine parameters
    const [p0, p1, p2, p3] = viewportCorners;
    const phoneCx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4;
    const phoneCy = (p0[1] + p1[1] + p2[1] + p3[1]) / 4;
    expect(phoneCx).toBeGreaterThan(180);
    expect(phoneCx).toBeLessThan(210); // Centered around 195px
    expect(phoneCy).toBeGreaterThan(240);
    expect(phoneCy).toBeLessThan(270); // Centered vertically in 506px stage
  });
});
