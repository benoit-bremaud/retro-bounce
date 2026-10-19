# Class diagram — gameplay — domain model V1

> **Feature**: core gameplay (V1 simple)

## Context

Domain entities of the World. Does NOT include rendering or input classes.

## Diagram

```mermaid
classDiagram
  class World {
    +step(dt, input) Event[]
  }
  class Level {
    +number id
    +Brick[] bricks
  }
  class Brick {
    +int hitPoints
    +bool breakable
    +PowerUpKind drop
    +hit(power) bool
  }
  class Ball {
    +Vector position
    +Vector velocity
    +bool piercing
  }
  class Paddle {
    +number x
    +number width
    +moveTo(x)
  }
  class PowerUp {
    +PowerUpKind kind
    +Vector position
  }
  class PowerUpKind {
    <<enumeration>>
    PIERCING_BALL
    MULTI_BALL
    WIDE_PADDLE
  }
  class Score {
    +int points
    +int lives
  }
  World "1" *-- "1" Level
  World "1" *-- "1..*" Ball
  World "1" *-- "1" Paddle
  World "1" *-- "0..*" PowerUp
  World "1" *-- "1" Score
  Level "1" *-- "1..*" Brick
  PowerUp --> PowerUpKind
  Brick --> PowerUpKind
```

## Notes

- Multi-ball simply adds Ball instances. The level is lost only when the last ball falls.
- Piercing (8 s) and wide paddle (12 s) are timed effects, see the game design document.
- V1 scope: 3 power-ups, normal, strong (2 hits) and unbreakable bricks, values in the game design document.
