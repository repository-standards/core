# What to call a bounded period of work - and whether to have one

**Decided:** `sprint`, as `docs/sprints/<team>/<slug>.md` - a container with its own goal and
an agreed end date, several active in parallel, one per team. An intent moved into a sprint
leaves the backlog pool and cannot sit in two sprints at once. The artifact was settled in
[ADR-028](../decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md);
the name in [ADR-041](../decision-records/ADR-041-the-bounded-period-of-work-is-called-a-sprint.md).

**This entry has already been overturned once, which is the point of it.** The first answer
was `cycle`, chosen against `sprint` on the argument recorded below: borrowing the word
borrows the ceremony. It lost to use. Readers stopped at the unfamiliar word and spent their
first question asking whether it was a sprint - and the dashboard made the cost visible, since
a page built for people who never open the repository had a tab whose label needed a sentence
before anything under it could be read. A design argument lost to an observation, which is the
only way it should have lost.

**The path was the other way round first.** `docs/teams/<team>/sprints/` reads more naturally
if you think team-first, and it lost on one argument: every other folder under `docs/` is
named for the kind of thing inside it - `runbooks/`, `journeys/`, `ideas/`, `research/`,
`discovery/`. `teams/` would be the first that names an organizational unit instead, and it
would immediately invite everything else a team has to live under it. The artifact kind
stays the folder; the team is a partition inside it. Worth overturning if a second team
turns out to need genuinely per-team configuration rather than just its own files.

**The doubt that remains:** the borrowed word arrives carrying expectations the standard does
not meet. Somebody who knows Scrum will look for points, a velocity commitment and a fixed
timebox, and find none of them. That cost is real; it is paid once per reader, in one clause,
where `cycle` charged every reader the same question forever.

## Why not the obvious ones

- **`cycle`** was the pick until 2026-08-07: Linear uses it for almost exactly this, so it was
  expected to arrive pre-explained to both people and agents, carrying recurrence without
  implying ceremony. In use it did not - it read as a new word for a thing people already had
  a word for.
- **`wave`** is already spoken for: brownfield alignment runs in waves, and a repo where the
  same word means two different bounded things is exactly the collision this project keeps
  finding in its own files.
- **`track`** carries the parallelism well - several teams, several lanes - and loses the
  time bound and the goal, which are the two things that make the container useful.
- **`iteration`** is accurate and neutral, and as unfamiliar as `cycle` was without even
  Linear's precedent behind it - the same tax for less.

## What a better answer would have to do

Name a period that (1) has an owner and a goal, (2) has an end date that is agreed rather
than fixed by a framework, (3) can run in parallel with several others under one backlog,
and (4) does not smuggle in a methodology. `sprint` fails (4) on its face and is kept anyway,
because ADR-041 denies the methodology explicitly and in one place, and because the word is
understood before the sentence explaining it. A candidate that does all four **and** is
recognised on sight would win.

## The question underneath the name

Whether the standard should carry work periods at all. The counter-argument is honest: the
backlog with a definition of done per item already keeps knowledge alive, and periods are
coordination, which is `scale`-profile territory. It landed as scale-only - a solo repo never
meets it.

The argument for is timeline: with periods that carry goals and dates, a skill can read
every team's folder and derive when the project actually lands, and a closing skill can
record what was finished against what was planned. That turns estimation into arithmetic
over the repo's own history rather than a meeting. Without periods there is nothing to
derive it from.

## Options weighed

`sprint` (rejected once for ceremony, chosen 2026-08-07 for recognition, with the ceremony
denied in the record), `cycle` (chosen 2026-08-02, overturned by use), `wave` (collides with
the alignment waves), `track` (loses the time bound), `milestone` (GitHub already owns the
term, and it implies a fixed date rather than an agreed one), `iteration` (unfamiliar without
a precedent to lean on).
