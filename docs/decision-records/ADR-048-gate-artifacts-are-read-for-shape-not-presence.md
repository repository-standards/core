# ADR-048: Gate artifacts are read for shape, not presence

| | |
| --- | --- |
| **Status** | Accepted (2026-08-10) |
| **Date** | 2026-08-10 |
| **Author** | Łukasz Bodurka |
| **Tags** | methodology, adoption, verification, consent |

## Context

ADR-042 made Gate 0's intake a required manifest entry, on the argument that an
agent which ran the question round and one which skipped it produced an
indistinguishable diff. The same argument applies to Gates 2 and 5, and was
never made for them.

The checkmap ([docs/method/adoption.md](../method/adoption.md)) calls the gate
order and "every gate produces its artifact" **rigid, framework-enforced**, and
specifies two outputs precisely: Gate 2 emits a health report (maturity per pass
as `absent` / `partial` / `solid`, top risks, findings grouped by owner role),
and Gate 5 emits a counted backlog in a given shape, every item naming its owner
role, with the total described as "the go/no-go signal". Nothing in the
framework read either one.

A real adoption run on 2026-08-10 (a Node application, ~250 files changed)
reached **`self-verify` drift 0 having produced neither**. The repository's owner
got the numbers only when they asked for them, and prose in place of both
artifacts. Their verdict was that the adoption had happened *to* them rather
than guided them, and on the evidence that is the correct reading: the run
measured the repo and skipped the person, and the green number then certified a
process that had not happened.

Two further findings from the same run make the mechanism concrete rather than
theoretical:

- **The count's format is documented where the adopter never looks.** It lives in
  the checkmap, a Zone 1 method page; `standard/docs/backlog.md`, the template an
  adopted repo actually receives, carries the `owner` column but has never
  mentioned the scope block at all. An agent filling the template correctly
  produces a backlog with no count in it.
- **The consent question is asked before the evidence exists.** Step 0 asks
  "plan-only or execute" as part of the intake round - before a single assessment
  pass on a brownfield repo. The answer is therefore given about a wave nobody has
  seen. Assessment-only is already a legal stop after Gate 2, so the machinery for
  a real go/no-go exists and is simply not used as one.

## Options considered

- **A - strengthen the wording in the skill.** The instruction to produce a health
  report was already there and already specific about its contents. Wording that
  is followed when convenient is what produced this run. Rejected.
- **B - make the artifacts required manifest entries and stop there.** This is
  ADR-042's mechanism, and it is necessary but not sufficient here. Presence is
  the whole of intake's contract; it is not the whole of these two. A file can
  exist, be non-placeholder, satisfy `fill-from-repo`, and still omit the count
  that the gate exists to produce. Rejected alone, adopted as half of D.
- **C - a review-time checklist.** The blast radius has landed by the time anyone
  reviews a 250-file alignment PR, which is the same objection ADR-042 raised
  against auditing at step 8. Rejected.
- **D - chosen. A manifest entry for the missing artifact, plus a guard that reads
  both artifacts' shape.** Presence closes the "the file is not there" hole via the
  existing mechanism; the guard closes the "the file is there and says nothing"
  hole that presence cannot see. A guard cannot carry a manifest exception, so
  neither half can be waived by an adopting repo that would rather not.

## Decision

Option **D**. Concretely:

1. **New rule, R27** (`SPEC.md`): the assessment and count gates MUST leave
   artifacts that carry what the gate is for - all eight passes rated on the
   three-value scale, top risks named, findings grouped by owner role, and a
   scope block whose stated total is the sum of its own categories with every
   item naming its owner role.
2. **New manifest entry**: `docs/adoption-assessment.md`, `adapt: fill-from-repo`,
   `required: true`, `profile: core`, `rule: R27` - shaped after the
   `docs/adoption-intake.md` entry it is the sibling of.
3. **New template**, `standard/docs/adoption-assessment.md`.
4. **New guard**, `standard/scripts/adoption-gates.mjs`, registered in the
   manifest's `guards` and run in CI with `tools/adoption-gates-test.mjs`.
   It checks shape and arithmetic, never judgment: it cannot tell a
   considered `partial` from a guessed one, and does not pretend to. It **skips
   itself** when no assessment file exists, because self-verify already reports
   that as drift and counting it twice would make one gap look like two.
5. **`standard/docs/backlog.md` gains the alignment scope block**, so the format
   reaches the repo that has to produce it rather than living only in the method
   page.
6. **The consent question splits.** Step 0 still asks "plan-only or execute" and
   still records the answer, but that answer is an intent. The consent that
   licenses a wave is re-asked after Gate 2, with the drift number and the count
   in front of the user. A user who said "execute" at Step 0 and stops after
   reading the report has not gone back on their word, and the skill says so.

## Consequences

- Positive: an adoption that reaches drift 0 has necessarily produced the two
  artifacts a human reads to decide, and produced them with a total that adds up
  and an owner on every item. The failure mode this ADR was written from becomes
  impossible to reach silently.
- Positive: the arithmetic check catches a class of rot nothing else would - a
  hand-maintained total drifts from its parts the first time an item is added,
  and a total that no longer describes its own breakdown reads as authoritative
  while describing nothing.
- Negative: one more required file on every adopted repo, including an
  assessment-only run - which is the run that most obviously has one, so the
  record is genuine rather than manufactured to satisfy the gate.
- Negative: the guard enforces a shape, and a repo whose honest assessment does
  not fit eight passes has to say so as a deviation rather than by silently
  omitting rows. That is the intended trade: the alternative is a report whose
  missing pass is indistinguishable from a pass nobody ran.
- Neutral: R27 starts with no validation case, the same way R26 did.

## Confirmation

`standard.manifest.json` carries the `docs/adoption-assessment.md` entry and the
`adoption-gates` guard; `SPEC.md` carries R27 and its rule count reads R1-R27;
`onboard.md` writes the report as the assessment pass's closing action and stops
for the go/no-go before the first wave; `standard/docs/backlog.md` carries the
scope block; a repo whose scope block claims a total its categories do not sum to
fails `adoption-gates` while `self-verify` still reads drift 0.

## Revisit when

Agents start producing shape-correct but guessed or hollow ratings that pass the
arithmetic guard - the guard explicitly checks shape and arithmetic, never judgment, and
"cannot tell a considered `partial` from a guessed one." That would reproduce this
record's own failure mode one level deeper, the same way ADR-042's gap reappeared here.

## Related

- [ADR-042](ADR-042-intake-is-a-required-artifact-not-a-performed-step.md) - the
  mechanism this reuses, and the ADR whose argument this one extends to the two
  gates it did not cover.
- [ADR-020](ADR-020-intake-first-adoption.md) - the intake round whose
  plan-only-vs-execute question this ADR splits into an intent and a consent.
- [ADR-006](ADR-006-personas-are-a-validation-gate.md) - the prior case of a gate
  artifact that had to be more than present to be worth having.
