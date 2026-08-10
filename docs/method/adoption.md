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
| 2 | **Vision / Assessment** | Goals, non-goals, success in 3 months | Run the 8-pass `repo-assessment`: what exists, what's missing, where code and intent drift | `PRODUCT.md` goals **or** `docs/adoption-assessment.md` (R27) | The gap between now and aligned is written down - and the user has said go or no-go on it |
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

  **What "the framework enforces" actually means, per gate**, because for a long time it
  meant nothing for two of them and a run could reach `drift 0` having skipped both
  (ADR-048). Gate 0 (`docs/adoption-intake.md`, R26) and Gate 2
  (`docs/adoption-assessment.md`, R27) are required manifest entries, so a missing one is
  drift. Gates 2 and 5 are additionally read for **shape** by `adoption-gates`: eight passes
  rated, the scope block's arithmetic, an owner role on every alignment item. The rest of the
  gate order is still enforced by reading, not by a script - which is worth knowing when
  deciding how much to trust a green number.
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

## Pick your profile: core vs scale (ADR-011, ADR-040)

One standard, two postures - declared next to the recorded alignment state, verified per
profile (previously written solo/team). The principle: **core keeps knowledge alive; scale
carries it to someone who is not in the room.**

**`scale` binds on reach, not on headcount.** Answer yes to any one of these and the repo is
`scale`. A second pair of hands is not one of them:

- work is handed off **asynchronously** - somebody picks a piece up without the person who
  wrote it being reachable to explain it;
- somebody contributes from **outside the conversation** - an outside contributor, a
  rotating team, a vendor, a maintainer who arrives after everyone here has gone;
- somebody **outside the repo reads execution state** - a stakeholder who follows a board
  rather than a backlog;
- the repo has a **release audience that is not its authors**;
- it is designed for **users nobody here is**.

Two people at one desk shipping to each other are `core`, and compliant. One person shipping
a library to ten thousand strangers meets the release-audience condition and is not.

**What the flag actually changes** - nine entries, named rather than summarised, because the
difference is small enough that a summary of it misleads:

| At `scale` only | What it is for |
|---|---|
| `CONTRIBUTING.md`, `.github/pull_request_template.md` | contribution mechanics for people who cannot be told them in person |
| `docs/journeys`, `docs/research`, `docs/analytics.md` | designing for, and measuring, users nobody in the repo is |
| `docs/sprints`, `scripts/sprint-guard.mjs`, the `sprint-guard` guard | a team agreeing what it committed to and by when (ADR-028) |
| the `spec-guard` guard **blocking** | R11's coupling gate blocks at `scale`; at `core` the same guard runs and advises |

**And what it does not change** - three things the picker used to offer as discounts and one
it had backwards:

- **CI is not a scale thing.** `.github/workflows/spec-guard.yml` is a required entry at
  every profile, and R16 puts `self-verify` and `spec-structure` in CI for every repo, a
  solo one included. Only `spec-guard`'s blocking mode is marked *(scale)*, and the
  full-tree coupling audit blocks everywhere. A core repo that skips CI is at drift, not
  exempt.
- **Personas and architecture are core.** `docs/personas.md` (R10) and
  `docs/ARCHITECTURE.md` are required at both profiles. A fuller roster and C4 depth are how
  much you write in a file you carry either way - a judgment, not a flag, and nothing
  measures it.
- **The tracker bridge and curated release notes are required at no profile.** Tracker sync
  is an optional per-capability extension core never reads (ADR-032); release-notes
  curation is not a manifest entry at all. Neither is a discount, because neither was ever
  charged.

Do not take this list on trust - `node scripts/self-verify.mjs --profile core` prints how
many entries it skipped, and today the answer is 9.

**Between the two - the 2-5 person repo.** There is no third profile and there will not be
one for team size. A repo whose answers land in the middle picks the route that leaves a
record:

- **declare `scale` and except the documents you do not carry** - each in the manifest's
  `exceptions` with a reason. self-verify reports them as excepted rather than drift and
  keeps them in the adoption denominator, so excepting can never raise the percentage. This
  is the paved road for the six document entries above: an exception carries a reason, and
  the next person reads why.
- **declare `core` and carry what a condition above actually triggered** - carrying more
  than your profile requires has never been drift. It is also not verified: nothing checks
  a scale artifact in a `core` repo, which is the cost of this route.

**The three enforcement entries cannot be excepted, and that is what actually decides it.**
`scripts/sprint-guard.mjs` and the two guards are outside the hatch by design - waiving a live
check removes it rather than recording a deviation from it, so self-verify refuses the
exception and says so. Declaring `scale` therefore means accepting that R11's coupling guard
**blocks** every pull request where a capability's code moves without its spec. That is the
one difference a small team should decide deliberately; at `core` the same guard runs and
advises, and the full-tree coupling audit blocks either way.

Reading `core` as "we are only two, so none of this is for us" is the one wrong answer. The
conditions ask what leaves the room, and for most pairs something already does.

The flip either way is a manifest flag plus the measured delta, not a re-adoption.

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
