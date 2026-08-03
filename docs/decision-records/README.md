# decision-records/ - this repo's own decision log (zone 1)

The repository-standards project's own ADRs, flat in this folder. Clients never
receive copies - they adopt these decisions by reference from the living standard - always latest
(ADR-004); the shipped tree carries only the empty log skeleton
(`standard/docs/decision-records/`) for a client's own records.

Read the table instead of opening every record - the gist column says what each
one settled.

| # | Title | Decides | Status |
|---|-------|---------|--------|
| [001](ADR-001-decision-record-policy.md) | Decision record policy | two streams (ADR technical / BDR business), MADR format, sub-scope via Tags never new acronyms, gapless numbering | Accepted |
| [002](ADR-002-specs-by-capability.md) | Specs by capability | specs live at `specs/<capability>/`, never per-ticket or per-page | Accepted |
| [003](ADR-003-specs-buildable-not-descriptive.md) | Specs are buildable | a spec must let an agent rebuild and verify the capability without the code; verbatim contracts, not prose | Accepted |
| [004](ADR-004-standard-decisions-by-reference.md) | Standard decisions by reference | consuming repos adopt the standard's decisions by link; deviations are local superseding records. **Revised by ADR-025**: references resolve at `main` - latest, not a pinned version | Accepted |
| [005](ADR-005-align-engine-is-a-manifest.md) | Align-engine is a manifest | what an aligned repo must have lives in `standard.manifest.json` (data), not prose/JS; self-verify reads it, drift is a number | Accepted |
| [006](ADR-006-personas-are-a-validation-gate.md) | Personas gate everything | every idea/spec/backlog item names the persona it serves or is parked; persona conflicts resolve by BDR | Accepted |
| [007](ADR-007-modernize-is-plan-then-refactor.md) | Modernize is plan-then-refactor | document the repo first, record each move, then refactor - never bump-and-fix | Accepted |
| [008](ADR-008-standard-repo-three-zones.md) | Zones in this repo | repo-own life vs the standard's source; zone mechanics revised by ADR-014, stacks clause by ADR-016 | Accepted, revised by 014/016 |
| [009](ADR-009-skills-lifecycle-vs-transition.md) | Transition skills never ship | lifecycle skills ship with the tree and stay; the transition router runs from this repo only | Accepted |
| [010](ADR-010-artifact-lifecycle-and-tracker.md) | One artifact lifecycle + tracker | ideas -> records/specs (living) -> plan/tasks (ephemeral, cleaned at close); statuses with the clarify gate; GitHub Issues default, Jira/Linear adapters | Accepted, revised by 028 |
| [011](ADR-011-one-standard-two-profiles.md) | Core vs scale profiles | one repo, two verified profiles - core keeps knowledge alive (every repo), scale coordinates people (teams); declared per manifest entry | Accepted |
| [012](ADR-012-in-repo-instructions-are-the-source-of-truth.md) | In-repo instructions are the source of truth | repo rules live at their taxonomy homes; personal memory/config may point, never hold | Accepted |
| [013](ADR-013-spec-kit-is-an-engine-by-reference.md) | Spec Kit vendored as a pinned engine | superseded: the engine is extracted, not vendored | Superseded by 015 |
| [014](ADR-014-one-authored-tree.md) | One authored tree | `standard/` is the single committed, consumable tree at real-repo paths; no second source, no reflect; repo-own material lives outside it | Accepted |
| [015](ADR-015-spec-engine-extracted.md) | Spec engine extracted | five engine prompts become the standard's own `spec-*` skills + `scripts/spec/`; no `.specify/`, no speckit namespace; upstream improvements are cherry-picked | Accepted |
| [016](ADR-016-stacks-are-satellite-repos.md) | Stacks are satellite repos | one repo per technology, named for the technology in the `repository-standards` org, official only via the `stacks.json` registry; variation = profiles/adoption modes, never sibling repos; the stack points back at the registry (range clause revised by ADR-022), core never chases | Accepted |
| [017](ADR-017-consumed-versions-pinned-exact.md) | Consumed versions pinned exact | dependencies, overrides, images, runners and actions name exact versions or digests - nothing floats, upgrades are reviewed diffs; cooldown before adoption (R21) | Accepted |
| [018](ADR-018-history-lives-in-the-changelog.md) | History lives in the changelog | living documents carry no change-log sections; git + the changelog process are the only history; capability globs skip manifests/lockfiles (R4). **Revised 2026-08-02**: the `changes/` fragments mechanism removed - one path at every profile | Accepted |
| [019](ADR-019-lifecycle-procedures-are-agent-portable.md) | Lifecycle procedures are agent-portable | the procedures are normative (R22); `.claude/skills` is the reference form; a non-Claude repo ports them strictly to its agent's mechanism - a partial port is drift | Accepted |
| [020](ADR-020-intake-first-adoption.md) | Intake-first adoption | align opens with step 0 - measure, then one question round (intent, technology + Layer 2 consent, appetite, plan-only vs execute); per-direction gate order; assessment-only is a named outcome; plan items name an owner role | Accepted |
| [021](ADR-021-adoption-feeds-the-standard.md) | Adoption feeds the standard | align/update runs offer consent-gated upstream issues - stack requests on registry misses, friction reports on rough runs; templates give the signal one shape | Accepted |
| [022](ADR-022-stacks-linked-not-version-locked.md) | Stacks linked, not version-locked | a stack declares it belongs to the ecosystem (registry pointer), never a core version range; self-verify notes the layer, checks nothing version-shaped | Accepted |
| [023](ADR-023-method-docs-live-beside-the-tree.md) | Method docs live beside the tree | the method manual moves to `docs/method/`; the tree is literally the client repo at day zero; clients adopt the method by reference (manifest `references`), never as copies | Accepted |
| [024](ADR-024-discovery-dossiers-beside-the-specs.md) | Discovery dossiers beside the specs | `docs/discovery/<topic>/` holds provenance-stamped extracts, never normative; the `Last reconciled:` stamp ends re-asking; typed open markers let a spec draft early and gate honestly | Accepted |
| [025](ADR-025-the-standard-is-living-latest-is-the-target.md) | The standard is living - latest is the only target | no version ranges or requirements anywhere, ever; every align/update targets latest; `.standards-version` is a bookmark of the last aligned state, never a constraint; references resolve at `main` deliberately | Accepted |
| [026](ADR-026-rebase-merge-onto-a-linear-main.md) | Rebase-merge onto a linear `main` | branches update by rebase and never back-merge; every PR is based on the mainline; a PR lands as one readable unit - rebase-merge on the paved road, squash where per-commit hygiene is not held (R23) | Accepted |
| [027](ADR-027-the-database-schema-lives-in-the-repo-with-a-typed-twin.md) | The database schema lives in the repo, with a typed twin | executable DDL under `database/schema/` rebuilds the database from a checkout; a typed definition in the stack's idiom is what every access path goes through; the two are a declared 1:1 pair that moves in one PR (R24) | Accepted |
| [028](ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md) | Work cycles live in the repo, and bind only at scale | a cycle is a goal-bearing, dated grouping of backlog intents at `docs/cycles/<team>/`; one intent is in the pool or in exactly one cycle, never both; `/cycle-close` writes one aggregate outcome because the grouping is not recoverable afterwards - narrowing ADR-010; scale only | Accepted |
| [029](ADR-029-measurement-forecasts-sizes-only-cold-start.md) | Measurement forecasts the work; sizes only cover the cold start | measured item duration is the forecast; optional `S`/`M`/`L` is a splitting trigger and a cold-start estimate below three closed cycles, never summed, never charted, and ignored entirely once measurement exists - no blended mode; an item that overruns its cycle is split, not re-sized | Accepted |
| [030](ADR-030-the-current-holder-is-cycle-state-not-history.md) | The current holder of an in-flight intent is cycle state, not history | `assignee` names who holds an intent **now**, on cycle rows only; the pool has none, reassignment overwrites, and the closed cycle is archived as written rather than aggregated - narrowing ADR-010 by tense, not replacing it | Accepted |
| [031](ADR-031-one-domain-surface-first-urls.md) | One domain, surface first in the URL | `/` and `/docs/` are the core's, `/node/` and `/docs/node/` a stack's; each repo knows only `site_root` and `base_path`, every internal link is root-absolute, and the ecosystem switcher derives "here" from its own base rather than being told | Accepted |

Add one row per record; the template ships in the tree
(`standard/docs/decision-records/adr/_template.md`). Numbers are gapless and never
reused.
