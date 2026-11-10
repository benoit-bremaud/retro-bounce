# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| `main` (HEAD) | Yes |
| Anything else | No |

Only the current state of `main` receives security fixes. Tagged releases are snapshots; a fix
ships as a new release from `main`.

## Reporting a vulnerability

Please do not post details of a security problem in a public issue.

The preferred channel is GitHub's private vulnerability reporting: on the repository page, open
the **Security** tab and click **Report a vulnerability**. This feature is not enabled yet. Until
it is, open a public issue titled "Security contact request" **without any detail** and the owner
will arrange a private channel. A report should include:

- a description of the vulnerability and its potential impact;
- steps to reproduce, or a proof of concept;
- the commit or release where you observed it.

Reports are acknowledged within **72 hours**. A fix is prioritised by severity and disclosed
through a GitHub security advisory once released.

## Security practices

- **Secret detection** — Gitleaks runs locally on every commit (staged files), every push (full
  history) and nightly, with TruffleHog over the history at night. Any finding fails the check;
  there is no advisory mode for secrets.
- **Static analysis and dependencies** — Semgrep Community Edition and `pnpm audit` (HIGH and
  above) run before every push; a local SonarQube quality gate runs before every merge, which is
  attested by a signed git note on the exact head (ADR-0003). No GitHub workflow runs.
- **Dependency monitoring** — Dependabot version-update PRs are configured in `.github/dependabot.yml`.
- **No backend, no personal data** — a static web page with no server, no account and no network
  call. The best score (planned) will stay in the browser's `localStorage`
  and hold nothing personal.
- **No secrets in the repository** — the project holds no credential; real dotenv files are
  gitignored.

Thank you for helping keep the project secure.
