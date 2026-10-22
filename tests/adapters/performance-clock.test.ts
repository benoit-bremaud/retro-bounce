import { describe, expect, it } from 'vitest';
import { PerformanceClock } from '../../src/adapters/performance-clock';

describe('PerformanceClock', () => {
  it('is monotonic', () => {
    const clock = new PerformanceClock();
    const first = clock.now();
    expect(clock.now()).toBeGreaterThanOrEqual(first);
  });
});
