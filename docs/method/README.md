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
| [working-with-ai/](working-with-ai/README.md) | driving the agent itself - the practices that hold up, each checked against evidence rather than vibes |
| [working-with-specs.md](working-with-specs.md) | real situations -> the exact prompt -> what the standard does; specs day to day |
| [discovery.md](discovery.md) | from a meeting to a spec, with provenance - one worked example, dossiers, typed blockers |
| [changelog-process.md](changelog-process.md) | two outputs, one source, one cut - the changelog + release-notes model |

## Find your case, skip the theory

Every doc here opens with the situations it handles and the exact line you say. If you
are in a hurry, start from the situation rather than the table:

| You are... | Start here |
|---|---|
| holding a repo you did not write | [repo-assessment](repo-assessment.md) - read it before changing anything |
| putting a repo on the standard | [adoption](adoption.md) - greenfield interview or brownfield reconstruction |
| unsure where something you wrote down belongs | [taxonomy](taxonomy.md) - one map, one answer |
| about to pick a technology | [checklist](checklist.md) - the forks, with the paved road for each |
| building a feature and wondering who does what | [ways-of-working](ways-of-working.md) - PO -> Dev -> AI |
| writing or changing behavior | [working with specs](working-with-specs.md) - the prompt per situation |
| holding meeting notes, mails, half-decisions | [discovery](discovery.md) - raw material, with provenance |
| driving the agent itself | [working with AI](working-with-ai/README.md) - what holds up, with the evidence |
| shipping a release | [changelog process](changelog-process.md) - two outputs, one cut |

## Why this shape, and how to use it

The shipped tree ([`standard/`](../../standard/)) is strictly the client repo at day
zero: client-authored artifacts plus the operating manuals for the tools it ships.
The method - how to get there and how to run - would only drift if copied into every
repo, so it stays here and is read at latest - `main` IS the living standard
(`https://github.com/bodurkalukasz/repository-standards/blob/main/docs/method/`);
your `.standards-version` records the state your repo last aligned to (ADR-025).
An agent aligning a repo reads these from its standards checkout; a client repo links
them, never vendors them.
