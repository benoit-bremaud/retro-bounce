import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../domain/logical-size';

/** How the fixed logical field maps onto the window: integer scale when possible, letterboxed. */
export interface Viewport {
  /** Device pixels per logical unit: an integer when the field fits at x1 or more. */
  readonly scale: number;
  readonly deviceWidth: number;
  readonly deviceHeight: number;
  /** CSS size of the visible canvas: the device size divided by the pixel ratio. */
  readonly cssWidth: number;
  readonly cssHeight: number;
}

/**
 * Fits the logical field (`LOGICAL_WIDTH` x `LOGICAL_HEIGHT`) in a window of `cssWidth` x `cssHeight` CSS pixels. Computed in device
 * pixels; the scale is floored to an integer (crisp pixels) unless the window is too small for x1,
 * where the exact fractional fit is used. Works for any orientation: the field stays portrait and
 * the remaining space is letterbox.
 */
export function computeViewport(cssWidth: number, cssHeight: number, pixelRatio: number): Viewport {
  const fit = Math.min(
    (cssWidth * pixelRatio) / LOGICAL_WIDTH,
    (cssHeight * pixelRatio) / LOGICAL_HEIGHT,
  );
  const scale = fit >= 1 ? Math.floor(fit) : Math.max(fit, 0);
  const deviceWidth = Math.round(LOGICAL_WIDTH * scale);
  const deviceHeight = Math.round(LOGICAL_HEIGHT * scale);
  return {
    scale,
    deviceWidth,
    deviceHeight,
    cssWidth: deviceWidth / pixelRatio,
    cssHeight: deviceHeight / pixelRatio,
  };
}

/** Converts a pointer x (CSS pixels from the canvas left edge) to a logical x, clamped to the field; a zero-width canvas gives the field centre. */
export function toLogicalX(offsetX: number, canvasCssWidth: number): number {
  if (canvasCssWidth <= 0) return LOGICAL_WIDTH / 2;
  return Math.min(Math.max((offsetX / canvasCssWidth) * LOGICAL_WIDTH, 0), LOGICAL_WIDTH);
}
