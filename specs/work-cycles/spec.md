# Work cycles

**Spec tier:** buildable
**Serves:** `Standard-bearer Staszek` - he runs more than one repo and is the one asked "when will this land"; `Spec-first PO Paula` reads the timeline the cycles feed; `Coding agent` gets a mechanical rule instead of a convention to remember.
**Status:** in-development
**Success metric:** Guidance quality - a repo can answer "when will this land" from its own contents, and the answer improves with evidence rather than with confidence.

## Purpose

The bounded periods of work a team commits to, in the repo: a goal, an agreed end date, and the backlog intents pulled into it. Decided in [ADR-028](../../docs/decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md); `scale` profile only.

## Scope

The cycle artifact, the one-place invariant binding it to the backlog pool (checked in both
directions - too many places, and a claimed return that lands in none), the guard that proves
it mechanically, and the mid-cycle read/edit operations - the status board, a status move, a
reassignment - that happen between opening and closing.

## Out of scope

Per-item execution state, assignment and work history remain the tracker's (ADR-010).

## Core concepts

- **Cycle** - one file at `docs/cycles/<team>/<slug>.md`. Carries an owner, a goal, an agreed end date, a status, and the intent rows pulled from the backlog. Several run in parallel, one directory per team; there is no fixed length and no ceremony.
- **The pool** - `docs/backlog.md`, holding every intent not currently in a cycle.
- **The one-place invariant** - an intent id exists in the pool **or** in exactly one cycle. Never both, never two cycles. This is what makes the pair trustworthy: a backlog that also lists in-flight work is a backlog nobody believes.
- **Agreed, not imposed** - the end date is a planning input the owner sets and may move. Nothing enforces it; `CYCLE-3` reports a cycle past its date and still open rather than treating it as a violation.
- **A cycle-boundary split** - an intent that spans the close: part finished, part continuing. Recorded as `split:<new-id>` on the row leaving the cycle, naming a new backlog row for the remainder - a re-size is not an option (ADR-029).

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

`status` is `todo` \| `doing` \| `blocked` \| `done` \| `split`. `blocked` MAY, and `split` MUST, carry a reference - `blocked:<id>` naming the intent that blocks it, `split:<id>` naming the new backlog row a cycle-boundary split continues as. Neither gets a column of its own: the status cell already carried the word and what it lacked was *what*.

## Interface contracts

`node scripts/cycle-guard.mjs [--block]` - dependency-free Node, run from the repo root.

Reads the backlog - `docs/backlog.md` or `backlog.md`, the manifest's two accepted paths - and every `docs/cycles/**/*.md` except: names beginning `_` (templates, as files **and** directories), and `TIMELINE.md` / `README.md`, which are derived or descriptive rather than cycles. The shipped tree carries no README here any more - the folder's manual is a documentation page read at the standard - but the skip stays, because an adopting repo is free to write one. Collects the id cell of every table row that looks like an intent id (`^[A-Z][A-Z0-9]*-[A-Za-z0-9-]+$`) once backticks and surrounding whitespace are stripped, keyed by the file it came from, ignoring HTML comments and fenced code blocks. Reports any id appearing in more than one file.

The id cell is the column the header row names `id` (case-insensitive), re-resolved at every table's separator row - not a fixed position. A table with no column literally named `id` falls back to the first cell, which is every table this guard shipped against before the header-name lookup existed. This is what keeps a prepended column (a priority, a team) from silently disabling the check.

It also reads the **last** cell of each such row as the status - last, not a fixed index, so the check does not depend on a column count the adopter may extend. A status matching `blocked:<id>` (case-insensitive) is a **stale block** when the named intent exists nowhere, or exists with status `done`; naming the row itself is an error. A block pointing at finished or deleted work is the failure that costs time silently, because the row looks legitimately stuck.

For every cycle file whose header table records `Status: closed`, it also reads the `## Outcome` block for a `Returned to the pool: <ids>` line (comma-separated, backticks and whitespace stripped, `none` meaning zero) and checks each named id is actually present in the pool. This is the other direction of the one-place invariant: the clash check above catches an id in too many places, and this catches one that ended up in none - an outcome asserting a move that never happened.

The block checks and the outcome-return check both run **whether or not the repo uses cycles**: a `core`-profile repo has a pool and no cycles, and a stale block costs it the same. Only the one-place invariant needs cycles to exist.

Comment state is scanned left to right within each line rather than by testing for `<!--` and `-->` independently, or an inline comment inside a row would delete a real row. A `-->` in commented prose does end the comment - that is HTML, and every renderer agrees - so a commented example block must not contain one.

| Exit | Condition |
|---|---|
| 0 | no problems; or **neither cycle files nor a backlog** (nothing to check - the cycles directory existing is not enough, since the tree ships a template into it); or problems found without `--block` |
| 1 | a duplicate id, a stale block, a self-block, or a returned-to-pool id missing from the backlog found, and `--block` given; or cycle files exist with no backlog at either accepted path, and `--block` given |

