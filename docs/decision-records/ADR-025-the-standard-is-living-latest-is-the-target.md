# ADR-025: The standard is living - latest is the only target

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-30 |
| **Author** | Łukasz Bodurka |
| **Tags** | versioning, distribution, philosophy, ecosystem |

## Context

Two readings of the version mechanics coexisted and quietly disagreed. The
mechanics say: a repo pins the state it aligned to (`.standards-version`),
updates apply deltas, self-verify checks against the pinned manifest. The
prose, in places, said more: "adopted by reference at the pinned version"
implied that references should resolve at a tag, while every shipped link
points at `main`; the first stack once declared `standards >=0.8 <1`, a range
ADR-022 had to kill. The review flagged the gap as a defect ("pinned version
is words - links point at main"). The owner's call resolves it the other way:
the links are right, the words were wrong.

## Decision

**The standard is living, and every repo's target is always the latest.**

1. **No version ranges or requirements, anywhere, ever.** Not between stack
   and core (ADR-022 stands), not on landings, not in manifests, not in prose.
   The standard is not a dependency to constrain; it is a reference to true up
   to, and the reference moves.
2. **`.standards-version` is a bookmark, not an anchor.** It records the state
   a repo *last aligned to* - which is what makes an update a delta and
   self-verify a meaningful assertion. It never names a version to stay at,
   and nothing may treat it as a compatibility constraint.
3. **References resolve at `main`, deliberately.** `main` IS the living
   standard. Method docs, decisions and every by-reference link read latest;
   the canonical phrase is "adopted by reference from the living standard -
   always latest". Tags, when the maintainer cuts them, are milestones for
   changelogs and update notifications - never anchors for references.
4. **Staying current is a notification, not a lock.** The channel proposes a
   pin bump the repo's agent then executes (`update-to-version`): a Renovate
   custom manager watching `.standards-version` against this repo's tags, a
   shipped watch workflow for repos without a bot, and possibly an npm package
   later - as a tooling and reach channel, not as a dependency.

## Options considered

- **A - Version-anchored references** (`blob/<tag>` links, rewritten at
  align/update). Rejected: it freezes clients on stale method text, invents a
  re-point step nobody needs, and models the standard as a dependency - the
  opposite of a living reference.
- **B - Version ranges** (stack declares supported core versions). Rejected
  once already (ADR-022); rejected again here on principle: ranges model a
  lockstep that must never exist.
- **C - Latest-first, pin as bookmark (chosen).**

## Consequences

- The "pinned version" phrasing left every live surface; historical records
  keep their original wording with revision notes (ADR-004, ADR-023).
- A repo can be behind (its pin says so) but never *wrong* for being behind -
  the update channel tells it the standard moved, and the delta walks it
  forward. Fleet owners sort by pin distance, not by "supported" status.
- Anyone reading a by-reference link always sees the standard's current
  thinking - which is the point of a living standard, and the accepted trade:
  text may be newer than the reader's pin until they update.

## Confirmation

ADR-022's mechanics already enforce the range ban (nothing version-shaped is
checked or warned about). The canonical phrase is greppable: a live surface
saying "by reference at the/your pinned version" is a defect. The update
channel lands as shipped templates (watch workflow, Renovate rule) - recorded
in the backlog until then.

## Revisit when

The update channel (the Renovate custom manager, the shipped watch workflow, a
possible npm package) fails to keep repos actually moving forward - staying current
is meant to be a notification, not a lock, and that only holds if the notification
mechanism works. Without it, a repo can be behind indefinitely with nothing telling
it so, which reopens the case for some form of anchoring this record rejects.
