# The repo specs its own tooling

**Decided:** `specs/` carries tree-guard, verify-engine, web-surface and
spec-engine - the buildable method dogfooded on the repo's own scripts, guarded
by spec-structure in CI.

**Why:** "follows its own rules" was a claim without an artifact; and the specs
caught their first real bug on day one - a spec illustrating a dead link with a
live dead link, which the repo's own link gate refused.

**Doubt:** specs for scripts of a few hundred readable lines risk becoming
documentation theatre; four living specs are four things that must stay true as
the tooling evolves, or the flagship example rots.

**A better answer would:** the first tooling change that lands spec-first and
catches a real contradiction - or proves the specs dead weight, which retires
them as an honest negative result in the case studies.
