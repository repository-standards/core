---
name: timeline-update
description: Use when someone asks when work will land - "when does billing ship?", "are we on track?", "what does the next quarter look like?", "update the timeline". Reads every sprint, derives throughput from the closed ones, and projects the open sprints and the backlog - labelling every number as measured or estimated, and giving no date at all when the evidence supports none.
---

# timeline-update

Someone wants to know when things land. This derives the answer from what the repo already
holds and writes it to `docs/sprints/TIMELINE.md`. *(scale profile only.)*

## The rule that makes this trustworthy

**State the evidence, or give no date.** A projection presented without its confidence is
what teaches people to distrust plans - and once they do, they stop reading the timeline and
start asking in meetings, which is the state this was meant to replace.

So: below **three closed sprints** there is no measured throughput, and this must not present
one. Three is not a magic number; it is the point below which one unusual sprint dominates the
average, and the file says so rather than hiding it.

What it does instead is the **cold-start mode** (standard ADR-029): if items carry `size`, describe the
**shape** of what is left - "two `L`s and three `M`s remain, heavier than the last sprint's mix" -
and say plainly that this is a ranking, not a date. The standard's ADR-029 is explicit that sizes are "never
summed, never converted to numbers, and never fed into a projection", cold start included, so
no duration is manufactured from a size letter under any circumstance - there is no such thing
as an "estimated date" here, only a size-based read of how heavy the remaining work looks. If
items carry no size either, report what is in flight and give no date at all. Both cold-start
branches end the same way - **no date** - the only difference is whether the reader also gets
a shape.

**There is no blended mode.** At three closed sprints the projection switches to measured
durations and sizes stop feeding it entirely - say so in the file the first time it happens, so
a reader who saw last month's estimate knows why the number moved.

## Steps

1. **Read every sprint** under `docs/sprints/`. **`Status` is the signal** - `closed` or `open`,
   nothing else. Not the presence of an outcome block: a sprint can carry one and still be
   open if someone wrote it early, and `sprint-close` flips the status as its last act. If the
   two disagree in any sprint, say so in the file rather than picking one silently.

2. **Derive throughput per team, never blended across teams.** `docs/sprints/<team>/` is
   the scope: the three-closed-sprints threshold and the throughput figure it produces are
   each team's own, from that team's own closed sprints only. A repo with two teams at two
   and one closed sprints has **no team at three yet** - do not add the counts together to
   reach one. Per sprint: intents finished, days elapsed, unplanned work absorbed.
   Throughput is finished-per-day, and **unplanned work counts** - a team that finished
   four planned items while absorbing three emergencies did not move at four items' pace,
   and a projection built on the planned number alone will under-read them permanently.

   Report the spread, not just the mean. Three sprints at 0.4, 0.4 and 0.5 items per day
   support a date; 0.2, 0.4 and 1.1 do not, and saying "roughly 0.55" over that spread is
   the dishonest part. When the spread is wide, give a range and say it is wide.

3. **Project the open sprints.** Remaining intents divided by throughput, from today. Compare
   with each sprint's target and name the gap in both directions - ahead is information too.

4. **Project the pool**, only if the user asked about it. The backlog is ordered by risk x
   leverage, not committed to, so a date on it is a shape rather than a plan: say "at the
   current rate the pool is about N weeks of work" and never assign items to dates nobody
   agreed to.

5. **Name what is off the rails, plainly.** Any sprint past its target and still open, listed
   with how many days over and what remains. This is the single most useful line in the file
   and it must never be softened - a timeline that hides a slipping sprint is worse than none.

6. **Write `docs/sprints/TIMELINE.md`.** It is regenerated whole, never appended to: it
   describes the present, and git holds what it said last week (R4). Include the evidence
   block - how many closed sprints, the throughput figures behind the numbers, and the date it
   was generated - so a reader can judge the projection without rerunning it.

7. **Say what would improve it.** Usually "two more closed sprints", sometimes "the last sprint
   recorded no unplanned work, which is unlikely - check whether it was tracked".

## Show it, do not just write it

The file is the record; the reply is what a person actually reads. End with a compact summary
in chat - a table of sprints (team, goal, target, remaining, projected, over/under), then the
one line that matters most, then the evidence in a sentence. Someone should be able to paste
that reply into a status update without editing it.

Keep it to what is asked. A person asking "are we on track?" wants the verdict first and the
table second, not a report to hunt through.

## Done when

- [ ] `docs/sprints/TIMELINE.md` regenerated whole, with its evidence block
- [ ] Every open sprint projected from measured throughput, or given a size-based shape with
      no date, or given neither with the refusal stated - never a date manufactured from sizes
- [ ] Sprints past their target named with the overrun
- [ ] No date given that the evidence does not support
- [ ] A readable summary shown in the reply, not only written to the file

## Not this

- **Do not project from open sprints.** A sprint in flight has no throughput yet; using its
  planned count as if it were finished work is how a timeline becomes a wish.
- **Do not assign items to people or to dates in the pool.** Committing is `sprint-open`'s
  job and a human's decision.
- **Do not smooth a bad number.** If throughput dropped by half, say it dropped by half. The
  reason belongs to the team, not to this file - and inventing one is worse than leaving the
  question open.
- **Do not treat a missed target as a failure.** The date is agreed and movable by design
  (standard ADR-028). Report the overrun; the judgement is the owner's.
- **Do not sum sizes into a velocity.** Sizes are a cold-start ranking signal and a splitting
  trigger, not a currency (standard ADR-029). If they are being added up, the practice this standard
  deliberately left behind has been rebuilt.
- **Do not turn a size letter into a date, ever - cold start included.** The standard's ADR-029 forbids
  converting sizes to numbers outright, not only once measured sprints exist. A size-based
  cold-start read is a shape ("heavier than usual"), never a duration or a projected date.
- **Do not blend an estimate with a measurement.** Once three sprints have closed, sizes are
  out of the projection entirely. A number that is half measured and half guessed cannot be
  labelled honestly, which is the whole point of labelling it.
