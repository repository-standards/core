The workflows that turn compliance into a number a reviewer can see, plus the pull request
template that puts them in front of one.

**These arrive live.** Not dormant, not examples. `spec-guard.yml` runs on every pull
request, the secret scan on every push to the mainline, the update watch on a weekly cron.
The first pull request after adoption goes red until the alignment checklist is finished -
that is the intended pressure, but it should not arrive as a surprise on somebody's
unrelated change. Do the list first, or delete these files until you are ready for them.

## What goes in here

CI that asserts something the standard requires: the guards, the secret scan, the
spec-to-code coupling check. Plus the pull request template.

Every `uses:` names a **full 40-character commit SHA**, every runner a fixed version, every
Node version exact:

```yaml
- uses: actions/checkout@93cb6efe18208431cddfb8368fd83d5badbf9bfd
- uses: actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444
  with:
    node-version: "24.18.0"
```

Not a floating tag, not `-latest`. This is R21 and it is not a style preference: a mutable
reference means the pipeline guarding your repository can change under you without a diff,
which is exactly the supply-chain problem the rule exists to prevent. `tree-check` fails on
a loose pin.

## What does not go in here

**Your product's build and test pipeline.** That is yours. It belongs beside these, not
inside them, and the standard has no opinion about it beyond asking that the guards run
too.

**Anything that needs a secret to decide whether the repo complies.** A gate a fork cannot
run is a gate contributors cannot satisfy, so it becomes a gate only maintainers can clear.

## When you add a workflow

Pin it, and say in the pull request why the check earns its runtime. A job nobody can
explain is one somebody eventually skips, and the skip is permanent.

## Decisions behind it

- **The workflows ship live rather than as examples.** Shipping them commented out was the
  friendlier option and it produces repos that have the files and none of the enforcement,
  which reads as compliance from the outside.
- **Exact pins everywhere, no exceptions for trusted publishers.** "Trusted" is a property
  of an account, not of a future commit.
- **In this repository they are deliberately inert.** A workflow that ran in the repo that
  publishes it would be testing the wrong tree - the standard's own checks live outside the
  shipped tree, and `tree-check` enforces the separation.
