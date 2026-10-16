# ADR-0001: Stack mirrors retro-shmup, mobile-first, V1 scope

**Status:** Proposed — 2026-10-16 (awaiting owner validation)

## Context

retro-bounce is a solo Arkanoid-style brick-breaker. The owner's rules (2026-10-16): same stack and process as the other retro games, playable on PC, tablet and mobile with a mobile-first approach, V1 kept simple, to be built after retro-plumber. The games are showcased in the owner's portfolio.

Facts checked in retro-shmup on 2026-10-16: TypeScript, Vite, Vitest, Playwright smoke tests, ESLint, Prettier, pnpm, Node 22, source tree `src/domain`, `src/adapters`, `src/app`, Canvas 2D renderer, Web Audio player, `localStorage` store, a pointer input adapter, a viewport scaling adapter, pause on tab visibility change and blur. Its ADRs live in `docs/decisions/`.

## Decision

1. **Stack**: same as retro-shmup (list above). Exact versions are copied from its `package.json` when the project is bootstrapped.
2. **Layout**: `src/domain` (pure, no browser API), `src/adapters`, `src/app`. A port interface is introduced only where a boundary must be mocked (time, input, storage, audio).
3. **Mobile-first**: touch (drag the paddle, tap to launch) is the reference input. Mouse and keyboard are equivalent alternatives. A fixed logical resolution is scaled to any viewport and orientation. The game auto-pauses when the tab or app loses focus.
4. **Persistence**: best score only, in `localStorage`. No backend, no account, no network call in V1.
5. **V1 scope**: three power-ups (piercing ball, multi-ball, wide paddle), normal and multi-hit bricks, a handful of levels. Not in V1: lasers, enemies, 32-level campaign.

## Consequences

- Reuses proven patterns, so the first code brick can start quickly.
- Mobile-first drives the QA pass: phone, tablet and desktop viewports.
- Fidelity to the original game is deliberately limited in V1.
