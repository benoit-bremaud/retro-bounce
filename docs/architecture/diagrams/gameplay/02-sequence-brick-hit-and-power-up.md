# Sequence diagram — gameplay — brick hit, drop and catch of a power-up

> **Feature**: core gameplay (V1 simple)
> **Related use cases**: UC2 Play a level, UC5 Catch a power-up

## Context

One fixed-step tick where the ball destroys a brick that releases a power-up, then the paddle catches it. Does NOT cover rendering details nor input handling.

## Diagram

```mermaid
sequenceDiagram
  actor P as Player
  participant GL as GameLoop
  participant S as GameSession
  participant W as World
  participant B as Ball
  participant BR as Brick
  participant PU as PowerUp
  participant PD as Paddle
  P->>GL: paddle input (touch drag, mouse or key)
  GL->>S: step(dt, input)
  S->>W: step(dt, input)
  W->>PD: moveTo(x)
  W->>B: advance(dt)
  W->>W: detect collisions
  alt ball hits a brick
    W->>BR: hit(ballPower)
    BR-->>W: destroyed + optional drop
    W->>B: bounce (unless piercing)
    W->>PU: spawn(kind, brick position)
  end
  W->>PU: fall(dt)
  alt power-up overlaps paddle
    W->>PD: catch(PU)
    W->>W: apply effect (piercing, multi-ball, wide paddle)
  else power-up leaves the screen
    W->>PU: discard
  end
  W-->>S: updated state + events
  S-->>GL: state + events
  GL->>GL: render and play sounds from events
```

## Notes

- The World returns events (brick destroyed, power-up caught, life lost) so rendering and audio stay outside the domain.
- Fixed time step, as in retro-shmup (its ADR-0002), makes the simulation reproducible and testable.
- Design choice for V1: a piercing ball skips the bounce and destroys every breakable brick it crosses (a strong brick included, which also keeps the simulation free of repeated hits while the ball overlaps a brick).
