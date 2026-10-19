/** Ball radius in game units. */
export const BALL_RADIUS = 5;
/** Ball speed at level 1, in game units per second. */
export const BALL_BASE_SPEED = 300;
/** Ball speed cap, in game units per second. */
export const BALL_MAX_SPEED = 480;

/** The ball: centre position and velocity in game units (per second for the velocity). */
export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Creates a ball at (x, y) with velocity (vx, vy), in game units per second. */
export function createBall(x: number, y: number, vx: number, vy: number): Ball {
  return { x, y, vx, vy };
}

/** Ball speed for a level (1-based): +5 % of the base speed per level, capped. */
export function ballSpeedForLevel(level: number): number {
  return Math.min(BALL_BASE_SPEED * (1 + 0.05 * (level - 1)), BALL_MAX_SPEED);
}
