# <Repo> - backlog

> The single, ordered list of work the repo knows it still owes itself: features,
> and - especially in a repo being brought up to the standard - the documentation,
> spec and decision work brownfield onboarding surfaced. Markdown-native and agent-first, so
> an agent can read, append and re-order it. Compatible with the [Backlog.md](https://github.com/MrLesk/Backlog.md)
> tool if the team wants a CLI/board on top - do not build a custom backlog engine.

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

### Epic: <name>

| id | title | cap | persona | owner | why | DoD | status |
|----|-------|-----|---------|-------|-----|-----|--------|
| SPEC-1 | Spec `pricing` to buildable | pricing | Owner-operator Olga | dev | money path, behavioral-only today | pricing spec has data + algorithm contracts, cited from code | todo |
| ADR-1 | Record datastore choice | - | (infra) | architect | re-litigated in review, decision only in code | ADR Accepted, states rejected options | todo |
| DRIFT-1 | Reconcile refund flow | refunds | Owner-operator Olga | agent | README says X, code does Y | spec matches real behavior; guard green | todo |

Statuses: `todo` / `doing` / `blocked` / `done` (drop `done` rows on release, or let the
Backlog.md tool archive them).

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
