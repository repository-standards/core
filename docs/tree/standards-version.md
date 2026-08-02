One line, one version number. It records the state of the standard your repository last
aligned to.

It is a **bookmark, not an anchor**. It does not hold you at that version, it does not
appear in any command you run, and nothing you install is pinned to it. It answers exactly
one question: where does the next update measure its delta from.

## What it is for

An update is a **delta, not a re-scaffold**. When you move to a newer standard, the update
skill reads the difference between what this file records and what the standard is now, and
applies only that. Without the file it would have to re-derive your whole repository, which
means overwriting the choices you made.

## What goes in here

```
1.0.0
```

That is the file. Written by the alignment skill and updated by the update skill; you never
edit it by hand, because a number here that you did not actually align to makes the next
delta wrong in the invisible direction.

## What it is not

**Not a pin.** The standard is living and **latest is the only target**. There is no
supported way to say "keep me on 0.9" and no reason to want one - the tags exist so the
standard's own development can be tracked, not so adopters can sit still.

**Not a version you request.** No command takes it as an argument. If you see
`@<version>` or `--version` in a quickstart, that is documentation that predates the
decision, and it is a bug.

**Not a compatibility claim.** It says what you aligned to, not that you are still
compliant with it. Compliance is what `self-verify` reports, and that number can change
without this file changing at all - because your repository moved, not the standard.

## The one thing that catches people

Missing this file costs **two** drift points rather than one. A repository without it has
both failed to record which state it follows and failed to carry the file that says so.
That is not double-counting: they are two different failures, and a repo can fix the first
without the second by writing a number nobody verified.

## Decisions behind it

- **[ADR-025](../decision-records/ADR-025-the-standard-is-living-latest-is-the-target.md) -
  the standard is living, latest is the target.** Version pinning was the original model and
  it was removed. It produced repositories that adopted once, sat on an old state, and
  treated the standard as a dependency to manage rather than a thing to stay on. The word
  "pin" was swept out of every live surface when the decision landed; the last four
  occurrences were hiding in a JSON description, a script's usage comment, and the two entry
  files an agent reads first.
- **A weekly watch, not an auto-update.** `standards-update-watch.yml` opens one issue when
  a newer standard exists and never edits this file. Moving is a decision with a diff, and
  automating it would make the record untrue between the bump and the work.
