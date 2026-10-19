import { firstBall } from './balls';
import {
  continueSession,
  createSessionEvents,
  startSession,
  stepSession,
  type Session,
} from '../../src/domain/session';
import { type StepInput } from '../../src/domain/world';

const DT = 1 / 60;
const MAX_STEPS = 60 * 60 * 10;

/** What a headless run went through, so tests can prove a level was really cleared. */
export interface RunStats {
  steps: number;
  levelsCleared: number;
  livesLost: number;
  /** True when the run hit the step cap instead of ending. */
  capped: boolean;
}

/**
 * Plays a whole run headless. With `follow` the paddle aims under the ball with a sweeping
 * offset (so the ball is not always returned straight up); otherwise it never moves.
 */
export function playRun(
  session: Session,
  follow: boolean,
  onStep?: (session: Session) => void,
): RunStats {
  const events = createSessionEvents();
  const input: StepInput = { paddleTarget: 0, launchRequested: true };
  const stats: RunStats = { steps: 0, levelsCleared: 0, livesLost: 0, capped: false };
  startSession(session);
  while (session.state !== 'gameOver' && session.state !== 'victory') {
    if (stats.steps >= MAX_STEPS) {
      stats.capped = true;
      break;
    }
    stats.steps++;
    if (session.state === 'lifeLost' || session.state === 'levelCleared') {
      if (session.state === 'lifeLost') stats.livesLost++;
      else stats.levelsCleared++;
      continueSession(session);
      continue;
    }
    const offset = 26 * Math.sin(stats.steps / 40);
    input.paddleTarget = follow ? firstBall(session.world).x + offset : session.world.paddle.x;
    stepSession(session, input, DT, events);
    onStep?.(session);
  }
  return stats;
}
