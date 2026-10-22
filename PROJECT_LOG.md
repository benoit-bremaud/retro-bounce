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
- Task #5 merged in PR #24 (squash `7c11cbe`), Codex review: 1 finding fixed (no rescue of a ball below the paddle).
- Task #5 domain I: `geometry` (swept circle vs rectangle, faces and rounded corners), `brick`, `paddle`, `ball`, `collision` (`moveBall`: walls as thick rectangles, paddle angle by hit position, bricks, up to 4 contacts per step). Swept approach chosen by MCDA (395 vs 385 discrete, 380 sub-steps). Piercing ball left to #7; the 35 % vertical-speed floor is implied by the 60° cap (cos 60° = 0.5).
- Task #6 domain II: `level` (text layouts to bricks), `world` (one level, seeded launch 10 to 20 degrees, added to the GDD), `session` (state machine of diagram 05, lives, score, level bonus), seeded random copied from retro-shmup. A single ball for now (MCDA 405 vs 390); the session lives in the domain, diagrams updated. Headless runs reach Victory and GameOver, deterministic per seed.
- Task #6 merged in PR #25 (squash `3e22609`), Codex review: no finding.
- Task #7 domain III: `balls` and `powerup` modules with fixed-capacity pools (MCDA 440 vs 420 pools in the world vs 320 dynamic arrays), piercing ball crushes breakable bricks in one pass, multi-ball splits every ball into three (cap 6), wide paddle, timers restart instead of stacking, effects end when a life is lost, +50 per power-up caught. A life is lost only when the last ball falls.
- Task #7 merged in PR #26 (squash `963bf0e`), Codex review: 1 finding fixed (effects end as soon as a life is lost).

## 2026-10-22
- Task #8 levels: catalogue of the 5 levels in `levels.ts` (MCDA 470 vs 405 vs 290: TS module with a stricter `loadLevel` that rejects breakable bricks walled off by unbreakable ones). Winnability is proved by a bot that aims at the nearest reachable brick, on every level alone and on the whole campaign, for three seeds. Level 4 was redesigned after the bot showed a 16-unit channel between two walls was practically unreachable.
