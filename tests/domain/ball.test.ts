import { describe, expect, it } from 'vitest';
import { BALL_BASE_SPEED, BALL_MAX_SPEED, ballSpeedForLevel } from '../../src/domain/ball';

describe('ball', () => {
  it('speeds up by 5 % of the base speed per level', () => {
    expect(ballSpeedForLevel(1)).toBe(BALL_BASE_SPEED);
    expect(ballSpeedForLevel(5)).toBeCloseTo(BALL_BASE_SPEED * 1.2);
  });

  it('is capped at 480', () => {
    expect(ballSpeedForLevel(100)).toBe(BALL_MAX_SPEED);
  });
});
