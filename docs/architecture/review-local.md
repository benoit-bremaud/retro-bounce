# Local review — retro-bounce (branch docs/gameplay-uml-study vs main)

- Date: 2026-10-16
- Commit: 9bb4e1f
- Scope: branch diff main...HEAD (docs-only: 6 Mermaid diagrams + PROJECT_LOG)
- Checks run: docs-only diff, no code. Design/tests/security agents not applicable (no source). Correctness = Mermaid render check.
- Verdict: ship as-is · Must 0 · Should 1 · Nice 1
- Mode: `--push` (no QA pass on a running product, nothing to run yet)

## Pre-push gate (head SHA 9bb4e1f)
| Step | Result |
|---|---|
| 1 Tests | n/a, no code yet |
| 2 Coverage | n/a, no code yet |
| 3 SonarQube | n/a, no project configured yet |
| 4 Secrets | ✅ gitleaks clean (2 commits, full history) · no tracked .env · diff read: nothing sensitive |
| 5 QA pass | skipped (`--push`), no runnable product |
- Gate: **GREEN for push** (pre-merge steps 1-3 and 5 not applicable to a docs-only scaffold)

## 🔴 Must Have
_None._

## 🟡 Should Have
- `docs/architecture/diagrams/gameplay/03-component.md:6` `[docs]` · Stack and mobile-first rule had no ADR · ADR-0001 added in `docs/decisions/` (location follows retro-shmup).

## 🔵 Nice to Have
- `docs/architecture/` `[docs]` · No traceability matrix yet · add `traceability-matrix.md` once sequences for the other use cases exist (premature now).

## ⚪ Disagree / Intentional
- `02-sequence-brick-hit-and-power-up.md` `[design]` · Only one sequence diagram for eight use cases · simple flows stay at textual use-case level (proportionality rule, skill uml-diagram-new).

## Self-review before confirmation (fixed in this branch)
- Use case labels lacked UC numbers while sequence and spec cited UC2/UC5/UC7: numbers added.
- Spec extension 3b cited UC7 as game over, but UC7 is restart: reworded.
- Sequence skipped GameSession and data-flow bypassed it for storage, contradicting the component diagram: both aligned.
- State diagram context omitted Victory: fixed. All 6 diagrams re-rendered with mmdc.

## Veracity check against retro-shmup (2026-10-16)
- Stack, source tree, adapters and pause-on-blur verified in retro-shmup (package.json, src/, main.ts).
- ADR location corrected: retro-shmup keeps ADRs in `docs/decisions/`, so retro-bounce follows it.
- Claim "fixed step makes collisions deterministic" softened and tied to retro-shmup ADR-0002.
- Spec 3a wording fixed for multi-ball (last ball).

## Per-dimension summary
- Design: component diagram respects the dependency rule, flat layering. · Docs: template followed, no stray fences, no folder README. · Tests: n/a. · Security: no PII, no network, no secrets. · Correctness: all 6 Mermaid blocks render with mmdc.

---

# Local review — task #3 toolchain (branch chore/3-toolchain vs main)

- Date: 2026-10-19 · Commit: `783e1a7` + SECURITY.md fix · Mode: push gate
- Verdict: ship after the Should below · Must 0 · Should 1 · Nice 1

## Gate (head SHA after fix)
| Step | Result |
|---|---|
| 1 Tests | ✅ 1 unit test (placeholder), `pnpm build` ✅. E2E: none yet (issue #11) |
| 2 Coverage | tests 100 % stmts / lines, 0 branches (floor 80, ratchet 90) · docs 100 % (2/2, floor 90) |
| 3 SonarQube | ✅ QUALITY GATE STATUS: PASSED (project `retro-bounce`) |
| 4 Secrets | ✅ gitleaks clean · no tracked .env · diff read: nothing sensitive · all Actions pinned to a SHA |
| 5 QA pass | skipped (`--push`), the placeholder page only fills a canvas |

## 🟡 Should Have
- (addressed after the Codex review) `SECURITY.md` now says the feature is not enabled yet and gives a fallback. `[docs]` · original finding: the file said private vulnerability reporting is enabled, but the API reports it disabled (also on retro-blocks) · owner action: enable it in Settings > Security, or reword. Not changed by the assistant (account setting).

## 🔵 Nice to Have
- `.github/dependabot.yml` `[security]` · `dependabot_security_updates` is disabled on the repo · enable in Settings when convenient.

## Fixed during review
- `SECURITY.md` copied claims that did not apply: "Dependabot alerts enabled" reworded to version-update PRs, "hall of fame with a chosen name" replaced by best score.
- ADR numbers in copied configs renumbered ADR-0004 to ADR-0002.

## Codex review (PR #18), all three accepted
- SECURITY.md: no usable private channel while the feature is off. Reworded with a fallback, owner still to enable the feature.
- commitlint: `levels` scope missing from the allowlist. Added.
- ADR-0002 overstated that only `main.ts` touches `window`. `src/app` helpers (frame loop) need it too, so ADR and CLAUDE.md now say the `src/app` layer, not the single file.

---

# Local review — task #4 GDD (branch docs/4-gdd vs main)

- Date: 2026-10-19 · Mode: push gate · Verdict: ship · Must 0 · Should 0 · Nice 1
- Gate: `make verify` green (tests 100 %, docs 100 %, gitleaks clean, Sonar PASSED, audit clean). No runtime change, QA pass skipped.
- Veracity self-check: every issue number cited in the GDD (#8, #12, #13, #14, #17) matches the backlog, every value matches the table the owner validated, and the power-ups, brick types and session states agree with the class and state diagrams.
- Fixed during self-review: paddle keyboard speed was missing, piercing behaviour on walls and unbreakable bricks and the multi-ball split angles were unspecified, class diagram notes still said "unbreakable optional" and "durations to be set".
- 🔵 Nice: the numbers are starting points. Revisit after the first playable build (issue #9 and #10).
