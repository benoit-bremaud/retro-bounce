import { describe, expect, it } from 'vitest';
import { BALL_RADIUS, ballSpeedForLevel } from '../../src/domain/ball';
import {
  LAUNCH_ANGLE_MIN,
  LAUNCH_ANGLE_SPREAD,
  createWorld,
  createWorldEvents,
  resetBallOnPaddle,
  stepWorld,
} from '../../src/domain/world';
import { LEVEL_ONE } from '../support/layouts';

const DT = 1 / 60;

describe('world', () => {
  it('starts with the ball on the paddle', () => {
    const world = createWorld(LEVEL_ONE, 0, 1);
    expect(world.launched).toBe(false);
    expect(world.ball.x).toBe(world.paddle.x);
    expect(world.ball.y).toBe(595 - BALL_RADIUS);
    expect(world.breakableLeft).toBe(12);
  });

  it('carries the ball with the paddle until the launch', () => {
    const world = createWorld(LEVEL_ONE, 0, 1);
    stepWorld(world, 100, false, DT, createWorldEvents());
    expect(world.paddle.x).toBe(100);
    expect(world.ball.x).toBe(100);
    expect(world.launched).toBe(false);
  });

  it('launches upward 10 to 20 degrees off vertical at the level speed', () => {
    for (let seed = 0; seed < 50; seed++) {
      const world = createWorld(LEVEL_ONE, 2, seed);
      stepWorld(world, 180, true, DT, createWorldEvents());
      const speed = Math.hypot(world.ball.vx, world.ball.vy);
      const angle = Math.atan(Math.abs(world.ball.vx) / -world.ball.vy);
      expect(world.launched).toBe(true);
      expect(world.ball.vy).toBeLessThan(0);
      expect(speed).toBeCloseTo(ballSpeedForLevel(3));
      expect(angle).toBeGreaterThanOrEqual(LAUNCH_ANGLE_MIN - 1e-9);
      expect(angle).toBeLessThanOrEqual(LAUNCH_ANGLE_MIN + LAUNCH_ANGLE_SPREAD + 1e-9);
    }
  });

  it('launches to both sides depending on the seed', () => {
    const sides = new Set<number>();
    for (let seed = 0; seed < 50; seed++) {
      const world = createWorld(LEVEL_ONE, 0, seed);
      stepWorld(world, 180, true, DT, createWorldEvents());
      sides.add(Math.sign(world.ball.vx));
    }
    expect(sides).toEqual(new Set([-1, 1]));
  });

  it('moves the ball once launched and counts destroyed bricks', () => {
    const world = createWorld(['n.........'], 0, 3);
    const events = createWorldEvents();
    world.paddle.x = 20;
    world.launched = true;
    world.ball.x = 18;
    world.ball.y = 40;
    world.ball.vx = 0;
    world.ball.vy = -300;
    for (let step = 0; step < 10 && !events.cleared; step++)
      stepWorld(world, 20, false, DT, events);
    expect(events.cleared).toBe(true);
    expect(world.breakableLeft).toBe(0);
  });

  it('puts the ball back on the paddle after a lost life', () => {
    const world = createWorld(LEVEL_ONE, 0, 1);
    stepWorld(world, 180, true, DT, createWorldEvents());
    resetBallOnPaddle(world);
    expect(world.launched).toBe(false);
    expect(world.ball.vy).toBe(0);
  });
});
