# What to call a bounded period of work - and whether to have one

**Decided, provisionally:** `cycle`, as `docs/cycles/<team>/<slug>.md` - a container with
its own goal and an agreed end date, several active in parallel, one per team. An intent
moved into a cycle leaves the backlog pool and cannot sit in two cycles at once. Settled in
[ADR-028](../decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md).

**The path was the other way round first.** `docs/teams/<team>/cycles/` reads more naturally
if you think team-first, and it lost on one argument: every other folder under `docs/` is
named for the kind of thing inside it - `runbooks/`, `journeys/`, `ideas/`, `research/`,
`discovery/`. `teams/` would be the first that names an organizational unit instead, and it
would immediately invite everything else a team has to live under it. The artifact kind
stays the folder; the team is a partition inside it. Worth overturning if a second team
turns out to need genuinely per-team configuration rather than just its own files.

**The doubt:** the name is doing real work and none of the candidates is obviously right.

## Why not the obvious ones

- **`sprint`** carries the whole ceremony apparatus - planning poker, retro, velocity as a
  commitment - and this is deliberately none of that. Borrowing the word borrows the
  argument.
- **`wave`** is already spoken for: brownfield alignment runs in waves, and a repo where the
  same word means two different bounded things is exactly the collision this project keeps
  finding in its own files.
- **`track`** carries the parallelism well - several teams, several lanes - and loses the
  time bound and the goal, which are the two things that make the container useful.
- **`cycle`** is the current pick: Linear uses it for almost exactly this, so it arrives
  pre-explained to both people and agents, and it carries recurrence without implying
  ceremony.

## What a better answer would have to do

Name a period that (1) has an owner and a goal, (2) has an end date that is agreed rather
than fixed by a framework, (3) can run in parallel with several others under one backlog,
and (4) does not smuggle in a methodology. If a word does all four better than `cycle`,
this entry resolves into the record that renames it.

## The question underneath the name

Whether the standard should carry work periods at all. The counter-argument is honest: the
backlog with a definition of done per item already keeps knowledge alive, and periods are
coordination, which is `scale`-profile territory. If it lands, it lands as scale-only - a
solo repo should never meet it.

The argument for is timeline: with periods that carry goals and dates, a skill can read
every team's folder and derive when the project actually lands, and a closing skill can
record what was finished against what was planned. That turns estimation into arithmetic
over the repo's own history rather than a meeting. Without periods there is nothing to
derive it from.

## Options weighed

`sprint` (rejected: ceremony), `wave` (rejected: collides with the alignment waves),
`track` (loses the time bound), `milestone` (GitHub already owns the term, and it implies a
fixed date rather than an agreed one), `iteration` (accurate, but reads as the same
ceremony as sprint to most teams), `cycle` (current pick).
