# State machine diagram — gameplay — game session

> **Feature**: core gameplay (V1 simple)

## Context

Lifecycle of one game session, from title screen to game over. Does NOT detail the ball or power-up states.

## Diagram

```mermaid
stateDiagram-v2
  [*] --> Title
  Title --> Ready: start
  Ready --> Playing: launch ball
  Playing --> Paused: pause
  Paused --> Playing: resume
  Playing --> Paused: tab or app loses focus
  Playing --> LifeLost: last ball falls
  LifeLost --> Ready: lives remaining
  LifeLost --> GameOver: no life left
  Playing --> LevelCleared: no breakable brick left
  LevelCleared --> Ready: next level loaded
  LevelCleared --> Victory: last level cleared
  GameOver --> Title: restart
  Victory --> Title: restart
```

## Notes

- Auto-pause on focus loss matters on mobile (incoming call, app switch).
- Ready means the ball sits on the paddle, waiting for launch.
- Best score is saved on entering GameOver or Victory.
