import { type LevelLayout } from './level';
import {
  createWorld,
  createWorldEvents,
  resetBallOnPaddle,
  stepWorld,
  type World,
  type WorldEvents,
} from './world';

/** Lives at the start of a run. */
export const STARTING_LIVES = 3;
/** Bonus per life left when a level is cleared. */
export const LEVEL_CLEAR_LIFE_BONUS = 100;

/** States of a game session (state diagram `05-state-game-session.md`). */
export type SessionState =
  'title' | 'ready' | 'playing' | 'paused' | 'lifeLost' | 'levelCleared' | 'gameOver' | 'victory';

/** A run from the title screen to game over or victory. */
export interface Session {
  state: SessionState;
  world: World;
  lives: number;
  score: number;
  readonly layouts: readonly LevelLayout[];
  readonly seed: number;
}

/** What happened during one {@link stepSession} call; the world part is the collision and level result. */
export interface SessionEvents {
  world: WorldEvents;
  /** The last ball fell: the session entered `lifeLost`. */
  lifeLost: boolean;
  /** The last breakable brick fell: the session entered `levelCleared`. */
  levelCleared: boolean;
  /** This was the last life or the last level: the run ends at the next continue, save the best score now. */
  finished: boolean;
}

/** Allocate once and reuse across {@link stepSession} calls. */
export function createSessionEvents(): SessionEvents {
  return { world: createWorldEvents(), lifeLost: false, levelCleared: false, finished: false };
}

/** Creates a session on the title screen. `layouts` are the levels in play order (at least one). */
export function createSession(layouts: readonly LevelLayout[], seed: number): Session {
  const first = layouts[0];
  if (first === undefined) throw new Error('A session needs at least one level');
  return {
    state: 'title',
    world: createWorld(first, 0, seed),
    lives: STARTING_LIVES,
    score: 0,
    layouts,
    seed,
  };
}

/** Title to ready: starts a fresh run (level 1, full lives, no score). */
export function startSession(session: Session): void {
  if (session.state !== 'title') return;
  session.lives = STARTING_LIVES;
  session.score = 0;
  session.world = createWorld(session.layouts[0] ?? [], 0, session.seed);
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
  events.finished = false;
  events.world.points = 0;
  events.world.brokenCount = 0;
  events.world.paddleHit = false;
  events.world.lost = false;
  events.world.cleared = false;
}

/**
 * Advances a session by one fixed step. Only `ready` (the paddle moves, the ball waits for
 * `launchRequested`) and `playing` simulate; every other state does nothing here. Entering
 * `lifeLost` or `levelCleared` is reported in `events`, then the app calls {@link continueSession}.
 */
export function stepSession(
  session: Session,
  paddleTarget: number,
  launchRequested: boolean,
  dt: number,
  events: SessionEvents,
): void {
  clearEvents(events);
  if (session.state !== 'ready' && session.state !== 'playing') return;
  stepWorld(session.world, paddleTarget, launchRequested, dt, events.world);
  if (session.state === 'ready') {
    if (session.world.launched) session.state = 'playing';
    return;
  }
  session.score += events.world.points;
  if (events.world.cleared) {
    session.score += session.lives * LEVEL_CLEAR_LIFE_BONUS;
    session.state = 'levelCleared';
    events.levelCleared = true;
    events.finished = session.layouts[session.world.levelIndex + 1] === undefined;
  } else if (events.world.lost) {
    session.lives -= 1;
    session.state = 'lifeLost';
    events.lifeLost = true;
    events.finished = session.lives === 0;
  }
}
