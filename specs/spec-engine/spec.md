# Spec engine

**Spec tier:** buildable
**Serves:** `Spec-first PO Paula` - the clarify loop asks her exactly the questions that make a spec buildable and records her deferrals; `Coding agent` - mechanical gates it can obey; `Buildable-truth Dev Darek` picks up only ready-to-develop specs.
**Status:** live
**Success metric:** Guidance quality - clarify-gate pass rate without developer rescue.

## Purpose

The execution engine of the spec-first loop, shipped in the tree as five skills plus their shared scripts and templates: [`standard/.claude/skills/spec-*`](../../standard/.claude/skills/) and [`standard/scripts/spec/`](../../standard/scripts/spec/) (client paths `.claude/skills/spec-*` and `scripts/spec/`). Extracted from github/spec-kit v0.13.2 (ADR-015).

## Clarifications

### Session 2026-08-04

Retrofitted spec: the engine was extracted and patched before its spec existed, so there is
no clarify session to record. Every contract here was read off the shipped scripts and
skills and the decisions they cite, and the questions were settled by what already ran
rather than by asking. Written down because the status is now checked against this section,
and a `live` capability with no record of what settled it is the gap that check exists to
expose. New work on this capability goes through the loop.

### Session 2026-08-05

The clarify gate was documented as a "MANDATORY PRECHECK" in `/spec-plan` and
`/spec-tasks`'s own prompts but never called by `setup-plan.sh` / `setup-tasks.sh`
themselves - the bridge precondition `enforcement.md` already described as existing
was prose only. No question to ask: the fix is mechanical (wire the call, matching the
scripts' existing exit-code conventions) and settled by inspection of what the scripts
already do on every other precondition (missing `plan.md`, missing `spec.md`).

### Session 2026-08-05 (later)

The Provenance duty and its acceptance criterion already existed in this spec, but nothing
checked them: `setup-plan.sh`, `setup-tasks.sh`, `common.sh`, `check-prerequisites.sh` and
`tasks-template.md` carried no provenance marker at all, and `spec-impact`, `spec-reconcile`
and `spec-update` - standard-authored skills with no upstream equivalent - carried none
either. Neither gap was a design question: each file's real provenance was read off its own
git history (which hunks came from the ADR-014/ADR-015 extraction versus this week's
ADR-010 bridge-precondition fix) rather than templated, and the missing enforcement is now
`tools/provenance-check.mjs`.

## Scope

The loop, its state file, the clarify gate, the setup scripts, the templates, and the provenance duty.

## Out of scope

The spec model itself - capability specs, tiers, personas (documented at [`docs/tree/specs.md`](../../docs/tree/specs.md), read at the standard rather than copied into an adopting repo); coupling enforcement (`spec-guard.mjs`, `spec-structure.mjs`).

## Core concepts

- **The loop** - `spec-specify -> spec-clarify (gate) -> spec-plan -> spec-tasks -> spec-implement -> spec-reconcile`. Clarify chains automatically after specify, in the same session; reconcile ends a change by making spec == code == tests.
- **Capability directory** - `specs/<short-name>/`, prefix-free (ADR-002): never `NNN-slug` or timestamp prefixes; an existing directory means the same capability - update in place.
- **Ready-to-develop** - a spec that passes the clarify gate; plan and tasks refuse anything less (ADR-010).
- **The open-marker family** (ADR-024) - the bracketed `NEEDS` markers are the spec's gap list, typed by what is missing: CLARIFICATION (a question), DECISION (a missing ADR/BDR), INPUT (e.g. a UX design), ASSET (e.g. credentials) - each naming an owner. The four verbatim forms are listed in [`standard/specs/capability-spec.template.md`](../../standard/specs/capability-spec.template.md); **this spec never quotes the literal bracket prefix, deliberately** - the gate counts that string wherever it appears, a spec describing the gate included, and a spec that trips its own gate cannot be `live`. The gate counts the whole family; specify caps only CLARIFICATION markers (max 3), never the others.
- **The marker forms and the gate's headings are syntax, not prose.** They stay ASCII in a spec written in any language; the text inside a marker is prose and belongs in the spec's language. A spec whose markers were translated along with the sentence around them passed the gate with four items open, one of them a missing decision - and the asymmetry made that the likely outcome rather than an unlucky one: the missing-`## Clarifications` failure names the exact English string, so translating the heading reads as the fix. The gate therefore refuses a bracketed token that is *shaped* like a marker but is none of the four (see [working language](../../docs/method/working-language.md)).
- **One asking protocol** - specify *marks* gaps, clarify *asks* about them. Specify never questions the user: it leaves the markers and hands off. Clarify owns the protocol end to end - each question leading with a recommended answer, each answer written under `## Clarifications`. Two skills asking under two protocols raised the same gap twice and landed half the answers outside the section the gate reads.
- **Clarify is bounded by coverage, not by a count.** There is no question limit. The loop ends when every section the declared tier requires either carries a real contract or carries a typed marker; questions are batched by contract and the user is offered a stop between rounds. **Whatever is unresolved when it ends is written into the spec as a marker before the skill returns.** Upstream's five-question cap reported the remainder in a completion message instead. Gaps that `/spec-specify` marked survive that - they are in the file and the gate counts them - but the ambiguities clarify discovers in its own scan are not markers, so anything past the fifth was stated once and lost: absent from the spec, invisible to the gate, unrecoverable. The cap discarded the skill's most valuable output.
- **Requirement slice** - the unit `/spec-tasks` groups by: one Requirements area of the spec together with the acceptance criteria that verify it, ordered by risk x leverage. The upstream unit was a user story carrying a P1/P2/P3 priority; a capability spec has neither, so the slice is derived rather than read.
- **Discovery intake** (ADR-024) - specify/clarify/plan read the topic's dossier under `docs/discovery/` before asking the user: only entries newer than the dossier's `Last reconciled:` stamp are questions; a dossier is never normative (the spec has already won), and consuming a dossier marks its entries `folded-into-spec` and moves the stamp. The dossier itself is curated by the separate `discovery-digest` skill, which never writes specs.

## Data contracts

`specs/feature.json` - the engine's only state file, written by `/spec-specify` (and by path resolution when `SPECIFY_FEATURE_DIRECTORY` is set): `{ "feature_directory": "specs/<short-name>" }` (repo-root-relative). Resolution priority in `common.sh` `get_feature_paths()`: 1. `SPECIFY_FEATURE_DIRECTORY` env var (persisted to feature.json unless `--no-persist`), 2. feature.json's `feature_directory`, 3. hard error. Derived paths inside the feature directory: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`.

## Interface contracts

`scripts/spec/check-spec-clarified.sh <path-to-spec.md>` - the mechanical clarify gate (standard-authored, not upstream). PASS requires all of: a line matching `^## Clarifications`; zero occurrences of the family's bracket prefix (`[NEEDS` followed by a space - the whole family, ADR-024); zero occurrences of the family names written as a numbered list item instead of the bracket form; zero bracketed tokens shaped like a marker the gate does not recognise (an all-caps or non-ASCII word followed by a colon inside brackets, excluding markdown links); and a line matching `^## Open questions` whose section, once HTML comments and fenced blocks are stripped, holds nothing but a nothing-open statement (`none`, `none known`, `none at this time`, `no open questions`, `no known gaps`, case-insensitive, optional full stop). A fail lists every offending line with its number, so the output doubles as the gap list. Enforced twice: `/spec-plan` and `/spec-tasks`'s own prompts document it as a MANDATORY PRECHECK, and `setup-plan.sh` / `setup-tasks.sh` call it themselves on `FEATURE_SPEC` before doing anything else, aborting on any non-zero exit - the script-level call is what makes the precheck a bridge precondition rather than an instruction an agent could skip by never invoking it.

`scripts/spec/setup-plan.sh [--json]` - resolves feature paths via `common.sh`; errors if `spec.md` does not exist yet (run `/spec-specify` first); runs the clarify gate on `spec.md`, exiting 1 on failure with the gate's own message; `mkdir -p` the feature directory; and copies the plan template to `plan.md` unless it already exists (then: skip note). The gate re-runs on every invocation, including when `plan.md` already exists - a spec can regain open markers after it was planned. Prints/emits `FEATURE_SPEC`, `IMPL_PLAN`, `SPECS_DIR`, `BRANCH`.

`scripts/spec/setup-tasks.sh [--json]` - requires `plan.md` and `spec.md` to exist; runs the clarify gate on `spec.md`, exiting 1 on failure; resolves the tasks template; emits `FEATURE_DIR`, `TASKS_TEMPLATE`, `AVAILABLE_DOCS` (whichever of research.md, data-model.md, contracts/, quickstart.md exist).

Template copies source `scripts/spec/*.md` through the `resolve_template` stack: `overrides/` -> `presets/<id>/templates/` (priority-ordered) -> `extensions/<id>/templates/` -> core `scripts/spec/<name>.md`. The shipped core templates are `plan-template.md` and `tasks-template.md`; the spec itself is instantiated from `specs/capability-spec.template.md` (the standard's shape), never a vendored spec-template.

`tools/provenance-check.mjs` (this repo's own CI, never shipped) - the mechanical check for
the Provenance duty below. Scans every file directly under `standard/scripts/spec/` (except
`LICENSE`, which is the upstream licence text itself) and every `standard/.claude/skills/spec-*/SKILL.md`;
fails naming each one that carries neither the substring `github/spec-kit v0.13.2` nor
`PATCHED(repository-standards)`. `--self` runs its built-in cases.

### Errors and exit codes

| Script | Exit | Condition |
|---|---|---|
| check-spec-clarified.sh | 0 | `## Clarifications` present and zero open markers (PASS line on stdout) |
| check-spec-clarified.sh | 1 | no argument; spec file not found; no `## Clarifications`; >0 open `NEEDS`-family markers; >0 family names written as a list item instead of brackets; >0 marker-shaped tokens the gate does not recognise; no `## Open questions`; or >0 live lines under it (each listed with line numbers, stderr) |
| setup-plan.sh | 1 | feature paths unresolvable (no env var and no usable feature.json); `spec.md` missing (run /spec-specify first); `spec.md` fails the clarify gate |
| setup-tasks.sh | 1 | paths unresolvable; `plan.md` missing (run /spec-plan first); `spec.md` missing; `spec.md` fails the clarify gate; tasks template unresolvable through the stack |

## Requirements

- Scripts MUST be plain bash with graceful fallbacks (jq -> python3 -> grep/sed/awk); the gate itself uses only bash and grep.
- `/spec-specify` MUST mint prefix-free capability directories and persist `specs/feature.json`.
- The clarify loop MUST be AI-led: propose answers, ask the user only what needs their call, and record every deferral under `## Clarifications` instead of dropping it.
- **A question MUST be a question.** Each asked item leads with a full interrogative that can be answered as written, never a topic label, section heading or requirement id (an id MAY trail the question), and carries one plain-language line on what changes depending on the answer. A label is a subject; answering it means guessing what was meant, which is how a clarify round returns nothing usable.
- **Provenance duty.** The upstream MIT licence MUST ship at `scripts/spec/LICENSE` (Copyright GitHub, Inc.); every extracted file MUST carry a provenance line naming github/spec-kit v0.13.2, with standard-authored hunks and files marked `PATCHED(repository-standards)`. A hunk taken from upstream **after** the extraction point MUST be marked `CHERRY-PICKED` with the upstream commit it came from - the baseline stays v0.13.2, and every deviation from it is readable in place.
- **Staying current with upstream is a manual, per-release scan** and MUST stay one: the prompts are ours (ADR-015), so at each release the maintainer reads github/spec-kit's prompt changes since v0.13.2 and cherry-picks what earns it. No mechanical sync exists by design - it would overwrite the patches that make the engine speak this standard's spec shape.
- **Re-entry is a first-class case, not a first run repeated** (ADR-032). When `/spec-plan` runs against a
  capability whose `plan.md` already carried content or whose `tasks.md` exists, it MUST read what is there before
  generating over it, take the spec's own delta (`git diff <base> -- <FEATURE_SPEC>` - the delta `spec-update`
  establishes and nothing previously consumed), and report what the change **adds**, what it **invalidates** and what
  it leaves **untouched**. An invalidated task that is already built is drift, and MUST be filed or fixed rather than
  dropped from the new list, which would leave shipped behaviour nothing describes.
- **A regenerated task list MUST preserve progress and MUST NOT be keyed on from outside.** `/spec-tasks` over an
  existing `tasks.md` carries forward the status of every task that survives the change, and names what is new and
  what is gone. Task ids are **positional and deliberately unstable across rounds** - `T003` in one round is not
  `T003` in the next - so nothing outside `tasks.md` may key on a task id and assume it means the same work later.
  Tracker identity is an extension's concern, solved by content fingerprints, never by position.
- **Never run upstream specify.** Never install or run upstream spec-kit's own `specify` here - it mints `specs/NNN-feature/` directories that violate the capability layout. The shipped, patched skills are the sanctioned form of the engine.
- **The engine speaks the standard's spec shape.** Every skill that reads or writes a spec MUST address the sections `specs/capability-spec.template.md` declares, and MUST NOT introduce upstream's User Scenarios, Functional Requirements, Success Criteria or Key Entities. No skill MAY gate a spec on "no implementation details": the buildable tier is the default and its contracts quote real field names, enums, endpoints and error codes verbatim. What stays out of a spec is the *implementation* - which library, which framework - never the contract.
- **Tests follow the repo's recorded testing strategy**, never a per-feature request. `/spec-tasks` MUST emit the tiers that decision names, and MUST treat money, security, external-contract and data-integrity paths as non-negotiable; where no such record exists, the missing decision is itself emitted as a task. Every acceptance criterion MUST have a task that verifies it.
- **A foundation fork MUST NOT appear among the "reasonable defaults" a spec skill is told not to ask about.** The authentication method was on that list while the decision checklist makes the auth model an ADR-grade fork because retro-fitting authorization is a security minefield. A default nobody chose and nobody recorded is the failure the standard exists to stop, and the eight forks are exactly the set where guessing is forbidden.
- **Every description of the gate MUST name the whole marker family** - and the rule binds the shipped entry point and the by-reference method docs, not only the skills. Written once and applied to two of the six places that describe the gate, it left a spec blocked by a missing decision reading as ready in the other four. The gate script counts the family's bracket prefix regardless of type, so a skill, a front-matter description or an enforcement doc that mentions only CLARIFICATION tells an agent a blocked spec is ready. Clarify drives the *questions* to zero and reports DECISION, INPUT and ASSET as the blockers they are; it does not claim to clear them.
- **`## Open questions` is read, and it passes only when it says there are none.** The template makes the section required and the gate ignored it, so a spec whose open items were written there in prose reached ready-to-develop with them live - four shapes of it (prose, a question phrased as a statement, a table of gaps, an item answered above and still listed below), one of them in this repo's own committed fixture, whose backlog row said a decision blocked it while the gate called it ready. The rule MUST stay structural rather than an attempt to understand the wording: HTML comments and fenced blocks are stripped (that is where the template's guidance lives), and any remaining visible line other than a nothing-open statement is an open item. An unresolved gap therefore lives as a typed marker in the section it affects, a settled note in the section it describes, and a gap the repo will not block on in the backlog with a link.
- **The gate's own strings are syntax and MUST NOT be translated.** The four marker forms and the headings the gate reads (`## Clarifications`, `## Open questions`) stay ASCII in a spec written in any language; the text inside a marker is prose and belongs in the spec's language. The gate MUST enforce this rather than trust it: a bracketed token shaped like a typed marker but not one of the four - an all-caps or non-ASCII word followed by a colon, markdown links excluded - MUST fail the gate naming the rule and where it is written down. Trusting it was tried and it fails silently in the worst direction: the translated spec reads as ready.
- **The capability map has exactly two writers, and they are both in this engine.** `/spec-specify` MUST register a new capability in `specs/capability-map.json` when it mints the directory, and `/spec-reconcile` MUST reconcile the map (`spec-guard --audit`) before the pull request. No other skill carries the instruction: none of the twenty mentioned the map at all, so every capability was unmapped by construction and `--audit` failed whoever opened the next PR. The split is deliberate - creation is when the map goes stale, reconcile is when a refactor has moved code out from under a glob - and the audit, not prose in more skills, is what makes either stick.
- **The clarify gate has no bypass.** No skill MAY offer to skip clarification. A spike is a reason to *defer* an answer, and a recorded deferral is an answer; it is not a reason to leave the question unwritten.
- **The clarify gate MUST be called by the scripts, not only documented in the skills.** `setup-plan.sh` and `setup-tasks.sh` MUST call `check-spec-clarified.sh` on `FEATURE_SPEC` themselves and exit 1 on failure. A "MANDATORY PRECHECK" instruction in a skill's prompt is a request an agent can skip by never invoking it - the case this whole engine's clarify gate exists to stop, one layer up: a spec that reaches `plan.md` or `tasks.md` unclarified because a human, or an agent, never ran the step. The two calls are independent: a prompt that never gets read still cannot produce `plan.md` or `tasks.md` for a spec that fails the gate.
- **The engine's shell scripts MUST ship executable** (mode `100755`). Every skill invokes them by path, not through `bash`, so a non-executable bit makes the clarify gate exit 126 - and `/spec-plan` and `/spec-tasks` are told to STOP on any non-zero exit, so a permissions problem is reported to the user as a spec that failed clarification.
- **`/spec-reconcile` MUST remove the plan and task scaffolding when the work closes** (R13). It is the only step positioned to do so - it is where spec == code == tests is established - and without an owner the rule was a MUST that nothing performed and only `spec-structure` warned about. Anything the scaffolding recorded that is still true moves first: a decision to a record, an unfinished thread to the backlog, an open question to the spec. Unfinished work keeps its scaffolding.
- **`/spec-reconcile` MUST check every ADR/BDR a capability's spec or code comments cite against that record's current `Status`.** A citation is spec content like any other, so a supersession the citing prose never learned about is drift - reproduced once as five stale citations plus a stale code comment, every guard green. A citation to a since-superseded record is repointed to the superseding record; the surrounding prose is flagged for a human, and the decision record's own text is never rewritten (R6).
- **`/spec-impact` and `/spec-update` MUST file to the backlog what the current change will not address.** `docs/backlog.md`'s own feeder list names both; before this rule, neither skill mentioned the backlog at all, so an agent driving from either filed nothing and no guard noticed. `/spec-impact` files a ripple (an affected capability, a needed ADR/BDR, a code area) the analysis found but this change will not touch; `/spec-update` files a target-state delta the edited spec now describes but this change will not build. Both route through `add-to-backlog`, never a second, spec-only mechanism.
- **A skill's `description` MUST say when to reach for it, in the words a user would type.** It is the only text the model matches a request against, so a description that defines the artifact ("create or update a capability spec") never fires on the request that needs it ("we need refunds"). Provenance, licence notes and internal vocabulary belong in the file body: they consume the matching surface and match nothing a user says. MIT compliance for the extracted prompts rests on `scripts/spec/LICENSE` and the per-file provenance notes, never on the description field.
- **Every lifecycle skill MUST be model-invocable.** No shipped skill carries `disable-model-invocation`: the agent starts them from intent, not from a typed command. The entry file instructs the agent to run `spec-impact` and update the affected specs on its own when code changes, and the product's premise is a single sentence from the user - a skill the model cannot start turns that premise into a manual. Gating is done by the clarify gate and by review, never by hiding the skill from the agent.

## Invariants

- `/spec-plan` and `/spec-tasks` MUST NOT proceed on a spec that fails the clarify gate - enforced both by the skills' own MANDATORY PRECHECK and mechanically inside `setup-plan.sh` / `setup-tasks.sh`.
- `specs/feature.json` MUST always point at the capability directory the loop is operating on.
- Re-planning a capability MUST NOT silently overwrite in-flight scaffolding: either the delta is reported, or the
  run stops because the delta is empty.
- No shipped engine file MUST lack provenance (LICENSE reference or PATCHED marker).

## Acceptance criteria

- **Gate pass.** GIVEN a spec with `## Clarifications` and no open markers WHEN the gate runs THEN it prints the PASS line and exits 0.
- **Re-entry reports rather than overwrites.** GIVEN a capability with an existing `tasks.md` and a spec that has
  changed WHEN `/spec-plan` runs THEN it reports what the change adds, invalidates and leaves untouched, instead of
  regenerating the plan as though this were a first run.
- **Empty delta stops.** GIVEN existing scaffolding and a spec whose diff against the base is empty WHEN `/spec-plan`
  runs THEN it says so and does not regenerate identical artifacts.
- **Gate fail: markers.** GIVEN a spec with 2 open CLARIFICATION markers WHEN the gate runs THEN both are listed with line numbers on stderr and exit is 1.
- **Gate fail: typed family.** GIVEN a spec with one open DECISION marker naming a BDR and its owner, and no CLARIFICATION markers, WHEN the gate runs THEN the marker is listed and exit is 1 - a missing decision blocks ready-to-develop exactly like an open question (ADR-024).
- **Gate fail: a translated marker.** GIVEN a spec written in another language whose open markers were translated with it WHEN the gate runs THEN each is listed as marker-shaped but unrecognised, the failure names the marker forms as syntax that stays ASCII, and exit is 1 - it does not PASS.
- **Gate fail: an invented type.** GIVEN a spec carrying a bracketed all-caps token with a colon that is not one of the four forms WHEN the gate runs THEN it is listed and exit is 1.
- **Gate fail: a live open-questions section.** GIVEN a spec whose `## Open questions` carries anything other than a nothing-open statement - prose, a statement, a table row, or an item answered under `## Clarifications` and still listed below - WHEN the gate runs THEN each live line is listed with its number and exit is 1.
- **Gate fail: no open-questions section.** GIVEN a spec with no `## Open questions` heading, or one translated into another language, WHEN the gate runs THEN it fails naming the required heading - an absent section is indistinguishable from nothing being open.
- **The template does not trip its own rule.** GIVEN the `## Open questions` section of `specs/capability-spec.template.md` verbatim WHEN the gate runs over a spec carrying it THEN it exits 0 - the guidance is inside an HTML comment and the visible line is the nothing-open statement.
- **Ordinary markdown is not a marker.** GIVEN a spec whose prose carries markdown links (including all-caps or non-ASCII link text), task checkboxes and footnote references WHEN the gate runs THEN it exits 0 - a gate that fires on a link is one authors learn to route around.
- **Dossier precedence.** GIVEN a dossier entry marked `folded-into-spec` that differs from the spec WHEN `/spec-clarify` runs THEN no question is asked about it - a dossier is never normative.
- **A question, not a label.** GIVEN the retention rules in `FR-023` are unclear WHEN `/spec-clarify` asks about them THEN the asked item reads as an interrogative ending in `?` with the id trailing it, not as `Retention policy` or `FR-023`, and one plain line says what the answer changes.
- **Gate wired in.** GIVEN a spec failing the gate WHEN `/spec-plan` or `/spec-tasks` starts THEN the precheck exits non-zero and the skill stops, directing to `/spec-clarify`.
- **Gate enforced in the script, not just the prompt.** GIVEN a spec failing the gate WHEN `setup-plan.sh` or `setup-tasks.sh` is run directly, bypassing the skill's own prose precheck, THEN it exits 1 with the gate's failure output on stderr - an agent that never reads the skill's "MANDATORY PRECHECK" instruction still cannot produce `plan.md` or `tasks.md` for a spec that is not ready-to-develop.
- **The gate re-runs even when the plan already exists.** GIVEN `plan.md` already exists and the spec has since regained an open marker WHEN `setup-plan.sh` runs again THEN it exits 1 on the gate failure before reaching the idempotent template-copy check - the gate is not a one-time cost paid only when `plan.md` is first created.
- **State file.** GIVEN `/spec-specify user-auth` completes WHEN `specs/feature.json` is read THEN `feature_directory` is `specs/user-auth` (no numeric or timestamp prefix).
- **Existing capability.** GIVEN `specs/user-auth/` already exists WHEN specify runs for the same capability THEN the existing spec is updated in place, no sibling directory is minted.
- **A new capability is mapped when it is minted.** GIVEN `/spec-specify` mints `specs/payments/` WHEN it completes THEN `specs/capability-map.json` carries a `payments` key with proposed globs and the user is told what was added, so `spec-guard --audit` does not fail the next pull request on an unmapped spec.
- **Plan idempotent.** GIVEN `plan.md` already exists WHEN setup-plan.sh runs THEN the template copy is skipped and the existing file is untouched.
- **Tasks precondition.** GIVEN no `plan.md` WHEN setup-tasks.sh runs THEN it errors "Run /spec-plan first" and exits 1.
- **Provenance.** GIVEN any file under `scripts/spec/` or a `spec-*` skill WHEN inspected THEN it carries an upstream provenance line or a PATCHED marker, and `scripts/spec/LICENSE` is present.
- **Provenance is checked, not only stated.** GIVEN a file under `scripts/spec/` or a `spec-*` skill carrying neither marker WHEN `tools/provenance-check.mjs` runs THEN it fails naming that file - the case that shipped undetected until this check existed.
- **The sections are the standard's.** GIVEN `/spec-specify` completes for a new capability WHEN `spec.md` is read THEN it carries the template's sections (Purpose, Scope, Data contracts, Interface contracts, Requirements, Acceptance criteria, Open questions among them) and none of User Scenarios, Functional Requirements, Success Criteria or Key Entities.
- **Specify marks, clarify asks.** GIVEN a feature description that leaves two gaps WHEN `/spec-specify` completes THEN it has asked the user nothing and left two typed markers, and the following `/spec-clarify` raises them one at a time.
- **A contract is not an implementation detail.** GIVEN a buildable spec quoting real endpoints, field names and error codes WHEN the specify quality checklist runs THEN it passes - the checklist gates on the declared tier, not on the absence of technical detail.
- **Tests are not optional.** GIVEN a repo whose testing-strategy record names unit and contract tiers WHEN `/spec-tasks` runs THEN it emits test tasks for those tiers without being asked; and GIVEN a repo with no such record THEN the missing decision is emitted as a task rather than silently skipped.
- **No bypass.** GIVEN the user asks to skip clarification for an exploratory spike WHEN `/spec-clarify` runs THEN the deferral is recorded as an answer under `## Clarifications` and the gate still governs `/spec-plan` and `/spec-tasks`.
- **Nothing waits to be typed.** GIVEN any shipped lifecycle skill WHEN its front matter is read THEN it carries no `disable-model-invocation`, so the user describing an intent is enough to start it.
- **The description matches the request, not the artifact.** GIVEN a user who says "we need a way for customers to get refunds" and has never read this repo WHEN the agent decides what to do THEN `spec-specify`'s description matches that sentence; and GIVEN any shipped skill THEN its description carries no licence or provenance text.
- **A neighbouring skill's phrasing does not win by default.** GIVEN "what breaks if we change the refund window?" WHEN the agent decides what to do THEN it matches `spec-impact`, not `spec-specify` - found by blind-routing realistic utterances against every skill's name+description: `spec-update`, `spec-tasks`, `spec-impact` and `spec-clarify` each led with the mechanism performed rather than a trigger phrase a user would type, so each now quotes one in its own description.
- **The gate runs where it is invoked.** GIVEN a freshly degit'd tree WHEN `scripts/spec/check-spec-clarified.sh` is run by path as the skills run it THEN it executes and reports on the spec - it does not exit 126, which `/spec-plan` would surface as a clarification failure.
- **Closing removes the scaffolding.** GIVEN a finished change whose spec, code and tests agree WHEN `/spec-reconcile` completes THEN `plan.md`, `tasks.md` and the plan-stage artifacts are deleted and reported; GIVEN the work is not finished THEN they are left in place and the skill says so.
- **Stale citation caught, decision text untouched.** GIVEN a capability spec cites an ADR that has since flipped to `Superseded` WHEN `/spec-reconcile` runs THEN the citation is repointed to the superseding record and the surrounding prose is flagged for a human, and the cited record's own text is unchanged.
- **Ripple filed, not lost.** GIVEN `/spec-impact` finds an affected capability, a needed ADR/BDR, or a code area the current change will not address WHEN the analysis completes THEN a backlog item exists for it, sourced to the analysis; GIVEN `/spec-update` edits a spec to a target state broader than the current change WHEN the edit completes THEN a backlog item exists for the unbuilt delta, sourced to the spec diff.

## Open questions

None known.
