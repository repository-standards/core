# <Repo> constitution (spec-kit governance bridge)

**Version:** 1.0.0 | **Ratified:** YYYY-MM-DD | **Last amended:** YYYY-MM-DD

> This is a BRIDGE, not a second rulebook. It does not restate conventions - it
> points the spec-kit Constitution Check at the real sources and hard-stops on
> conflict.

## The check (runs at /speckit-plan)

A plan passes only if it is consistent with, in altitude order:

1. `PRINCIPLES.md`
2. Accepted ADR / BDR (the relevant ones - not all of them)
3. `ARCHITECTURE.md` + `CODING_STANDARDS`
4. `AGENTS.md` conventions and red-flags

## Hard stops

- The plan contradicts an Accepted ADR -> stop; propose a superseding ADR first.
- The plan trips an `AGENTS.md` red flag -> stop; get maintainer sign-off.
- The plan needs a decision that has no record -> stop; write the ADR / BDR first.

## Amendment

Bump the version (semver), date it, note what changed in a one-line impact report.
Do not copy rules in from the sources above - link them.
