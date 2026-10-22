import type { Clock } from '../domain/ports/clock';

// Simulation steps per second (GDD: fixed 60 Hz).
const STEPS_PER_SECOND = 60;
/** One simulation step in seconds, the `dt` handed to the domain. */
export const STEP_SECONDS = 1 / STEPS_PER_SECOND;
/** One simulation step in wall-clock milliseconds. */
export const STEP_MS = 1000 / STEPS_PER_SECOND;
/** A single frame never advances the simulation by more than this (tab switch, breakpoint). */
const MAX_FRAME_MS = 250;

// Tolerance for the floating-point remainder of repeated 1000 / 60 subtractions.
const EPSILON_MS = 1e-6;

/** What the loop drives: the game in the app, a test double in tests. */
export interface FrameTarget {
  step(dtSeconds: number): void;
  render(): void;
}

/** `requestAnimationFrame` in the browser; a manual trigger in tests. */
export type ScheduleFrame = (callback: () => void) => void;

/**
 * Fixed-timestep frame loop ("Fix Your Timestep!"): clamped wall time fills an accumulator that is
 * drained in whole steps of 1/60 s, then the frame is rendered once. The accumulator starts half a
 * step full so clock jitter on a 60 Hz display never turns one step per frame into 0 or 2.
 */
export class FrameLoop {
  private lastMs: number | undefined;
  private accumulatorMs = 0;
  private running = false;
  private scheduled = false;
  private readonly clock: Clock;
  private readonly target: FrameTarget;
  private readonly schedule: ScheduleFrame;

  constructor(clock: Clock, target: FrameTarget, schedule: ScheduleFrame) {
    this.clock = clock;
    this.target = target;
    this.schedule = schedule;
  }

  /** Starts, or restarts after {@link stop}: the time origin is reset. Does nothing while running. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastMs = undefined;
    this.accumulatorMs = STEP_MS / 2;
    this.scheduleOnce();
  }

  /** Stops after the current frame; the pending callback returns without rescheduling. */
  stop(): void {
    this.running = false;
  }

  // At most one pending callback, whatever the start / stop sequence.
  private scheduleOnce(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    this.schedule(this.onFrame);
  }

  private readonly onFrame = (): void => {
    this.scheduled = false;
    if (!this.running) return;
    const nowMs = this.clock.now();
    const elapsed = this.lastMs === undefined ? 0 : nowMs - this.lastMs;
    this.lastMs = nowMs;
    this.accumulatorMs += Math.min(Math.max(elapsed, 0), MAX_FRAME_MS);
    while (this.accumulatorMs + EPSILON_MS >= STEP_MS) {
      this.target.step(STEP_SECONDS);
      this.accumulatorMs -= STEP_MS;
    }
    // The epsilon in the loop condition can leave a tiny negative remainder.
    this.accumulatorMs = Math.max(this.accumulatorMs, 0);
    this.target.render();
    this.scheduleOnce();
  };
}
