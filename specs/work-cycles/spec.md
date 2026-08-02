# Work cycles

**Spec tier:** buildable
**Serves:** `Standard-bearer Staszek` - he runs more than one repo and is the one asked "when will this land"; `Spec-first PO Paula` reads the timeline the cycles feed; `Coding agent` gets a mechanical rule instead of a convention to remember.
**Status:** in-development
**Success metric:** Guidance quality - a repo can answer "when will this land" from its own contents, and the answer improves with evidence rather than with confidence.

## Purpose

The bounded periods of work a team commits to, in the repo: a goal, an agreed end date, and the backlog intents pulled into it. Decided in [ADR-028](../../docs/decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md); `scale` profile only.

## Scope

The cycle artifact, the one-place invariant binding it to the backlog pool, and the guard that proves the invariant mechanically.

## Out of scope

Per-item execution state, assignment and work history remain the tracker's (ADR-010).

## Core concepts

- **Cycle** - one file at `docs/cycles/<team>/<slug>.md`. Carries an owner, a goal, an agreed end date, a status, and the intent rows pulled from the backlog. Several run in parallel, one directory per team; there is no fixed length and no ceremony.
- **The pool** - `docs/backlog.md`, holding every intent not currently in a cycle.
- **The one-place invariant** - an intent id exists in the pool **or** in exactly one cycle. Never both, never two cycles. This is what makes the pair trustworthy: a backlog that also lists in-flight work is a backlog nobody believes.
- **Agreed, not imposed** - the end date is a planning input the owner sets and may move. Nothing enforces it; `CYCLE-3` reports a cycle past its date and still open rather than treating it as a violation.

## Data contracts

`docs/cycles/<team>/<slug>.md` - `<team>` and `<slug>` are lowercase kebab-case. Front matter as a two-column table, matching the record templates:

| Field | Meaning |
|---|---|
| **Team** | the directory name, restated so the file is readable alone |
| **Owner** | who decides when it ends and whether the date moves - the word ADR-028 uses, and the artifact has to record it or the decisions attributed to an owner have nobody attached |
| **Goal** | one sentence: the outcome, not the item list |
| **Opened** | `YYYY-MM-DD` |
| **Target** | `YYYY-MM-DD` - agreed, movable |
| **Status** | `open` \| `closed` |

Then one table of intents, the same columns the backlog declares, so a row moves between the two files unchanged:

`| id | title | cap | persona | owner | assignee | size | why | DoD | status |`

`id` is the stable backlog id (`SPEC-3`, `ADR-auth`). It is the key the invariant is checked on.

`owner` is the **role** that must act; `assignee` is the **person currently holding** it, present tense, cycle rows only - the pool leaves it empty and reassignment overwrites rather than accumulating (ADR-030). `size` is `S` \| `M` \| `L`, optional, a splitting trigger and a cold-start estimate that measurement supersedes at three closed cycles; it is never summed and never charted (ADR-029).

`status` is `todo` \| `doing` \| `blocked` \| `done`, and `blocked` MAY carry a reference - `blocked:<id>` - naming the intent that blocks it. Blocking deliberately gets no column: the status already carried `blocked` and what it lacked was *what*.

## Interface contracts

`node scripts/cycle-guard.mjs [--block]` - dependency-free Node, run from the repo root.

Reads the backlog - `docs/backlog.md` or `backlog.md`, the manifest's two accepted paths - and every `docs/cycles/**/*.md` except: names beginning `_` (templates, as files **and** directories), and `TIMELINE.md` / `README.md`, which are derived or descriptive rather than cycles. The shipped tree carries no README here any more - the folder's manual is a documentation page read at the standard - but the skip stays, because an adopting repo is free to write one. Collects the first cell of every table row that looks like an intent id (`^[A-Z][A-Z0-9]*-[A-Za-z0-9-]+$`), keyed by the file it came from, ignoring HTML comments and fenced code blocks. Reports any id appearing in more than one file.

It also reads the **last** cell of each such row as the status - last, not a fixed index, so the check does not depend on a column count the adopter may extend. A status matching `blocked:<id>` (case-insensitive) is a **stale block** when the named intent exists nowhere, or exists with status `done`; naming the row itself is an error. A block pointing at finished or deleted work is the failure that costs time silently, because the row looks legitimately stuck.

