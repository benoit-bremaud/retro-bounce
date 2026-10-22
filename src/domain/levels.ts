import { type LevelLayout } from './level';

/**
 * The five levels of V1, in play order (game design document, section 7). Symbols: `.` empty,
 * `n` normal, `s` strong, `u` unbreakable. The first row is left empty on every level so the ball
 * has room above the bricks. Every layout is validated by `loadLevel` when the level starts.
 */
export const LEVELS: readonly LevelLayout[] = [
  // 1. Four full rows of normal bricks: teaches the bounce.
  ['..........', 'nnnnnnnnnn', 'nnnnnnnnnn', 'nnnnnnnnnn', 'nnnnnnnnnn'],
  // 2. Pyramid with strong bricks in the centre.
  ['..........', '....nn....', '...nnnn...', '..nnssnn..', '.nnssssnn.', 'nnnnnnnnnn'],
  // 3. Checkerboard, strong bricks on the lower rows.
  ['..........', 'n.n.n.n.n.', '.n.n.n.n.n', 'n.n.n.n.n.', 's.s.s.s.s.', '.s.s.s.s.s'],
  // 4. Two walls of unbreakable bricks with gaps, forcing angled shots. Two rows of bricks sit
  // between the walls: a single row would be a 16-unit channel the ball can hardly enter.
  [
    '..........',
    'nnnnnnnnnn',
    'nnnnnnnnnn',
    'uuu....uuu',
    'nnnnnnnnnn',
    'nnnnnnnnnn',
    '...uuuu...',
    'nnnnnnnnnn',
  ],
  // 5. Mixed layout with all three brick types.
  [
    '..........',
    'u.nnssnn.u',
    '.nnssssnn.',
    'nn..uu..nn',
    'ssnn..nnss',
    'u.nnnnnn.u',
    'nnn.ss.nnn',
  ],
];
