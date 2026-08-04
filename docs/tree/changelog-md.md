The record of what changed, in developer language, and the **only** place change history
accumulates. Every pull request writes its entry under one heading:

```
## Unreleased

### A headline saying what changed and for whom (YYYY-MM-DD)

What was wrong, what it is now, who it affects.
```

## What it is for

**So that a release is a deliberate act rather than a side effect of merging.** A PR
describes its change; the maintainer promotes `Unreleased` into `## x.y.z - <date>` and moves
the version, once. That split is why the file is checked at two levels: the file has to exist,
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

**A version heading, or a version bump.** Both are the maintainer's, at release. A PR that
writes `## 1.4.0` has decided a release happened.

**Internal codes.** Ticket ids, rule numbers and backlog identifiers mean nothing to the
reader six months later. Say what changed.

**A second mechanism.** A per-PR fragments folder was tried and removed: the conflict it
avoided is resolved in seconds by keeping both lines, and nothing enforced the folder, so the
realistic outcome was a repo whose history was half fragments and half direct edits.

## Decisions behind it

- **R18 - a PR describes its change under `Unreleased` and never moves the version.** The
  release is one act by one person.
- **R25 - the release that promotes `Unreleased` moves the version**, and the version is one
  fact restated nowhere unchecked.
- **[R4](../../standard/SPEC.md) - history does not accumulate inside living documents.** This
  file is where it goes instead.
