import { describe, expect, it } from 'vitest';
import {
  MAX_BALLS,
  SPLIT_ANGLE,
  createBallPool,
  removeBall,
  resetBalls,
  splitBalls,
} from '../../src/domain/balls';

function poolWith(count: number) {
  const pool = createBallPool();
  resetBalls(pool, 100, 200, 0, -300);
  for (let i = 1; i < count; i++) {
    const ball = pool.items[i];
    if (ball) Object.assign(ball, { x: 100 + i, y: 200, vx: 0, vy: -300 });
  }
  pool.count = count;
  return pool;
}

describe('ball pool', () => {
  it('preallocates every slot and starts empty', () => {
    const pool = createBallPool();
    expect(pool.items).toHaveLength(MAX_BALLS);
    expect(pool.count).toBe(0);
  });

  it('resets to a single ball with the given state', () => {
    const pool = poolWith(4);
    const ball = resetBalls(pool, 10, 20, 30, 40);
    expect(pool.count).toBe(1);
    expect(ball).toBe(pool.items[0]);
    expect(ball).toMatchObject({ x: 10, y: 20, vx: 30, vy: 40 });
  });

  it('removes a ball by moving the last one into its slot', () => {
    const pool = poolWith(3);
    removeBall(pool, 0);
    expect(pool.count).toBe(2);
    expect(pool.items[0]?.x).toBe(102);
    expect(pool.items[1]?.x).toBe(101);
  });

  it('ignores a removal outside the pool', () => {
    const empty = createBallPool();
    removeBall(empty, 0);
    expect(empty.count).toBe(0);
    const pool = poolWith(1);
    removeBall(pool, MAX_BALLS + 3);
    expect(pool.count).toBe(1);
  });
});

describe('splitBalls', () => {
  it('turns one ball into three at ±20° with the same speed', () => {
    const pool = poolWith(1);
    splitBalls(pool);
    expect(pool.count).toBe(3);
    for (let i = 0; i < 3; i++) {
      const ball = pool.items[i];
      expect(Math.hypot(ball?.vx ?? 0, ball?.vy ?? 0)).toBeCloseTo(300);
      expect(ball?.y).toBe(200);
    }
    const angles = [1, 2].map((i) => Math.atan2(pool.items[i]?.vx ?? 0, -(pool.items[i]?.vy ?? 0)));
    expect(angles[0]).toBeCloseTo(-SPLIT_ANGLE);
    expect(angles[1]).toBeCloseTo(SPLIT_ANGLE);
  });

  it('caps the pool at the maximum', () => {
    const pool = poolWith(3);
    splitBalls(pool);
    expect(pool.count).toBe(MAX_BALLS);
    splitBalls(pool);
    expect(pool.count).toBe(MAX_BALLS);
  });
});
