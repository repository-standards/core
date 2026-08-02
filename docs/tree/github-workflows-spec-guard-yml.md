The workflow that runs the compliance set on every pull request: `self-verify` plus both
coupling guards. This is how R16's gate actually fires.

## What it is for

**So the drift number is produced by something nobody can forget to run.** A guard that only
runs locally is a guard that runs when somebody remembers, which is not a gate.

## What it does

Checks out the branch, installs the exact Node version from `.nvmrc`, and runs the guards
the manifest declares. The coupling guard runs twice: once against the pull request's base
to catch this change, once as a full audit to catch a capability that has no map entry at
all - which the diff run structurally cannot see.

## What does not go in here

**Your build and tests.** They belong in their own workflow. Merging them means a compliance
failure and a test failure look the same in the checks list.

**Anything needing a secret.** These checks must run on a fork's pull request, or an outside
contributor cannot satisfy them.

## The thing to know before your first pull request

It runs from the moment the tree lands. If alignment is unfinished, the next pull request
goes red on the leftovers rather than on its own change. That is the intended pressure, but
it should not arrive as a surprise on somebody's unrelated commit: finish the alignment
list first, or delete the workflow until you are ready for it.

## Decisions behind it

- **`merge`, not `copy`.** Most repositories have workflows already, and this one has to
  join them rather than replace what is there.
- **Required at core.** Everything else about profiles scales with team size; the gate that
  makes the claim checkable does not, because a claim nobody checks is the thing this
  standard exists to stop.
