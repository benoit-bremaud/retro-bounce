import { describe, expect, it } from 'vitest';
import { isBreakable } from '../../src/domain/brick';
import {
  LEVEL_CLEAR_LIFE_BONUS,
  STARTING_LIVES,
  continueSession,
  createSession,
  createSessionEvents,
  loseFocus,
  pauseSession,
  restartSession,
  resumeSession,
  startSession,
  stepSession,
  type Session,
  type SessionState,
} from '../../src/domain/session';
import { type StepInput } from '../../src/domain/world';
import { playRun } from '../support/bot';
import { LEVEL_ONE, LEVEL_TWO } from '../support/layouts';

const DT = 1 / 60;
const NORMAL_BRICK_POINTS = 10;

function step(session: Session, paddleTarget = 180, launchRequested = false, dt = DT) {
  const input: StepInput = { paddleTarget, launchRequested };
  const events = createSessionEvents();
  stepSession(session, input, dt, events);
  return events;
}

function playing(layouts = [LEVEL_ONE, LEVEL_TWO]): Session {
  const session = createSession(layouts, 5);
  startSession(session);
  step(session, 180, true);
  return session;
}

/** Puts the ball right under the brick in the top-left cell, flying up, paddle parked far away. */
function aimAtTopLeftBrick(session: Session): void {
  session.world.ball.x = 18;
  session.world.ball.y = 40;
  session.world.ball.vx = 0;
  session.world.ball.vy = -300;
}

function dropBall(session: Session): void {
  session.world.ball.x = 100;
  session.world.ball.y = 700;
  session.world.ball.vx = 0;
  session.world.ball.vy = 300;
}

function breakTopLeftBrick(session: Session) {
  aimAtTopLeftBrick(session);
  const events = createSessionEvents();
  const input: StepInput = { paddleTarget: 300, launchRequested: false };
  for (let i = 0; i < 10 && session.world.ball.vy < 0; i++) stepSession(session, input, DT, events);
  return events;
}

describe('session transitions', () => {
  it('needs at least one level', () => {
    expect(() => createSession([], 1)).toThrow(/at least one level/);
  });

  it('goes title, ready, playing', () => {
    const session = createSession([LEVEL_ONE], 1);
    expect(session.state).toBe('title');
    startSession(session);
    expect(session.state).toBe('ready');
    expect(session.lives).toBe(STARTING_LIVES);
    step(session, 180, false);
    expect(session.state).toBe('ready');
    step(session, 180, true);
    expect(session.state).toBe('playing');
  });

  it('pauses and resumes, and the world does not move while paused', () => {
    const session = playing();
    pauseSession(session);
    const y = session.world.ball.y;
    step(session);
    expect(session.state).toBe('paused');
    expect(session.world.ball.y).toBe(y);
    resumeSession(session);
    expect(session.state).toBe('playing');
  });

  it('pauses when focus is lost during play', () => {
    const session = playing();
    loseFocus(session);
    expect(session.state).toBe('paused');
  });

  it('loses a life but keeps the level, score and bricks, then returns to ready', () => {
    const session = playing([['n........n'], LEVEL_TWO]);
    breakTopLeftBrick(session);
    expect(session.score).toBe(NORMAL_BRICK_POINTS);
    dropBall(session);
    const events = step(session, 300);
    expect(session.state).toBe('lifeLost');
    expect(session.lives).toBe(STARTING_LIVES - 1);
    expect(events.lifeLost).toBe(true);
    continueSession(session);
    expect(session.state).toBe('ready');
    expect(session.world.launched).toBe(false);
    expect(session.score).toBe(NORMAL_BRICK_POINTS);
    expect(session.world.breakableLeft).toBe(1);
    expect(session.world.bricks.filter((brick) => brick.alive && isBreakable(brick))).toHaveLength(
      1,
    );
  });

  it('goes to game over with no life left, then back to the title', () => {
    const session = playing();
    session.lives = 1;
    dropBall(session);
    step(session, 300);
    expect(session.state).toBe('lifeLost');
    expect(session.lives).toBe(0);
    continueSession(session);
    expect(session.state).toBe('gameOver');
    restartSession(session);
    expect(session.state).toBe('title');
  });

  it('clears a level, adds the life bonus and loads the next level', () => {
    const session = playing([['n.........'], LEVEL_TWO]);
    const events = breakTopLeftBrick(session);
    expect(session.state).toBe('levelCleared');
    expect(events.levelCleared).toBe(true);
    expect(session.score).toBe(NORMAL_BRICK_POINTS + STARTING_LIVES * LEVEL_CLEAR_LIFE_BONUS);
    continueSession(session);
    expect(session.state).toBe('ready');
    expect(session.world.levelIndex).toBe(1);
    expect(session.world.launched).toBe(false);
  });

  it('wins after the last level, then back to the title', () => {
    const session = playing([['n.........']]);
    breakTopLeftBrick(session);
    expect(session.state).toBe('levelCleared');
    continueSession(session);
    expect(session.state).toBe('victory');
    restartSession(session);
    expect(session.state).toBe('title');
  });

  it('counts the level as cleared when the last brick and the last ball fall in one step', () => {
    const session = playing([['n.........'], LEVEL_TWO]);
    aimAtTopLeftBrick(session);
    // A long step: the ball breaks the brick, bounces down and leaves through the bottom.
    const events = step(session, 300, false, 3);
    expect(events.world.lost).toBe(true);
    expect(session.state).toBe('levelCleared');
    expect(events.lifeLost).toBe(false);
    expect(session.lives).toBe(STARTING_LIVES);
  });

  it('clears the event flags on the next step', () => {
    const session = playing([['n.........'], LEVEL_TWO]);
    const events = breakTopLeftBrick(session);
    expect(events.levelCleared).toBe(true);
    stepSession(session, { paddleTarget: 180, launchRequested: false }, DT, events);
    expect(events.levelCleared).toBe(false);
    expect(events.world.brokenCount).toBe(0);
  });

  it('starts a fresh run with a new seed after a restart', () => {
    const session = playing();
    session.score = 500;
    session.lives = 0;
    session.state = 'gameOver';
    restartSession(session);
    startSession(session, 99);
    expect(session.score).toBe(0);
    expect(session.lives).toBe(STARTING_LIVES);
    expect(session.world.levelIndex).toBe(0);
    expect(session.seed).toBe(99);
  });
});

