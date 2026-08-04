---
name: pre-pr-review
description: Use before pushing a branch or opening a pull request - "is this ready?", "can I push?". Runs the repo's local checks, then reads the diff as if someone else wrote it, and fixes what it finds first. A review after the push is a review of something already published.
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

2. **Check the branch shape (R23).** Three things, all from
   `git log --oneline origin/main..HEAD`:
   - it sits on current `main` - `git merge-base --is-ancestor origin/main HEAD`
     exits 0; if not, rebase (never merge `main` in);
   - no merge commit rode in - `git log --merges origin/main..HEAD` is empty;
   - every commit listed belongs to *this* PR and stands on its own. Another PR's
     commits in that range means you are stacked on its branch: rebase onto
     `main`, or land the parent first. Squash the wip/fixup noise now
     (`git rebase -i origin/main`), before review, not after.

3. **Run the repo's local checks** (whatever this repo defines - do not invent):
   format, lint, typecheck, and the unit tests the repo expects before a PR.
   That includes the repo's **full audits**, not only diff-scoped checks - in a
   repo on the standard, run the exact invocation the PR gate runs, flags
   included: `node scripts/self-verify.mjs`, `node scripts/spec-guard.mjs --base
   origin/main --block` **and** `node scripts/spec-guard.mjs --audit --block`.
   Naming `--audit` without `--block`, or dropping `--base` entirely, makes the
   local run advisory where CI is not - everything this step names can come back
   green while CI goes red on the same branch. (At core profile the shipped
   workflow template only blocks on the audit, not the base-diff check - run both
   with `--block` here anyway; a local run stricter than CI costs a moment, a
   local run looser than CI costs a red PR.)
   Fix anything red before continuing. Do not open a PR with red local checks.

4. **Independent diff review (the important part).** Review the diff as if a
   stranger wrote it - read *what the code does*, not *what you meant it to do*.
   Prefer a clean context. If your agent has a command that reviews a diff in a
   fresh sub-agent, use it; otherwise re-read the diff in a new session. What must
   not happen is reviewing it in the session that wrote it - that session already
   believes the code is right, which is the belief under test.
   Look for: correctness bugs, missing edge cases / error handling, security
   issues (injection, secrets, authz), violations of this repo's ADRs and coding
   standards, missing or stale tests, **narration comments** that restate the line
   below them, **duplication** of something the repo already has, and **scope
   creep** - changes this PR did not need.

5. **Fix findings, then re-run step 3.** Loop until clean.

6. **Only then open the PR.** Fill the PR template honestly, including ADR impact.

## What this is not

- Not a substitute for CI secret-scanning, CI review, or human review.
- Not a place to rationalize ("I know why I wrote it this way") - if the code does
  not make the intent obvious to a fresh reader, fix the code, not the review.
