# repository-standards - backlog archive

> Where a closed row from [`backlog.md`](backlog.md) goes
> ([ADR-051](docs/decision-records/ADR-051-closing-a-backlog-row-is-a-relocation-not-a-deletion.md)).
> The row moves at the release cut; its content moves first. `where` names what the content
> became, and that pointer is the whole purpose of the file - this archive holds the row and
> the pointer, never prose of its own. Grouped by release heading; if it outgrows one file,
> the headings are where it splits. Enforced by `standard/scripts/backlog-archive-check.mjs`.
>
> No surface in the dashboard reads this file, and that is a decision rather than an omission
> ([ADR-053](docs/decision-records/ADR-053-the-backlog-view-does-not-carry-the-archive.md)).

## 1.0.2 - 2026-09-02

| id | title | type | where |
|---|---|---|---|
| COUPLING-VERSION-1 | Bumping the version stops tripping the coupling guard | task | [docs/decision-records/ADR-056-the-release-tag-is-made-by-ci-and-the-version-is-stated-once.md](docs/decision-records/ADR-056-the-release-tag-is-made-by-ci-and-the-version-is-stated-once.md) - closed by the second of the row's two routes: the version string stopped living inside coupled code, rather than the guard learning to tell it apart from behaviour |

## 0.9.17 - 2026-08-19

| id | title | type | where |
|---|---|---|---|
| ARCHIVE-VIEW-1 | Decide where a relocated backlog row resurfaces in the view | task | [docs/decision-records/ADR-053-the-backlog-view-does-not-carry-the-archive.md](docs/decision-records/ADR-053-the-backlog-view-does-not-carry-the-archive.md) - no surface, at either profile |
