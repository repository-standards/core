# Capability specs

The functional source of truth for **what this system does now**. One folder per
capability, each holding a spec that answers a single question: how does this part
behave today, or on a branch, once the branch merges?

This is the folder the whole standard is built around. Everything else either feeds it
(discovery, ideas, decisions) or checks it (the guards in [`enforcement.md`](enforcement.md)).

```
SPEC = the current truth of a CAPABILITY
  not
SPEC = the description of a ticket
```

A spec is not written once and archived. It is edited in place forever, and `main` always
says what production does.

## Structure

Specs are organized **by capability / domain**, never by ticket or by page
([ADR-002](https://github.com/repository-standards/core/blob/main/docs/decision-records/ADR-002-specs-by-capability.md) -
the standard's own decision log, adopted by reference rather than copied here):

```
specs/
  bookings/spec.md
  payments/spec.md
  availability/spec.md
```

A large capability may split, but it stays one domain:

```
specs/bookings/{overview,lifecycle,modifications,cancellation}.md
```

- **No ticket-numbered or timestamp-prefixed folders.** Never `specs/001-booking/` or
  `specs/booking/017-change/` - a spec is the domain's living truth, not a per-change
  artifact, and `scripts/spec-structure.mjs` blocks the shape mechanically.
- **No per-page or per-route folders.** A concept like *packages* can appear on the
  homepage, the product page and checkout; per-page specs would duplicate it three times
  and drift apart. Where a capability surfaces is a cross-reference in the docs, never a
  reason to split its spec.
- **No versioned specs.** No `payments-v2/`. A change edits the existing spec in place;
  if it crosses domains, it edits every affected spec in the same pull request.
- **An existing directory means the same capability.** Update it in place; do not mint a
  sibling because the new work feels different from what is there.

Every spec names the **persona(s)** it serves, from `docs/personas.md`, and states in one
line how it advances that person's job. A spec that serves nobody is a candidate for
deletion, not for merge.

## Spec depth

([ADR-003](https://github.com/repository-standards/core/blob/main/docs/decision-records/ADR-003-specs-buildable-not-descriptive.md) -
buildable over descriptive.) The bar is one sentence:

> An engineer or an agent could implement and verify this capability from the spec alone,
> without reverse-engineering the code.

**Buildable is the default.** Saying *what* the system does is not enough - a buildable
spec carries the contracts: exact schemas and enums, every endpoint with its inputs,
outputs and errors, the algorithms as implementable steps, the state machine as a
transition table, the flags that change behaviour, and acceptance criteria in
Given / When / Then concrete enough to become tests. Contracts quote real identifiers
verbatim - field names, enums, error codes, endpoints, exactly as they are. A paraphrased
contract is not a contract.

**`behavioral` is the escape hatch, not a shortcut.** It carries prose invariants and edge
cases without the full contract detail. It must declare itself in the spec's header **and**
carry a one-line justification, so the gap is a visible choice rather than a habit. On a
money, security, external-contract or data-integrity path it is not available at all -
reaching for it there to save effort defers a pass that has to be redone as buildable
anyway, and it is usually the thin capabilities where writing the contracts finds the bugs.

## Coupling

Every capability needs an entry in `capability-map.json`
(see [`capability-map.example.json`](capability-map.example.json) for the shape), which
maps it to its code globs. The coupling guard reads that map to catch code that moved
without its spec - a capability with no map entry is not merely unguarded, it rots
silently, because nothing will ever say so. `/spec-specify` registers a new capability
when it mints the directory; `spec-guard --audit` re-checks the whole map in CI so a
missed one fails the next pull request rather than staying quiet.

A behaviour change and its spec update land in **the same pull request**. The guard is
per-PR and has no bypass, so splitting them across two PRs makes the guard block the fix.
"Update the spec before implementing" is the principle; "in the same PR" is what makes it
operational.

## Make the loop self-triggering

The loop that keeps a spec honest is `/spec-specify -> /spec-clarify -> /spec-plan ->
/spec-tasks -> /spec-implement -> /spec-reconcile`, and it is **AI-led**: an agent starts
it from what a user says, not from a user remembering a command name. What stops that
loop from being skipped is not one thing - each layer catches what the one below it
misses, and none of them is decoration on its own:

1. **Loaded context.** `AGENTS.md`'s "the loop runs itself" section is imported into
   every session (`@AGENTS.md` from `CLAUDE.md`, or the equivalent for a non-Claude
   agent), so the instruction to check whether a skill covers the request is present on
   every turn - not a document the agent has to think to open.
2. **The gate.** `scripts/spec/check-spec-clarified.sh` is the mechanical check: a spec
   may not reach `ready-to-develop` unless it carries a `## Clarifications` section, zero
   open markers of the `[NEEDS ...]` family, and an `## Open questions` section that says
   there are none. See [`enforcement.md`](enforcement.md) for exactly what it checks and
   how it fails.
3. **The bridge precondition.** `setup-plan.sh` and `setup-tasks.sh` call that gate
   themselves, before doing anything else, and refuse to proceed on a non-zero exit. This
   is what makes the gate mechanical rather than a prose instruction an agent could skip:
   the skills' own prompts also document it as a "MANDATORY PRECHECK", but the scripts
   enforce it independently of whether that prompt text gets read.

No skill may offer to skip clarification. A spike is a reason to *defer* an answer, and a
recorded deferral is an answer - it is not a reason to leave the question unwritten.

## What does not go in here

**Tickets, page names and version suffixes** - see Structure above.

**History.** Do not keep obsolete behaviour "for the record" - git holds the evolution,
and a spec carrying both the old and the new behaviour cannot be read as truth. History
lives in the changelog, never in a spec's own section.

**Ticket language.** "This feature adds...", "in TICKET-123 we...". A spec must be
readable by someone who has never seen the git history.

## How you actually use it

You do not write these by hand. The loop is a sequence of skills:

```
/spec-specify     one capability, from what you said
/spec-clarify     the questions, until nothing is left open
/spec-impact      which other capabilities this ripples into
/spec-update      edit every affected spec to the target state
/spec-plan  /spec-tasks  /spec-implement
/spec-reconcile   spec == code == tests, and specs agreeing with each other
```

The gate that matters is `/spec-clarify`: a spec does not reach planning until it has no
open markers of the `[NEEDS ...]` family - a missing decision, a missing input and a
missing asset block work exactly like an unanswered question, because all four mean
somebody would have to guess.

An open question the work answered gets closed in the same pull request. A gap still
marked open after it was resolved is as wrong as a missing one, and it teaches readers
that the section is decoration.
