import { describe, expect, it } from 'vitest';
import { FrameLoop, STEP_MS, STEP_SECONDS } from '../../src/app/frame-loop';

function setup() {
  let now = 0;
  let pending: (() => void) | undefined;
  const log = { steps: 0, renders: 0, dts: [] as number[] };
  const loop = new FrameLoop(
    { now: () => now },
    {
      step: (dt) => {
        log.steps++;
        log.dts.push(dt);
      },
      render: () => {
        log.renders++;
      },
    },
    (cb) => {
      pending = cb;
    },
  );
  const frame = (advanceMs: number): void => {
    now += advanceMs;
    const cb = pending;
    pending = undefined;
    cb?.();
  };
  return { loop, log, frame, hasPending: () => pending !== undefined };
}

describe('FrameLoop', () => {
  it('runs one step per 60 Hz frame and renders every frame', () => {
    const { loop, log, frame } = setup();
    loop.start();
    frame(0);
    for (let i = 0; i < 60; i++) frame(STEP_MS);
    expect(log.steps).toBe(60);
    expect(log.renders).toBe(61);
    expect(log.dts.every((dt) => dt === STEP_SECONDS)).toBe(true);
  });

  it('keeps one step per frame under clock jitter', () => {
    const { loop, log, frame } = setup();
    loop.start();
    frame(0);
    for (let i = 0; i < 20; i++) {
      const before = log.steps;
      frame(STEP_MS + (i % 2 === 0 ? 2 : -2));
      expect(log.steps - before).toBe(1);
    }
  });

  it('does not replay the stopped period after a restart', () => {
    const { loop, log, frame } = setup();
    loop.start();
    frame(0);
    loop.stop();
    frame(5000);
    loop.start();
    frame(0);
    expect(log.steps).toBe(0);
  });

  it('runs several steps for a slow frame and none for a fast one', () => {
    const { loop, log, frame } = setup();
    loop.start();
    frame(0);
    frame(STEP_MS * 3);
    expect(log.steps).toBe(3);
    frame(2);
    expect(log.steps).toBe(3);
  });

  it('clamps a huge frame', () => {
    const { loop, log, frame } = setup();
    loop.start();
    frame(0);
    frame(60_000);
    // 250 ms clamp + the half-step seed = 15 whole steps.
    expect(log.steps).toBe(15);
    frame(STEP_MS);
    expect(log.steps).toBe(16);
  });

  it('ignores a clock that goes backwards', () => {
    const { loop, log, frame } = setup();
    loop.start();
    frame(0);
    frame(-100);
    expect(log.steps).toBe(0);
    frame(STEP_MS);
    expect(log.steps).toBe(1);
  });

  it('stops without rescheduling, and start twice keeps one chain', () => {
    const { loop, log, frame, hasPending } = setup();
    loop.start();
    loop.start();
    frame(0);
    loop.stop();
    frame(STEP_MS);
    expect(log.renders).toBe(1);
    expect(hasPending()).toBe(false);
    loop.start();
    expect(hasPending()).toBe(true);
  });
});
