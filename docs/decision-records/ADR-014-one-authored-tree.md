# ADR-014: One authored tree - standard/ is the standard, at real-repo paths

| | |
| --- | --- |
| **Status** | Accepted (2026-07-22) |
| **Date** | 2026-07-22 |
| **Author** | Łukasz Bodurka |
| **Tags** | structure, repo-layout, distribution, simplification |

## Context

ADR-008 split the repo into a by-concern source (`standard/`) and a committed
assembled snapshot (`dist/`), synced by `tools/reflect.mjs`. The 2026-07-22
fresh-eyes review measured what that pair actually cost: 47 of 78 dist files were
committed byte-duplicates; 27 more (the `divergent` class) were hand-maintained
twins that reflect never content-compared - and four live drifts shipped that way,
including a pristine skeleton that failed its own `self-verify` with drift 5.
The stated rationale for two trees ("template vs filled example genuinely needs
two forms") measured out at 2-6 link-depth lines per pair. In the last 20 commits,
every shipped change was paid twice (48 dist path-touches vs 93 source). The only
hard consumer requirement found: degit needs SOME committed tree at real-repo
paths - not a second copy.

## Options considered

- **A - Keep the pair.** Nothing to migrate; carries the duplication, the
  unverifiable divergent class, and double-paid changes forever.
- **B - Author in dist for the copy class only.** Kills the byte-dupes, keeps the
  hand-synced twins where every found drift lived. A half-measure.
- **C - Source-only, dist built at release.** Cleanest theory; kills the degit
  one-liner from main, and demands mechanizing 27 hand transforms first.
- **D - One committed consumable tree (chosen).** Author every shipped file once,
  at the paths a client repo will have. The divergent class ceases to exist;
  drift between copies becomes impossible rather than detected.

## Decision

Option **D**. Concretely:

1. `standard/` is the single authored, committed, consumable tree, holding
   real-repo paths (`AGENTS.md`, `.claude/skills/`, `.github/`, `docs/`, `specs/`,
   `scripts/`, `SPEC.md`, the manifest). What you degit is what we maintain:
   `npx degit repository-standards/core/standard my-repo`.
2. `dist/` and the old by-concern source are gone. Template-vs-real pairs resolve
   to the one shipped form (placeholders where a client authors content).
3. Repo-own material lives outside the tree: this repo's ADRs in
   `docs/decision-records/` (the same layout R5 prescribes to clients), the transition router in `skills/`, gate tooling in
   `tools/`, the web surface in `site/`, product docs in `docs/`.
4. `tools/reflect.mjs` is replaced by `tools/tree-check.mjs`: a leak guard (no
   repo-own material inside the tree), a promise check (every manifest entry that
   ships exists), and the skeleton self-check
   (`node scripts/self-verify.mjs --skeleton` inside the tree, run in CI).
5. ADR-008's zones survive as concepts: zone 1 is the repo's own life, zone 2 is
   the tree. Zone 3 merged into zone 2 - the source IS the shipped form.

## Consequences

- Positive: zero duplication by construction; relative links inside shipped docs
  resolve in the one geometry that exists; every change is paid once; the thing
  an adopter reads is the thing we maintain; reflect's 217 lines and its 92-entry
  map reduce to a ~80-line guard.
- Negative: one large migration (this change); the tree mixes hand-authored files
  with client-authored shells, so the manifest's `adapt` field now carries the
  distinction alone; git history for moved files crosses a rename boundary.

## Confirmation

`tree-check` green in CI: no leaks, all manifest promises present, and the
pristine tree passes its own shipped `self-verify --skeleton`.

## Revisit when

The tree needs per-client build-time variation that authoring cannot express
(then a build step returns for that slice only), or a second consumable tree
(a new layer) appears and the leak rules need generalizing.

## Related

- ADR-008 (zones - mechanics revised here), ADR-004 (decisions by reference),
  ADR-005 (the manifest stays the client contract), ADR-015 (engine extraction,
  same wave); the 2026-07-22 review and decision plan (owner's private notes).
