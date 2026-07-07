# <Capability>

<!-- A capability spec is a BUILDABLE technical spec, not a description - see
     specs/README.md "Spec depth". Declare the tier below. Contracts are quoted
     VERBATIM (real field names, enums, error codes, endpoints), never paraphrased.
     Drop sections that genuinely do not apply. -->

**Spec tier:** buildable | behavioral   <!-- declare one -->

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
success response, and EVERY error path with its exact status + error code +
message. Idempotency keys. Side effects (what state changes, what it calls).

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

- <thing> MUST NOT exceed <thing> ...
- A <x> MUST reference <y> ...

## Config & flags

<!-- env vars / feature flags that change behavior -->
| Flag | Effect |
|------|--------|
| ...  | ...    |

## Edge cases

- <case> ...

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

Unresolved *current* questions and known gaps (not-yet-wired, unverified,
undecided). Honesty here is what keeps a buildable spec trustworthy - do not gloss
a gap as if it were settled.
