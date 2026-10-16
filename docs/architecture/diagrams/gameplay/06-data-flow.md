# Data-flow diagram — gameplay — V1 data

> **Feature**: core gameplay (V1 simple)

## Context

Which data moves where. No account, no network, no personal data.

## Diagram

```mermaid
flowchart LR
  Player(["Player"]) -->|"touch, mouse position, keys"| Input["InputAdapter"]
  Input -->|"paddle target, launch, pause"| Loop["GameLoop"]
  Loop -->|"inputs + dt"| World["World"]
  World -->|"state + events"| Loop
  Loop -->|"frame"| Canvas["Canvas"]
  Loop -->|"sound events"| Audio["AudioPlayer"]
  Loop -->|"best score"| Store[("localStorage")]
  Store -->|"best score"| Loop
```

## Notes

- PII: none. Only a numeric best score is persisted, locally.
- No network call in V1.
