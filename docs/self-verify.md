# Self-verify - proving a repo complies with its pinned standard

A repo that follows repository-standards is pinned to a version in **`.standards-version`**.
Self-verify is how it proves it actually meets that version - the **"verify"** step that
runs after adopting the standard (`align-to-standards`), after updating it
(`update-to-version`), and in CI on every PR. Same pass/fail each time.

Verification has two tiers: a **mechanical** tier that a machine asserts, and a
**judgment** tier a human confirms at review. Do not pretend the judgment tier is
mechanical - but do not let the mechanical tier depend on a human either.

## Mechanical tier - the hard gate

Run the shipped checker; it exits non-zero on any failure, so CI can gate on it:

```
node scripts/self-verify.mjs                  # gate: exit 1 on any failure
node scripts/self-verify.mjs --version 0.7.2  # also assert the pinned version matches
node scripts/self-verify.mjs --warn           # report only (local, non-gating)
```

It checks:

- **Version pin** - `.standards-version` exists and is well-formed (`x.y.z`); with
  `--version <target>` it must equal that target (used right after an update to confirm
  the bump landed).
- **Skeleton** - the core artifacts exist: `AGENTS.md`, `specs/`, the
  `decision-records`, and a backlog.
- **Structure guard** - `scripts/spec-structure.mjs` passes (no ticket-numbered spec
  paths), when installed.

The code<->spec **coupling** guard (`scripts/spec-guard.mjs`) is diff-based, so it runs
in CI on the PR diff rather than in this static check - but it is part of the same gate.

## Judgment tier - confirmed at review

A machine cannot (yet) decide these; they are checked when the PR is reviewed:

- **Decisions recorded** - the forks in the [decision catalog](decision-records/catalog.md)
  that apply to this repo are recorded as ADR/BDR, or consciously deferred as a backlog
  item - not silently undecided.
- **Specs buildable where it counts** - each mapped capability has a
  [spec](../specs/README.md); money / security / data / external-contract paths are
  buildable, not merely described.
- **No unrecorded drift** - no known spec<->code contradiction is left unresolved.

## When it fails

A red self-verify is a compliance failure, not a warning to defer:

- Missing `.standards-version` -> the repo was never aligned; run `align-to-standards`.
- Version mismatch after an update -> the bump did not land; finish `update-to-version`.
- A guard failure -> fix the structure/coupling before merging.
- A judgment-tier gap -> record the decision, deepen the spec, or file the backlog item.

The mechanical gate belongs in CI so "compliant with the standard" is an assertion the
pipeline makes, not a claim a human remembers to check.
