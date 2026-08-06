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

## You have this case - say this

**A brand-new repo, nothing in it yet.** The agent interviews you through the gates
rather than scaffolding blind:

```
> take this new repo onto the standard - interview me for what you need
```

**An existing repo with years of history.** Same path, opposite direction: the agent
reads the code and reconstructs what the repo already chose, then names what is
missing:

```
> bring this repo onto the standard - read what is here first, and show me the plan before you change anything
```

**You want the number before you commit to the work.** The path ends in a counted
backlog for exactly this reason:

```
> how far is this repo from drift 0? count the work, do not do it
```

**A gate does not fit your repo.** Deviations are legitimate and recorded, never
silent:

```
> we have no separate ops repo, so the runbooks gate lands differently here - record the deviation
```

**Corner case - already adopted, the standard moved.** That is an update, not an
adoption: it applies the delta between your pin and latest and preserves your recorded
deviations.

## The gates (in order)

| # | Gate | Greenfield (interview) | Brownfield (read code) | Output | Exit criterion |
|---|------|------------------------|------------------------|--------|----------------|
| 0 | **Intake & description** | Ask: what is this, in one sentence? Problem, why now? Plus the intake round: **intent** (new / align / assessment-only / check-up on an already-aligned repo / update the pin - a sixth, "stay as it is", applies to a repo with no plan to develop further), **technology + Layer 2 consent** (asked outright), **appetite** (one PR vs waves), **plan-only vs execute** | Scan the repo - including its own README/CONTRIBUTING for a lifecycle signal (deprecated, archived, frozen) and any machine-readable governance config (`.jcheck/conf`, `.gitreview`, `CODEOWNERS`) for the role, reviewer-count, tracker and review-host answers it already declares, before asking anything the repo already answered; write what it *appears* to be and do. Same intake round - technology **detected** from the repo's evidence, then confirmed, with the Layer 2 consent gathered here | `PRODUCT.md` draft (a description the agent can reason from) + the intake answers | The agent can state what the product is and what the user wants done |
| 1 | **Personas - who** | Name 3-6 user types with the user | Infer users from the code, auth roles, UI; confirm | `personas.md` (primary marked) + target-personas BDR | Every later gate has a persona to point at |
| 2 | **Vision / Assessment** | Goals, non-goals, success in 3 months | Run the 8-pass `repo-assessment`: what exists, what's missing, where code and intent drift | `PRODUCT.md` goals **or** an assessment report | The gap between now and aligned is written down |
| 3 | **Decisions** | Pick topology/stack/boundaries from the catalog | Detect what the code **already chose**; record it retroactively | Foundational **ADRs/BDRs**; the rest queued | No load-bearing fork is silently undecided |
| 4 | **Capabilities & specs** | Slice into capabilities (by domain, not page); write the first specs | Map existing capabilities; extract verbatim contracts (`file:line`), then synthesize specs | `specs/<capability>/` - persona-anchored, buildable where it counts | Money/security/data paths are buildable + specced |
| 5 | **Backlog - count the work** | Turn unspecced capabilities + known work into items | Turn every missing spec, unrecorded decision, and known drift into items | `backlog.md` with a **task count** ("N to full alignment"), every item naming its **owner role** | The scope is a number, honestly stated - and each task says whose it is |
| 6 | **Verify** | - | - | `.standards-version` + manifest carried; `self-verify` green | `drift 0`; PRs opened |

Both directions run through the `align-to-standards` skill (in a checkout of
repository-standards): its greenfield phase for a new repo, its assessment-first
brownfield phase (`repo-assessment` passes, then align, then derive from code) for an
existing one. The checkmap is the spine; the phases are how each gate gets filled.

The spine is shared and so is the walk: both directions close the gates
**0 -> 2 -> 1 -> 3 -> 4 -> 5 -> 6** - Gate 2 first because personas need evidence to
point at, Gate 1 right after because personas gate everything downstream. What differs
is Gate 2's evidence: greenfield **interviews** (the vision questions ride the Gate 0
conversation), brownfield **assesses** - and the personas are then named from that
evidence (greenfield: with the user; brownfield: **reconstructed** from auth roles, UI
surfaces, API consumers, then confirmed with the user). The order is the
order gates *close*; work inside a pass may interleave. **Assessment-only is a legal
stop:** when the intake's intent is "tell me where I stand and give me the plan", the
run ends after Gate 2 plus the counted plan - the health report and the number, no
changes made.

**Gate 0 can also end the adoption.** Before anything is proposed, the intake reads the
repo's own contribution policy - which a repo may state anywhere it keeps rules, `AGENTS.md`
included, not only `CONTRIBUTING.md` or a file named for the purpose. A policy forbidding
agent contributions is a red-flag stop, and not always the end of the run: a ban on
submitting code is not a ban on reading, so the assessment above is usually still on offer.
A policy *mandating* what this standard's own conventions forbid - an AI-attribution
trailer, say - is a conflict put to the human with both obligations named, never settled
silently by the merge that installs those conventions. The shapes and what each one does are
in the align skill's intake ([step 0](../../skills/align-to-standards/SKILL.md)).

