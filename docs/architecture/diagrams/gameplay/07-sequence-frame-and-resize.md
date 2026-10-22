# Sequence diagram — gameplay — frame loop, rendering and viewport resize

> **Feature**: core gameplay (V1 simple), task #9
> **Related use cases**: UC2 Play a level

## Context

One browser frame: the fixed-step accumulator drains whole 1/60 s steps, then the canvas is drawn once. Also the window resize / rotation path. Does NOT cover input adapters beyond the minimal pointer glue.

## Diagram

```mermaid
sequenceDiagram
  actor P as Player
  participant B as Browser (rAF, resize)
  participant M as main (composition root)
  participant FL as FrameLoop
  participant GD as GameDriver
  participant S as GameSession
  participant R as CanvasRenderer
  participant V as Viewport
  P->>M: pointer move / tap
  M->>GD: setPaddleTarget(x) / tap()
  B->>FL: frame callback
  FL->>FL: elapsed = clamp(clock.now() - last, 0..250 ms)
  loop while accumulator >= 1/60 s
    FL->>GD: step(1/60)
    GD->>S: stepSession(input, dt)
  end
  FL->>R: render()
  R->>S: read state (bricks, balls, paddle, power-ups)
  R->>R: draw at logical 360x640 under the scale transform
  B->>M: resize / orientationchange
  M->>V: computeViewport(width, height, pixelRatio)
  V-->>M: integer scale if >= 1 else exact fit, letterboxed
  M->>R: resize(viewport)
  B->>M: blur / tab hidden
  M->>GD: pause()
```

## Notes

- Integer scale keeps pixels crisp; below x1 the exact fractional fit is used. The field stays portrait in any orientation, the rest is letterbox.
- The domain never sees the clock, the window or the canvas: `Clock` is a port, `main` is the only file touching globals.
