---
name: spec-plan
description: Use when a spec is settled and the question becomes how to build it - "how would we do this?", "what is the approach?". Produces the implementation plan, and refuses a spec that still has open questions rather than planning around them.
---

<!-- Based on github/spec-kit v0.13.2 (MIT - scripts/spec/LICENSE). PATCHED hunks are marked inline. -->
<!-- PATCHED(repository-standards): ADR-010 clarify gate - mandatory precheck before planning -->
**MANDATORY PRECHECK - the clarify gate.** Before anything else in this command, run `scripts/spec/check-spec-clarified.sh <FEATURE_SPEC>` from the repo root (resolve `FEATURE_SPEC` via `scripts/spec/check-prerequisites.sh --json --paths-only`). If it exits non-zero, STOP - the gate's output is the spec's gap list (open markers of the `[NEEDS ...` family: questions, missing ADR/BDR decisions, missing inputs like a UX design, missing assets like credentials - each with its owner). Report that list to the user; run the clarify loop (`/spec-clarify`) for the questions, and do not plan a spec that is not ready-to-develop. Also glance at `docs/discovery/` (standard ADR-024): if the topic's dossier has entries newer than its `Last reconciled:` stamp, route them through `/spec-clarify` first - planning on a spec that ignores fresh discovery builds the wrong thing correctly.

<!-- PATCHED(repository-standards): the feature-resolution engine trusts a persisted
     pointer over the name in front of you - close that gap before it plans the wrong spec. -->
**Also confirm you are planning the right feature.** `check-prerequisites.sh` resolves
`FEATURE_SPEC` from `SPECIFY_FEATURE_DIRECTORY` or the persisted `specs/feature.json`
pointer, never from `$ARGUMENTS` - it does not know or care what capability you meant.
If `$ARGUMENTS` names a capability, confirm the resolved `FEATURE_DIR`'s directory name
actually matches it before running `setup-plan.sh` (which mutates: it creates the
directory and copies the plan template). A stale pointer from an earlier session
silently plans a different spec than the one you were just asked about - if they
disagree, stop and ask which is correct rather than guessing.

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `scripts/spec/setup-plan.sh --json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load context**: Read FEATURE_SPEC and, IF EXISTS, `specs/constitution.md`. Load IMPL_PLAN template (already copied).

<!-- PATCHED(repository-standards): ADR-032 - re-entry. Planning a live capability again is
     the normal case, not the exception, and it used to overwrite silently. -->
2a. **Re-entry check - are you planning this capability for the second time?** If `plan.md`
   already carried content before this run, or `tasks.md` exists, then work is in flight and
   this is a **re-plan**, not a first plan. Do not overwrite and move on. Instead:
   - Read what is already there **before** generating anything over it.
   - Get the spec's own delta: `git diff <base> -- <FEATURE_SPEC>` (the branch's base, usually
     `main`). `spec-update` establishes that diff as the change; this is where it gets used.
   - Report three lists before you write, and keep them in the plan: **what the change adds**
     (no existing task covers it), **what it invalidates** (an existing task now describes
     behaviour the spec no longer asks for), and **what is untouched** (still correct, already
     built or in progress - do not re-plan it).
   - If the delta is empty but scaffolding exists, say so and stop rather than regenerating
     identical artifacts.

   An invalidated task that is **already built** is not a planning problem, it is drift:
   file it (`add-to-backlog`) or fix it in this change, and say which. Silently dropping it
   from the new task list leaves shipped behaviour nothing describes.

3. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)
   - Phase 1: Generate data-model.md, contracts/, quickstart.md
   - Re-evaluate Constitution Check post-design

## Completion Report

Command ends after Phase 1 design. Report branch, IMPL_PLAN path, and generated artifacts.

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Define interface contracts** (if project has external interfaces) → `/contracts/`:
   - Identify what interfaces the project exposes to users or other systems
   - Document the contract format appropriate for the project type
   - Examples: public APIs for libraries, command schemas for CLI tools, endpoints for web services, grammars for parsers, UI contracts for applications
   - Skip if project is purely internal (build scripts, one-off tools, etc.)

3. **Create quickstart validation guide** → `quickstart.md`:
   - Document runnable validation scenarios that prove the feature works end-to-end
   - Include prerequisites, setup commands, test/run commands, and expected outcomes
   - Use links or references to contracts and data model details instead of duplicating them
   - Do not include full implementation code, model/service/controller bodies, migrations, or complete test suites
   - Keep this artifact as a validation/run guide; implementation details belong in `tasks.md` and the implementation phase

**Output**: data-model.md, /contracts/*, quickstart.md

## Key rules

- Use absolute paths for filesystem operations; use project-relative paths for references in documentation
- ERROR on gate failures or unresolved clarifications

## Done When

- [ ] Plan workflow executed and design artifacts generated
- [ ] Completion reported to user with branch, plan path, and generated artifacts