Output: one line per problem - a duplicated id naming every file it appears in, a block naming what it points at and why that no longer applies, or a closed cycle naming a returned id and the file that claims it - then a verdict line: `cycle-guard: OK - <n> intent(s) ...` or `cycle-guard: <n> problem(s).` followed by the rule each class of problem broke.

`/cycle-open` and `/cycle-close` are the procedures that maintain the invariant, and both resolve the backlog path the same way the guard does (`docs/backlog.md` first, then `backlog.md`) rather than assuming the primary path. Open moves rows out of the pool and adds the cycle's pointer row to it; close checks each intent against its own definition of done, **cuts unfinished rows back** at their risk x leverage position rather than appending them, writes the single outcome block naming every returned id (not only their count), flips `Status`, and removes the pointer row. An item spanning the close is **split**: a new backlog row for the remainder, and `split:<new-id>` on the row leaving the cycle. Both end by running the guard, because a copied row rather than a moved one is the failure they can most easily produce.

Between opening and closing, `/cycle-open` also owns reading a cycle back - grouping its intents by status into a `done` / `doing` / `todo` board, no date attached - and mid-flight edits: moving a status (the last cell, in place) and reassigning a holder (the `assignee` cell, in place, overwriting rather than accumulating). Both are followed by the guard, the same as the boundary operations.

The outcome block is written once and holds: planned, finished, returned (naming the ids, not only the count), unplanned work absorbed, commits in the window, days elapsed. It exists because the grouping is not recoverable afterwards (ADR-028) - and for no other reason, so nothing per-item goes in it.

**The window is the two boundary days whole**: from `<opened> 00:00:00` to `<closed> 23:59:59`, and `/cycle-close` prescribes the command with those times written out. The reason is git's, not this standard's: a bare `--since=<date>` / `--until=<date>` is an approxidate, resolved to that date at *the moment the command runs*, so the same command over the same history returns different counts at different times of day, and the cycle-open and cycle-close commits - which sit on the first and last day by definition - are both inside the window only when the open commit's time of day is later than the close commit's. A number written from the bare-date form is therefore not reproducible by the reader it was written for, which is the one thing the block has to be.

`/timeline-update` regenerates `docs/cycles/TIMELINE.md` whole from those blocks. Throughput is finished-plus-unplanned per day, taken **only from closed cycles** - an open cycle has no throughput, and using its planned count is how a timeline becomes a wish. Below **three** closed cycles it reports what is in flight and refuses to give a completion date, because one unusual cycle dominates an average of fewer. Above three it reports the spread as well as the mean, and gives a range rather than a figure when the spread is wide. Every projection carries the evidence it rests on; a cycle past its target and still open is named with the overrun, never softened.

## Algorithms & rules

