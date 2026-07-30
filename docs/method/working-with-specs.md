# Working with specs - what you say, what happens

> The practical companion to [ways-of-working](ways-of-working.md): real
> situations, the exact prompt you give your agent, and what the standard does
> underneath. For busy people: find your case, say the line. The agent runs
> the skills - you never have to remember their names, but every case below
> shows which one fires so you can call it directly when you want to.

The one rule under all of it: **specs are living specifications of the current
or target state - not archives, not wish lists** (ADR-002, ADR-024). Materials
go to [discovery](discovery.md), decisions to ADR/BDR, work items to the
backlog. The spec holds behavior.

## "I want the product to do something new" (PO)

```
> guests should be able to change their booking dates themselves
```

The agent starts the loop itself (the standard is AI-led, ADR-010): it checks
`docs/discovery/` for a related dossier, checks `specs/` for an existing
capability, then runs `/spec-specify`. You get a draft spec at
`specs/booking-changes/spec.md`, `Status: in-refinement` (the draft state),
with every gap as a typed open marker - a question (CLARIFICATION), a missing
decision (DECISION: ADR/BDR), a missing input (INPUT: e.g. UX design), a
missing asset (ASSET: e.g. credentials) - each naming who brings it. Then the
clarify loop asks you only what genuinely needs your call.

**Corner case - the capability already has a spec**: the agent updates
`specs/booking-changes/` **in place**. Same capability = same directory,
always (ADR-002); there is never a `booking-changes-v2/`. New behavior enters
an existing spec through the same specify/clarify round.

**Corner case - is this a new spec or a change to an existing one?** Ask what
capability owns the behavior, not what ticket asked for it. "Change dates" and
"cancel booking" both belong to the booking capability's boundary decisions -
when in doubt, say it and let the agent propose:

```
> does this belong in an existing spec or a new one? guests want to gift a booking to a friend
```

## "Something came out of a meeting" (anyone)

```
> /discovery-digest notes from today's pricing meeting: <paste>
```

The extract (not the transcript) lands in `docs/discovery/<topic>/` with a
date+source stamp; contradictions with earlier entries get flagged. How the
dossier feeds specs - and why nobody ever re-answers an old question - is the
whole of [discovery.md](discovery.md). Had a meeting? Drop the extract. That
is the entire habit.

## "I have new information for an existing feature" (PO or dev)

```
> the provider settles refunds at T+3, not same day - update the booking-changes spec
```

The agent runs `/spec-impact` (what else does this touch?), then
`/spec-update` on every affected spec - in the same PR as any code change,
because the coupling guard blocks code-only changes to mapped capabilities
(R11). If the new fact contradicts a recorded decision, the agent proposes a
**superseding** record instead of silently editing the old one.

## "I am about to build it" (dev)

```
> plan booking-changes
```

`/spec-plan` refuses a spec that is not `ready-to-develop` - that status is
earned, not typed: the clarify gate script passes only when `## Clarifications`
exists and zero open markers of the family remain. So if planning is blocked,
the gate's output IS your to-do list: it names every open marker and its
owner. Chase those, not the plan. After that: `/spec-tasks`,
`/spec-implement`, and `/spec-reconcile` closes spec == code == tests and
flips the status to `live`.

## "What is left to do here?" (anyone)

```
> what is blocking booking-changes from development?
```

The agent runs the clarify gate and reads the markers back: "a BDR on
repricing (business), the UX flow (design), sandbox credentials (ops)". The
spec is the status report - no tracker archaeology.

## "I found the code does something the spec does not say" (dev)

```
> the code caps date changes at 3 per booking but the spec says nothing about it
```

That is drift. The agent records it in the spec's `## Open questions` (or
fixes the spec if the behavior is intended and settled), and it becomes a
backlog item - never a silent gloss (R13). The backlog is where work waits:
items arrive from spec deltas, drift, and onboarding, and leave only when
their definition of done is met.

## What does NOT go into a spec

| You are holding | It goes to |
|---|---|
| meeting notes, mails, screenshots | `docs/discovery/<topic>/` - with provenance |
| the *why* of a fork you took | an ADR/BDR - the spec links it |
| "we should someday..." | `docs/ideas/` (may never ship) or the backlog (will) |
| plan/tasks scaffolding | ephemeral - removed at `live` (ADR-010) |
| the history of the spec | git - the spec describes the present (ADR-018) |

## The status walk (who flips what)

`in-refinement` (the draft state - open markers welcome, that is the point)
-> `ready-to-develop` (earned mechanically: the clarify gate passes)
-> `in-development` (plan/tasks/implement running)
-> `live` (reconciled: spec == code == tests; scaffolding cleaned).

A spec can sit in `in-refinement` for weeks while discovery runs - that is
healthy, and the markers keep it honest. What it must never do is reach
development with anything still open; the gate makes that a property of the
repo, not of anyone's discipline.
