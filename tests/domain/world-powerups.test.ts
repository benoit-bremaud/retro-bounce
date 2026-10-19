import { describe, expect, it } from 'vitest';
import { PADDLE_WIDE_WIDTH, PADDLE_WIDTH, PADDLE_Y } from '../../src/domain/paddle';
import {
  PIERCING_DURATION,
  WIDE_PADDLE_DURATION,
  type PowerUpKind,
} from '../../src/domain/powerup';
import {
  createWorld,
  createWorldEvents,
  resetBallOnPaddle,
  stepWorld,
  type StepInput,
  type World,
} from '../../src/domain/world';
import { firstBall } from '../support/balls';
import { scriptedRandom } from '../support/scripted-random';

const DT = 1 / 60;
const TWO_ROWS = ['nnnnnnnnnn', 'nnnnnnnnnn'];

function launched(): World {
  const world = createWorld(TWO_ROWS, 0, 1);
  step(world, 180, true);
  return world;
}

function step(world: World, paddleTarget = 180, launchRequested = false, dt = DT) {
  const input: StepInput = { paddleTarget, launchRequested };
  const events = createWorldEvents();
  stepWorld(world, input, dt, events);
  return events;
}

/** Puts a power-up of `kind` right on the paddle, to be caught on the next step. */
function dropOnPaddle(world: World, kind: PowerUpKind): void {
  const slot = world.powerUps.items[world.powerUps.count];
  if (slot) Object.assign(slot, { kind, x: world.paddle.x, y: PADDLE_Y });
  world.powerUps.count += 1;
}

/** Parks the first ball so it breaks the second-row brick above it on the next step. */
function aimAtBrick(world: World): void {
  Object.assign(firstBall(world), { x: 18, y: 40, vx: 0, vy: -300 });
}

describe('drops', () => {
  it('releases a power-up when a brick is destroyed and the roll succeeds', () => {
    const world = launched();
    world.random = scriptedRandom(0.01, 0.5);
    aimAtBrick(world);
    const events = step(world, 300);
    expect(events.brokenCount).toBe(1);
    expect(world.powerUps.count).toBe(1);
    expect(world.powerUps.items[0]?.kind).toBe('multiBall');
  });

  it('releases nothing when the roll fails', () => {
    const world = launched();
    world.random = scriptedRandom(0.9);
    aimAtBrick(world);
    expect(step(world, 300).brokenCount).toBe(1);
    expect(world.powerUps.count).toBe(0);
  });
});

describe('piercing effect', () => {
  it('starts on catch, lasts 8 seconds and then ends', () => {
    const world = launched();
    dropOnPaddle(world, 'piercing');
    const events = step(world);
    expect(events.caught[0]).toBe('piercing');
    expect(events.caughtCount).toBe(1);
    expect(world.piercingLeft).toBe(PIERCING_DURATION);
    world.piercingLeft = DT / 2;
    step(world);
    expect(world.piercingLeft).toBe(0);
  });

  it('makes the balls cross bricks', () => {
    const world = launched();
    world.piercingLeft = PIERCING_DURATION;
    world.random = scriptedRandom(0.9);
    aimAtBrick(world);
    const events = step(world, 300, false, 0.1);
    expect(events.brokenCount).toBe(2);
    expect(firstBall(world).vy).toBeLessThan(0);
  });

  it('lasts the full duration of elapsed time', () => {
    const world = launched();
    world.balls.count = 0;
    world.piercingLeft = PIERCING_DURATION;
    for (let i = 0; i < 450; i++) step(world);
    expect(world.piercingLeft).toBeGreaterThan(0);
    for (let i = 0; i < 36; i++) step(world);
    expect(world.piercingLeft).toBe(0);
  });

  it('is kept when another power-up is caught', () => {
    const world = launched();
    world.piercingLeft = 3;
    dropOnPaddle(world, 'multiBall');
    step(world);
    expect(world.piercingLeft).toBeCloseTo(3 - DT);
    expect(world.balls.count).toBe(3);
  });

  it('restarts the timer when caught again instead of stacking', () => {
    const world = launched();
    world.piercingLeft = 2;
    dropOnPaddle(world, 'piercing');
    step(world);
    expect(world.piercingLeft).toBe(PIERCING_DURATION);
  });
});

