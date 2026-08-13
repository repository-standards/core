# ADR-020: Adoption is intake-first - measure, then one question round

| | |
| --- | --- |
| **Status** | Accepted (2026-07-29) |
| **Date** | 2026-07-29 |
| **Author** | Łukasz Bodurka |
| **Tags** | methodology, adoption, layer-2, process |

## Context

The adoption flow had grown three heads. The align router
(`skills/align-to-standards/SKILL.md`) ran the technology step "after routing,
detection first"; the greenfield phase asked about the stack at its step 4; the
brownfield phase offered it at step 8 - the very end, after specs and guards. Three
files, three timings for the same step. Worse, the technology question reached the
user **late or never**: a brownfield run could reconcile for a long while before the
stack offer surfaced, Layer 2 consent was never explicitly gathered, and no route
existed for "tell me where I stand and give me the plan" (assessment only) or "just
add the node stack to my pinned repo". The gates in `standard/docs/adoption.md`
claimed one rigid order for both directions, though brownfield factually assesses
before it has personas. And the counted plan said how much work - but not **who**
(business, architect, dev, or the agent) must act on each item.

## Options considered

- **A - Keep the late/stack-last flow.** Each phase file keeps its own timing;
  technology surfaces whenever a step happens to reach it. Rejected: the three
  timings already contradicted each other, Layer 2 consent stayed implicit, and
  assessment-only stayed unnameable.
- **B - Technology-first hard reorder.** Ask the stack first, scaffold it
  immediately, hang everything off it. Rejected: **for whom -> what -> how holds for
  greenfield** (ADR-006) - the stack serves the product, so its ADRs and scaffold
  stay after personas and product, whatever gets asked first.
- **C - Intake-first (chosen).** One step 0 measures the repo, then asks everything
  in one round - including the Layer 2 consent - while each phase keeps the actual
  stack reconciliation at its own defined place.

## Decision

Option **C**. Concretely:

1. **Step 0 - intake** opens every align run. Measure first: `.standards-version`
   present (run `self-verify`), a partial skeleton (`AGENTS.md`, `docs/`, `specs/`)
   without a pin, or nothing. Then one short question round: **intent** (start a new
   repo / bring an existing repo to the standard / assessment only / update the
   pin), **technology** (detected from evidence - `package.json`, `pyproject.toml`,
   `go.mod`, `Cargo.toml`, `*.csproj` - then confirmed; greenfield asked outright),
   **appetite** (one focused PR vs a program of waves), **plan-only vs execute**.
2. **Layer 2 consent is gathered at intake**, with the technology answer ("this repo
   is <technology> - I'll offer the <technology> best practices from the registry
   alongside Layer 1; ok?"). The **reconciliation stays phase-defined**: brownfield
   right after the assessment (not at the end), greenfield after personas and
   product, a pinned repo adding a stack immediately (a fourth routing row).
   Compatibility stays **loose**: the stack links to the ecosystem by its
   `registry` back-pointer, not a core version range (ADR-022); a core
   manifest-contract break is a recorded migration - on any mismatch the agent
   warns and the user decides, never a hard stop.
3. **One gate walk, two evidence sources**: both directions walk 0 -> 2 -> 1 -> 3 ->
   4 -> 5 -> 6. Greenfield's vision interview and brownfield's assessment are the
   same gate (2) with different evidence; personas (1) are named from that evidence
   and then gate everything downstream. Brownfield: personas reconstructed
   from the assessment's evidence (auth roles, UI surfaces, API consumers), then
   confirmed. Invariants either way: no specs before confirmed personas; no
   recorded decisions before intake + assessment; every gate produces its artifact.
4. **Assessment-only is a legal, named outcome**: deliver the health report plus the
   counted plan, then stop. A product of the flow, not a failure mode.
5. **Every plan item names its owner role** - product/business (`PRODUCT.md`, BDRs,
   personas confirmation), architect (ADRs, boundaries), dev (specs, code, guards),
   agent (mechanical work it can do alone) - as an `owner` field in the backlog
   format, and grouped the same way in the assessment's health report.

## Consequences

- Positive: one question round replaces scattered-or-never; the Layer 2 offer is
  consented before any work starts; the three phase files agree on when the stack
  step runs; "where do I stand" is a first-class run, not an aborted one; the
  counted plan says who must act, so it can be handed to a team and split.
- Negative: **one more question round before any work** - even a trivial run starts
  with the intake; and the phase files must **stay cross-referenced to the gates**
  (each step naming the gate it fills) - a coupling every future edit to the flow
  has to maintain.

## Confirmation

`SKILL.md` opens with step 0 and routes four ways; `onboard.md` runs the stack offer
right after the assessment and reconstructs personas before any spec; `greenfield.md`
scaffolds without re-asking; `adoption.md` states both walk orders and the
assessment-only stop; the backlog format carries `owner`.

## Revisit when

- A new routing path emerges beyond the four named here (start new / bring existing /
  assessment only / add a stack to a pinned repo) that needs its own timing for the
  technology question - the single step-0 round assumes four, not more.
- The phase files drift out of sync with the gate cross-references intake depends on -
  the coupling this record names as an accepted, ongoing maintenance cost - to the point
  the single question round no longer reflects what each phase actually does.

## Related

- [ADR-006](ADR-006-personas-are-a-validation-gate.md) (personas are a validation
  gate - why for-whom-first holds and why brownfield confirms reconstructed personas
  before specs), [ADR-016](ADR-016-stacks-are-satellite-repos.md) (stacks as
  satellite repos - the registry and `stack.manifest.json` this intake consumes),
  [ADR-022](ADR-022-stacks-linked-not-version-locked.md) (stacks linked, not
  version-locked - why the compatibility check is contract-shaped, not
  version-shaped).
