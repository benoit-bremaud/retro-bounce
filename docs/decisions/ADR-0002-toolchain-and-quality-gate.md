# ADR-0002: Toolchain and quality gate inherited from retro-shmup and retro-blocks

**Status:** Accepted — 2026-10-19

## Context

ADR-0001 chose the retro-shmup stack. This repository is public and must be understandable without
reading another repository's ADRs, so the toolchain decisions are restated here. The files were
copied from retro-blocks `main` at `3e88ebc` (which itself inherited retro-shmup `f698786`), then
renamed. MCDA 2026-10-19: copy from retro-blocks 460/500, from retro-shmup 380/500, from scratch 165/500.

## Decision

| Topic | Decision |
|---|---|
| Dependency rule | `src/domain` imports no browser API and no package. Adapters implement ports. Only `src/app/main.ts` touches `window` / `document`. Enforced by ESLint and by `tsconfig.domain.json`, which compiles the domain without DOM types. |
| Determinism | No `Date` / `Math.random` in the domain: fixed steps and an injected seeded PRNG. |
| No allocation in the loop | Index loops in `src/`. `for...of` is banned because it allocates an iterator below V8's optimizing tier (measured in retro-shmup, 2026-10-08). |
| Toolchain | TypeScript 6.0 strict (typescript-eslint supports versions below 6.1), Node 22, pnpm, Vite, Vitest, ESLint strict type-checked, Prettier, knip. Tool configs are typed with Node types only. |
| Local-first gate | `make verify` runs in the pre-push hook: typecheck, lint, knip, format, tests with coverage, doc coverage, gitleaks, `pnpm audit`, local SonarQube with quality-gate wait. CI keeps a light check plus the security workflows (Gitleaks, CodeQL, Dependency Review, OSSF Scorecard non-blocking). |
| Coverage floors | Owner floors are 80 % tests and 90 % docs. Vitest thresholds start at 90 % and are a ratchet: raise, never lower. |
| Commits and PRs | Conventional Commits enforced by commitlint and husky. Scopes: design, adr, uml, docs, ci, repo, deps, engine, game, render, audio, input, ui, levels, assets, i18n, tests. |

## Not inherited yet

- Playwright smoke test: issue #11.
- Seeded PRNG port and fixed-step loop: domain tasks (#6).
- The logical playfield size in `src/domain/logical-size.ts` is a placeholder until the design document (#4).

## Consequences

Rules are stated here once and cited by the config files. A change to one of them needs a new ADR
in this repository, whatever the other game repositories do later. Local Node must be at least
22.22.1 (`engines`), pnpm warns on older patch versions.
