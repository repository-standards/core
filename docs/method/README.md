# docs/method/ - the standard's method manual

How a repo gets ON the standard and how the method runs day to day. These docs are
the standard's own teaching material - versioned with the standard, **adopted by reference from the living standard - always latest, never as copies** (the same mechanism as the
decision records: ADR-004, ADR-023). A client repo carries the artifacts the method
produces; the method itself lives here, one home, one history.

| Doc | What it is |
|-----|-----|
| [adoption.md](adoption.md) | the adoption checkmap - the gated path from unaligned to aligned + self-verifying |
| [repo-assessment.md](repo-assessment.md) | the read-only eight-pass assessment an agent runs on first contact |
| [taxonomy.md](taxonomy.md) | where each kind of knowledge lands - ends the "ADR or rule?" question |
| [checklist.md](checklist.md) | the decision checklist - the forks every repo consciously decides, with the paved road |
| [ways-of-working.md](ways-of-working.md) | the PO -> Dev -> AI loop - roles, statuses, the clarify gate |
| [working-with-specs.md](working-with-specs.md) | real situations -> the exact prompt -> what the standard does; specs day to day |
| [discovery.md](discovery.md) | from a meeting to a spec, with provenance - one worked example, dossiers, typed blockers |
| [changelog-process.md](changelog-process.md) | two outputs, one source, one cut - the changelog + release-notes model |

## Why this shape, and how to use it

The shipped tree ([`standard/`](../../standard/)) is strictly the client repo at day
zero: client-authored artifacts plus the operating manuals for the tools it ships.
The method - how to get there and how to run - would only drift if copied into every
repo, so it stays here and is read at latest - `main` IS the living standard
(`https://github.com/bodurkalukasz/repository-standards/blob/main/docs/method/`);
your `.standards-version` records the state your repo last aligned to (ADR-025).
An agent aligning a repo reads these from its standards checkout; a client repo links
them, never vendors them.
