# ADR-023: Method docs live beside the tree, not inside it

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-29 |
| **Author** | Łukasz Bodurka |
| **Tags** | structure, repo-layout, distribution, reference |

## Context

The shipped tree promised to be "the client repo at day zero", yet it carried
documents no adopted repo has a reason to own: the adoption checkmap describes
how a repo gets ON the standard (a process the client has, by definition,
finished), the repo assessment is a procedure the transition agent runs from a
checkout of this repo, and the taxonomy and decision checklist were already
`adapt: reference` - "do not copy" - while physically sitting in the copyable
tree. Worse, the reference class was internally contradictory: reference
entries carried `required: true` and self-verify checked file existence in the
client repo, mechanically forcing a copy of the thing the class says is never
copied. Every copied method doc also drifts on every standard revision - the
exact failure ADR-004 kills for decision records.

## Options considered

- **A - Reference-in-tree.** Flip the method docs to `adapt: reference` and
  leave them in the tree. Minimal churn, but the tree keeps lying about being
  the client layout, and the reference-but-shipped ambiguity grows instead of
  dying.
- **B - Method docs move out of the tree (chosen).** The tree becomes literally
  what a client repo looks like; the method manual lives beside it and reaches
  clients by reference at the pinned version.
- **C - Keep copying.** Every client carries method docs that go stale on each
  revision. Rejected on ADR-004's own logic.

## Decision

Option **B**. Concretely:

1. The standard's **method manual** lives at `docs/method/`: the adoption
   checkmap, the repo assessment, the taxonomy, the decision checklist, ways of
   working, and the changelog process. It is versioned with the standard and
   rendered on the docs site from the same source.
2. The shipped tree carries only two kinds of documents: **client-authored
   artifacts** (PRODUCT, ARCHITECTURE, PRINCIPLES, personas, backlog, records,
   ideas, journeys, research, runbooks, specs, conventions - shells and
   merge-content the client owns) and **operating manuals for shipped tools**
   (`docs/self-verify.md` beside the verifier, `specs/enforcement.md` beside
   the guards).
3. Clients adopt the method manual **by reference at the pinned version** - the
   ADR-004 mechanism, extended from decision records to method docs. The
   manifest carries them in a `references` section (id, path, purpose, rule);
   `self-verify` notes them and never checks for files, and `tree-check`
   verifies each referenced path resolves in this repo.
4. The spec's taxonomy wording follows: the map of where knowledge lands is the
   standard's, adopted by reference - not a file every client must carry.

## Consequences

- Positive: the tree is exactly "what you get" - the reference-but-shipped
  class is gone by construction; method revisions reach every client instantly
  (they read the pin, not a copy); the manifest's reference semantics finally
  match ADR-004's words.
- Negative: reading the method now needs the standards checkout or the pinned
  link (offline clients keep only their own artifacts); every existing link to
  the old tree paths had to be re-pointed once (this change); `update-to-version`
  deltas for references are metadata-only.

## Related

- ADR-004 (decisions by reference - the mechanism this extends; status notes
  the extension), ADR-008/ADR-014 (zones and the one tree - the tree's scope is
  now narrower and truer), the reference-but-shipped finding of the 2026-07-29
  review.
