import { firstBall } from '../support/balls';
import { describe, expect, it } from 'vitest';
import { BALL_RADIUS, ballSpeedForLevel } from '../../src/domain/ball';
import { countBreakable, loadLevel } from '../../src/domain/level';
import { paddleRect } from '../../src/domain/paddle';
import {
  LAUNCH_ANGLE_MIN,
  LAUNCH_ANGLE_SPREAD,
  createWorld,
  createWorldEvents,
  resetBallOnPaddle,
  stepWorld,
  type StepInput,
} from '../../src/domain/world';
import { LEVEL_ONE } from '../support/layouts';

const DT = 1 / 60;

function step(
  world: ReturnType<typeof createWorld>,
  paddleTarget: number,
  launchRequested: boolean,
) {
  const input: StepInput = { paddleTarget, launchRequested };
  const events = createWorldEvents();
  stepWorld(world, input, DT, events);
  return events;
}

function launchAngle(seed: number, levelIndex = 0): number {
  const world = createWorld(LEVEL_ONE, levelIndex, seed);
  step(world, 180, true);
  return Math.atan(Math.abs(firstBall(world).vx) / -firstBall(world).vy);
}

describe('world', () => {
  it('starts with the ball on the paddle', () => {
    const world = createWorld(LEVEL_ONE, 0, 1);
    const box = { left: 0, top: 0, width: 0, height: 0 };
    paddleRect(world.paddle, box);
    expect(world.launched).toBe(false);
    expect(firstBall(world).x).toBe(world.paddle.x);
    expect(firstBall(world).y).toBe(box.top - BALL_RADIUS);
    expect(world.breakableLeft).toBe(countBreakable(loadLevel(LEVEL_ONE)));
  });

  it('carries the ball with the paddle until the launch, clamped to the field', () => {
    const world = createWorld(LEVEL_ONE, 0, 1);
    step(world, 100, false);
    expect(world.paddle.x).toBe(100);
    expect(firstBall(world).x).toBe(100);
    expect(world.launched).toBe(false);
    step(world, -500, false);
    expect(world.paddle.x).toBe(32);
    expect(firstBall(world).x).toBe(32);
  });

  it('launches upward at the level speed', () => {
    for (let seed = 0; seed < 50; seed++) {
      const world = createWorld(LEVEL_ONE, 2, seed);
      step(world, 180, true);
      expect(world.launched).toBe(true);
      expect(firstBall(world).vy).toBeLessThan(0);
      expect(Math.hypot(firstBall(world).vx, firstBall(world).vy)).toBeCloseTo(
        ballSpeedForLevel(3),
      );
    }
  });

  it('draws the launch angle across the whole 10 to 20 degree range', () => {
    const angles: number[] = [];
    for (let seed = 0; seed < 200; seed++) angles.push(launchAngle(seed));
    const middle = LAUNCH_ANGLE_MIN + LAUNCH_ANGLE_SPREAD / 2;
    expect(Math.min(...angles)).toBeGreaterThanOrEqual(LAUNCH_ANGLE_MIN - 1e-9);
    expect(Math.max(...angles)).toBeLessThanOrEqual(LAUNCH_ANGLE_MIN + LAUNCH_ANGLE_SPREAD + 1e-9);
    expect(Math.min(...angles)).toBeLessThan(middle - 0.05);
    expect(Math.max(...angles)).toBeGreaterThan(middle + 0.05);
  });

  it('launches to both sides depending on the seed', () => {
    const sides = new Set<number>();
    for (let seed = 0; seed < 50; seed++) {
      const world = createWorld(LEVEL_ONE, 0, seed);
      step(world, 180, true);
      sides.add(Math.sign(firstBall(world).vx));
    }
    expect(sides).toEqual(new Set([-1, 1]));
  });

  it('gives each level its own reproducible launch', () => {
    expect(launchAngle(9, 0)).toBe(launchAngle(9, 0));
    expect(launchAngle(9, 0)).not.toBe(launchAngle(9, 1));
  });

  it('moves the ball once launched and clears the level on the last brick', () => {
    const world = createWorld(['n.........'], 0, 3);
    const events = createWorldEvents();
    const input: StepInput = { paddleTarget: 300, launchRequested: false };
    world.launched = true;
    firstBall(world).x = 18;
    firstBall(world).y = 40;
    firstBall(world).vx = 0;
    firstBall(world).vy = -300;
    for (let i = 0; i < 10 && !events.cleared; i++) stepWorld(world, input, DT, events);
    expect(events.cleared).toBe(true);
    expect(events.brokenCount).toBe(1);
    expect(world.breakableLeft).toBe(0);
  });

  it('resets the ball on the paddle where the paddle now is', () => {
    const world = createWorld(LEVEL_ONE, 0, 1);
    step(world, 180, true);
    world.paddle.x = 90;
    resetBallOnPaddle(world);
    expect(world.launched).toBe(false);
    expect(firstBall(world).x).toBe(90);
    expect(firstBall(world).y).toBe(595 - BALL_RADIUS);
    expect(firstBall(world).vx).toBe(0);
    expect(firstBall(world).vy).toBe(0);
  });
});
