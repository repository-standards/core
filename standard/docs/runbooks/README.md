# Runbooks - operating knowledge for production

One runbook per service: `docs/runbooks/<service>.md` - how to diagnose it, how to
start and stop it, its common failures, and the rollback steps. Agents are
first-class readers AND writers here: a runbook an agent cannot follow at 3 a.m.
is not done.

Start from [`_template.md`](_template.md).

## Postmortems

Incidents land in `postmortems/<date>-<slug>.md`. Blameless, and in this order:
facts, then causes, then actions. Every action item becomes a backlog item in the
same PR - a postmortem whose actions land nowhere is not done (the same rule
`docs/research/` applies to insights).

## What stays out

Dashboards live in the observability tool - link them, never screenshot them. A
pasted graph is stale the moment it lands; a link is not.

## Index

| Service | Runbook |
|---|---|
| - | (none yet) |
