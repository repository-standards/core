# <Repo>

<!-- This is the standard skeleton (from repository-standards). In a real repo,
     replace this heading + intro with the product README. Keep the map below as a
     reference while filling the templates. -->

One-line description of the product. Entry point for agents + humans:
[`AGENTS.md`](AGENTS.md).

## What each part is

| Path | What it is | Per repo |
|------|-----------|----------|
| [`AGENTS.md`](AGENTS.md) | Entry point: altitude, conventions, red-flags, workflows | adapt |
| [`CLAUDE.md`](CLAUDE.md) | Thin router to AGENTS.md (Claude Code auto-loads it) | as-is |
| [`.claude/settings.json`](.claude/settings.json) | Agent permission baseline + PreToolUse guards (remote-DB write, GitHub secrets) | extend |
| [`.claude/skills/`](.claude/skills/) | Skills: `pre-pr-review`, `/spec-*`, `align-to-standards` | as-is |
| [`.github/workflows/`](.github/workflows/) | CI: `gitleaks` (secret scan), `spec-guard` (spec policy) | as-is |
| [`.github/pull_request_template.md`](.github/pull_request_template.md) | PR template with ADR impact | as-is |
| [`.gitleaks.toml`](.gitleaks.toml) | Secret-scan config | as-is |
| [`scripts/spec-guard.mjs`](scripts/spec-guard.mjs) | The spec-policy coupling guard | as-is |
| [`docs/PRINCIPLES.md`](docs/PRINCIPLES.md) | Engineering principles (top of the altitude) | mostly as-is |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Technical structure + boundaries (template) | fill |
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Product vision + current state (template) | fill |
| [`docs/decision-records/`](docs/decision-records/) | Decision records (the *why*, lean): `adr/` (technical) + `bdr/` (business) + a README that explains them - template + index | fill |
| [`docs/conventions.md`](docs/conventions.md) | Commit / hyphen / no-attribution conventions (merged into AGENTS.md) | as-is |
| [`specs/`](specs/) | Living capability specs: methodology, template, `/spec-*` commands, enforcement, Spec Kit setup, constitution | fill specs; methodology as-is |

## The model

- **Behavior** = [`specs/`](specs/README.md) - living capability specs (what the
  system does now), changed spec-first.
- **Decisions** = [`adr`](docs/decision-records/adr/) + [`bdr`](docs/decision-records/bdr/) - the *why*, lean.
- **Structure** = `docs/ARCHITECTURE.md`. **Vision** = `docs/PRODUCT.md`.
- **Enforcement** = hooks + CI (`gitleaks`, `spec-guard`) + the spec-first workflow.

**Altitude** (wins on conflict):
`PRINCIPLES -> ADR/BDR -> specs + ARCHITECTURE -> conventions/rules -> code`.
