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

  it.each([
    ['too many rows', new Array<string>(13).fill('nnnnnnnnnn')],
    ['a short row', ['nnnnn']],
    ['an unknown symbol', ['nnnnxnnnnn']],
    ['nothing to break', ['uuuuuuuuuu']],
  ])('rejects a layout with %s', (_name, layout) => {
    expect(() => loadLevel(layout)).toThrow();
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
