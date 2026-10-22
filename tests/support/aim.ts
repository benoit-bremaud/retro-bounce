import { BALL_RADIUS, type Ball } from '../../src/domain/ball';
import { isBreakable, type Brick } from '../../src/domain/brick';
import { MAX_PADDLE_ANGLE } from '../../src/domain/collision';
import { LOGICAL_WIDTH } from '../../src/domain/logical-size';
import { PADDLE_Y } from '../../src/domain/paddle';
import { type World } from '../../src/domain/world';

/** Where the ball leaves the paddle, in y. */
const CONTACT_Y = PADDLE_Y - BALL_RADIUS;
/** Largest share of the paddle half-width the bot aims with, so it never aims at the very edge. */
const MAX_OFFSET = 0.95;
/** Path sampling step in logical units, smaller than the brick height (16) so no brick is skipped. */
const SAMPLE_STEP = 8;

/** The x where a falling ball reaches the paddle line, folded back by the side walls. */
function landingX(ball: Ball): number {
  const width = LOGICAL_WIDTH - 2 * BALL_RADIUS;
  const seconds = (CONTACT_Y - ball.y) / ball.vy;
  const unfolded =
    (((ball.x + ball.vx * seconds - BALL_RADIUS) % (2 * width)) + 2 * width) % (2 * width);
  return BALL_RADIUS + (unfolded > width ? 2 * width - unfolded : unfolded);
}

function blocks(brick: Brick, x: number, y: number): boolean {
  const { left, top, width, height } = brick.rect;
  return (
    !isBreakable(brick) &&
    x > left - BALL_RADIUS &&
    x < left + width + BALL_RADIUS &&
    y > top - BALL_RADIUS &&
    y < top + height + BALL_RADIUS
  );
}

/** True when a straight ball path from (x, y) to (toX, toY) crosses no unbreakable brick. */
function lineIsClear(
  bricks: readonly Brick[],
  x: number,
  y: number,
  toX: number,
  toY: number,
): boolean {
  const steps = Math.ceil(Math.hypot(toX - x, toY - y) / SAMPLE_STEP);
  for (let s = 1; s <= steps; s++) {
    const px = x + ((toX - x) * s) / steps;
    const py = y + ((toY - y) * s) / steps;
    for (const brick of bricks) {
      if (brick.alive && blocks(brick, px, py)) return false;
    }
  }
  return true;
}

/**
 * Where to put the paddle so the falling first ball is sent at the nearest breakable brick it can
 * reach in a straight line, or undefined when no brick is in a straight line. Test support only:
 * it proves a level can be cleared by someone who aims.
 */
export function aimedPaddleX(world: World): number | undefined {
  const ball = world.balls.items[0];
  if (ball === undefined) return undefined;
  const fromX = landingX(ball);
  let bestAngle: number | undefined;
  let bestDistance = Infinity;
  for (const brick of world.bricks) {
    if (!brick.alive || !isBreakable(brick)) continue;
    const toX = brick.rect.left + brick.rect.width / 2;
    const toY = brick.rect.top + brick.rect.height / 2;
    // Aimed at the brick's top edge: a steeper-looking shot than the centre line that was checked, which keeps
    // the bot from stalling on corner bricks the centre line cannot reach within the paddle angle.
    const angle = Math.atan2(toX - fromX, CONTACT_Y - brick.rect.top);
    const distance = Math.hypot(toX - fromX, toY - CONTACT_Y);
    if (distance < bestDistance && lineIsClear(world.bricks, fromX, CONTACT_Y, toX, toY)) {
      bestAngle = angle;
      bestDistance = distance;
    }
  }
  if (bestAngle === undefined) return undefined;
  const offset = Math.min(Math.max(bestAngle / MAX_PADDLE_ANGLE, -MAX_OFFSET), MAX_OFFSET);
  return fromX - offset * (world.paddle.width / 2);
}
