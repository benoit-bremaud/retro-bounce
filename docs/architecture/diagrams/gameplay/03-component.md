# Component diagram — gameplay — V1 structure

> **Feature**: core gameplay (V1 simple)
> **Related ADRs**: ADR-0001

## Context

Structural boundaries of the game. The dependency rule applies: the domain (World) imports nothing from infrastructure. Layering stays flat and proportional for a small game.

## Diagram

```mermaid
flowchart TB
  subgraph INFRA["Infrastructure (browser)"]
    Input["InputAdapter (touch, mouse, keyboard)"]
    Render["CanvasRenderer"]
    Audio["AudioPlayer"]
    Store["ScoreStorage (localStorage)"]
  end
  subgraph APP["Application"]
    Loop["GameLoop (fixed step)"]
    Session["GameSession (state machine)"]
  end
  subgraph DOMAIN["Domain (pure, no browser API)"]
    World["World (physics, collisions)"]
    Levels["LevelCatalog"]
    Rules["PowerUpRules"]
  end
  Input --> Loop
  Loop --> Session
  Session --> World
  World --> Levels
  World --> Rules
  Loop --> Render
  Loop --> Audio
  Session --> Store
```

## Notes

- Mobile-first: CanvasRenderer scales a fixed logical resolution to any viewport and orientation, InputAdapter normalizes touch, mouse and keyboard into one paddle target.
- Domain is pure TypeScript, unit-testable without a browser.
- Boundaries to mock in tests: time, input, storage, audio.
- Layout mirrors retro-shmup, checked on 2026-10-16: `src/domain`, `src/adapters`, `src/app`, with adapters named like its `canvas2d-renderer`, `web-audio-player`, `local-storage-store`. Port interfaces are added only where a boundary needs mocking (see ADR-0001).
