# ADR-034: Embargoed work is a private mirror of the repo, not an exemption from R3

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-08-06 |
| **Author** | bodurkalukasz |
| **Tags** | security, knowledge |

## Context

The standard had no word for work that is real, recorded, and not yet publishable. R3
says project knowledge MUST live in the repo; R11 says a capability's code and its spec
land in the same pull request; R15 says the backlog holds the intents. Followed literally
in a **public** repo, those three publish an unfixed vulnerability at the moment somebody
starts fixing it - and the same reading publishes a customer's confidential detail and an
unannounced commercial move.

That is not a hypothetical reading. Validation case `SEC-02` executed it: no rule carried an
embargo or confidentiality clause, and the manifest's `exceptions` mechanism has four kinds
(`file`, `section`, `content`, `key`) and no embargo among them.

The failure mode a rule like this actually has is not that teams argue with it. It is that
they quietly break it - the fix gets developed in a private fork with no spec, no record
and no backlog item, and none of that is ever written, because the standard only offered
"publish it" or "you are non-compliant". A rule that forces disclosure teaches people to
work outside the standard exactly when the work is most sensitive.

## Options considered

- **An embargo exception on R3, R11 and R15** - each rule gains an "unless confidential"
  clause. Rejected: three separate holes, each readable on its own as a general licence to
  keep knowledge out of the repo, and none of them says anything about the material coming
  back. It concedes the premise - that the standard's problem is requiring too much - when
  the real problem is that it conflated *the repo* with *the public*.
- **A new `embargo` kind in the manifest's `exceptions`** - the repo records its embargoed
  material as a recorded deviation. Rejected on what `exceptions` is: a repo's structural,
  standing deviation from the standard, read by `self-verify` at drift time, and one that
  deliberately lowers the adoption percentage. An embargo is a temporary state of one piece
  of work inside a repo that is otherwise fully aligned. Encoding it there would penalise
  the correct behaviour and leave a permanent artifact of a temporary condition.
- **A private mirror of the repo, for a bounded period, rejoining the mainline** (chosen).

## Decision

We will treat embargoed work as **deferred publication of repo content, not knowledge kept
outside a repo**. Material whose *publication* is the harm may be held in a private mirror
of the repo - the hosting platform's private security-advisory fork is the paved road - and
MUST rejoin the mainline when the embargo lifts.

**R3 carries the normative wording and is the only place it is stated.** Three properties
in it are what make this an embargo rather than a hiding place, and each was chosen against
a specific way this could be abused: every rule binds inside the mirror (so nothing is
deferred except the moment the world can read it, and nothing is reconstructed from memory
at disclosure); the embargo is bounded at the start, by a lifting condition and an owner
(so a permanent private home is the R3 violation it always was); and the near misses are
named out loud, because a clause like this is read by someone looking for permission.

R19's recorded security baseline gains the matching axis in `docs/method/security-baseline.md`,
so each repo answers where its embargoed work lives and who lifts it, rather than deciding
it under pressure during an incident.

## Consequences

- Positive: only **one** rule moved. Once "the repo" may temporarily be a private mirror,
  R11 and R15 need no exception - they are satisfied inside it. Three holes became one
  clause.
- Positive: the disclosure moment stops being a writing exercise. The spec, the record and
  the backlog item already exist; publishing them is a merge.
- Negative / cost we accept: a private mirror is real overhead - a second remote, and a
  merge back that can conflict with what the mainline did meanwhile. That cost is paid only
  by public repos, and only while an embargo is live.
- Negative / cost we accept: nothing mechanical can check that an embargo lifted. The
  lifting condition and its owner are prose, and the only guard against a permanent private
  home is review reading R3.
- Follow-ups: none. The clause is normative in R3; the axis is the menu entry R19 already
  requires an answer to.

## Confirmation

Validation case `SEC-02` re-runs the same procedure against R3 and the `exceptions` schema.
Beyond that this is review's call, deliberately: whether a given embargo is legitimate and
whether it lifted on time is a judgment, and a guard that pretended to check it would be
theatre. What is now checkable is that the vocabulary exists, which is what was missing.

## Revisit when

An adopting repo reports having used the private-mirror path and the merge back proved
impractical - a conflicted rejoin, or a platform whose private fork cannot host the tooling
the standard requires. That is the assumption this rests on, and it is the one that would
break first.

## Related

R3 (the clause), R11, R15, R19 and the security baseline's embargo axis; validation case
`SEC-02`.
