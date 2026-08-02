The repository's front door. The file GitHub renders first, read by people deciding whether
to look further - not by an agent, which reads `AGENTS.md`.

Those two audiences want different things, which is why they are different files.

## What it is for

**So somebody can tell within thirty seconds what this is and whether it concerns them.**
That is the whole job. A README that requires reading to answer "what is this" has already
lost the reader it was written for.

## What goes in here

What it is, in a sentence. What it does for whom. How to run it locally. Where to go next -
the entry point for agents, the docs for humans, the licence.

## What does not go in here

**Documentation.** A README that grows into a manual is a manual nobody maintains, because
it is edited only when somebody notices it is wrong on the front page.

**Conventions and rules.** Those are `AGENTS.md`. Restating them here creates the split that
makes both untrustworthy.

**A feature list.** The specs are the feature list and they are the checked one.

**Badges that mean nothing.** A badge is a claim; each one should be checkable.

## Why it is authored, never templated

It ships as `fill-from-repo`: a shell you write from your repository's own reality. A
plausible generated README is worse than none, because it reads as decided - so nobody
revisits it, and the repository's front page describes a project that does not exist.

## Decisions behind it

- **`AGENTS.md` is the entry point, README is the front door.** Merging them was the
  obvious alternative: it produces a file that is either too long for a human deciding
  whether to care, or too thin for an agent that needs the conventions.
- **Optional in the manifest, expected in practice.** A repository with no README is not
  non-compliant, because there are repositories where it genuinely adds nothing. It is
  simply unusual.
