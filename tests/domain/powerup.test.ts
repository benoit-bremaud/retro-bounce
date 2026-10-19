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
import { SeededRandom } from '../../src/domain/random/seeded-random';
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

describe('rollDrop seed contract', () => {
  it('uses both draws even when the pool is full, so later rolls stay in step', () => {
    const pool = createPowerUpPool();
    const random = scriptedRandom(0, 0, 0.9);
    pool.count = MAX_POWER_UPS;
    rollDrop(pool, brick, random);
    pool.count = 0;
    rollDrop(pool, brick, random); // third value, 0.9: no drop
    expect(pool.count).toBe(0);
  });

  it('drops some power-ups over many bricks with a real seed, the same ones for the same seed', () => {
    const kinds = (seed: number) => {
      const pool = createPowerUpPool();
      const random = new SeededRandom(seed);
      const seen: string[] = [];
      for (let i = 0; i < 60; i++) {
        pool.count = 0;
        rollDrop(pool, brick, random);
        seen.push(pool.count === 0 ? '-' : (pool.items[0]?.kind ?? '?'));
      }
      return seen;
    };
    expect(kinds(3).some((kind) => kind !== '-')).toBe(true);
    expect(kinds(3)).toEqual(kinds(3));
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
    expect(stepPowerUps(p, DT, createPaddle(), caught)).toBe(0);
    expect(p.items[0]?.y).toBeCloseTo(102);
  });

  it('catches a power-up touching the paddle and reports its kind', () => {
    const paddle = createPaddle();
    const p = pool('multiBall', paddle.x + 40, PADDLE_Y - 3);
    const caught: PowerUpKind[] = [];
    expect(stepPowerUps(p, DT, paddle, caught)).toBe(1);
    expect(caught[0]).toBe('multiBall');
    expect(p.count).toBe(0);
  });

  it('catches the right one among several and keeps the others falling', () => {
    const paddle = createPaddle();
    const p = createPowerUpPool();
    const set = (i: number, kind: PowerUpKind, x: number, y: number) =>
      Object.assign(p.items[i] ?? {}, { kind, x, y });
    set(0, 'piercing', 20, 100);
    set(1, 'widePaddle', paddle.x, PADDLE_Y);
    set(2, 'multiBall', 20, 200);
    p.count = 3;
    const caught: PowerUpKind[] = [];
    expect(stepPowerUps(p, DT, paddle, caught)).toBe(1);
    expect(caught[0]).toBe('widePaddle');
    expect(p.count).toBe(2);
    const left = [p.items[0], p.items[1]].sort((a, b) => (a?.y ?? 0) - (b?.y ?? 0));
    expect(left.map((item) => item?.kind)).toEqual(['piercing', 'multiBall']);
    expect(left.map((item) => Math.round(item?.y ?? 0))).toEqual([102, 202]);
  });

  it('catches several power-ups in one step', () => {
    const paddle = createPaddle();
    const p = createPowerUpPool();
    Object.assign(p.items[0] ?? {}, { kind: 'piercing', x: paddle.x, y: PADDLE_Y });
    Object.assign(p.items[1] ?? {}, { kind: 'multiBall', x: paddle.x + 10, y: PADDLE_Y });
    p.count = 2;
    const caught: PowerUpKind[] = [];
    expect(stepPowerUps(p, DT, paddle, caught)).toBe(2);
    expect([...caught.slice(0, 2)].sort()).toEqual(['multiBall', 'piercing']);
    expect(p.count).toBe(0);
  });

  it('does not catch a power-up beside the paddle', () => {
    const paddle = createPaddle();
    const p = pool('multiBall', paddle.x + 60, PADDLE_Y);
    expect(stepPowerUps(p, DT, paddle, [])).toBe(0);
    expect(p.count).toBe(1);
  });

  it('discards a power-up that leaves the field, with no catch', () => {
    const p = pool('widePaddle', 20, 660);
    expect(stepPowerUps(p, DT, createPaddle(), [])).toBe(0);
    expect(p.count).toBe(0);
  });
});
