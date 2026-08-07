The guards. Every claim this standard makes about your repository is checked by something in
here, and all of it runs on Node built-ins alone - no install step, no dependency to audit,
nothing to break when your lockfile changes.

That constraint is deliberate. A compliance tool that needs its own dependency tree is a
compliance tool that eventually cannot run, and it will be the moment you most need the
answer.

## What is in here, and what each one refuses to let you do

| script | the thing it will not let happen |
|---|---|
| `self-verify.mjs` | the repo claims to follow the standard while missing what the standard requires |
| `spec-guard.mjs` | a capability's code moves without its spec |
| `spec-structure.mjs` | a spec exists that serves nobody on the persona roster, or claims a depth it does not carry |
| `facts-check.mjs` | a fact restated in prose quietly stops agreeing with its source |
| `schema-pair.mjs` | the executable schema and its typed twin drift apart |
| `sprint-guard.mjs` | an intent sits in the pool and a sprint at the same time |
| `verifyAgentGuards.sh` | the hooks stop working and say nothing about it |

`scripts/spec/` holds the spec engine the skills invoke - the gate, the setup and the
templates.

## What it is for

**So that "we follow a standard" becomes a number.** `self-verify` reports drift: how many
required entries are unmet. Zero means compliant against the manifest, and any number above
it comes with the list. That is a claim a reviewer can check in eight seconds without
trusting anybody.

## How you actually use it

```
node scripts/self-verify.mjs
```

It exits non-zero on any failure, which is what makes it usable as a CI gate rather than as
a report somebody reads.

## What does not go in here

**Your product's tooling.** These are the standard's guards; your build scripts live
wherever your stack puts them.

**Anything with a dependency.** Node built-ins only. This is not minimalism for its own
sake - see above.

**A check that cannot explain its failure.** Every guard prints what failed and where. A
red build that does not say why gets bypassed, then permanently disabled.

## What drift 0 does not certify

Worth being blunt, because the number is the product's headline claim. `self-verify` checks
the **mechanical** tier: does the file exist, does the heading exist, does the guard pass.
It cannot check whether your decision records actually record your decisions, or whether a
spec that names a persona genuinely serves them. That is the judgment tier and it stays at
review.

Drift 0 with empty shells is a hollow win. The placeholder scan warns about it and
deliberately does **not** count it as drift, because turning judgment into an integer is
how a metric starts being gamed.

## Decisions behind it

- **[ADR-005](../decision-records/ADR-005-align-engine-is-a-manifest.md) - the manifest
  is the contract and the engine only reads it.** Hard-coding the checks was the
  alternative, and it means every new entry in the standard is an engine change, a release
  and an upgrade. Manifest content is data; only a change to how an entry is *interpreted*
  is a change to the tool.
- **Dependency-free, permanently.** A single well-chosen library would make several of
  these shorter. It would also make them installable, versioned and breakable.
- **Warnings never count as drift.** Making the placeholder scan drift-bearing was tried in
  spirit and rejected: it converts "we have not filled this in yet" into a build failure,
  and the fix people reach for is deleting the file.
