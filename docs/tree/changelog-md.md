The record of what changed, in developer language, and the **only** place change history
accumulates. Every pull request writes its entry under one heading:

```
## Unreleased

### A headline saying what changed and for whom (YYYY-MM-DD)

What was wrong, what it is now, who it affects.
```

## What it is for

**So that a release is a deliberate act rather than a side effect of merging.** A PR
describes its change and promotes `Unreleased` into `## x.y.z - <date>` itself, moving the
version once - PATCH by default, unless directed otherwise or told explicitly to leave it
unpromoted. That split is why the file is checked at two levels: the file has to exist,
and the `Unreleased` heading has to be in it - without the heading there is nowhere to write
an entry that is not a version heading the PR just invented.

It is also the reason no other document grows a history section. A spec, an ARCHITECTURE
page, a runbook all describe the present; git holds every past state; this file holds the
curated record. Three competing histories only drift.

## What goes in here

**Prose, aimed at a person deciding whether this release touches them.** What was wrong, what
it is now, and what that means. One or two paragraphs beats a list of commit subjects, which
the reader can get from git.

**Every change.** This output is complete and mechanical. The curated, plain-language story
for a non-technical reader is a *different* output - `RELEASE-NOTES.md`, written at release,
not the changelog with the boring lines removed.

## What does not go in here

**A version heading, or a version bump, written ahead of what the PR actually ships.** A PR
promotes `Unreleased` to the version it is actually cutting, once - it does not pre-write a
future heading, and it does not bump past what the owner directed for that PR.

**Internal codes.** Ticket ids, rule numbers and backlog identifiers mean nothing to the
reader six months later. Say what changed.

**A second mechanism.** A per-PR fragments folder was tried and removed: the conflict it
avoided is resolved in seconds by keeping both lines, and nothing enforced the folder, so the
realistic outcome was a repo whose history was half fragments and half direct edits.

## More than one changelog

**Two different repo shapes each split this file - never conflate them.**

A repo that maintains more than one release line (a maintained `1.x` branch beside
`main`'s `2.x`) carries one changelog per line, each with its own `Unreleased` heading;
a PR writes its entry under the heading on the branch it targets.

A repo that ships more than one independently-versioned, independently-publishable unit
from the same tree - `rails/rails`'s thirteen gems (`activerecord`, `actionpack`,
`activesupport`, ...), each with its own `CHANGELOG.md` in its own directory, all
changing together on one branch - carries one changelog per unit instead of one at the
root. A PR writes its entry under the heading of every unit it actually touches; a
change spanning two gems gets two entries, one per file, not one entry naming both.

These are independent axes (ADR-044): release lines split a changelog across branches
over time, units split it across the same tree at once. A repo can face either, both,
or - the common case - neither, and carry the one root `CHANGELOG.md` this page opens
with.

## Decisions behind it

- **R18 - a PR describes its change under `Unreleased` and bumps the version itself,
  PATCH by default.** The owner directs a different bump or an explicit no-bump per PR; the
  same rule extends to more than one release line and to more than one publishable unit,
  never a second kind of mechanism.
- **R25 - the PR that promotes `Unreleased` moves the version**, and the version is one
  fact restated nowhere unchecked.
- **[R4](../../standard/SPEC.md) - history does not accumulate inside living documents.** This
  file is where it goes instead.
