import { describe, expect, it } from 'vitest';
import { SeededRandom, mixSeed } from '../../src/domain/random/seeded-random';

function take(random: SeededRandom, count: number): number[] {
  const values: number[] = [];
  for (let i = 0; i < count; i += 1) values.push(random.next());
  return values;
}

describe('SeededRandom', () => {
  it('produces the same sequence for the same seed', () => {
    expect(take(new SeededRandom(42), 100)).toEqual(take(new SeededRandom(42), 100));
  });

  it('produces different sequences for different seeds', () => {
    expect(take(new SeededRandom(1), 10)).not.toEqual(take(new SeededRandom(2), 10));
  });

  it('restarts the sequence when reseeded', () => {
    const random = new SeededRandom(7);
    const first = take(random, 20);
    random.seed(7);
    expect(take(random, 20)).toEqual(first);
  });

  it('returns values in [0, 1)', () => {
    const values = take(new SeededRandom(123), 10_000);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
  });

  it('spreads values evenly: each tenth of [0, 1) gets 10 % ± 2 % of 20 000 draws', () => {
    const bins = new Array<number>(10).fill(0);
    for (const value of take(new SeededRandom(2026), 20_000)) {
      const bin = Math.floor(value * 10);
      bins[bin] = (bins[bin] ?? 0) + 1;
    }
    for (const count of bins) {
      expect(Math.abs(count / 20_000 - 0.1)).toBeLessThan(0.02);
    }
  });

  it('reduces seeds to 32 bits, as documented', () => {
    expect(take(new SeededRandom(-1), 5)).toEqual(take(new SeededRandom(2 ** 32 - 1), 5));
  });

  it('matches the reference xoshiro128** (splitmix32-seeded) sequence for seed 42', () => {
    // Expected values from an independent implementation of the authors' reference C code
    // (https://prng.di.unimi.it/xoshiro128starstar.c), itself checked against the reference
    // opening sequence for state {1, 2, 3, 4}: 11520, 0, 5927040, 70819200, …
    expect(take(new SeededRandom(42), 5)).toEqual([
      0.6606157226487994, 0.12688010395504534, 0.11170196393504739, 0.8149394164793193,
      0.07910565007477999,
    ]);
  });

  it('accepts seed 0 without degenerating into a constant sequence', () => {
    const values = take(new SeededRandom(0), 10);
    expect(new Set(values).size).toBe(10);
  });

  it('mixes the level index into the run seed', () => {
    const seen = new Set<number>();
    for (let seed = 0; seed < 20; seed++) {
      for (let level = 0; level < 5; level++) seen.add(mixSeed(seed, level));
    }
    expect(seen.size).toBe(100);
    expect(mixSeed(5, 2)).toBe(mixSeed(5, 2));
  });
});
