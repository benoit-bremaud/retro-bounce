# ADR-0003: Local CI in four tiers, no GitHub workflow

**Status:** Accepted — 2026-11-10. **Partially supersedes ADR-0002** (its "Local-first gate" and
"Commits and PRs" rows: `make verify` in a husky pre-push hook, a light `ci.yml` plus the security
workflows, commitlint). Its local-first principle stands and is taken to its end: nothing runs on
GitHub. Issue #39.

## Context

- The owner decided on 2026-11-07 that on every project all checks run locally and GitHub
  Actions is reserved for a production deploy triggered by a signed release tag (local-first CI/CD
  epic, benoit-bremaud/agents-skills#210 and #259; skill `local-ci`). GitHub Actions minutes now
  bill the account (Free plan quota exceeded in October and November 2026). The sibling game
  retro-shmup migrated first (benoit-bremaud/retro-shmup#158, ADR-0029 there); this repository
  reuses its shape.
- Every GitHub check already had a local equivalent or a free open-source one: `make verify`
  covered typecheck, lint, knip, format, tests with coverage, doc coverage, gitleaks, `pnpm audit`
  and SonarQube (ADR-0002); Semgrep Community Edition replaces CodeQL (the CodeQL CLI licence is
  limited to public repositories and the owner's rule is free open-source tools only); `pnpm
  audit` covers what Dependency review did on changed dependencies, on the whole lockfile.
- Nothing deploys through Actions: the game is not deployed yet (#15) and a release will be a
  signed tag (#16, skill `release-tag`).
- `main` carries no branch protection yet.

## Decision

1. **Four local tiers, one `just` recipe each** (skill `local-ci`), tools pinned in `mise.toml`
   with `mise.lock`, hooks by lefthook (`just setup` installs both; `mise x -- just <tier>` when
   the shell does not activate mise):

   | Tier | Recipe | Trigger | Holds | Budget |
   |---|---|---|---|---|
   | L0 | `just fast` | lefthook `pre-commit` | gitleaks on the staged files, ESLint and Prettier on the staged files, shellcheck on staged scripts; the `commit-msg` hook checks the Conventional Commit subject and scope (`scripts/check-commit-msg.sh`, the scopes of CLAUDE.md) | < 10 s |
   | L1 | `just check` | lefthook `pre-push` (clean tree required), `review-local --push` | `lint` (tsc on the three projects, ESLint, knip, Prettier, shellcheck, `lefthook validate`), `test` (Vitest with the coverage floor, doc coverage ≥ 90 %, the wiring tests `test-local-ci.sh` and `test-attest.sh`), `security` (Semgrep CE `p/javascript` + `p/typescript` on `src` and `tests`; `pnpm audit --audit-level high`), `secrets` (gitleaks 8.30.1, full history, as the workflow did) | < 3 min |
   | L2 | `just gate` | `review-local` § 2b on the pushed head, before every merge | refuses a dirty tree, a HEAD behind the base or unpushed; `check`, then `sonar` (local SonarQube with quality-gate wait, coverage report fresher than the sources, server up), then `build` (the production bundle `ci.yml` built; the browser smoke test of #11 will replace it); then the attestation | 5–15 min |
   | L3 | `just nightly` | systemd user timer `retro-bounce-nightly` (04:50, persistent) | `check`, TruffleHog over the history (offline), `mise outdated` drift on the pinned tools | none |

2. **The gate is attested** (agents-skills ADR-0003): `just gate` ends with `scripts/attest.sh
   write gate <sha>`, a signed git note on `refs/notes/gate` (`gate <owner/repo> <sha>`, SSH
   signature, namespace `local-ci`) pushed to the remote, then the commit status `gate` =
   success. The trust store is `.github/allowed_signers`, read from `origin/main`. **`just merge
   <pr>`** verifies both on the PR's exact head SHA and merges with `gh pr merge --squash
   --match-head-commit`. `attest.sh`, `test-attest.sh` and `check-cassettes.sh` are exact copies
   of the shared scripts of the owner's agent configuration (no drift between repositories).

3. **No GitHub workflow.** `ci.yml`, `codeql.yml`, `dependency-review.yml`, `gitleaks.yml` and
   `scorecard.yml` are deleted; there is no `.github/workflows/` and the wiring test fails if a
   workflow reappears. Dependabot keeps its `npm` block only. The owner's MCDA of 2026-11-07
   (retro-shmup, same situation) applies: Scorecard removed (440/500) over a `scorecard` CLI in
   `nightly` (340) and the weekly workflow kept (240), a hygiene score computed without
   GitHub-side CI or SAST would mislead; no tag-triggered `prod.yml` (485/500), nothing deploys
   through Actions. A deploy workflow arrives with #15 only if the chosen host needs one, per
   skill `release-tag`.

4. **Branch protection** of `main` requires the single status check `gate` (strict), pull
   request required, no force push, no deletion, administrators included
   (`.github/branch-protection.md`).

5. **Removed**: `Makefile`, husky, lint-staged, commitlint and its config. `make verify` is
   `just check`, `make sonar-scan` is `just sonar`. The doc coverage measure moves from the
   Makefile to `scripts/doc-coverage.sh`.

6. **Not installed, on purpose** (skill rule 1, scope the tiers to the real stack): typos (the FR
   message catalogue planned by #12 is not English text), osv-scanner and Trivy (`pnpm audit`
   audits the lockfile; no Dockerfile), actionlint and zizmor (no workflow).

## Alternatives considered

- **Keep `ci.yml` as a light server-side safety net** (ADR-0002's reason: a `--no-verify` push
  would still be caught) — rejected: the attestation replaces it; a head without a verified
  `gate` note cannot be merged, whatever was skipped locally, and the protection requires it.
- **Keep Gitleaks on GitHub as defence in depth** — rejected: the same binary runs in L0, L1 and
  the nightly; the server-side copy added a billed minute per push for a 10 s scan.
- **Keep CodeQL** (free on a public repository) — rejected: the heaviest job, and Semgrep CE gives
  a SAST pass in the pre-push tier, before the push rather than minutes after.
- **Wait for the Playwright smoke test (#11) before migrating** — rejected: the gate builds the
  bundle as `ci.yml` did; #11 swaps `build` for `smoke` in the same recipe.

## Consequences

- Zero Actions minutes; feedback at commit and push time instead of after the push.
- `main` cannot be merged without a gate attested on the exact head: the merge path is
  `just merge <pr>` after `just gate` on the pushed head (`review-local`). A squash creates a new
  `main` commit without attestation: run `just gate` again on `main` before any deploy (#15).
- First merge (bootstrap), in this order: (1) push, then `GATE_CI_CHANGE=1 just gate`, which
  posts the first `gate` status (`write` needs no trust store on `main`); (2) apply the branch
  protection with `gate` as the only required check (`.github/branch-protection.md`); (3) merge
  with `gh pr merge --squash --match-head-commit <sha>` under the owner's explicit waiver, since
  `attest.sh verify` finds no `.github/allowed_signers` on `origin/main` yet. Every later merge
  goes through `just merge`.
- The gate executes the branch's code on the owner's workstation, where the signing key, the `gh`
  token and the SonarQube token live (the Actions sandbox did that before). `just gate` therefore
  refuses a branch that changes a file defining what the gate runs — `justfile`, `lefthook.yml`,
  `mise.toml`, `mise.lock`, `scripts/`, `.github/allowed_signers`, `package.json`,
  `vitest.config.ts`, `eslint.config.mjs`, `knip.jsonc`, `sonar-project.properties`,
  `.gitleaks.toml`, `.gitleaksignore`, `.trufflehog-exclude`, `tsconfig*.json`, `vite.config.ts`,
  `.prettierignore`, `.prettierrc.json` — until the owner has read those files and sets
  `GATE_CI_CHANGE=1`, and `just merge` runs the verifier of `origin/main`, never the checkout's.
- The GitHub merge button checks the `gate` status only, which any write token could post; the
  signed note is the control, so merges go through `just merge` only.
- Accepted supply-chain gap: Semgrep installs through mise's `pipx` backend, so `mise.lock` pins
  the Semgrep version but not its Python dependencies (resolved at install time, no hashes). The
  other tools are checksummed. Revisit when a release binary reaches the mise registry.
- The Security tab loses the CodeQL and Scorecard reports; Dependabot alerts stay.
- Contributors need mise (`curl https://mise.run | sh`), then `just setup`; `sonar-scanner` stays
  a system tool (README).
- The owner's checkout runs `git config --unset core.hooksPath` once (husky's path) before
  `just setup`; the nightly timer is enabled with `systemctl --user enable --now
  retro-bounce-nightly.timer` after linking the units of `scripts/systemd/`.

## References

- Skill `local-ci` (tiers, attestation, templates); agents-skills ADR-0003 (attestation),
  ADR-0004 (prod from signed tags), #210, #259.
- benoit-bremaud/retro-shmup#158 and its ADR-0029 (reference implementation).
- ADR-0002 (toolchain and the superseded gate rows); issues #11 (smoke), #15 (deploy), #16 (release).
