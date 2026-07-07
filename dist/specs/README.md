# Living specifications (capability specs)

The functional source of truth for **what the system does now**. Organized by
product capability, not by ticket or feature branch. A capability spec answers:
"how does this part of the system behave today - or, on a branch, once the branch
merges?"

Spec Kit stays as the execution engine (clarify -> plan -> tasks -> implement ->
converge). This layer changes only the **spec model**: from disposable
ticket-specs to long-lived capability specs.

## The one rule

```
SPEC = current / target truth of a CAPABILITY
  not
SPEC = description of a ticket
```

## Spec depth: buildable, not descriptive

A capability spec is a **buildable technical specification**, not a general
description. The bar:

> An engineer or agent could IMPLEMENT and VERIFY the capability from the spec
> alone (plus the repo's shared schemas and standards), without reverse-engineering
> the code.

Saying only *what* the system does is not enough. A buildable spec also carries the
**contracts**:

- **Data contracts** - exact schemas, types, constraints, enums, persisted shapes.
- **Interface contracts** - every endpoint / function: inputs, outputs, and every
  error (status + code + message).
- **Algorithms & rules** - the computations and decisions as implementable steps.
- **State machine** - states + a transition table (trigger, guard).
- **Config & flags** - what changes behavior.
- **Acceptance criteria** - Given / When / Then, concrete enough to become tests.
  This is the verification half - it is what makes "buildable" *checkable*.

**Verbatim rule.** Contracts quote real identifiers - field names, enums, error
codes, endpoints - exactly. A paraphrased contract is not a contract.

### Tiers

Every spec declares its tier (`Spec tier:` at the top).

- **buildable** (default) - all of the above. This is the bar for any capability
  that carries money, security, data integrity, or an external contract - those
  MUST be buildable.
- **behavioral** - contracts, invariants, edge cases and boundaries in prose,
  without full data / interface / acceptance detail. Allowed ONLY for thin or
  peripheral capabilities, and the spec MUST declare `Spec tier: behavioral` so the
  gap is explicit, not accidental.

A spec starts wherever it must and is upgraded toward buildable as the capability
matters more. What a buildable spec cannot yet pin down goes in **Open questions**,
never glossed - honesty about gaps is what keeps the spec trustworthy.

## Structure - by capability, not by ticket

```
specs/
  bookings/spec.md
  payments/spec.md
  availability/spec.md
  pricing/spec.md
```

Large capabilities may decompose (still one domain):

```
specs/bookings/{overview,lifecycle,modifications,cancellation}.md
```

Never `specs/001-booking/`, `specs/017-booking-change/`. Create a new capability
spec ONLY for a genuinely new domain - not because a new ticket or branch exists.

And **not by page or route** either. Organize by capability (the domain concept),
not by where it surfaces in the UI. A concept like *packages* shows up on the
homepage, the PDP, and checkout - per-page specs (`pdp/`, `checkout/`) would
duplicate that one concept across three places and drift. One capability = one
canonical spec, wherever it appears.

**Where a capability appears** (which pages / routes) is a cross-reference in the
docs - a property of the doc, never a reason to split the spec.

## Source-of-truth rules

1. Files under `specs/<capability>/` are canonical: behavior, business rules,
   invariants, lifecycle and state transitions, edge cases, forbidden scenarios,
   cross-domain effects. Not implementation history.
2. A change updates the existing capability specs **in place**. Do not fork
   `payments-v2`. If it crosses domains, update **every** affected capability.
3. Specs describe behavior (`MUST` / `MAY` / `MUST NOT`), never tickets ("this
   feature adds...", "in RL-123..."). A spec must be readable without git history.

## Git-native change model (no separate change folders)

```
main branch spec    = current production truth
feature branch spec = target truth after merge
git diff            = the change delta
```

Git IS the change mechanism. Plans and tasks are disposable execution aids - they
never compete with specs as product truth. Do not keep obsolete behavior in a spec
"for history"; git holds the evolution.

## Workflow (Spec Kit engine, capability-spec model)

```
request -> understand -> spec-impact (which capabilities?) -> clarify
  -> UPDATE canonical specs to target state -> cross-spec consistency
  -> plan -> tasks -> implement -> converge -> reconcile(spec/code/tests) -> merge
```

Mandatory gates: update affected specs to the target state **before** implementing;
reconcile spec vs code vs tests **before** completion. No silent drift.

## Where the pieces are

- Setup (install Spec Kit + wire the loop): [`spec-kit-setup.md`](spec-kit-setup.md)
- Format: [`capability-spec.template.md`](capability-spec.template.md)
- Commands + runnable skills: [`commands.md`](commands.md), the `/spec-*` skills in
  [`../.claude/skills/`](../.claude/skills/) (spec-impact, spec-update, spec-reconcile,
  spec-analyze, spec-converge)
- Governance bridge: [`constitution.template.md`](constitution.template.md)
- Enforcement (pre-commit + CI): [`enforcement.md`](enforcement.md) +
  [`../scripts/spec-guard.mjs`](../scripts/spec-guard.mjs)

## Altitude and governance

Accepted ADR / BDR (decisions) constrain specs; a spec must not contradict an
Accepted decision. Specs hold *behavior*; ARCHITECTURE holds *structure*; ADR/BDR
hold *why*. Spec Kit's constitution check defers to ADR + standards + these specs -
it does not restate them.
