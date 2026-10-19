import { describe, expect, it } from 'vitest';
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
} from '../../src/domain/session';
import { playRun } from '../support/bot';
import { LEVEL_ONE, LEVEL_TWO } from '../support/layouts';

const DT = 1 / 60;

function readySession(layouts = [LEVEL_ONE, LEVEL_TWO]): Session {
  const session = createSession(layouts, 5);
  startSession(session);
  return session;
}

function playing(layouts = [LEVEL_ONE, LEVEL_TWO]): Session {
  const session = readySession(layouts);
  stepSession(session, 180, true, DT, createSessionEvents());
  return session;
}

describe('session transitions', () => {
  it('needs at least one level', () => {
    expect(() => createSession([], 1)).toThrow();
  });

  it('goes title, ready, playing', () => {
    const session = createSession([LEVEL_ONE], 1);
    expect(session.state).toBe('title');
    startSession(session);
    expect(session.state).toBe('ready');
    expect(session.lives).toBe(STARTING_LIVES);
    stepSession(session, 180, false, DT, createSessionEvents());
    expect(session.state).toBe('ready');
    stepSession(session, 180, true, DT, createSessionEvents());
    expect(session.state).toBe('playing');
  });

  it('ignores a start that is not from the title', () => {
    const session = playing();
    startSession(session);
    expect(session.state).toBe('playing');
  });

  it('pauses and resumes, and the world does not move while paused', () => {
    const session = playing();
    pauseSession(session);
    const y = session.world.ball.y;
    stepSession(session, 180, false, DT, createSessionEvents());
    expect(session.state).toBe('paused');
    expect(session.world.ball.y).toBe(y);
    resumeSession(session);
    expect(session.state).toBe('playing');
  });

  it('pauses when focus is lost during play only', () => {
    const session = playing();
    loseFocus(session);
    expect(session.state).toBe('paused');
    const ready = readySession();
    loseFocus(ready);
    expect(ready.state).toBe('ready');
    resumeSession(ready);
    expect(ready.state).toBe('ready');
  });

  it('loses a life when the last ball falls, then returns to ready', () => {
    const session = playing();
    const events = createSessionEvents();
    session.world.ball.y = 700;
    session.world.ball.vy = 300;
    session.world.ball.vx = 0;
    stepSession(session, 180, false, DT, events);
    expect(session.state).toBe('lifeLost');
    expect(session.lives).toBe(STARTING_LIVES - 1);
    expect(events.lifeLost).toBe(true);
    expect(events.finished).toBe(false);
    continueSession(session);
    expect(session.state).toBe('ready');
    expect(session.world.launched).toBe(false);
  });

  it('goes to game over with no life left, then back to the title', () => {
    const session = playing();
    session.lives = 1;
    session.world.ball.y = 700;
    session.world.ball.vy = 300;
    const events = createSessionEvents();
    stepSession(session, 180, false, DT, events);
    expect(events.finished).toBe(true);
    continueSession(session);
    expect(session.state).toBe('gameOver');
    restartSession(session);
    expect(session.state).toBe('title');
  });

  it('clears a level, adds the life bonus and loads the next level', () => {
    const session = playing([['n.........'], LEVEL_TWO]);
    session.world.paddle.x = 20;
    session.world.ball.x = 18;
    session.world.ball.y = 40;
    session.world.ball.vx = 0;
    session.world.ball.vy = -300;
    const events = createSessionEvents();
    for (let step = 0; step < 10 && session.state === 'playing'; step++) {
      stepSession(session, 20, false, DT, events);
    }
    expect(session.state).toBe('levelCleared');
    expect(events.levelCleared).toBe(true);
    expect(events.finished).toBe(false);
    expect(session.score).toBe(10 + STARTING_LIVES * LEVEL_CLEAR_LIFE_BONUS);
    continueSession(session);
    expect(session.state).toBe('ready');
    expect(session.world.levelIndex).toBe(1);
  });

  it('wins after the last level', () => {
    const session = playing([['n.........']]);
    session.world.paddle.x = 20;
    session.world.ball.x = 18;
    session.world.ball.y = 40;
    session.world.ball.vy = -300;
    session.world.ball.vx = 0;
    const events = createSessionEvents();
    for (let step = 0; step < 10 && session.state === 'playing'; step++) {
      stepSession(session, 20, false, DT, events);
    }
    expect(events.finished).toBe(true);
    continueSession(session);
    expect(session.state).toBe('victory');
    restartSession(session);
    expect(session.state).toBe('title');
  });

  it('ignores continue and restart in other states', () => {
    const session = playing();
    continueSession(session);
    restartSession(session);
    expect(session.state).toBe('playing');
  });

  it('starts a fresh run after a restart', () => {
    const session = playing();
    session.score = 500;
    session.lives = 0;
    session.state = 'gameOver';
    restartSession(session);
    startSession(session);
    expect(session.score).toBe(0);
    expect(session.lives).toBe(STARTING_LIVES);
    expect(session.world.levelIndex).toBe(0);
  });
});

describe('headless runs', () => {
  it('clears every level to victory with a paddle that follows the ball', () => {
    const session = createSession([LEVEL_ONE, LEVEL_TWO], 11);
    playRun(session, true);
    expect(session.state).toBe('victory');
    expect(session.score).toBeGreaterThan(0);
  });

  it('reaches game over with a paddle that never moves', () => {
    const session = createSession([LEVEL_ONE, LEVEL_TWO], 11);
    playRun(session, false);
    expect(session.state).toBe('gameOver');
    expect(session.lives).toBe(0);
  });

  it('is deterministic for a seed and differs between seeds', () => {
    const run = (seed: number) => {
      const session = createSession([LEVEL_ONE, LEVEL_TWO], seed);
      const steps = playRun(session, true);
      return [steps, session.score, session.lives, session.world.ball.x];
    };
    expect(run(21)).toEqual(run(21));
    expect(run(21)).not.toEqual(run(22));
  });
});
