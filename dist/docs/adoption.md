# Adoption - the checkmap a repo passes to reach the standard

Adopting the standard is not a vibe or a one-shot scaffold - it is a **defined, gated
path** from "unaligned" to "aligned + self-verifying". The **gates are rigid** (framework-
side, in order, each with an exit criterion and a required output). **What to skip, add, or
sequence inside a gate is the agent's call** during adaptation - recorded, not silent.

The same checkmap serves both directions:

- **Greenfield** - a new repo. The agent *interviews* to fill each gate (guided build).
- **Brownfield** - an existing, messy repo. The agent *reads the code* to fill each gate
  (reconcile), reconstructing what the repo already chose.

Every gate produces a **document and/or tasks**. The path ends with a **counted backlog**
(how many tasks to full alignment) and a **green `self-verify` (drift 0)**. Nothing is
"done" on a hand-wave; each gate has an artifact you can point at.

## The gates (in order)

| # | Gate | Greenfield (interview) | Brownfield (read code) | Output | Exit criterion |
|---|------|------------------------|------------------------|--------|----------------|
| 0 | **Intake & description** | Ask: what is this, in one sentence? Problem, why now? | Scan the repo; write what it *appears* to be and do | `PRODUCT.md` draft (a description the agent can reason from) | The agent can state what the product is |
| 1 | **Personas - who** | Name 3-6 user types with the user | Infer users from the code, auth roles, UI; confirm | `personas.md` (primary marked) + target-personas BDR | Every later gate has a persona to point at |
| 2 | **Vision / Assessment** | Goals, non-goals, success in 3 months | Run the 8-pass `repo-assessment`: what exists, what's missing, where code and intent drift | `PRODUCT.md` goals **or** an assessment report | The gap between now and aligned is written down |
| 3 | **Decisions** | Pick topology/stack/boundaries from the catalog | Detect what the code **already chose**; record it retroactively | Foundational **ADRs/BDRs**; the rest queued | No load-bearing fork is silently undecided |
| 4 | **Capabilities & specs** | Slice into capabilities (by domain, not page); write the first specs | Map existing capabilities; extract verbatim contracts (`file:line`), then synthesize specs | `specs/<capability>/` - persona-anchored, buildable where it counts | Money/security/data paths are buildable + specced |
| 5 | **Backlog - count the work** | Turn unspecced capabilities + known work into items | Turn every missing spec, unrecorded decision, and known drift into items | `backlog.md` with a **task count** ("N to full alignment") | The scope is a number, honestly stated |
| 6 | **Verify** | - | - | `.standards-version` + manifest carried; `self-verify` green | `drift 0`; PRs opened |

Greenfield runs this via the `greenfield-start` skill; brownfield via `assess -> align ->
onboard` (`repo-assessment`, `align-to-standards`, `onboard-repo`). The checkmap is the
spine; those skills are how each gate gets filled.

## Rigid vs. the agent's discretion

- **Rigid (the framework enforces):** the gate order, that each gate produces its artifact,
  and the exit criteria. You do not write specs (Gate 4) before you have personas (Gate 1).
- **The agent's call (during adaptation):** *which* ADRs a repo needs, *which* capabilities
  to spec now vs. queue, what to **skip** (with a one-line recorded reason) and what to
  **add** beyond the defaults. Skipping is allowed; skipping *silently* is not.

## Counting the work (Gate 5)

Adoption is incremental, never a big-bang dump - so the honest deliverable before committing
is **the size of the job**. Gate 5 emits the backlog as a counted list:

```
Alignment scope for <repo> -> standard@<version>
  specs to write / raise to buildable ....  12
  decisions to record (ADR/BDR) .........   5
  drift to reconcile ....................   3
  guards / structure to install .........   4
  ---------------------------------------------
  24 tasks to full alignment
```

That number is the go/no-go signal and the roadmap. The repo can adopt a **slice** (the
money paths first) and leave the rest queued - the count makes that trade explicit.

## After alignment: modernize (bring the tech current)

A repo often reaches the standard *because* it has fallen behind - old runtimes, stale
dependencies, dated patterns. Bringing it current is a **separate phase that runs only after
the checkmap** (ADR-007), because the knowledge the gates produced is exactly what makes a
migration safe.

**The hard rule: understand -> record the decisions -> then refactor.** Never bump first and
chase the breakages - that loses behavior nobody remembered was load-bearing, and records
nothing. Instead the `modernize` skill:

1. **Audits** the stack (current vs. latest-stable, EOL/security), cross-referenced to the
   specs and ADRs that rely on each piece.
2. **Derives the target** and the *kind* of each move - bump / breaking migration / replace -
   grounded in a reason and the affected specs, not fashion.
3. **Records the direction as ADR/BDR** *before any code moves* - what, why, rejected
   alternatives, which specs it touches.
4. **Sequences** small, reversible, green steps (specs + tests are the net) and emits a
   **counted migration backlog** ("N steps to current").
5. States a **maintenance strategy** - the supply-chain cooldown, an update rhythm, and
   `update-to-version` for the standard - so the repo stays current instead of rotting back.

This is distinct from `update-to-version` (which bumps the *standard's* version); modernize
bumps the *repo's own* technology. The refactor is the execution of a recorded plan.

## Which model, and how to drive it

Adoption is **judgment-heavy and whole-repo in scope** - the hardest kind of agent task.
Choose the driver and the shape deliberately:

- **Orchestrator: a top-tier reasoning model at high/max thinking.** The gates that carry
  judgment - decisions (Gate 3), spec-depth tier calls (Gate 4), assessment (Gate 2) -
  must be coherent across the whole repo. Divergent tier calls or contradictory ADRs are
  the failure mode, so one strong mind owns the synthesis. Do not run adoption on a cheap
  model to save cost; the cost is re-litigation later.
- **Fan out the mechanical, bounded work to sub-agents.** Per-capability **verbatim
  contract extraction** (read-only, `file:line`), first-draft specs, backlog-item
  generation, and drift scans are parallel and narrow - dispatch one sub-agent per
  capability/area, each with a bounded context, and let the orchestrator synthesize. This
  is faster and keeps each context small and accurate.
- **Do not try to hold a large repo in one context.** Map first (cheap, wide), then
  dispatch per-area readers, then synthesize centrally. A single giant context degrades;
  a map + focused readers does not.
- **Budget thinking by gate.** Max reasoning for Gates 2-4 (assessment, decisions, spec
  depth); low for mechanical extraction and formatting. Spend the thinking where a wrong
  call is expensive.
- **Rule of thumb:** one strong orchestrator + many cheap, bounded sub-agents beats one
  giant model doing everything, and beats many equal peers with no synthesizer - because
  the standard must be applied *the same way* everywhere, and coherence needs a center.

This is stack- and vendor-agnostic (Layer 1): it describes capability tiers ("a top
reasoning model", "bounded sub-agents"), not a product. A Layer-2 setup may name the
concrete models and wire the orchestration.

## Not this

- **Not a scaffold-and-leave.** Emitting files without the gates skips the understanding
  the gates exist to force.
- **Not a big-bang.** Spec the first slice deeply; queue the rest with a count.
- **Not silent skips.** A skipped gate/decision is recorded (a backlog item or a one-line
  reason), never dropped.
- **Not persona-free or decision-free.** Gates 1 and 3 are load-bearing; downstream work
  validates against them.
