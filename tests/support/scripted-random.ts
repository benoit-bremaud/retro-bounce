import { type Random } from '../../src/domain/ports/random';

/** A generator that replays `values` in a loop, to drive the drop rolls exactly. */
export function scriptedRandom(...values: number[]): Random {
  let index = 0;
  return {
    next: () => values[index++ % values.length] ?? 0,
    seed: () => undefined,
  };
}
