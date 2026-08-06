Every decision that shapes the product or the system gets a record here. If a decision
has no record it does not exist: reviewers and agents treat undocumented divergence as a
red flag, not as somebody's prerogative. This is the folder that answers *why is it like
this* six months after everyone who was in the room has forgotten.

## What it is for

Two streams, one question each.

| | asks | folder | who overrules it |
|---|---|---|---|
| **ADR** | why, technically | `adr/` | an architect |
| **BDR** | why, for the business | `bdr/` | a product owner |

When you cannot tell which, ask who would overrule the decision. When both would, write
the BDR and let the ADR reference it.

## What goes in here

**A contestable, re-litigable trade-off.** Someone could reasonably have chosen
otherwise, and without the record the argument reopens. That is the whole test.

One file per decision, `ADR-NNN-slug.md`, three digits, gapless, never reused. A retired
record is marked `Superseded` or `Withdrawn`, never deleted, because the number stays a
permanent anchor and the history of what you believed is the point.

```markdown
# ADR-014: One authored tree

**Status:** Accepted
**Date:** 2026-07-22

## Context
The tree shipped to adopters and the repo's own working files were the same files.

## Decision
One authored tree under standard/. Repo-own material never lands in it.

## Options considered
1. Two trees, synced by a script. Rejected: the script becomes the truth.
2. One tree with an exclusion list. Rejected: the list drifts, silently.

## Consequences
tree-check gains a leak test. A repo-own file in standard/ fails the build.

## Revisit when
An adopter needs a file we keep repo-own.
```

`Revisit when` is not decoration. It names the concrete signal that would reopen the
decision, which is the difference between a record and an opinion.

Neither is `Confirmation`, and it belongs to **both** streams. It names how you would find
out the decision is not being kept - a guard, a test, a CI check, a review step, the spec it
changed - which is a different question from `Revisit when` (when to reopen it) and, in a
BDR, from `How we would know we were wrong` (that the call itself was a mistake). A business
decision with a technical consequence and no named check is the one that quietly stops being
followed; naming where compliance is checked is not designing it, which stays the ADR's job.

## What does not go in here

**How it behaves.** That is the [capability spec](specs.md). A decision record
that describes the feature has become a duplicate of the spec, and the two will disagree.

**How it is built.** That is `ARCHITECTURE.md`. There is deliberately no TDR stream:
"living technical design" is behaviour plus structure, and both already have homes.

**A settled way of doing things.** If reversing it would cost a search-and-replace it is
a convention and belongs in `AGENTS.md`. If reversing it would cost a rewrite it is a
decision. A significant choice usually produces both: the record holds the why, the
convention holds the resulting practice.

**A maybe.** `Proposed` means a decision awaiting ratification, not an idea somebody
likes. Speculation lives in [`docs/ideas/`](docs-ideas.md) and mints no record
until it is approved.

**The standard's own decisions.** An `ADR-0NN` reference inside a file the standard
shipped points at the standard's decisions, not yours. Your repo's records start at
`ADR-001` and the two numbering lines never meet.

## How you actually use it

You do not open the template. You say what happened, while you still remember:

```
> we agreed on Postgres over Mongo yesterday, mainly for the reporting joins - write it up
```

```
> we need a queue for the export jobs - record the decision first
```

The agent drafts the record with the options it can find, their trade-offs and a
recommendation, and asks only what it cannot work out. You approve; it flips to
`Accepted`.

When an accepted record turns out to be wrong, it is never edited into a new opinion:

```
> ADR-014 says one tree; we are splitting it - supersede it
```

The new record supersedes the old, and the old keeps its text plus a `Superseded by`
line.

## Which wins when two documents disagree

```
PRINCIPLES.md
  -> ADR / BDR (accepted decisions - why)
    -> specs/<capability> (behavior) + ARCHITECTURE.md (structure)
      -> conventions, agent rules, skills
        -> code
```

Higher wins. If the code disagrees with an accepted record, that is a stop-and-propose,
not a silent divergence. `specs/` and `ARCHITECTURE.md` are peers: one says what the
system does, the other how it is put together, and both answer to the decisions above
them.

## Decisions behind it

- **Records are immutable once accepted.** Editing one to match a new opinion erases
  the only evidence that the old one was ever held, which is the single thing the folder
  exists to keep.
- **[ADR-010](../decision-records/ADR-010-artifact-lifecycle-and-tracker.md) - nothing is a record
  until it is approved.** Minting an ADR for every idea was the alternative, and it fills
  a repo with decisions nobody made. Ideas got their own home instead.
- **No TDR stream.** A third record type for technical design was considered and dropped:
  everything it would hold is either behaviour (spec) or structure (`ARCHITECTURE.md`),
  and a stream with no unique content becomes the place things go to be ignored.
- **At most three options per record.** More is analysis paralysis wearing a template.
