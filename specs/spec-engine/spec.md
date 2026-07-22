# Spec engine

**Spec tier:** buildable
**Serves:** `Spec-first PO Paula` - the clarify loop asks her exactly the questions that make a spec buildable and records her deferrals; `Coding agent` - mechanical gates it can obey; `Buildable-truth Dev Darek` picks up only ready-to-develop specs.
**Status:** live
**Success metric:** Guidance quality - clarify-gate pass rate without developer rescue.

## Purpose

The execution engine of the spec-first loop, shipped in the tree as five skills plus their shared scripts and templates: [`standard/.claude/skills/spec-*`](../../standard/.claude/skills/) and [`standard/scripts/spec/`](../../standard/scripts/spec/) (client paths `.claude/skills/spec-*` and `scripts/spec/`). Extracted from github/spec-kit v0.13.2 (ADR-015).

## Scope

The loop, its state file, the clarify gate, the setup scripts, the templates, and the provenance duty.

## Out of scope

The spec model itself - capability specs, tiers, personas (`standard/specs/README.md`); coupling enforcement (`spec-guard.mjs`, `spec-structure.mjs`).

## Core concepts

- **The loop** - `spec-specify -> spec-clarify (gate) -> spec-plan -> spec-tasks -> spec-implement -> spec-reconcile`. Clarify chains automatically after specify, in the same session; reconcile ends a change by making spec == code == tests.
- **Capability directory** - `specs/<short-name>/`, prefix-free (ADR-002): never `NNN-slug` or timestamp prefixes; an existing directory means the same capability - update in place.
- **Ready-to-develop** - a spec that passes the clarify gate; plan and tasks refuse anything less (ADR-010).

## Data contracts

`specs/feature.json` - the engine's only state file, written by `/spec-specify` (and by path resolution when `SPECIFY_FEATURE_DIRECTORY` is set): `{ "feature_directory": "specs/<short-name>" }` (repo-root-relative). Resolution priority in `common.sh` `get_feature_paths()`: 1. `SPECIFY_FEATURE_DIRECTORY` env var (persisted to feature.json unless `--no-persist`), 2. feature.json's `feature_directory`, 3. hard error. Derived paths inside the feature directory: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`.

## Interface contracts

`scripts/spec/check-spec-clarified.sh <path-to-spec.md>` - the mechanical clarify gate (standard-authored, not upstream). PASS requires both: a line matching `^## Clarifications`, and zero occurrences of the literal `[NEEDS CLARIFICATION`. Baked as a MANDATORY PRECHECK into `/spec-plan` and `/spec-tasks`: they run it first and STOP on non-zero.

`scripts/spec/setup-plan.sh [--json]` - resolves feature paths via `common.sh`, `mkdir -p` the feature directory, and copies the plan template to `plan.md` unless it already exists (then: skip note). Prints/emits `FEATURE_SPEC`, `IMPL_PLAN`, `SPECS_DIR`, `BRANCH`.

`scripts/spec/setup-tasks.sh [--json]` - requires `plan.md` and `spec.md` to exist; resolves the tasks template; emits `FEATURE_DIR`, `TASKS_TEMPLATE`, `AVAILABLE_DOCS` (whichever of research.md, data-model.md, contracts/, quickstart.md exist).

Template copies source `scripts/spec/*.md` through the `resolve_template` stack: `overrides/` -> `presets/<id>/templates/` (priority-ordered) -> `extensions/<id>/templates/` -> core `scripts/spec/<name>.md`. The shipped core templates are `plan-template.md` and `tasks-template.md`; the spec itself is instantiated from `specs/capability-spec.template.md` (the standard's shape), never a vendored spec-template.

### Errors and exit codes

| Script | Exit | Condition |
|---|---|---|
| check-spec-clarified.sh | 0 | `## Clarifications` present and zero open markers (PASS line on stdout) |
| check-spec-clarified.sh | 1 | no argument; spec file not found; no `## Clarifications`; or >0 open `[NEEDS CLARIFICATION` markers (each listed with line numbers, stderr) |
| setup-plan.sh | 1 | feature paths unresolvable (no env var and no usable feature.json) |
| setup-tasks.sh | 1 | paths unresolvable; `plan.md` missing (run /spec-plan first); `spec.md` missing; tasks template unresolvable through the stack |

## Requirements

- Scripts MUST be plain bash with graceful fallbacks (jq -> python3 -> grep/sed/awk); the gate itself uses only bash and grep.
- `/spec-specify` MUST mint prefix-free capability directories and persist `specs/feature.json`.
- The clarify loop MUST be AI-led: propose answers, ask the user only what needs their call, and record every deferral under `## Clarifications` instead of dropping it.
- **Provenance duty.** The upstream MIT licence MUST ship at `scripts/spec/LICENSE` (Copyright GitHub, Inc.); every extracted file MUST carry a provenance line naming github/spec-kit v0.13.2, with standard-authored hunks and files marked `PATCHED(repository-standards)`.
- **Never run upstream specify.** Never install or run upstream spec-kit's own `specify` here - it mints `specs/NNN-feature/` directories that violate the capability layout. The shipped, patched skills are the sanctioned form of the engine.

## Invariants

- `/spec-plan` and `/spec-tasks` MUST NOT proceed on a spec that fails the clarify gate.
- `specs/feature.json` MUST always point at the capability directory the loop is operating on.
- No shipped engine file MUST lack provenance (LICENSE reference or PATCHED marker).

## Acceptance criteria

- **Gate pass.** GIVEN a spec with `## Clarifications` and no open markers WHEN the gate runs THEN it prints the PASS line and exits 0.
- **Gate fail: markers.** GIVEN a spec with 2 `[NEEDS CLARIFICATION` markers WHEN the gate runs THEN both are listed with line numbers on stderr and exit is 1.
- **Gate wired in.** GIVEN a spec failing the gate WHEN `/spec-plan` or `/spec-tasks` starts THEN the precheck exits non-zero and the skill stops, directing to `/spec-clarify`.
- **State file.** GIVEN `/spec-specify user-auth` completes WHEN `specs/feature.json` is read THEN `feature_directory` is `specs/user-auth` (no numeric or timestamp prefix).
- **Existing capability.** GIVEN `specs/user-auth/` already exists WHEN specify runs for the same capability THEN the existing spec is updated in place, no sibling directory is minted.
- **Plan idempotent.** GIVEN `plan.md` already exists WHEN setup-plan.sh runs THEN the template copy is skipped and the existing file is untouched.
- **Tasks precondition.** GIVEN no `plan.md` WHEN setup-tasks.sh runs THEN it errors "Run /spec-plan first" and exits 1.
- **Provenance.** GIVEN any file under `scripts/spec/` or a `spec-*` skill WHEN inspected THEN it carries an upstream provenance line or a PATCHED marker, and `scripts/spec/LICENSE` is present.

## Open questions

None known.

Staying current with upstream: the prompts are ours (ADR-015); at each release
the maintainer scans github/spec-kit's prompt changes since v0.13.2 and
cherry-picks what earns it (backlog UPSTREAM-1). No mechanical sync exists by
design.
