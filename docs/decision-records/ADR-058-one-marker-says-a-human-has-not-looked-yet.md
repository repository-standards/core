---
status: Accepted
date: 2026-09-03
---

# ADR-058: one marker says a human has not looked yet

## Context

ADR-057 gave the two answers that leave work for a person (ADR-054's `suggest` and `stub`)
two markers on the artifact's first line: `[NEEDS REVIEW]` for content the run drafted,
`[STUB]` for a file nothing was written into. The maintainer applied the convention to a
real adoption on the day it was cut, and the second marker earned nothing there. What a
reader, and the check `NEEDS-REVIEW-2` will add, want from the line is one fact: has a
person looked at this file yet. Both markers answer no. Whether the text under the marker is
a draft or nothing at all is visible from the file itself; a marker that restates it puts two
strings where one grep should do, and two words to teach in every place the convention is
named.

The `[STUB]` line was also the less useful of the two. "Nothing written here yet - architect
fills it" tells the architect who is on the hook and not what the file is for. The run knew
that when it chose to leave the file rather than guess, and the line threw it away.

## Options considered

- **Keep both markers** - an empty file is told apart from a draft without opening it. The
  reader who never opens the file is the check, and the check reads the whole line anyway;
  the cost is two strings to grep for and keep in step everywhere the convention is written.
- **One marker, and the empty case says what belongs in the file** - the state a reader
  cares about has one name; a draft and an empty file differ in what the line says after
  it, and the empty line carries the one sentence that replaces the `[STUB]` word.

## Decision

**`[NEEDS REVIEW]` is the only marker.** It sits directly under the title as before, so a
check or a reader greps for one string. What follows the marker is what differs:

```
> [NEEDS REVIEW] drafted by the adoption run on 2026-09-03 from the route table and
> `roles.js`. Backlog: PERSONAS-1.

> [NEEDS REVIEW] nothing written here yet; should hold the options weighed and the reason
> the team keeps Postgres. Backlog: ADR-013-1.
```

- A drafted artifact's line is as ADR-057 had it, minus one field: what it was drafted
  from, and which backlog row tracks it. It does not name who acts on it - the artifact's
  own kind already says that (an ADR reads as technical, a BDR and `docs/personas.md` as
  product), and a role word in every marker would duplicate what the file already is. A
  team small enough to run this standard at `core` (one or two people) does not need a
  field to tell it which of them a persona roster is for.
- An empty artifact's line says that nothing is written yet, **what the file should
  contain** in one sentence so whoever fills it knows the target, and the backlog row.
- Everything else in ADR-057 stands: one backlog row per marked file, a drafted decision
  record is `Proposed`, the marker leaves in the commit that verifies the content and with
  nothing else, and the percentage does not move (ADR-038). The companion count
  `NEEDS-REVIEW-2` adds is one flat number; a team that wants to know who should look at an
  entry reads the backlog row the marker names, which already says what kind of work it is.

## Consequences

- Positive: one string to grep, teach and check; an empty file says what it is for instead
  of only that it is empty; the drafted case, the common one, does not change at all.
- Cost we accept: the count no longer splits drafted from empty for free. The split was a
  property of the marker word, and the word is gone; the line still carries it for anyone
  who reads it.
- ADR-057 stays the record of why a marker exists at all; its `[STUB]` clause is narrowed
  to this, so its status becomes `Accepted, revised by 058`. The three backlog rows under
  "Adoption leaves the human work visible" carry the single marker from here. Nothing in
  the shipped tree changes, because `NEEDS-REVIEW-1` had not landed.

## Confirmation

As for ADR-057: nothing mechanical until `NEEDS-REVIEW-2`, which now scans for one string.
Until then a run that writes `[STUB]`, or an empty artifact whose line does not say what the
file should hold, is a defect against this record at the adoption's pre-PR review.

## Revisit when

- The check lands and a real repository's team wants drafts and empty files apart on the
  dashboard without opening the files. That is the case for a second word, and it should
  arrive with the count that needs it, not ahead of it.
- Any of ADR-057's own triggers: they reopen the marker, not only its word.

## Related

- ADR-057 - the record this narrows; everything not named here is unchanged.
- ADR-054 - the three answers to a question stay three; two of them share one marker.
- ADR-038 - the percentage is structural and still does not move.
