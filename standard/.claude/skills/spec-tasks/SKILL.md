---
name: spec-tasks
description: Break the plan into dependency-ordered tasks; refuses a spec that fails the clarify gate (based on github/spec-kit v0.13.2, MIT - scripts/spec/LICENSE)
---

<!-- Based on github/spec-kit v0.13.2 (MIT - scripts/spec/LICENSE). PATCHED hunks are marked inline. -->
<!-- PATCHED(repository-standards): ADR-010 clarify gate - mandatory precheck before task generation -->
**MANDATORY PRECHECK - the clarify gate.** Before anything else in this command, run `scripts/spec/check-spec-clarified.sh <FEATURE_SPEC>` from the repo root (resolve `FEATURE_SPEC` via `scripts/spec/check-prerequisites.sh --json --paths-only`). If it exits non-zero, STOP and run the clarify loop (`/spec-clarify`) - do not generate tasks for a spec that is not ready-to-develop (a spec is ready only when it has a `## Clarifications` section and zero open `[NEEDS CLARIFICATION` markers).

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `scripts/spec/setup-tasks.sh --json` from repo root and parse FEATURE_DIR, TASKS_TEMPLATE, and AVAILABLE_DOCS list. `FEATURE_DIR` and `TASKS_TEMPLATE` must be absolute paths when provided. `AVAILABLE_DOCS` is a list of document names/relative paths available under `FEATURE_DIR` (for example `research.md` or `contracts/`). For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

<!-- PATCHED(repository-standards): the spec is a capability spec - it has no user stories and
     no P1/P2/P3 priorities. Its Requirements areas, each with the Acceptance criteria that
     verify them, are the unit tasks group by; this file calls that a **requirement slice**. -->

2. **Load design documents**: Read from FEATURE_DIR:
   - **Required**: plan.md (tech stack, libraries, structure), spec.md (Requirements areas, Acceptance criteria, Data and Interface contracts)
   - **Optional**: data-model.md (entities), contracts/ (interface contracts), research.md (decisions), quickstart.md (test scenarios)
   - **IF EXISTS**: Load `specs/constitution.md` for project principles and governance constraints
   - Note: Not all projects have all documents. Generate tasks based on what's available.

3. **Execute task generation workflow**:
   - Load plan.md and extract tech stack, libraries, project structure
   - Load spec.md and derive the requirement slices: one per Requirements area, each carrying
     the Acceptance criteria that verify it. Order them by risk x leverage - money, security,
     external contracts and data integrity before cosmetics - since the spec states no priority
   - Take the Data contracts and Interface contracts from the spec itself; `data-model.md` and
     `contracts/` are plan-stage scaffolding and only refine what the spec already fixed
   - If research.md exists: Extract decisions for setup tasks
   - Generate tasks organized by requirement slice (see Task Generation Rules below)
   - Generate dependency graph showing slice completion order
   - Create parallel execution examples per slice
   - Validate task completeness: every acceptance criterion has a task that verifies it, and
     every slice is independently testable

4. **Generate tasks.md**: Read the tasks template from TASKS_TEMPLATE (from the JSON output above) and use it as structure. If TASKS_TEMPLATE is empty, fall back to `scripts/spec/tasks-template.md`. Fill with:
   - Correct feature name from plan.md
   - Phase 1: Setup tasks (project initialization)
   - Phase 2: Foundational tasks (blocking prerequisites for every slice)
   - Phase 3+: One phase per requirement slice, in the risk x leverage order derived above
   - Each phase includes: the slice's goal, its acceptance criteria as the independent test
     criteria, the test tasks the repo's testing strategy calls for, implementation tasks
   - Final Phase: Polish & cross-cutting concerns
   - All tasks must follow the strict checklist format (see Task Generation Rules below)
   - Clear file paths for each task
   - Dependencies section showing slice completion order
   - Parallel execution examples per slice
   - Implementation strategy section (first increment, then incremental delivery)

## Completion Report

Output path to generated tasks.md and summary:
- Total task count
- Task count per requirement slice
- Parallel opportunities identified
- Independent test criteria for each slice
- Suggested first increment (usually the highest risk x leverage slice alone)
- Any acceptance criterion left without a verifying task, named explicitly
- Format validation: Confirm ALL tasks follow the checklist format (checkbox, ID, labels, file paths)

Context for task generation: $ARGUMENTS

The tasks.md should be immediately executable - each task must be specific enough that an LLM can complete it without additional context.

