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

It is **manifest-driven** (ADR-005). It reads [`standard.manifest.json`](../standard.manifest.json)
- the standard describing itself at the pinned version - and checks the repo against every
entry, reporting **drift** as a number (how many required entries are unmet; `drift 0` =
compliant). Without a manifest it falls back to a built-in skeleton, so it still works on
repos that predate ADR-005.

It checks:

- **Version pin** - `.standards-version` exists and is well-formed (`x.y.z`); with
  `--version <target>` it must equal that target (used right after an update to confirm
  the bump landed); and it must equal the manifest's `version` (a repo pinned to X carries
  manifest X).
- **Files** - every `required` manifest file (or one of its `altPaths`) exists.
- **Sections** - every required section heading is present in its file (e.g. `AGENTS.md`
  must state `Altitude`).
- **Static guards** - each manifest guard with `kind: static` passes (e.g.
  `scripts/spec-structure.mjs`, `scripts/schema-pair.mjs`); `self-verify` skips itself
  to avoid recursion. A guard whose subject is absent - no `database/schema/`, say -
  reports that and passes; R24 binds repos that own a database.

The code<->spec **coupling** guard (`scripts/spec-guard.mjs`, `kind: diff`) runs in CI on
the PR diff rather than in this static check - but it is part of the same gate.

**Layer 2 - the stack manifest.** If a `stack.manifest.json` sits beside the core
manifest, the repo also carries a technology layer: `self-verify` merges the stack's
entries in and counts **one drift number across both layers**. The stack file links the
repo to its stack by the registry pointer - never by a core version (ADR-022 in the
standard repo); the picks' rationale lives in the stack repo's DECISIONS.

**Which rules the number covers.** The drift number is exactly the manifest: file
presence, required sections, static guards, plus the structure guard's checks (spec
layout, personas named, no committed scaffolding warned). Rules about *conduct* - the
same-PR spec coupling outside CI, plan/tasks removal at close, buildable substance,
supersede-not-edit, cooldown discipline - are review-verified: honestly outside the
number, listed in the judgment tier below. A repo can be drift 0 and still sloppy at
review; the number is the floor, not the ceiling.

**Drift as a number.** Each unmet required check scores one, so `drift N` is a measurable
distance from the pinned version - a fleet owner can sort repos by it, and an update's job
is to drive it back to `0`. Mostly that is one point per manifest entry, with one deliberate
exception: a missing `.standards-version` scores **two**, once as the version pin and once
as the required file. That is not double counting by accident - a repo with no pin has both
failed to record which version it follows and failed to carry the file that says so, and it
is the single most consequential thing that can be absent. Comparing two repos' numbers is
still sound; reading a number as "exactly N missing files" is not.

## Judgment tier - confirmed at review

A machine cannot (yet) decide these; they are checked when the PR is reviewed:

- **Decisions recorded** - the forks in the standard's
  [decision checklist](https://github.com/bodurkalukasz/repository-standards/blob/main/docs/method/checklist.md)
  (adopted by reference from the living standard - always latest) that apply to this repo are recorded as
  ADR/BDR, or consciously deferred as a backlog item - not silently undecided.
- **Specs buildable where it counts** - each mapped capability has a
  [spec](../specs/README.md); money / security / data / external-contract paths are
  buildable, not merely described.
- **No unrecorded drift** - no known spec<->code contradiction is left unresolved.

## Staying current - the pin is a bookmark, not a lock

The pin records the state this repo last aligned to. The target of every update is
**latest** (ADR-025), so a repo does not need to be told which version it may use - it
needs to be told that a newer one exists. Two ways to get that signal, both
notifications, neither of them a gate:

**The shipped watch workflow.** Enable
[`.github/workflows/standards-update-watch.yml`](../.github/workflows/standards-update-watch.yml).
Weekly, it compares `.standards-version` against the standard's newest release and
opens **one issue per target version** - not one per week - saying what to say to take
the update. Before the standard publishes its first release the job says so and exits
green; a watch installed early is not an error. It never edits the pin: an alignment
that happens while nobody is looking is not an alignment.

**Renovate, if the repo already runs it.** A custom manager treats the pin like any
other dependency, so the proposal arrives in the same place as every other bump:

```json
{
  "customManagers": [
    {
      "customType": "regex",
      "managerFilePatterns": ["/^\\.standards-version$/"],
      "matchStrings": ["^(?<currentValue>\\d+\\.\\d+\\.\\d+)"],
      "depNameTemplate": "bodurkalukasz/repository-standards",
      "datasourceTemplate": "github-releases",
      "versioningTemplate": "semver"
    }
  ]
}
```

(Older Renovate calls `managerFilePatterns` `fileMatch`.)

Know what that PR is: **a proposal, and only half the work.** Merging a pin bump on its
own leaves the repo red on purpose - self-verify requires the manifest copy to match
the pin, and the manifest arrives with the update. Take the PR as the reminder, run
`update-to-version`, and let the same PR carry the delta.

## When it fails

A red self-verify is a compliance failure, not a warning to defer:

- Missing `.standards-version` -> the repo was never aligned; run `align-to-standards`.
- Version mismatch after an update -> the bump did not land; finish `update-to-version`.
- A guard failure -> fix the structure/coupling before merging.
- A judgment-tier gap -> record the decision, deepen the spec, or file the backlog item.

The mechanical gate belongs in CI so "compliant with the standard" is an assertion the
pipeline makes, not a claim a human remembers to check.
