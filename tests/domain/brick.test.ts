import { describe, expect, it } from 'vitest';
import {
  BRICK_HEIGHT,
  BRICK_WIDTH,
  createBrick,
  hitBrick,
  isBreakable,
} from '../../src/domain/brick';

describe('brick', () => {
  it('sits on the 36 x 16 grid', () => {
    const brick = createBrick('normal', 3, 2);
    expect(brick.rect).toEqual({
      left: 3 * BRICK_WIDTH,
      top: 2 * BRICK_HEIGHT,
      width: BRICK_WIDTH,
      height: BRICK_HEIGHT,
    });
  });

  it('breaks in one hit for a normal brick', () => {
    const brick = createBrick('normal', 0, 0);
    expect(hitBrick(brick)).toBe(10);
    expect(brick.alive).toBe(false);
  });

  it('breaks in two hits for a strong brick', () => {
    const brick = createBrick('strong', 0, 0);
    expect(hitBrick(brick)).toBe(0);
    expect(brick.alive).toBe(true);
    expect(hitBrick(brick)).toBe(20);
    expect(brick.alive).toBe(false);
  });

  it('never breaks an unbreakable brick', () => {
    const brick = createBrick('unbreakable', 0, 0);
    expect(isBreakable(brick)).toBe(false);
    expect(hitBrick(brick)).toBe(0);
    expect(brick.alive).toBe(true);
  });

  it('gives no points for a brick that is already destroyed', () => {
    const brick = createBrick('normal', 0, 0);
    hitBrick(brick);
    expect(hitBrick(brick)).toBe(0);
  });
});
