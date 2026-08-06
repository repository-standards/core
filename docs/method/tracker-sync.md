# Tracker sync - the optional extension

> **Skip this page entirely if you do not sync to a tracker.** Nothing here is required,
> nothing here is checked, and its absence is never drift. This is the one page in
> `docs/method/` that describes something most adopters will never have (ADR-032).

## Why this is an extension and not part of the standard

R15 already draws the line: the repo holds intents, the tracker holds execution state. Most
repos that adopt this standard will never connect one - and the moment a tracker's needs start
shaping the spec, the task list or the backlog row, the repo stops being the source of truth
and becomes a mirror of somebody's board.

So everything a tracker needs to stay in step lives **outside** those files, in a sidecar the
core never reads:

```
specs/<capability>/tracker.json
```

No shipped guard requires it. `self-verify` does not count its absence as drift. If your repo
has no such file anywhere, the standard behaves exactly as it did before this page existed.

## The problem it exists to solve

Task ids in `tasks.md` are **positional** - `T001`, `T002`, `T003` - and regenerated from
scratch every time the list is rebuilt. R13 makes task scaffolding ephemeral, so it is deleted
when the work closes. Both are correct for the repo, and together they make a task id useless
as a durable key:

> Round one generates `T001..T010`; they are exported; the work closes and `tasks.md` is
> deleted. The spec changes. Round two generates `T001..T012` from the new spec - and its
> `T003` is **different work** from round one's `T003`. An exporter keying on `[T003]` sees
> the id already present, skips it, and the new work never reaches the board. Nothing errors.

That was a real defect (`TRACK-20`), and the fix is not to make ids stable in the repo - it is
to stop keying on them from outside.

## What the sidecar holds

One entry per exported item, keyed by what the **repo** considers durable - a backlog intent's
id, a capability name, a decision record's id - never by a task's position.

```json
{
  "$about": "Tracker sync state for this capability. Derived and disposable: delete it and the next export re-creates it. The repo is the source of truth; this file only remembers what was already sent, so a re-export can tell 'already there' from 'not yet'.",
  "tracker": "jira",
  "epic": "AT-97",
  "items": [
    {
      "intent": "PAY-2",
      "key": "AT-131",
      "fingerprint": "sha256:9f2c...",
      "exported": "2026-08-06"
    }
  ],
  "tasks": [
    {
      "fingerprint": "sha256:41ab...",
      "title": "Retry the capture on a provider timeout",
      "key": "AT-132",
      "parent": "AT-131",
      "exported": "2026-08-06"
    }
  ]
}
```

**The fingerprint is the whole point.** It is a hash of the item's own content - an intent's
title plus its definition of done, a task's title plus the requirement slice it belongs to -
not of its position in a list. That is what lets an adapter answer the only two questions that
matter on a re-export:

| Fingerprint | Meaning | What the adapter does |
|---|---|---|
| present, unchanged | same work, already exported | nothing |
| present, **changed** | same work, its description moved | **report the divergence** - never silently overwrite |
| absent | genuinely new work | create it, write the key back |
| in the file, **gone** from the repo | work that no longer exists | report it; a human decides whether the card closes |

## The rules an adapter follows

These are the part worth transferring even if you write your own bridge for another tracker.

- **Write forward only.** Read the repo, create what is missing. The single write in the other
  direction is a newly created key, persisted here so the next run can tell "already there"
  from "not yet".
- **Never edit an issue you did not just create.** Not the summary, not the description, not
  the status, not the assignee. Somebody moved a card or reassigned it - that is the board
  doing its job, and a generator that overwrote it is one nobody may run twice.
- **Report divergence instead.** A changed fingerprint is not permission to rewrite the card;
  it is a line in the run's output saying this Story's source has moved since it was exported.
  A human decides. This is the half that was missing when the no-overwrite rule was first
  written, and the half that makes it safe rather than merely quiet (`TRACK-21`).
- **Dry-run by default.** Show the plan; `--apply` performs it.
- **Never key on a task id.** See above. Fingerprints only.

## What the repo still owns

The spec, the backlog row, the task list and the decision records carry **no tracker fields**.
If you are tempted to put a Jira key in a spec's front matter, that is the seam this whole page
exists to hold: put it here instead.

## Reference implementation

The Jira bridge described in [tracking-work.md](tracking-work.md) is the worked example - a
real generator running against a real board. It is not shipped with the standard, and it is not
the only shape allowed; it is the one that has been proven. A Linear or GitHub Projects adapter
following the rules above needs no change to core, which is the test ADR-032 set for whether
this seam was drawn in the right place.
