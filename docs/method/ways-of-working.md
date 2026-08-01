# Ways of working - a feature, spec-driven, from intent to shipped

How a new capability travels through the team: **PO writes the intent, a developer
sharpens it into a buildable spec, an AI implements it, and the spec stays the truth.**
The spec is the artifact that passes between roles - it starts as intent and gains
precision at each hand-off. This is the ongoing flow once a repo is on the standard
(greenfield from the start, or brownfield after the align router's onboarding phase).

## Who owns what

| Role | Owns | Produces |
|---|---|---|
| **PO / product** | the **what** and **why** - the behavior the product should have, the rules, what "done" means to a user | a **behavioral spec**: the capability's target behavior, business rules, acceptance criteria - in plain language, no implementation |
| **Developer** | the **how** - turning intent into something buildable and correct | the **buildable spec** (adds data / interface / algorithm / state / config contracts), the **plan**, and any **decision** the change forces (ADR/BDR) |
| **AI agent** | the **execution** - code and tests that satisfy the buildable spec | the implementation, tests, and a **reconciled** spec (spec == code == tests) |
| **Reviewer (human + CI)** | the **gate** - is it correct, safe, and faithful to the spec and the ADRs | an approved, merged change |

The altitude never inverts: the PO's behavior and the accepted decisions constrain
everything below; the AI does not invent behavior or make an unrecorded decision.

## The flow

```
backlog item / intent
  -> PO:   behavioral spec  (what + why + acceptance)
    -> Dev:  spec-impact (ripple) -> buildable spec + plan + ADR/BDR if the change needs one
      -> AI:   /spec-plan -> /spec-tasks -> /spec-implement -> tests
        -> reconcile: spec == code == tests  (spec-reconcile)
          -> pre-pr-review -> PR -> reviewer gate -> merge
```

The spec on the branch is the **target**; `git diff` against the base is the **change
delta**. After merge, the spec is current production truth - not a historical ticket.

### Stage by stage (mapped to the skills)

1. **Intent (PO).** Pull an item from the [`backlog`](../../standard/docs/backlog.md) (or capture a new
   one). **Name the persona** it serves (from [`personas.md`](../../standard/docs/personas.md)) and how it
   advances their job - an item that serves no persona is parked, not built (ADR-006).
   Then write or extend the capability's [spec](../../standard/specs/README.md) at the **behavioral**
   tier: what it should do, the rules, the acceptance criteria, for whom. No code, no
   schema - just behavior and why. If two personas conflict, resolve it with a **BDR**,
   not in your head. The PO never has to gate blind: **ask the agent to explain any
   ADR/spec/term in plain language, with examples anchored to the personas** - being able
   to demand a simple explanation is part of this stage (EXPLAIN-1).
2. **Sharpen (Dev).** Run `spec-impact` to find the ripple (which other capabilities,
   which ADRs, which code). Raise the spec to the **buildable** tier - the contracts a
   change can be built and verified from. If the change forces a contestable decision,
   write the **ADR/BDR** first (see the [decision checklist](checklist.md)
   for which forks warrant one). Run `spec-reconcile`'s cross-spec consistency step so the updated specs do not
   contradict each other. Produce the plan.
3. **Build (AI).** Implement against the buildable spec; write the tests the acceptance
   criteria imply. Use `spec-reconcile` to close the gap between the spec and the branch
   (missing implementation, missing tests).
4. **Reconcile.** Run `spec-reconcile`: the spec, the code, and the tests must agree; if
   the build revealed the spec was wrong, fix the spec (it is the truth, not a wish).
   No knowingly-contradicting spec merges.
5. **Review & merge.** `pre-pr-review` (a clean-context self-review), then open the PR
   with honest ADR impact, then the human + CI gate.

## Right-size the ceremony

Not every change walks all four roles:

- **A new capability or a behavior change** - the full flow: PO intent -> Dev buildable
  -> AI build -> reconcile.
- **A small fix within an existing spec** - Dev + AI; the behavioral intent is already
  in the spec. Still reconcile.
- **A pure refactor (no behavior change)** - no spec change; `spec-reconcile` confirms
  behavior is unchanged. An ADR only if it changes a structural decision.

The test is *substance, not paperwork*: a contestable decision earns an ADR, a real
behavior change earns a spec edit - a rename does not.

## Status & close - discovery vs build-ready, and the cleanup (ADR-010)

A capability spec carries a **Status** so the pipeline is readable at a glance -
especially for the PO, whose view this is:

`in-refinement -> ready-to-develop -> in-development -> live`

- **`in-refinement`** - the clarify loop is running; open `[NEEDS CLARIFICATION]` markers
  are expected. Deferrals are answers too: "leaving this to the technical side" is
  **recorded** in `## Clarifications`, never lost.
- **`ready-to-develop`** - requires the **clarify gate**: a `## Clarifications` section
  and zero open `[NEEDS CLARIFICATION]`. Plan/tasks (and any tracker mirror) are blocked
  until then - a spec cannot reach a developer half-baked.
- **Enabling work** (a token from IT, access, an agreement) is front-matter
  (`needs_decision_records`-style), mirrored to the tracker as a **blocking Story** -
  never spec prose. Execution state and the work history live in the tracker (GitHub
  Issues default; Jira/Linear as adapters); the repo backlog holds intents.
- **`live` + close** - after reconcile, the **cleanup step verifies against the code**
  (not by interrogating the user) that the work landed, then removes the scaffolding:
  `plan.md`, `tasks.md`, satisfied enabling keys. What remains is the living truth -
  spec, records, docs.

## How it connects

- **Backlog** - intents and stories come from [`backlog`](../../standard/docs/backlog.md); spec deltas and
  reconcile drift feed new items back into it.
- **Specs** - the [capability specs](../../standard/specs/README.md) are the travelling artifact and
  the post-merge source of truth.
- **Decisions** - the [ADR/BDR](../../standard/docs/decision-records/README.md) stream holds the *why*; the
  [decision checklist](checklist.md) says which forks deserve a record.
- **Onboarding** - a brownfield repo reaches this steady-state flow only after
  the align router (assess -> align -> onboard) has seeded the specs,
  decisions and backlog.
- **Driving the agent** - this doc says who owns what; [working-with-ai/](working-with-ai/README.md)
  says how the AI stage actually behaves - context, verification, review load, blast
  radius - with the evidence behind each practice.

## Not this

- **Not spec-after-code** - the spec is written/updated to the target *before* the
  implementation, not reverse-engineered from a merged diff.
- **Not PO-writes-implementation** - the PO owns behavior and acceptance, not schemas
  and algorithms; the developer owns the buildable detail.
- **Not AI-invents-behavior-or-decisions** - an unknown is a question back to the PO or
  a backlog item, never a fabricated rule or an unrecorded decision.
- **Not a forked spec** (`payments-v2`) - update the existing capability spec in place.
