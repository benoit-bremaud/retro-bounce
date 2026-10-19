import { type Rect } from './geometry';

/** Width of a brick in game units: ten of them fill the field width. */
export const BRICK_WIDTH = 36;
/** Height of a brick in game units. */
export const BRICK_HEIGHT = 16;

/** Brick kinds: `normal` breaks in one hit, `strong` in two, `unbreakable` never. */
export type BrickKind = 'normal' | 'strong' | 'unbreakable';

/** A brick on the grid. `rect` is fixed at creation, `hp` and `alive` change when it is hit. */
export interface Brick {
  kind: BrickKind;
  readonly rect: Readonly<Rect>;
  hp: number;
  alive: boolean;
}

// `unbreakable` has 0 hp but stays alive forever: `hitBrick` guards on `kind`, never on hp.
const HIT_POINTS: Record<BrickKind, number> = { normal: 1, strong: 2, unbreakable: 0 };
const SCORE: Record<BrickKind, number> = { normal: 10, strong: 20, unbreakable: 0 };

/** Creates a brick in grid cell (column, row); row 0 is the top row of the field. */
export function createBrick(kind: BrickKind, column: number, row: number): Brick {
  return {
    kind,
    rect: {
      left: column * BRICK_WIDTH,
      top: row * BRICK_HEIGHT,
      width: BRICK_WIDTH,
      height: BRICK_HEIGHT,
    },
    hp: HIT_POINTS[kind],
    alive: true,
  };
}

/** Whether the brick must be destroyed to clear the level. */
export function isBreakable(brick: Brick): boolean {
  return brick.kind !== 'unbreakable';
}

/** Applies one ball hit. Returns true when this hit destroys the brick. */
export function hitBrick(brick: Brick): boolean {
  if (!isBreakable(brick) || !brick.alive) return false;
  brick.hp -= 1;
  brick.alive = brick.hp > 0;
  return !brick.alive;
}

/** Points won for destroying the brick. */
export function brickScore(brick: Brick): number {
  return SCORE[brick.kind];
}
