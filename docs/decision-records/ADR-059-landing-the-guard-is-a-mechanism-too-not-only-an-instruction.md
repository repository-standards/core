# ADR-059: Landing the guard is a mechanism too, not only an instruction

| | |
| --- | --- |
| **Status** | Accepted (2026-09-03) |
| **Date** | 2026-09-03 |
| **Author** | Łukasz Bodurka |
| **Tags** | elicitation, guards, adoption, bootstrap, validation |

## Context

ADR-054 made asking a mechanism with three layers - a declaration, a hook that refuses the
write, a ledger - because the same promise as prose, in the right file, in plain words, held
on zero of twenty-three skills it was written into. It also named, in its own Consequences,
the one gap that mechanism cannot close by itself: **"a `PreToolUse` hook is wired when the
session starts, and an unaligned repository has no wiring - so the adoption run, which is
the run this exists to stop, is the one run the hook does not cover unless it is landed
first."** The fix chosen there was `steps.md`'s numbered item "0.": land the four files, then
stop and say the session must restart. Deliberately ungated, because gating them would need
the guard wired before it exists.

That fix is prose, in the right file, in plain words, told once, near the top. It is the
exact shape ADR-054 diagnosed as insufficient for everything else this standard asks about -
and on 2026-09-03, LomondGroup/propertycloud PR #1199 (PC-2847) showed it fails the same way.
A fresh adoption committed `docs/adoption-intake.md` a commit before the elicitation guard
ever landed in that repository. `self-verify` was green the whole time: nothing anywhere
compared *when* the guard landed against *when* a gated artifact did, only whether the
ledger the guard itself produces is internally consistent once it exists. A human reading the
diff caught it. The mechanism this standard built specifically so that catch would not depend
on a human reading a diff did not cover the one write that mattered most - its own.

Three things about that failure decide the fix:

**A single instruction, however early, is a promise held only while it is remembered.**
Nothing about restating "land the guard first" more loudly closes the case where a session is
resumed, compacted, or otherwise reaches phase 1 or phase 2's first write acting on a stale
memory of "probably already did that" - the instruction was true once, earlier in a
conversation that no longer fits in view.

**The gap is only checkable after the fact, from history, not from the working tree.** Once a
gated artifact and the guard both exist on disk, nothing about their *content* says which one
was written first - `.standards-version`'s bare existence was already rejected in ADR-054 as
the wrong signal for this, because every long-lived adopter has one from years before any of
this landed. Order has to be read from commit ancestry, the same way `reached()` already
reads "the commit that introduced `.claude/elicitation/points.json`" to decide whether a path
predates the guard - just walked the other way: not "did the adoption write this after the
guard," but "did this reach a commit before the guard did."

**All three of Gate 0, Gate 2 and the version pin predate the guard in the standard itself.**
`docs/adoption-intake.md` since 0.9.0, `.standards-version` since 0.4.0,
`docs/adoption-assessment.md` since 0.9.6 - the guard since 0.9.23. Any repo that adopted
between those versions and now runs `update-to-latest` to retrofit the guard has every one of
these gate artifacts' real, legitimate history predating the guard's brand-new landing commit
in that repo. A check keyed only on "did X land before the guard" fails every such repo on
its first update, which is the same false-positive shape ADR-054 already refused once.

## Options considered

- **Restate the instruction more prominently and stop there.** Already tried, in the form
  `steps.md` shipped; PC-2847 is the same failure ADR-054's own Context section diagnosed for
  every other point before this one. Rejected as the only layer, kept as one of three.
- **Gate the four bootstrap files themselves behind an elicitation point.** Symmetric with how
  every other artifact in this standard is protected, and rejected in ADR-054 for the reason
  that still holds: the hook that would refuse the write does not exist yet at the moment the
  write needs refusing. Circular.
- **Scope the order check to commits reachable from `origin/HEAD`, or take a `--base` ref.**
  Would let a check reason about "this branch" rather than all of history. Rejected:
  `self-verify.mjs` invokes every `kind: "static"` guard, this one included, with no base ref -
  only `kind: "diff"` guards receive one, run separately against the PR's diff in CI. A design
  that needed a base ref would silently never receive one in the invocation this guard
  actually runs under. It is also the harder design to test, since exercising it needs a
  fabricated origin remote rather than a plain temp repo, for a distinction the task this
  guard protects does not need: two commits either have an ancestry relationship or they do
  not, on any branch.
- **Key the update-to-latest exemption off a date, or off the two commits sharing a parent.**
  Rejected for the same reason `reached()` reads ancestry rather than timestamps: dates are
  restated by whoever writes the commit and prove nothing about order; two arbitrary adoptions
  months apart share no parent by construction.

## Decision

Landing the guard gets the same treatment ADR-054 gave asking: more than one layer, because
none alone is sufficient, and the layers check different failure moments.

