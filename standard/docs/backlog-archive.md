# Backlog archive

<!-- Where a closed row goes (ADR-051). Closing a row is a relocation, not a deletion: a
     closed row is often the only place a finding was ever written down - a control that
     turned out to protect nothing, a design killed by a probe, an answer of "correct as
     built, nothing to change" that produced no commit and so never reached the changelog.

     The row moves here at the release cut, by whoever cuts the release, and its content
     moves first: the finding to a record, a spec or a dossier; what shipped to the CHANGELOG.
     A finding that closes off a design ("we cannot, the platform answers 403") is a decision,
     not behaviour - a record has to name what would reopen it, and a spec line does not.
     `where` names what the content became - that is the whole point of the file, and
     `scripts/backlog-archive-check.mjs` fails a row that arrives without one.

     This archive holds the row and a pointer, never prose of its own. Two copies of a finding
     rot in two places; an index into one copy does not.

     Group by release heading. If it outgrows one file, the headings are where it splits.

     A repo that has closed nothing does not need this file - delete it until the first row
     moves, and the guard skips itself in the meantime. -->

## <version> - <YYYY-MM-DD>

| id | title | type | where |
|---|---|---|---|
| `<PAY-3>` | `<what the row was>` | `task` | `<docs/decision-records/ADR-012-....md>` |
