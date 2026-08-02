The functional source of truth for **what the system does now**. One folder per product
capability, each holding a spec that answers a single question: how does this part behave
today, or on a branch, once the branch merges?

This is the folder the whole standard is built around. Everything else either feeds it
(discovery, ideas, decisions) or checks it (the guards).

## The one rule

```
SPEC = the current truth of a CAPABILITY
  not
SPEC = the description of a ticket
```

A spec is not written once and archived. It is edited in place forever, and `main` always
says what production does.

## What it is for

**So that behaviour is written down before it is built, and stays written down after.**
A product owner states what should happen in their own words; the loop sharpens it into
something buildable; QA gets acceptance criteria that existed before the code; a developer
gets contracts instead of archaeology; the agent reads all of it as context and writes back
into the same file.

## What goes in here

One folder per capability, named after the domain concept:

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

Every spec names the **persona** it serves, from `docs/personas.md`, and says in one line
how it advances that person's job. A spec that serves nobody is a candidate for deletion,
not for merge. Where a rule helps one persona and hurts another, the resolution is a
recorded BDR that the spec cites.

### Buildable is the default, and it means something specific

The bar is one sentence:

> An engineer or an agent could implement and verify this capability from the spec alone,
> without reverse-engineering the code.

Saying *what* the system does is not enough. A buildable spec carries the contracts: exact
schemas and enums, every endpoint with its inputs, outputs and errors, the algorithms as
implementable steps, the state machine as a transition table, the flags that change
behaviour, and acceptance criteria in Given / When / Then concrete enough to become tests.

**Contracts quote real identifiers verbatim.** Field names, enums, error codes, endpoints,
exactly as they are. A paraphrased contract is not a contract.

The escape hatch is `behavioral`: prose invariants and edge cases without the full detail.
It must declare itself in the header **and** carry a one-line justification, so the gap is
a visible choice. Reaching for it to save effort usually defers a pass that has to be
redone as buildable anyway, and thin capabilities are often the ones where writing the
contracts finds the bugs.

## What does not go in here

**Tickets.** Never `specs/001-booking/` or `specs/017-booking-change/`. A new capability
folder is for a genuinely new domain, not for a new branch.

**Pages and routes.** A concept like *packages* appears on the homepage, the product page
and checkout. Per-page specs would duplicate one concept across three files that then
drift apart. Where a capability surfaces is a cross-reference, never a reason to split it.

**Versions.** No `payments-v2`. A change edits the existing spec in place; if it crosses
domains it edits every affected spec.

**History.** Do not keep obsolete behaviour "for the record" - git holds the evolution, and
a spec carrying both the old and the new behaviour cannot be read as truth.

**Ticket language.** "This feature adds...", "in RL-123 we...". A spec must be readable by
someone who has never seen the git history.

## Two rules that are easy to skip and expensive to skip

**Every capability needs an entry in `capability-map.json`.** That file maps the capability
to its code globs, and the coupling guard uses it to catch code that moved without its
spec. A capability with no map entry is not merely unguarded - it rots silently, because
nothing will ever say so.

**A behaviour change and its spec update land in the same pull request.** The guard is
per-PR and has no bypass, so splitting them across two PRs makes the guard block the fix.
"Update the spec before implementing" is the principle; "in the same PR" is what makes it
operational.

## How you actually use it

You do not write these by hand either. The loop is a sequence of skills:

```
/spec-specify     one capability, from what you said
/spec-clarify     the questions, until nothing is left open
/spec-impact      which other capabilities this ripples into
/spec-update      edit every affected spec to the target state
/spec-plan  /spec-tasks  /spec-implement
/spec-reconcile   spec == code == tests, and specs agreeing with each other
```

The gate that matters is `/spec-clarify`. A spec does not reach planning until it has no
open markers of the `[NEEDS ...]` family: a missing decision, a missing input and a missing
asset block work exactly like an unanswered question, because all four mean somebody would
have to guess.

An open question the work answered gets closed in the same pull request. A gap still marked
open after it was resolved is as wrong as a missing one, and it teaches readers that the
section is decoration.

## Decisions behind it

- **[ADR-002](../decision-records/ADR-002-specs-by-capability.md) - by capability, never
  per ticket or per page.** Ticket-specs were the status quo and they are disposable by
  construction: they describe a change, so six months later nothing describes the system.
  Per-page specs were the other candidate and they duplicate one concept across every
  surface it appears on.
- **[ADR-006](../decision-records/ADR-006-personas-are-a-validation-gate.md) - a spec names
  its persona.** Without it, "the user" wants everything and no trade-off can be resolved
  in writing.
- **Git is the change mechanism.** A separate change-folder model was built and removed:
  the branch spec is the target truth, `main` is the current truth, and the diff is the
  delta. Anything else is a second history to keep in sync.
- **No plans or tasks competing with specs.** They are disposable execution aids. When a
  plan and a spec disagree, the spec wins, which is only possible if the plan never claims
  to be product truth.
