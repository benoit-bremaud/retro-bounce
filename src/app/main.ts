import './style.css';
import { Canvas2DRenderer } from '../adapters/canvas2d-renderer';
import { PerformanceClock } from '../adapters/performance-clock';
import { computeViewport, toLogicalX } from '../adapters/viewport';
import { FrameLoop } from './frame-loop';
import { GameDriver } from './game-driver';

// Composition root: the only place that touches globalThis, document and requestAnimationFrame.
const canvas = document.querySelector<HTMLCanvasElement>('#screen');
const context = canvas?.getContext('2d');
if (canvas && context) {
  const renderer = new Canvas2DRenderer(context);
  const driver = new GameDriver(Date.now() >>> 0);

  const fit = (): void => {
    const view = computeViewport(
      globalThis.innerWidth,
      globalThis.innerHeight,
      globalThis.devicePixelRatio,
    );
    canvas.width = view.deviceWidth;
    canvas.height = view.deviceHeight;
    canvas.style.width = `${String(view.cssWidth)}px`;
    canvas.style.height = `${String(view.cssHeight)}px`;
    renderer.resize(view);
  };
  fit();
  globalThis.addEventListener('resize', fit);
  globalThis.addEventListener('orientationchange', fit);

  const movePaddle = (event: PointerEvent): void => {
    const box = canvas.getBoundingClientRect();
    driver.setPaddleTarget(toLogicalX(event.clientX - box.left, box.width));
  };
  canvas.addEventListener('pointermove', movePaddle);
  canvas.addEventListener('pointerdown', (event) => {
    movePaddle(event);
    driver.tap();
  });
  globalThis.addEventListener('blur', () => {
    driver.pause();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) driver.pause();
  });

  const loop = new FrameLoop(
    new PerformanceClock(),
    {
      step: (dt) => {
        driver.step(dt);
      },
      render: () => {
        renderer.render(driver.session);
      },
    },
    (callback) => {
      requestAnimationFrame(callback);
    },
  );
  loop.start();
}
