import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../domain/logical-size';

// Placeholder composition root (toolchain task): proves the build pipeline end to end.
// Replaced by the real wiring in the renderer task.
const canvas = document.querySelector<HTMLCanvasElement>('#screen');
const context = canvas?.getContext('2d');
if (canvas && context) {
  context.fillStyle = '#111';
  context.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
}
