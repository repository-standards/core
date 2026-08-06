# ADR-035: A maintained release line is an integration target, not a stacked branch

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-08-06 |
| **Author** | Łukasz Bodurka |
| **Tags** | git, workflow, releases, history, backports |

## Context

R23 said "Every PR MUST be based on the mainline, never on another open PR's
branch". Both halves came from the same failure - the
[stacked-PRs case study](../case-studies/stacked-prs-on-a-moving-base.md), where
work based on a branch that got rewritten at merge was stranded - and
[ADR-026](ADR-026-rebase-merge-onto-a-linear-main.md) recorded the fix. What
nobody checked at the time is that the first half is much wider than the failure
it was written for: it makes **any** base other than the mainline illegal, and
one of those bases is an ordinary security backport.

That is not a hypothetical shape. It was the single most-repeated finding of the
2026-08-04 validation round, confirmed on five independent repositories - each
of these recorded in `docs/validation/targets.json` or that round's own
observations, not gathered here:

- **odoo/odoo** - 98 branches, four supported release lines plus master.
- **openssl/openssl** - five maintained `REL` branches with a per-PR backport
  matrix, and 614 CVE references in `CHANGES.md`.
- **dotnet/runtime** - servicing branches with a written backport policy.
- **FFmpeg/FFmpeg** - a `Changelog` section per version, which is the
  `## Unreleased` idea already applied per line.
- **PowerShell/PowerShell**, opentofu and erlang - their own per-release
  composition of the changelog.

Under R23 as written, the maintainer of any of them cannot ship a CVE fix to a
supported line without breaking the standard, because the PR that carries it is
based on `3.0` and not on the mainline. R18 had the matching gap: one repo, one
`## Unreleased` heading, one slot for a fix that ships in five releases at once.
The suite recorded this as `SHAPE-06`, severity severe, and noted that
introducing release-line vocabulary is a design call rather than a mechanical
fix - which is what this record is.

The distinction the old wording missed is what makes a base safe. Another open
PR's branch is unsafe because it **will be rewritten** when it lands, stranding
whatever was built on it. A maintained release line is the opposite: long-lived,
protected, never rewritten, and it outlives the PRs based on it. Reading them as
the same thing because neither is `main` is the defect.

## Options considered

- **Leave R23 alone; treat multi-line repos as out of scope.** Cheapest, and
  defensible only if the shape were rare. Rejected on the evidence: five
  independent confirmations in one round, and a security backport is the most
  ordinary act a maintained release line exists to perform. A Layer 1 standard
  that claims to be stack- and shape-agnostic cannot make it illegal by
  accident.
- **Fix it in the method docs and leave the numbered rules untouched.** Rejected
  on the standard's own precedence rule: `SPEC.md` states that where any other
  document appears to add a requirement, the spec page wins. Guidance cannot
  legalize what a MUST forbids, so this would ship a method doc that contradicts
  the rule it explains - the exact drift the standard is loudest about.
- **Add a new numbered rule for release lines (R26).** Rejected: the defect is
  that two existing rules assume a single line, not that an obligation is
  missing. A new rule would restate R23 while R23's own "MUST be based on the
  mainline" went on forbidding what the new rule permitted, and a reader hitting
  R23 first would never reach the exception. The fix belongs where the
  assumption lives.
- **Permit any long-lived branch as a base.** Rejected as too loose - it
  re-opens the stacked-PR failure by another name. What makes a release line a
  legal base is not its lifespan: it is that the repo **declared** it as
  supported, protects it, and never rewrites it.
- **Make the support matrix machine-checkable** - release lines declared in
  `standard.manifest.json`, `self-verify` counting an undeclared one as drift.
  Rejected for now, not forever: nothing in a checkout proves which branches a
  project actually supports (a branch existing is not a branch supported), so
  the check would assert what it cannot see. R23 is already review-tier by
  ADR-026's own confirmation section; this stays there with it.

## Decision

**A repo MAY maintain more than one release line, and each maintained line is a
first-class integration target - a legal base for a PR, exactly as the mainline
is.** Three parts:

1. **What qualifies.** A maintained release line is a long-lived, protected
   branch that is never rewritten and that the repo has **declared** as
   supported, with its branching decision (R7). An undeclared branch is not a
   release line; another open PR's branch never is, whatever it is called.
2. **The rules bind it identically.** Everything R23 requires of the mainline
   binds each maintained line: one finished unit of work per PR, updated by
   rebasing onto it, never back-merged, never rewritten once anyone builds on
   it, landed by the integration method the repo recorded.
3. **Ordering and the changelog.** A fix that applies to more than one line
   lands on the mainline first and reaches each supported line as its **own** PR
   against that line - unless the mainline no longer carries the affected code,
   which the PR says. Each line carries its own changelog with its own
   `## Unreleased` heading, and a PR writes its entry under the heading on the
   branch it targets.

The ordering is the part that is a decision rather than a description. Fixing a
release line first and the mainline later, or never, is how a bug ships back to
every user on the next major - the regression-shaped failure that makes backport
policies exist. Requiring the mainline first costs the backporter a rebase and
buys the guarantee that no supported line is ahead of the mainline in known
fixes.

R25 needs no change: it is written per release, and a line's version has its own
single home on its own branch, which is what R4 asks of it.

## Consequences

- Positive: the standard can describe repos it previously made non-compliant by
  accident, and it describes them in its own vocabulary rather than as an
  exception. The backport path is now written down where a contributor looks
  (the conventions block, the decision checklist, the changelog process) instead
  of being invented per project. `SHAPE-06` closes.
- Negative / cost we accept: R23 is longer, and it now carries a conditional
  that most adopters - single-line repos, which is nearly all of them - will
  never exercise. Multi-line repos also inherit a real obligation: N supported
  lines mean N pull requests and N changelog entries for one fix, and the
  standard now says that plainly rather than letting a maintainer discover it.
  Nothing mechanical enforces the mainline-first ordering; it is review-tier,
  like the rest of R23.
- Follow-ups: repos that support more than one line record the set and the
  support window with their branching decision, and turn on the platform's
  branch protection for each line, not only for `main`.

## Confirmation

Review, plus the decision checklist's branching fork - a repo with more than one
supported line either names the lines there or has not decided. No file in a
checkout proves which branches a project supports, so `self-verify` cannot see
this one; it is judgment tier with the rest of R23, and the method's
[self-verify guide](../method/self-verify.md) says so.

## Revisit when

A platform makes the support window readable from the repo itself (a declared
support matrix, or branch protection legible to a checkout) - then the fifth
option above becomes buildable and the support set can move from review to
drift. Also revisit if a real adopting repo needs a line that is maintained but
deliberately **not** based on the mainline's history at all (a vendored fork, a
long-term-support rewrite), which this record does not cover.

## Related

R23, R18 and R7 in `standard/SPEC.md`; `standard/docs/conventions.md` (Branch
and history); [ADR-026](ADR-026-rebase-merge-onto-a-linear-main.md), which this
record extends rather than supersedes;
[ADR-018](ADR-018-history-lives-in-the-changelog.md) and the
[changelog process](../method/changelog-process.md); the `SHAPE-06` case in
[the validation suite](../validation/README.md).
