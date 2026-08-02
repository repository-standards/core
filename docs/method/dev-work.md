# Dev work - if you build it

You own **making it buildable and correct**. Your input is intent, in somebody else's words.
Your output is something an agent can implement without inventing anything, plus the records
of whatever you had to decide on the way.

## The move that pays for itself

Before anything else, find out what the change actually touches:

```
> what does adding date changes touch? which capabilities, which decisions, which code
```

> `bookings` (the lifecycle and the cancellation rules), `payments` (a partial refund path
> that does not exist yet), `notifications` (the guest and the host both need telling).
> ADR-009 constrains how the refund is issued.

Doing this first is the difference between one coherent change and three weeks of
follow-ups. It is also where most surprises live: the capability nobody mentioned is
usually the one that breaks.

## Raise the spec to buildable

A product-written spec says what should happen. Buildable means an agent could implement
**and verify** it from the spec alone, without reading the code:

```
> raise booking-changes to buildable - what is still missing?
```

> Missing: the exact error shape when a date range is unavailable; whether the price
> difference is a new charge or an adjustment to the original; the state the booking sits
> in between "changed" and "paid".

The bar is contracts, quoted verbatim rather than described: real field names, real enums,
real error codes, real endpoints. **A paraphrased contract is not a contract** - it is a
description of one, and the difference shows up as a bug six weeks later.

What you cannot pin down goes in `## Open questions`, never glossed over. Honesty about
gaps is what makes the rest of the document trustworthy.

## Write the decision while you are making it

The moment a change forces a contestable choice, that is a record - and the cheapest time
to write it is now, not at review:

```
> we are using an outbox table rather than a queue for this - write it up, the reason is
  we already have Postgres and one moving part is worth a lot here
```

You get context, the decision, the options you did not take with why, the consequences, and
a **revisit-when**. That last field is the difference between a record and an opinion: it
names the concrete signal that would reopen the question.

**The test for whether something needs a record:** would reversing it cost a rewrite, or a
search-and-replace? A rewrite is a decision. A search-and-replace is a convention, and it
belongs in `AGENTS.md`.

## Build it

```
> plan booking-changes
```

If planning refuses, **read the refusal as your to-do list**. It will not start on a spec
with open questions, and it names each one and who owns it:

> Not ready: a business decision on the change cut-off (Maja), and the UX flow for the
> date picker (design). Two items, both external.

That is not the tool being obstructive. Planning against an unanswered question means
somebody - probably you, probably at 6pm - guesses, and the guess becomes the behaviour
without anyone deciding it.

Then `tasks`, then implement, then reconcile.

## Reconcile, which is the step people skip

```
> reconcile booking-changes against what we actually merged
```

Three things must agree: the specification, the code, and the tests. When they do not, the
question is which one is wrong - and the answer is genuinely not always the code:

- the code does something the spec never mentioned → the spec was incomplete, fix it
- the spec describes behaviour nobody built → either build it or admit it, in writing
- the tests pass but assert something the spec does not require → the spec is the contract

**If building revealed that the spec was wrong, fix the spec.** It is the current truth, not
a plan you are held to. What is not allowed is knowing they disagree and merging anyway.

## The guard, and the one thing that surprises everyone

A pull request that changes a capability's code without touching its specification fails.
There is no bypass, and that is deliberate: an escape hatch on a coupling check is used
exactly once and then always.

The surprise: **the guard compares commits, not your working tree.** An uncommitted spec fix
shows as a failure. That reads as a false alarm the first time and is not one - the pull
request is what is being judged, and your working tree is not in it.

## Before you push

```
> review this branch as if someone else wrote it
```

Local checks first, then the diff read cold. A review after the push is a review of
something already published, and the fixes then arrive as a second round of noise on top of
the first.

## Situations that come up constantly

**"The code does something the spec does not mention."**

```
> the code caps date changes at three per booking, the spec says nothing
```

That is drift, and it goes one of two ways: the cap is intended and the spec gains it, or it
is accidental and it becomes a backlog item. What it never becomes is a silent gloss.

**"Is this a new spec or an edit?"** Ask which capability owns the behaviour, not which
ticket asked for it. Same capability means the same folder, always - there is no `-v2`.

```
> does gifting a booking to a friend belong in an existing spec or a new one?
```

**"This spec has been in refinement for three weeks."** That is fine if discovery is
genuinely running. It is not fine if nobody knows what it is waiting for, and that is
answerable in one line:

```
> what is blocking it, and who owns each item?
```

**"I need to change an accepted decision."** You do not edit it. You supersede it, and the
old text stays exactly as written:

```
> ADR-009 says refunds go through the provider, we are moving to manual - supersede it
```
