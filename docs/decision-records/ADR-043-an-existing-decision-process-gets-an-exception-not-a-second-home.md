# ADR-043: An existing decision process gets an exception, not a second home

| | |
| --- | --- |
| **Status** | Accepted (2026-08-09) |
| **Date** | 2026-08-09 |
| **Author** | Łukasz Bodurka |
| **Tags** | methodology, adoption, decisions |

## Context

R5 requires a contestable, re-litigable choice to be recorded as a decision
record, and `docs/decision-records` is a required manifest entry every align
run fills. Nothing in Step 0 asks whether the target repo already has one.
Two real repos this standard was assessed against make the gap concrete:
git's design decisions run on its mailing list, a process older than this
standard by decades; vim's run through its own maintainer-led process.
Neither writes an ADR. Align, run as specified, would still propose
`docs/decision-records/` for both - not because either repo lacks a working
process, but because Step 0 never asked whether one already existed. The
result is not neutral: a repo gets a second, competing home for the same
class of decision, and the standard's own process (R6: an accepted record
must not be edited into a different decision) now has to coexist with
whatever authority the mailing list or the maintainer already carries -
two records of the same choice that can disagree.

This is the same shape as the AI-policy detection Step 0 already does
(`SKILL.md`'s four-shape read of `AI_POLICY.md`/`LLM_POLICY.md`/
`CONTRIBUTING.md`/`AGENTS.md`) - a repo's own file can answer a question this
skill would otherwise ask or, worse, silently override - just for a
different axis: not *may an agent contribute*, but *where do contestable
choices already get recorded*.

## Options considered

- **A - do nothing; let the repo end up with two homes.** The user notices
  the redundancy eventually and asks about it, or doesn't. Rejected: it is
  exactly the kind of silent side effect this standard's own intake
  philosophy (ADR-020) exists to prevent - measure and ask before acting,
  never assume.
- **B - detect it and hard-stop**, the same tier as an AI-policy ban. Rejected:
  an existing decision process is not a prohibition on this standard - it is
  a fact to weigh, and the right answer is very often "adopt ours anyway", not
  "the run cannot proceed". Treating it as a stop asks the wrong question.
- **C - chosen. Detect it, ask, and record either answer as data the manifest
  already carries.** The manifest's `exceptions` mechanism (R17: an update
  "preserves the repo's recorded deviations") already exists for exactly this
  shape - a required entry the repo consciously does not carry, with a
  reason. No new machinery: `docs/decision-records`'s existing manifest entry
  (`required: true`, rule R5) gets a `{ "kind": "file", "match":
  "docs/decision-records", "reason": "..." }` exception when the answer is
  "keep the existing process", and nothing when the answer is "adopt ours".
  `self-verify` reports the choice as excepted, never as an unmet
  requirement or a silent gap.

## Decision

Option **C**. Step 0's measurement pass (`SKILL.md`) gains one detection,
next to the existing governance-config read: a CONTRIBUTING/README pointer
to a mailing list or RFC process, an `rfcs/`/`doc/design/`/enhancement-
proposal directory, or a governance doc naming who decides and how. When
found, ask rather than assume: adopt this standard's ADR/BDR mechanism going
forward (the default), or keep the repo's own process, recorded as an
exception on R5's manifest entry with the reason named. No new rule number -
this is Step 0 procedure applying the manifest's existing exceptions
mechanism to a case R5 already covers, the same way the AI-policy read
applies existing judgment rather than adding new normative text.

## Consequences

- Positive: a repo with a real, working decision process no longer gets a
  second one imposed by omission; the choice either way is named and
  checkable (`self-verify` reads the exception), not left to be discovered
  later as an unexplained empty `docs/decision-records/` or an unexplained
  duplicate process.
- Negative: one more detection Step 0 has to run and one more question it may
  have to ask - on the large majority of repos with no such process, this
  costs nothing (the signals are absent, the question is never surfaced).

## Confirmation

`SKILL.md`'s Step 0 measurement pass names the detection and the two-answer
question; a repo that answers "keep mine" carries a `docs/decision-records`
exception with a stated reason instead of an empty required directory.

## Related

- [ADR-020](ADR-020-intake-first-adoption.md) (measure before asking - the
  intake philosophy this detection extends).
- [ADR-042](ADR-042-intake-is-a-required-artifact-not-a-performed-step.md)
  (the sibling Step-0 hardening landed the same day - a checkable record for
  what intake did, where this ADR is a checkable record for one specific
  thing intake now asks).
