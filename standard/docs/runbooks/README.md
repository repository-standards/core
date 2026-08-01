# Runbooks - operating knowledge for production

One runbook per service: `docs/runbooks/<service>.md` - how to diagnose it, how to
start and stop it, its common failures, and the rollback steps. Agents are
first-class readers AND writers here: a runbook an agent cannot follow at 3 a.m.
is not done.

Start from [`_template.md`](_template.md).

## You have this case - say this

**A service just went live and has no runbook.** Write it while you still remember how
you got it running:

```
> write the runbook for the export worker - how to start it, how to tell it is stuck, how to roll it back
```

**Something is on fire right now.** The runbook is the first thing to read, and the
agent can read it faster than you:

```
> the export worker is backing up - walk the runbook and tell me which step we are on
```

**A step in the runbook was wrong at 3 a.m.** That is the moment it gets fixed, not the
next quarter:

```
> the restart step is missing the queue drain - fix the runbook, we just hit it
```

**The incident is over.** Facts, then causes, then actions - and every action becomes a
backlog item in the same PR:

```
> write the postmortem for tonight - blameless, and file the actions
```

**Corner case - a runbook nobody has run is a draft.** If the diagnose steps were never
executed against the real service, say so in the file. A confident runbook that has
never been true is worse than none.

## Postmortems

Incidents land in `postmortems/<date>-<slug>.md`, from
[`_postmortem-template.md`](_postmortem-template.md). Blameless, and in this order:
facts, then causes, then actions. Every action item becomes a backlog item in the
same PR - a postmortem whose actions land nowhere is not done (the same rule
`docs/research/` applies to insights). The template carries two sections people
skip and later need: the rejected actions, and what you are deliberately not
changing.

## What stays out

Dashboards live in the observability tool - link them, never screenshot them. A
pasted graph is stale the moment it lands; a link is not.

## Index

| Service | Runbook |
|---|---|
| - | (none yet) |
