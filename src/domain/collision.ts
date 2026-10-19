import { BALL_RADIUS, type Ball } from './ball';
import { createHit, sweepCircleRect, type Rect } from './geometry';
import { hitBrick, type Brick } from './brick';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './logical-size';
import { PADDLE_HEIGHT, PADDLE_Y, type Paddle } from './paddle';

/** Most contacts resolved in one step; the rest of the move is dropped (never reached in play). */
export const MAX_CONTACTS_PER_STEP = 4;
/** Largest deflection from vertical when the ball leaves the paddle, in radians (60°). */
export const MAX_PADDLE_ANGLE = Math.PI / 3;

const WALL_THICKNESS = 100;
// Left, right and top walls as thick rectangles, so walls use the same sweep as bricks.
const LEFT_WALL: Rect = {
  left: -WALL_THICKNESS,
  top: -WALL_THICKNESS,
  width: WALL_THICKNESS,
  height: LOGICAL_HEIGHT + WALL_THICKNESS,
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

/** Creates an empty {@link StepResult}. */
export function createStepResult(): StepResult {
  return { points: 0, broken: [], brokenCount: 0, paddleHit: false, lost: false };
}

const hit = createHit();
/** The nearest contact found so far in the current iteration, with what it hit. */
const contact = { t: 0, nx: 0, ny: 0, brick: undefined as Brick | undefined, onPaddle: false };
const paddleBox: Rect = { left: 0, top: 0, width: 0, height: 0 };

function updatePaddleBox(paddle: Paddle): void {
  paddleBox.left = paddle.x - paddle.width / 2;
  paddleBox.top = PADDLE_Y - PADDLE_HEIGHT / 2;
  paddleBox.width = paddle.width;
  paddleBox.height = PADDLE_HEIGHT;
}

/** Keeps the contact with `rect` if it is the nearest so far. */
function consider(
  ball: Ball,
  dx: number,
  dy: number,
  rect: Rect,
  brick: Brick | undefined,
  onPaddle: boolean,
): void {
  if (sweepCircleRect(ball.x, ball.y, BALL_RADIUS, dx, dy, rect, hit) && hit.t < contact.t) {
    contact.t = hit.t;
    contact.nx = hit.nx;
    contact.ny = hit.ny;
    contact.brick = brick;
    contact.onPaddle = onPaddle;
  }
}

function findContact(ball: Ball, dx: number, dy: number, bricks: readonly Brick[]): void {
  contact.t = Infinity;
  contact.brick = undefined;
  contact.onPaddle = false;
  consider(ball, dx, dy, LEFT_WALL, undefined, false);
  consider(ball, dx, dy, RIGHT_WALL, undefined, false);
  consider(ball, dx, dy, TOP_WALL, undefined, false);
  consider(ball, dx, dy, paddleBox, undefined, true);
  for (let i = 0; i < bricks.length; i++) {
    const brick = bricks[i];
    if (brick?.alive === true) consider(ball, dx, dy, brick.rect, brick, false);
  }
}

/** Sends the ball up at an angle set by where it hit the paddle: centre is straight up, edges ±60°. */
function bounceOnPaddle(ball: Ball, paddle: Paddle): void {
  const offset = Math.min(Math.max((ball.x - paddle.x) / (paddle.width / 2), -1), 1);
  const speed = Math.hypot(ball.vx, ball.vy);
  const angle = offset * MAX_PADDLE_ANGLE;
  ball.vx = speed * Math.sin(angle);
  ball.vy = -speed * Math.cos(angle);
}

/** Changes the ball velocity and the game state for the contact stored in `contact`. */
function resolveContact(ball: Ball, paddle: Paddle, result: StepResult): void {
  if (contact.onPaddle && contact.ny < 0) {
    bounceOnPaddle(ball, paddle);
    result.paddleHit = true;
  } else {
    const dot = ball.vx * contact.nx + ball.vy * contact.ny;
    ball.vx -= 2 * dot * contact.nx;
    ball.vy -= 2 * dot * contact.ny;
  }
  const brick = contact.brick;
  if (brick) {
    const points = hitBrick(brick);
    if (!brick.alive) {
      result.points += points;
      result.broken[result.brokenCount++] = brick;
    }
  }
}

/**
 * Advances the ball by `dt` seconds, bouncing on the walls, the paddle and the bricks, and writes
 * what happened into `result`. Contacts are found with a swept test, so the ball cannot cross a
 * brick, wall or the paddle whatever its speed. The paddle is treated as still during the step.
 */
export function moveBall(
  ball: Ball,
  dt: number,
  bricks: readonly Brick[],
  paddle: Paddle,
  result: StepResult,
): void {
  result.points = 0;
  result.brokenCount = 0;
  result.paddleHit = false;
  result.lost = false;
  updatePaddleBox(paddle);

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
    resolveContact(ball, paddle, result);
  }
  result.lost = ball.y - BALL_RADIUS > LOGICAL_HEIGHT;
}
