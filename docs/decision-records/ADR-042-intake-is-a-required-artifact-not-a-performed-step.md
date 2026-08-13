# ADR-042: Intake is a required artifact, not a performed step

| | |
| --- | --- |
| **Status** | Accepted (2026-08-09) |
| **Date** | 2026-08-09 |
| **Author** | Łukasz Bodurka |
| **Tags** | methodology, adoption, verification, process |

## Context

ADR-020 made adoption intake-first: Step 0 measures the repo, then runs one
question round - intent, technology, appetite, profile, tracked-work location,
existing-knowledge sources, plan-only-vs-execute. What it decided is well
specified. What is missing is a record of what it found and what was asked:
the round happens in conversation and its answers scatter into whatever gets
written downstream (`PRODUCT.md`, `docs/personas.md`, the manifest's
`profile` field) with nothing capturing the intake pass itself - the
self-verify drift it measured, the lifecycle and AI-policy signals it read,
the question-round answers as given. An agent that runs Step 0 in full and
one that skips it and guesses produce an indistinguishable diff: self-verify
checks that the downstream artifacts exist, never that intake happened. This
is drift nothing currently catches, the same shape as an earlier gap this
standard already closed - a required outcome with no manifest entry to make
it checkable (GATE-12/schema, ADR-037).

Surfaced during a triage of the private research backlog (2026-08-09): of
eight named open findings, three were already closed by prior ADRs
(ADR-035, ADR-037, ADR-039) and had been mis-reported as still open. This
one had not been closed by anything - Step 0's own record was still
unenforced.

## Options considered

- **A - a stronger instruction only.** Step 0 in `SKILL.md` is already the
  most detailed section in the file; rewording it further does not create
  anything that checks whether it ran. Rejected.
- **B - a new `PreToolUse` hook that blocks skipping the round.** Hooks fire
  on tool calls, not on skill sections, and cannot distinguish "mid Step 0 of
  `align-to-standards`" from any other `Read`/`Bash` call in the same
  checkout - it would either false-positive on unrelated work in this repo or
  never fire at all. This repo's own root carries no `.claude/hooks` for
  exactly this reason: the operate-phase guards the standard ships
  (`no-force-push.sh`, `no-remote-db-writes.sh`, ...) protect an *adopted*
  repo's ongoing operations, not this repo's own authoring process. Rejected.
- **C - audit after the fact, at step 8.** The blast radius has already
  landed by then - a skipped intake means wrong routing, a wrong profile, a
  stack offered without consent - and a closing-loop review does not undo the
  run it is reviewing. Rejected.
- **D - chosen. Intake produces a required manifest artifact.** Reuse the
  exact mechanism `PRODUCT.md` and `docs/personas.md` already use
  (`fill-from-repo`, `required: true`, a rule of its own, never deferred in
  the wave order) instead of inventing new enforcement. `self-verify` already
  checks required-file presence; this makes intake as checkable as everything
  else the manifest tracks, at zero new tooling cost.

## Decision

Option **D**. Concretely:

1. **New rule, R26** (`SPEC.md`): Step 0 MUST leave `docs/adoption-intake.md`
   as a required manifest entry, filled before any greenfield, brownfield or
   stack work proceeds, and never deferred to a later wave.
2. **New manifest entry**: `docs/adoption-intake.md`, `adapt: fill-from-repo`,
   `required: true`, `profile: core`, `rule: R26`.
3. **New template**, `standard/docs/adoption-intake.md`, shaped like
   `standard/docs/PRODUCT.md`: the state Step 0 measured (self-verify drift,
   lifecycle/policy signals found), and the question-round answers (intent,
   technology, appetite, profile, tracked-work location, existing-knowledge
   sources, plan-only-vs-execute).
4. **`SKILL.md`** gains one instruction at the close of Step 0 - write this
   file as the pass's last action, before routing - and the re-entrant
   wave-ordering section gains a non-deferral clause placing it *before* the
   existing `PRODUCT.md`/`docs/personas.md` clause, since the wave order
   itself is read from evidence intake produced.
5. A repo re-entering align (a check-up, an update, a later wave) updates
   this file in place rather than recreating it - the same living-document
   rule (R4) every other artifact in the tree already follows.
6. `docs/facts.json`'s tracked `spec-rules` claim (`SPEC.md`'s own line 13)
   moves with the rule count automatically once corrected; the one other live
   restatement found by a full-repo grep, `docs/validation/ai-prompting/method.md`'s
   depth-level table, is corrected by hand to "R1-R26" alongside it. Every other
   hit is either generated (`docs/validation/ai-prompting/README.md`'s
   "rules with zero cases" line is computed by `tools/validation.mjs` from the
   highest rule any case actually tests, not from `SPEC.md`'s count, and stays
   correct with no edit) or a point-in-time run record quoting what was true
   the day it ran (`docs/validation/ai-prompting/runs/2026-08-04.json`,
   `docs/validation/human-prompting/{scenarios,runs}/2026-08-07-c-python.*`) -
   this standard does not rewrite history (R4), so those stay as written.
7. R26 has no case yet, the same way any newly written rule starts with none;
   `tools/validation.mjs` reports it as a zero-case rule honestly, the moment a
   real case exists to test it, rather than this change inventing one to fill
   the gap on day one.

## Consequences

- Positive: intake stops being a performed-but-unverifiable step; a run that
  skipped or shortchanged it now fails `self-verify` the same way a missing
  `PRODUCT.md` does; the artifact is a paper trail a later maintainer or a
  check-up run can read without reconstructing the interview from memory.
- Negative: one more required file on every adopted repo, including a repo
  whose only run so far was assessment-only - assessment-only still runs
  Step 0 in full (ADR-020), so the record is genuine, not manufactured to
  satisfy the gate.

## Confirmation

`standard.manifest.json` carries the `docs/adoption-intake.md` entry;
`SPEC.md` carries R26 and its rule count reads R1-R26; `SKILL.md`'s Step 0
writes the artifact as its closing action and the re-entrant section orders
it first; a repo with no intake record and an otherwise-complete tree reports
one drift, not zero.

## Revisit when

An agent can fill `docs/adoption-intake.md` with fabricated or hollow content that still
satisfies `fill-from-repo`/`required: true` - that would reproduce, one level down, the
exact indistinguishable-diff problem (a run that performed Step 0 versus one that guessed)
this record was written to close.

## Related

- [ADR-020](ADR-020-intake-first-adoption.md) (adoption is intake-first - the
  step this ADR gives a checkable record, without changing what it asks).
- [ADR-006](ADR-006-personas-are-a-validation-gate.md) (the non-deferral
  pattern this reuses - certain gate artifacts never wait for a later wave).
- [ADR-037](ADR-037-a-repo-may-register-more-than-one-stack.md) and
  [ADR-039](ADR-039-capabilities-whose-code-is-not-here.md) (the two prior
  ADRs the 2026-08-09 triage found already-closed for the same class of
  problem - a real outcome with no manifest entry to check it against).
