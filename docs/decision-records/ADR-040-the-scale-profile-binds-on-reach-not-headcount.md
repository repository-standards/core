# ADR-040: The scale profile binds on reach, not on headcount

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-08-07 |
| **Author** | bodurkalukasz |
| **Decided by** | the author |
| **Tags** | profiles, adoption, manifest, solo |

## Context

[ADR-011](ADR-011-one-standard-two-profiles.md) settled the mechanism - a `profile` field
per manifest entry, `self-verify --profile core|scale`, views rendered from the manifest
rather than hand-maintained - and it settled the principle: core keeps knowledge alive,
scale coordinates people. It did not settle the trigger. The sentence that actually reaches
an adopter was written later, in the profile picker
([`adoption.md`](../method/adoption.md)) and repeated in the [FAQ](../faq.md):

> Start `core`, flip to `scale` when the second regular contributor arrives.

**The trigger and the record name different populations.** ADR-011 frames core as "every
repo, even one person" and scale as "teams / enterprise", under the owner's constraint that
"a solo adopter must not be asked to carry enterprise ceremony". A headcount trigger set at
two makes a pair of developers the enterprise. Nothing on the scale list is what the second
pair of hands changes: two people at one desk do not need a tracker bridge to know what the
other is doing, curated release notes to tell each other what shipped, or a UX research
cadence to agree who they are building for.

**And the discount the picker promises is not the discount the manifest gives.** Measured
on this tree, by the tool's own count: `--profile scale` checks 91 entries, `--profile core`
checks 82, and self-verify prints `9 scale-only entries skipped (--profile core)`. In
`SPEC.md`, only R11's blocking coupling guard and R16's `spec-guard` step carry a
*(scale)* marker. Choosing core discounts roughly a tenth of the tree and two clauses.

Worse, most of what the picker names is not in that tenth:

- **CI is described backwards.** The picker says core runs its guards "locally/pre-commit"
  and ADR-011 says the same in parentheses. `.github/workflows/spec-guard.yml` is a
  **required entry at the core profile** (R16), R16 puts `self-verify` and `spec-structure`
  in CI for every repo with only `spec-guard` marked *(scale)*, and the shipped workflow
  agrees with the rule rather than with the picker - it runs the coupling guard advisory at
  core and blocking at scale, and the full-tree coupling audit blocking at every profile. A
  solo adopter who reads the picker, skips CI and expects drift 0 gets drift 1 on a required
  entry, and finds out from a red pull request.
- **Personas and architecture are core entries.** `docs/personas.md` (R10) and
  `docs/ARCHITECTURE.md` are required at both profiles. "Full persona roster" and "C4
  discipline" are how much gets written in a file the repo carries either way - a judgment
  nothing measures, offered as though it were a flag.
- **Two of the named discounts were never charged.** The tracker bridge is required at no
  profile: [ADR-032](ADR-032-re-entry-is-core-tracker-sync-is-an-extension.md) made it an
  optional per-capability sidecar that core never reads and whose absence is never drift.
  Release-notes curation has no manifest entry at any profile.

What the nine entries actually are: `CONTRIBUTING.md`, `.github/pull_request_template.md`,
`docs/analytics.md`, `docs/journeys`, `docs/research`, `docs/cycles`,
`scripts/cycle-guard.mjs`, and the `spec-guard` and `cycle-guard` guards. Read as a set they
are contribution mechanics for people who cannot be told them in person, research about
users nobody in the repo is, and work cycles for a team that has to agree what it committed
to ([ADR-028](ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md)). Not one of
them is triggered by a second pair of hands. Every one is triggered by somebody who is not
in the room.

The field runs confirm the trigger has never been exercised anywhere near its own boundary.
Every adoption inferred the profile from committer counts, and the smallest team any run in
the suite records is 38 authors. Nothing has ever been adopted at two to five people, which
is precisely the range the binary decides hardest.

## Options considered

- **A - Keep headcount, move the number.** Flip at three, or five. Cheapest possible
  change. Rejected: an arbitrary threshold is still the wrong variable, and it fails in both
  directions at once - a solo library with ten thousand users needs curated notes and a
  co-located team of four needs none of the scale set. Moving the number relabels the error.
- **B - A third profile for small teams.** ADR-011's own "Revisit when" anticipates a third
  profile, but for a different audience (a regulated `audit` tier). Splitting a nine-entry
  difference into two smaller differences makes every future entry classify itself three
  ways, and it answers a granularity complaint with more granularity. Rejected.
- **C - Retrigger on reach, and state the measured discount instead of an impression of
  it.** Chosen. The trigger names what each scale artifact was built for; the picker says
  what the flag does and does not change, so the choice is made against the mechanism rather
  than against a summary of it.

## Decision

**ADR-011's mechanism is untouched** - the per-entry `profile` field, `--profile core|scale`,
rendered views, the flag-plus-delta upgrade. Its principle is kept and its second half is
made specific:

> **Core is whatever keeps knowledge alive; scale is whatever carries it to someone who is
> not in the room.**

**The trigger is a set of conditions, and headcount is not one of them.** Any one of these
is enough to be `scale`:

