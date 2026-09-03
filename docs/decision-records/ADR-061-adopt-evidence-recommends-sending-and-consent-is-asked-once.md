---
status: Accepted
date: 2026-09-04
---

# ADR-061: `adopt.evidence` recommends sending, and its consent is asked once, not per item

## Context

`adopt.evidence` (ADR-055) offers two options today - send an anonymised excerpt after
reading it, or send nothing - with `recommended: null`, on the stance that consent must
never be nudged. Downstream, `record-run` (ADR-045) shows the assembled batch once and then
asks a separate yes/no **per item** (step 6, borrowing the per-issue pattern from ADR-021),
so a full align session with twenty or more user turns produces twenty or more identical
send-or-not prompts for one decision the person already made at intake.

The owner, running this standard on his own repositories, named this directly: the same
question asked dozens of times for one thing he had already agreed to, with no faster path
than reading the whole excerpt every single time before saying yes. His requested shape,
given in order: send it (the default) / send it, once I have read it / send nothing.

## Decision

**`adopt.evidence` gains a third option and a recommended default.** Options, in order:

1. **send it** (recommended) - `record-run` assembles the anonymised excerpt (machine
   paths and identity scrubbed, the repository named only as `/git/<repo>`) and sends it;
   the scrub is the safeguard, not a mandatory read gating every send.
2. **send it, once I have read it** - the same assembly, held for one more yes after it has
   been shown.
3. **send nothing**

`recommended` in `standard/.claude/elicitation/points.json` becomes `"send it"`.
`allowed_provenance` stays `human` alone: recommending an answer is not inferring or
stubbing one, and the person still has to say which of the three they mean.

**`record-run` stops asking per item, and stops re-asking what intake already answered.**
Which of the three `adopt.evidence` answers was given governs the whole run:

- **send it** - assemble, scrub, send. No further question; the run report says what went
  out.
- **send it, once I have read it** - assemble, scrub, show the whole batch once (not row by
  row), let the person edit or drop a row, then ask exactly one final yes/no: send now, or
  keep it local.
- **send nothing** - `record-run` does not fire, unchanged from today.

The Level 1 / Level 2 richness choice (ADR-045) is unchanged and still asked once per run;
this decision touches only how many times, and with what default, consent for the chosen
level is asked.

## Consequences

- Positive: one decision instead of a number of them that grows with the session, and a
  default that matches how most people want to finish.
- Negative, stated plainly rather than hidden: the invariant `record-run`'s own "What this
  is not" section states - "consent is per run and per item, never inferred from a prior
  yes" - no longer holds for the **send it** path. Choosing it trusts the automated scrub alone, which
  the skill has always described as pattern matching, not a guarantee, and the intake answer
  now stands in for every later decision that used to ask again. This is a deliberate trade
  of a safety net for speed, made by the standard's own owner on his own repositories, not a
  silent regression discovered later.
- `record.participation` (whose run this is) is untouched: it is an identity claim, not a
  send-or-not choice, and keeps `recommended: null`.
- `specs/elicitation/spec.md`'s R28 text no longer states that every consent point must
  declare `recommended: null`; `adopt.evidence` is now the documented exception and
  `record.participation` remains the case the rule was written for.

## Compliance

- `standard/.claude/elicitation/points.json`: `adopt.evidence.recommended` is `"send it"`,
  its `asks` and `why` fields rewritten.
- `skills/align-to-standards/intake.md`: the `[adopt.evidence]` block lists the three
  options above, in order.
- `skills/record-run/SKILL.md`: steps 5-6 rewritten so the intake answer governs the batch,
  and no per-item question remains.
- `specs/elicitation/spec.md`: the `recommended: null` requirement narrowed to the case it
  actually describes.
- `tools/elicitation-points-check.mjs` continues to pass: the check enforces "first option
  equals recommended," and `adopt.evidence`'s first option is now "send it," matching.

## Revisit when

- A **send it** choice ships something a human read would have caught - the scrub is a
  pattern match, not a guarantee, and this decision removes the forced read that used to sit
  in front of every send.
- Real runs show most people still choose to read first, which would mean the added option
  bought a third choice without changing outcomes.

## Related

- [ADR-055](ADR-055-the-adoption-close-runs-before-the-pull-request.md) - the decision this
  narrows for `adopt.evidence` specifically; its placement-at-intake decision is unaffected.
- [ADR-045](ADR-045-record-run-feeds-the-existing-corpus-consent-gated.md) - the two-level
  design (unchanged) and the per-item pattern this replaces with batch-once for `record-run`.
- [ADR-021](ADR-021-adoption-feeds-the-standard.md) - the per-issue consent pattern
  `record-run` borrowed; unaffected everywhere else it is used (a handful of
  friction/stack-request issues, not a session's worth of prompt rows).
