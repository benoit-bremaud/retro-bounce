import { describe, expect, it } from 'vitest';
import { countBreakable, loadLevel } from '../../src/domain/level';
import { LEVELS } from '../../src/domain/levels';
import { STARTING_LIVES, createSession } from '../../src/domain/session';
import { playRun } from '../support/bot';

const SEEDS = [1, 2, 3];

describe('level catalogue', () => {
  it('has the five levels of V1', () => {
    expect(LEVELS).toHaveLength(5);
  });

  it.each(LEVELS.map((layout, index) => [index + 1, layout] as const))(
    'level %i loads and has something to break',
    (_number, layout) => {
      expect(countBreakable(loadLevel(layout))).toBeGreaterThan(0);
    },
  );

  it('introduces the brick types as the game design document describes', () => {
    const kinds = LEVELS.map((layout) => new Set(layout.join('')));
    expect(kinds[0]).toEqual(new Set('.n'));
    expect(kinds[1]?.has('s')).toBe(true);
    expect(kinds[2]?.has('s')).toBe(true);
    expect(kinds[3]?.has('u')).toBe(true);
    expect(kinds[4]).toEqual(new Set('.nsu'));
  });
});

describe('level validation: walled-off bricks', () => {
  it('rejects a breakable brick enclosed by unbreakable ones', () => {
    expect(() => loadLevel(['..........', 'uuu.......', 'unu.......', 'uuu.......'])).toThrow(
      /walled off/,
    );
  });

  it('rejects everything above a full unbreakable bottom row', () => {
    expect(() => loadLevel(['nnnnnnnnnn', 'uuuuuuuuuu'])).toThrow(/walled off/);
  });

  it('accepts a brick behind a gap in a wall', () => {
    expect(() => loadLevel(['nnnnnnnnnn', 'uuuu.uuuuu'])).not.toThrow();
  });

  it('reaches a brick through other breakable bricks', () => {
    expect(() => loadLevel(['n.........', 'n.........', 'u.uuuuuuuu'])).not.toThrow();
  });
});

describe('level catalogue is winnable', () => {
  it.each(
    LEVELS.flatMap((layout, index) => SEEDS.map((seed) => [index + 1, seed, layout] as const)),
  )('a bot clears level %i alone (seed %i)', (_number, seed, layout) => {
    const session = createSession([layout], seed);
    const stats = playRun(session, true);
    expect(session.state).toBe('victory');
    expect(stats.capped).toBe(false);
    expect(session.world.breakableLeft).toBe(0);
  });

  it.each(SEEDS)('a bot plays the whole campaign to victory (seed %i)', (seed) => {
    const session = createSession(LEVELS, seed);
    const stats = playRun(session, true);
    expect(session.state).toBe('victory');
    expect(stats.levelsCleared).toBe(LEVELS.length);
    expect(session.lives).toBe(STARTING_LIVES - stats.livesLost);
  });
});
