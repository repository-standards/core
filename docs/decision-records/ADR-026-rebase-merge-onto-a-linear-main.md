# ADR-026: Rebase-merge onto a linear `main`

| | |
| --- | --- |
| **Status** | Accepted; the base-on-the-mainline clause narrowed by [ADR-033](ADR-033-maintained-release-lines-are-integration-targets.md) - a declared, never-rewritten release line is a legal base too |
| **Date** | 2026-07-31 |
| **Author** | Łukasz Bodurka |
| **Tags** | git, workflow, contribution, history |

## Context

The standard said how work is specified, decided, reviewed and released - and
nothing about how it reaches `main`. That gap is not academic: this repo lost
three PRs' worth of work to it (the
[stacked-PRs case study](../case-studies/stacked-prs-on-a-moving-base.md)), and
the base-on-main rule written afterwards landed only in this repo's own
`CONTRIBUTING.md` - a client adopting the standard never received it.

Rebase-vs-merge is the textbook re-litigable choice, so before writing a rule
the claim was tested against the evidence. Two parts hold unconditionally:

- **Back-merging the base into a branch is bad practice.** The kernel's
  maintainer guidance is explicit that it muddies the development history,
  imports unrelated breakage into anyone's bisect, and invalidates the testing
  the branch had already earned
  ([rebasing-and-merging](https://docs.kernel.org/maintainer/rebasing-and-merging.html)).
- **Rewriting history others build on is destructive.** Git's own Golden Rule:
  do not rebase commits that exist outside your repository and that people may
  have based work on
  ([Pro Git, The Perils of Rebasing](https://git-scm.com/book/en/v2/Git-Branching-Rebasing)).

One part does **not** hold as usually stated: "merge commits are an
antipattern". A merge commit at *integration* time is a legitimate shape - the
kernel takes them by design, and `git log --first-parent` / `git bisect
--first-parent` read that history perfectly well. What is actually harmful is
the braid that repeated back-merges produce, not the merge commit itself. So
the rule has to ban the braid and the stranded base, and pick an integration
method deliberately rather than declare a whole Git feature forbidden.

## Options considered

- **Merge commit (`--no-ff`) as the default.** What lands is exactly what CI
  tested, PR boundaries stay visible forever, `--first-parent` gives a readable
  log. Rejected as the default: it reads well only with discipline most repos
  do not hold, and it normalizes back-merging - the actual failure mode.
- **Squash-merge everything.** One commit per PR, no hygiene demand on the
  contributor, trivial revert. **Kept as the sanctioned alternative, not the
  default:** it discards a well-built sequence (the refactor separated from the
  behavior change it enables), coarsens `git bisect` to whole PRs, and buries
  authorship inside one squashed commit.
- **Semi-linear (rebase, then `--no-ff`).** Linear reading plus one merge commit
  per PR - genuinely the best of both, and shipped by GitLab and Azure DevOps.
  Rejected on availability only: GitHub does not implement it, and GitHub is
  the standard's paved-road platform.
- **Rebase-merge with an explicit commit-hygiene bar.** Chosen.

## Decision

**The fork this record settles is the integration method: rebase-merge onto a
linear `main`, with squash-merge as the sanctioned alternative.** Rebase-merge
publishes every commit, so it is conditional - each commit must be complete,
buildable and reviewed on its own. A repo that will not hold that bar uses
squash-merge and records that as its branching decision. Both are compliant;
drifting between them per-PR is not.

The rest of R23 is deliberately **not** decided here, because none of it is a
live fork: rebasing onto the base instead of back-merging it, basing every PR on
the mainline, and never rewriting a branch someone else builds on are settled
practice whose alternative is simply wrong. Those are **rules**, with their why
inline, in `standard/docs/conventions.md` (merged into each repo's `AGENTS.md` at
adoption) - normative because R23 says so, not because this record chose them.
They are named here only so nobody reopens them as though they were options.

## Consequences

- Positive: `main` is a sequence of finished units - readable, bisectable at
  commit resolution, revertable one change at a time. The class of failure that
  cost this repo three PRs is now illegal by construction: no stacking on a base
  that will be rewritten. The rule finally *ships* instead of living in one
  repo's contributing file.
- Negative / cost we accept: GitHub's rebase-and-merge mints new SHAs and always
  rewrites committer information, so signatures do not survive it and the
  commits that land were never tested in exactly that form - a merge queue is
  the mitigation where that matters. Force-push discipline becomes load-bearing,
  which is why "never rewrite a branch others build on" is a red flag, not a
  guideline. The hygiene bar is real work; a team that only pretends to hold it
  publishes `fix test` onto `main`, which is worse than squashing honestly.
- Follow-ups: adopting repos turn on the platform's linear-history protection
  and set the merge button to match their recorded choice; the shipped PR
  template now carries the check.

## Confirmation

Review, the shipped PR template's checkbox, and the platform's require-linear-
history branch protection. No file in the repo proves a merge-button setting, so
`self-verify` cannot see this one: R23 is a review-tier rule, like the rules
about how documents are written.

## Revisit when

GitHub ships semi-linear merge (rebase then `--no-ff`), or a context arrives
where what ships must be the exact commit CI tested - then a merge queue, or
merge commits read with `--first-parent`, wins on that repo's own record.

## Related

R23 and R7 in `standard/SPEC.md`; `standard/docs/conventions.md` (Branch and
history); [the stacked-PRs case study](../case-studies/stacked-prs-on-a-moving-base.md);
[the open question](../open-questions/rebase-merge.md) this decision is held
open against; ADR-001 (records policy).
