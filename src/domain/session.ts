import { type LevelLayout } from './level';
import { POWER_UP_SCORE } from './powerup';
import {
  createWorld,
  clearWorldEvents,
  createWorldEvents,
  resetBallOnPaddle,
  stepWorld,
  type StepInput,
  type World,
  type WorldEvents,
} from './world';

/** Lives at the start of a run. */
export const STARTING_LIVES = 3;
/** Bonus per life left when a level is cleared. */
export const LEVEL_CLEAR_LIFE_BONUS = 100;

/**
 * States of a game session (state diagram `05-state-game-session.md`). Every transition function
 * (`startSession`, `pauseSession`, ...) does nothing when called from a state the diagram does not allow.
 */
export type SessionState =
  'title' | 'ready' | 'playing' | 'paused' | 'lifeLost' | 'levelCleared' | 'gameOver' | 'victory';

/** A run from the title screen to game over or victory. */
export interface Session {
  state: SessionState;
  /** Replaced (not mutated) by `startSession` and `continueSession`: do not cache it across those calls. */
  world: World;
  lives: number;
  score: number;
  readonly layouts: readonly LevelLayout[];
  /** Run seed; each level derives its own generator from it, so the same seed replays the same run. */
  seed: number;
}

/** What happened during one {@link stepSession} call; the world part is the collision and level result. */
export interface SessionEvents {
  world: WorldEvents;
  /** The last ball fell: the session entered `lifeLost`. */
  lifeLost: boolean;
  /** The last breakable brick fell: the session entered `levelCleared`. */
  levelCleared: boolean;
}

/** Allocate once and reuse across {@link stepSession} calls. */
export function createSessionEvents(): SessionEvents {
  return { world: createWorldEvents(), lifeLost: false, levelCleared: false };
}

function firstWorld(layouts: readonly LevelLayout[], seed: number): World {
  const first = layouts[0];
  if (first === undefined) throw new Error('A session needs at least one level');
  return createWorld(first, 0, seed);
}

/** Creates a session on the title screen. `layouts` are the levels in play order (at least one). */
export function createSession(layouts: readonly LevelLayout[], seed: number): Session {
  return {
    state: 'title',
    world: firstWorld(layouts, seed),
    lives: STARTING_LIVES,
    score: 0,
    layouts,
    seed,
  };
}

/**
 * Title to ready: starts a fresh run (level 1, full lives, no score). Pass a new `seed` for a
 * different run; without it the session replays its current seed.
 */
export function startSession(session: Session, seed: number = session.seed): void {
  if (session.state !== 'title') return;
  session.seed = seed;
  session.lives = STARTING_LIVES;
  session.score = 0;
  session.world = firstWorld(session.layouts, seed);
  session.state = 'ready';
}

/** Playing to paused. */
export function pauseSession(session: Session): void {
  if (session.state === 'playing') session.state = 'paused';
}

/** Paused to playing. */
export function resumeSession(session: Session): void {
  if (session.state === 'paused') session.state = 'playing';
}

/** The tab or app lost focus: pauses a game in progress, ignored in every other state. */
export function loseFocus(session: Session): void {
  pauseSession(session);
}

/**
 * Leaves a transition screen: `lifeLost` goes back to `ready` (or to `gameOver` with no life left),
 * `levelCleared` loads the next level (or ends in `victory` after the last one).
 */
export function continueSession(session: Session): void {
  if (session.state === 'lifeLost') {
    if (session.lives > 0) {
      resetBallOnPaddle(session.world);
      session.state = 'ready';
    } else {
      session.state = 'gameOver';
    }
  } else if (session.state === 'levelCleared') {
    const next = session.world.levelIndex + 1;
    const layout = session.layouts[next];
    if (layout === undefined) {
      session.state = 'victory';
    } else {
      session.world = createWorld(layout, next, session.seed);
      session.state = 'ready';
    }
  }
}

/** Game over or victory back to the title screen. */
export function restartSession(session: Session): void {
  if (session.state === 'gameOver' || session.state === 'victory') session.state = 'title';
}

function clearEvents(events: SessionEvents): void {
  events.lifeLost = false;
  events.levelCleared = false;
  clearWorldEvents(events.world);
}

/**
 * Advances a session by one fixed step. Only `ready` (the paddle moves, the ball waits for
 * `input.launchRequested`) and `playing` simulate; every other state does nothing here. Entering
 * `lifeLost` or `levelCleared` is reported in `events`, then the app calls {@link continueSession};
 * the run is over when the state is `gameOver` or `victory` after that call (save the best score
 * then). If the last brick and the last ball fall in the same step, the level counts as cleared.
 */
export function stepSession(
  session: Session,
  input: StepInput,
  dt: number,
  events: SessionEvents,
): void {
  clearEvents(events);
  if (session.state !== 'ready' && session.state !== 'playing') return;
  stepWorld(session.world, input, dt, events.world);
  if (session.state === 'ready') {
    if (session.world.launched) session.state = 'playing';
    return;
  }
  session.score += events.world.points + events.world.caughtCount * POWER_UP_SCORE;
  if (events.world.cleared) {
    session.score += session.lives * LEVEL_CLEAR_LIFE_BONUS;
    session.state = 'levelCleared';
    events.levelCleared = true;
  } else if (events.world.lost) {
    session.lives -= 1;
    session.state = 'lifeLost';
    events.lifeLost = true;
  }
}
