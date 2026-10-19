import { describe, expect, it } from 'vitest';
import { BALL_RADIUS, createBall } from '../../src/domain/ball';
import { createBrick, type Brick } from '../../src/domain/brick';
import { MAX_PADDLE_ANGLE, createStepResult, moveBall } from '../../src/domain/collision';
import { createPaddle, movePaddleTo } from '../../src/domain/paddle';

const DT = 1 / 60;

function run(
  ball: ReturnType<typeof createBall>,
  bricks: readonly Brick[] = [],
  paddle = createPaddle(),
  dt = DT,
) {
  const result = createStepResult();
  moveBall(ball, dt, bricks, paddle, result);
  return result;
}

describe('moveBall free flight and walls', () => {
  it('moves in a straight line when nothing is in the way', () => {
    const ball = createBall(100, 300, 60, -120);
    const result = run(ball);
    expect(ball.x).toBeCloseTo(101);
    expect(ball.y).toBeCloseTo(298);
    expect(result).toMatchObject({ points: 0, brokenCount: 0, paddleHit: false, lost: false });
  });

  it('bounces on the left wall', () => {
    const ball = createBall(7, 300, -300, 0);
    run(ball);
    expect(ball.vx).toBeCloseTo(300);
    expect(ball.x).toBeGreaterThanOrEqual(BALL_RADIUS);
  });

  it('bounces on the right wall', () => {
    const ball = createBall(353, 300, 300, 0);
    run(ball);
    expect(ball.vx).toBeCloseTo(-300);
    expect(ball.x).toBeLessThanOrEqual(360 - BALL_RADIUS);
  });

  it('bounces on the top wall', () => {
    const ball = createBall(180, 7, 0, -300);
    run(ball);
    expect(ball.vy).toBeCloseTo(300);
    expect(ball.y).toBeGreaterThanOrEqual(BALL_RADIUS);
  });

  it('bounces in the top-left corner of the field', () => {
    const ball = createBall(8, 8, -300, -300);
    run(ball);
    expect(ball.vx).toBeGreaterThan(0);
    expect(ball.vy).toBeGreaterThan(0);
  });

  it('is lost when it leaves through the open bottom', () => {
    const ball = createBall(10, 645, 0, 300);
    expect(run(ball).lost).toBe(true);
    expect(run(createBall(10, 630, 0, 300)).lost).toBe(false);
  });
});

describe('moveBall paddle', () => {
  function bounceAt(offsetFromCentre: number) {
    const paddle = createPaddle();
    const ball = createBall(paddle.x + offsetFromCentre, 590, 0, 300);
    const result = run(ball, [], paddle);
    return { ball, result };
  }

  it('sends the ball straight up from the centre', () => {
    const { ball, result } = bounceAt(0);
    expect(result.paddleHit).toBe(true);
    expect(ball.vx).toBeCloseTo(0);
    expect(ball.vy).toBeCloseTo(-300);
  });

  it('sends the ball 60 degrees right from the right edge', () => {
    const { ball } = bounceAt(32);
    expect(ball.vx).toBeCloseTo(300 * Math.sin(MAX_PADDLE_ANGLE));
    expect(ball.vy).toBeCloseTo(-300 * Math.cos(MAX_PADDLE_ANGLE));
  });

  it('sends the ball left from the left half and keeps its speed', () => {
    const { ball } = bounceAt(-16);
    expect(ball.vx).toBeLessThan(0);
    expect(Math.hypot(ball.vx, ball.vy)).toBeCloseTo(300);
  });

  it('never deflects more than 60 degrees, even on the paddle corner', () => {
    const { ball } = bounceAt(36);
    expect(-ball.vy).toBeGreaterThanOrEqual(0.35 * 300);
    expect(-ball.vy).toBeCloseTo(150);
    expect(ball.vx).toBeCloseTo(300 * Math.sin(MAX_PADDLE_ANGLE));
  });

  it('mirrors the ball when it hits the paddle side', () => {
    const paddle = createPaddle();
    const ball = createBall(paddle.x + 32 + 8, 600, -300, 0);
    const result = run(ball, [], paddle);
    expect(result.paddleHit).toBe(false);
    expect(ball.vx).toBeCloseTo(300);
    expect(ball.vy).toBeCloseTo(0);
  });

  it('uses the current paddle width', () => {
    const paddle = createPaddle();
    paddle.width = 96;
    movePaddleTo(paddle, 180);
    // Half of the wide half-width: a 64-wide paddle would clamp this hit to 60 degrees.
    const ball = createBall(180 + 24, 586, 0, 480);
    run(ball, [], paddle);
    expect(ball.vx).toBeCloseTo(480 * Math.sin(MAX_PADDLE_ANGLE / 2));
  });

  it('catches a ball that would skip the paddle in one long frame', () => {
    const ball = createBall(180, 560, 0, 480);
    expect(run(ball, [], createPaddle(), 0.1).paddleHit).toBe(true);
    expect(ball.vy).toBeLessThan(0);
  });

  it('lifts a falling ball onto a paddle that swiped into its side', () => {
    const paddle = createPaddle();
    const ball = createBall(paddle.x + 30, 598, 0, 300);
    const result = run(ball, [], paddle);
    expect(result.paddleHit).toBe(true);
    expect(ball.vy).toBeLessThan(0);
    expect(result.lost).toBe(false);
  });

  it('does not catch a ball that already passed below the paddle', () => {
    const ball = createBall(180, 620, 0, 300);
    expect(run(ball).paddleHit).toBe(false);
  });
});

