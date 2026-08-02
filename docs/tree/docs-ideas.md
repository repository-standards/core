A home for an idea that may never ship. You can explore it end to end, business shape and
technical shape included, without minting a single record. This folder exists because the
alternative is worse: either the idea dies in a chat thread, or somebody files an ADR for
it and the repo fills up with decisions nobody actually made.

## What it is for

Ideas answer **should this exist at all**. Decisions answer **which of these do we pick**.
That is the whole boundary, and it is the one people get wrong.

An idea has no owner, no estimate, and possibly no future. All three are fine. What it
does have is a file, so that the next person to think of it finds out what happened last
time.

## What goes in here

One file per idea, `docs/ideas/<slug>.md`, from the template beside it. A **slug, not a
number**: numbers are for records, and an idea is not a record.

```markdown
# Pre-approved repeat guests

**Status:** exploring

## The idea
Let hosts pre-approve a returning guest so the second booking skips manual review.

## Why it might be good
Review is the slowest step and repeat guests are the ones we already trust.

## What would have to be true
Hosts can express trust per guest, not per listing. We do not have that today.

## What breaks
Liability. A pre-approved guest who causes damage is a case nobody has ruled on.
```

The status header drives the whole lifecycle:

```
idea -> exploring -> approved | parked | dropped        (then graduated after hand-off)
```

**`parked` and `dropped` files stay**, with one line at the top saying why. That line is
the cheapest memory a repo has: it stops the same dead end being explored twice, two years
apart, by two people who never met.

## What does not go in here

**Anything that has been decided.** The moment there is an answer, it graduates: a backlog
intent is created, the spec and any records are minted through the normal flow, and the
idea flips to `graduated` with links to what it became. An `approved` idea that never
graduated is just an untracked commitment.

**A choice between two options.** "Postgres or Mongo" is a decision waiting for a record,
not an idea. If the question already assumes the thing should exist, you are past this
folder.

**Work.** An idea is not a backlog item. It has no definition of done because nobody has
agreed it should be done.

## How you actually use it

Say it before it evaporates:

```
> idea: let hosts pre-approve repeat guests so the second booking skips review
```

The agent writes the file at status `idea` and stops. No spec, no ADR, no backlog row.

When it is worth a real look:

```
> explore the pre-approval idea properly - what breaks, what it costs, who would say no
```

And both endings are said out loud, because "we quietly stopped talking about it" is not
an outcome anyone can look up:

```
> pre-approval is approved - graduate it
> pre-approval is dead: hosts do not want the liability - drop it with the reason
```

## Decisions behind it

- **[ADR-010](../decision-records/ADR-010-artifact-lifecycle-and-tracker.md) - `Proposed`
  is a decision awaiting ratification, not a maybe.** The obvious alternative was to let
  speculation live as a `Proposed` ADR. It was rejected because it makes the decision log
  unreadable: you can no longer tell what the project decided from what somebody once
  suggested. Ideas got a separate home and separate statuses instead.
- **Dropped ideas are kept, not deleted.** Deleting them saves nothing and costs the only
  record of why the answer was no.
- **Slugs, not numbers.** Numbering implies an audit trail with gaps that mean something.
  Ideas have no such obligation, and giving them one would make them feel like records.
