/**
 * Seeded pseudo-random generator for gameplay only.
 * `next()` returns a number in [0, 1); presentation uses its own unseeded generator.
 */
export interface Random {
  next(): number;
  /** Implementations may reduce the seed to their state size (see `SeededRandom`). */
  seed(s: number): void;
}
