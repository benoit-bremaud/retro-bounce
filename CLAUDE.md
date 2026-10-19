# retro-bounce — project rules

- Brick-breaker (Arkanoid-style) for the browser. TypeScript strict, native Canvas 2D, Vite. Same conventions as `../retro-shmup` and `../retro-blocks` (ADR-0001, ADR-0002).
- Mobile-first: touch is the reference input, playable on phone, tablet and PC. Menu style is copied from retro-shmup and adapted.
- Never use the trademarked original name in code, assets, UI or docs (codename `retro-bounce`).
- Domain never imports the browser, adapters do not touch globals directly (only `src/app` does). No `any`, no default exports. Tests mock boundaries, not the domain.
- Fixed 60 Hz steps, seeded PRNG: no `Date` / `Math.random` in the domain.
- No allocation inside the game loop: index loops in `src/`, no `for...of` (lint-enforced).
- Backlog is the GitHub issues (order in each title). One branch and one PR per issue, `Closes #N`.
- Commit scopes: design, adr, uml, docs, ci, repo, deps, engine, game, render, audio, input, ui, levels, assets, i18n, tests.
