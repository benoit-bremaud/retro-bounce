import { describe, expect, it } from 'vitest';
import { Canvas2DRenderer, type DrawingContext } from '../../src/adapters/canvas2d-renderer';
import { computeViewport } from '../../src/adapters/viewport';
import { LEVELS } from '../../src/domain/levels';
import { createSession, startSession } from '../../src/domain/session';

function recorder() {
  const calls: string[] = [];
  const texts: string[] = [];
  const ctx: DrawingContext = {
    fillStyle: '',
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    setTransform: () => {
      calls.push('setTransform');
    },
    fillRect: () => {
      calls.push('fillRect');
    },
    beginPath: () => {
      calls.push('beginPath');
    },
    arc: () => {
      calls.push('arc');
    },
    fill: () => {
      calls.push('fill');
    },
    fillText: (text: string) => {
      calls.push('fillText');
      texts.push(text);
    },
  };
  return { ctx, calls, texts };
}

describe('Canvas2DRenderer', () => {
  it('applies the viewport scale and draws bricks, paddle, ball, HUD and overlay', () => {
    const { ctx, calls, texts } = recorder();
    const renderer = new Canvas2DRenderer(ctx);
    renderer.resize(computeViewport(720, 1280, 1));
    const session = createSession(LEVELS, 1);
    startSession(session);
    renderer.render(session);
    expect(calls[0]).toBe('setTransform');
    // background + 40 bricks + paddle + overlay band
    expect(calls.filter((c) => c === 'fillRect').length).toBe(1 + 40 + 1 + 1);
    expect(calls).toContain('arc');
    expect(texts).toContain('SCORE 0   LIVES 3');
    expect(texts).toContain('TAP TO LAUNCH');
  });

  it('skips dead bricks, draws power-ups and shows no overlay while playing', () => {
    const { ctx, calls, texts } = recorder();
    const renderer = new Canvas2DRenderer(ctx);
    const session = createSession(LEVELS, 1);
    startSession(session);
    session.state = 'playing';
    const bricks = session.world.bricks;
    const first = bricks[0];
    if (first) first.alive = false;
    const item = session.world.powerUps.items[0];
    if (item) {
      item.kind = 'piercing';
      item.x = 100;
      item.y = 100;
      session.world.powerUps.count = 1;
    }
    session.world.piercingLeft = 5;
    session.world.balls.count = 2;
    renderer.render(session);
    expect(calls.filter((c) => c === 'fillRect').length).toBe(1 + 39 + 1 + 1);
    expect(calls.filter((c) => c === 'arc').length).toBe(2);
    expect(texts).toContain('P');
    expect(texts).not.toContain('TAP TO LAUNCH');
  });

  it('rebuilds the HUD text only when the score or lives change', () => {
    const { ctx, texts } = recorder();
    const renderer = new Canvas2DRenderer(ctx);
    const session = createSession(LEVELS, 1);
    renderer.render(session);
    session.score = 40;
    renderer.render(session);
    expect(texts).toContain('SCORE 40   LIVES 3');
  });
});
