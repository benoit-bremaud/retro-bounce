import { BALL_RADIUS, type Ball } from './ball';
import { circleOverlapsRect, createHit, sweepCircleRect, type Rect } from './geometry';
import { brickScore, crushBrick, hitBrick, type Brick } from './brick';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './logical-size';
import { paddleRect, type Paddle } from './paddle';

/** Most contacts resolved in one step; the rest of the move is dropped (never reached in play). */
const MAX_CONTACTS_PER_STEP = 4;
/** Largest deflection from vertical when the ball leaves the paddle, in radians (60°). */
export const MAX_PADDLE_ANGLE = Math.PI / 3;

const WALL_THICKNESS = 100;
// Left, right and top walls as thick rectangles, so walls use the same sweep as bricks.
const LEFT_WALL: Rect = {
  left: -WALL_THICKNESS,
  top: -WALL_THICKNESS,
  width: WALL_THICKNESS,
  height: LOGICAL_HEIGHT + 2 * WALL_THICKNESS,
};
const RIGHT_WALL: Rect = { ...LEFT_WALL, left: LOGICAL_WIDTH };
const TOP_WALL: Rect = {
  left: -WALL_THICKNESS,
  top: -WALL_THICKNESS,
  width: LOGICAL_WIDTH + 2 * WALL_THICKNESS,
  height: WALL_THICKNESS,
};

/** What happened during one {@link moveBall} call. Reused between calls to avoid allocation. */
export interface StepResult {
  /** Points won from bricks destroyed during the step. */
  points: number;
  /** Bricks destroyed during the step, in order (only the first `brokenCount` are valid). */
  broken: Brick[];
  /** Number of valid entries in `broken`. */
  brokenCount: number;
  /** True when the ball bounced on the paddle during the step. */
  paddleHit: boolean;
  /** True when the ball has left the field through the open bottom. */
  lost: boolean;
}

/** Allocate once and reuse across {@link moveBall} calls. */
export function createStepResult(): StepResult {
  return { points: 0, broken: [], brokenCount: 0, paddleHit: false, lost: false };
}

/** Resets every field of a {@link StepResult}; one place to extend when a field is added. */
export function clearStepResult(result: StepResult): void {
  result.points = 0;
  result.brokenCount = 0;
  result.paddleHit = false;
  result.lost = false;
}

const hit = createHit();
/** The nearest contact found so far in the current iteration, with what it hit. */
const contact = { t: 0, nx: 0, ny: 0, brick: undefined as Brick | undefined, onPaddle: false };
const paddleBox: Rect = { left: 0, top: 0, width: 0, height: 0 };

/** Keeps the contact with `rect` if it is the nearest so far. */
function consider(ball: Ball, dx: number, dy: number, rect: Rect, brick?: Brick): void {
  if (sweepCircleRect(ball.x, ball.y, BALL_RADIUS, dx, dy, rect, hit) && hit.t < contact.t) {
    contact.t = hit.t;
    contact.nx = hit.nx;
    contact.ny = hit.ny;
    contact.brick = brick;
    contact.onPaddle = rect === paddleBox;
  }
}

/**
 * Finds the nearest contact into `contact` (`t = Infinity` when none). On equal `t` the first
 * candidate wins: walls, then the paddle, then bricks in array order.
 */
function findContact(ball: Ball, dx: number, dy: number, bricks: readonly Brick[]): void {
  contact.t = Infinity;
  contact.brick = undefined;
  contact.onPaddle = false;
  consider(ball, dx, dy, LEFT_WALL);
  consider(ball, dx, dy, RIGHT_WALL);
  consider(ball, dx, dy, TOP_WALL);
  consider(ball, dx, dy, paddleBox);
  for (let i = 0; i < bricks.length; i++) {
    const brick = bricks[i];
    if (brick?.alive === true) consider(ball, dx, dy, brick.rect, brick);
  }
}