1. **Structural emphasis, at the file the agent reads.** The guard-landing step - `steps.md`'s
   former numbered item "0." - moves out to its own file,
   [`land-guard.md`](../../skills/align-to-standards/land-guard.md), content preserved
   verbatim. `SKILL.md` gains a new **Step -1**, read before Step 0 - Intake and before any
   route is chosen, whose only content is the pointer to it. `steps.md` no longer carries the
   guard-landing text inline; an agent opening it to start the reconcile waves finds a pointer
   at the top instead of a numbered step it could mistake for optional. Named Step -1 rather
   than Step 0a specifically so `intake.md` and `onboard.md`'s own existing internal
   references to "Step 0" - which mean the intake step, not this one - need no change.
2. **A cheap, repeated precondition, at the start of every phase's first write.** Not relying
   on the instruction having been seen once, earlier in the same conversation: `steps.md`
   (step 1), `greenfield.md` and `onboard.md` each open their first write action with the same
   three-line check -

   ```bash
   test -f .claude/elicitation/points.json \
     && grep -q elicitation-guard.mjs .claude/settings.json \
     && test -f docs/adoption-provenance.md
   ```

   - and a nonzero exit means stop, go read `land-guard.md`, land the guard, restart. A
   concrete command with an exit code to check is the point: it does not ask the agent to
   *reason* about whether the guard probably already landed, it reads the tree. `stack.md` and
   `layer2.md` carry no such check, because both routes require a pre-existing
   `.standards-version`, which itself implies a prior aligned run that already had the guard
   as a required manifest entry.
3. **A mechanical, after-the-fact backstop, in the guard's own script.**
   `scripts/elicitation-provenance.mjs` now also checks that the guard's own commit - the
   oldest commit that added `.claude/elicitation/points.json`, the same marker `reached()`
   already reads - is an ancestor of the oldest commit that added each of
   `docs/adoption-intake.md`, `docs/adoption-assessment.md` and `.standards-version`, never a
   date comparison. **Exempted whenever `.standards-version` already existed the commit before
   the guard's own commit**: that is the update-to-latest shape, a repo catching up a guard
   the standard did not carry when it first aligned, read the same way ADR-054 already reads
   "was this written before the questions existed" - from what the tree looked like one commit
   before the guard landed, never from whether a file exists now. This check is R28, `blocks:
   true`, alongside the ledger-consistency checks the same script already ran.

None of the three depends on the others holding. A session that skips Step -1 entirely still
meets the precondition check at phase 1. A session that also talks past the precondition
check still meets the commit-order backstop once it commits. Only a run that defeats all
three reaches the state PC-2847 reached - and that run now fails a required, blocking check
instead of waiting for a human to notice the diff.

## Consequences

- **The four bootstrap files stay deliberately ungated.** Nothing here changes that; the new
  checks look at the commits that exist, they never refuse a write the way the elicitation
  guard itself does.
- **A repo whose history genuinely put a Gate artifact before the guard now fails a required
  check instead of relying on review.** This is the direct fix for PC-2847: the same defect
  self-verify reports as drift, mechanically, on every run from then on.
- **A repo running `update-to-latest` to retrofit the guard onto years of prior history is not
  penalized for that history.** The `.standards-version`-existed-before-guard exemption is the
  same shape ADR-054 already established for `reached()`, applied to this check.
- **Three checks instead of one instruction is more surface, not a wash.** The phase-entry
  precondition is three lines of bash repeated in three files; the order check is one function
  in a script that already runs. Neither is a new moving part a repo has to configure.
- **The order check anchors on one file, `.claude/elicitation/points.json`, not all four
  bootstrap files.** Consistent with `adoptionWrote()`'s own choice of the same single marker
  for "has the guard landed here" - the four files land together in the same step, so one of
  them stands for the group.

## Revisit when

- The phase-entry precondition check gets skipped the same way the single instruction did -
  if that happens, the fix is not a fourth restatement, it is moving the check somewhere an
  agent cannot reach the phase's first write without running it.
- A repo needs the update-to-latest exemption to be narrower than "any prior
  `.standards-version`" - for example, one that predates the guard by so many major versions
  that treating it as the same lineage stops being defensible.
- A repo's guard-landing step commits the four files across more than one commit, and the
  single-marker anchor (`points.json` alone) stops representing "the guard landed" for that
  repo's own history.

## Related

- [ADR-054](ADR-054-asking-is-a-mechanism-with-provenance-not-an-instruction.md) - the
  mechanism this ADR extends: three layers because one instruction did not hold, and the
  Consequence ("the layer cannot bootstrap itself") this ADR closes.
- [ADR-042](ADR-042-intake-is-a-required-artifact-not-a-performed-step.md) - the same
  distinction between a step performed and a step whose performance leaves a checkable record,
  applied here to the guard's own landing rather than to intake.
- [ADR-020](ADR-020-intake-first-adoption.md) - intake runs before any route is chosen; Step -1
  now runs before intake, for the same reason at one remove.
- `standard/SPEC.md` R28 - the rule both the existing ledger checks and the new order check
  enforce.
