import type { Clock } from '../domain/ports/clock';

/** Monotonic browser clock (ADR-0002): reads `performance.now()` through an injected source. */
export class PerformanceClock implements Clock {
  private readonly source: Pick<Performance, 'now'>;

  /** `source` is injected by the composition root (adapters never read browser globals). */
  constructor(source: Pick<Performance, 'now'>) {
    this.source = source;
  }

  now(): number {
    return this.source.now();
  }
}
