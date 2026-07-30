# Brownfield phase

The `align-to-standards` phase for an **existing** repo without a pin. You are handed a
real repo in poor shape - little or stale documentation, no specs, decisions living only
in the code - and you bring it to the standard's **maintainable** state: behavior in
specs, decisions in records, drift caught by guards.

The intake (step 0 in `SKILL.md`) has already run: intent, technology + Layer 2
consent, appetite, and plan-only vs execute are known, and its repo scan seeds Gate 0's
description draft. Each step below names the gate it fills in the
[adoption checkmap](../../docs/method/adoption.md); brownfield walks the gates
**0 -> 2 -> 1 -> 3 -> 4 -> 5 -> 6** - the assessment first, the personas reconstructed
from its evidence.

Order: **assess first** (analysis only - the passes below), then the **stack offer**
(right after the assessment, never at the end), then the align steps in
`SKILL.md` (they put the skeleton - `AGENTS.md`, `docs/`, `specs/`, decision records,
guards - in place), then the derive steps below **fill** that skeleton from the code,
draining the backlog the assessment produced.

## Assess first (analysis, not change) -> Gate 2

Before touching anything, run the assessment: read the repo, detect what is there and
what is missing, and seed the backlog. Do **not** modify code during it. The full pass
detail lives in the standards checkout at
[`docs/method/repo-assessment.md`](../../docs/method/repo-assessment.md); the eight passes:

1. **Skeleton & docs** - `AGENTS.md`, `PRODUCT`, `ARCHITECTURE`, `specs/`, decision
   records, a backlog: present or missing?
2. **Decisions in code** - walk the
   [decision checklist](../../docs/method/checklist.md): which forks are decided /
   undecided / decided **inconsistently**?
3. **Capabilities & specs** - domains in the code; any specs; a `capability-map.json`?
4. **Quality gates** - tests (tiers? which paths?), typecheck strictness, lint/format.
5. **CI/CD** - pipeline present, least-privilege permissions, pinned actions,
   reproducible build.
6. **Security & supply chain** - secret scanning, committed secrets, dependency audit,
   lockfile, release cooldown.
7. **Dependencies & stack** - detect the stack; outdated / risky / unmaintained deps;
   does it match a known stack layer?
8. **Drift & health** - code<->doc contradictions, dead code, `TODO`/debt density,
   churn hotspots.

Output: a short health report (maturity per pass: absent / partial / solid, top risks,
findings grouped by the **owner role** that must act - see `docs/method/repo-assessment.md`)
and a **seeded backlog** - every gap becomes an item with a definition of done, ordered
by risk x leverage. **Red-flag stops** halt and ask the human now, not later: a secret
committed to the repo; anything that would write to a remote database (deliver a
migration instead); a change that would contradict an existing Accepted ADR.

**Assessment-only?** If the intake's intent was "tell me where I stand and give me the
plan", this is the legal stop: deliver the health report and the counted plan, then end
the run - no skeleton, no derive steps.

## Offer the stack layer (right after the assessment)

The assessment's pass 7 already detected the stack and the intake already gathered the
Layer 2 consent - so the offer runs **now, not at the end**. Run the router's
technology step (`SKILL.md`) against the stack's `stack.manifest.json`: registry ->
compatibility check -> classify -> payoff-ordered waves. Best practices land as picks
to adopt, **never a re-scaffold**, and the stack waves queue into the same backlog as
the Layer 1 work. This is Layer 2 running beside the gates, not a gate itself.

## The one rule: no big-bang

You do **not** document the whole repo in one pass. You produce a **backlog** of the
documentation, decision and spec work, ordered by risk and leverage, and drain it in
small PRs. A single run of this phase delivers the capability map, the highest-risk
specs and decisions drafted, and the backlog for the rest - in **one reviewable PR**,
not a thousand-line dump nobody can review. Onboarding is *done* when the risky
capabilities are buildable-spec'd, the foundational decisions are recorded, and the
guards are green - not when every file has a paragraph.

## Steps

1. **Reconstruct the personas -> Gate 1.** Right after the assessment, before any spec
   is seeded: infer **3-6 real user types from the code's evidence** - auth roles, UI
   surfaces, API consumers - and **confirm them with the user**. Write
   `docs/personas.md` with the **primary** marked, and record the target-personas
   **BDR**. **No spec is written before this exists** (ADR-006): every spec seeded
   below names the persona(s) it serves.

2. **Map the code into capabilities -> Gate 4 (opens here).** Read entry points,
   modules, routes, jobs, domain folders, tests. Group them into candidate
   **capabilities/domains** by *behavior*, not by folder or route (ADR-002: not per
   page, not per ticket). A concept that spans many screens (e.g. `packages`,
   `pricing`) is **one** capability. Write the result to `specs/capability-map.json`
   (capability -> code globs). This is `spec-impact` run in reverse: code first,
   capability out.