1. If there is neither a cycle file nor a backlog, print the note and exit 0. Testing the cycles directory alone would never fire for an adopter, because the tree ships files into it. No cycles **but** a backlog still runs the block checks - exiting there would skip the only check a `core` repo gets.
1b. If cycle files exist but no backlog does, report that and stop: the pool half of the invariant cannot be checked, and printing OK would claim that it was.
2. Collect rows from `docs/backlog.md`, then from each cycle file, skipping `_`-prefixed basenames and rows inside HTML comments. In a cycle file only the `## Intents` section is read (a closed cycle's `## Outcome` table names the same ids); the pool is read whole. Each row yields its id and its status (last cell), with surrounding backticks, bold or italic markers stripped from both - markup around an id is formatting, not a different intent.
2a. The id cell is the column the header row names `id` (case-insensitive, re-resolved at each table's separator row), falling back to the first cell when no column is named `id` - so a prepended column (a priority, a team) does not disarm the check.
2b. Report a cycle file the guard cannot read rather than counting zero rows in it: no `## Intents` H2 at all, or rows under it whose id column holds no id. Zero rows is indistinguishable from a clean cycle, which is how a real duplicate was reported as OK - the header row, the header underline and the template's blank row are not rows for this purpose.
3. A row contributes its id once per file even if the file repeats it; the invariant is about *files*, not occurrences.
4. Group by id. Any id with more than one distinct file is a violation.
5. For each `blocked:<ref>` status: a violation if `ref` is the row's own id, if `ref` appears in no file, or if `ref`'s status is `done`.
6. Report every violation before exiting - never stop at the first.
7. For each cycle file whose `Status` field reads `closed`, collect every id named on a `Returned to the pool:` line in its `## Outcome` block. A violation if any such id is not present in the pool.

## Invariants

- An intent id MUST appear in at most one of: the pool, or one cycle file.
- The guard MUST NOT fail a repo that has no cycles directory.
- Template files (`_`-prefixed) MUST NOT contribute ids, or the shipped example would violate the invariant on arrival.
- A `blocked:<id>` reference MUST name an existing intent that is neither the row itself nor already `done`.
- A cycle file MUST carry its rows under the `## Intents` H2, with an id in the row's id column - and the guard MUST fail a cycle file that does not, instead of reading it as empty. The documented format and what the guard reads MUST be the same shape; they were not, and the folder manual's own example produced zero rows.
- An id a closed cycle's `## Outcome` block names as returned to the pool MUST be present in the pool.
- `assignee` MUST be empty on pool rows, and MUST NOT accumulate: one current holder, overwritten on reassignment (ADR-030).
- `size` MUST NOT be summed, converted to a number, or used in a projection at **any** stage, cold start included (ADR-029) - a cold-start read from sizes is a ranking, never a duration. This and the split-not-resize rule below are not script-enforced - they are review rules, and the records say so rather than implying a guard that does not exist.
- An item that does not finish inside its cycle MUST be split (`split:<new-id>` plus a new backlog row for the remainder), never re-sized (ADR-029).

## Edge cases

- A repo with cycles but an empty pool - valid; everything is in flight.
- The same id in two cycles of *different* teams - still a violation. Two teams believing they own the same intent is the failure this exists to catch.
- An id inside an HTML comment (the shipped examples) - ignored, so an example block cannot trip the guard.
- A cycle file with no rows under `## Intents` - valid; a cycle can be opened before anything is pulled in. A cycle file with no `## Intents` section at all is not the same thing, and is an error.
- An id written in backticks (`` `PAY-2` ``) - matched the same as a plain `PAY-2`.
- A table with a column prepended before `id` (a priority, a team) - the id column is still found by its header name, not disarmed by the extra column.
- An open cycle's `## Outcome` block naming a `Returned to the pool:` line - not checked; only a `closed` cycle's claimed returns are verified against the pool.

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
- **A cycle the guard cannot read is an error.** GIVEN a cycle file whose intents sit under `### Intents`, under `## Work`, or under no heading at all WHEN the guard runs with `--block` THEN it names the file, names the required heading and exits 1 - it does not report the duplicate the file holds as OK.
- **An unreadable row is an error.** GIVEN a cycle file with rows under `## Intents` whose first cell carries the id and the title together WHEN the guard runs with `--block` THEN it reports rows with no id in the first cell and exits 1.
- **Markup around an id is not a different id.** GIVEN `` `PAY-9` `` in a cycle and `PAY-9` in the pool WHEN the guard runs THEN it reports the duplicate; the same holds for `**PAY-9**` and for a `blocked:` status written in backticks.
- **The documentation is the format.** GIVEN the cycle example in `docs/tree/docs-cycles.md` WHEN the guard runs over a repo carrying it verbatim THEN it reads every intent in it - a page documenting a shape the guard cannot read makes the guard decoration.
- **A core repo still gets the block checks.** GIVEN a backlog and no `docs/cycles/` at all WHEN the guard runs with `--block` on a stale block THEN it exits 1 rather than skipping as not-using-cycles.
- **A backticked id is still read.** GIVEN an id written as `` `PAY-2` `` in one file and plain `PAY-2` in another WHEN the guard runs THEN it reports the clash - the backticks are stripped before comparing.
- **A prepended column does not disarm the id check.** GIVEN a table with a column ahead of `id` (a priority) WHEN the guard runs THEN the id is still resolved by its header's name, and a duplicate of that id across files is still caught.
- **A return that never landed is caught.** GIVEN a closed cycle whose `## Outcome` block names `PAY-9` as returned to the pool, and `PAY-9` absent from the backlog, WHEN the guard runs with `--block` THEN it names `PAY-9` and the cycle file, and exits 1.
- **A return that did land passes.** GIVEN the same claim, with `PAY-9` actually present in the backlog, WHEN the guard runs THEN it exits 0.
- **An open cycle's outcome text is not checked.** GIVEN a `## Outcome` block naming a returned id that is absent from the backlog, in a cycle whose `Status` is still `open`, WHEN the guard runs THEN it exits 0 - only closed cycles make this claim for real.
- **A cycle-boundary split gets a status, not an invention.** GIVEN an intent that finishes only part of itself by the close date WHEN `/cycle-close` runs THEN it cuts a new backlog row for the remainder and sets the original row's status to `split:<new-id>`, the template's declared vocabulary rather than a repo-specific spelling.
- **The commit count is reproducible by whoever reads it.** GIVEN a cycle opened 2026-05-04 (open commit 09:30) and closed 2026-05-25 (close commit 18:05) WHEN the outcome block's count is taken with the prescribed times written out THEN it is the same number at any hour and includes both boundary commits; taken with bare dates it varies with the clock and drops one of them - which is how the same three counts were published wrong twice before this was written down.
- **A cold-start read never manufactures a date.** GIVEN fewer than three closed cycles and items carrying `size` WHEN `/timeline-update` runs THEN it reports a size-based shape (heavier or lighter than the last cycle) and gives no date - the same "no date" outcome as when items carry no size at all.

## Open questions

The name is held open - [`work-periods`](../../docs/open-questions/work-periods.md). Renaming `cycle` later changes a directory, this spec and the guard's paths; nothing else depends on the word.
