# Local review — retro-bounce (branch ci/39-local-ci-no-workflows vs main)

- Date: 2026-11-10
- Commit: be30bb6 (fixes 9b3a100, report and nits 983c831, wiring test env be30bb6)
- Scope: branch diff main...HEAD — local CI (justfile, lefthook, mise, scripts, ADR-0003), five workflows, Makefile, husky and commitlint removed (#39)
- Checks run: adversarial (Opus, 2 rounds) · docs · correctness (adversarial's run of `just check`) · security (secrets step, Semgrep, audit through `just check`). Design and tests auditors not run: no application code in the diff (shell, YAML, Markdown); containers n/a (no Dockerfile).
- Verdict: ship · Must 0 · Should 0 · Nice 0 (all applied)
- Mode: `--push`

## Adversarial review (#236)
- Round 1 on `f371ab6`: Must 4 · Should 6 · Nice 3 · unverified 1 · Push gate: closed
- Round 2 on `9b3a100`: 12 fixed · 0 not fixed · 0 regressed · 1 intentional (dormant `check-cassettes.sh`) · new Must 0 · Push gate: open
- Round 3 on `be30bb6` (report commit and the wiring test no longer inheriting `SONAR_TOKEN`): 2 fixed · new Must 0 · **Push gate: open**
- Optional second review (owner's OpenAI account): ChatGPT/Codex not run

## Pre-merge gate (head SHA be30bb6)
| Step | Result |
|---|---|
| 0 CI mirror | n/a after this change: no PR workflow is left. Before it: `ci.yml` → `just lint` + `just test` + `just build` (same pnpm scripts, Node 22, pnpm 10.30.3); `gitleaks.yml` (8.30.1) → `just secrets` (gitleaks 8.30.1 in `mise.toml`); CodeQL → Semgrep CE (`just security`); Dependency review → `pnpm audit --audit-level high`; Scorecard → dropped (GitHub-only) |
| 1 Tests | ✅ 255 unit (Vitest) · ✅ 92 local CI wiring cases · ✅ 31 attestation cases · E2E/smoke: none yet (#11) |
| 2 Coverage | tests 98.65 % stmts / 92.16 % branches / 100 % funcs / 100 % lines (floor 80, Vitest thresholds 90) · docs 100 % (99/99, floor 90) |
| 3 SonarQube | ⏸ deferred to the pre-merge run (`--push`); project `retro-bounce` exists on the local server (API 200) |
| 4 Secrets | ✅ gitleaks clean (main..HEAD and full history, 23 commits) · no tracked .env · diff read: only the public SSH key and the noreply address of `.github/allowed_signers` |
| 5 E2E/smoke | ⏸ deferred to the pre-merge run (`--push`): `just gate` builds the production bundle; no browser smoke test before #11 |
- Gate: **pre-push green** — `mise x -- just check` passed (lint, test, security, secrets), SonarQube and the build deferred to `GATE_CI_CHANGE=1 just gate` on the pushed head

## 🔴 Must Have
_None open._ Round 1 raised four, fixed in `9b3a100`: the gate did not install the lockfile's dependencies and did not guard `pnpm-lock.yaml` (`justfile`); `sonar-project.properties` still named the Makefile; the PR template listed the `style` type the hook refuses and missed `deps`; `branch-protection.md` planned a Copilot/Codex reviewer against owner rule 2026-11-07.

## 🟡 Should Have
_None open._ Fixed in `9b3a100`: the protection described as already applied (`PROJECT_LOG.md`, `branch-protection.md`); README setup failing on a fresh clone (`mise trust && mise x -- just setup`); the ADR's billing argument (minutes are free on a public repository); the CI-change guard overstated in the ADR; Semgrep pin behind its release (nightly red from day one); retro-shmup issue number in the systemd unit.

## 🔵 Nice to Have
_None open._ Applied: `agents-skills#192` qualified in `check-commit-msg.sh`; nightly timer moved to 05:20 (no overlap with the other nightlies); blank line and two rewrapped lines after round 2.

## ⚪ Disagree / Intentional
- `scripts/check-cassettes.sh` `[adversarial|docs]` · unused here (no third-party call, no `record` recipe) · kept byte-identical to the shared copy because `test-attest.sh` exercises it; recorded in ADR-0003 § References.
- `justfile` doubled comments above `security`, `gate`, `sonar`, `build`, `nightly` `[adversarial]` · `just --list` shows the last line only (skill `local-ci` § Gotchas).
- `docs/architecture/review-local.md` of 2026-10-16 `[docs]` · dated record, replaced by this report (git history keeps it).

## Per-dimension summary
- Adversarial: 4 Must / 6 Should / 3 Nice in round 1, all fixed or recorded; round 2 open. · Docs: one Must (`sonar-project.properties`) and the stale ADR-0002 rows, fixed. · Correctness: `just check` green on both heads. · Security: no secret, Semgrep clean, `pnpm audit` 1 moderate (below the high floor). · Follow-ups outside this repo: retro-shmup carries the same gate install gap, Copilot wording and Semgrep drift.
