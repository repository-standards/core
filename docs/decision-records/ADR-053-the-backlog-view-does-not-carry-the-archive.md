# ADR-053: The backlog view does not carry the archive

| | |
| --- | --- |
| **Status** | Accepted (2026-08-19) |
| **Date** | 2026-08-19 |
| **Author** | Łukasz Bodurka |
| **Tags** | backlog, dashboard, methodology |

## Context

[ADR-051](ADR-051-closing-a-backlog-row-is-a-relocation-not-a-deletion.md) made one clause of
its dashboard section binding: "Closed rows stay **reachable in the view**, and that
requirement is the part of this section that binds. Work that has been relocated has not been
hidden." It named the "show finished" chip as the surface. The chip was removed in 0.9.13 for
an unrelated defect - it made the count under the pool mean two different things depending on
a button nobody remembers pressing - which left the requirement standing with nothing carrying
it, tracked as `ARCHIVE-VIEW-1`.

Two things are true of the code as it stands, and neither was checked when the requirement was
written:

- **No surface reads the archive.** `standard/scripts/generate-dashboard/index.mjs` contains no
  reference to `backlog-archive.md` in any form.
- **Timeline, the candidate the row named first, could not have carried it.** It reads
  `docs/sprints/TIMELINE.md` - sprint throughput, forecast and verdict against target. Closed
  backlog rows are not among its inputs, and giving it them means a second, unrelated input for
  a tab that answers a period question.

Nothing is broken yet only because no archive exists: not in this repository, not in any
adopted one. So the requirement has bound nothing for six days while blocking the first cut
that would make it matter.

The question it exists to answer - *what happened to `<id>`* - is a lookup by id against a
file holding one row per closed item and a pointer to where its content went. Opening the file
answers it. So does `git log -p backlog.md`, for anyone who has the repository at all.

## Options considered

- **A. Build a control on the Backlog tab.** Rejected: it reinstates the defect that removed
  the chip, for a reader who has not appeared. The pool's count would again mean two things
  depending on a control's state.
- **B. Give Timeline a second input.** Rejected: it makes one tab answer two unrelated
  questions, and couples a core-profile file to a scale-profile projection.
- **C. No surface at all.** Chosen.

## Decision

**The archive is read as a file, not through the backlog view.** No tab, no control, no
generator input, at either profile.

ADR-051's reachability clause is narrowed to nothing rather than reassigned. It was written
against hiding closed rows *inside the pool view* - a mask over a live list, which is what
`hideDone` was. A separate file is not a mask, and "not hidden" is satisfied by the row being
in a file with its own name.

Where closed work does surface as history - what a period finished, how much moved - it is
built from the changelog and the sprint records, which are the artifacts shaped by period
already.

## Consequences

- **Positive:** the first archive cut is unblocked, and `ARCHIVE-VIEW-1` closes without
  building anything. The requirement had made every future release cut wait on a design nobody
  needed yet.
- **Positive:** each dashboard tab keeps one input.
- **Negative:** a reader who only ever sees the generated dashboard cannot see a closed row.
  Taken deliberately: period questions are answered by Timeline and Reports, and the id lookup
  is one file open away for anyone with the repository.
- **Negative:** this narrows a clause of a record accepted six days earlier, on measurement
  rather than on use. If it is wrong it is wrong cheaply - a surface is additive, and nothing
  here removes data.

## Revisit when

- Someone asks *what happened to `<id>`* and neither `backlog-archive.md` nor
  `git log -p backlog.md` answers it. That is the concrete signal, and it is a sentence
  somebody says rather than a threshold to invent.
- Or an archive grows past the point where opening the file is a search - the same size at
  which ADR-051 already says the release headings become the split.

## Related

- [ADR-051](ADR-051-closing-a-backlog-row-is-a-relocation-not-a-deletion.md) - the record this
  narrows. Its clauses 1 to 4, the guard and the `where` pointer are untouched.
- [ADR-046](ADR-046-backlog-is-the-one-index-open-questions-and-ideas-get-a-type.md) - why a
  `decided` open question stays in the pool rather than archiving, which is the other half of
  what the view shows.
