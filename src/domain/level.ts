import { createBrick, isBreakable, type Brick, type BrickKind } from './brick';

// Grid size from the game design document (section 2).
const LEVEL_COLUMNS = 10;
const LEVEL_MAX_ROWS = 12;

/** A level layout: one string per row from the top, `.` empty, `n` normal, `s` strong, `u` unbreakable. */
export type LevelLayout = readonly string[];

const KINDS: Readonly<Record<string, BrickKind>> = {
  n: 'normal',
  s: 'strong',
  u: 'unbreakable',
};

/**
 * Builds the bricks of a level layout. The layout is authored data, so a malformed one (wrong
 * width, too many rows, unknown character, nothing to break) throws instead of loading half a level.
 */
export function loadLevel(layout: LevelLayout): Brick[] {
  if (layout.length > LEVEL_MAX_ROWS) {
    throw new Error(
      `A level has at most ${String(LEVEL_MAX_ROWS)} rows, got ${String(layout.length)}`,
    );
  }
  const bricks: Brick[] = [];
  for (let row = 0; row < layout.length; row++) {
    const line = layout[row] ?? '';
    if (line.length !== LEVEL_COLUMNS) {
      throw new Error(
        `Row ${String(row)} must have ${String(LEVEL_COLUMNS)} columns, got ${String(line.length)}`,
      );
    }
    for (let column = 0; column < LEVEL_COLUMNS; column++) {
      const symbol = line.charAt(column);
      if (symbol === '.') continue;
      const kind = KINDS[symbol];
      if (kind === undefined) {
        throw new Error(
          `Unknown brick symbol "${symbol}" at row ${String(row)}, column ${String(column)}`,
        );
      }
      bricks.push(createBrick(kind, column, row));
    }
  }
  if (!bricks.some(isBreakable)) throw new Error('A level needs at least one breakable brick');
  return bricks;
}

/** Number of alive breakable bricks left; unbreakable ones never count. */
export function countBreakable(bricks: readonly Brick[]): number {
  let count = 0;
  for (let i = 0; i < bricks.length; i++) {
    const brick = bricks[i];
    if (brick !== undefined && brick.alive && isBreakable(brick)) count++;
  }
  return count;
}
