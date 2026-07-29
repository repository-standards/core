# decision-records/ - this repo's own decision log (zone 1)

The repository-standards project's own ADRs, flat in this folder. Clients never
receive copies - they adopt these decisions by reference at a pinned version
(ADR-004); the shipped tree carries only the empty log skeleton
(`standard/docs/decision-records/`) for a client's own records.

Read the table instead of opening every record - the gist column says what each
one settled.

| # | Title | Decides | Status |
|---|-------|---------|--------|
| [001](ADR-001-decision-record-policy.md) | Decision record policy | two streams (ADR technical / BDR business), MADR format, sub-scope via Tags never new acronyms, gapless numbering | Accepted |
| [002](ADR-002-specs-by-capability.md) | Specs by capability | specs live at `specs/<capability>/`, never per-ticket or per-page | Accepted |
| [003](ADR-003-specs-buildable-not-descriptive.md) | Specs are buildable | a spec must let an agent rebuild and verify the capability without the code; verbatim contracts, not prose | Accepted |
| [004](ADR-004-standard-decisions-by-reference.md) | Standard decisions by reference | consuming repos adopt the standard's decisions by link at a pinned version; deviations are local superseding records | Accepted |
| [005](ADR-005-align-engine-is-a-manifest.md) | Align-engine is a manifest | what an aligned repo must have lives in `standard.manifest.json` (data), not prose/JS; self-verify reads it, drift is a number | Accepted |
| [006](ADR-006-personas-are-a-validation-gate.md) | Personas gate everything | every idea/spec/backlog item names the persona it serves or is parked; persona conflicts resolve by BDR | Accepted |
| [007](ADR-007-modernize-is-plan-then-refactor.md) | Modernize is plan-then-refactor | document the repo first, record each move, then refactor - never bump-and-fix | Accepted |
| [008](ADR-008-standard-repo-three-zones.md) | Zones in this repo | repo-own life vs the standard's source; zone mechanics revised by ADR-014, stacks clause by ADR-016 | Accepted, revised by 014/016 |
| [009](ADR-009-skills-lifecycle-vs-transition.md) | Transition skills never ship | lifecycle skills ship with the tree and stay; the transition router runs from this repo only | Accepted |
| [010](ADR-010-artifact-lifecycle-and-tracker.md) | One artifact lifecycle + tracker | ideas -> records/specs (living) -> plan/tasks (ephemeral, cleaned at close); statuses with the clarify gate; GitHub Issues default, Jira/Linear adapters | Accepted |
| [011](ADR-011-one-standard-two-profiles.md) | Core vs scale profiles | one repo, two verified profiles - core keeps knowledge alive (every repo), scale coordinates people (teams); declared per manifest entry | Accepted |
| [012](ADR-012-in-repo-instructions-are-the-source-of-truth.md) | In-repo instructions are the source of truth | repo rules live at their taxonomy homes; personal memory/config may point, never hold | Accepted |
| [013](ADR-013-spec-kit-is-an-engine-by-reference.md) | Spec Kit vendored as a pinned engine | superseded: the engine is extracted, not vendored | Superseded by 015 |
| [014](ADR-014-one-authored-tree.md) | One authored tree | `standard/` is the single committed, consumable tree at real-repo paths; no second source, no reflect; repo-own material lives outside it | Accepted |
| [015](ADR-015-spec-engine-extracted.md) | Spec engine extracted | five engine prompts become the standard's own `spec-*` skills + `scripts/spec/`; no `.specify/`, no speckit namespace; upstream improvements are cherry-picked | Accepted |
| [016](ADR-016-stacks-are-satellite-repos.md) | Stacks are satellite repos | one repo per technology (`repository-standards-<tech>`), official only via the `stacks.json` registry; variation = profiles/adoption modes, never sibling repos; the stack points back at the registry (range clause revised by ADR-022), core never chases | Accepted |
| [017](ADR-017-consumed-versions-pinned-exact.md) | Consumed versions pinned exact | dependencies, overrides, images, runners and actions name exact versions or digests - nothing floats, upgrades are reviewed diffs; cooldown before adoption (R21) | Accepted |
| [018](ADR-018-history-lives-in-the-changelog.md) | History lives in the changelog | living documents carry no change-log sections; git + the changelog process are the only history; capability globs skip manifests/lockfiles (R4) | Accepted |
| [019](ADR-019-lifecycle-procedures-are-agent-portable.md) | Lifecycle procedures are agent-portable | the procedures are normative (R22); `.claude/skills` is the reference form; a non-Claude repo ports them strictly to its agent's mechanism - a partial port is drift | Accepted |
| [020](ADR-020-intake-first-adoption.md) | Intake-first adoption | align opens with step 0 - measure, then one question round (intent, technology + Layer 2 consent, appetite, plan-only vs execute); per-direction gate order; assessment-only is a named outcome; plan items name an owner role | Accepted |
| [021](ADR-021-adoption-feeds-the-standard.md) | Adoption feeds the standard | align/update runs offer consent-gated upstream issues - stack requests on registry misses, friction reports on rough runs; templates give the signal one shape | Accepted |
| [022](ADR-022-stacks-linked-not-version-locked.md) | Stacks linked, not version-locked | a stack declares it belongs to the ecosystem (registry pointer), never a core version range; self-verify notes the layer, checks nothing version-shaped | Accepted |

Add one row per record; the template ships in the tree
(`standard/docs/decision-records/adr/_template.md`). Numbers are gapless and never
reused.
