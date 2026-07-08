# ADR-007: Modernization is plan-then-refactor, grounded in the recorded knowledge

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-08 |
| **Author** | Łukasz Bodurka |
| **Tags** | methodology, modernization, adoption |

## Context

A common reason to reach for the standard is a repo that has fallen behind - old runtimes,
stale dependencies, dated patterns - and the owner wants it brought current. The naive move
is to start bumping: update the lockfile, chase the breakages, repeat. That loses behavior
nobody remembered was load-bearing, because the *why* of the current code was never written
down before it was changed.

The standard already reconstructs a repo's knowledge (personas, specs, decisions) during
adoption. The question ADR-007 settles: **where does modernization sit relative to that
knowledge - before it, or after it?**

## Options considered

- **A - Bump-first / reactive (status quo in most repos).** Upgrade dependencies and fix
  what breaks, iteratively. Fast to start; but every fix is a guess about intent, breaking
  changes cascade, and the repo ends "current" with quietly-different behavior and no record
  of what was traded away. This is the failure mode.
- **B - Plan-then-refactor, grounded in the recorded knowledge (recommended).** Modernize
  only **after** the adoption checkmap has documented the repo (personas, specs on the
  load-bearing paths, foundational ADRs). Then a dedicated step audits the stack, derives
  target versions and migration paths, **records each non-trivial move as an ADR/BDR before
  any code changes**, and emits a sequenced, spec-guarded migration backlog. Refactoring is
  the *execution* of a recorded plan, not the discovery of it. Cost: you cannot start the
  fun part (changing code) until the boring part (understanding + deciding) is done.
- **C - Big-bang rewrite.** Rebuild on the current stack from scratch. Occasionally right
  for a tiny or truly rotten repo, but usually the most expensive and riskiest option, and
  it throws away the behavior the specs were about to capture.

## Decision

Adopt **Option B**. Modernization is a **plan-then-refactor** activity that runs at the
**end** of adoption, grounded in the recorded knowledge:

- **Sequence is a hard rule:** understand (checkmap) -> record the decisions -> *then*
  refactor. No load-bearing change ships before the ADR that explains it.
- Each non-trivial move (major bump with breaking changes, framework swap, pattern change)
  is an **ADR/BDR** naming the affected capability specs, written **before** the code moves.
- The output is a **sequenced, counted migration backlog** (small, reversible, green steps),
  plus a **maintenance strategy** so currency is kept, not achieved once.
- Delivered by the `modernize` skill; the migration is executed against the specs + tests
  the earlier gates built.

Reject **A** (bumping before understanding loses behavior and records nothing) and **C**
(a rewrite discards the very knowledge the standard just captured), keeping **C** as a
narrow escape hatch for trivial or unsalvageable repos, recorded as its own ADR when taken.

## Consequences

- Positive: migrations serve the recorded intent; every direction change is explained and
  reversible; "current" comes with a paper trail and a maintenance rhythm, not silent drift.
- Negative / cost we accept: you must document and decide before you get to refactor -
  slower to start, deliberately. Mitigation: the adoption checkmap already produced most of
  the knowledge, so `modernize` builds on it rather than starting cold.
- Follow-ups: the `modernize` skill; a Modernize phase in `docs/adoption.md`; the migration
  backlog format (reuses the standard item shape - cap, persona, why, DoD).

## Confirmation

A modernization PR that changes a dependency major or a pattern without a preceding ADR (and
without the touched specs green) is incomplete at review - same tier as a spec missing its
error table. The `modernize` skill refuses to plan a refactor before its preconditions
(personas + specs + foundational ADRs) are met.

## Related

Builds on the adoption checkmap (`docs/adoption.md`) and buildable specs (ADR-003 - the
safety net a migration leans on). Distinct from the versioned self-update of the standard
itself (`update-to-version`). Governs the `modernize` skill. Backlog: MOD-1.
