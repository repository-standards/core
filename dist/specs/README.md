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

## For whom - name the persona

Every capability spec names the **persona(s)** it serves (from
[`personas.md`](../docs/personas.md)) and, in a line, how it advances their job. Behavior
is verified against the code (buildable, below) *and* against a user - a spec that serves
no persona is a candidate for deletion, not merge (personas are a validation gate; the
standard's ADR-006). Where a rule helps one persona and hurts another, the resolution is a
recorded **BDR**, cited from the spec.

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

Every spec declares its tier (`Spec tier:` at the top). To decide the tier, ask the
one discriminator question:

> Could an agent **rebuild and verify** this capability from the spec alone, without
> reading the code?

If the answer has to be yes, the spec is **buildable**. Anything that carries money,
security, data integrity, or an external contract always has to be - so those are
always buildable; but the question, not the list, is the test (the list is just its
most common answers).

- **buildable** (default) - all the contracts above. **Default even for thin or
  peripheral capabilities:** writing the contracts is exactly what surfaces the bugs,
  so the small capabilities often benefit most. Do **not** pre-declare `behavioral`
  to save effort - that only defers the pass that finds the problems, and it usually
  has to be redone as `buildable` anyway.
- **behavioral** - contracts, invariants, edge cases and boundaries in prose, without
  full data / interface / acceptance detail. An **escape hatch, expected to be rare**:
  the spec MUST declare `Spec tier: behavioral` **and** carry a one-line justification
  for why buildable does not apply, so the gap is a conscious, visible choice - never
  a default reached for to save work.

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
4. Every capability spec MUST have an entry in `specs/capability-map.json` - its
   `<capability> -> code globs` mapping. This is not an enforcement detail; it is the
   coupling anchor that keeps the spec alive. The guard uses it to catch code that
   changes without its spec, so a capability spec with **no** map entry silently
   rots - a spec without a mapping fails the check.

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
