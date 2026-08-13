# ADR-032: Re-entering a spec mid-development is core; tracker sync is an extension

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-08-06 |
| **Author** | bodurkalukasz |

## Context

The loop this standard sells is not one-way. A spec is written, planned, broken into tasks,
built - and then something changes and you go **back** to the spec while the work is still in
flight. That return trip is one of the core assumptions of the product, and validation found
it unsupported in two different ways.

**What the round found** (cases `SPEC-22`, `TRACK-20`, `TRACK-21`, all `fail`):

1. `spec-update` correctly establishes the delta - "the spec on this branch describes the
   target; `git diff` against main is the change delta". Nothing downstream reads it.
   `spec-plan` reads the whole current spec and regenerates its artifacts wholesale, so an
   incremental plan happens when the agent notices the capability is already live, not
   because the mechanism produces one.
2. Task ids are **positional** (`T001`, `T002`, ...) and regenerated from scratch each run,
   with nothing reserving or renumbering against a previous round. R13 sharpens this: task
   scaffolding is deleted when work closes, so round two holds no record of what round one's
   ids meant.
3. The Jira bridge keys a sub-task by that id - "created only if no sub-task with that id
   exists". So on round two a **new** `T003` describing **different** work matches the
   **old** `[T003]` and is skipped as already present. Nothing errors. The board reads
   complete. Work is silently lost rather than duplicated, which is the worse failure.

The obvious fix - make task ids globally stable and teach the exporter to reconcile - drags a
tracker's concerns into the middle of the standard. That is the thing to avoid: most repos
that adopt this will never connect a tracker, and R15 already says execution state lives in
the tracker while the repo holds intents.

## Options considered

- **Stable content-derived task ids in core.** Hash the task's scope so the same work keeps
  its id across rounds. Rejected as a *core* change: it makes every repo carry an identity
  scheme whose only consumer is an exporter most of them do not run, and a hash in a task
  line is noise to a human reading `tasks.md`.
- **A generation marker in the key** (`[R2-T003]`). Simple, and it stops the collision.
  Rejected on its own: it makes every round mint a fresh set of sub-tasks, so a board
  accumulates a new copy of the same work each time the spec is touched. It trades silent
  loss for guaranteed duplication.
- **Split the problem by who needs it.** Chosen. The **re-entry** half - detect that a spec
  changed while work is in flight, and say what that means for the work already planned - is
  something every adopter needs, tracker or not, and belongs in core. The **identity and
  reconciliation** half exists only to keep an external system in step, and belongs in an
  optional extension that a repo without a tracker never has to know about.

## Decision

**Core gains re-entry detection, and only that.** When planning or task-breaking runs against
a capability that already has plan or task scaffolding present, the skills MUST compare
against what is there and report the difference - what the spec change adds, what it
invalidates, what is untouched - rather than silently overwriting. This needs no new file
format, no identity scheme and no external system: the scaffolding is already on disk during
development, which is exactly the window in which re-entry happens.

**Tracker synchronisation is an extension.** It is defined by an optional sidecar
(`specs/<capability>/tracker.json`) that a repo has only if it syncs to a tracker. It carries
the external keys already described in `tracking-work.md` plus a per-item fingerprint, so an
adapter can distinguish *the same work whose description changed* from *new work*. Core does
not read it, no shipped guard requires it, `self-verify` does not count its absence as drift,
and the manifest entry is `required: false`. A repo that never uses a tracker sees nothing.

**The no-overwrite rule stands.** The bridge still never edits an issue it did not create;
that is right, and `TRACK-21` is closed not by overwriting but by **reporting divergence** -
the adapter's job is to say "this Story's source has changed since it was exported", and a
human decides.

## Consequences

- The round trip becomes a mechanism instead of a hope, for every adopter, with no new
  concepts to learn - the check fires only when scaffolding already exists.
- The silent-loss defect is fixed where it actually lives: in the adapter's key, not in the
  core id scheme. A repo with no tracker was never affected and now carries nothing extra.
- **Cost accepted:** two places now describe work-in-flight - the scaffolding on disk and the
  sidecar - and they can disagree. The sidecar is derived and disposable; when they disagree
  the repo wins, and the adapter reports rather than reconciles.
- **Cost accepted:** the extension is per-capability, so a repo syncing many capabilities
  carries many small files rather than one index. That keeps a capability's tracker state
  next to the capability, at the price of no single place to read them all.
- An adapter is now a real, documented extension point rather than something one bridge does
  privately. That invites others (Linear, GitHub Projects) without core changing again.

## Confirmation

`SPEC-22`, `TRACK-20` and `TRACK-21` are the cases; they are re-run against the tree and move
from `fail` when this lands. The extension's own contract - core ignores it, its absence is
never drift - is checkable: `self-verify` on a repo without the sidecar must report the same
drift number as before it existed.

## What this rules out

Putting tracker identity, external keys or sync state into the spec, the task list or the
backlog row itself. Those are the repo's, and a tracker's needs do not get to shape them.

## Revisit when

An adopter with no tracker still has to think about the sidecar - which would mean the
"ignorable" claim is false - or a second adapter cannot be built against the extension
without changing core, which would mean the seam was drawn in the wrong place.

## Related

- [ADR-010](ADR-010-artifact-lifecycle-and-tracker.md) - repo holds intents, tracker holds
  execution history. This is that split applied to the return trip.
- `docs/method/tracking-work.md` - the bridge whose keying defect this records.
- R13 (scaffolding is ephemeral), R15 (backlog and tracker).
