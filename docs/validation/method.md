# How the validation suite is built - definitions and rules

The pages next to this one ([`README.md`](README.md), [`benchmark.md`](benchmark.md)) are
**generated** from `suite.json`, `targets.json` and `runs/*.json`. This page is the part that
is not: what a case is, what a number is allowed to mean, and which claims the data is not
permitted to support. It is written once and edited in place; the counts live in the data.

## The claim, and the bar it has to clear

The claim: **this standard has been executed against real repositories and real work, the
results are published including the failures, and anyone can re-run the portable half against
their own repository or their own standard.**

Three things make that claim survive a sceptic:

1. **Every number traces to a record.** No "we tested a lot". A number is the row count of a
   file in the repo, and `tools/validation.mjs --check` fails CI if a page states it
   differently.
2. **Failures are published with the same prominence as passes**, each naming what shipped to
   fix it, or saying plainly that nothing has. A suite with a 100% pass rate is either trivial
   or dishonest.
3. **The depth of each test is labelled.** "We assessed 100 repositories" and "we adopted 100
   repositories" are different claims and only one of them is true. The depth levels exist
   precisely so the strong claim is never made by accident.

## Definitions - so a count cannot be inflated

- **Case** - a falsifiable statement about the standard, with a stated procedure and an
  observable outcome: *a spec recording its open items as a numbered list instead of the marker
  syntax must not pass the clarify gate.* A case is not "we looked at the docs".
- **Target** - what a case is executed against: a public repository, a fixture repository, or
  the standard's own tree.
- **Observation** - one case executed against one target, with a verdict and evidence. The
  headline "hundreds of checks" is a count of observations, and the page says so in the same
  sentence it says the number.
- **Portable** - a case testing an idea *any* spec-driven, agent-operated repository standard
  would claim (does your clarify gate actually hold? does your code/spec coupling see a
  deletion?). The portable subset is what `benchmark.md` offers to other people. A case that
  greps a path only this tree has is **local**, and is labelled as such rather than quietly
  counted as portable.

**Depth level** of a target - this is where standards-validation usually lies, so it is a
required field, not an optional one:

| Level | Means |
|---|---|
| **L1 read** | the method's assessment passes applied to a read-only clone; nothing changed |
| **L2 dry adoption** | the align router's decisions worked out for real - what would land, which of R1-R25 are satisfiable, the honest drift number - still no changes to the target |
| **L3 aligned** | the standard actually applied to a working copy, guards run, drift measured to 0 or to a recorded stop |
| **L4 operated** | the repo then lived the loop for at least one full cycle of real work |

The distribution across levels is published on [`README.md`](README.md) and is the first thing
to read there. A suite that is all L1 has demonstrated its assessment method and nothing about
its adoption method, and must not be summarised as though it had.

## Structure on disk

```
docs/validation/
  method.md        this page - hand-written, the definitions above
  README.md        GENERATED - headline numbers, coverage, the open failures, how to re-run
  benchmark.md     GENERATED - the portable subset, written for someone else's standard
  suite.json       the cases: stable, reusable, versioned. The source of truth
  targets.json     the repositories and fixtures - shape, ecosystem, depth level, round
  runs/<date>.json one file per round: verdict + evidence + fix, per case per target
  counts.json      GENERATED - the headline numbers, so docs/facts.json can check a restatement
tools/validation.mjs  renders the two pages; --check fails CI on a stale render, on a case
                      with no verdict, and on a failure with neither a fix nor a waiver
```

A case in `suite.json` carries `id`, `title`, `area`, `tests` (the rule numbers or the
`PRODUCT.md` promise it covers), `promise`, `portable`, `severity_if_failed`, `given` / `when` /
`then`, `procedure`, and `status`. An observation in `runs/<date>.json` carries `case`,
`target`, `verdict`, `evidence`, an optional `fix` (the merged pull request), and `at`.

Verdicts: `pass`, `fail`, `partial`, `not-applicable` (**with the reason** - e.g. a cycle case
against a solo repo, where cycles are off by design), and `not-run` for a case that is specified
but not yet executed. A specified-but-unrun case is shown as planned, never hidden.

## Areas

Prefixes double as the coverage axis, so the generated page can list **rules with zero cases** -
the honest gap list, which is the part a sceptic reads first.

| Prefix | Area | What it tests |
|---|---|---|
| `INTAKE` | intake and lifecycle reading | does the standard read the repo before asking; does it decline when it should |
| `ADOPT` | brownfield adoption | the 8 assessment passes, drift as a number, waves |
| `GREEN` | greenfield creation | zero to drift 0, in the documented order |
| `SPEC` | spec lifecycle | specify, clarify, plan, tasks, implement, reconcile |
| `GATE` | the mechanical gates | clarify gate, coupling guard, cycle guard, self-verify, facts-check, schema-pair |
| `TRACK` | backlog, cycles, timeline | the pool, one-place invariant, assignment, close, forecast |
| `DEC` | decision records | ADR / BDR / idea routing, supersession, status regression |
| `DISC` | discovery | intake of raw material, provenance, contradiction detection |
| `TRIG` | triggering and hand-holding | does ordinary speech reach the right skill; the PO leg without developer rescue |
| `DOC` | documentation accuracy | living docs, fact restatement, staleness |
| `LOOP` | continuity across laps | does lap 2 inherit lap 1; does a fresh agent pick up state |
| `UPD` | update and drift | version delta application, recorded deviations, two layers |
| `STACK` | Layer 2 composition | core + node greenfield and brownfield, one drift number |
| `SEC` | security baseline | secret scanning, advisory process, negative scope |
| `SHAPE` | repo-shape conformance | the assumption a repo shape breaks (governance, language, non-code, scale) |

## What the data is not allowed to prove

These are constraints on how the numbers may be summarised anywhere - the README, the site, a
post - not caveats to be relegated to a footnote:

- **Assessment is not adoption.** Until `FIELD-1` lands, "walks a messy repo back to health"
  is a design claim supported by dry runs, and every page saying otherwise is wrong.
- **Both sides of every fixture share an author.** The fixtures prove the mechanics work. They
  prove nothing about somebody else's repository. `EXHIBIT-1` already says this; no page may
  quietly contradict it.
- **Agent-executed observations carry agent error.** Rounds have produced confident findings
  that were false on verification. The count of disconfirmed claims is published alongside the
  confirmed ones, because a suite that never records a false alarm is not being checked.
- **A cited fix is not a verified fix.** A `fix` field records what was attempted. A later round
  re-runs the case against the current tree; an attempt that did not fully hold stays `fail`,
  with its pull request still named, rather than being counted as resolved because it read as
  landed.

## Adding to it

New cases go in `suite.json`, new repositories in `targets.json`, new results in a new
`runs/<date>.json` - then `node tools/validation.mjs` regenerates the two pages. Never edit the
generated pages; `--check` will fail the pull request, which is the point of it.
