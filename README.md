# retro-bounce

A retro brick-breaker (Arkanoid-style) played solo: a paddle moving left and right, a bouncing ball, bricks to break, and power-ups falling from the bricks (piercing lead ball, multi-ball, wide paddle). TypeScript strict, native Canvas 2D, Vite. Mobile-first: playable on phone, tablet and PC.

**Status:** toolchain in place (ADR-0002), no gameplay yet. Backlog: [issues](https://github.com/benoit-bremaud/retro-bounce/issues).

## Develop

Node 22 (see `.nvmrc`), pnpm 10. Install [mise](https://mise.run), then
`mise trust && mise x -- just setup` (pinned tools, dependencies, git hooks; a clone from before
ADR-0003 first runs `git config --unset core.hooksPath`), then `pnpm dev`.

Every check runs locally, no GitHub workflow (ADR-0003, skill `local-ci`): `just fast` on commit,
`just check` on push, `just gate` on the pushed head before a merge (SonarQube at
`http://localhost:9000` with `sonar-scanner` on `PATH` and the token in `$SONAR_TOKEN` or
`~/.config/sonarqube/analysis-token`), `just nightly` on a systemd timer. `just --list` lists them.

> The original game is a registered trademark. This repo uses a codename, original assets and no
> trademarked name or artwork.

- Decisions: [docs/decisions/](docs/decisions/)
- UML: [docs/architecture/diagrams/](docs/architecture/diagrams/)
