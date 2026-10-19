# retro-bounce

A retro brick-breaker (Arkanoid-style) played solo: a paddle moving left and right, a bouncing ball, bricks to break, and power-ups falling from the bricks (piercing lead ball, multi-ball, wide paddle). TypeScript strict, native Canvas 2D, Vite. Mobile-first: playable on phone, tablet and PC.

**Status:** toolchain in place (ADR-0002), no gameplay yet. Backlog: [issues](https://github.com/benoit-bremaud/retro-bounce/issues).

## Develop

Node 22 (see `.nvmrc`), pnpm 10. `pnpm install`, then `pnpm dev`.

The pre-push hook runs `make verify`, which needs `gitleaks`, `sonar-scanner` and a SonarQube
server at `http://localhost:9000` (token in `$SONAR_TOKEN` or `~/.config/sonarqube/analysis-token`).

> The original game is a registered trademark. This repo uses a codename, original assets and no
> trademarked name or artwork.

- Decisions: [docs/decisions/](docs/decisions/)
- UML: [docs/architecture/diagrams/](docs/architecture/diagrams/)
