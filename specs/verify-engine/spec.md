# Verify engine

**Spec tier:** buildable
**Serves:** `Standard-bearer Staszek` - drift as a number, per repo; `Owner Olek` - a green run is the assurance he buys; `Coding agent` obeys it as a mechanical gate.
**Status:** live
**Success metric:** Retention - repos that update and return to drift 0 within a release cycle.

## Purpose

[`standard/scripts/self-verify.mjs`](../../standard/scripts/self-verify.mjs) (client path `scripts/self-verify.mjs`) proves a repo still complies with the standard version it is pinned to and reports DRIFT as a number. Mechanical tier only; the judgment tier (are catalogued decisions actually recorded?) stays at PR review.

## Scope

The shipped verifier: manifest loading, version pin, file/section/guard checks, profiles, skeleton mode, drift accounting, exit codes.

## Out of scope

Guarding this repo's own shipped tree ([tree-guard](../tree-guard/spec.md)); authoring the manifest's content.

## Core concepts

- **Manifest** - `standard.manifest.json` in cwd, the single source of truth (ADR-005): `version`, `files[]`, `sections[]`, `guards[]`, `decisions[]`.
- **Drift** - the count of FAIL results; one unmet required entry = one point. Notes and warnings never count.
- **Profile** - `core` or `scale` per entry (ADR-011); an entry with no profile counts as core, so pre-ADR-011 manifests check in full under either profile.

## Interface contracts

`node scripts/self-verify.mjs [--version <x.y.z>] [--warn] [--profile core|scale (solo/team as deprecated aliases)] [--skeleton]` - no dependencies (Node built-ins only). Checks, in order:

1. **Manifest load.** Parse `standard.manifest.json` if present; a present-but-unparseable manifest is a FAIL. No manifest at all -> a note plus the built-in fallback skeleton: `AGENTS.md`, `specs/`, `docs/decision-records/` must exist; a backlog at `docs/backlog.md` or `backlog.md`; `node scripts/spec-structure.mjs --block` runs if installed (a note if not).
2. **Version pin.** `.standards-version` must exist and match `/^\d+\.\d+\.\d+/`; with `--version <target>` it must equal the target; when the manifest carries `version`, it must equal the pin (the manifest must match the pin). `--skeleton` skips the pin with a note (it is written at adoption).
3. **Files.** A `files[]` entry passes when `path` or any `altPaths` entry exists. Required and absent -> FAIL; optional and absent -> note. Under `--skeleton`, an absent entry with `adapt: "fill-from-repo"` is a note: authored at adoption, absent from the skeleton by design.
4. **Sections.** A `sections[]` entry passes when its `file` contains a heading matching `new RegExp("^#{1,6}\\s+.*" + escapeRe(heading), "mi")` - any heading level, any prefix before the heading text, case-insensitive. A missing `file` with `required` is a FAIL ("cannot be checked").
5. **Guards.** Each `guards[]` entry runs via `execSync(g.run)` with output captured. Skips: `id === "self-verify"` (never recurse into itself); `kind === "diff"` -> note (runs in CI on the PR diff, not here); a `scripts/<name>.mjs` path extracted from `run` that does not exist -> note (not installed - skipped); under `--skeleton` all guards are skipped with a single note. A non-zero guard FAILs with its output indented.
6. **Profiles.** `--profile core` checks core entries only across files/sections/guards and notes how many scale-only entries were skipped; `--profile scale` (or no flag) checks everything. `solo`/`team` are accepted as deprecated aliases.
7. **Stray transition skills.** `align-to-standards`, `onboard-repo`, `modernize`, `greenfield-start` found under `.claude/skills/` each produce a WARN (a hand-copy mistake, delete it - ADR-009), never drift.
8. **Decisions.** A non-empty `decisions[]` produces one note (judgment tier, confirmed recorded at review) - never checked mechanically.

Output: header `self-verify - compliance with manifest <version>` (or `the pinned standard`), one `PASS | FAIL | WARN | ....` row per result (`<tag>  <name padded to 9>  <msg>`), then the verdict.

### Exit codes and verdicts

| Condition | Verdict | Stream | Exit |
|---|---|---|---|
| drift 0 | `self-verify: OK - drift 0 - <n> checks, compliant with the standard` | stdout | 0 |
| drift > 0 | `self-verify: drift <n> - <n> required entr(y/ies) unmet - not compliant` | stderr | 1 |
| drift > 0, `--warn` | same drift line | stderr | 0 |
| `--version X` and pin != X | counted as a version FAIL, drifts as above | stderr | 1 |

## Requirements

- The verifier MUST report every result before exiting - never stop at the first failure.
- The verifier MUST live at `scripts/self-verify.mjs` in a consuming repo and run from the repo root.
- `--warn` MUST only change the exit code, never the reported drift.

## Invariants

- The exit code MUST be 0 if and only if drift is 0 or `--warn` is set.
- `--skeleton` MUST NOT execute any guard and MUST NOT require the version pin.
- The verifier MUST NOT recurse into itself via the manifest's own `self-verify` guard entry.
- Warnings and notes MUST NOT add to drift.

## Acceptance criteria

- **Green repo.** GIVEN a repo meeting every required manifest entry with a matching pin WHEN run with no flags THEN drift is 0 and exit is 0.
- **Pin mismatch.** GIVEN `.standards-version` is `0.7.1` WHEN run with `--version 0.7.2` THEN a version FAIL is reported and exit is 1.
- **Manifest/pin split.** GIVEN manifest `version: 0.8.0` and pin `0.7.2` WHEN run THEN a FAIL says the manifest must match the pin.
- **Warn mode.** GIVEN drift 3 WHEN run with `--warn` THEN the drift line still prints and exit is 0.
- **Skeleton.** GIVEN the pristine shipped tree WHEN run with `--skeleton` THEN the pin is a note, fill-from-repo files are notes, no guard executes, and exit is 0.
- **Core profile.** GIVEN a manifest with scale-only entries WHEN run with `--profile core` THEN those entries are skipped and their count appears as a note.
- **Recursion guard.** GIVEN the manifest lists guard `id: "self-verify"` WHEN guards run THEN that entry is skipped.
- **Stray skill.** GIVEN `.claude/skills/align-to-standards/` exists WHEN run THEN a WARN names it and drift is unchanged.
- **Failing guard.** GIVEN a static guard exits non-zero WHEN run THEN its captured output prints indented under the FAIL and exit is 1.

### Stack manifest merge

When `stack.manifest.json` exists beside `standard.manifest.json` (a repo that
adopted a registered stack - ADR-016), self-verify notes it (`stack` row naming
the technology and its declared standards range) and concatenates its `files`,
`sections` and `guards` entries into the core manifest's before checking - one
drift number across both layers. An unparseable stack manifest is a FAIL, like
the core one. Absent, nothing changes.

- GIVEN `stack.manifest.json` declares a required file the repo lacks WHEN self-verify runs THEN the miss counts in the same drift number as core entries.
- GIVEN no `stack.manifest.json` WHEN self-verify runs THEN output is identical to the pre-stack behavior.

## Open questions

None known.