## Rigid vs. the agent's discretion

- **Rigid (the framework enforces):** the per-direction gate order, that each gate
  produces its artifact, and the exit criteria. Plainly: **no specs before confirmed
  personas** (Gate 4 waits on Gate 1 - in both directions), **no recorded decisions
  before intake + assessment** (Gate 3 waits on Gates 0 and 2), and **every gate
  produces its artifact**.
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

Every item in the count also names its **owner role** - the role that must act:
**product/business** (`PRODUCT.md`, BDRs, personas confirmation), **architect** (ADRs,
boundaries), **dev** (specs, code, guards), **agent** (mechanical work it can do
alone) - see the [backlog format](../../standard/docs/backlog.md). The count then says not just how much
work, but **whose**.

## After alignment: modernize (bring the tech current)

A repo often reaches the standard *because* it has fallen behind - old runtimes, stale
dependencies, dated patterns. Bringing it current is a **separate phase that runs only after
the checkmap** (ADR-007), because the knowledge the gates produced is exactly what makes a
migration safe.

**The hard rule: understand -> record the decisions -> then refactor.** Never bump first and
chase the breakages - that loses behavior nobody remembered was load-bearing, and records
nothing. Modernizing an undocumented repo is guessing - if the gates have not run, run
them first.

### Modernize: the plan-then-refactor pass

1. **Audit** the stack (current vs. latest-stable, EOL/security), cross-referenced to the
   specs and ADRs that rely on each piece.
2. **Derive the target** and the *kind* of each move - bump / breaking migration / replace -
   grounded in a reason and the affected specs, not fashion.
3. **Record the direction as ADR/BDR** *before any code moves* - what, why, rejected
   alternatives, which specs it touches.
4. **Sequence** small, reversible, green steps (specs + tests are the net) and emit a
   **counted migration backlog** ("N steps to current").
5. State a **maintenance strategy** - the supply-chain cooldown, an update rhythm, and
   `update-to-version` for the standard - so the repo stays current instead of rotting back.

This is distinct from `update-to-version` (which bumps the *standard's* version); modernize
bumps the *repo's own* technology. The refactor is the execution of a recorded plan.

## Which model, and how to drive it

Adoption is **judgment-heavy and whole-repo in scope** - the hardest kind of agent task.
Choose the driver and the shape deliberately:

- **Orchestrator: the strongest model you have, at high/max thinking.** The gates that
  carry judgment - decisions (Gate 3), spec-depth tier calls (Gate 4), assessment
  (Gate 2) - must be coherent across the whole repo. Divergent tier calls or
  contradictory ADRs are the failure mode, so one strong mind owns the synthesis. A
  stronger model means fewer iterations and fewer errors - if you can choose, choose up.
- **No strong model? Don't worry - iterate.** The transition is **re-runnable and
  lossless by design**: align is re-entrant (resume from `self-verify`, what is done
  stays done), so every pass can only improve the repo's adoption of the standard.
  Weaker models need more passes and a bit more developer attention at the judgment
  gates - but they get the job done. The drift number falling is your progress bar
  either way.
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

## Pick your profile: core vs scale (ADR-011)

One standard, two postures - declared next to the recorded alignment state, verified per profile
(previously written solo/team):

- **`core`** - solo repos adopt core: a one-person or small project carries what keeps
  knowledge alive - `AGENTS.md`, taxonomy, living specs, decision records, backlog,
  ideas, self-verify. Guards run locally/pre-commit; one persona is enough; no tracker
  bridge, no release-notes curation.
- **`scale`** - teams carry core + scale, the full posture: CI-enforced gates, tracker
  bridge and statuses mirrored out, curated release notes, full persona roster, UX
  cadence, C4/token discipline.

The principle when in doubt: **core keeps knowledge alive; scale coordinates people.**
Start `core`, flip to `scale` when the second regular contributor arrives - the flip is
a manifest flag plus the measured delta, not a re-adoption.

## Not this

- **Not a scaffold-and-leave.** Emitting files without the gates skips the understanding
  the gates exist to force.
- **Not a big-bang.** Spec the first slice deeply; queue the rest with a count.
- **Not silent skips.** A skipped gate/decision is recorded (a backlog item or a one-line
  reason), never dropped.
- **Not persona-free or decision-free.** Gates 1 and 3 are load-bearing; downstream work
  validates against them.

## Adopting without a repository-standards checkout

A degit of the tree alone is enough - the align skill is convenience, not a
requirement. The manual path: write `.standards-version` with the manifest's own
version, verbatim (`jq -r .version standard.manifest.json > .standards-version`);
fill the shells (`AGENTS.md`, `docs/PRODUCT.md`, `docs/personas.md`, the backlog);
write your first capability spec from `specs/capability-spec.template.md` and bind
it in `specs/capability-map.json`; run `node scripts/self-verify.mjs` until drift
is 0. Filled shells, not copied ones, are the point - self-verify warns on
surviving placeholders.
