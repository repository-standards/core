# ADR-009: Skills are lifecycle or transition - and transition skills never ship

| | |
| --- | --- |
| **Status** | Accepted (2026-07-22 - owner directive; implemented: dist carries the nine lifecycle skills only) |
| **Date** | 2026-07-21 (revised 2026-07-22 while Proposed) |
| **Author** | Łukasz Bodurka |
| **Tags** | skills, dist, lifecycle, adoption |

## Context

The skills are two different kinds of thing. Some ARE the ways of working - a repo uses
`spec-impact` or `pre-pr-review` on every change, for life. Others exist only to get a
repo TO the standard - `align-to-standards`, `onboard-repo`, `modernize`,
`greenfield-start` - they are the **standard repo's own utility**, not the target
repo's process.

`dist/` initially shipped all thirteen as one undifferentiated set. The owner's call
(2026-07-22): that is a separation error - `dist/` is the *resulting repository*, and
conversion machinery does not belong in the result. The decisive proof:
**`greenfield-start` runs before the target repo even exists** - it cannot possibly be
a file inside it.

## Options considered

- **A - No distinction (initial state).** Simplest; but every aligned repo permanently
  carries scaffolding, and an agent reading its `.claude/skills/` sees one-shot
  conversion machinery presented as daily process.
- **B - Transition skills never ship; they run from the standard repo (chosen).** The
  transition is *always* driven by an agent pointing at the standard ("align this repo
  to <standard>@<version>") - so the transition skills execute from the standard's
  checkout/fetch, exactly like `greenfield-start` already must. The target repo only
  ever receives what it keeps.
- **C - Ship both, classify, clean up at aligned (the first draft of this record).**
  Works, but ships debris only to delete it later, needs a reliable cleanup, and
  re-materialization logic in `update-to-version`. Complexity purchased for nothing
  option B does not already give.

## Decision

Option **B**. Classes:

- **Lifecycle (ship, stay forever):** `spec-analyze`, `spec-converge`, `spec-impact`,
  `spec-reconcile`, `spec-update`, `add-to-backlog`, `backlog-from-specs`,
  `pre-pr-review`, `update-to-version` (recurring maintenance - it keeps the repo on
  the standard).
- **Transition (never shipped):** `align-to-standards`, `onboard-repo`, `modernize`,
  `greenfield-start`. They live in the standard repo only (`skills/`), are guarded
  source-only by `reflect.mjs`, and run in the agent's context when the user points a
  repo at the standard.

`SKILL-1` shrinks accordingly: no cleanup-of-skills machinery is needed; `self-verify`
just flags transition skills if found inside an aligned repo (a hand-copy mistake).

## Consequences

- Positive: `dist/` is purely "what the target repo keeps"; no cleanup logic, no
  re-materialization; the utility-vs-skeleton separation the owner asked for is
  structural, not procedural.
- Negative: a transition needs the standard repo reachable (fetch/degit) - already true
  of align/update by design; offline transition of an air-gapped repo requires bringing
  the standard checkout along.

## Confirmation

`dist/.claude/skills/` contains exactly the nine lifecycle skills; `reflect --check`
fails if a transition skill leaks into `dist/`; `self-verify` flags transition skills
found in a consuming repo.

## Revisit when

Skills gain a plugin/marketplace distribution (then *nothing* may need shipping in
`dist/`), or a real air-gapped adoption case appears.

## Related

- ADR-008 (three zones - this is the zones rule applied to skills), ADR-010 (lifecycle;
  its ephemeral class covers plan/tasks and idea docs - transition skills are simply
  never in the target at all), `SKILL-1` in [`backlog.md`](../../backlog.md).
