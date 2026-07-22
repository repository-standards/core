# Brownfield phase

The `align-to-standards` phase for an **existing** repo without a pin. You are handed a
real repo in poor shape - little or stale documentation, no specs, decisions living only
in the code - and you bring it to the standard's **maintainable** state: behavior in
specs, decisions in records, drift caught by guards.

Order: **assess first** (analysis only - the passes below), then the align steps in
`SKILL.md` (they put the skeleton - `AGENTS.md`, `docs/`, `specs/`, decision records,
guards - in place), then the derive steps below **fill** that skeleton from the code,
draining the backlog the assessment produced.

## Assess first (analysis, not change)

Before touching anything, run the assessment: read the repo, detect what is there and
what is missing, and seed the backlog. Do **not** modify code during it. The full pass
detail lives in `docs/repo-assessment.md` (in the shipped tree); the eight passes:

1. **Skeleton & docs** - `AGENTS.md`, `PRODUCT`, `ARCHITECTURE`, `specs/`, decision
   records, a backlog: present or missing?
2. **Decisions in code** - walk the decision checklist
   (`docs/decision-records/checklist.md`): which forks are decided / undecided /
   decided **inconsistently**?
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

Output: a short health report (maturity per pass: absent / partial / solid, top risks)
and a **seeded backlog** - every gap becomes an item with a definition of done, ordered
by risk x leverage. **Red-flag stops** halt and ask the human now, not later: a secret
committed to the repo; anything that would write to a remote database (deliver a
migration instead); a change that would contradict an existing Accepted ADR.

## The one rule: no big-bang

You do **not** document the whole repo in one pass. You produce a **backlog** of the
documentation, decision and spec work, ordered by risk and leverage, and drain it in
small PRs. A single run of this phase delivers the capability map, the highest-risk
specs and decisions drafted, and the backlog for the rest - in **one reviewable PR**,
not a thousand-line dump nobody can review. Onboarding is *done* when the risky
capabilities are buildable-spec'd, the foundational decisions are recorded, and the
guards are green - not when every file has a paragraph.

## Steps

1. **Map the code into capabilities.** Read entry points, modules, routes, jobs,
   domain folders, tests. Group them into candidate **capabilities/domains** by
   *behavior*, not by folder or route (ADR-002: not per page, not per ticket). A
   concept that spans many screens (e.g. `packages`, `pricing`) is **one** capability.
   Write the result to `specs/capability-map.json` (capability -> code globs). This is
   `spec-impact` run in reverse: code first, capability out.

2. **Rank by risk x opacity.** Order the capabilities: money, security, external
   contracts, and data integrity first; then most-churned (git history) and
   least-understood. This ordering **is** the backlog priority. You will not spec them
   all now.

3. **Seed specs from the code - extract verbatim, then synthesize.** For each
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

4. **Surface the decisions the code already made -> retroactive records.** The code
   embodies decisions: this datastore, this framework, this auth model, this money
   handling, no DI container. Enumerate only the **contestable, re-litigable** ones
   (the ADR test - a decision someone will argue about again), and draft them as
   **retroactive ADRs** (`Status: Accepted`, note "recorded retroactively"). A rule
   with one obviously-right answer is a convention, not an ADR. A baked-in *business*
   rule that is really a business decision is a **BDR**. Do **not** write one ADR per
   dependency.

5. **Record the drift you find.** Where the code disagrees with any pre-existing
   README, comment or doc, capture it (this is `spec-reconcile`'s job, applied to
   legacy docs). Each contradiction is a backlog item, resolved by making the record
   match real behavior - or by a fix, if the behavior itself is the bug.

   Also **elicit the unwritten rules (ADR-012):** ask the team for tribal knowledge -
   gotchas, "always do X before Y", rules in personal configs or agent memories - and
   land each at its taxonomy home. A brownfield repo is not onboarded while its most
   important rules live outside it.

6. **Build the backlog.** Everything from the assessment and steps 2-5 that you did not
   finish now becomes ordered work items in `docs/backlog.md` (see that file for the
   format). Group into epics ("Spec the domain", "Record foundational decisions", "Wire
   the guards"). Each item: what, why, which capability, and a definition of done. This
   backlog is the deliverable that makes onboarding *continuable* by anyone.

7. **Wire the guards forward.** Ensure the coupling map (`specs/capability-map.json`)
   and the guards (`spec-guard`, `spec-structure`, secret-scan) are active, so new
   drift is caught from now on. This is what keeps the repo maintainable *after* you
   leave, and what makes the backlog shrink instead of grow.

8. **Offer the stack layer.** Run the router's technology step (detect ->
   registry -> offer): a brownfield Node repo gets the Node best practices
   offered as picks to adopt, never as a re-scaffold.
9. **Then drain the backlog incrementally.** Take items in priority order, each a small
   PR through the normal flow: `spec-impact` -> `spec-update` -> `spec-plan`/`spec-tasks`/`spec-implement` ->
   `spec-reconcile`. The backlog feeds itself: spec deltas and code<->spec
   drift found along the way append new items. Re-run the assessment periodically to
   measure that the backlog is shrinking, not growing.

## Output of one run

- The assessment's health report and seeded backlog.
- `specs/capability-map.json` seeded from the code.
- The top risk-ranked capabilities specced (behavioral, buildable where mandatory).
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