describe('moveBall bricks', () => {
  it('destroys a normal brick and bounces', () => {
    const brick = createBrick('normal', 5, 5);
    const ball = createBall(198, 90, 0, -300);
    const result = run(ball, [brick]);
    expect(result.points).toBe(10);
    expect(result.brokenCount).toBe(1);
    expect(result.broken[0]).toBe(brick);
    expect(ball.vy).toBeCloseTo(300);
  });

  it('needs two hits for a strong brick', () => {
    const brick = createBrick('strong', 5, 5);
    const first = run(createBall(198, 90, 0, -300), [brick]);
    expect(first.points).toBe(0);
    expect(first.brokenCount).toBe(0);
    expect(brick.alive).toBe(true);
    const second = run(createBall(198, 90, 0, -300), [brick]);
    expect(second.points).toBe(20);
    expect(brick.alive).toBe(false);
  });

  it('bounces on an unbreakable brick without breaking it', () => {
    const brick = createBrick('unbreakable', 5, 5);
    const ball = createBall(198, 90, 0, -300);
    const result = run(ball, [brick]);
    expect(result.brokenCount).toBe(0);
    expect(brick.alive).toBe(true);
    expect(ball.vy).toBeCloseTo(300);
  });

  it('passes through destroyed bricks', () => {
    const brick = createBrick('normal', 5, 5);
    brick.alive = false;
    const ball = createBall(198, 90, 0, -300);
    run(ball, [brick]);
    expect(ball.vy).toBeCloseTo(-300);
  });

  it('slides over a row of bricks without breaking them', () => {
    const row = [0, 1, 2, 3].map((column) => createBrick('normal', column, 5));
    const ball = createBall(2, 75, 300, 0);
    for (let step = 0; step < 40; step++) run(ball, row);
    expect(row.every((brick) => brick.alive)).toBe(true);
  });

  it('does not hit a strong brick twice in a row on one bounce', () => {
    const brick = createBrick('strong', 5, 5);
    const ball = createBall(198, 90, 0, -300);
    run(ball, [brick]);
    run(ball, [brick]);
    expect(brick.hp).toBe(1);
    expect(brick.alive).toBe(true);
  });

  it('bounces diagonally on a brick corner', () => {
    const brick = createBrick('normal', 5, 5);
    const ball = createBall(176, 76, 120, 120);
    run(ball, [brick], createPaddle(), 0.05);
    expect(ball.vx).toBeCloseTo(-120);
    expect(ball.vy).toBeCloseTo(-120);
    expect(brick.alive).toBe(false);
  });

  it('hits only the nearer of two bricks on the way', () => {
    const far = createBrick('normal', 5, 3);
    const near = createBrick('normal', 5, 5);
    const ball = createBall(198, 120, 0, -300);
    const result = run(ball, [far, near], createPaddle(), 0.1);
    expect(result.broken[0]).toBe(near);
    expect(far.alive).toBe(true);
  });

  it('can break two bricks in one step', () => {
    const upper = createBrick('normal', 5, 3);
    const lower = createBrick('normal', 5, 5);
    const ball = createBall(198, 72, 0, -300);
    const result = run(ball, [upper, lower], createPaddle(), 0.1);
    expect(result.brokenCount).toBe(2);
    expect(result.points).toBe(20);
  });

  it('never crosses a brick wall in one long frame', () => {
    const bricks: Brick[] = [];
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 10; column++) {
        bricks.push(createBrick('unbreakable', column, row + 4));
      }
    }
    // The wall spans y 64 to 112; 48 units per step is wider than a brick plus the ball.
    const ball = createBall(180, 150, 120, -480);
    for (let step = 0; step < 100; step++) {
      run(ball, bricks, createPaddle(), 0.1);
      if (ball.y > 400) break;
      expect(ball.y).toBeGreaterThanOrEqual(112 + BALL_RADIUS - 1e-6);
    }
  });

  it('stays in a slot after a huge step with many bounces', () => {
    const bricks: Brick[] = [];
    for (let column = 0; column < 10; column++) {
      bricks.push(createBrick('unbreakable', column, 4), createBrick('unbreakable', column, 6));
    }
    const ball = createBall(180, 88, 200, 300);
    const result = run(ball, bricks, createPaddle(), 1);
    expect(result.lost).toBe(false);
    expect(ball.y).toBeGreaterThanOrEqual(85 - 1e-6);
    expect(ball.y).toBeLessThanOrEqual(91 + 1e-6);
  });
});

describe('moveBall determinism', () => {
  it('gives the same result for the same input', () => {
    const play = () => {
      const bricks = [createBrick('strong', 4, 3), createBrick('normal', 6, 3)];
      const ball = createBall(150, 400, 140, -260);
      let points = 0;
      for (let step = 0; step < 300; step++) {
        points += run(ball, bricks).points;
      }
      return [ball.x, ball.y, ball.vx, ball.vy, points];
    };
    expect(play()).toEqual(play());
  });
});