## Task Generation Rules

<!-- PATCHED(repository-standards): the spec has no user stories - it is a capability spec.
     Tasks group by the requirement and the acceptance criteria that verify it. -->
**CRITICAL**: Tasks MUST be organized by requirement, each carrying the acceptance criteria
that verify it, so a slice can be implemented and tested independently.

<!-- PATCHED(repository-standards): tests are not a per-feature preference here. Testing
     strategy is one of the foundation forks every repo must consciously decide and record
     (R7), and a spec's Acceptance criteria are the test material. Upstream's "only if
     requested" quietly opts a repo out of its own recorded decision, one feature at a time. -->
**Tests follow the repo's recorded testing strategy**, never a per-feature preference. Read
the testing-strategy decision record and generate the tiers it names. On money, security,
external-contract and data-integrity paths they are non-negotiable. Every acceptance
criterion in the spec is test material: a criterion with no task that verifies it is drift
`/spec-reconcile` will report later, at a worse moment. If the repo has no testing-strategy
record yet, say so and file it - that missing decision is itself a task.

### Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```text
- [ ] [TaskID] [P?] [Slice?] Description with file path
```

**Format Components**:

1. **Checkbox**: ALWAYS start with `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential number (T001, T002, T003...) in execution order
3. **[P] marker**: Include ONLY if task is parallelizable (different files, no dependencies on incomplete tasks)
4. **[Slice] label**: REQUIRED for requirement-slice phase tasks only
   - Format: [S1], [S2], [S3], etc. (maps to the Requirements areas of spec.md)
   - Setup phase: NO slice label
   - Foundational phase: NO slice label
   - Requirement-slice phases: MUST have slice label
   - Polish phase: NO slice label
5. **Description**: Clear action with exact file path

**Examples**:

- ✅ CORRECT: `- [ ] T001 Create project structure per implementation plan`
- ✅ CORRECT: `- [ ] T005 [P] Implement authentication middleware in src/middleware/auth.py`
- ✅ CORRECT: `- [ ] T012 [P] [S1] Create User model in src/models/user.py`
- ✅ CORRECT: `- [ ] T014 [S1] Implement UserService in src/services/user_service.py`
- ❌ WRONG: `- [ ] Create User model` (missing ID and slice label)
- ❌ WRONG: `T001 [S1] Create model` (missing checkbox)
- ❌ WRONG: `- [ ] [S1] Create User model` (missing Task ID)
- ❌ WRONG: `- [ ] T001 [S1] Create model` (missing file path)

### Task Organization

1. **From the Requirements areas (spec.md)** - PRIMARY ORGANIZATION:
   - Each requirement slice gets its own phase
   - Map all related components to their slice:
     - Models needed for that slice
     - Services needed for that slice
     - Interfaces/UI needed for that slice
     - The test tasks the repo's testing strategy calls for, specific to that slice
   - Mark slice dependencies (most slices should be independent)

2. **From the Interface contracts (spec.md)**:
   - Map each endpoint or public function → to the slice it serves
   - Each row of the spec's error table is a behaviour to implement and to verify, not a
     footnote - it is what makes the contract exhaustive rather than illustrative
   - Contract test task [P] before implementation in that slice's phase

3. **From the Data contracts (spec.md)**:
   - Map each table, column, enum and constraint to the slice(s) that need it
   - If it serves several slices: put it in the earliest slice or the Setup phase
   - Where the repo owns the database, the DDL and its typed twin move together, in one task -
     they are a declared 1:1 pair and a guard checks it

4. **From Setup/Infrastructure**:
   - Shared infrastructure → Setup phase (Phase 1)
   - Foundational/blocking tasks → Foundational phase (Phase 2)
   - Slice-specific setup → within that slice's phase

### Phase Structure

- **Phase 1**: Setup (project initialization)
- **Phase 2**: Foundational (blocking prerequisites - MUST complete before any slice)
- **Phase 3+**: Requirement slices, in the risk x leverage order derived from the spec
  - Within each slice: Tests → Models → Services → Endpoints → Integration
  - Each phase should be a complete, independently testable increment
- **Final Phase**: Polish & Cross-Cutting Concerns

## Done When

- [ ] tasks.md generated with all phases, task IDs, and file paths
- [ ] Completion reported to user with task count, the per-slice breakdown, the first
      increment, and any acceptance criterion left without a verifying task
