# Decision records: ADR / BDR

Every decision that shapes the product or the system gets a record. If a decision
has no record, it does not exist - reviewers and agents treat undocumented
divergence as a red flag.

> **Which decisions should a project even have?** See the
> [decision checklist](checklist.md) - the menu of forks a project keeps hitting
> (datastore, auth, API shape, release strategy, ...) with the standard's paved-road
> default for each. It drives greenfield scaffolding and the `onboard-repo` sweep.

Two streams, two questions - **decisions only**:

| Stream | Question | Folder | Lifecycle |
|---|---|---|---|
| **ADR** - Architecture Decision Record | *why (technical)* | `docs/adr/` | Immutable once Accepted; change = supersede |
| **BDR** - Business Decision Record | *why (business / product)* | `docs/bdr/` | Immutable once Accepted; change = supersede |

Naming: `ADR-NNN-slug.md` (3-digit, gapless, never reused). Same for BDR. A retired
record is marked `Superseded` / `Withdrawn`, not deleted - the number stays a
permanent anchor.

> **Decision records hold *why*, not *how it behaves*.** Behavior lives in the
> [living capability specs](../specs/README.md); structure lives in
> `ARCHITECTURE.md`. There is no TDR stream - "living technical design" is absorbed
> by the capability specs (behavior) and `ARCHITECTURE.md` (structure). Keep each
> ADR **lean**: context, the decision, options, consequences, revisit-when - not a
> description of how the feature works.

## What counts as a decision record here (glossary)

Set by [ADR-001](adr/ADR-001-decision-record-policy.md).

- **Format:** every record uses **MADR** (Markdown Any Decision Records) - see
  [`adr/_template.md`](adr/_template.md), which carries a `Confirmation` field (how the
  decision is verified in practice).
- **ADR = an architecturally-significant _technical_ decision, read broadly:**
  framework, library, tooling, infrastructure, data-model or protocol choices - not
  enterprise-architecture-only. Choosing Tailwind over Bootstrap, or one library over
  its alternatives, is an ADR. Sub-scope goes in the record's `Tags`
  (`architecture` / `data` / `infra` / `security` / ...), never in the acronym.
- **BDR = a business / product decision** - a separate stream, different stakeholders
  and altitude. Business decisions do not enter the technical log.
- **No TDR and no bespoke sub-type acronyms** (ATDR / AADR / ...): they draw arbitrary
  lines and add jargon; `Tags` does the same job with a stable acronym. "Living
  technical design" is behaviour (capability specs) + structure (`ARCHITECTURE.md`).
- **Future non-technical kinds** (e.g. marketing) get their own stream when one
  actually arises - same MADR format, not pre-built.

## Records vs working docs

A record (ADR/BDR) captures a **decision**. The research, analysis, screening, or
workstream material that *leads to* a decision is a **working doc**, not a record -
keep it as a plain doc under `docs/` and link it from the record it informs. A
vendor/market/name screening is a working doc; the choice it produces is the BDR. A
legal analysis is a working doc; the resulting structure decision is the ADR.

Organize working docs by **lifecycle**, not by topic-of-the-week:

- **Phase-boxed exploration** that finishes - discovery, a screening, a one-off
  analysis - lives in a phase folder (e.g. `docs/discovery/`) and is archivable once
  it has fed its decision.
- **Standing workstream or living library** that outlives any phase - compliance,
  competitor tracking - gets its own top-level `docs/<workstream>/` folder, kept
  current.

A working doc is never the source of truth for behavior or decisions - the specs and
the records are. If a working doc and reality diverge, it is **stale**, not
authoritative.

## Status lifecycle (ADR / BDR)

`Proposed -> Accepted -> (Superseded by ADR-MMM | Deprecated | Rejected)`.

Never edit an Accepted ADR/BDR to change the decision - write a new one that
supersedes it.

**Not a record until approved** (ADR-010): a speculative idea gets no ADR/BDR/spec -
`Proposed` means a decision awaiting ratification, not a maybe. Ideas live in
`docs/ideas/` with their own statuses and graduate into records only when approved.

## Altitude hierarchy (which wins on conflict)

```
PRINCIPLES.md
  -> ADR / BDR (accepted decisions - why)
    -> specs/<capability> (behavior - what)  +  ARCHITECTURE.md (structure - how built)
      -> conventions -> .cursor/rules + skills
        -> code
```

`specs/` and `ARCHITECTURE.md` are peers (behavior vs structure), both constrained
by the accepted decisions above them.

Higher wins. If code disagrees with an Accepted ADR, **stop** and propose a
superseding ADR - do not silently diverge.

## Governance

- One decision per record. Consider at most ~3 options - avoid analysis paralysis.
- Every ADR states **Revisit when**: the concrete signal that would reopen it.
- Link each record to the standards/docs it drives and to its issue/ticket key.
- ADR = technical why, BDR = business why. "How it behaves" belongs in the
  capability specs, "how it is structured" in `ARCHITECTURE.md` - do not restate
  those inside a decision record; link them.
