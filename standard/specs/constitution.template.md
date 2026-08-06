# <Repo> constitution (Spec Kit governance bridge)

**Version:** 1.0.0 | **Ratified:** YYYY-MM-DD | **Last amended:** YYYY-MM-DD

> A BRIDGE, not a second rulebook. It does not restate conventions - it points the
> Spec Kit Constitution Check at the real sources and hard-stops on conflict.

## The check (runs at /spec-plan, and at /spec-update)

A change passes only if it is consistent with, in altitude order:

1. `PRINCIPLES.md`
2. Accepted ADR / BDR (the relevant ones - not all of them)
3. The affected capability specs (`specs/<capability>/`) + `ARCHITECTURE.md` +
   `conventions`
4. `AGENTS.md` conventions and red-flags

## Hard stops

- The change contradicts an Accepted ADR **or BDR** -> stop; propose a superseding record
  first. Both streams are in the altitude list above and both bind; naming only one here
  reads as though the product-side stream is advisory.
- The change trips an `AGENTS.md` red flag -> stop; get maintainer sign-off.
- The change needs a decision that has no record -> stop; write the ADR / BDR first.

## Amendment

Bump the version (semver), date it, note what changed in a one-line impact report.
Do not copy rules in from the sources above - link them.
