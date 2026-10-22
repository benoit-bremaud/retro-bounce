import { describe, expect, it } from 'vitest';
import { computeViewport, toLogicalX } from '../../src/adapters/viewport';

describe('computeViewport', () => {
  it('uses an integer scale on a desktop window and letterboxes', () => {
    const view = computeViewport(1920, 1080, 1);
    expect(view.scale).toBe(1);
    expect(view.deviceWidth).toBe(360);
    expect(view.deviceHeight).toBe(640);
    const tall = computeViewport(1920, 1400, 1);
    expect(tall.scale).toBe(2);
    expect(tall.deviceHeight).toBe(1280);
  });

  it('is limited by the width on a phone in portrait', () => {
    const view = computeViewport(390, 844, 3);
    expect(view.scale).toBe(3);
    expect(view.cssWidth).toBeCloseTo(360);
    const small = computeViewport(320, 568, 1);
    expect(small.scale).toBeCloseTo(320 / 360);
  });

  it('keeps the portrait field in landscape, limited by the height', () => {
    const view = computeViewport(844, 390, 1);
    expect(view.scale).toBeCloseTo(390 / 640);
    expect(view.deviceHeight).toBeLessThanOrEqual(390);
  });

  it('rotating swaps the limiting side without exceeding the window', () => {
    for (const [w, h] of [
      [390, 844],
      [844, 390],
      [768, 1024],
      [1024, 768],
    ] as const) {
      const view = computeViewport(w, h, 2);
      expect(view.cssWidth).toBeLessThanOrEqual(w);
      expect(view.cssHeight).toBeLessThanOrEqual(h);
    }
  });

  it('never returns a negative scale for an empty window', () => {
    expect(computeViewport(0, 0, 1).scale).toBe(0);
  });
});

describe('toLogicalX', () => {
  it('maps the canvas width to the logical width and clamps', () => {
    expect(toLogicalX(50, 100)).toBe(180);
    expect(toLogicalX(-10, 100)).toBe(0);
    expect(toLogicalX(500, 100)).toBe(360);
  });

  it('falls back to the centre for a zero-width canvas', () => {
    expect(toLogicalX(5, 0)).toBe(180);
  });
});
