---
status: Accepted
date: 2026-08-09
---

# ADR-046: the backlog is the one index; open questions and ideas get a `type`

## Context

Three files answered "what's live in this repo" independently: `backlog.md` (intents with
a DoD, per ADR-010), `docs/open-questions/README.md` (24 standing doubts, each with a
decision in force or none), `docs/ideas/README.md` (features not yet approved). Each keeps
its own table, its own columns, its own status words. A reader - or the generated dashboard -
has to open three files to see everything currently live, and the dashboard's Backlog tab
already reads only `backlog.md`, so open questions and ideas were invisible there even though
the Documents tab already merged them elsewhere.

Nothing about the three kinds' own nature demanded three tables. `docs/method/taxonomy.md`'s
own test for when a split needs a record - "is this a live, contestable trade-off that gets
re-litigated?" - names this one.

## Decision

**One table, three kinds, a `type` column.** `backlog.md` gains `type` with values `task`,
`bug`, `open-question`, `idea`. Existing rows default to `task`. The two folder tables
(`docs/open-questions/README.md`, `docs/ideas/README.md`) are removed; the folders and their
per-topic files stay, now linked *from* the backlog row instead of indexed by a separate
table. Each README keeps its prose - what the type means, how it differs from its neighbors,
the front-door framing for new maintainers - since that explanation belongs to the type, not
to the table that used to sit under it.

**Decision records stay separate.** An ADR or BDR is a record of a fork *taken*; a backlog
row is a live intent or a standing doubt. Folding records into the backlog would either lose
the immutability a record is for, or force every accepted ADR into an open-ended table it
does not belong in. This was checked directly with the owner rather than assumed.

**Status is per-type, not one shared vocabulary.** `task` and `bug` keep `todo` / `doing` /
`blocked` / `done` unchanged. `idea` keeps its existing vocabulary verbatim: `idea` /
`exploring` / `approved` | `parked` | `dropped`, graduating to `graduated`.

`open-question` gets two values: `open` (nothing decided yet) and `decided` (a decision
stands). This needed its own shape because an open question does not have a completion
state - the whole point of the type, stated in `docs/open-questions/README.md` since before
this record, is that a decided entry is **still actively open to a better answer**. That is
not a task sitting at 90% done; it is the type's permanent condition. A third state for
"currently being re-litigated" was considered and dropped: every decided entry is equally
open to challenge at all times, so there is no structural difference in *openness* between
one decided last week and one decided a year ago - only a difference in how strong the
standing answer is, and that already lives in the row's `why` text (the doubt, in one line)
rather than needing a field of its own. Reusing `done` for a decided open question was also
considered and dropped: `done` reads as settled-forever to a task-shaped reader, which is the
opposite of what the type means to say.

## Consequences

- `standard/scripts/generate-dashboard/index.mjs`'s `parseBacklog()`/`asItem()` and
  `src/page.js`'s backlog-tab rendering gain optional support for `type` and a per-type status
  legend - backward compatible, since an adopter's `backlog.md` without a `type` column reads
  every row as `task` exactly as it does today.
- `CONTRIBUTING.md`, `docs/README.md`, and `tools/docsite.mjs`'s nav lose the standalone
  `open-questions.html` / `ideas.html` entries generated from the now-removed tables; the
  folders' READMEs still render, just without a table.
- This is a **repo-own (zone 1)** decision. The shipped standard's R14 (ideas) and R15
  (backlog) contracts for adopters are untouched - an adopter is not required to run a
  `docs/open-questions/` folder at all, and one that does keeps whatever shape it already
  has. Nothing here supersedes ADR-010; it extends the backlog's shape to also carry the two
  artifact classes ADR-010 already named as neighbors, without changing what ADR-010 decided
  about the tracker bridge.

## Compliance

`backlog.md` parses with a `type` column on every row; `docs/open-questions/README.md` and
`docs/ideas/README.md` carry no table; every topic that had a table row now has an equivalent
`backlog.md` row linking to its still-existing detail file.
