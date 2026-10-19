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
- Task #3 merged in PR #18 (squash `fecb688`), Codex review: 3 findings fixed (SECURITY.md fallback, commitlint `levels` scope, ADR-0002 wording). Owner todo: enable private vulnerability reporting and Dependabot security updates.
- Task #4: game design document v0.1 written with all V1 tuning numbers (validated by the owner), UML class notes aligned.
- Task #4 merged in PR #23 (squash `7ccaab3`).
- Task #5 domain I: `geometry` (swept circle vs rectangle, faces and rounded corners), `brick`, `paddle`, `ball`, `collision` (`moveBall`: walls as thick rectangles, paddle angle by hit position, bricks, up to 4 contacts per step). Swept approach chosen by MCDA (395 vs 385 discrete, 380 sub-steps). Piercing ball left to #7; the 35 % vertical-speed floor is implied by the 60° cap (cos 60° = 0.5).
