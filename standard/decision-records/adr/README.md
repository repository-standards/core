# ADR index

Architecture Decision Records - the technical *why*. See
[`../README.md`](../README.md) for the system, lifecycle, and altitude hierarchy.

Read this table instead of opening every record - the gist column says what each one
settled, so you open only the records that touch your question.

| # | Title | Decides | Status |
|---|-------|---------|--------|
| [001](ADR-001-decision-record-policy.md) | Decision record policy | two streams (ADR technical / BDR business), MADR format, sub-scope via Tags never new acronyms, gapless numbering | Accepted |
| [002](ADR-002-specs-by-capability.md) | Specs by capability | specs live at `specs/<capability>/`, never per-ticket or per-page; Spec Kit's NNN- numbering stays out of paths | Accepted |
| [003](ADR-003-specs-buildable-not-descriptive.md) | Specs are buildable | a spec must let an agent rebuild and verify the capability without the code; verbatim contracts, not prose | Accepted |
| [004](ADR-004-standard-decisions-by-reference.md) | Standard decisions by reference | consuming repos adopt the standard's decisions by link at a pinned version; deviations are local superseding records | Accepted |
| [005](ADR-005-align-engine-is-a-manifest.md) | Align-engine is a manifest | what an aligned repo must have lives in `standard.manifest.json` (data), not prose/JS; self-verify reads it, drift is a number | Accepted |
| [006](ADR-006-personas-are-a-validation-gate.md) | Personas gate everything | every idea/spec/backlog item names the persona it serves or is parked; persona conflicts resolve by BDR | Accepted |
| [007](ADR-007-modernize-is-plan-then-refactor.md) | Modernize is plan-then-refactor | document the repo first (specs, decisions), then record each move as ADR/BDR, then refactor - never bump-and-fix | Accepted |
| [008](ADR-008-standard-repo-three-zones.md) | Three zones in this repo | repo-own life vs standard source vs shipped skeleton; source regroup under one dir as STRUCT-1 | Accepted |
| [009](ADR-009-skills-lifecycle-vs-transition.md) | Transition skills never ship | lifecycle skills go to `dist/` and stay; align/onboard/modernize/greenfield run from this repo only | Accepted |
| [010](ADR-010-artifact-lifecycle-and-tracker.md) | One artifact lifecycle + tracker | ideas -> records/specs (living) -> plan/tasks (ephemeral, cleaned at close); statuses with the clarify gate; GitHub Issues default, Jira/Linear adapters | Accepted |
| [011](ADR-011-one-standard-two-profiles.md) | Core vs scale profiles | one repo, two verified profiles - core keeps knowledge alive (every repo), scale coordinates people (teams); declared per manifest entry | Accepted |
| [012](ADR-012-in-repo-instructions-are-the-source-of-truth.md) | In-repo instructions are the source of truth | repo rules live at their taxonomy homes; personal memory/config may point, never hold; a rule only outside the repo is missing | Accepted |
| [013](ADR-013-spec-kit-is-an-engine-by-reference.md) | Spec Kit is a vendored, pinned engine | agent-side assets (prompts, scripts, constitution) vendored at a pinned version, patched (capability paths, gate hooks, statuses), synced only at release time; MIT attribution; our spec-* skills stay our own | Accepted |

Add one row per record. Use [`_template.md`](_template.md). Numbers are gapless and
never reused.
