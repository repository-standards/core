# Product work - if you decide what it should do

You own **what should be true, and for whom**. You do not need to know how it is built, and
you should not be asked to.

This page is what you actually do, in order, with the sentences you type and the questions
you will get back.

## Your first move is always the same

Say what you want to exist, and describe it as behaviour - not the screen, not the
implementation, not the ticket:

```
> new feature: guests should be able to change their booking dates themselves
```

The words **new feature** are there for you, not for the agent - they make it obvious you are
asking for something rather than thinking aloud. All of these open the same loop, so use
whichever is how you actually talk:

```
> new story: a guest can change their dates without calling support
> write the spec for date changes - guests move their own booking dates
> we need guests to be able to move their booking dates
> guests should be able to change their booking dates themselves
```

"Feature", "story" and "spec" are the same request here. The last one is not a command you
have to learn - a capability's specification is simply what the repository calls the written
form of a feature, and you will see the word on the file you get back.

That is a complete instruction, whichever form you used. Nothing else is required from you
yet. The agent works out whether this capability already exists, reads anything from
meetings on the subject, drafts what it can, and comes back with the questions only you can
answer.

**What you get back within a minute** is a draft specification at
`specs/booking-changes/spec.md`, marked as still in refinement, with every gap written into
it as a named blocker - a question, a missing decision, a missing design, a missing
credential - each with an owner. Nothing is hidden and nothing is guessed.

**Say what should happen, not how.** "Add a button to the booking page" describes a
solution. "A guest can move their dates without calling support" describes the thing you
actually want, and leaves room for a better answer than a button.

## What the agent will ask you, and why

It asks about exactly one class of thing: **decisions only you can make.** It will not ask
you which library to use, and it will not ask you to approve a design pattern.

Real examples of what comes back:

> If a guest moves a booking to a more expensive week, do they pay the difference or keep
> the original price?

> Can a guest change a booking that starts tomorrow, or is there a cut-off?

> When a change fails halfway - dates freed, payment declined - who is the booking held
> for, and for how long?

That third one is the kind of question that usually surfaces in production. Getting it in
writing before anything is built is most of the value here.

## The four answers you are allowed to give

**A decision.** The normal case.

```
> they pay the difference, always, and we show it before they confirm
```

**A deferral, with an owner.** Perfectly valid, and it is recorded rather than lost:

```
> the cut-off is Maja's call, not mine - hold that question and tell me when it starts
> blocking the work
```

**"I do not know yet."** Also valid. It becomes a visible open item.

```
> no idea about partial failures, we have never had one - flag it, we will decide when it matters
```

**A question back.** You are allowed to not understand something:

```
> what does "idempotent" mean here and does it change anything for a guest?
```

## What you must never be asked to do

**Approve something you cannot read.** Any spec, any decision, any acronym - ask for it in
plain language with an example, and you will get one:

```
> explain the booking-changes spec to me in plain language, with an example
```

**Guess at a technical trade-off.** If a question feels like it is about how rather than
what, say so - it is routed to the technical side rather than dropped:

```
> that sounds like a technical call, not mine - decide it and record why
```

**Remember a command.** There are none. Describe the situation.

## The work itself - backlog, sprints, when it lands

Writing behaviour is half the job. The other half is knowing what is owed, what somebody
picked up, and when it lands - three files with their own page:
[backlog, sprints, timeline](tracking-work.md).

The one habit worth forming now: when something surfaces mid-conversation and it is not this
change, say so and keep going.

```
> the export dies when it times out, there is no retry - not fixing it in this change,
> write it down so we do not lose it
```

## Checking on things without asking a person

```
> what is blocking booking-changes from being built?
```

> One open item: the change cut-off, waiting on a business decision (Maja). Everything
> else is settled and it is ready otherwise.

The specification **is** the status report. There is no separate board to read and no
standup needed to find out what is stuck - and because a script decides when something is
ready rather than a person, "ready" means the same thing every time.

## When two users want opposite things

This is the situation the standard cares most about, because it is the one that normally
gets resolved silently by whoever writes the code.

```
> hosts want instant confirmation, guests want a cooling-off period - these conflict
```

The agent will not pick. It writes a **business decision record**: what was chosen, who it
favours, what it costs the other side, and what would make you revisit it. A year later
somebody will ask why the product behaves that way, and the answer will be a file rather
than a guess.

## Things you should say that people usually do not

**When something changes in the business, not the code.** New facts age the specification
just as fast as new features:

```
> the provider settles refunds at T+3, not same day - update whatever this affects
```

**When a meeting happened.** Drop the notes; do not summarise them first:

```
> notes from today's pricing meeting: <paste>
```

You get an extract with its date and source, and anything contradicting an earlier meeting
is flagged rather than quietly overwritten. Later, when a spec is written, nobody re-asks
you what that meeting already settled.

**When you have an idea that may go nowhere.** It gets a file and no ceremony:

```
> idea: let hosts pre-approve repeat guests so the second booking skips review
```

No specification, no decision record, no backlog item until you say it is worth building.
And if it dies, the reason stays written down, so the next person to have the same idea
finds out what happened.

## What you get out of this

A specification per capability that says what the product does today, in language you can
read, with every open question named and owned. A decision log that answers "why is it like
this". And a guarantee, enforced by a check rather than by goodwill, that the code and that
description cannot drift apart without somebody being told.
