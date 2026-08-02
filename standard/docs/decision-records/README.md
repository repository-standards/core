# Decision records: ADR / BDR

Every decision that shapes the product or the system gets a record. If a decision
has no record, it does not exist - reviewers and agents treat undocumented
divergence as a red flag.

> **Which decisions should a project even have?** See the standard's
> [decision checklist](https://github.com/repository-standards/core/blob/main/docs/method/checklist.md)
> (adopted by reference from the living standard - always latest) - the menu of forks a project keeps hitting
> (datastore, auth, API shape, release strategy, ...) with the standard's paved-road
> default for each. It drives greenfield scaffolding and the brownfield onboarding sweep.

## You have this case - say this

**You are about to pick something.** Before the code, not after:

```
> we need a queue for the export jobs - record the decision first
```

The agent drafts the record with the options it can find, their trade-offs and a
recommendation, and asks you only what it cannot decide. You approve, it flips to
`Accepted`.

**The decision already happened in a call.** The most common way a repo ends up
undocumented - say it while you still remember:

```
> we agreed on Postgres over Mongo yesterday, mainly for the reporting joins - write it up
```

**An Accepted record is now wrong.** Never edit it into a new opinion:

```
> ADR-014 says one tree; we are splitting it - supersede it
```

A new record supersedes the old one, the old one keeps its text and gains a
`Superseded by` line. The history of what you believed is the point.

**Corner case - is this a decision or just how we do things?** If reversing it would
cost a rewrite, it is a decision. If it would cost a search-and-replace, it is a
convention and belongs in `AGENTS.md`.

**Corner case - business or technical?** Ask who would overrule it. A product owner
overruling it means BDR; an architect means ADR. When both would, write the BDR and
let the ADR reference it.

Two streams, two questions - **decisions only**:

| Stream | Question | Folder | Lifecycle |
|---|---|---|---|
| **ADR** - Architecture Decision Record | *why (technical)* | `docs/decision-records/adr/` | Immutable once Accepted; change = supersede |
| **BDR** - Business Decision Record | *why (business / product)* | `docs/decision-records/bdr/` | Immutable once Accepted; change = supersede |

Naming: `ADR-NNN-slug.md` (3-digit, gapless, never reused). Same for BDR. A retired
record is marked `Superseded` / `Withdrawn`, not deleted - the number stays a
permanent anchor.

> **`ADR-0NN` inside a file the standard shipped means the standard's own decision**,
> not a record in this repo. Those live at
> [repository-standards/docs/decision-records](https://github.com/repository-standards/core/tree/main/docs/decision-records).
> This repo's own records start at `ADR-001` and are indexed in
> [`adr/README.md`](adr/README.md) - the two numbering lines never meet.

> **Decision records hold *why*, not *how it behaves*.** Behavior lives in the
> [living capability specs](../../specs/README.md); structure lives in
> `ARCHITECTURE.md`. There is no TDR stream - "living technical design" is absorbed
> by the capability specs (behavior) and `ARCHITECTURE.md` (structure). Keep each
> ADR **lean**: context, the decision, options, consequences, revisit-when - not a
> description of how the feature works.

## When to record

The ADR test: a **contestable, re-litigable trade-off** gets a record - someone
could reasonably have chosen otherwise, and without the record the debate reopens.
A settled way of doing things is not a decision; it is a **rule** in the relevant
methodology doc. A significant decision usually produces **both**: the record holds
the why, the rule holds the resulting practice - see the standard's
[taxonomy](https://github.com/repository-standards/core/blob/main/docs/method/taxonomy.md)
(adopted by reference from the living standard - always latest) for which knowledge lands where.

## Status lifecycle (ADR / BDR)

`Proposed -> Accepted -> (Superseded by ADR-MMM | Deprecated | Rejected)`.

Never edit an Accepted ADR/BDR to change the decision - write a new one that
supersedes it.

**Not a record until approved** (ADR-010): a speculative idea gets no ADR/BDR/spec -
`Proposed` means a decision awaiting ratification, not a maybe. Ideas live in
`docs/ideas/` with their own statuses and graduate into records only when approved.

## Altitude hierarchy (which wins on conflict)

```
PRINCIPLES.md
  -> ADR / BDR (accepted decisions - why)
    -> specs/<capability> (behavior - what)  +  ARCHITECTURE.md (structure - how built)
      -> conventions (incl. agent rules and skills)
        -> code
```

`specs/` and `ARCHITECTURE.md` are peers (behavior vs structure), both constrained
by the accepted decisions above them.

Higher wins. If code disagrees with an Accepted ADR, **stop** and propose a
superseding ADR - do not silently diverge.

## Governance

- One decision per record. Consider at most ~3 options - avoid analysis paralysis.
- Every ADR states **Revisit when**: the concrete signal that would reopen it.
- Link each record to the standards/docs it drives and to its issue/ticket key.
- ADR = technical why, BDR = business why. "How it behaves" belongs in the
  capability specs, "how it is structured" in `ARCHITECTURE.md` - do not restate
  those inside a decision record; link them.
