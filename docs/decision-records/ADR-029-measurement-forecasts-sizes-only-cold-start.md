# ADR-029: Measurement forecasts the work; sizes only cover the cold start

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-08-02 |
| **Author** | bodurkalukasz |
| **Superseded by** | - |

## Context

[ADR-028](ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md) put cycles in the
repo and left one question open: how a team answers *will this fit before the date*.

The default answer in the industry is estimation - story points, planning poker, velocity as
a commitment. It was a reasonable answer when it was designed: points were a proxy for time
under uncertainty, calibrated by a stable team's observed throughput. Two things have broken
that calibration.

**The throughput base is no longer stable.** With an agent in the loop, the same nominal
"three-pointer" is twenty minutes when the first attempt lands and two days when it does not.
The variance is no longer a property of the item, so a number attached to the item stops
carrying information while still costing a meeting to produce.

**The number gets spent.** Points are summed into a velocity, velocity becomes a commitment,
and the commitment becomes the thing being managed instead of the work. This is the failure
mode the practice is best known for, and it follows mechanically from the numbers being
summable.

Meanwhile the repo already measures the thing estimation was approximating: a cycle file
carries its `Opened` and `Target` dates and `cycle-close` records what actually finished, so
the real distribution of how long items take is recoverable from history without anyone
guessing anything.

The remaining problem is the **cold start**. A repo with no closed cycles has no measured
distribution, and `timeline-update` correctly refuses to project below three of them - which
leaves a brand-new team with nothing at all to reason with in exactly the window where they
are deciding what to pull.

## Options considered

- **A - Story points.** Summable, familiar, tooling everywhere. Rejected: the calibration
  base does not hold, and summability is what turns the estimate into a commitment.
- **B - No estimates at all; forecast only from measured history.** Honest and simple, and
  correct once history exists. Rejected on its own because it answers nothing during the cold
  start, and "we cannot say yet" for a team's first three cycles is a real cost, not a
  principled abstention.
- **C - T-shirt sizes as a cold-start estimate, superseded by measurement.** Chosen. A coarse
  `S`/`M`/`L` that resists arithmetic by construction, used for splitting and for the first
  three cycles, and dropped from any projection the moment measured cycles exist.
- **D - Sizes permanently, alongside measurement.** Rejected: two forecasting inputs live at
  once is precisely how a size gets quietly mapped to a number (`S`=1, `M`=3, `L`=5) and
  becomes the currency again. There must be no moment when both count.

## Decision

**Measurement is the forecast. `size` is an optional cold-start estimate and an informational
field, and it is never an input to a projection once measured cycles exist.**

Concretely:

- `size` is `S`, `M` or `L`, optional, and lives on backlog and cycle rows.
- Its standing use is a **splitting trigger**: an `L` means split this before pulling it.
- Below three closed cycles, `timeline-update` may reason from sizes and **must say that it
  is doing so**, and that the result is an estimate rather than a measurement.
- At three closed cycles and above, the projection comes from measured item durations and
  sizes are ignored by it entirely. There is no blended mode.
- Sizes are **never summed**, never converted to numbers, and never charted.
- An item that does not finish inside its cycle is **split, not re-sized**. This is what keeps
  item counts comparable without a currency, and it replaces re-estimation.

## Consequences

- A team gets a usable answer from day one and a trustworthy one from cycle four, with an
  explicit, dated handover between them rather than a gradual slide.
- The forecast improves on its own as history accumulates, with nobody maintaining it.
- **The cost:** the first three cycles are projected from guesses, and will sometimes be
  wrong. The mitigation is that the skill says so in the output, so a reader knows which kind
  of number they are looking at.
- **A second cost, accepted:** a team that wants burndown charts, velocity trends or time
  tracking will not find them here, and this standard is not where that argument gets
  reopened - those live in a tracker if a team wants them (ADR-010).
- Item counts assume items are roughly comparable, which is only true because of the
  split-do-not-resize rule. If that rule is not followed, throughput numbers degrade quietly.

## Confirmation

Partly mechanical, partly not, and the split is worth being honest about.

`cycle-guard` checks the `blocked:<id>` references that came in with this change - that a
block names an intent which exists, is not the row itself, and is not already done. That is
checked on every run.

**The exclusions in this record are not enforced by a script.** Nothing stops a team adding a
points column or summing sizes; the guard would not notice. They are enforced by review and by
this record being the thing a reviewer can point at. A guard that tried to detect "this
markdown column is being used as a currency" would be guessing.

## Revisit when

A team runs four or more cycles and reports that the measured projection is *less* useful to
them than sizes were - which would mean the measurement is capturing the wrong thing, and is
the one observation that should reopen this. Absent that, accumulating history strengthens
the decision rather than weakening it.

## Related

- [ADR-028](ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md) - cycles in the
  repo; this answers the forecasting question it left open.
- [ADR-010](ADR-010-artifact-lifecycle-and-tracker.md) - where per-item execution history
  lives, and why charts are not this standard's job.
- `timeline-update`, `cycle-open`, `cycle-close` - the skills that implement this.
