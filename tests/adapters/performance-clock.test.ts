import { describe, expect, it } from 'vitest';
import { PerformanceClock } from '../../src/adapters/performance-clock';

describe('PerformanceClock', () => {
  it('delegates to the injected source', () => {
    const clock = new PerformanceClock({ now: () => 42 });
    expect(clock.now()).toBe(42);
  });
});
