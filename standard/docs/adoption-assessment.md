# Adoption assessment - <repo>

> Gate 2's artifact: what the eight-pass `repo-assessment` found, before the alignment wave
> changed anything (standard ADR-048). Updated in place on every re-entry, never recreated.
>
> Gate 0's record is [`adoption-intake.md`](adoption-intake.md); Gate 5's count is the
> alignment scope block in the backlog. This file is the middle one: the evidence the count
> is derived from, and the thing a human reads before saying go or no-go.

## Maturity per pass

One row per pass, and all eight are rated - a pass with no row is a pass nobody ran, which is
what `adoption-gates` fails on. `absent` / `partial` / `solid` only; if the honest answer is
"solid but for one thing", the row is `solid` and the thing is a finding below.

| # | Pass | Maturity | What that rests on |
| --- | --- | --- | --- |
| 1 | Skeleton & docs | {{absent / partial / solid}} | {{the evidence, not the impression}} |
| 2 | Decisions in code | {{...}} | {{which forks are decided, undecided, or decided inconsistently}} |
| 3 | Capabilities & specs | {{...}} | {{domains found; specs present; is there a capability map}} |
| 4 | Quality gates | {{...}} | {{test tiers and what they cover; typecheck strictness; lint/format}} |
| 5 | CI/CD | {{...}} | {{the gate demonstrably firing, not a workflow file existing}} |
| 6 | Security & supply chain | {{...}} | {{secret scanning, committed secrets, lockfile, cooldown}} |
| 7 | Dependencies & stack | {{...}} | {{detected stack; outdated or unmaintained deps; a matching layer}} |
| 8 | Drift & health | {{...}} | {{code-versus-doc contradictions, dead code, debt density, hotspots}} |

## Top risks

The few things that would hurt, ordered. Not a repeat of the table - a table says where the
repo stands, this says what to be afraid of. Where a risk has nothing to do with the standard
and the standard merely made it visible, say so: that is the most credible thing an assessment
can report.

1. {{risk, what it costs, and what makes it real}}

## Findings by owner role

The role that has to act, not the role that noticed. Every finding lands in exactly one group
and points at the backlog item that carries it, so the count in Gate 5 and this report cannot
disagree about what is outstanding.

### product / business

| Finding | Where it goes |
| --- | --- |
| {{...}} | {{backlog item}} |

### architect

| Finding | Where it goes |
| --- | --- |
| {{...}} | {{backlog item}} |

### dev

| Finding | Where it goes |
| --- | --- |
| {{...}} | {{backlog item}} |

### agent (mechanical, no human judgment needed)

| Finding | Where it goes |
| --- | --- |
| {{...}} | {{backlog item}} |

## Closed by the alignment wave itself

What this run fixed on its way through, so the report is not read as a list of things still
outstanding. Delete the section on an assessment-only run - there, nothing was closed, and an
empty heading claiming otherwise is worse than no heading.

- {{...}}
