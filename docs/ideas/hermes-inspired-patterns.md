# Patterns worth adopting from Hermes Agent

| | |
| --- | --- |
| **Status** | idea |
| **Date** | 2026-08-18 |
| **Owner** | bodurkalukasz |

## The itch

A comparison against [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent)
(a real, shipping AI agent with persistent memory and self-authored skills) found that most of
what it does - skill libraries, decision provenance, drift-style reconciliation - is already
built here, usually more rigorously (measured, gated, precedence-ordered rather than a free
"confidence" field nobody enforces). Two mechanisms in its actual source, not its marketing,
are not yet answered here and are concretely useful:

- `cron/suggestions.py` - a usage-triggered, consent-gated, dedup-latched suggestion: the
  agent notices a recurring ask, proposes turning it into something durable, never acts
  without an explicit yes, and never re-nags a dismissal.
- `agent/curator.py` - a background pass, triggered by inactivity, that consolidates or
  archives only what an *agent itself* created, never anything the user authored, and never
  deletes - only archives.

## For whom

**Standard-bearer Staszek** - the recurring-work-to-skill question (`STACK-LIFE-1`) is his:
he is the one who would otherwise have to notice a pattern by hand and decide whether it is
worth a skill. **Coding agent** advances too: this is a shape for the agent's own housekeeping,
not a product feature end users see.

## Provisional shape

| Pattern | What it would bring | Effort (cold start, S/M/L per ADR-029) |
|---|---|---|
| **A - usage-triggered skill suggestion** | Answers `STACK-LIFE-1` ("does a stack's recurring work have a home") without inventing one from a single observed case, which the backlog item itself already flags as armchair design. Instead of a person deciding by feel that something recurs, the loop counts it: same shape of request N times, in `record-run`'s or `align-to-standards`' own evidence, surfaces a proposal naming its source, and a dismissal is remembered so it never asks twice. Raises the evidence bar `STACK-LIFE-1` is explicitly gated on. | **M** - not new infrastructure: `record-run` and the human-prompting corpus already capture per-run evidence; this adds a dedup-keyed proposal step on top and a place to file the yes/no. Bounded mainly by deciding what counts as "recurring" without a second corpus to maintain. |
| **B - agent-scoped archive-only curation** | A narrower, explicit restatement of a rule this repo already holds (ADR-051: closing a backlog row relocates, never deletes) - but scoped one level deeper: anything an *automated pass* tidies must be content that pass itself produced (e.g. its own stale discovery entries, superseded skill drafts), never anything a human wrote, and archive is the only destructive-looking verb available to it. Worth writing down before any future automated cleanup exists, not after one overreaches. | **S** - this is a principle to record (a rule, maybe folded into ADR-051 or its own short ADR), not a system to build. No mechanism needs to exist yet; the backlog item is "decide and write the rule" so the next actual cleanup tool inherits the boundary instead of inventing its own. |

Both are patterns to fold into *this* project's own mechanisms where they already have a
home - Pattern A extends `STACK-LIFE-1`'s evidence gate rather than replacing it; Pattern B is
a scoping rule for automated tidying, not a new subsystem. Neither implies new tooling by
itself; sizes above are cold-start (ADR-029) and will be wrong until something in this shape
actually gets built once.

## Open questions

- **Does Pattern A duplicate `STACK-LIFE-1`, or complete it?** `STACK-LIFE-1` is gated on
  `STACK-ALIGN-1` (the Layer 2 path has never executed on a real repo) precisely because
  inventing skills from zero observed runs is armchair design. Pattern A is a candidate
  *mechanism* for the evidence-gathering `STACK-LIFE-1` is waiting on, not a separate idea -
  approving this one might just mean folding it into that backlog row rather than shipping it
  standalone.
- **Where would Pattern B's rule actually live?** As a clause in ADR-051, as its own ADR, or
  deferred until an automated cleanup tool is proposed and needs the boundary stated for real
  rather than speculatively.
- **Is "recurring" measurable from what `record-run` already captures**, or does Pattern A
  need its own counting field the corpus does not currently have?

## Graduation (fill when approved)

Backlog intent: `<id>` - spec: `specs/<capability>/` - records: `<ADR/BDR ids or "none">`
