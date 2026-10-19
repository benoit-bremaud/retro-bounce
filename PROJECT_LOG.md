# PROJECT_LOG — retro-bounce

## 2026-10-16
- Project created: codename `retro-bounce`, public repository, same process as the other retro games.
- Decisions: same stack as retro-shmup, V1 simple (3 power-ups), to start after retro-plumber.
- Owner rules for all retro games: playable on PC, tablet and mobile, mobile-first (touch as reference input, keyboard and mouse as alternatives), showcased in the portfolio "Jeux" section.
- UML study (6 Mermaid diagrams under `docs/architecture/diagrams/gameplay/`) and ADR-0001 (stack, mobile-first, V1 scope, Accepted) merged in PR #1 (squash `f436646`) after a self-review and a veracity check against retro-shmup.
- Next: first code brick after retro-plumber, with a plan approved before any code.

## 2026-10-19
- Backlog created: 15 issues (#3 to #17), ordered by priority. Menu will be copied from retro-shmup and adapted.
- Task #3 toolchain: files copied from retro-blocks `main` `3e88ebc` (MCDA 460/500), renamed, ADR-0002 restates the inherited rules, placeholder skeleton (`logical-size`, `main.ts`) and one test.
