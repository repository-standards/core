# Repositories to adopt, kept so a field run can be repeated

Every field run this project has recorded was made against a repository that no longer
exists: a clone taken for the afternoon, adopted, measured, and then gone with the
scratch directory. What the run found survives in `docs/validation/`, but nobody can
re-run it, and a finding nobody can reproduce is a claim.

These trees are the fixture side of that. They are small on purpose and deliberately not
aligned: each one has its own layout, its own conventions, and its own opinion about
where documentation lives, so the questions an adoption must ask have something real to
bite on.

| Fixture | What it is | What it is there to provoke |
|---------|-----------|------------------------------|
| `brownfield-node/` | a small Node service with tests, CI and existing docs | the layout question against a repo whose `docs/` already means something else; a `.github/` that already has a workflow to merge with |
| `brownfield-python/` | a Python package that keeps prose in `documentation/` | the same question where the answer cannot be "it already matches"; a non-Node repo, so Layer 2 must stay out of it |

## Used two ways

**Automatically**, by `tools/adoption-fixture-test.mjs`: it copies the payload into a
throwaway git repository built from each fixture and asserts what must be true of any
adopted repository - the shipped guard suite passes there, the elicitation guard refuses
an intake nobody was asked about and allows one they were, and `self-verify` reports the
drift that is genuinely still there rather than a green tick on an unfilled tree. It then
commits a ledger answering every repository-scoped point and asserts the guard suite
still passes - the state after an adoption, which neither fixture reaches on its own and
which the suite's elicitation cases once assumed away.

**By hand**, to repeat a field run:

```bash
node tools/adoption-fixture-test.mjs --materialise /tmp/field-run
```

That leaves a git repository per fixture with nothing copied into it. Point an adoption
at one of them from a checkout of this repository, let it run to the end, and compare
what it asked against `standard/.claude/elicitation/points.json`. The run is then
repeatable by anyone, which is the whole point of keeping the trees here.
