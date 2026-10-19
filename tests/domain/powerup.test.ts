import { describe, expect, it } from 'vitest';
import { createBrick } from '../../src/domain/brick';
import { PADDLE_Y, createPaddle } from '../../src/domain/paddle';
import {
  MAX_POWER_UPS,
  POWER_UP_DROP_CHANCE,
  createPowerUpPool,
  rollDrop,
  stepPowerUps,
  type PowerUpKind,
} from '../../src/domain/powerup';
import { scriptedRandom } from '../support/scripted-random';

const DT = 1 / 60;
const brick = createBrick('normal', 2, 1);

describe('rollDrop', () => {
  it('drops nothing at or above the drop chance, using one draw', () => {
    const pool = createPowerUpPool();
    const random = scriptedRandom(POWER_UP_DROP_CHANCE, 0.0, 0.9);
    rollDrop(pool, brick, random);
    expect(pool.count).toBe(0);
    // The next roll starts at the second value: proves only one draw was used.
    rollDrop(pool, brick, random);
    expect(pool.count).toBe(1);
  });

  it.each([
    [0.0, 'piercing'],
    [0.4, 'multiBall'],
    [0.99, 'widePaddle'],
  ] as const)('drops kind draw %f as %s at the brick centre', (draw, kind) => {
    const pool = createPowerUpPool();
    rollDrop(pool, brick, scriptedRandom(POWER_UP_DROP_CHANCE - 0.01, draw));
    expect(pool.count).toBe(1);
    expect(pool.items[0]).toMatchObject({ kind, x: 2 * 36 + 18, y: 16 + 8 });
  });

  it('skips the drop when the pool is full', () => {
    const pool = createPowerUpPool();
    pool.count = MAX_POWER_UPS;
    rollDrop(pool, brick, scriptedRandom(0, 0));
    expect(pool.count).toBe(MAX_POWER_UPS);
  });
});

describe('stepPowerUps', () => {
  function pool(kind: PowerUpKind, x: number, y: number) {
    const p = createPowerUpPool();
    const slot = p.items[0];
    if (slot) Object.assign(slot, { kind, x, y });
    p.count = 1;
    return p;
  }

  it('makes a power-up fall at 120 units per second', () => {
    const p = pool('piercing', 50, 100);
    const caught: PowerUpKind[] = [];
    expect(stepPowerUps(p, DT, createPaddle(), caught, 0)).toBe(0);
    expect(p.items[0]?.y).toBeCloseTo(102);
  });

  it('catches a power-up touching the paddle and reports its kind', () => {
    const paddle = createPaddle();
    const p = pool('multiBall', paddle.x + 40, PADDLE_Y - 3);
    const caught: PowerUpKind[] = [];
    expect(stepPowerUps(p, DT, paddle, caught, 0)).toBe(1);
    expect(caught[0]).toBe('multiBall');
    expect(p.count).toBe(0);
  });

  it('does not catch a power-up beside the paddle', () => {
    const paddle = createPaddle();
    const p = pool('multiBall', paddle.x + 60, PADDLE_Y);
    expect(stepPowerUps(p, DT, paddle, [], 0)).toBe(0);
    expect(p.count).toBe(1);
  });

  it('discards a power-up that leaves the field, with no catch', () => {
    const p = pool('widePaddle', 20, 660);
    expect(stepPowerUps(p, DT, createPaddle(), [], 0)).toBe(0);
    expect(p.count).toBe(0);
  });
});
