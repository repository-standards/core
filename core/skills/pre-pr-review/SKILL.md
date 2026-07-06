---
name: pre-pr-review
description: Self-review the current branch diff in a clean, independent pass before opening a PR - run local quality checks, then review the diff as if you did not write it, and fix findings first.
disable-model-invocation: true
---

# Pre-PR review

Run this before opening a pull request. Goal: catch the obvious defects locally,
cheaply, in a fresh perspective - so the PR that reviewers (human or CI) see is
already clean.

This does NOT replace an independent CI review: it shares the author's blind
spots and only fires when an agent that ran this skill opens the PR. Its value is
tightening the loop early, not being the gate. (The gate is CI + human review.)

## Steps

1. **Scope the change.** `git fetch origin` then look at the full diff against the
   base branch: `git diff origin/main...HEAD`. Know exactly what you are shipping.

2. **Run the repo's local checks** (whatever this repo defines - do not invent):
   format, lint, typecheck, and the unit tests the repo expects before a PR.
   Fix anything red before continuing. Do not open a PR with red local checks.

3. **Independent diff review (the important part).** Review the diff as if a
   stranger wrote it - read *what the code does*, not *what you meant it to do*.
   Prefer a clean context: run `/code-review` (which reviews the diff in a fresh
   sub-agent) rather than eyeballing it in the same session that wrote it. For a
   deeper multi-model pass use `/code-review ultra`.
   Look for: correctness bugs, missing edge cases / error handling, security
   issues (injection, secrets, authz), violations of this repo's ADRs and coding
   standards, and missing/stale tests.

4. **Fix findings, then re-run step 2.** Loop until clean.

5. **Only then open the PR.** Fill the PR template honestly, including ADR impact.

## What this is not

- Not a substitute for CI secret-scanning, CI review, or human review.
- Not a place to rationalize ("I know why I wrote it this way") - if the code does
  not make the intent obvious to a fresh reader, fix the code, not the review.
