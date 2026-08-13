# <Repo> - backlog

> The single, ordered list of work the repo knows it still owes itself: features,
> and - especially in a repo being brought up to the standard - the documentation,
> spec and decision work brownfield onboarding surfaced. Markdown-native and agent-first, so
> an agent can read, append and re-order it. Compatible with the [Backlog.md](https://github.com/MrLesk/Backlog.md)
> tool if the team wants a CLI/board on top - do not build a custom backlog engine.

## In flight *(scale - delete this section if you do not run sprints)*

What left this pool and into which sprint. One line each, no rows duplicated: an intent is
here **or** in a sprint, never both, and `scripts/sprint-guard.mjs` fails when that stops
being true. This table is why the pool remains the single place to start reading.

| Team | Goal | Target | Sprint | Items |
|---|---|---|---|---|
| | | | | |

<!-- Filled, it reads like this - delete this block:

| payments | checkout stops losing carts | 2026-08-29 | `sprints/payments/august.md` | 3 |
-->

`/sprint-open` writes a row here and `/sprint-close` removes it, and `sprint-guard` checks all
of that rather than trusting it: the `Sprint` cell must name a sprint file that exists and is
still **open**, and `Items` must be the number of intent rows that sprint actually holds.

Once the table carries any row, **every** open sprint must have one - so deleting the row for
a sprint you would rather not explain is not a way past the other two checks. Emptying the
table completely is: a pool with no pointer rows is a pool not running sprints from its own
side, and that is exactly the state this template ships in, so it cannot be a failure. The
line is drawn where it can be drawn honestly - a table half kept is worse than no table, and
a repo that deletes this section is making a choice rather than hiding one.

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

**An item is finished.** Say so and it leaves the live list; a row that lingers after
its definition of done is met teaches everyone the list is stale. Leaving is a move,
not a delete - see [Closing a row](#closing-a-row) for where the row and its findings
go:

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

Items arrive from five places, and each row **names its own** in the `source` column -
never invent work that has no source:

- **`onboarding`** (the align router's brownfield phase): capabilities to spec, decisions to
  record, drift to resolve, guards to wire.
- **`spec-delta`** (`spec-update`): a spec changed to a target the code has not caught
  up to yet.
- **`drift`** (`spec-reconcile`): the code and the spec disagree and the fix
  is not this PR.
- **`decision`** (`spec-impact`): a change needs an ADR/BDR that does not exist.
- **`asked`**: somebody said it out loud - the mid-work "park it" that `/add-to-backlog`
  exists for.

Write the category, then where it came from if there is anywhere to point:
`drift: spec-reconcile 2026-08-04`, `asked: #212`, `onboarding`. Six months on, that is the
difference between a row that can justify itself and a row nobody dares delete. It is a
column rather than a habit because "every item has a source" was the claim, and folding
provenance into `why` made the claim true only for whoever happened to remember.

A finished item leaves the backlog only when its **definition of done** is met - the
spec is buildable, the ADR is Accepted, the drift is resolved - not when someone looks
at it. That says *when* a row may close. Where it goes afterwards is a separate
question with its own answer: [Closing a row](#closing-a-row).

## Alignment scope *(a repo being brought onto the standard)*

Gate 5's artifact, and the one number the person paying for the adoption actually decides on.
Adoption is incremental and never a big-bang, so the honest deliverable before committing is
the **size of the job** - which is why this is a count and not a paragraph saying it is large.

```
Alignment scope for <repo> -> standard@<version>
  specs to write / raise to buildable ....  12
  decisions to record (ADR/BDR) .........    5
  drift to reconcile ....................    3
  guards / structure to install .........    4
  ---------------------------------------------
  24 tasks to full alignment
```

The categories are the defaults, not a fixed vocabulary - rename them to what this repo
actually owes. Two things are not negotiable, because they are what the block is for:
**the total is the sum of its parts**, and **every alignment item names its owner role** in
the table below the block (`product` / `architect` / `dev` / `agent`, as in the item format).
`scripts/adoption-gates.mjs` reads both (R27). A block whose arithmetic has quietly drifted
reads as authoritative while describing nothing, which is worse than having no block.

`drift 0` and a nonzero count are not a contradiction, and an adopted repo usually shows
both: drift measures what the standard can check mechanically, and this counts what it
cannot. Say so next to the block rather than leaving the next reader to reconcile two
numbers that look like they disagree.

The count is also how a repo takes a **slice** - the money paths now, the rest queued -
and keeps that trade explicit instead of implicit.

## Order

Top of the list is next. Prioritize by **risk x leverage**: money, security, external
contracts and data integrity before cosmetics; high-churn before dormant. Group items
under epics; keep the ordering honest (if it is not really next, it is not at the top).

## Format

One item per row. `cap` links the capability, `persona` names who it serves (from
`personas.md`; see below), `owner` names the **role that must act** - `product` (business:
`PRODUCT.md`, BDRs, personas confirmation), `architect` (ADRs, boundaries), `dev` (specs,
code, guards) or `agent` (mechanical work the agent does alone), `why` is one line, `source`
is where the item came from (the five categories above), `DoD` is the observable finish line.

### The id

**One convention, and it is this: the id's prefix names the thing the item belongs to.**
Read the `cap` cell and the prefix follows from it, with no judgement left over:

- **`cap` names a capability** - the prefix is that capability, however you already
  abbreviate it: `INV-3` for invoicing, `PAY-2` for payments, `SCH-9` for scheduling.
  Whether the work is a spec, a drift fix or a feature does not change the prefix; the
  capability is what the item belongs to, and `owner` and `source` already say what kind
  of work it is.
- **`cap` is `-`** - the prefix is the artifact type instead, because there is nothing else
  to name it after: `ADR-auth` for a decision no capability owns yet, `DRIFT-2` for drift in
  code no capability claims, `SPEC-1` for a spec that has no home yet.

Then a number or a short slug, stable and never reused.

That is stated here and nowhere else on purpose. The id is the only field joining this pool
to a sprint, and this file used to mix both forms in one sentence while the worked examples
elsewhere used only the other - which reads as two conventions and makes the join a guess.

`assignee` is the **person**, and it is empty here by definition: an item in the pool is
not yet anyone's. It fills when the item is pulled into a sprint.

`size` is `S`, `M` or `L`, and optional. It is a **splitting trigger, not a forecast**: an
`L` means split this before pulling it. Sizes are never summed, never converted to numbers,
and never fed into a projection - once three sprints have closed, the measured time an item
actually took supersedes them entirely (ADR-028). An item that does not finish in its sprint
is **split, not re-sized**.

### Epic: <name>

| id | title | cap | persona | owner | assignee | size | why | source | DoD | status |
|----|-------|-----|---------|-------|----------|------|-----|--------|-----|--------|
| | | | | | | | | | | |

<!-- Example rows, from a rental-property product - delete this block once the table above is
     yours. They are here rather than in the table because a row left in the table reads as
     work this repo owes itself:

| PRICE-1 | Spec `pricing` to buildable | pricing | Owner-operator Olga | dev | | M | money path, behavioral-only today | onboarding | pricing spec has data + algorithm contracts, cited from code | todo |
| ADR-store | Record datastore choice | - | Maintainer (internal) | architect | | S | re-litigated in review, decision only in code | decision: spec-impact on pricing | ADR Accepted, states rejected options | todo |
| REFUND-2 | Reconcile refund flow | refunds | Owner-operator Olga | agent | | S | README says X, code does Y | drift: spec-reconcile 2026-08-04 | spec matches real behavior; guard green | blocked:PRICE-1 |
-->


Statuses: `todo` / `doing` / `blocked` / `done`. A `done` row leaves this file - see
[Closing a row](#closing-a-row). A sprint row can also carry `split:<id>` - see
`docs/sprints/_template.md`; it is written by `/sprint-close` and never by hand here.

**`blocked` takes a reference**: write `blocked:PRICE-1` to name what blocks it. Blocking gets
no column of its own - the status already carries `blocked` and what it lacked was *what*.
`sprint-guard` checks that the named intent exists, is not the row itself, and is not already
finished - `done`, or `split:<id>`, which is finished work whose remainder moved to another
row. A block pointing at something finished or deleted is the failure that costs time
silently, because the row looks legitimately stuck.

**The title is checked too.** `sprint-guard` treats one title appearing in two files under two
ids as one intent in two places, because copying a row into a sprint and renumbering the copy
left behind passes every check keyed on the id. Give a genuinely different intent a different
title; a `split:<id>` pair is the one place two rows may share one.

## Closing a row

**Closing a row is a relocation, not a deletion.** A closed row is often the only place a
finding was ever written down - a control that turned out to run clean and protect nothing, a
design killed by a probe, an answer of "correct as built, no change needed" that produced no
commit and so never reached the changelog. Deleting the row deletes the answer and the next
person pays for it again; leaving it in place turns the live list into something nobody reads.
So the row moves, and its content moves first:

- **The finding goes where findings live.** A decision to a decision record, behaviour to the
  capability spec, raw material to a discovery dossier. Nothing new to learn here - the
  [taxonomy](https://github.com/repository-standards/core/blob/main/docs/method/taxonomy.md)
  already says which is which.
- **What shipped goes to the CHANGELOG**, under `## Unreleased` - which R18 already requires
  of the PR that shipped it, so for a row that shipped code this costs nothing.
- **The row moves to `docs/backlog-archive.md`**, as written, plus a `where` cell naming what
  its content became.

**A row whose content cannot be relocated was not done.** That is what this rule buys, and it
is the point rather than a side effect. If nothing will take the content, one of three things
is true and each has an action: the work is not finished (the row stays), the finding needs a
record nobody has written (write it - that is a row of its own), or the row is being abandoned
rather than completed (then its status is not `done`).

**When, and who.** At the release cut, by whoever cuts the release. *(scale)* `/sprint-close`
archives the rows its sprint finished, since it is already writing that sprint's outcome.
Never automatically: choosing the destination is a judgment, and a pointer a tool guessed is a
pointer nobody trusts.

Ideas close the same way, on `graduated` or `dropped` - a graduating idea already points at
what it became (R14), so its `where` is written before the archive asks for it. Two statuses
deliberately do **not** archive: `split:<id>`, because the remainder row is live work, and an
open question's `decided`, because a standing decision stays open to a better one - that is
what the type is for, not a completed state to file away.

**Prove it.** `node scripts/backlog-archive-check.mjs --base origin/main --block` fails a row
that left the pool without reaching the archive, an archived row with an empty `where`, a
`where` naming a path that is not here, and an id sitting in both files at once. What it cannot
check is whether the destination still holds the finding - that stays your judgment.

The archive ships as a template with nothing in it: delete the file until the first row moves,
and the checks that read it stay quiet meanwhile. The removal check does not stay quiet, because
the first closure is exactly when the archive is supposed to appear.

## Who an internal item serves

An item that serves no persona is parked, not queued (ADR-006) - and the roster in
`personas.md` holds end users, while a large share of this pool is documentation, spec and
decision debt that no end user will ever notice. Both are true, so name it rather than
stretching a customer persona over infrastructure work:

**Write the internal persona: `Maintainer (internal)`.** Anyone who has to work in this repo
afterwards - a person or an agent. It is a real answer to "for whom", and it is what makes
the persona gate a gate: an item that cannot name even that one is a wish.

Nothing checks backlog personas mechanically, which is exactly why it is written here rather
than left as something a careful author would work out: a rule with no guard behind it is
carried by the page that states it, and an answer nobody can find is an answer nobody uses.

## Definition of Ready (before an item is pulled)

An item is **ready** when it is **INVEST**-shaped and has: a named `persona` (the internal one
counts), a linked `cap` (or `-`), an `owner` role, a one-line `why`, a `source`, and an
observable **DoD**. INVEST = Independent, Negotiable, Valuable (to that persona), Estimable,
Small (fits one flow), Testable. An item that fails this is refined or split first - the PO
stage does not start on a vague item.

## Not this

- Not a dumping ground for vague wishes - every item has a `source`, a persona, and a DoD,
  and the first of those is a column so the claim is checkable by reading one.
- Not a second issue tracker to keep in sync by hand - this is the in-repo, agent-first
  view; mirror to an external tracker only if the team already lives there.
- Not a place to pre-decide - "write an ADR for X" is a backlog item; the decision
  itself is made in the ADR, not here.
