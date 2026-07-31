# Stacked PRs on a moving base (antipattern)

**Situation.** This very repository, mid-buildout: several substantial PRs in flight at
once - an align-engine, an adoption checkmap, a modernize skill - each building on the
previous one's branch to "save time".

**What happened.** The PRs were stacked: branch B cut from branch A, C from B. When A
was rebase-merged, B and C pointed at a base that no longer existed as history. They
"merged" into dead bases; the rebase-merge dropped the children's commits from the
mainline. Three PRs' worth of work silently vanished from `main` and had to be
recovered by hand into fresh PRs.

**The antipattern.** *Stacking on a moving base* - basing work on a branch that will be
rewritten (rebase- or squash-merged) instead of on `main`. It looks efficient exactly
until the parent lands.

**What the standard does about it.** A normative rule: **base every PR on `main`**.
When work genuinely must build on unmerged work, land the parent first, or carry the
whole sequence in one PR as ordered commits (the owner's preferred shape) - never a
chain of open PRs on each other's branches.

**Where it lives now.** R23 in [`standard/SPEC.md`](../../standard/SPEC.md), with the
mechanics in [`standard/docs/conventions.md`](../../standard/docs/conventions.md)
(Branch and history) and the reasoning in
[ADR-026](../decision-records/ADR-026-rebase-merge-onto-a-linear-main.md) - so an
adopting repo receives it, which it did not while the rule sat in this repo's own
`CONTRIBUTING.md`. This repo's own history is the receipt.
