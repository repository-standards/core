# ADR-037: A repo may register more than one technology stack

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-08-06 |
| **Author** | bodurkalukasz |

## Context

R20 names one file for the Layer 2 registration: a stack declares what adopting it means in
`stack.manifest.json`, "a repo that adopted one carries it", and `self-verify` counts one
drift across both layers. `self-verify.mjs` implemented that literally - one filename, read
once.

Validation case `GATE-12` measured what happens to a repo whose stacks are not one. The
worked target was `flutter/flutter`: a Dart framework beside a native engine, permanently,
with neither migrating to the other. It could register exactly one. The second stack's
entries were not checked, contributed nothing to drift, and - the part that makes this worse
than a missing feature - **nothing said a stack had been ignored**. The repo would read
`drift 0 - 100% adopted` with half its technology layer unverified.

Reproduced on the current tree before anything changed: a fixture carrying
`stack.manifest.json` and `stack.dart-flutter.manifest.json` reported only the first, and
the second manifest's required entry never appeared in the output at all.

The prior round logged this as a contract change rather than fixing it unilaterally, which
was the right call: R20 names the filename, and an engine that invents a second convention
on its own is how a standard stops meaning one thing.

## Options considered

- **A `stacks` array inside one `stack.manifest.json`.** Rejected: the file is authored and
  shipped by the stack repo, one per technology (ADR-016). A combined file has no owner -
  every stack would have to know about the others, or the adopting repo would hand-merge two
  upstream files and own the merge conflict forever.
- **A `stacks/` directory of manifests.** Rejected as more structure than the case needs, and
  it would orphan the single-stack name that every existing adopter carries.
- **Leave it and tell a two-stack repo to pick one.** Rejected: it is not a real answer for
  a repo that genuinely runs both, and the failure mode is silent - the number keeps
  reporting full adoption of a layer it stopped measuring.
- **A namespaced sibling filename.** Chosen.

## Decision

A repo carries **one stack manifest per stack it has adopted**, and `self-verify` reads all
of them:

- `stack.manifest.json` is unchanged and remains the name for a repo with one stack. Nothing
  an existing adopter carries has to move.
- A repo whose stacks coexist adds `stack.<technology>.manifest.json` per stack. The engine
  matches `/^stack(?:\.[A-Za-z0-9][A-Za-z0-9._-]*)?\.manifest\.json$/` at the repo root and
  reads every match **in filename order**, so two runs on one tree report in the same order.
- Each file produces its own note naming the file and its `technology`; **the drift number
  stays one number across every layer**, which is R20's actual promise.
- An unparseable stack manifest is drift naming the file. Silence there would reproduce the
  defect this record exists to fix, one level down.
- **Two stacks declaring the same path is reported, not resolved.** The path is checked once
  per declaration - so it counts twice - and the run names both files. Collapsing them means
  picking a winner between two upstream repos this one does not own, possibly with different
  recorded content; saying so and letting the adopter take it upstream is the honest move.

## Consequences

- A repo with two permanent stacks can be verified at all, and the number covers both.
- The single-stack path is byte-for-byte what it was, which is most adopters.
- **Cost accepted:** a duplicated path inflates the denominator slightly. The alternative -
  a silent collapse - hides a real disagreement between two stack repos, and the warning is
  cheap to read and rare to see.
- **Cost accepted:** the filename now carries meaning (the technology), and nothing checks
  that it matches the manifest's own `technology` field. A mismatch is cosmetic - both are
  printed - and a check would fail repos whose stack repo simply named the file differently.
- The stack registry (`stacks.json`) is untouched: this is about how an adopting repo records
  what it adopted, not about what is official.

## Confirmation

`GATE-12` is the case. Four cases in `tools/self-verify-drift-test.mjs` hold it in both
directions: two stacks both count and are both named; a shared path is checked once per
declaration and the doubling is stated; a file that merely resembles the name
(`mystack.manifest.json`) is not read as a stack; and an unparseable second manifest is
drift rather than a skip.

## What this rules out

A repo declaring the same stack twice under two names, and any attempt to reconcile two
stacks' claims automatically. The engine reports; the stacks' owners decide.

## Related

- [ADR-016](ADR-016-stacks-are-satellite-repos.md) - one repo per technology, which is why
  the second registration is a second file rather than a bigger one.
- [ADR-022](ADR-022-stacks-linked-not-version-locked.md) - a stack links to the ecosystem
  rather than to a core version range; unchanged here.
- R20 (two layers, one drift number), amended here by one clause.