/** Sends the ball up at an angle set by where it hit the paddle: centre is straight up, edges ±{@link MAX_PADDLE_ANGLE}, speed kept. */
function bounceOnPaddle(ball: Ball, paddle: Paddle): void {
  const offset = Math.min(Math.max((ball.x - paddle.x) / (paddle.width / 2), -1), 1);
  const speed = Math.hypot(ball.vx, ball.vy);
  const angle = offset * MAX_PADDLE_ANGLE;
  ball.vx = speed * Math.sin(angle);
  ball.vy = -speed * Math.cos(angle);
}

/**
 * Resolves the stored `contact`. Only the paddle's top face gives the angle-controlled bounce; its
 * sides and underside reflect like a wall. A brick scores only if this hit destroys it, so an
 * unbreakable brick reflects the ball and scores nothing. A piercing ball crushes breakable bricks
 * without bouncing.
 */
function resolveContact(ball: Ball, paddle: Paddle, piercing: boolean, result: StepResult): void {
  const brick = contact.brick;
  if (brick && piercing && crushBrick(brick)) {
    // Straight through: no bounce, the brick is destroyed whatever its hit points.
    result.points += brickScore(brick);
    result.broken[result.brokenCount++] = brick;
    return;
  }
  if (contact.onPaddle && contact.ny < 0) {
    bounceOnPaddle(ball, paddle);
    result.paddleHit = true;
  } else {
    const dot = ball.vx * contact.nx + ball.vy * contact.ny;
    ball.vx -= 2 * dot * contact.nx;
    ball.vy -= 2 * dot * contact.ny;
  }
  if (brick && hitBrick(brick)) {
    result.points += brickScore(brick);
    result.broken[result.brokenCount++] = brick;
  }
}

/**
 * Advances the ball by `dt` seconds, bouncing on the walls, the paddle and the bricks, and writes
 * what happened into `result`. Contacts are found with a swept test, so the ball cannot cross a
 * brick, wall or the paddle whatever its speed. The paddle is treated as still during the step.
 * Mutates `ball` and every brick it hits (`readonly` only forbids resizing the array); `result` is
 * reset then filled. The bottom is open: `result.lost` is set once the ball is entirely below the
 * field, and the caller must stop stepping it. With `piercing`, breakable bricks are destroyed
 * whatever their hit points, scored and not bounced on; walls, the paddle and unbreakable bricks
 * still reflect. Past {@link MAX_CONTACTS_PER_STEP} contacts the rest of the move is dropped.
 */
export function moveBall(
  ball: Ball,
  dt: number,
  bricks: readonly Brick[],
  paddle: Paddle,
  result: StepResult,
  piercing = false,
): void {
  clearStepResult(result);
  paddleRect(paddle, paddleBox);
  // The paddle may have moved into the ball since the last step: lift the ball onto it.
  // Only a ball whose centre has not passed the paddle's bottom edge: below it, it is lost.
  const notBelow = ball.y <= paddleBox.top + paddleBox.height;
  if (ball.vy > 0 && notBelow && circleOverlapsRect(ball.x, ball.y, BALL_RADIUS, paddleBox)) {
    ball.y = paddleBox.top - BALL_RADIUS;
    bounceOnPaddle(ball, paddle);
    result.paddleHit = true;
  }

  let remaining = dt;
  for (let i = 0; i < MAX_CONTACTS_PER_STEP; i++) {
    const dx = ball.vx * remaining;
    const dy = ball.vy * remaining;
    findContact(ball, dx, dy, bricks);
    if (contact.t === Infinity) {
      ball.x += dx;
      ball.y += dy;
      break;
    }
    ball.x += dx * contact.t;
    ball.y += dy * contact.t;
    remaining *= 1 - contact.t;
    resolveContact(ball, paddle, piercing, result);
  }
  result.lost = ball.y - BALL_RADIUS > LOGICAL_HEIGHT;
}
