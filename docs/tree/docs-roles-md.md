The roster of who uses the product, and with what permissions. Not a UX nicety and not a
marketing artefact: in this standard the roster is a **validation gate**, and a spec that
cannot name the role it serves does not pass it.

The reason is one sentence. "The user" wants everything, so a spec written for "the user"
settles nothing and every trade-off inside it is decided by whoever writes the code.

## What it is for

Roles sit **above** specs and the backlog in the altitude, so:

- a capability spec names the role it serves in `**Serves:**`, optionally qualified by a mode,
  and carries 1-3 job stories with scenarios linked to its acceptance criteria
- a backlog item names the role whose job it moves
- an idea that cannot name a role gets parked, not built
- a key end-to-end flow gets a journey in `docs/journeys/`, pinned to one role
- when two roles or two modes conflict, the resolution is a **recorded decision**, not a
  coin flip

This is the product-side mirror of buildable specs. A buildable spec makes behaviour
verifiable against the **code**. A role and its job stories make it verifiable against the
**need**.

## What goes in here

A table. `scripts/spec-structure.mjs` reads it as the live roster, so it is data as much as
prose - and the role name goes in backticks, which is the part the guard parses.

```markdown
| Role | Primary? | Permissions | One-line |
|---|---|---|---|
| `Guest` | yes | searches, books, pays and cancels own bookings | wants certainty before paying |
| `Host` | | manages own listings, calendar, prices | answers for every booking |
| `Support agent` | | reads any booking, refunds up to a limit | resolves what went wrong |
```

A row without backticks reads as no role at all, so a table written that way is an empty
roster. The guard says so rather than passing everything.

Under the table, one block per role: permissions, **distrust & friction** (what they fear and
must see before they act), jobs, success signals, anti-goals - and **modes**, at most three,
only where a situation changes how the product behaves for that role (a `Guest` booking a
spontaneous weekend on a phone is not served like one planning a family stay). A mode shares
the role's permissions and never gets its own roster row.

Keep it small, and mark the **primary** role - the one who wins ties unless a decision says
otherwise. Without that, every conflict is a fresh argument.

## What does not go in here

**Biography.** No name, age, photo or life story. A role is an actor with permissions; what
changes a decision is the situation they are in and what they distrust, and that is what gets
written.

**Segments.** "Enterprise" is a pricing tier, not a role. If it has no permissions and no
jobs of its own, it is a segment.

**A mode that changes nothing.** If no spec would come out differently for it, it is
description, not a mode.

**Example roles from someone else's product.** The shipped template carries a worked example
further down the file, deliberately kept **out** of the roster table: the structure guard
reads the table as truth, so example names left in it would let a spec claim to serve a role
from a booking demo and pass the gate.

## How you actually use it

```
> we have never written down who uses this - interview me and build the roster
```

And when a spec is vague about it, which is the moment the gate earns its keep:

```
> this spec says "the user" - which role is it, and what job does it do for them?
```

A repo still carrying `docs/personas.md` moves it with the `roles-write` skill's migration
section; the guard keeps reading the old file, with a notice, until it is moved.

## Decisions behind it

- **[ADR-064](../decision-records/ADR-064-roles-modes-and-job-stories-replace-personas.md) -
  roles, modes and job stories; the gate stays.** The roster states permissions, which a
  spec's trust boundaries can be checked against, and every spec holds a testable statement
  of the need tied to the criteria that prove it. A spec cannot merge without answering
  "for whom", which is the only mechanism that keeps the roster true.
- **One primary role.** Ties without a tiebreaker get resolved by whoever is in the room,
  silently and differently each time.
- **The roster is a table, not prose.** A guard has to be able to read it, and unchecked
  gates stop being gates.
