# <Repo> - backlog

> The single, ordered list of work the repo knows it still owes itself: features,
> and - especially in a repo being brought up to the standard - the documentation,
> spec and decision work brownfield onboarding surfaced. Markdown-native and agent-first, so
> an agent can read, append and re-order it. Compatible with the [Backlog.md](https://github.com/MrLesk/Backlog.md)
> tool if the team wants a CLI/board on top - do not build a custom backlog engine.

## In flight *(scale - delete this section if you do not run cycles)*

What left this pool and into which cycle. One line each, no rows duplicated: an intent is
here **or** in a cycle, never both, and `scripts/cycle-guard.mjs` fails when that stops
being true. This table is why the pool remains the single place to start reading.

| Team | Goal | Target | Cycle | Items |
|---|---|---|---|---|
| | | | | |

<!-- Filled, it reads like this - delete this block:

| payments | checkout stops losing carts | 2026-08-29 | `cycles/payments/august.md` | 3 |
-->

## You have this case - say this

**Something surfaced mid-work and it is not this PR.** The most common case, and the
one that decides whether the backlog is real or theatre:

```
> the booking export has no retry and dies on a timeout - park it, we are not fixing it here
```

The agent runs `/add-to-backlog`: one row, with why it matters and what done looks
like, ordered against what is already there. It does not stop what you were doing.

**You do not know whether it is a backlog item at all.** Say the thing and let the
agent place it - a decision belongs in a record, raw material in discovery, behavior
in a spec, and only work belongs here:

```
> where does this go: we keep arguing about whether refunds are partial or full
```

**An item is finished.** Say so and it leaves; a row that lingers after its
definition of done is met teaches everyone the list is stale:

```
> the retry work is merged - close its backlog item
```

**Corner case - the item is really three items.** If the done condition needs an
"and", split it. An item that cannot be finished in one move is an epic, and an epic
that never splits is a wish.

**Corner case - the target retired before the item did.** A definition of done that
names a capability which is now `retired` can never be met - drop the row rather than
leaving it as unfinishable work; the retiring decision record is where the "why" lives,
not a comment on this row.

## What feeds this backlog

Items arrive from four places - never invent work that has no source:

- **Onboarding** (the align router's brownfield phase): capabilities to spec, decisions to record, drift to
  resolve, guards to wire.
- **Spec deltas** (`spec-update`): a spec changed to a target the code has not caught
  up to yet.
- **Code<->spec drift** (`spec-reconcile`): the code and the spec disagree and the fix
  is not this PR.
- **Missing decisions** (`spec-impact`): a change needs an ADR/BDR that does not exist.

A finished item leaves the backlog only when its **definition of done** is met - the
spec is buildable, the ADR is Accepted, the drift is resolved - not when someone looks
at it.

## Order

Top of the list is next. Prioritize by **risk x leverage**: money, security, external
contracts and data integrity before cosmetics; high-churn before dormant. Group items
under epics; keep the ordering honest (if it is not really next, it is not at the top).

## Format

One item per row. `id` is stable (`CAP-3`, `ADR-auth`), `cap` links the capability,
`persona` names who it serves (from `personas.md` - an item that serves no
persona is parked, not queued; ADR-006), `owner` names the **role that must act** -
`product` (business: `PRODUCT.md`, BDRs, personas confirmation), `architect` (ADRs,
boundaries), `dev` (specs, code, guards) or `agent` (mechanical work the agent does
alone), `why` is one line, `DoD` is the observable finish line.

`assignee` is the **person**, and it is empty here by definition: an item in the pool is
not yet anyone's. It fills when the item is pulled into a cycle.

`size` is `S`, `M` or `L`, and optional. It is a **splitting trigger, not a forecast**: an
`L` means split this before pulling it. Sizes are never summed, never converted to numbers,
and never fed into a projection - once three cycles have closed, the measured time an item
actually took supersedes them entirely (ADR-028). An item that does not finish in its cycle
is **split, not re-sized**.

### Epic: <name>

| id | title | cap | persona | owner | assignee | size | why | DoD | status |
|----|-------|-----|---------|-------|----------|------|-----|-----|--------|
| | | | | | | | | | |

<!-- Example rows, from a rental-property product - delete this block once the table above is
     yours. They are here rather than in the table because a row left in the table reads as
     work this repo owes itself:

| SPEC-1 | Spec `pricing` to buildable | pricing | Owner-operator Olga | dev | | M | money path, behavioral-only today | pricing spec has data + algorithm contracts, cited from code | todo |
| ADR-1 | Record datastore choice | - | (infra) | architect | | S | re-litigated in review, decision only in code | ADR Accepted, states rejected options | todo |
| DRIFT-1 | Reconcile refund flow | refunds | Owner-operator Olga | agent | | S | README says X, code does Y | spec matches real behavior; guard green | blocked:SPEC-1 |
-->


Statuses: `todo` / `doing` / `blocked` / `done` (drop `done` rows on release, or let the
Backlog.md tool archive them).

**`blocked` takes a reference**: write `blocked:SPEC-1` to name what blocks it. Blocking gets
no column of its own - the status already carries `blocked` and what it lacked was *what*.
`cycle-guard` checks that the named intent exists, is not the row itself, and is not already
done: a block pointing at something finished or deleted is the failure that costs time
silently, because the row looks legitimately stuck.

## Definition of Ready (before an item is pulled)

An item is **ready** when it is **INVEST**-shaped and has: a named `persona`, a linked `cap`
(or `-`), an `owner` role, a one-line `why`, and an observable **DoD**. INVEST = Independent, Negotiable,
Valuable (to that persona), Estimable, Small (fits one flow), Testable. An item that fails
this is refined or split first - the PO stage does not start on a vague item.

## Not this

- Not a dumping ground for vague wishes - every item has a source, a persona, and a DoD.
- Not a second issue tracker to keep in sync by hand - this is the in-repo, agent-first
  view; mirror to an external tracker only if the team already lives there.
- Not a place to pre-decide - "write an ADR for X" is a backlog item; the decision
  itself is made in the ADR, not here.