3. **Rank by risk x opacity -> feeds Gates 4 and 5.** Order the capabilities: money,
   security, external contracts, and data integrity first; then most-churned (git
   history) and least-understood. This ordering **is** the backlog priority. You will
   not spec them all now.

4. **Surface the decisions the code already made -> retroactive records -> Gate 3.**
   The code embodies decisions: this datastore, this framework, this auth model, this
   money handling, no DI container. Enumerate only the **contestable, re-litigable**
   ones (the ADR test - a decision someone will argue about again), and draft them as
   **retroactive ADRs** (`Status: Accepted`, note "recorded retroactively"). A rule
   with one obviously-right answer is a convention, not an ADR. A baked-in *business*
   rule that is really a business decision is a **BDR**. Do **not** write one ADR per
   dependency.

5. **Seed specs from the code - extract verbatim, then synthesize -> Gate 4.** For each
   capability you spec this pass, work in two steps. First a **read-only extraction**:
   pull the real contracts - schemas, endpoints, error codes, rules - out of the code
   **verbatim, each with a `file:line` anchor**; the anchors make the spec auditable
   and re-verifiable against the code later. Then **synthesize** the capability spec
   from that extract. Write it **buildable** - do not drop to `behavioral` to save
   effort (writing the contracts is exactly what surfaces the bugs, and peripheral
   capabilities benefit most; ADR-003). Never invent behavior the code does not show; a
   spec<->code discrepancy or an unclear branch goes in the spec's **Open questions**
   (and becomes a tracked issue), not a guess. A capability you are **not** specing this
   pass is a backlog item - not a behavioral placeholder written to look done.

6. **Record the drift you find -> Gate 5 (items).** Where the code disagrees with any
   pre-existing README, comment or doc, capture it (this is `spec-reconcile`'s job,
   applied to legacy docs). Each contradiction is a backlog item, resolved by making
   the record match real behavior - or by a fix, if the behavior itself is the bug.

   Also **elicit the unwritten rules (ADR-012):** ask the team for tribal knowledge -
   gotchas, "always do X before Y", rules in personal configs or agent memories - and
   land each at its taxonomy home. A brownfield repo is not onboarded while its most
   important rules live outside it.

7. **Build the backlog -> Gate 5.** Everything from the assessment and steps 3-6 that
   you did not finish now becomes ordered work items in `docs/backlog.md` (see that
   file for the format). Group into epics ("Spec the domain", "Record foundational
   decisions", "Wire the guards"). Each item: what, why, which capability, the persona
   it serves, the **owner role** that must act (product / architect / dev / agent - the
   backlog format), and a definition of done. Close with the **count** ("N tasks to
   full alignment"). This backlog is the deliverable that makes onboarding
   *continuable* by anyone.

8. **Wire the guards forward -> Gate 6.** Ensure the coupling map
   (`specs/capability-map.json`) and the guards (`spec-guard`, `spec-structure`,
   secret-scan) are active, so new drift is caught from now on. This is what keeps the
   repo maintainable *after* you leave, and what makes the backlog shrink instead of
   grow.

9. **Then drain the backlog incrementally.** Take items in priority order, each a small
   PR through the normal flow: `spec-impact` -> `spec-update` -> `spec-plan`/`spec-tasks`/`spec-implement` ->
   `spec-reconcile`. The backlog feeds itself: spec deltas and code<->spec
   drift found along the way append new items. Re-run the assessment periodically to
   measure that the backlog is shrinking, not growing.

## Output of one run

- The assessment's health report (findings grouped by owner role) and seeded backlog.
- `docs/personas.md` reconstructed and confirmed (primary marked) + the
  target-personas BDR.
- `specs/capability-map.json` seeded from the code.
- The top risk-ranked capabilities specced buildable (behavioral only with a recorded
  one-line justification).
- The genuinely re-litigable decisions drafted as retroactive ADR/BDR.
- `docs/backlog.md` holding everything else, prioritized - in one PR.

## Not this

- **Not a big-bang** "document everything" dump - it is unreviewable and it stalls.
- **Not a fix-during-assessment** - the assessment only analyzes; the exception is a
  red-flag stop, which asks the human.
- **Not one ADR per dependency** - only decisions that pass the re-litigation test;
  the rest are conventions.
- **Not per-page / per-ticket specs** (ADR-002) - derive capabilities from behavior.
- **Not inventing capabilities from tickets or wishes** - derive them from the code
  that exists (a request is not a capability).
- **Not guessing behavior** to make a spec look complete - an unknown is a backlog
  item, not a fabricated `MUST`.
