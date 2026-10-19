import { describe, expect, it } from 'vitest';
import { countBreakable, loadLevel } from '../../src/domain/level';

describe('loadLevel', () => {
  it('places each symbol on the grid', () => {
    const bricks = loadLevel(['n.........', '.s.......u']);
    expect(bricks).toHaveLength(3);
    expect(bricks[0]).toMatchObject({ kind: 'normal', rect: { left: 0, top: 0 } });
    expect(bricks[1]).toMatchObject({ kind: 'strong', rect: { left: 36, top: 16 } });
    expect(bricks[2]).toMatchObject({ kind: 'unbreakable', rect: { left: 324, top: 16 } });
  });

  it('accepts the full 12 rows', () => {
    expect(loadLevel(new Array<string>(12).fill('nnnnnnnnnn'))).toHaveLength(120);
  });

  it.each([
    ['too many rows', new Array<string>(13).fill('nnnnnnnnnn'), /at most 12 rows/],
    ['a short row', ['nnnnn'], /10 columns/],
    ['a long row', ['nnnnnnnnnnn'], /10 columns/],
    ['an unknown symbol', ['nnnnxnnnnn'], /Unknown brick symbol/],
    ['only unbreakable bricks', ['uuuuuuuuuu'], /at least one breakable/],
    ['no row at all', [], /at least one breakable/],
  ])('rejects a layout with %s', (_name, layout, message) => {
    expect(() => loadLevel(layout)).toThrow(message);
  });
});

describe('countBreakable', () => {
  it('ignores unbreakable and destroyed bricks', () => {
    const bricks = loadLevel(['nsu.......']);
    expect(countBreakable(bricks)).toBe(2);
    const first = bricks[0];
    if (first) first.alive = false;
    expect(countBreakable(bricks)).toBe(1);
  });
});
