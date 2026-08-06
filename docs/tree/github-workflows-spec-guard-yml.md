The workflow that runs the compliance set on every pull request **and on every push to the
default branch**: `self-verify` plus both coupling guards. This is how R16's gate actually
fires.

## What it is for

**So the drift number is produced by something nobody can forget to run.** A guard that only
runs locally is a guard that runs when somebody remembers, which is not a gate.

## What it does

Checks out the branch, installs the exact Node version from `.nvmrc`, and runs the guards
the manifest declares. The coupling guard runs twice: once against the pull request's base
to catch this change, once as a full audit to catch a capability that has no map entry at
all - which the diff run structurally cannot see.

**On a push there is no base branch**, so the checks that need two sides adapt rather than
break: the structure guard reads the whole tree instead of a diff, and the coupling guard
diffs against the commit the branch was at - unless there is none (the first push) or it no
longer exists (after a force-push), in which case it says so and the full-tree audit is the
gate. `self-verify` and the audit need no diff at all, which is why a first push is checked
rather than waved through. The push trigger is what makes "gated from the first push" a true
statement: a `pull_request`-only workflow never runs on a direct push to the default branch,
including the very first one, when a repository has no pull requests and every file in it is
arriving unchecked.

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
- **`on.push` is a declared key**, so a merge that keeps the repo's own `pull_request`-only
  trigger is drift rather than a file that is present and asleep. A repo that genuinely
  cannot run it on pushes records that as an exception, which is a decision somebody made
  rather than a gap nobody sees.
