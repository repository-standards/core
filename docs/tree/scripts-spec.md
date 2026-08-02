The spec engine's runtime: the shared scripts and templates the `/spec-*` skills invoke. It
is vendored rather than depended on, and it carries its own MIT licence at
`scripts/spec/LICENSE`.

## What it is for

The skills are the interface; this is the machinery behind them - the gate that decides
whether a spec may proceed, the setup that creates a spec's working files, and the templates
those files are written from.

Keeping it separate from `scripts/` proper matters for one reason: everything else in
`scripts/` is this standard's own work and its own licence. This is somebody else's, adapted,
and that boundary has to be visible rather than remembered.

## What does not go in here

**Your own scripts.** They live in `scripts/`. A local edit inside this folder is a fork of
the engine that the next update has to merge.

**Changes that should be patches upstream.** Where this standard deliberately diverges from
the engine it came from, the divergence is marked in place with a `PATCHED` comment saying
what was changed and why - so the next person can tell an intentional difference from an
accident.

## Decisions behind it

- **[ADR-015](../decision-records/ADR-015-spec-engine-extracted.md) - the engine is
  extracted and vendored, not installed.** A dependency would mean a version to track, a
  registry to reach, and a tool that can break the loop remotely.
- **Attribution stays with the code.** The licence file lives beside what it covers rather
  than in a repository-wide notice, so copying the folder carries its terms with it.
