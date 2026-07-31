# Rebase-merge as the paved road

**Decided:** ADR-026 / R23 - `main` stays linear; a branch is updated by rebasing
onto its base, never by merging the base back in; a PR lands by rebase-merge,
with squash-merge as the sanctioned alternative for repos that will not hold the
per-commit hygiene bar.

**Why:** the two hard parts are not contestable - back-merges muddy history and
poison a bisect, and rewriting history someone else builds on destroys their
work. Given that, the remaining choice is what the mainline should read like,
and one-finished-unit-per-PR is the shape that stays readable at commit
resolution without asking anyone to learn `--first-parent`.

**Doubt:** rebase-merge is the most demanding of the options and it is chosen for
a standard whose adopters are often solo or small teams. Squash-merge asks
nothing of the contributor and delivers most of the benefit - a strong argument
says it, not rebase-merge, should be the default and rebase-merge the opt-in for
teams that have earned it. The costs are real too: GitHub's rebase-and-merge
mints new SHAs, drops signature verification, and lands commits in a form CI
never tested. And the option that dominates on the merits - semi-linear (rebase,
then `--no-ff`) - is excluded only because GitHub does not offer it, which is a
tooling accident, not a principle.

**A better answer would:** show adoption data. If aligned repos keep recording
"we squash" as their branching ADR, the default is wrong and should flip, with
rebase-merge demoted to the opt-in. If GitHub ships semi-linear merge, that
becomes the paved road and this entry resolves into a superseding record.
