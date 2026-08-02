---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

<!-- PATCHED(repository-standards): ADR-002 capability paths - [###-feature-name] placeholder replaced with slug-only [feature-name]; feature dirs carry no numeric prefix -->
**Input**: Design documents from `/specs/[feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required - its Requirements areas and Acceptance criteria are what tasks are derived from), research.md, data-model.md, contracts/

<!-- PATCHED(repository-standards): tests are not optional here. Testing strategy is one of the
     foundation decisions every repo records, and the spec's Acceptance criteria are the test
     material - upstream's "only if requested" opts a repo out of its own recorded decision. -->
**Tests**: generated per the repo's recorded testing-strategy decision, not on request. On
money, security, external-contract and data-integrity paths they are non-negotiable. Every
acceptance criterion needs a task that verifies it.

**Organization**: tasks are grouped by **requirement slice** - one per Requirements area of the
spec, carrying the acceptance criteria that verify it - so each slice can be implemented and
tested independently.

## Format: `[ID] [P?] [Slice] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Slice]**: Which requirement slice this task belongs to (e.g., S1, S2, S3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /spec-tasks command MUST replace these with actual tasks based on:
  - The Requirements areas of spec.md, each with the Acceptance criteria that verify it,
    ordered by risk x leverage (the spec states no priority - the ordering is derived)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by requirement slice so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as its own increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY requirement slice can be implemented

**⚠️ CRITICAL**: No requirement slice work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Setup database schema and migrations framework
- [ ] T005 [P] Implement authentication/authorization framework
- [ ] T006 [P] Setup API routing and middleware structure
- [ ] T007 Create base models/entities that all stories depend on
- [ ] T008 Configure error handling and logging infrastructure
- [ ] T009 Setup environment configuration management

**Checkpoint**: Foundation ready - requirement slice implementation can now begin in parallel

---

## Phase 3: Requirement slice 1 - [Requirements area] 🎯 first increment

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for Requirement slice 1 (per the repo's testing strategy) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [S1] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T011 [P] [S1] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for Requirement slice 1

- [ ] T012 [P] [S1] Create [Entity1] model in src/models/[entity1].py
- [ ] T013 [P] [S1] Create [Entity2] model in src/models/[entity2].py
- [ ] T014 [S1] Implement [Service] in src/services/[service].py (depends on T012, T013)
- [ ] T015 [S1] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T016 [S1] Add validation and error handling
- [ ] T017 [S1] Add logging for requirement slice 1 operations

**Checkpoint**: At this point, Requirement slice 1 should be fully functional and testable independently

---

## Phase 4: Requirement slice 2 - [Requirements area]

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for Requirement slice 2 (per the repo's testing strategy) ⚠️

- [ ] T018 [P] [S2] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T019 [P] [S2] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for Requirement slice 2

- [ ] T020 [P] [S2] Create [Entity] model in src/models/[entity].py
- [ ] T021 [S2] Implement [Service] in src/services/[service].py
- [ ] T022 [S2] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T023 [S2] Integrate with Requirement slice 1 components (if needed)

**Checkpoint**: At this point, Requirement slices 1 AND 2 should both work independently

---

## Phase 5: Requirement slice 3 - [Requirements area]

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for Requirement slice 3 (per the repo's testing strategy) ⚠️

- [ ] T024 [P] [S3] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T025 [P] [S3] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for Requirement slice 3

- [ ] T026 [P] [S3] Create [Entity] model in src/models/[entity].py
- [ ] T027 [S3] Implement [Service] in src/services/[service].py
- [ ] T028 [S3] Implement [endpoint/feature] in src/[location]/[file].py

**Checkpoint**: All requirement slices should now be independently functional

---

[Add more requirement slice phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple requirement slices

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit tests in tests/unit/
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all requirement slices
- **Requirement slices (Phase 3+)**: All depend on Foundational phase completion
  - Slices can then proceed in parallel (if staffed)
  - Or sequentially, in the risk x leverage order the slices were derived in
- **Polish (Final Phase)**: Depends on all desired requirement slices being complete

### Requirement slice dependencies

- **Slice 1**: Can start after Foundational (Phase 2) - no dependencies on other slices
- **Slice 2**: Can start after Foundational (Phase 2) - may integrate with S1 but must stay independently testable
- **Slice 3**: Can start after Foundational (Phase 2) - may integrate with S1/S2 but must stay independently testable

### Within each requirement slice

- Tests MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all requirement slices can start in parallel (if team capacity allows)
- All tests for a requirement slice marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different requirement slices can be worked on in parallel by different team members

---

## Parallel Example: Requirement slice 1

```bash
# Launch all tests for Requirement slice 1 together (if tests requested):
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models for Requirement slice 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### First increment (slice 1 alone)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks every slice)
3. Complete Phase 3: Requirement slice 1
4. **STOP and VALIDATE**: test slice 1 against its acceptance criteria, independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add slice 1 → test independently → deploy/demo
3. Add slice 2 → test independently → deploy/demo
4. Add slice 3 → test independently → deploy/demo
5. Each slice adds value without breaking the ones before it

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: Requirement slice 1
   - Developer B: Requirement slice 2
   - Developer C: Requirement slice 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Slice] label maps task to a specific requirement slice for traceability
- Each requirement slice should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
