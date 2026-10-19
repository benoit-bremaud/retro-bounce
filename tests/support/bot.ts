import { type Session } from '../../src/domain/session';
import {
  createSessionEvents,
  continueSession,
  startSession,
  stepSession,
} from '../../src/domain/session';

const DT = 1 / 60;
const MAX_STEPS = 60 * 60 * 10;

/** Plays a whole run headless. `follow` aims the paddle under the ball with a sweeping offset; otherwise it stays still. */
export function playRun(session: Session, follow: boolean): number {
  const events = createSessionEvents();
  startSession(session);
  let steps = 0;
  while (session.state !== 'gameOver' && session.state !== 'victory' && steps < MAX_STEPS) {
    steps++;
    if (session.state === 'lifeLost' || session.state === 'levelCleared') {
      continueSession(session);
      continue;
    }
    const offset = 26 * Math.sin(steps / 40);
    const target = follow ? session.world.ball.x + offset : session.world.paddle.x;
    stepSession(session, target, true, DT, events);
  }
  return steps;
}
