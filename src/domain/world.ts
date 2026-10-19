import { BALL_RADIUS, ballSpeedForLevel, createBall, type Ball } from './ball';
import { type Brick } from './brick';
import { createStepResult, moveBall, type StepResult } from './collision';
import { type Rect } from './geometry';
import { countBreakable, loadLevel, type LevelLayout } from './level';
import { createPaddle, movePaddleTo, paddleRect, type Paddle } from './paddle';
import { mixSeed, SeededRandom } from './random/seeded-random';

/** Smallest launch angle from vertical, in radians (10°). */
export const LAUNCH_ANGLE_MIN = Math.PI / 18;
/** Width of the random launch angle range above the minimum, in radians (10°, so 10° to 20°). */
export const LAUNCH_ANGLE_SPREAD = Math.PI / 18;

/** One level in play: the bricks, the paddle, the ball and the level's own random generator. */
export interface World {
  ball: Ball;
  paddle: Paddle;
  bricks: Brick[];
  /** Index of the level in the run, 0-based. */
  levelIndex: number;
  /** False while the ball sits on the paddle waiting for the launch. */
  launched: boolean;
  /** Breakable bricks still alive; the level is cleared when it reaches 0. */
  breakableLeft: number;
  random: SeededRandom;
}

/** What happened during one {@link stepWorld} call: the collision result plus the level state. */
export interface WorldEvents extends StepResult {
  /** True when the last breakable brick was destroyed during the step. */
  cleared: boolean;
}

/** Allocate once and reuse across {@link stepWorld} calls. */
export function createWorldEvents(): WorldEvents {
  return { ...createStepResult(), cleared: false };
}

const box: Rect = { left: 0, top: 0, width: 0, height: 0 };

/** Puts the ball back on the paddle, waiting for the launch (new level, or after a lost life). */
export function resetBallOnPaddle(world: World): void {
  paddleRect(world.paddle, box);
  world.ball.x = world.paddle.x;
  world.ball.y = box.top - BALL_RADIUS;
  world.ball.vx = 0;
  world.ball.vy = 0;
  world.launched = false;
}

/**
 * Builds the world of a level. The level's random generator is seeded from the run seed and the
 * level index, so a run is reproducible from its seed alone.
 */
export function createWorld(layout: LevelLayout, levelIndex: number, runSeed: number): World {
  const bricks = loadLevel(layout);
  const world: World = {
    ball: createBall(0, 0, 0, 0),
    paddle: createPaddle(),
    bricks,
    levelIndex,
    launched: false,
    breakableLeft: countBreakable(bricks),
    random: new SeededRandom(mixSeed(runSeed, levelIndex)),
  };
  resetBallOnPaddle(world);
  return world;
}

/** Launches the ball upward, 10° to 20° to the left or right of vertical, at the level's speed. */
function launch(world: World): void {
  const angle = LAUNCH_ANGLE_MIN + world.random.next() * LAUNCH_ANGLE_SPREAD;
  const side = world.random.next() < 0.5 ? -1 : 1;
  const speed = ballSpeedForLevel(world.levelIndex + 1);
  world.ball.vx = side * speed * Math.sin(angle);
  world.ball.vy = -speed * Math.cos(angle);
  world.launched = true;
}

/**
 * Advances the level by `dt` seconds: moves the paddle to `paddleTarget` (centre x, clamped), then
 * either carries the ball on the paddle or, once launched, moves it. `launchRequested` launches a
 * waiting ball. Fills `events`; the caller decides what a lost ball or a cleared level means.
 */
export function stepWorld(
  world: World,
  paddleTarget: number,
  launchRequested: boolean,
  dt: number,
  events: WorldEvents,
): void {
  movePaddleTo(world.paddle, paddleTarget);
  events.cleared = false;
  if (!world.launched) {
    events.points = 0;
    events.brokenCount = 0;
    events.paddleHit = false;
    events.lost = false;
    resetBallOnPaddle(world);
    if (launchRequested) launch(world);
    return;
  }
  moveBall(world.ball, dt, world.bricks, world.paddle, events);
  world.breakableLeft -= events.brokenCount;
  events.cleared = world.breakableLeft === 0;
}
