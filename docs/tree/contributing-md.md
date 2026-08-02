How somebody outside your team gets a change in: where to raise it, how to open a pull
request, and what you expect before they do.

It is deliberately thin, and it defers rather than restates: the conventions live in
`AGENTS.md`, so this file says where to put things and points at the rules rather than
carrying a second copy of them.

## What it is for

**So a first contribution does not require guessing.** Which branch, based on what, run
what before pushing, and where a disagreement goes when it is not a bug. Every project has
answers to these; most keep them in the maintainer's head, where they are enforced only
after the contributor has already got them wrong.

## What goes in here

**Where to put a thing.** A discussion, an issue and a pull request are three different
shapes and picking wrong wastes everyone's time. The useful line: an issue says something
is wrong, a discussion works out whether it is.

**The pull request path**, in steps. Branch, change, update what the change makes untrue,
run the local gate set, read your own diff, open it.

**What you are looking for**, specifically. "Contributions welcome" is not an invitation
anyone can act on.

## What does not go in here

**The conventions themselves.** Commit format, branch model, comment style - `AGENTS.md`.
Restating them here means two files to keep true and one that quietly is not.

**Anything that assumes familiarity.** A contributor who gets the reasoning right and the
conventions wrong is easy to land; the reverse is not, and the file should read that way.

## Decisions behind it

- **It defers to `AGENTS.md` rather than duplicating it.** Contribution mechanics and repo
  conventions overlap heavily, and the copy is what rots.
- **Optional at core, expected at scale.** A solo repository with no outside contributors
  has nobody to address. The moment a second person appears, its absence is the first thing
  they hit.