- work is handed off **asynchronously** - somebody picks a piece up without the person who
  wrote it being reachable to explain it;
- somebody contributes from **outside the conversation** - an outside contributor, a
  rotating team, a vendor, a maintainer who arrives after everyone here has gone;
- somebody **outside the repo reads execution state** - a stakeholder who follows a board
  rather than a backlog;
- the repo has a **release audience that is not its authors**;
- it is designed for **users nobody here is**.

Two people at one desk shipping to each other are `core`, and compliant. One person shipping
a library to ten thousand strangers meets the release-audience condition and is not.

**The picker states the measured discount.** It names the nine entries rather than
characterising them, and it says plainly what the flag does *not* change: CI is required at
core, personas and architecture are core entries whose depth is a judgment, and the tracker
bridge and release-notes curation are required at no profile.

**The 2-5 range gets a route, not a profile.** There is no third profile and there will not
be one for team size. A repo whose answers land between the two picks the route that leaves
a record, both already in the mechanism:

- **declare `scale` and except the documents it does not carry** - each in the manifest's
  `exceptions` with a reason, which self-verify reports as excepted rather than drift and
  keeps in the adoption denominator (R17); or
- **declare `core` and carry what a condition above actually triggered** - carrying more
  than the profile requires has never been drift, and is also never verified.

The first is the paved road for the six document entries, because an exception carries a
reason and a voluntary extra carries nothing. It does not extend to the other three:
`scripts/cycle-guard.mjs` and the two guards are outside the hatch by design - waiving a live
check removes it instead of recording a deviation from it - so declaring `scale` means
accepting that R11's coupling guard **blocks** rather than advises. That is the difference
worth deciding deliberately, and it is a smaller and sharper question than the one the
headcount trigger was asking.

Reading `core` as "we are only two, so none of this is for us" is the one wrong answer the
conditions exist to prevent.

**No entry changes profile in this record.** The measurement says the split may be too weak
to carry what the docs put on it; it does not say which way to move, and inventing the
answer from this desk is what `PROF-3` is gated against.

## Consequences

- The trigger now names the thing each scale artifact was built for, so a future entry
  classifies itself by asking who reads it rather than by counting the team. That is the
  same question ADR-028 and ADR-032 already answered entry by entry - this record makes it
  the general test rather than a coincidence of three decisions agreeing.
- A solo or paired adopter is told the truth about CI up front instead of discovering it
  from a red pull request. This makes core visibly *heavier* than the old picker claimed,
  which is the point: the previous text bought lightness with a promise the tree does not
  keep.
- **Cost accepted:** "reach" is a judgment where "the second contributor" was a fact. A
  precise answer to the wrong question is worse than a judgment the picker gives conditions
  for, but the conditions will be argued about, and some repo will answer them wrongly.
- **Cost accepted:** the picker gets longer, against ADR-011's stated fear of explaining
  everything twice. It is one section in one document, and it is the section whose whole job
  is the choice - the alternative is a shorter picker that is wrong.
- The nine entries are now named in prose, so the manifest and the picker can disagree.
  `docs/facts.json` declares the count against the manifest, which catches an entry changing
  profile; it does not catch an entry being renamed. That is a real gap and it is smaller
  than the one it replaces.

## Confirmation

- `docs/method/adoption.md` and `docs/faq.md` state the conditions, name the nine entries
  and say what the flag does not change; neither still tells a core adopter that guards run
  locally.
- `docs/facts.json` declares the scale-entry count with the manifest as its home, so
  `facts-check` fails when an entry moves profile and the prose does not.
- Reproducible by an adopter in one command: `node scripts/self-verify.mjs --profile core`
  prints the number of entries it skipped, and it is the number the picker gives.

## What this rules out

A headcount anywhere in the profile picker, in any document. A third profile for team size -
ADR-011's regulated `audit` tier stays open on its own terms, which are about a different
audience and not about how many people are in this one.

## How we would know we were wrong

An adopter in the 2-5 range reads the conditions and cannot answer them without already
knowing the artifact list - which would mean the conditions describe the answer rather than
ask the question. Or the opposite: every repo that meets one condition meets all five, which
would mean reach is a single bit after all, the binary was right, and only its label was
wrong.

## Related

- [ADR-011](ADR-011-one-standard-two-profiles.md) - revised here. The mechanism, the
  per-entry field and the rendered views stand exactly as decided; the trigger and the
  solo/enterprise framing are what this record replaces.
- [ADR-028](ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md) - cycles bind at
  scale, the clearest instance of the reach test being applied before it had a name.
- [ADR-032](ADR-032-re-entry-is-core-tracker-sync-is-an-extension.md) - tracker sync is an
  optional extension, which is why "no tracker bridge" was never a discount.
- R16 (CI at core), R17 and [ADR-004](ADR-004-standard-decisions-by-reference.md)
  (exceptions are the recorded-deviation hatch),
  [`docs/open-questions/profiles.md`](../open-questions/profiles.md), `PROF-3` in
  [`backlog.md`](../../backlog.md).
