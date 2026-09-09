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

  it('exports 3 concise problem statement items with verified solutions', () => {
    expect(BROKER_PROBLEMS).toHaveLength(3);

    const [prob1, prob2, prob3] = BROKER_PROBLEMS;

    // Item 1: Network scale
    expect(prob1.id).toBe(1);
    expect(prob1.tabLabel).toBe('40k at Launch');
    expect(prob1.category).toBe('NETWORK SCALE');
    expect(prob1.solution).toContain('Autonomous multi-agent briefing across 12 languages');

    // Item 2: Live Inventory
    expect(prob2.id).toBe(2);
    expect(prob2.tabLabel).toBe('Live DLD Sync');
    expect(prob2.category).toBe('LIVE INVENTORY');
    expect(prob2.solution).toContain('Direct DLD & ERP sync');

    // Item 3: Legal & SPV
    expect(prob3.id).toBe(3);
    expect(prob3.tabLabel).toBe('Cross-Border SPVs');
    expect(prob3.category).toBe('LEGAL & COMPLIANCE');
    expect(prob3.solution).toContain('Instant DLD compliance check');
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
