# ADR-NNN: <short title of the decision>

| | |
| --- | --- |
| **Status** | Proposed |
| **Date** | YYYY-MM-DD |
| **Author** | {{AUTHOR}} |
| **Decided by** | the author |
| **Tags** | <area> |

<!-- "Decided by" is what made this binding, not who typed it. Most records answer "the
     author" or "the maintainers" and that is a real answer, worth one word. It exists for
     the projects where it is not: a chartered committee whose vote is the thing that
     confers authority (a TSC carrying a legally binding technical charter), a named
     delegate, a client sign-off. Record the vote as the charter defines it - body, date,
     tally, quorum met - because a reader asking "who could overturn this?" is asking about
     the body, and a record that only names its typist cannot answer. -->

<!-- An Accepted record is never edited into a different decision. When it stops being
     true, write `Superseded by ADR-NNN (date)` in Status; the text below stays exactly as
     it was written. There is deliberately no empty row waiting for that - a field printed
     as "-" on every record is noise on all of them to serve the few that are superseded. -->

<!-- Keep it short. Length is a cost, not a sign of rigour: write the shortest record that
     still answers *why* for someone who was not in the room, and let a section with nothing
     to say be one line. Comprehensive means every section is answered, not that each answer
     is long. A record nobody finishes reading fails at the only job it has. -->


## Context

What problem or force prompted this decision? Constraints, current state, what is
at stake. Link code, other records, or standards as needed.

## Options considered

- **Option A** - summary; trade-offs.
- **Option B** - summary; trade-offs.

(At most ~3. If there is really only one viable option, say why.)

## Decision

The decision, stated plainly. "We will ..."

## Consequences

- Positive: ...
- Negative / cost we accept: ...
- Follow-ups: ...

## Confirmation

How compliance with this decision is verified in practice - a test, a guard / lint, a
CI check, a review checklist, or the doc / spec it updates. If nothing confirms it yet,
say so plainly (an unconfirmed decision is a red flag).

## Revisit when

The concrete signal that would invalidate this decision and trigger a new ADR - a
threshold crossed, a constraint lifted, a vendor or tech change. Keep it specific
so a future reader knows exactly when to reopen this.

Required: `scripts/decision-records-check.mjs` fails on any record still standing that leaves
this section out, empty, or still carrying this prompt. Where the decision is structural and has
no such signal, write that - "nothing reopens this short of dropping X" is a real answer,
an invented threshold is not. Superseded and rejected records are exempt.

## Related

Records this supersedes or relates to, standards it drives, issue/ticket key.
