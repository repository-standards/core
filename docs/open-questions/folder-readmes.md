# Folder self-description - who says what, and where

**Decided (revised 2026-08-02): the two describe different things, and only one of them is
written by hand.**

- **The manifest says what a thing is and why it exists.** It already did - every entry carries
  a purpose, an adapt class, a profile and the rule it enforces, and `self-verify` reads exactly
  that data to decide compliance.
- **[`docs/file-map.md`](../file-map.md) is generated from it**, so a reader who wants the whole
  repo on one page gets one that cannot disagree with the thing it describes.
  `tools/file-map.mjs --check` fails CI on a stale copy.
- **A folder's `README.md` carries only the local editorial rule** - *what goes in here, what
  does not, and the trap specific to this folder.* Short. It must not restate what the map says.

## Why not one or the other

The original entry chose per-folder READMEs and named the doubt: they may bloat, and one file
serving two audiences may serve neither. Both halves turned out to be true, and the resolution
is that there were **two questions wearing one name**.

**Orientation** - *what is this folder* - wants one page you can read end to end and compare
across. A per-folder README is the worst possible shape for it: N clicks, no comparison, and N
places for the same sentence to drift.

**The local rule** - *does my new file belong here* - wants the opposite. It is needed at the
moment someone is adding a file, which is when they are in the folder and not on a docs site. A
central page cannot reach them there.

Splitting by *question* rather than by *audience* removes the redundancy the doubt was about:
neither file says what the other says.

## Where an agent actually reaches this

This decides what "explain it more thoroughly in the documentation" is allowed to mean.

**The rendered docs site is gitignored.** `site/docs/` does not exist in a clone, so an agent
working in a repository never sees it - it is HTML built for humans in a browser. Anything an
agent must know has to be **markdown in the repo**, or it may as well not exist.

`docs/file-map.md` is markdown, and `AGENTS.md` links it **directly** rather than only through
the docs hub - one hop, because two is one too many for the file that exists to orient someone
who is lost.

A folder `README.md` needs no pointer at all, and that is the strongest argument for keeping it:
an agent working inside a directory already has it, without a search. That is the cheapest
context available.

## What this cost

A generated page is only as good as the data behind it, and the data is now load-bearing for a
reader rather than only for a script. Generating it immediately exposed pinning language in four
manifest purposes that a same-day sweep of the prose had missed - an argument for the derived
view, and a warning that the manifest is now prose people read.

## The doubt that survives

**Nothing checks that a folder README stays inside its lane.** A future author who explains
*what a folder is* in one recreates exactly the duplication this split removed, and no guard
will notice - the rule is written here and in each README, and held by review. A guard would
have to judge what a paragraph is about.

**And an adopted repo gets no map at all** - `MAP-1` in [`backlog.md`](../../backlog.md). Its
folders, its orientation problem and its own manifest exceptions are all the same; the generator
is zone 1 only because that is where it happened to be written.