The block checks run **whether or not the repo uses cycles**: a `core`-profile repo has a pool and no cycles, and a stale block costs it the same. Only the one-place invariant needs cycles to exist.

Comment state is scanned left to right within each line rather than by testing for `<!--` and `-->` independently, or an inline comment inside a row would delete a real row. A `-->` in commented prose does end the comment - that is HTML, and every renderer agrees - so a commented example block must not contain one.

| Exit | Condition |
|---|---|
| 0 | no problems; or **neither cycle files nor a backlog** (nothing to check - the cycles directory existing is not enough, since the tree ships a template into it); or problems found without `--block` |
| 1 | a duplicate id, a stale block or a self-block found, and `--block` given; or cycle files exist with no backlog at either accepted path, and `--block` given |

Output: one line per problem - a duplicated id naming every file it appears in, or a block naming what it points at and why that no longer applies - then a verdict line: `cycle-guard: OK - <n> intent(s) ...` or `cycle-guard: <n> problem(s).` followed by the rule each class of problem broke.

`/cycle-open` and `/cycle-close` are the procedures that maintain the invariant. Open moves rows out of the pool and adds the cycle's pointer row to it; close checks each intent against its own definition of done, **cuts unfinished rows back** at their risk x leverage position rather than appending them, writes the single outcome block, flips `Status`, and removes the pointer row. Both end by running the guard, because a copied row rather than a moved one is the failure they can most easily produce.

The outcome block is written once and holds: planned, finished, returned, unplanned work absorbed, commits in the window, days elapsed. It exists because the grouping is not recoverable afterwards (ADR-028) - and for no other reason, so nothing per-item goes in it.

`/timeline-update` regenerates `docs/cycles/TIMELINE.md` whole from those blocks. Throughput is finished-plus-unplanned per day, taken **only from closed cycles** - an open cycle has no throughput, and using its planned count is how a timeline becomes a wish. Below **three** closed cycles it reports what is in flight and refuses to give a completion date, because one unusual cycle dominates an average of fewer. Above three it reports the spread as well as the mean, and gives a range rather than a figure when the spread is wide. Every projection carries the evidence it rests on; a cycle past its target and still open is named with the overrun, never softened.

## Algorithms & rules

1. If there is neither a cycle file nor a backlog, print the note and exit 0. Testing the cycles directory alone would never fire for an adopter, because the tree ships files into it. No cycles **but** a backlog still runs the block checks - exiting there would skip the only check a `core` repo gets.
1b. If cycle files exist but no backlog does, report that and stop: the pool half of the invariant cannot be checked, and printing OK would claim that it was.
2. Collect rows from `docs/backlog.md`, then from each cycle file, skipping `_`-prefixed basenames and rows inside HTML comments. Each row yields its id (first cell) and its status (last cell).
3. A row contributes its id once per file even if the file repeats it; the invariant is about *files*, not occurrences.
4. Group by id. Any id with more than one distinct file is a violation.
5. For each `blocked:<ref>` status: a violation if `ref` is the row's own id, if `ref` appears in no file, or if `ref`'s status is `done`.
6. Report every violation before exiting - never stop at the first.

## Invariants

- An intent id MUST appear in at most one of: the pool, or one cycle file.
- The guard MUST NOT fail a repo that has no cycles directory.
- Template files (`_`-prefixed) MUST NOT contribute ids, or the shipped example would violate the invariant on arrival.
- A `blocked:<id>` reference MUST name an existing intent that is neither the row itself nor already `done`.
- `assignee` MUST be empty on pool rows, and MUST NOT accumulate: one current holder, overwritten on reassignment (ADR-030).
- `size` MUST NOT be summed, converted to a number, or used in a projection once three cycles have closed (ADR-029). Neither of these last two is script-enforced - they are review rules, and the records say so rather than implying a guard that does not exist.

## Edge cases

- A repo with cycles but an empty pool - valid; everything is in flight.
- The same id in two cycles of *different* teams - still a violation. Two teams believing they own the same intent is the failure this exists to catch.
- An id inside an HTML comment (the shipped examples) - ignored, so an example block cannot trip the guard.
- A cycle file with no rows - valid; a cycle can be opened before anything is pulled in.

## Acceptance criteria

