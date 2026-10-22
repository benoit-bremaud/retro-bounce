import { aimedPaddleX } from './aim';
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
/** Step cap per level (15 minutes of play); a run is capped at this times its number of levels. */
const MAX_STEPS_PER_LEVEL = 60 * 60 * 15;
/** The bot aims once the falling ball is below the lowest brick row. */
const AIM_FROM_Y = 200;

/** What a headless run went through, so tests can prove a level was really cleared. */
export interface RunStats {
  steps: number;
  levelsCleared: number;
  livesLost: number;
  /** True when the run hit the step cap instead of ending. */
  capped: boolean;
}

/**
 * Plays a whole run headless. With `follow` the paddle sends each falling ball at the nearest brick
 * it can reach in a straight line (or, with none, under the ball with an offset that changes after
 * every hit); otherwise it never moves.
 */
export function playRun(
  session: Session,
  follow: boolean,
  onStep?: (session: Session) => void,
): RunStats {
  const events = createSessionEvents();
  const input: StepInput = { paddleTarget: 0, launchRequested: true };
  const stats: RunStats = { steps: 0, levelsCleared: 0, livesLost: 0, capped: false };
  // A new return angle after every paddle hit, from a tiny generator of its own (the same bot
  // always plays the same run), so the ball cannot fall into a loop that never reaches some bricks.
  let state = 12345;
  const nextOffset = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return (state / 2 ** 32 - 0.5) * 56;
  };
  let offset = 0;
  let aim: number | undefined;
  let aimTried = false;
  startSession(session);
  while (session.state !== 'gameOver' && session.state !== 'victory') {
    if (stats.steps >= MAX_STEPS_PER_LEVEL * session.layouts.length) {
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
    const ball = firstBall(session.world);
    if (ball.vy <= 0) {
      aimTried = false;
      aim = undefined;
    } else if (follow && !aimTried && ball.y > AIM_FROM_Y) {
      aimTried = true;
      aim = aimedPaddleX(session.world);
    }
    input.paddleTarget = follow ? (aim ?? ball.x + offset) : session.world.paddle.x;
    stepSession(session, input, DT, events);
    if (events.world.paddleHit) offset = nextOffset();
    onStep?.(session);
  }
  return stats;
}
