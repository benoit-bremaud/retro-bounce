import { BALL_RADIUS, ballSpeedForLevel } from './ball';
import { createBallPool, removeBall, resetBalls, splitBalls, type BallPool } from './balls';
import { type Brick } from './brick';
import { clearStepResult, createStepResult, moveBall, type StepResult } from './collision';
import { type Rect } from './geometry';
import { countBreakable, loadLevel, type LevelLayout } from './level';
import {
  createPaddle,
  movePaddleTo,
  PADDLE_WIDE_WIDTH,
  PADDLE_WIDTH,
  paddleRect,
  setPaddleWidth,
  type Paddle,
} from './paddle';
import {
  createPowerUpPool,
  PIERCING_DURATION,
  rollDrop,
  stepPowerUps,
  WIDE_PADDLE_DURATION,
  type PowerUpKind,
  type PowerUpPool,
} from './powerup';
import { type Random } from './ports/random';
import { mixSeed, SeededRandom } from './random/seeded-random';

/** Smallest launch angle from vertical, in radians (10°). */
export const LAUNCH_ANGLE_MIN = Math.PI / 18;
/** Width of the random launch angle range above the minimum, in radians (10°, so 10° to 20°). */
export const LAUNCH_ANGLE_SPREAD = Math.PI / 18;

/** One level in play: bricks, paddle, balls, falling power-ups and the level's own random generator. */
export interface World {
  /** Balls in play; exactly one while waiting for the launch. */
  balls: BallPool;
  powerUps: PowerUpPool;
  paddle: Paddle;
  bricks: Brick[];
  /** Index of the level in the run, 0-based. */
  levelIndex: number;
  /** False while the ball sits on the paddle waiting for the launch. */
  launched: boolean;
  /** Seconds of piercing ball left, 0 when inactive. */
  piercingLeft: number;
  /** Seconds of wide paddle left, 0 when inactive. */
  widePaddleLeft: number;
  /** Breakable bricks still alive; the level is cleared when it reaches 0. */
  breakableLeft: number;
  random: Random;
}

/** One step of player intent, filled by the input adapter; allocate once and reuse. */
export interface StepInput {
  /** Where the paddle centre should be, in logical units (clamped by the world). */
  paddleTarget: number;
  /** True on the step the player asks to launch the waiting ball. */
  launchRequested: boolean;
}

/**
 * What happened during one {@link stepWorld} call. The {@link StepResult} fields are merged over
 * all balls, except `lost`, which is true only when the LAST ball fell (a lost life, not a lost
 * ball). `points` counts bricks only; the power-up bonus is added by `stepSession`.
 */
export interface WorldEvents extends StepResult {
  /** True when the last breakable brick was destroyed during the step. */
  cleared: boolean;
  /** Kinds of the power-ups caught during the step (only the first `caughtCount` are valid). */
  caught: PowerUpKind[];
  /** Number of valid entries in `caught`. */
  caughtCount: number;
}

/** Allocate once and reuse across {@link stepWorld} calls. */
export function createWorldEvents(): WorldEvents {
  return { ...createStepResult(), cleared: false, caught: [], caughtCount: 0 };
}

/** Resets every field of a {@link WorldEvents}. */
export function clearWorldEvents(events: WorldEvents): void {
  clearStepResult(events);
  events.cleared = false;
  events.caughtCount = 0;
}

const box: Rect = { left: 0, top: 0, width: 0, height: 0 };

/** Ends the timed effects: piercing and wide paddle stop, the paddle is normal again, drops vanish. */
export function endEffects(world: World): void {
  world.piercingLeft = 0;
  world.widePaddleLeft = 0;
  world.powerUps.count = 0;
  setPaddleWidth(world.paddle, PADDLE_WIDTH);
}

/**
 * Puts a single ball back on the paddle, waiting for the launch (new level, or after a lost life).
 * Also calls {@link endEffects}, so a new level never starts with an effect on.
 */
export function resetBallOnPaddle(world: World): void {
  paddleRect(world.paddle, box);
  resetBalls(world.balls, world.paddle.x, box.top - BALL_RADIUS, 0, 0);
  world.launched = false;
  endEffects(world);
}

/**
 * Builds the world of a level. The level's random generator is seeded from the run seed and the
 * level index, so a run is reproducible from its seed alone.
 */
