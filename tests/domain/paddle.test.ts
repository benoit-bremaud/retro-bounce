import { describe, expect, it } from 'vitest';
import {
  PADDLE_WIDE_WIDTH,
  PADDLE_WIDTH,
  createPaddle,
  movePaddleTo,
  setPaddleWidth,
} from '../../src/domain/paddle';

describe('paddle', () => {
  it('starts centred', () => {
    expect(createPaddle()).toEqual({ x: 180, width: PADDLE_WIDTH });
  });

  it('stays inside the field', () => {
    const paddle = createPaddle();
    movePaddleTo(paddle, -50);
    expect(paddle.x).toBe(32);
    movePaddleTo(paddle, 1000);
    expect(paddle.x).toBe(328);
    movePaddleTo(paddle, 200);
    expect(paddle.x).toBe(200);
  });

  it('is pushed back inside when it widens against a wall', () => {
    const paddle = createPaddle();
    movePaddleTo(paddle, 0);
    setPaddleWidth(paddle, PADDLE_WIDE_WIDTH);
    expect(paddle.x).toBe(48);
  });
});
