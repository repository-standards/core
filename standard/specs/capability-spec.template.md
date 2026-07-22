# <Capability>

<!-- A capability spec is a BUILDABLE technical spec, not a description - see
     specs/README.md "Spec depth". Declare the tier below. Contracts are quoted
     VERBATIM (real field names, enums, error codes, endpoints), never paraphrased.
     Drop sections that genuinely do not apply. No change-log section (R4,
     ADR-018): the spec describes the present; git and the changelog process
     (docs/changelog-process.md) hold the past. -->

**Spec tier:** buildable | behavioral   <!-- declare one -->
**Serves:** `<persona from docs/personas.md>`   <!-- who this capability is for; required (ADR-006) -->
**Status:** in-refinement | ready-to-develop | in-development | live
**Success metric:** `<the KPI from PRODUCT's KPI tree this capability moves>`   <!-- PDLC-2; "n/a" needs a why -->
<!-- ADR-010: ready-to-develop requires the clarify gate - a "## Clarifications" section
     and zero open clarification markers. Enabling work (tokens, access, agreements) goes
     in front-matter keys (needs_decision_records-style) mirrored to the tracker as
     blocking Stories - never in spec prose. At live+reconciled, cleanup removes
     plan/tasks scaffolding; the spec stays. -->

## Purpose

The responsibility and boundary of this capability, in one or two sentences.

## Scope

What belongs to this capability.

## Out of scope

What explicitly belongs to another capability (name it).

## Core concepts

The important business concepts and terms this capability owns.

## Data contracts

<!-- buildable: REQUIRED. Verbatim. -->
Tables / columns / types / constraints, enums, persisted JSONB or message/record
shapes this capability reads or writes. Quote real identifiers. State what each
field means and its units. Name the idempotency / correlation keys.

## Interface contracts

<!-- buildable: REQUIRED. Verbatim. -->
Every endpoint or public function this capability exposes. For each: method + path
(or signature), auth / gate, the request shape (fields, types, validation), the
success response, idempotency keys, and side effects (what state changes, what it
calls).

Errors are a **required table**, one row per error path - listing them exhaustively
is what forces reading every branch (it catches the errors prose glosses over):

| Endpoint | Status | errorCode | Message / condition |
|----------|--------|-----------|---------------------|
| ...      | ...    | ...       | ...                 |

## Algorithms & rules

<!-- buildable: REQUIRED where logic is non-trivial. -->
The computations and decision rules as numbered, implementable steps - not prose.
Include rounding, ordering, tolerances, and the concurrency / locking discipline.

## State machine

<!-- if the capability has state -->
The states, and a transition table. Mark terminal states.

| From | To | Trigger | Guard |
|------|----|---------|-------|
| ...  | ...| ...     | ...   |

## Requirements

### <Area>

- The system MUST ...
- A <entity> MAY ...
- The system MUST NOT ...

## Invariants

Each invariant MUST be covered by at least one Given/When/Then in Acceptance criteria
(an invariant nothing tests is a wish, not an invariant).

- <thing> MUST NOT exceed <thing> ...
- A <x> MUST reference <y> ...

## Config & flags

<!-- env vars / feature flags that change behavior -->
| Flag | Effect |
|------|--------|
| ...  | ...    |

## Edge cases

- <case> ...

## Trust boundaries

<!-- OPTIONAL - REQUIRED for money / auth / personal-data capabilities. -->
Who can call this, with what proof. What crosses a trust boundary and where it is
validated. Abuse cases considered.

## Cross-capability interactions

### <Other capability>

The dependency or effect (link its spec).

## Acceptance criteria

<!-- buildable: REQUIRED. The verification layer - concrete enough to become tests. -->
Given / When / Then, covering the happy path, each error path, each edge case, and
each state transition.

- **<name>.** GIVEN <state> WHEN <event> THEN <expected outcome: status, side
  effects, response>.

## Open questions

<!-- REQUIRED section. If there are genuinely none, write "None known." - do not
     delete the heading. -->
Unresolved *current* questions and known gaps (not-yet-wired, unverified,
undecided). Retrofitting a spec from code, this is where the spec<->code
discrepancies you find get recorded - each becomes a tracked issue, not a silent
gloss. Honesty here is what keeps a buildable spec trustworthy.
