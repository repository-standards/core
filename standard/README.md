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
| [`SPEC.md`](SPEC.md) | The standard's normative core (the numbered rules) at the pinned version | as-is |
| [`SECURITY.md`](SECURITY.md) | How to report a vulnerability; no-secrets posture | fill placeholders |
| [`standard.manifest.json`](standard.manifest.json) | Machine-readable projection of SPEC.md - what `self-verify` checks | as-is |
| `.standards-version` | The version pin - written at adoption, advanced by `update-to-version` | write at adoption |
| [`.claude/settings.json`](.claude/settings.json) | Agent permission baseline + PreToolUse guards | extend |
| [`.claude/skills/`](.claude/skills/) | the lifecycle skills: the spec family (`spec-specify`, `spec-clarify`, `spec-impact`, `spec-update`, `spec-plan`, `spec-tasks`, `spec-implement`, `spec-reconcile`) + `discovery-digest`, `pre-pr-review`, `add-to-backlog`, `update-to-version` | as-is |
| [`.github/workflows/`](.github/workflows/) | CI templates to enable per repo: `gitleaks` (secret scan), `spec-guard` (spec policy) | enable |
| [`.github/pull_request_template.md`](.github/pull_request_template.md) | PR template with ADR impact | as-is |
| [`.gitleaks.toml`](.gitleaks.toml) | Secret-scan config | as-is |
| [`scripts/`](scripts/) | Guards + tooling: `self-verify.mjs`, `spec-guard.mjs`, `spec-structure.mjs`, `schema-pair.mjs`, `changelog.mjs`; [`scripts/spec/`](scripts/spec/) holds the spec engine's shared scripts + templates (MIT, `scripts/spec/LICENSE`) | as-is |
| [`specs/`](specs/) | Living capability specs: methodology, template, enforcement, constitution | fill specs; methodology as-is |
| [`docs/`](docs/) | PRINCIPLES, ARCHITECTURE + PRODUCT (templates), `decision-records/` (ADR/BDR), `ideas/`, process docs | fill / mostly as-is |
| [`docs/runbooks/`](docs/runbooks/) | One runbook per service + `postmortems/` - operational knowledge, agent-followable | fill |
| [`changes/`](changes/) | Per-PR changelog fragments (scale profile) | as-is |

## The model

- **Behavior** = [`specs/`](specs/README.md); **decisions** = [`adr`](docs/decision-records/adr/) + [`bdr`](docs/decision-records/bdr/); **structure** = `docs/ARCHITECTURE.md`; **vision** = `docs/PRODUCT.md`.
- **Enforcement** = the guards in `scripts/` + the CI templates + the spec-first workflow.
- **Altitude** (wins on conflict): `PRINCIPLES -> ADR/BDR -> specs + ARCHITECTURE -> conventions/rules -> code`.
