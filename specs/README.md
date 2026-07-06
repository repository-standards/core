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

- Format: [`capability-spec.template.md`](capability-spec.template.md)
- Commands / skills: [`commands.md`](commands.md)
- Enforcement (pre-commit + CI): [`enforcement.md`](enforcement.md)

## Altitude and governance

Accepted ADR / BDR (decisions) constrain specs; a spec must not contradict an
Accepted decision. Specs hold *behavior*; ARCHITECTURE holds *structure*; ADR/BDR
hold *why*. Spec Kit's constitution check defers to ADR + standards + these specs -
it does not restate them.
