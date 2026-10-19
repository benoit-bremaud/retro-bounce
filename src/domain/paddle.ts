import { LOGICAL_WIDTH } from './logical-size';

/** Vertical position of the paddle centre in game units. */
export const PADDLE_Y = 600;
/** Paddle height in game units. */
export const PADDLE_HEIGHT = 10;
/** Normal paddle width in game units. */
export const PADDLE_WIDTH = 64;
/** Paddle width while the wide-paddle power-up is active. */
export const PADDLE_WIDE_WIDTH = 96;

/** The paddle: `x` is its horizontal centre, always kept inside the field. */
export interface Paddle {
  x: number;
  width: number;
}

/** Creates a normal-width paddle centred in the field. */
export function createPaddle(): Paddle {
  return { x: LOGICAL_WIDTH / 2, width: PADDLE_WIDTH };
}

/** Moves the paddle centre to `x`, clamped so the whole paddle stays inside the field. */
export function movePaddleTo(paddle: Paddle, x: number): void {
  const half = paddle.width / 2;
  paddle.x = Math.min(Math.max(x, half), LOGICAL_WIDTH - half);
}

/** Changes the paddle width and keeps it inside the field. */
export function setPaddleWidth(paddle: Paddle, width: number): void {
  paddle.width = width;
  movePaddleTo(paddle, paddle.x);
}
