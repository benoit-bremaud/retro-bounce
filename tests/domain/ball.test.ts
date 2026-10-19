import { describe, expect, it } from 'vitest';
import {
  BALL_BASE_SPEED,
  BALL_MAX_SPEED,
  ballSpeedForLevel,
  createBall,
} from '../../src/domain/ball';

describe('ball', () => {
  it('creates a ball with its position and velocity', () => {
    expect(createBall(1, 2, 3, 4)).toEqual({ x: 1, y: 2, vx: 3, vy: 4 });
  });

  it('speeds up by 5 % of the base speed per level', () => {
    expect(ballSpeedForLevel(1)).toBe(BALL_BASE_SPEED);
    expect(ballSpeedForLevel(5)).toBeCloseTo(BALL_BASE_SPEED * 1.2);
  });

  it('is capped at 480', () => {
    expect(ballSpeedForLevel(100)).toBe(BALL_MAX_SPEED);
  });
});