describe('transitions the diagram does not allow are ignored', () => {
  const ACTIONS: Record<string, (session: Session) => void> = {
    start: (session) => {
      startSession(session);
    },
    pause: pauseSession,
    resume: resumeSession,
    loseFocus,
    continue: continueSession,
    restart: restartSession,
    step: (session) => {
      step(session, 100, true);
    },
  };
  const IGNORED: readonly (readonly [SessionState, readonly string[]])[] = [
    ['title', ['pause', 'resume', 'loseFocus', 'continue', 'step']],
    ['ready', ['start', 'pause', 'resume', 'loseFocus', 'continue', 'restart']],
    ['playing', ['start', 'resume', 'continue', 'restart']],
    ['paused', ['start', 'pause', 'loseFocus', 'continue', 'restart', 'step']],
    ['lifeLost', ['start', 'pause', 'resume', 'loseFocus', 'restart', 'step']],
    ['levelCleared', ['start', 'pause', 'resume', 'loseFocus', 'restart', 'step']],
    ['gameOver', ['start', 'pause', 'resume', 'loseFocus', 'continue', 'step']],
    ['victory', ['start', 'pause', 'resume', 'loseFocus', 'continue', 'step']],
  ];
  const CASES = IGNORED.flatMap(([state, actions]) =>
    actions.map((action) => [state, action] as const),
  );

  it.each(CASES)('%s ignores %s', (state, action) => {
    const session = createSession([LEVEL_ONE, LEVEL_TWO], 5);
    session.state = state;
    const before = { ...session.world.ball };
    ACTIONS[action]?.(session);
    expect(session.state).toBe(state);
    if (state !== 'ready' && action === 'step') expect(session.world.ball).toEqual(before);
  });
});

describe('headless runs', () => {
  it('clears every level to victory with a paddle that follows the ball', () => {
    const session = createSession([LEVEL_ONE, LEVEL_TWO], 11);
    const stats = playRun(session, true);
    expect(session.state).toBe('victory');
    expect(stats.capped).toBe(false);
    expect(stats.levelsCleared).toBe(2);
    expect(session.world.breakableLeft).toBe(0);
    expect(session.world.bricks.filter((brick) => brick.alive && isBreakable(brick))).toHaveLength(
      0,
    );
    expect(session.lives).toBe(STARTING_LIVES - stats.livesLost);
    // 10 normal + 2 strong + 4 normal bricks, then the life bonus of each level.
    const bricks = 12 * 10 + 4 * 10 + 2 * 20;
    expect(session.score).toBeGreaterThanOrEqual(bricks);
  });

  it.each([1, 2, 3, 4])('reaches game over with a paddle that never moves (seed %i)', (seed) => {
    const session = createSession([LEVEL_ONE, LEVEL_TWO], seed);
    const stats = playRun(session, false);
    expect(session.state).toBe('gameOver');
    expect(stats.livesLost).toBe(STARTING_LIVES);
    expect(session.lives).toBe(0);
    expect(session.world.breakableLeft).toBeGreaterThan(0);
  });

  it('replays the exact same run for the same seed', () => {
    const trace = (seed: number) => {
      const session = createSession([LEVEL_ONE, LEVEL_TWO], seed);
      const points: (string | number)[] = [];
      playRun(session, true, (s) => {
        points.push(s.state, s.world.ball.x, s.world.ball.y);
      });
      return points;
    };
    expect(trace(21)).toEqual(trace(21));
    expect(trace(21)).not.toEqual(trace(22));
  });
});