describe('wide paddle effect', () => {
  it('widens the paddle for 12 seconds then restores it', () => {
    const world = launched();
    dropOnPaddle(world, 'widePaddle');
    step(world);
    expect(world.paddle.width).toBe(PADDLE_WIDE_WIDTH);
    expect(world.widePaddleLeft).toBe(WIDE_PADDLE_DURATION);
    world.widePaddleLeft = DT / 2;
    step(world);
    expect(world.paddle.width).toBe(PADDLE_WIDTH);
    expect(world.widePaddleLeft).toBe(0);
  });

  it('lasts the full duration of elapsed time', () => {
    const world = launched();
    world.balls.count = 0;
    dropOnPaddle(world, 'widePaddle');
    step(world);
    for (let i = 0; i < 690; i++) step(world);
    expect(world.paddle.width).toBe(PADDLE_WIDE_WIDTH);
    for (let i = 0; i < 40; i++) step(world);
    expect(world.paddle.width).toBe(PADDLE_WIDTH);
  });

  it('restarts the timer when caught again', () => {
    const world = launched();
    world.widePaddleLeft = 3;
    world.paddle.width = PADDLE_WIDE_WIDTH;
    dropOnPaddle(world, 'widePaddle');
    step(world);
    expect(world.widePaddleLeft).toBe(WIDE_PADDLE_DURATION);
    expect(world.paddle.width).toBe(PADDLE_WIDE_WIDTH);
  });

  it('stays inside the field when widened against a wall', () => {
    const world = launched();
    step(world, 0);
    dropOnPaddle(world, 'widePaddle');
    step(world, 0);
    expect(world.paddle.x).toBe(PADDLE_WIDE_WIDTH / 2);
  });
});

describe('multi-ball effect and losing balls', () => {
  it('turns one ball into three', () => {
    const world = launched();
    dropOnPaddle(world, 'multiBall');
    step(world);
    expect(world.balls.count).toBe(3);
  });

  it('stops splitting at six balls', () => {
    const world = launched();
    for (let i = 0; i < 3; i++) {
      dropOnPaddle(world, 'multiBall');
      step(world);
    }
    expect(world.balls.count).toBe(6);
  });

  it('loses a life only when the last ball falls', () => {
    const world = launched();
    dropOnPaddle(world, 'multiBall');
    step(world);
    for (let i = 0; i < 2; i++)
      Object.assign(world.balls.items[i] ?? {}, { x: 100, y: 700, vx: 0, vy: 300 });
    const first = step(world, 300);
    expect(first.lost).toBe(false);
    expect(world.balls.count).toBe(1);
    Object.assign(firstBall(world), { x: 100, y: 700, vx: 0, vy: 300 });
    const last = step(world, 300);
    expect(last.lost).toBe(true);
    expect(world.balls.count).toBe(0);
  });

  it('merges the points of every ball in one step', () => {
    const world = launched();
    world.random = scriptedRandom(0.9);
    world.balls.count = 2;
    Object.assign(world.balls.items[0] ?? {}, { x: 18, y: 40, vx: 0, vy: -300 });
    Object.assign(world.balls.items[1] ?? {}, { x: 342, y: 40, vx: 0, vy: -300 });
    const events = step(world, 180);
    expect(events.brokenCount).toBe(2);
    expect(events.points).toBe(20);
  });

  it('reports a paddle hit from any ball', () => {
    const world = launched();
    world.balls.count = 2;
    Object.assign(world.balls.items[0] ?? {}, { x: 300, y: 300, vx: 0, vy: -300 });
    Object.assign(world.balls.items[1] ?? {}, {
      x: world.paddle.x,
      y: PADDLE_Y - 8,
      vx: 0,
      vy: 300,
    });
    expect(step(world).paddleHit).toBe(true);
  });
});

describe('end of a life', () => {
  it('ends the effects, clears the falling power-ups and keeps a single ball', () => {
    const world = launched();
    dropOnPaddle(world, 'multiBall');
    step(world);
    world.piercingLeft = 5;
    world.widePaddleLeft = 5;
    world.paddle.width = PADDLE_WIDE_WIDTH;
    dropOnPaddle(world, 'piercing');
    world.powerUps.count = 1;
    resetBallOnPaddle(world);
    expect(world.balls.count).toBe(1);
    expect(world.piercingLeft).toBe(0);
    expect(world.widePaddleLeft).toBe(0);
    expect(world.paddle.width).toBe(PADDLE_WIDTH);
    expect(world.powerUps.count).toBe(0);
    expect(world.launched).toBe(false);
  });
});
