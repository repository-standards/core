The whole standard as numbered rules, on one page. Every rule is a MUST, SHOULD or MAY,
and every other file in the tree exists because one of them says so.

This is the normative text. When a doc, a guard and this page disagree, this page wins, and
the other two are the bug.

## What it is for

**So that "we follow a standard" points at something specific.** R11, R21, R24 are
addresses. A reviewer can check a claim against a rule instead of against a feeling, and an
argument about whether something is required has a place to be settled.

It also makes the standard **auditable in one sitting**. A methodology spread across twenty
documents cannot be read end to end, so nobody does, and it becomes whatever the last
person remembered.

## How to read a rule

Each one carries its obligation level and, where it matters, its escape hatch:

```markdown
- **R21.** Everything a repo consumes MUST be pinned exact and move only by an
  explicit, reviewed diff: dependency manifests and overrides carry exact versions
  (no ranges), sealed by a committed lockfile; container images, CI runners and
  actions name an exact version or digest - never `latest`, never a floating tag.
  A new version SHOULD clear a release-age cooldown (the paved road is seven days)
  before adoption; a critical security fix MAY bypass the cooldown through a
  recorded, temporary exclusion.
```

MUST is compliance. SHOULD is the paved road you can leave with a recorded reason. MAY is
genuinely yours. The escape hatch is written **into** the rule rather than left implicit,
because an unstated exception gets taken silently.

## What does not go in here

**Anything technology-specific.** Layer 1 is stack-agnostic by rule. Whether you use Vitest
or pytest is the stack layer's business, and a rule naming a tool would make the standard
untrue for half its adopters within a year.

**Explanation.** A rule says what must hold. Why it holds that way is a decision record,
and how to do it is the method. Mixing them makes the page unreadable at exactly the moment
somebody needs to check one line.

**Counts of itself.** The number of rules is not written down anywhere, and `tree-check`
fails a surface that hand-writes it. "Twenty rules" outlived the twenty-first by weeks.

## How it connects to everything else

`standard.manifest.json` is this page's machine-readable projection: every entry names the
rule it enforces, and `self-verify` checks the entries. So a rule here becomes a manifest
entry, becomes a check, becomes a number.

That chain is the product. A rule with no manifest entry is advice; an entry with no rule is
a check nobody can justify.

## Decisions behind it

- **One page, numbered.** The alternative is a folder of rule documents, which is what most
  standards are, and it removes the one property that makes this auditable: you can read it
  all before deciding whether to adopt it.
- **Rules are stable identifiers.** They are never renumbered. A rule that goes away leaves
  its number retired rather than letting R14 mean something new to a repo that cited it.
- **Obligation levels are explicit.** Prose standards blur MUST and SHOULD, which means
  every requirement is negotiable in practice and none of them are checkable.
