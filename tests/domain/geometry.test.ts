import { describe, expect, it } from 'vitest';
import { createHit, sweepCircleRect, type Rect } from '../../src/domain/geometry';

const RECT: Rect = { left: 100, top: 100, width: 40, height: 20 };
const R = 5;

function sweep(cx: number, cy: number, dx: number, dy: number, rect: Rect = RECT) {
  const hit = createHit();
  const found = sweepCircleRect(cx, cy, R, dx, dy, rect, hit);
  return { found, hit };
}

describe('sweepCircleRect faces', () => {
  it.each([
    ['top', 120, 80, 0, 40, 0.375, 0, -1],
    ['bottom', 120, 150, 0, -40, 0.625, 0, 1],
    ['left', 80, 110, 40, 0, 0.375, -1, 0],
    ['right', 160, 110, -40, 0, 0.375, 1, 0],
  ])('hits the %s face', (_name, cx, cy, dx, dy, t, nx, ny) => {
    const { found, hit } = sweep(cx, cy, dx, dy);
    expect(found).toBe(true);
    expect(hit.t).toBeCloseTo(t);
    expect(hit.nx).toBe(nx);
    expect(hit.ny).toBe(ny);
  });

  it('misses when the move stops short, passes beside or points away', () => {
    expect(sweep(120, 80, 0, 10).found).toBe(false);
    expect(sweep(60, 80, 0, 100).found).toBe(false);
    expect(sweep(120, 80, 0, -40).found).toBe(false);
    expect(sweep(120, 80, 0, 0).found).toBe(false);
    expect(sweep(60, 110, 10, 0).found).toBe(false);
    expect(sweep(80, 60, 40, 0).found).toBe(false);
  });

  it('does not tunnel through a thin rectangle at a huge speed', () => {
    const thin: Rect = { left: 100, top: 100, width: 40, height: 1 };
    const { found, hit } = sweep(120, 0, 0, 400, thin);
    expect(found).toBe(true);
    expect(hit.ny).toBe(-1);
    expect(hit.t).toBeCloseTo(95 / 400);
  });

  it('does not hit a face the circle only slides along', () => {
    expect(sweep(80, 95, 40, 0).found).toBe(false);
    expect(sweep(100, 60, 30, 40).found).toBe(true);
  });

  it('hits a diagonal move on a face', () => {
    const { found, hit } = sweep(110, 80, 10, 40);
    expect(found).toBe(true);
    expect(hit.ny).toBe(-1);
  });
});

describe('sweepCircleRect corners', () => {
  it('bounces on a corner with a diagonal normal', () => {
    const { found, hit } = sweep(90, 90, 20, 20);
    expect(found).toBe(true);
    expect(hit.nx).toBeLessThan(0);
    expect(hit.ny).toBeLessThan(0);
    expect(Math.hypot(hit.nx, hit.ny)).toBeCloseTo(1);
    expect(hit.t).toBeGreaterThan(0);
    expect(hit.t).toBeLessThan(0.5);
  });

  it('grazes past a corner without a hit', () => {
    expect(sweep(80, 80, 40, 0).found).toBe(false);
    // Enters the grown box near its corner but passes more than a radius from the corner point.
    expect(sweep(85, 106, 30, -30).found).toBe(false);
  });

  it('hits the other three corners', () => {
    expect(sweep(150, 90, -20, 20).hit.nx).toBeGreaterThan(0);
    expect(sweep(90, 130, 20, -20).hit.ny).toBeGreaterThan(0);
    expect(sweep(150, 130, -20, -20).hit.ny).toBeGreaterThan(0);
  });
});

describe('sweepCircleRect already touching', () => {
  it('reports an immediate hit when moving into the rectangle', () => {
    const { found, hit } = sweep(120, 96, 0, 5);
    expect(found).toBe(true);
    expect(hit.t).toBe(0);
    expect(hit.ny).toBe(-1);
  });

  it('ignores a circle moving away from the rectangle', () => {
    expect(sweep(120, 96, 0, -5).found).toBe(false);
    expect(sweep(120, 95, 0, -5).found).toBe(false);
  });

  it('pushes a circle whose centre is inside through the nearest face', () => {
    expect(sweep(120, 102, 0, 5).hit.ny).toBe(-1);
    expect(sweep(120, 118, 0, -5).hit.ny).toBe(1);
    expect(sweep(102, 110, 5, 0).hit.nx).toBe(-1);
    expect(sweep(138, 110, -5, 0).hit.nx).toBe(1);
  });
});