export function createWorld(layout: LevelLayout, levelIndex: number, runSeed: number): World {
  const bricks = loadLevel(layout);
  const world: World = {
    balls: createBallPool(),
    powerUps: createPowerUpPool(),
    paddle: createPaddle(),
    bricks,
    levelIndex,
    launched: false,
    piercingLeft: 0,
    widePaddleLeft: 0,
    breakableLeft: countBreakable(bricks),
    random: new SeededRandom(mixSeed(runSeed, levelIndex)),
  };
  resetBallOnPaddle(world);
  return world;
}

/** Launches the ball upward, 10° to 20° to the left or right of vertical, at the level's speed. */
function launch(world: World): void {
  // Draw order is part of the seed contract: angle first, then side. Swapping changes every run.
  const angle = LAUNCH_ANGLE_MIN + world.random.next() * LAUNCH_ANGLE_SPREAD;
  const side = world.random.next() < 0.5 ? -1 : 1;
  const speed = ballSpeedForLevel(world.levelIndex + 1);
  const ball = world.balls.items[0];
  if (ball === undefined) return;
  ball.vx = side * speed * Math.sin(angle);
  ball.vy = -speed * Math.cos(angle);
  world.launched = true;
}

const ballResult = createStepResult();

/** Moves every ball, merging what each one did into `events`. A ball that fell leaves the pool. */
function moveBalls(world: World, dt: number, events: WorldEvents): void {
  const piercing = world.piercingLeft > 0;
  // Downwards, so removing a fallen ball (swap with the last) never skips one. This order, and so
  // the order bricks reach `events.broken` and the drop draws, is part of the seed contract.
  for (let i = world.balls.count - 1; i >= 0; i--) {
    const ball = world.balls.items[i];
    if (ball === undefined) continue;
    moveBall(ball, dt, world.bricks, world.paddle, ballResult, piercing);
    events.points += ballResult.points;
    events.paddleHit ||= ballResult.paddleHit;
    for (let b = 0; b < ballResult.brokenCount; b++) {
      const brick = ballResult.broken[b];
      if (brick !== undefined) events.broken[events.brokenCount++] = brick;
    }
    if (ballResult.lost) removeBall(world.balls, i);
  }
  events.lost = world.balls.count === 0;
}

function tickEffects(world: World, dt: number): void {
  world.piercingLeft = Math.max(0, world.piercingLeft - dt);
  if (world.widePaddleLeft > 0) {
    world.widePaddleLeft = Math.max(0, world.widePaddleLeft - dt);
    if (world.widePaddleLeft === 0) setPaddleWidth(world.paddle, PADDLE_WIDTH);
  }
}

function applyPowerUp(world: World, kind: PowerUpKind): void {
  if (kind === 'piercing') {
    world.piercingLeft = PIERCING_DURATION;
  } else if (kind === 'widePaddle') {
    world.widePaddleLeft = WIDE_PADDLE_DURATION;
    setPaddleWidth(world.paddle, PADDLE_WIDE_WIDTH);
  } else {
    splitBalls(world.balls);
  }
}

/** Drops from the bricks destroyed this step, then the fall and the catch of every power-up. */
function stepPowerUpsOfWorld(world: World, dt: number, events: WorldEvents): void {
  for (let i = 0; i < events.brokenCount; i++) {
    const brick = events.broken[i];
    if (brick !== undefined) rollDrop(world.powerUps, brick, world.random);
  }
  events.caughtCount = stepPowerUps(world.powerUps, dt, world.paddle, events.caught);
  for (let i = 0; i < events.caughtCount; i++) {
    const kind = events.caught[i];
    if (kind !== undefined) applyPowerUp(world, kind);
  }
}

/**
 * Advances the level by `dt` seconds: moves the paddle to `input.paddleTarget`, then either carries
 * the ball on the paddle or, once launched, runs the timed effects, moves every ball, drops and
 * catches power-ups. `input.launchRequested` launches a waiting ball. Fully overwrites `events` on
 * every call (no stale value from the previous step). `events.lost` means the last ball fell; the
 * Timers only run on launched steps (a paused session does not call this). The
 * Timers only run on launched steps (a paused session never calls this). The caller decides what
 * a lost ball or a cleared level means.
 */
export function stepWorld(world: World, input: StepInput, dt: number, events: WorldEvents): void {
  movePaddleTo(world.paddle, input.paddleTarget);
  clearWorldEvents(events);
  if (!world.launched) {
    resetBallOnPaddle(world);
    if (input.launchRequested) launch(world);
    return;
  }
  tickEffects(world, dt);
  moveBalls(world, dt, events);
  world.breakableLeft -= events.brokenCount;
  events.cleared = world.breakableLeft === 0;
  stepPowerUpsOfWorld(world, dt, events);
}
