# I am rolling this out - tech lead, architect, consultant

You are the person who decides that a team or a client works this way, and who then has to
make it true across more than one repository, usually while doing the actual work as well.

This page is for that job: the order to do it in, what to say to people who did not choose
this, and where it goes wrong.

## Do not start with the greenfield repo

Start with a **real** one. A clean scaffold proves nothing to anyone and convinces nobody,
because the objection you will get is "that is fine for a new project".

Pick a repository that is genuinely messy but that you know well, and run the assessment
without changing anything:

```
> score this repo against repositorystandards.com - count the work, do not do it
```

You get a number and a list. That is the artefact you take into the conversation, and it
works because it is about their code rather than about a methodology.

## What to say to a sceptical team

The three objections come in the same order every time.

**"We already have documentation."** Ask when the wiki was last true. Not last edited - last
true. The point of this is not more documentation; it is documentation a guard fails the
build over, so it cannot quietly stop being true.

**"This is overhead."** Show the profile split. A solo repository carries `core` and nothing
else - no cycles, no journeys, no research, no pull request template. Ceremony arrives with
team size and not before, and a deviation is legal when it is recorded.

**"We do not have time to write specs."** They are already writing them, in tickets that get
closed and forgotten. The difference is where it lands and whether anything checks it. And
in practice the specification is written by the agent from what they say, not typed by them.

## Roll it out in waves, never in one pass

A brownfield repository gets read first, then walked back in waves. Do not let anyone
attempt a big-bang alignment - it produces an enormous pull request nobody can review, and
the review is where the value was.

The sequence that works:

1. **Assess only.** No changes. Everyone sees the number.
2. **The entry file and the guards.** `AGENTS.md`, the scripts, the workflows. This is small,
   and from here the claim is measurable.
3. **The personas and the product doc.** Before any spec, because a spec that cannot name who
   it serves is the failure mode you are trying to prevent.
4. **Specs for the capabilities you are already changing.** Never all of them. The ones with
   work in flight get written by the people doing that work.
5. **The backlog absorbs the rest.** Everything you found and did not fix becomes a row with
   a source, so the gap is visible rather than forgotten.

Waves two through five each land as their own pull request. If a wave is too big to review,
it was too big to trust.

## Across several repositories

The standard is the same everywhere; what differs is the profile and the stack.

Do not fork it per client. A local deviation is a **recorded** decision in that repository -
a superseding record saying what you did differently and why - which survives an update. A
forked standard does not: the next version arrives and nobody can tell your changes from the
drift.

If you work in one technology repeatedly, the stack layer is where your technology opinions
belong, and it updates independently of the core.

## The two mistakes to avoid

**Adopting into a repository nobody is actively working on.** Nothing will exercise the loop,
the specs will be written once from the code and never touched, and in three months you will
have proved that the standard produces stale documents. Adopt where the work is.

**Being the only person who knows how it works.** If every question routes through you, you
have added a bottleneck and called it a standard. The test is whether somebody who was not in
the room can open the repository and act - which is what the rest of this section is for.

## What you get to point at

A number per repository, produced by a script rather than by an opinion. A decision log that
explains the shape of each project without you being in the meeting. And, for the person who
signs off but cannot read a diff, a green check that means something specific and checkable.

That last one is usually why this gets adopted at all.
