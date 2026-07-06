# Changelog

All notable changes to the standards. Semver: MAJOR = removals/breaking policy
changes, MINOR = new standards/modules, PATCH = fixes/clarifications.

## 0.6.1 - 2026-07-07

Housekeeping: reconcile drift between the source and `dist/` (no policy change).

- Renamed the standards-layer references from `CODING_STANDARDS` to `conventions`
  everywhere (the docs-hub link was dead), matching the actual `conventions.md`.
- Finished removing the TDR stream (gone since 0.3.0): dropped the stale
  `ADR / BDR / TDR` title and the "TDRs are living" line from the decision-records
  README, plus the TDR mentions in the PRINCIPLES and PRODUCT templates. The
  "there is no TDR stream" notes stay.
- `enforcement.md`: dropped the phantom `bin/sync.sh` reference (removed in 0.6.0)
  and fixed `capability-map.yml` -> `capability-map.json`.
- `CONTRIBUTING.md`: reduced to a pointer into `AGENTS.md` instead of restating its
  rules (single source of truth).
- Known remaining: source and `dist/` still diverge in content (e.g. the
  decision-records "Records vs working docs" section) - the planned source->dist
  build step will resolve this systematically.

## 0.6.0 - 2026-07-06

Restructured as a framework: source organized by concern (loose at the repo root)
plus `dist/` as the assembled result.

- Promoted the former `core/` contents to the repo root as concern folders
  (`agents/`, `claude/`, `decision-records/`, `docs/`, `github/`, `gitleaks/`,
  `skills/`, `specs/`) - the maintained source.
- Added `dist/` - the standard assembled as a real repo skeleton (the final product
  to reflect); currently a committed snapshot, a build step will keep it in sync.
- Completed the spec-first workflow in the source: `/spec-*` skills, Spec Kit setup,
  constitution bridge, `align-to-standards` skill.
- Removed the old copy mechanism (`bin/sync.sh`, `manifest.json`) - superseded by
  agent comparison. README rewritten as the framework guide.

## 0.5.0 - 2026-07-06

- **Records vs working docs** - `core/decision-records/README.md` now draws the line
  between decision records and plain working docs (research / screening / workstream
  material), with a lifecycle rule for organizing working docs: phase-boxed
  exploration in a discovery folder, standing workstreams and living libraries in
  their own top-level `docs/<workstream>/` folder. Pointer added to the agent
  conventions block (`core/agents/conventions.md`).

## 0.4.0 - 2026-07-06

Spec-policy enforcement is now shipped, not just described (proven in a pilot).

- `core/specs/spec-guard.mjs` - the coupling guard, dependency-free (Node + git),
  reads `specs/capability-map.json`. Modes: `--staged` (pre-commit warn),
  `--base <ref> [--block]` (CI).
- `core/github/workflows/spec-guard.yml` - the CI job (blocks on PR).
- `core/specs/capability-map.example.json` - example `capability -> code globs` map.
- `bin/sync.sh` now copies the guard and its workflow into a target repo;
  `enforcement.md` points at the shipped files.

## 0.3.0 - 2026-07-06

Spec model reworked: **living capability specs** as the behavioral source of truth,
decision records slimmed, TDR removed.

- **`core/specs/`** (new) - capability specs = "what the system does now", organized
  by domain not ticket. README (model + git-native change delta + workflow),
  `capability-spec.template.md`, `commands.md` (`/spec-impact` `/spec-clarify`
  `/spec-update` `/spec-analyze` `/spec-reconcile` `/spec-converge` on the Spec-Kit
  engine), `enforcement.md` (pre-commit + CI spec-policy guard: structure lint +
  code/spec coupling guard via a `capability-map`, plus an optional AI reconcile).
- **Decision records** - reduced to ADR + BDR (the *why*, kept lean). **TDR stream
  removed** - "living technical design" is absorbed by capability specs (behavior)
  and `ARCHITECTURE.md` (structure). Altitude hierarchy updated to place specs.
- **Repo docs** - `ARCHITECTURE` reframed as structure/boundaries (not behavior),
  docs hub + AGENTS updated to point at specs as the behavioral source of truth.
- Removed `core/spec-kit/` (superseded by `core/specs/`).

## 0.2.0 - 2026-07-06

Methodology layers added - the standard now carries shape, not just guardrails.

- **Decision records** (`core/decision-records/`) - ADR + BDR + TDR system:
  templates, index stubs, lifecycle, altitude hierarchy, governance.
- **Repo docs** (`core/docs/`) - mandatory templates every repo fills: `PRODUCT`
  (vision + current state), `ARCHITECTURE` (technical), `AGENTS` (entry point),
  `PRINCIPLES`, docs hub.
- **Process** (`core/spec-kit/`) - spec-driven development is core: install +
  flow + a thin `constitution.template.md` governance bridge that defers to
  AGENTS.md / ADR / standards instead of duplicating them.
- README: documented the shape-vs-content distinction and the four core layers.

## 0.1.0 - 2026-07-06

Initial core seed, extracted from an internal engineering audit.

- `core/claude/settings.baseline.json` - agent permission baseline (deny/ask) +
  two PreToolUse guards: remote-DB write guard and GitHub secrets/variables guard.
- `core/gitleaks/.gitleaks.toml` + `core/github/workflows/gitleaks.yml` - secret
  scanning (pre-commit + CI, pinned gitleaks binary).
- `core/github/pull_request_template.md` - PR template with ADR-impact section.
- `core/agents/conventions.md` - single-source conventions block (Conventional
  Commits, ticket-after-colon, no AI attribution, ASCII hyphen only) to merge into
  a repo's AGENTS.md - not duplicated into tool files.
- `core/CONTRIBUTING.md` - thin contributor guide pointing at the repo's AGENTS.md.
- `core/skills/pre-pr-review/SKILL.md` - clean-context self-review before opening a PR.
- `bin/sync.sh` - apply core into a target repo (non-clobbering, drift-aware).
- `skills/align-to-standards/SKILL.md` - agent-native reconciliation of a repo to
  the current standard.
- `manifest.json` - sha256 per core file for drift detection.
