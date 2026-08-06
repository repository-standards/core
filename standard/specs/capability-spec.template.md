# <Capability>

<!-- A capability spec is a BUILDABLE technical spec, not a description - R9 makes
     buildable the default. Declare the tier below. Contracts are quoted
     VERBATIM (real field names, enums, error codes, endpoints), never paraphrased.
     Drop sections that genuinely do not apply. No change-log section (R4,
     ADR-018): the spec describes the present; git and the standard's changelog
     process (adopted by reference from the living standard - always latest:
     https://github.com/repository-standards/core/blob/main/docs/method/changelog-process.md)
     hold the past. -->

**Spec tier:** buildable | behavioral   <!-- declare one -->
**Serves:** `<persona from docs/personas.md>`   <!-- who this capability is for; required (ADR-006) -->
**Status:** in-refinement | ready-to-develop | in-development | live | retired   <!-- in-refinement is the draft state; `/spec-reconcile` sets this field, and the structure guard re-runs the clarify gate on any spec claiming ready-to-develop or live - so typing one early buys a failed PR, not a head start -->
<!-- Retiring a capability (the product bet is gone, a vendor replaces it, etc.): do not
     delete this file - it stays as the record of what was built and why (R4). Flip Status
     to `retired` with a link to the BDR/ADR that decided it (the decision to stop building
     something is exactly as re-litigable as the decision to build it, R5). Leave the
     capability-map.json entry in place even though its globs now match nothing - deleting
     it makes this spec directory read as an unmapped orphan spec-guard --audit would flag,
     which it is not. -->
**Success metric:** `<the KPI from PRODUCT's KPI tree this capability moves>`   <!-- PDLC-2; "n/a" needs a why -->
<!-- ADR-010: ready-to-develop requires the clarify gate - a "## Clarifications" section
     and zero open markers of the NEEDS family. Drafting early (during discovery, ADR-024)
     is encouraged: hold each gap as a typed open marker, written EXACTLY in this literal
     bracket form (the gate greps for it - anything else is invisible to it), including in
     a spec written in another language: these four forms and the `## ...` headings below
     are SYNTAX, and the gate fails a bracketed token it does not recognise. The text
     inside a marker is prose - write it in the spec's own language:
       `[NEEDS CLARIFICATION: <question>]`
       `[NEEDS DECISION: <topic>; owner: <who>]`         - a missing ADR/BDR
       `[NEEDS INPUT: <what>; owner: <who>]`             - e.g. a UX design
       `[NEEDS ASSET: <what>; owner: <who>]`             - e.g. credentials
     The gate blocks the whole family, so the open markers ARE the gap list. Enabling work
     (tokens, access, agreements) goes in front-matter keys (needs_decision_records-style)
     mirrored to the tracker as blocking Stories - never in spec prose. At live+reconciled,
     cleanup removes plan/tasks scaffolding; the spec stays. -->

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

<!-- A capability whose product is CONTENT rather than behavior - a narrative
     work's chapters, a translation catalogue, a packaging recipe, a normative
     document - has both contract sections too; they are simply not endpoints
     and tables. Its data contract is the artefact's own structure: the recipe's
     required variables, the catalogue's message ids and plural forms, the
     document's normative-statement conventions and stable anchors. Its
     interface contract is what consumes the artefact and how that consumption
     fails: the build that runs the recipe, the renderer, the importer
     downstream, and what a malformed artefact does to each. Where the repo's
     own artefact states a contract more exactly than prose could - a build
     recipe, a catalogue header, a schema - quote it verbatim and point at the
     file rather than paraphrasing it into something that will drift.
     `behavioral` is NOT the alternate path here: the contracts exist, so
     taking the escape hatch drops the only part that was checkable. -->

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

<!-- REQUIRED section, and the gate READS it: this section passes only when it says
     there are none. Keep the heading and keep "None known." below until it is not
     true any more - deleting either does not make the gate quieter, it fails.

     Anything else here is an open item however it is phrased - prose, a question
     written as a statement, a table row, or one resolved above and still listed
     below. All four shapes were found passing with the questions still live, which
     is why the rule is structural rather than a judgement about wording.

     So put each thing where it belongs:
       - an unresolved gap -> a typed marker in its own functional section
         (Requirements, Data contracts, ...); the gate holds those, and a marker
         lives in exactly ONE place. Never echo it here as well: the gate counts
         every marker in the file, so a duplicate reports twice the real number.
       - a settled note -> the section it describes.
       - a known gap the repo will not block on -> the backlog, linked from there.
     Retrofitting a spec from code, the spec<->code discrepancies you find are the
     first kind: mark them, do not narrate them here. Honesty is what keeps a
     buildable spec trustworthy, and a gate that reads this section is what keeps
     the honesty from costing nothing. -->
None known.
