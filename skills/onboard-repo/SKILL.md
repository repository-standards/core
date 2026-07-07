---
name: onboard-repo
description: Bring an existing, undocumented or disorganized repo up to the standard - read the code, derive its capabilities, seed specs and the decisions the code already implies, and turn the rest into a prioritized backlog. Incremental and human-approved, never a big-bang documentation dump.
disable-model-invocation: true
---

# onboard-repo

The brownfield counterpart to greenfield scaffolding. You are handed a real repo in
poor shape - little or stale documentation, no specs, decisions living only in the
code - and you bring it to the standard's **maintainable** state: behavior in specs,
decisions in records, drift caught by guards.

Order: run the repo assessment (`docs/repo-assessment.md`) **first** (analysis - what is
there, what is missing, what is risky; it seeds the backlog), then `align-to-standards`
(it puts the skeleton - `AGENTS.md`, `docs/`, `specs/`, `decision-records/`, guards - in
place). This skill then **fills** that skeleton from the code, draining the backlog the
assessment produced.

## The one rule: no big-bang

You do **not** document the whole repo in one pass. You produce a **backlog** of the
documentation, decision and spec work, ordered by risk and leverage, and drain it in
small PRs. A single run of this skill delivers the capability map, the highest-risk
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

3. **Seed specs from the code - behavioral first, flag the buildable gaps.** For each
   capability, write the spec at the tier the evidence supports. Start **behavioral**
   (what it observably does, read from code + tests). Where the standard demands
   **buildable** depth but the detail is missing or only in code - money, security,
   data, external contracts (ADR-003) - do not block: record the gap as a backlog item
   "raise `<capability>` spec to buildable". Never invent behavior the code does not
   show; where the code is unclear, write the question, not a guess.

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

6. **Build the backlog.** Everything from steps 2-5 that you did not finish now becomes
   ordered work items in `docs/backlog.md` (see that file for the format). Group into
   epics ("Spec the domain", "Record foundational decisions", "Wire the guards"). Each
   item: what, why, which capability, and a definition of done. This backlog is the
   deliverable that makes onboarding *continuable* by anyone.

7. **Wire the guards forward.** Ensure the coupling map (`specs/capability-map.json`)
   and the guards (`spec-guard`, `spec-structure`, secret-scan) are active, so new
   drift is caught from now on. This is what keeps the repo maintainable *after* you
   leave, and what makes the backlog shrink instead of grow.

8. **Then drain the backlog incrementally.** Take items in priority order, each a small
   PR through the normal flow: `spec-impact` -> `spec-update` -> `spec-analyze` ->
   implement -> `spec-reconcile`. The backlog feeds itself: spec deltas and code<->spec
   drift found along the way append new items.

## Output of one run

- `specs/capability-map.json` seeded from the code.
- The top risk-ranked capabilities specced (behavioral, buildable where mandatory).
- The genuinely re-litigable decisions drafted as retroactive ADR/BDR.
- `docs/backlog.md` holding everything else, prioritized - in one PR.

## Not this

- **Not a big-bang** "document everything" dump - it is unreviewable and it stalls.
- **Not one ADR per dependency** - only decisions that pass the re-litigation test;
  the rest are conventions.
- **Not per-page / per-ticket specs** (ADR-002) - derive capabilities from behavior.
- **Not inventing capabilities from tickets or wishes** - derive them from the code
  that exists (a request is not a capability).
- **Not guessing behavior** to make a spec look complete - an unknown is a backlog
  item, not a fabricated `MUST`.
