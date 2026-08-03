# Is conformance a threshold, or a percentage?

**Status:** open
**Opened:** 2026-08-03

## The question

The spec is written in MUST and SHOULD, which reads as a threshold: a repository either
conforms or it does not. The tooling says something else - `self-verify` reports **drift as
a number**, the manifest marks entries `required` or not, and profiles already say that not
everything applies to everyone.

So which is it? If the honest answer is "nothing is universally required, a repository is
some percentage adapted", then the MUST language is describing a bar that does not exist.

## Why it is not obvious

**The percentage needs a denominator.** Sixty percent of what? If the answer is "of what
applies to this repository", then something has to decide what applies - and that is either
a judgment (in which case the number is a self-assessment) or a rule (in which case MUSTs are
back, scoped to applicability).

**A number without a bar does not act on anyone.** "You are at 62%" is a dashboard. "This
capability spec names no persona and the guard fails" is a change somebody makes. Part of
what makes drift useful today is that individual items are binary even though the total is
a count.

**Degrees are already partly built**, which is the strongest argument that the framing is
what is out of date rather than the mechanism: `core|scale` profiles, per-entry `required`,
`adapt` classes of copy and merge, and R7 as it now stands - decide the areas that apply,
say so once for the areas that do not.

## What would settle it

A repository adopting partially on purpose, and reporting whether the number or the failures
is what actually changed their behaviour. If it is the number, the threshold framing is
ceremony. If it is the failures, the percentage is a summary of them and not a replacement.

## Related

- [ADR-011](../decision-records/ADR-011-one-standard-two-profiles.md) - profiles, the first
  admission that not everything applies to everyone.
- [ADR-025](../decision-records/ADR-025-the-standard-is-living-latest-is-the-target.md) -
  latest is the only target, which already removed one kind of threshold.
