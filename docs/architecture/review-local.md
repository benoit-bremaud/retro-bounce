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
- Codex review (2 findings, accepted): objective now "before losing all three lives", touch mapping fixed as relative (finger never hides the paddle), mouse absolute.
- Fixed during self-review: paddle keyboard speed was missing, piercing behaviour on walls and unbreakable bricks and the multi-ball split angles were unspecified, class diagram notes still said "unbreakable optional" and "durations to be set".
- 🔵 Nice: the numbers are starting points. Revisit after the first playable build (issue #9 and #10).

---

# Local review — task #5 domain I (branch `feat/5-domain-i` vs `main`)

- Date: 2026-10-19
- Checks run: design · docs · tests · correctness (agents) · security (inline: pure maths, no I/O, no secrets)
- Verdict: ship after fixes · Must 0 · Should 14 (all fixed) · Nice 5 (3 fixed, 2 left)

## Pre-merge gate (to be re-run on the head SHA before merge)
| Step | Result |
|---|---|
| 1 Tests | 52 unit tests green; no E2E suite yet (Playwright is issue #11) |
| 2 Coverage | tests 100 % statements / 100 % branches (floor 80) · docs 100 % (floor 90) |
| 3 SonarQube | PASSED on the first refactored scan, re-run after the review fixes |
| 4 Secrets | gitleaks clean (tree and commit) · no tracked .env · diff read: nothing sensitive |
| 5 QA pass | no UI change yet: production build smoke only, no screenshot (the game does not draw until #9) |

## Findings (reconciled)
- 🟡 [correctness+tests] a graze along a face or corner arc could break a brick without a bounce: `sweepCorner` now rejects non-approaching contacts; tests added (slide over a row, corner miss). Fixed.
- 🟡 [design+correctness] a paddle swiped into the ball's side let the ball fall through: the ball is lifted onto the paddle first; test added. Fixed.
- 🟡 [design] paddle box moved to `paddle.ts`; `consider` boolean trap removed; `Brick.rect` reuses `Rect`; `hitBrick` returns a boolean and `brickScore` gives the points; class diagram aligned. Fixed.
- 🟡 [tests] weak or wrongly passing tests rewritten (paddle width, long-frame tunnelling for the wall and the paddle, exact corner and side values). Fixed.
- 🟡 [docs] contracts of `moveBall`, `sweepCircleRect`, `resolveContact`, `findContact`, scratch objects and unbreakable hp. Fixed.
- 🔵 left: `createBall` factory kept (used by every test, no behaviour); walls now extend below the field. Nice test refinements (cap-boundary levels, `it.each` for misses) not done.
- ⚪ module-level scratch objects, `result.broken` growing up to 4 entries: intentional (ADR-0002, no allocation in the loop).


## Task #6 — domain II (branch feat/6-domain-ii)

- Date: 2026-10-19
- Checks run: design · docs · tests · correctness (agents reconciled into one list)
- Verdict: all Must and Should findings fixed in the review commit.
- Fixed: `Random` port used by the world, `StepInput` object (no 5-argument step), `startSession(seed?)`, `finished` flag removed, `LifeLost` keeps world and score, same-step "last brick and last ball" counts as cleared, `mixSeed` unsigned, tests for the transition no-op matrix, deterministic traces, headless Victory and GameOver runs.
- Pre-merge gate (local): `make verify` green (typecheck, lint, knip, format, 141 tests with coverage, doc coverage, gitleaks, audit, SonarQube gate PASSED). QA pass on the running product is not applicable yet (no UI in this task).

## Task #7 — domain III (branch feat/7-domain-iii)

- Date: 2026-10-19
- Checks run: design · docs · tests · correctness (four agents, reconciled into one list)
- Verdict: no bug found; Must (stale docs, missing end-to-end tests) and the Should items fixed in the review commit.
- Fixed: `WorldEvents.lost` meaning, `moveBall`/`stepSession`/`stepWorld` docstrings, diagrams 02, 03, 04, 05 and the GDD (power-ups vanish on life lost, timers frozen in pause); `resetBalls` no longer returns a detached ball, `stepPowerUps` lost its unused running count, `crushBrick` result now decides the piercing path; tests for life loss with several balls, same-step clear with the last ball lost and a catch, swap-remove with several power-ups, expiry by elapsed time, effects kept across catches, multi-ball cap, draw order with a full pool, seeded drops, richer determinism trace.
- Left as Nice: piercing ball dropped at more than 4 contacts in one step, timers one step short (both unnoticeable in play), a generic pool type (only two occurrences).
- Pre-merge gate (local): `make verify` green, see the PR for the final numbers. QA pass on the running product is not applicable yet (no UI).

## Task #8 — level catalogue (branch feat/8-levels)

- Date: 2026-10-22
- Checks run: design · docs · tests · correctness (four agents, reconciled into one list)
- Verdict: no Must on the source; the reachability rule matches the physics. Test findings and Should items fixed in the review commit.
- Fixed: brick letters read from `KINDS` in `assertReachable` (`kindAt`), 4-connectivity documented, "every level" wording; tests for a diagonal-only gap, a brick sealed against the right wall, a single row, a gap closed by the next wall row, and the geometry the rule relies on (grid fills the field, ball smaller than a brick); the bot counts aimed and fallback shots so the winnability proof cannot silently degrade to random bounces, and each run asserts a lives-lost bound; the tautological lives assertion removed.
- Left as Nice: bot RNG could reuse `SeededRandom`, `AIM_FROM_Y` derived from grid constants, a unit test file for `aim.ts`, a one-cell channel between two unbreakable rows still loads (topological rule only, documented in `levels.ts`), the aim targets the brick's top edge (the centre line made the bot stall on corner bricks).
- Pre-merge gate (local): `make verify` result recorded in the PR. QA pass on the running product is not applicable yet (no UI).
