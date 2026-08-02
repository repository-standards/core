The jobs that run on every pull request and every push, and turn "we follow a standard"
into a number a reviewer can see without trusting anyone.

## What is in here

`spec-guard.yml` wires the compliance run: self-verify plus the coupling guards, on every
pull request. `gitleaks.yml` scans for secrets on every push to the mainline.
`standards-update-watch.yml` runs weekly and opens one issue when a newer standard exists -
it never edits your recorded state, because deciding to move is yours.

## The rule that is not stylistic

**Every `uses:` names a full 40-character commit SHA, every runner a fixed version, every
Node version exact.**

```yaml
- uses: actions/checkout@93cb6efe18208431cddfb8368fd83d5badbf9bfd
- uses: actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444
  with:
    node-version: "24.18.0"
```

A tag is mutable. `@v4` today and `@v4` next month can be different code, which means the
pipeline guarding your repository can change under you with no diff to review. That is the
supply-chain problem R21 exists to prevent, and `tree-check` fails on a loose pin rather
than warning about it.

## What does not go in here

**Your build and test pipeline.** It belongs beside these, not inside them. The standard
asks that the guards run; it has no opinion about the rest.

**Anything needing a secret to decide compliance.** A gate a fork cannot run is a gate an
outside contributor cannot satisfy, which quietly turns your project into one only
maintainers can contribute to.

**A job nobody can explain.** When you add one, say in the pull request why the check earns
its runtime. Unexplained jobs get skipped under deadline, and the skip is permanent.

## Decisions behind it

- **They arrive live, not commented out.** Shipping them inert is friendlier for exactly one
  pull request and produces repositories that carry the files and none of the enforcement,
  which from the outside is indistinguishable from compliance.
- **No exception for trusted publishers.** "Trusted" describes an account, not a future
  commit.