- **Clean repo.** GIVEN a pool with three ids and one cycle holding a fourth WHEN the guard runs THEN it exits 0 and reports four intents across two places.
- **In two places.** GIVEN `SPEC-1` in both the pool and a cycle WHEN the guard runs with `--block` THEN it names both files and exits 1.
- **In two cycles.** GIVEN `SPEC-1` in two cycle files under different teams WHEN the guard runs with `--block` THEN it names both and exits 1.
- **No cycles directory.** GIVEN a repo with no `docs/cycles/` WHEN the guard runs THEN it prints the skip note and exits 0.
- **Template ignored.** GIVEN `docs/cycles/_template.md` carrying example ids that also exist in the pool WHEN the guard runs THEN there is no violation.
- **Commented example ignored.** GIVEN a cycle file whose example rows sit inside an HTML comment WHEN the guard runs THEN those ids do not count.
- **Advisory by default.** GIVEN a duplicate and no `--block` WHEN the guard runs THEN it reports the violation and exits 0.
- **The pool's pointer table is not intents.** GIVEN `docs/backlog.md` carrying the in-flight table with a cycle row WHEN the guard runs THEN those rows contribute no ids - the first cell is a team name, not an intent id.
- **Opening moves rather than copies.** GIVEN three intents pulled into a new cycle WHEN `/cycle-open` finishes THEN those rows are absent from `docs/backlog.md`, present in the cycle, and the guard passes.
- **Closing returns unfinished work to its place.** GIVEN a cycle of five where two did not meet their definition of done WHEN `/cycle-close` finishes THEN those two rows are back in the pool at their risk x leverage position rather than appended, the outcome block records planned 5 / finished 3 / returned 2, and the pointer row is gone.
- **A close cannot rubber-stamp.** GIVEN a cycle whose intents were never checked against their DoD WHEN `/cycle-close` runs THEN it reports per item what it verified and refuses to close on items it could not judge, saying what would settle each.
- **Too little history gives no date.** GIVEN two closed cycles WHEN `/timeline-update` runs THEN it reports what is in flight, states that two closed cycles cannot support a projection, and gives no completion date.
- **A wide spread gives a range, not a figure.** GIVEN three closed cycles at 0.2, 0.4 and 1.1 finished-per-day WHEN the timeline projects THEN it gives a range and says the spread is wide, rather than a mean that averages away the variance it was computed from.
- **Unplanned work counts toward throughput.** GIVEN a closed cycle that finished four planned intents and absorbed three unplanned WHEN throughput is derived THEN it reflects seven, not four - a team measured only on what it planned reads permanently slower than it is.
- **A slipping cycle is named.** GIVEN an open cycle eleven days past its target WHEN the timeline is written THEN it names the cycle, the overrun and what remains, without softening and without calling it a failure - the date is agreed and movable by design.
- **Regenerated, never appended.** GIVEN an existing `TIMELINE.md` WHEN the skill runs again THEN the file is replaced whole and carries no history of its own; git holds what it said before (R4).
- **A live block passes.** GIVEN `PAY-2` with status `blocked:PAY-1` and `PAY-1` present and unfinished WHEN the guard runs THEN it exits 0 and reports one live block.
- **A block on a deleted intent fails.** GIVEN `PAY-2` blocked by `PAY-9` which appears in no file WHEN the guard runs with `--block` THEN it says the block no longer applies and exits 1.
- **A block on finished work fails.** GIVEN `PAY-2` blocked by `PAY-1` whose status is `done` WHEN the guard runs with `--block` THEN it says the block no longer applies and exits 1.
- **A block reaches across files.** GIVEN `PAY-2` in the pool blocked by `PAY-1` held in a cycle WHEN the guard runs THEN it exits 0 - the reference is repo-wide, not per-file.
- **Plain `blocked` stays legal.** GIVEN a row whose status is `blocked` with no reference WHEN the guard runs THEN it exits 0; the reference is a MAY, and requiring it would fail every repo on the day it upgraded.
- **The status is the last cell, not a fixed column.** GIVEN tables of differing widths WHEN the guard reads them THEN the status is taken from the final cell of each row, so an adopter adding a column does not silently disable the block checks.
- **A core repo still gets the block checks.** GIVEN a backlog and no `docs/cycles/` at all WHEN the guard runs with `--block` on a stale block THEN it exits 1 rather than skipping as not-using-cycles.

## Open questions

The name is held open - [`work-periods`](../../docs/open-questions/work-periods.md). Renaming `cycle` later changes a directory, this spec and the guard's paths; nothing else depends on the word.
