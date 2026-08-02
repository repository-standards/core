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

The spec model itself - capability specs, tiers, personas (documented at [`docs/tree/specs.md`](../../docs/tree/specs.md), read at the standard rather than copied into an adopting repo); coupling enforcement (`spec-guard.mjs`, `spec-structure.mjs`).

## Core concepts

- **The loop** - `spec-specify -> spec-clarify (gate) -> spec-plan -> spec-tasks -> spec-implement -> spec-reconcile`. Clarify chains automatically after specify, in the same session; reconcile ends a change by making spec == code == tests.
- **Capability directory** - `specs/<short-name>/`, prefix-free (ADR-002): never `NNN-slug` or timestamp prefixes; an existing directory means the same capability - update in place.
- **Ready-to-develop** - a spec that passes the clarify gate; plan and tasks refuse anything less (ADR-010).
- **The open-marker family** (ADR-024) - `[NEEDS ...` markers are the spec's gap list, typed by what is missing: CLARIFICATION (a question), DECISION (a missing ADR/BDR), INPUT (e.g. a UX design), ASSET (e.g. credentials) - each naming an owner. The gate counts the whole family; specify caps only CLARIFICATION markers (max 3), never the others.
- **One asking protocol** - specify *marks* gaps, clarify *asks* about them. Specify never questions the user: it leaves the markers and hands off. Clarify owns the protocol end to end - each question leading with a recommended answer, each answer written under `## Clarifications`. Two skills asking under two protocols raised the same gap twice and landed half the answers outside the section the gate reads.
- **Clarify is bounded by coverage, not by a count.** There is no question limit. The loop ends when every section the declared tier requires either carries a real contract or carries a typed marker; questions are batched by contract and the user is offered a stop between rounds. **Whatever is unresolved when it ends is written into the spec as a marker before the skill returns.** Upstream's five-question cap reported the remainder in a completion message instead. Gaps that `/spec-specify` marked survive that - they are in the file and the gate counts them - but the ambiguities clarify discovers in its own scan are not markers, so anything past the fifth was stated once and lost: absent from the spec, invisible to the gate, unrecoverable. The cap discarded the skill's most valuable output.
- **Requirement slice** - the unit `/spec-tasks` groups by: one Requirements area of the spec together with the acceptance criteria that verify it, ordered by risk x leverage. The upstream unit was a user story carrying a P1/P2/P3 priority; a capability spec has neither, so the slice is derived rather than read.
- **Discovery intake** (ADR-024) - specify/clarify/plan read the topic's dossier under `docs/discovery/` before asking the user: only entries newer than the dossier's `Last reconciled:` stamp are questions; a dossier is never normative (the spec has already won), and consuming a dossier marks its entries `folded-into-spec` and moves the stamp. The dossier itself is curated by the separate `discovery-digest` skill, which never writes specs.

## Data contracts

`specs/feature.json` - the engine's only state file, written by `/spec-specify` (and by path resolution when `SPECIFY_FEATURE_DIRECTORY` is set): `{ "feature_directory": "specs/<short-name>" }` (repo-root-relative). Resolution priority in `common.sh` `get_feature_paths()`: 1. `SPECIFY_FEATURE_DIRECTORY` env var (persisted to feature.json unless `--no-persist`), 2. feature.json's `feature_directory`, 3. hard error. Derived paths inside the feature directory: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`.

## Interface contracts

`scripts/spec/check-spec-clarified.sh <path-to-spec.md>` - the mechanical clarify gate (standard-authored, not upstream). PASS requires both: a line matching `^## Clarifications`, and zero occurrences of the literal `[NEEDS ` (the whole marker family, ADR-024 - a fail lists every open marker with its line number, so the output doubles as the gap list). Baked as a MANDATORY PRECHECK into `/spec-plan` and `/spec-tasks`: they run it first and STOP on non-zero.

`scripts/spec/setup-plan.sh [--json]` - resolves feature paths via `common.sh`, `mkdir -p` the feature directory, and copies the plan template to `plan.md` unless it already exists (then: skip note). Prints/emits `FEATURE_SPEC`, `IMPL_PLAN`, `SPECS_DIR`, `BRANCH`.

`scripts/spec/setup-tasks.sh [--json]` - requires `plan.md` and `spec.md` to exist; resolves the tasks template; emits `FEATURE_DIR`, `TASKS_TEMPLATE`, `AVAILABLE_DOCS` (whichever of research.md, data-model.md, contracts/, quickstart.md exist).

