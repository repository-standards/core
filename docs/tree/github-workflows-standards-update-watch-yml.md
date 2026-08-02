A weekly check for a newer version of the standard. When one exists it opens **one issue**
per release and stops there.

## What it is for

Staying current is a decision with a diff. The failure this prevents is quieter than being
out of date: it is not knowing you are, so the gap never enters anyone's judgment.

## What it deliberately does not do

**It never edits `.standards-version`.** Bumping the record without doing the work makes the
file untrue in the invisible direction - the next update would then measure its delta from a
state your repository never reached.

**It never opens a pull request.** An update is a delta applied by the update skill and it
ends at drift 0 or it is not finished. A machine-generated branch that lands halfway is
worse than an issue you read on Monday.

**It never closes its own issues.** One per release, left for a person.

## What does not go in here

**A schedule so frequent it becomes noise.** Weekly is a cadence somebody still reads.

**Auto-merge of anything.** See above: the point is that a human decides.

## Decisions behind it

- **[ADR-025](../decision-records/ADR-025-the-standard-is-living-latest-is-the-target.md) -
  latest is the only target, and the recorded state is a bookmark.** The watch tells you the
  bookmark has fallen behind; moving it is work, not notification.
- **An issue, not a notification.** An issue has a home, a thread, and a place for the
  decision not to move yet. A notification has none of those and is read once.
