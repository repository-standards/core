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

**What the standard does about it.** A hard contributing rule: **base every PR on
`main`**. When work genuinely must build on unmerged work, merge the parent first, or
carry the whole sequence in one PR as ordered commits (the owner's preferred shape) -
never a chain of open PRs on each other's branches.

**Where it lives now.** `CONTRIBUTING.md` (base-on-main + how to sequence safely);
this repo's own history is the receipt.
