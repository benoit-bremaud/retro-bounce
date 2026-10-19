import { type Brick } from './brick';
import { LOGICAL_HEIGHT } from './logical-size';
import { PADDLE_HEIGHT, PADDLE_Y, type Paddle } from './paddle';
import { type Random } from './ports/random';

/** The three power-ups of V1. */
export type PowerUpKind = 'piercing' | 'multiBall' | 'widePaddle';

const KINDS: readonly PowerUpKind[] = ['piercing', 'multiBall', 'widePaddle'];

/** Chance that a destroyed brick releases a power-up. */
export const POWER_UP_DROP_CHANCE = 0.15;
/** Fall speed in game units per second. */
const FALL_SPEED = 120;
/** Points won for catching a power-up. */
export const POWER_UP_SCORE = 50;
/** Seconds the piercing ball lasts. */
export const PIERCING_DURATION = 8;
/** Seconds the wide paddle lasts. */
export const WIDE_PADDLE_DURATION = 12;
/** Most power-ups falling at once (a safe bound for 15 % drops over a level); a drop is skipped, after its draws, when the pool is full. */
export const MAX_POWER_UPS = 16;
const POWER_UP_WIDTH = 24;
const POWER_UP_HEIGHT = 12;

/** A falling power-up, centred on (x, y). */
export interface PowerUp {
  kind: PowerUpKind;
  x: number;
  y: number;
}

/** Fixed-capacity set of falling power-ups: only the first `count` entries are alive. */
export interface PowerUpPool {
  items: PowerUp[];
  count: number;
}

/** Creates a pool with every slot preallocated. */
export function createPowerUpPool(): PowerUpPool {
  const items: PowerUp[] = [];
  for (let i = 0; i < MAX_POWER_UPS; i++) items.push({ kind: 'piercing', x: 0, y: 0 });
  return { items, count: 0 };
}

/**
 * Rolls the drop for one destroyed brick and spawns the power-up at its centre. Two draws when it
 * drops (chance, then kind), one otherwise, whether or not the pool has a free slot; the order is part of the seed contract.
 */
export function rollDrop(pool: PowerUpPool, brick: Brick, random: Random): void {
  if (random.next() >= POWER_UP_DROP_CHANCE) return;
  const kind = KINDS[Math.floor(random.next() * KINDS.length)];
  const slot = pool.items[pool.count];
  if (kind === undefined || slot === undefined) return;
  slot.kind = kind;
  slot.x = brick.rect.left + brick.rect.width / 2;
  slot.y = brick.rect.top + brick.rect.height / 2;
  pool.count += 1;
}

function removeAt(pool: PowerUpPool, index: number): void {
  const last = pool.items[pool.count - 1];
  const removed = pool.items[index];
  if (last === undefined || removed === undefined) return;
  pool.items[index] = last;
  pool.items[pool.count - 1] = removed;
  pool.count -= 1;
}

function touchesPaddle(powerUp: PowerUp, paddle: Paddle): boolean {
  return (
    Math.abs(powerUp.x - paddle.x) < (POWER_UP_WIDTH + paddle.width) / 2 &&
    Math.abs(powerUp.y - PADDLE_Y) < (POWER_UP_HEIGHT + PADDLE_HEIGHT) / 2
  );
}

/**
 * Makes every power-up fall by `dt` seconds. One that touches the paddle is caught: its kind is
 * written to `caught[caughtCount++]` and it leaves the pool. One that falls out of the field is
 * dropped silently. Returns how many were caught.
 */
export function stepPowerUps(
  pool: PowerUpPool,
  dt: number,
  paddle: Paddle,
  caught: PowerUpKind[],
): number {
  let count = 0;
  for (let i = pool.count - 1; i >= 0; i--) {
    const powerUp = pool.items[i];
    if (powerUp === undefined) continue;
    powerUp.y += FALL_SPEED * dt;
    if (touchesPaddle(powerUp, paddle)) {
      caught[count++] = powerUp.kind;
      removeAt(pool, i);
    } else if (powerUp.y - POWER_UP_HEIGHT / 2 > LOGICAL_HEIGHT) {
      removeAt(pool, i);
    }
  }
  return count;
}
