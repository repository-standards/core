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
| [`CLAUDE.md`](CLAUDE.md) | The file Claude Code loads first: points at AGENTS.md **and** carries the rule to check whether a shipped skill covers the request before acting (R1) | merge |
| [`SPEC.md`](SPEC.md) | The standard's normative core (the numbered rules), as of the state this repo last aligned to | as-is |
| [`SECURITY.md`](SECURITY.md) | How to report a vulnerability; no-secrets posture | fill placeholders |
| [`standard.manifest.json`](standard.manifest.json) | Machine-readable projection of SPEC.md - what `self-verify` checks | as-is |
| `.standards-version` | The version pin - written at adoption, advanced by `update-to-version` | write at adoption |
| [`.claude/settings.json`](.claude/settings.json) | Agent permission baseline + PreToolUse guards | extend |
| [`.claude/skills/`](.claude/skills/) | the lifecycle skills: the spec family (`spec-specify`, `spec-clarify`, `spec-impact`, `spec-update`, `spec-plan`, `spec-tasks`, `spec-implement`, `spec-reconcile`) + `discovery-digest`, `pre-pr-review`, `add-to-backlog`, `update-to-version`, and the scale-only cycle family (`cycle-open`, `cycle-close`, `timeline-update`) | as-is |
| [`.github/workflows/`](.github/workflows/) | CI, live as soon as they land - not dormant templates: `spec-guard` (spec policy, on every PR), `gitleaks` (secret scan, on push + PR), `standards-update-watch` (weekly, opens an issue when a newer standard version exists). Until the first-30-minutes list in `AGENTS.md` is done they will fail; delete them until you are ready if that is not wanted | keep or delete |
| [`.github/pull_request_template.md`](.github/pull_request_template.md) | PR template with decision-record impact, ADR and BDR | as-is |
| [`.gitleaks.toml`](.gitleaks.toml) | Secret-scan config | as-is |
| [`scripts/`](scripts/) | Guards + tooling: `self-verify.mjs`, `spec-guard.mjs`, `spec-structure.mjs`, `schema-pair.mjs`, `facts-check.mjs`, `cycle-guard.mjs`, `verifyAgentGuards.sh`; [`scripts/spec/`](scripts/spec/) holds the spec engine's shared scripts + templates (MIT, `scripts/spec/LICENSE`) | as-is |
| [`specs/`](specs/) | Living capability specs: methodology, template, enforcement, constitution | fill specs; methodology as-is |
| [`docs/`](docs/) | PRINCIPLES, ARCHITECTURE + PRODUCT (templates), `decision-records/` (ADR/BDR), `ideas/`, process docs | fill / mostly as-is |
| [`docs/runbooks/`](docs/runbooks/) | One runbook per service + `postmortems/` - operational knowledge, agent-followable | fill |

## The model

- **Behavior** = [`specs/`](specs/); **decisions** = [`adr`](docs/decision-records/adr/) + [`bdr`](docs/decision-records/bdr/); **structure** = `docs/ARCHITECTURE.md`; **vision** = `docs/PRODUCT.md`.
- **Enforcement** = the guards in `scripts/` + the CI templates + the spec-first workflow.
- **Altitude** (wins on conflict): `PRINCIPLES -> ADR/BDR -> specs + ARCHITECTURE -> conventions/rules -> code`.