Template copies source `scripts/spec/*.md` through the `resolve_template` stack: `overrides/` -> `presets/<id>/templates/` (priority-ordered) -> `extensions/<id>/templates/` -> core `scripts/spec/<name>.md`. The shipped core templates are `plan-template.md` and `tasks-template.md`; the spec itself is instantiated from `specs/capability-spec.template.md` (the standard's shape), never a vendored spec-template.

### Errors and exit codes

| Script | Exit | Condition |
|---|---|---|
| check-spec-clarified.sh | 0 | `## Clarifications` present and zero open markers (PASS line on stdout) |
| check-spec-clarified.sh | 1 | no argument; spec file not found; no `## Clarifications`; or >0 open `[NEEDS ` family markers (each listed with line numbers, stderr) |
| setup-plan.sh | 1 | feature paths unresolvable (no env var and no usable feature.json) |
| setup-tasks.sh | 1 | paths unresolvable; `plan.md` missing (run /spec-plan first); `spec.md` missing; tasks template unresolvable through the stack |

## Requirements

- Scripts MUST be plain bash with graceful fallbacks (jq -> python3 -> grep/sed/awk); the gate itself uses only bash and grep.
- `/spec-specify` MUST mint prefix-free capability directories and persist `specs/feature.json`.
- The clarify loop MUST be AI-led: propose answers, ask the user only what needs their call, and record every deferral under `## Clarifications` instead of dropping it.
- **A question MUST be a question.** Each asked item leads with a full interrogative that can be answered as written, never a topic label, section heading or requirement id (an id MAY trail the question), and carries one plain-language line on what changes depending on the answer. A label is a subject; answering it means guessing what was meant, which is how a clarify round returns nothing usable.
- **Provenance duty.** The upstream MIT licence MUST ship at `scripts/spec/LICENSE` (Copyright GitHub, Inc.); every extracted file MUST carry a provenance line naming github/spec-kit v0.13.2, with standard-authored hunks and files marked `PATCHED(repository-standards)`. A hunk taken from upstream **after** the extraction point MUST be marked `CHERRY-PICKED` with the upstream commit it came from - the baseline stays v0.13.2, and every deviation from it is readable in place.
- **Never run upstream specify.** Never install or run upstream spec-kit's own `specify` here - it mints `specs/NNN-feature/` directories that violate the capability layout. The shipped, patched skills are the sanctioned form of the engine.
- **The engine speaks the standard's spec shape.** Every skill that reads or writes a spec MUST address the sections `specs/capability-spec.template.md` declares, and MUST NOT introduce upstream's User Scenarios, Functional Requirements, Success Criteria or Key Entities. No skill MAY gate a spec on "no implementation details": the buildable tier is the default and its contracts quote real field names, enums, endpoints and error codes verbatim. What stays out of a spec is the *implementation* - which library, which framework - never the contract.
- **Tests follow the repo's recorded testing strategy**, never a per-feature request. `/spec-tasks` MUST emit the tiers that decision names, and MUST treat money, security, external-contract and data-integrity paths as non-negotiable; where no such record exists, the missing decision is itself emitted as a task. Every acceptance criterion MUST have a task that verifies it.
- **A foundation fork MUST NOT appear among the "reasonable defaults" a spec skill is told not to ask about.** The authentication method was on that list while the decision checklist makes the auth model an ADR-grade fork because retro-fitting authorization is a security minefield. A default nobody chose and nobody recorded is the failure the standard exists to stop, and the eight forks are exactly the set where guessing is forbidden.
- **Every description of the gate MUST name the whole marker family** - and the rule binds the shipped entry point and the by-reference method docs, not only the skills. Written once and applied to two of the six places that describe the gate, it left a spec blocked by a missing decision reading as ready in the other four. The gate script counts `[NEEDS ` regardless of type, so a skill, a front-matter description or an enforcement doc that mentions only CLARIFICATION tells an agent a blocked spec is ready. Clarify drives the *questions* to zero and reports DECISION, INPUT and ASSET as the blockers they are; it does not claim to clear them.
- **The clarify gate has no bypass.** No skill MAY offer to skip clarification. A spike is a reason to *defer* an answer, and a recorded deferral is an answer; it is not a reason to leave the question unwritten.
- **The engine's shell scripts MUST ship executable** (mode `100755`). Every skill invokes them by path, not through `bash`, so a non-executable bit makes the clarify gate exit 126 - and `/spec-plan` and `/spec-tasks` are told to STOP on any non-zero exit, so a permissions problem is reported to the user as a spec that failed clarification.
- **`/spec-reconcile` MUST remove the plan and task scaffolding when the work closes** (R13). It is the only step positioned to do so - it is where spec == code == tests is established - and without an owner the rule was a MUST that nothing performed and only `spec-structure` warned about. Anything the scaffolding recorded that is still true moves first: a decision to a record, an unfinished thread to the backlog, an open question to the spec. Unfinished work keeps its scaffolding.
- **A skill's `description` MUST say when to reach for it, in the words a user would type.** It is the only text the model matches a request against, so a description that defines the artifact ("create or update a capability spec") never fires on the request that needs it ("we need refunds"). Provenance, licence notes and internal vocabulary belong in the file body: they consume the matching surface and match nothing a user says. MIT compliance for the extracted prompts rests on `scripts/spec/LICENSE` and the per-file provenance notes, never on the description field.
- **Every lifecycle skill MUST be model-invocable.** No shipped skill carries `disable-model-invocation`: the agent starts them from intent, not from a typed command. The entry file instructs the agent to run `spec-impact` and update the affected specs on its own when code changes, and the product's premise is a single sentence from the user - a skill the model cannot start turns that premise into a manual. Gating is done by the clarify gate and by review, never by hiding the skill from the agent.

## Invariants

- `/spec-plan` and `/spec-tasks` MUST NOT proceed on a spec that fails the clarify gate.
- `specs/feature.json` MUST always point at the capability directory the loop is operating on.
- No shipped engine file MUST lack provenance (LICENSE reference or PATCHED marker).

## Acceptance criteria

- **Gate pass.** GIVEN a spec with `## Clarifications` and no open markers WHEN the gate runs THEN it prints the PASS line and exits 0.
- **Gate fail: markers.** GIVEN a spec with 2 `[NEEDS CLARIFICATION` markers WHEN the gate runs THEN both are listed with line numbers on stderr and exit is 1.
- **Gate fail: typed family.** GIVEN a spec with one `[NEEDS DECISION: BDR - repricing; owner: business]` marker and no CLARIFICATION markers WHEN the gate runs THEN the marker is listed and exit is 1 - a missing decision blocks ready-to-develop exactly like an open question (ADR-024).
- **Dossier precedence.** GIVEN a dossier entry marked `folded-into-spec` that differs from the spec WHEN `/spec-clarify` runs THEN no question is asked about it - a dossier is never normative.
- **A question, not a label.** GIVEN the retention rules in `FR-023` are unclear WHEN `/spec-clarify` asks about them THEN the asked item reads as an interrogative ending in `?` with the id trailing it, not as `Retention policy` or `FR-023`, and one plain line says what the answer changes.
- **Gate wired in.** GIVEN a spec failing the gate WHEN `/spec-plan` or `/spec-tasks` starts THEN the precheck exits non-zero and the skill stops, directing to `/spec-clarify`.
- **State file.** GIVEN `/spec-specify user-auth` completes WHEN `specs/feature.json` is read THEN `feature_directory` is `specs/user-auth` (no numeric or timestamp prefix).
- **Existing capability.** GIVEN `specs/user-auth/` already exists WHEN specify runs for the same capability THEN the existing spec is updated in place, no sibling directory is minted.
- **Plan idempotent.** GIVEN `plan.md` already exists WHEN setup-plan.sh runs THEN the template copy is skipped and the existing file is untouched.
- **Tasks precondition.** GIVEN no `plan.md` WHEN setup-tasks.sh runs THEN it errors "Run /spec-plan first" and exits 1.
- **Provenance.** GIVEN any file under `scripts/spec/` or a `spec-*` skill WHEN inspected THEN it carries an upstream provenance line or a PATCHED marker, and `scripts/spec/LICENSE` is present.
- **The sections are the standard's.** GIVEN `/spec-specify` completes for a new capability WHEN `spec.md` is read THEN it carries the template's sections (Purpose, Scope, Data contracts, Interface contracts, Requirements, Acceptance criteria, Open questions among them) and none of User Scenarios, Functional Requirements, Success Criteria or Key Entities.
- **Specify marks, clarify asks.** GIVEN a feature description that leaves two gaps WHEN `/spec-specify` completes THEN it has asked the user nothing and left two typed markers, and the following `/spec-clarify` raises them one at a time.
- **A contract is not an implementation detail.** GIVEN a buildable spec quoting real endpoints, field names and error codes WHEN the specify quality checklist runs THEN it passes - the checklist gates on the declared tier, not on the absence of technical detail.
- **Tests are not optional.** GIVEN a repo whose testing-strategy record names unit and contract tiers WHEN `/spec-tasks` runs THEN it emits test tasks for those tiers without being asked; and GIVEN a repo with no such record THEN the missing decision is emitted as a task rather than silently skipped.
- **No bypass.** GIVEN the user asks to skip clarification for an exploratory spike WHEN `/spec-clarify` runs THEN the deferral is recorded as an answer under `## Clarifications` and the gate still governs `/spec-plan` and `/spec-tasks`.
- **Nothing waits to be typed.** GIVEN any shipped lifecycle skill WHEN its front matter is read THEN it carries no `disable-model-invocation`, so the user describing an intent is enough to start it.
- **The description matches the request, not the artifact.** GIVEN a user who says "we need a way for customers to get refunds" and has never read this repo WHEN the agent decides what to do THEN `spec-specify`'s description matches that sentence; and GIVEN any shipped skill THEN its description carries no licence or provenance text.
- **The gate runs where it is invoked.** GIVEN a freshly degit'd tree WHEN `scripts/spec/check-spec-clarified.sh` is run by path as the skills run it THEN it executes and reports on the spec - it does not exit 126, which `/spec-plan` would surface as a clarification failure.
- **Closing removes the scaffolding.** GIVEN a finished change whose spec, code and tests agree WHEN `/spec-reconcile` completes THEN `plan.md`, `tasks.md` and the plan-stage artifacts are deleted and reported; GIVEN the work is not finished THEN they are left in place and the skill says so.

## Open questions

None known.

Staying current with upstream: the prompts are ours (ADR-015); at each release
the maintainer scans github/spec-kit's prompt changes since v0.13.2 and
cherry-picks what earns it (backlog UPSTREAM-1). No mechanical sync exists by
design.
