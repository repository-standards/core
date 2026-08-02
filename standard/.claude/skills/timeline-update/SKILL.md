---
name: timeline-update
description: Use when someone asks when work will land - "when does billing ship?", "are we on track?", "what does the next quarter look like?", "update the timeline". Reads every cycle, derives throughput from the closed ones, and projects the open cycles and the backlog - or says plainly that there is not enough history to project, and gives no date.
---

# timeline-update

Someone wants to know when things land. This derives the answer from what the repo already
holds and writes it to `docs/cycles/TIMELINE.md`. *(scale profile only.)*

## The rule that makes this trustworthy

**State the evidence, or give no date.** A projection presented without its confidence is
what teaches people to distrust plans - and once they do, they stop reading the timeline and
start asking in meetings, which is the state this was meant to replace.

So: below **three closed cycles**, this reports what is in flight and **refuses to project a
completion date**, saying why. Three is not a magic number; it is the point below which one
unusual cycle dominates the average, and the file says so rather than hiding it.

## Steps

1. **Read every cycle** under `docs/cycles/`. Split into closed (an outcome block) and open.

2. **Derive throughput from the closed ones only.** Per cycle: intents finished, days
   elapsed, unplanned work absorbed. Throughput is finished-per-day, and **unplanned work
   counts** - a team that finished four planned items while absorbing three emergencies did
   not move at four items' pace, and a projection built on the planned number alone will
   under-read them permanently.

   Report the spread, not just the mean. Three cycles at 0.4, 0.4 and 0.5 items per day
   support a date; 0.2, 0.4 and 1.1 do not, and saying "roughly 0.55" over that spread is
   the dishonest part. When the spread is wide, give a range and say it is wide.

3. **Project the open cycles.** Remaining intents divided by throughput, from today. Compare
   with each cycle's target and name the gap in both directions - ahead is information too.

4. **Project the pool**, only if the user asked about it. The backlog is ordered by risk x
   leverage, not committed to, so a date on it is a shape rather than a plan: say "at the
   current rate the pool is about N weeks of work" and never assign items to dates nobody
   agreed to.

5. **Name what is off the rails, plainly.** Any cycle past its target and still open, listed
   with how many days over and what remains. This is the single most useful line in the file
   and it must never be softened - a timeline that hides a slipping cycle is worse than none.

6. **Write `docs/cycles/TIMELINE.md`.** It is regenerated whole, never appended to: it
   describes the present, and git holds what it said last week (R4). Include the evidence
   block - how many closed cycles, the throughput figures behind the numbers, and the date it
   was generated - so a reader can judge the projection without rerunning it.

7. **Say what would improve it.** Usually "two more closed cycles", sometimes "the last cycle
   recorded no unplanned work, which is unlikely - check whether it was tracked".

## Done when

- [ ] `docs/cycles/TIMELINE.md` regenerated whole, with its evidence block
- [ ] Every open cycle projected, or the refusal stated with its reason
- [ ] Cycles past their target named with the overrun
- [ ] No date given that the evidence does not support

## Not this

- **Do not project from open cycles.** A cycle in flight has no throughput yet; using its
  planned count as if it were finished work is how a timeline becomes a wish.
- **Do not assign items to people or to dates in the pool.** Committing is `cycle-open`'s
  job and a human's decision.
- **Do not smooth a bad number.** If throughput dropped by half, say it dropped by half. The
  reason belongs to the team, not to this file - and inventing one is worse than leaving the
  question open.
- **Do not treat a missed target as a failure.** The date is agreed and movable by design
  (ADR-028). Report the overrun; the judgement is the owner's.
