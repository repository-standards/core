# BDR-NNN: <short title of the business decision>

| | |
| --- | --- |
| **Status** | Proposed |
| **Date** | YYYY-MM-DD |
| **Author** | {{AUTHOR}} |
| **Decided by** | the author |

<!-- An Accepted record is never edited into a different decision. When it stops being
     true, flip Status to `Superseded` and name the record that replaced it in the row
     above; the text below stays as it was written. -->

<!-- "Decided by" is what made this binding, not who typed it - and on the business side it
     is the row most often needed: a steering group, a client sign-off, a board or committee
     vote. "The author" is a real answer where the author could genuinely make the call.
     Where a body decided, record it as that body defines a decision - name, date, tally,
     quorum met. -->

## Context

The business or product force: user need, market, pricing, policy, legal, or
operational constraint. Why this is a decision worth recording.

## Who it serves

Which personas from `docs/personas.md` are better off, and **which one is worse off**. Name
them. A decision that serves everyone equally is usually one nobody made, and the persona
that loses is the thing a future reader most needs to know was considered.

## Options considered

- **Option A** - summary; business trade-offs.
- **Option B** - summary; business trade-offs.

(At most ~3.)

## Decision

"We will ..." - the business choice, in product / user terms (not implementation).

## Consequences

- Impact on users / revenue / ops: ...
- Trade-offs accepted: ...
- Follow-ups: ...

## Confirmation

How compliance with this decision is verified in practice - the guard, test, CI check, review
step, config value, or the spec / doc it changes. **Name the enforcement point; do not design
it here** (which table, which service, which library is the ADR's job - link it). A business
decision with a technical consequence and no named check is the one that quietly stops being
followed: "how we would know we were wrong" below says how you would learn the decision was a
mistake, and this says how you would learn it is not being kept. If nothing confirms it yet,
say so plainly - an unconfirmed decision is a red flag, and on privacy, money or safety it is
the whole risk.

## What this rules out

The non-goals that come with the decision - what it commits us to *not* doing. This is the
section that stops the decision quietly expanding for a year, and the one nobody fills
unprompted.

## How we would know we were wrong

The observable signal, not a feeling: a churn number, a support pattern, a segment that never
converts. "If it doesn't work out" is not one. Write something a person could check in three
months without re-running this discussion.

## Revisit when

The business signal that would reopen this - a metric threshold, a market shift, a
policy change.

## Related

Linked ADRs (how it is implemented technically), issue / epic key.
