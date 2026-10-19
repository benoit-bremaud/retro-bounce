import { createBall, type Ball } from './ball';

/** Most balls in play at once (multi-ball cap). */
export const MAX_BALLS = 6;
/** Angle between a ball and each of its two new copies when multi-ball triggers, in radians (20°). */
export const SPLIT_ANGLE = Math.PI / 9;

/**
 * Fixed-capacity set of balls: only the first `count` entries of `items` are in play; slots at or
 * after `count` hold stale balls that are never read.
 */
export interface BallPool {
  items: Ball[];
  count: number;
}

/** Creates a pool with every slot preallocated, so the game loop never allocates a ball. */
export function createBallPool(): BallPool {
  const items: Ball[] = [];
  for (let i = 0; i < MAX_BALLS; i++) items.push(createBall(0, 0, 0, 0));
  return { items, count: 0 };
}

/** Puts the pool back to one ball at (x, y) with velocity (vx, vy). */
export function resetBalls(pool: BallPool, x: number, y: number, vx: number, vy: number): void {
  const ball = pool.items[0];
  if (ball === undefined) return;
  pool.count = 1;
  ball.x = x;
  ball.y = y;
  ball.vx = vx;
  ball.vy = vy;
}

/** Removes the ball at `index` by moving the last one into its slot (order is not kept). */
export function removeBall(pool: BallPool, index: number): void {
  const last = pool.items[pool.count - 1];
  const removed = pool.items[index];
  if (last === undefined || removed === undefined) return;
  pool.items[index] = last;
  pool.items[pool.count - 1] = removed;
  pool.count -= 1;
}

function addRotatedCopy(pool: BallPool, from: Ball, angle: number): void {
  const slot = pool.items[pool.count];
  if (slot === undefined) return;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  slot.x = from.x;
  slot.y = from.y;
  slot.vx = from.vx * cos - from.vy * sin;
  slot.vy = from.vx * sin + from.vy * cos;
  pool.count += 1;
}

/**
 * Multi-ball: each ball in play gets two copies at ±{@link SPLIT_ANGLE} from its direction, same
 * speed, until the pool holds {@link MAX_BALLS}. Balls earlier in the pool are split first.
 */
export function splitBalls(pool: BallPool): void {
  const original = pool.count;
  for (let i = 0; i < original; i++) {
    const ball = pool.items[i];
    if (ball === undefined) continue;
    addRotatedCopy(pool, ball, -SPLIT_ANGLE);
    addRotatedCopy(pool, ball, SPLIT_ANGLE);
  }
}
