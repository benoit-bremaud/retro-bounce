import { describe, expect, it } from 'vitest';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../src/domain/logical-size';

describe('logical playfield size', () => {
  it('is a portrait rectangle of whole units, so it fits a phone held upright', () => {
    expect(Number.isInteger(LOGICAL_WIDTH)).toBe(true);
    expect(Number.isInteger(LOGICAL_HEIGHT)).toBe(true);
    expect(LOGICAL_HEIGHT).toBeGreaterThan(LOGICAL_WIDTH);
  });
});
