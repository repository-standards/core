# ADR index

Architecture Decision Records - the technical *why*. The record test, the lifecycle and the
altitude hierarchy: [decision records (by reference)](https://github.com/repository-standards/core/blob/main/docs/tree/docs-decision-records.md).

| # | Title | Status |
|---|-------|--------|
| - | (none yet) | - |

A row's first cell is the number linked to its file, as in
`[001](ADR-001-postgres-over-dynamo.md)`, and the rest is free text.
`scripts/decision-records-check.mjs` cross-checks this table against the files on disk, so
the **link** is what identifies the record; a bare `001` works too, and either form may
carry the prefix (`[ADR-001](...)`).

Add one row per record. Use [`_template.md`](_template.md). Numbers are gapless and
never reused.
