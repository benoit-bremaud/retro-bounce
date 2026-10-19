import { describe, expect, it } from 'vitest';
import { createBall } from '../../src/domain/ball';
import { createBrick } from '../../src/domain/brick';
import { createStepResult, moveBall } from '../../src/domain/collision';
import { createPaddle } from '../../src/domain/paddle';

function fly(
  ball: ReturnType<typeof createBall>,
  bricks: ReturnType<typeof createBrick>[],
  dt: number,
  piercing: boolean,
) {
  const result = createStepResult();
  moveBall(ball, dt, bricks, createPaddle(), result, piercing);
  return result;
}

describe('piercing ball', () => {
  it('crosses a strong brick, destroying it in one pass without bouncing', () => {
    const ball = createBall(18, 40, 0, -300);
    const brick = createBrick('strong', 0, 1);
    const result = fly(ball, [brick], 0.1, true);
    expect(brick.alive).toBe(false);
    expect(result).toMatchObject({ brokenCount: 1, points: 20 });
    expect(ball.vy).toBe(-300);
  });

  it('crosses several bricks in one step', () => {
    const ball = createBall(18, 40, 0, -300);
    const bricks = [createBrick('normal', 0, 1), createBrick('normal', 0, 0)];
    const result = fly(ball, bricks, 0.1, true);
    expect(result).toMatchObject({ brokenCount: 2, points: 20 });
    expect(ball.vy).toBe(-300);
  });

  it('still bounces on an unbreakable brick', () => {
    const ball = createBall(18, 40, 0, -300);
    const brick = createBrick('unbreakable', 0, 1);
    const result = fly(ball, [brick], 0.1, true);
    expect(brick.alive).toBe(true);
    expect(result.brokenCount).toBe(0);
    expect(ball.vy).toBeGreaterThan(0);
  });

  it('bounces on a brick it only damages when not piercing', () => {
    const ball = createBall(18, 40, 0, -300);
    const brick = createBrick('strong', 0, 1);
    fly(ball, [brick], 0.1, false);
    expect(brick.alive).toBe(true);
    expect(ball.vy).toBeGreaterThan(0);
  });
});
