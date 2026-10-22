import { LEVELS } from '../domain/levels';
import {
  continueSession,
  createSession,
  createSessionEvents,
  loseFocus,
  restartSession,
  resumeSession,
  startSession,
  stepSession,
  type Session,
} from '../domain/session';
import { LOGICAL_WIDTH } from '../domain/logical-size';
import type { StepInput } from '../domain/world';

/**
 * Glue between player intent and the session state machine: turns one tap into the transition the
 * current state expects, and feeds the paddle target and launch request to each step. A minimal
 * stand-in for the full input adapter (separate issue).
 */
export class GameDriver {
  readonly session: Session;
  private readonly events = createSessionEvents();
  private readonly input: StepInput = { paddleTarget: LOGICAL_WIDTH / 2, launchRequested: false };
  private tapPending = false;

  constructor(seed: number) {
    this.session = createSession(LEVELS, seed);
  }

  /** Where the paddle centre should be, in logical units. */
  setPaddleTarget(x: number): void {
    this.input.paddleTarget = x;
  }

  /** The player tapped or clicked: acted on at the next step. */
  tap(): void {
    this.tapPending = true;
  }

  /** The tab or app lost focus. */
  pause(): void {
    loseFocus(this.session);
  }

  /** Advances the game by one fixed step. */
  step(dt: number): void {
    const session = this.session;
    const tapped = this.tapPending;
    this.tapPending = false;
    this.input.launchRequested = tapped && session.state === 'ready';
    if (tapped) this.applyTap();
    stepSession(session, this.input, dt, this.events);
    if (this.events.lifeLost || this.events.levelCleared) this.input.launchRequested = false;
  }

  private applyTap(): void {
    const session = this.session;
    switch (session.state) {
      case 'title':
        startSession(session);
        break;
      case 'paused':
        resumeSession(session);
        break;
      case 'lifeLost':
      case 'levelCleared':
        continueSession(session);
        break;
      case 'gameOver':
      case 'victory':
        restartSession(session);
        break;
      default:
        break;
    }
  }
}
