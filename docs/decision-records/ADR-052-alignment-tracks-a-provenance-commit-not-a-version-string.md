# ADR-052: Alignment tracks a provenance commit, not a version string

| | |
| --- | --- |
| **Status** | Accepted (2026-08-18) |
| **Date** | 2026-08-18 |
| **Author** | Łukasz Bodurka |
| **Tags** | manifest, update-to-latest, self-verify, drift |

## Context

`.standards-version` is the only thing a repo's manifest copy carries about where it last
aligned. Since CONTRIBUTING.md's PR-bumps-PATCH-by-default rule (R18/R25), `main` can carry
unreleased change under a version number that hasn't shipped yet - so that string no longer
names one exact tree. `update-to-version` derives its delta by resolving it back to a commit
via `git log -- VERSION`, a lookup that is now ambiguous by design, not just imprecise.

A second, related gap: when the standard removes a path (a retired script, a renamed skill
folder), nothing in a repo's alignment run checks the removal actually happened. A repo that
skipped or half-applied an old update keeps the stale file forever, silently - self-verify has
no way to know the path was ever supposed to go.

## Options considered

- **Keep deriving the commit from the version string.** Rejected: the derivation is the thing
  that broke. One version number can name a range of trees on `main`, so the lookup is
  ambiguous by design now, not merely imprecise.
- **Fingerprint the shipped tree instead of naming a commit.** A content hash would identify the
  aligned-to state exactly and needs no standards-repo history. Rejected: it identifies the
  state without locating it - `git diff` needs two refs, and a hash cannot be resolved back to
  one without searching history for a tree that matches it.
- **Generate `removedPaths` from the diff between two releases.** Rejected: a diff cannot tell
  "removed" apart from "renamed" or "moved under a profile flag", and a wrong auto-entry would
  fail every adopter's CI for nothing.

## Decision

Two additions to the manifest, one per root cause:

- **`provenanceCommit`** - a new top-level field in the manifest a repo carries, holding the
  standards repo's full commit SHA it last aligned to. `update-to-version` (renamed
  `update-to-latest` - the target was always latest, never a pin, which is already
  `.standards-version`'s stated job) writes it on every successful run and reads it back to
  compute the next delta directly, instead of re-deriving a commit from the version string.
  First run after this ships: back-fill once from the old lookup, then carry forward.
  `.standards-version` keeps its current job unchanged - the human-facing bookmark, still what
  self-verify's version check and the update-watch workflow read.
- **`removedPaths`** - an append-only list in the manifest (`{ path, since, note }`),
  hand-maintained at release time the same way `CHANGELOG.md` is, not generated from a tree
  diff. `self-verify` gains a check phase: every listed path must not exist on disk, reported
  as drift like any other guard, waivable only through the existing `exceptions` mechanism. The
  check needs no provenance data - it is an unconditional existence check, so a repo that never
  had the old path passes it trivially.

## Consequences

- Positive: the delta a repo receives is computed from the tree it actually has, not guessed
  from a number that may already be stale on `main`.
- Positive: a removal the standard ships is now something CI fails on, not something a repo has
  to remember from a changelog entry.
- Cost accepted: `removedPaths` is hand-maintained, same discipline and same failure mode as
  `CHANGELOG.md` - an entry can be forgotten at release time.
- Follow-up: the one-time back-fill lookup (`git log -- VERSION`) stays in the codebase as dead
  weight once every already-aligned repo has run it once.

## Confirmation

`self-verify.mjs` reports a `removedPaths` violation the same way it reports any other guard
failure; a repo carrying a listed path with no exception fails at drift > 0.
`update-to-latest`'s SKILL.md reads `provenanceCommit` first and only falls back to the
version-string lookup when the field is absent (the back-fill case).

## Revisit when

The back-fill path (deriving `provenanceCommit` from `.standards-version` for a repo that
predates this field) stops finding a matching commit for some legitimately old repo - at that
point the fallback needs a documented failure mode instead of an assumed match.

## Related

- [ADR-004](ADR-004-standard-decisions-by-reference.md) - the exceptions mechanism this reuses
  to waive a `removedPaths` entry deliberately, rather than inventing a second escape hatch.
