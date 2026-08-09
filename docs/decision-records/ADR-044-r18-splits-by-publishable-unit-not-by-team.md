# ADR-044: R18 splits by publishable unit, not by team

| | |
| --- | --- |
| **Status** | Accepted (2026-08-09) |
| **Date** | 2026-08-09 |
| **Author** | Łukasz Bodurka |
| **Tags** | releases, changelog, monorepo |

## Context

R18's changelog rule already splits along one axis: a repo with more than one
release line (R23 - maintained branches, backports) carries one changelog per
line. It has no answer for a different repo shape, seen directly in
`rails/rails`: thirteen gems (`activerecord`, `actionpack`, `activesupport`,
...), each independently versioned and released, each with its own
`CHANGELOG.md`, all thirteen changing together on the same branch at the same
time. Nothing here is a release-line problem - there is one branch, one
history - the split is by **which publishable unit a change belongs to**,
not by when or where it ships. Run as specified, R18 would ask this repo for
one root changelog, which is not the shape thirteen independently-versioned
gems actually need and not the shape the repo already, correctly, uses.

## The proposed fix did not survive checking

The owner's own first instinct was reuse: the standard already splits work
"per team" at the scale profile (`docs/sprints/<team>/<slug>.md`, ADR-028 +
ADR-041), so - the reasoning went - the same split should cover a changelog
per component too, one inconsistency closed by extending a mechanism that
already exists rather than inventing one.

Checked against `specs/work-sprints/spec.md` directly, this does not hold.
Sprints split **work in time**, by **team**: who is doing what, and by when -
the `docs/sprints/<team>/` layout is a scheduling artifact, scale-profile
only, explicitly out of scope for "per-item execution state" (the spec's own
words). Rails' problem is **code structure**, at every profile, present the
moment a repo ships more than one publishable unit regardless of team size -
a **solo** maintainer of a two-gem repo has this shape and no scale-profile
sprints at all. Team and component are different axes that happen to both
say "split into groups" in one sentence of English; nothing else about them
lines up. Reusing the sprint mechanism would have bound a core-profile,
structural concern to a scale-profile, scheduling one, and left a solo
two-package repo with no fix at all. This is recorded here rather than
silently substituted, because the owner asked for this specific reuse and
the honest answer is that it does not fit - not "close enough", not
"reinterpreted to fit."

## Decision

Extend R18 with a second, independent clause, parallel in shape to the
release-line clause it already has: a repo that ships more than one
independently-versioned, independently-publishable unit from the same tree
carries one changelog per unit (in that unit's own directory, `rails`'s own
pattern), each with its own Unreleased heading; a PR writes its entry under
the heading of every unit it actually touches. Same one-mechanism-never-a-
second-one rule R18 already states for release lines, applied to a second,
independent axis - not the sprint mechanism, and no new manifest schema:
self-verify does not mechanically enumerate release-line changelogs today
either (that clause is a review-time rule, not tooled), so the unit clause
gets the same treatment rather than new tooling built for this axis alone.

## Consequences

- Positive: a monorepo-of-products repo gets a rule that matches its actual
  shape instead of a root changelog nobody would maintain in practice; the
  axis is named explicitly as distinct from release lines, so a future
  reader does not conflate "which branch" with "which package."
- Negative: R18 now carries two independent splitting clauses instead of
  one, which is more to hold in mind reading the rule; neither is
  mechanically checked by `self-verify` today; a repo that happens to face
  both axes at once (multiple release lines *and* multiple units) gets no
  worked example here of how the two compose, and may need one written the
  first time a real repo needs it.

## Confirmation

`SPEC.md`'s R18 states the unit clause beside the release-line clause and
names both as distinct axes; `docs/tree/changelog-md.md` documents the
monorepo-of-products shape with a worked example.

## Related

- [ADR-028](ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md)
  and [ADR-041](ADR-041-the-bounded-period-of-work-is-called-a-sprint.md)
  (the team/sprint mechanism this ADR found does not transfer to the
  component axis, and says so directly rather than forcing the fit).
- [ADR-035](ADR-035-maintained-release-lines-are-integration-targets.md)
  (the release-line clause R18 already carries - the axis the new clause
  sits beside, not inside).
