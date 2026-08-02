One runbook per service: how to diagnose it, how to start and stop it, what usually goes
wrong with it, and how to roll it back. Plus the postmortems, because an incident that
teaches nothing was just a bad night.

The bar for a runbook is unusual and it is the point: **an agent has to be able to follow
it at three in the morning.** Not skim it - follow it, step by step, without asking anyone.
A runbook that assumes you already know the service is a reminder, not a runbook.

## What it is for

The knowledge that normally lives in one person's head and leaves with them. How you can
tell this thing is stuck rather than slow. Which restart is safe and which one loses data.
What the rollback actually is, as opposed to what everyone assumes it is.

## What goes in here

One file per service, `docs/runbooks/<service>.md`, from the template beside it. Incidents
land in `postmortems/<date>-<slug>.md`.

A postmortem is blameless and goes in one order: **facts, then causes, then actions.** Every
action item becomes a backlog item **in the same pull request** - a postmortem whose actions
land nowhere is not finished, it is a diary entry.

The postmortem template carries two sections people skip and later need: the actions that
were **rejected**, and what you are **deliberately not changing**. Six months on, those are
the two things nobody can reconstruct, and their absence is why the same argument reopens.

## What does not go in here

**Dashboards.** Link them, never screenshot them. A pasted graph is stale the moment it
lands; a link is not.

**Architecture.** How the service is built is `ARCHITECTURE.md`. A runbook says what to do,
not how it works, and mixing the two makes the three-in-the-morning read slower.

**Blame.** Not as a value, as a mechanic: a postmortem naming a person gets written
defensively, and a defensive postmortem omits the fact you needed.

## The corner case that matters

**A runbook nobody has run is a draft, and it must say so.** If the diagnose steps were
never executed against the real service, put that at the top of the file. A confident
runbook that has never been true is worse than no runbook, because it gets followed at the
exact moment nobody has the patience to doubt it.

## How you actually use it

Write it while you still remember getting it running:

```
> write the runbook for the export worker - how to start it,
  how to tell it is stuck, how to roll it back
```

Read it when something is on fire, and let the agent read it faster than you can:

```
> the export worker is backing up - walk the runbook and tell me which step we are on
```

Fix it at the moment it was wrong, not next quarter:

```
> the restart step is missing the queue drain - fix the runbook, we just hit it
```

And close the incident properly:

```
> write the postmortem for tonight - blameless, and file the actions
```

## Decisions behind it

- **Agents are first-class readers here, not an afterthought.** That is what sets the
  "followable at 3 a.m." bar. Writing for a human who already knows the system produces a
  document that is useless to the one reader guaranteed to be awake.
- **Actions land in the backlog in the same pull request.** Filing them "after the review"
  was the alternative and it is where action items go to die. The same rule applies to
  research insights, for the same reason.
- **Rejected actions are kept.** Recording only what you decided to do makes the next
  incident re-propose everything you already considered and turned down.
