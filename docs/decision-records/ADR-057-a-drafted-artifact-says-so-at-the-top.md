---
status: Accepted, revised by ADR-058 (one marker for both cases)
date: 2026-09-03
---

# ADR-057: an artifact the adoption drafted or stubbed says so at the top of the file

## Context

An adoption question has three answers (ADR-054): a person decides now, the agent suggests
and the person checks later, or a stub is left rather than a guess. The second and third
leave work behind for a human, and today that work is recorded in exactly one place: a row
per *question* in `docs/adoption-provenance.md`, in state `provisional` or `absent`, naming
one backlog row. A run that drafts twelve retroactive decision records under one `suggest`
leaves one row there and, at best, one row in the backlog.

The artifacts themselves say nothing. A retroactive ADR reconstructed from the code is
written with `Status: Accepted` and a note "recorded retroactively", so it reads as a
decision somebody made. A persona roster inferred from a routes table reads as a roster.
`self-verify` counts both as present, which is correct under ADR-038, and the file a
colleague opens six months later carries no sign that nobody ever confirmed it. The
provenance table knows, but the reader is in the file, not in the table, and nothing
in the table is per file.

Two things follow that this standard has said it wants and cannot deliver. The counted
backlog (R27) is meant to make onboarding continuable by anyone, but a team lead who wants
to hand "confirm ADR-013" to the architect and "confirm the personas" to product has one row
saying *decision records, provisional* and has to split it by hand. And the percentage that
`self-verify` prints has no companion number: six empty stubs move it exactly as far as six
real files, and the warning that says so is one line in the check's output.

## Options considered

- **A hand-written hand-off file** - `docs/adoption-handoff.md`, listing every file that
  waits on a person. A fourth record of the same fact beside the provenance table, the
  assessment and the backlog, curated rather than measured. It is wrong the first time
  someone confirms an ADR and does not strike the line, and the align skill already refuses
  curated lists for the open delta for that reason.
- **The provenance table, one row per artifact** - keeps the fact in one table but leaves
  the file mute, and the table is per question by design: it answers "was this asked and
  who answered", not "which of the things written under that answer are still unchecked".
- **A marker in the artifact, and a list derived from the markers** - the file carries its
  own state on its first line; scripts scan for the marker and derive the count and the
  backlog link. Nothing to curate: the marker leaves in the commit that verifies the
  content, and that commit is the record of who verified and when.

## Decision

**Every artifact written under `suggest` or `stub` opens with a marker line, and the marker
is the unit the tooling reads.** Directly under the title:

```
> [NEEDS REVIEW] drafted by the adoption run on 2026-09-03 from the route table and
> `roles.js`. Backlog: PERSONAS-1.

> [STUB] nothing written here yet - architect fills it. Backlog: ADR-013-1.
```

- `[NEEDS REVIEW]` is the `provisional` state per file: the agent proposed the content. The
  line says what it was drafted from, and which backlog row tracks it. It does not name who
  acts on it - the artifact's own kind already says that (an ADR reads as technical, a BDR
  and `docs/personas.md` as product), and a role word in every marker would duplicate what
  the file already is.
- `[STUB]` is the `absent` state per file: nothing was written, and the line names who
  fills it and the backlog row. This is the "visible gap marker" the elicitation README
  already promised without saying what it looks like.
- **One backlog row per marked artifact**, so a row can be assigned to a person without
  splitting it first. The per-question row in the provenance table stays and still names
  one of them; the markers are what make it per file.
- **A drafted decision record is `Proposed`, not `Accepted`.** "Recorded retroactively"
  describes where the content came from, not whether anybody decided it; the marker and
  the status together say that. The human who confirms flips the status and removes the
  marker in the same commit.
- **The marker leaves with the verification and with nothing else.** No `verified-by`
  field, no date to maintain: `git log` on the file answers who removed the marker and
  when, and a commit that removes markers while changing nothing else in the file is the
  signal that the review did not happen.
- **The percentage does not move.** A marked file is present and counts as adopted
  (ADR-038, structure is what the number measures). What changes is that the number gets a
  companion: `self-verify` reports how many entries carry a marker, split into drafted and
  stubbed, next to the percentage rather than as one warning among many.

## Consequences

- Positive: the file tells its own reader it is unconfirmed; the hand-off list is derived
  from the tree and cannot go stale; "N artifacts await a human" is a number an adopter
  can show a team alongside "X% adopted"; a stub is distinguishable from a draft, and both
  from a decision.
- Cost we accept: the retroactive records the align skill writes change status - a run
  that today ends with twelve Accepted ADRs ends with twelve Proposed ones and twelve
  backlog rows. That is the truthful count and it looks worse. The skill's own text on
  handing over a number with its antidote applies unchanged.
- Cost we accept: one more convention an adopter can strip in bulk. The tooling reads the
  markers, so a bulk strip shows up as a commit removing markers and touching nothing else,
  which is the failure named under Revisit when.
- Follow-ups, each a backlog row under the epic "Adoption leaves the human work visible":
  the shipped tree writes the marker (`NEEDS-REVIEW-1`), the checks read it
  (`NEEDS-REVIEW-2`), the dashboard shows it (`NEEDS-REVIEW-3`).

## Confirmation

Nothing confirms this mechanically yet, and that is stated here rather than implied. The
convention lands with `NEEDS-REVIEW-1`; the checks - `self-verify` counting marked entries,
`elicitation-provenance` requiring every marker to name a backlog row that exists - land
with `NEEDS-REVIEW-2`. Until then the marker is reviewed by hand at the adoption's pre-PR
review, and a run that writes under `suggest` without it is a defect against this record.

## Revisit when

- A field adoption's history shows markers removed in commits that change nothing else in
  the file: the marker has become a chore to clear rather than a review to do, and the
  per-file state needs a different carrier or a stronger gate.
- The per-question rows in `docs/adoption-provenance.md` and the markers in the tree
  disagree on a repository and neither check catches it: two records of one fact again,
  which is the failure option A was rejected for.
- An adopter's team assigns the marked rows without opening the files - the backlog row
  alone turned out to carry enough, and the marker is duplicate.

## Related

- ADR-006 (personas are a validation gate), ADR-020 (intake first), ADR-042 (intake is an
  artifact) - the artifacts this marker most often lands on.
- ADR-038 - the percentage is structural; this record adds a companion number and leaves
  the percentage alone.
- ADR-048 - gate artifacts are read for shape; the marker is a shape the checks can read.
- ADR-054 - the three answers to a question and their provenance states; this record gives
  two of those states a form inside the artifact.
- R17 (recorded deviations), R27 (assessment and count artifacts).
