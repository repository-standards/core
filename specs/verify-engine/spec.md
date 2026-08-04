# Verify engine

**Spec tier:** buildable
**Serves:** `Standard-bearer Staszek` - drift as a number, per repo; `Owner Olek` - a green run is the assurance he buys; `Coding agent` obeys it as a mechanical gate.
**Status:** live
**Success metric:** Retention - repos that update and return to drift 0 within a release cycle.

## Purpose

[`standard/scripts/self-verify.mjs`](../../standard/scripts/self-verify.mjs) (client path `scripts/self-verify.mjs`) proves a repo still complies with the standard version it is pinned to and reports DRIFT as a number. Mechanical tier only; the judgment tier (are catalogued decisions actually recorded?) stays at PR review.

## Clarifications

### Session 2026-08-04

Retrofitted spec: this capability was built before its spec existed, so there is no clarify
session to record. Every contract here was read off the shipped implementation and the
decisions it cites, and the questions were settled by what already ran rather than by
asking. Written down because the status is now checked against this section, and a `live`
capability with no record of what settled it is the gap that check exists to expose. New
work on this capability goes through the loop.

## Scope

The shipped verifier: manifest loading, version pin, file/content/key/section/guard checks, profiles, skeleton mode, the bounds on recorded exceptions, drift accounting, exit codes.

## Out of scope

Guarding this repo's own shipped tree ([tree-guard](../tree-guard/spec.md)); authoring the manifest's content.

## Core concepts

- **Manifest** - `standard.manifest.json` in cwd, the single source of truth (ADR-005): `version`, `files[]`, `sections[]`, `guards[]`, `decisions[]`, `references[]` (method docs adopted by reference, ADR-023), `exceptions[]`. Entry sets grow by version - a new optional home (e.g. `docs/discovery`, ADR-024) or a new reference arrives as manifest data, never as an engine change.
- **Recorded content** - a `copy` entry's `sha256`: a hex string for a file, a `{ member: hash }` map for a directory, generated in the producing repo and never hand-written. It is what makes existence-checking a `copy` entry meaningful, and it works offline because the hashes travel inside the manifest copy the repo already carries. Hashes are over the file's text with CRLF normalized to LF. A directory member that goes missing is reported the same way as one that changed - a required item quietly removed from a shipped directory (a lifecycle skill, say) is a content FAIL naming it, not a silent pass on the parent directory's own PASS.
- **Declared keys** - a `merge` entry's `requiredKeys`: dotted paths that must be present in the merged result (JSON objects, YAML block mappings). A merge is adapted on purpose, so its bytes are not comparable; the keys are what must survive it. Presence only - a value is the repo's to choose.
- **Drift** - the count of FAIL results; one unmet required entry = one point. Notes and warnings never count. A recorded exception is not drift; it is counted separately and stays in the adoption denominator.
- **Profile** - `core` or `scale` per entry (ADR-011); an entry with no profile counts as core, so pre-ADR-011 manifests check in full under either profile.

## Interface contracts

`node scripts/self-verify.mjs [--version <x.y.z>] [--warn] [--profile core|scale (solo/team as deprecated aliases)] [--skeleton]` - no dependencies (Node built-ins only). Checks, in order:

1. **Manifest load.** Parse `standard.manifest.json` if present; a present-but-unparseable manifest is a FAIL. No manifest at all -> a note plus the built-in fallback skeleton: `AGENTS.md`, `specs/`, `docs/decision-records/` must exist; a backlog at `docs/backlog.md` or `backlog.md`; `node scripts/spec-structure.mjs --block` runs if installed (a note if not).
2. **Recorded state.** `.standards-version` must exist and match `/^\d+\.\d+\.\d+/`; with `--version <target>` it must equal the target; when the manifest carries `version`, the two must agree. `--skeleton` skips the check with a note (the file is written at adoption). The check is mechanical and unchanged; the **wording** is not - "pin" was swept out of every live surface on 2026-08-02 because it named the model [ADR-025](../../docs/decision-records/ADR-025-the-standard-is-living-latest-is-the-target.md) removed. This file is a live surface, and the last four occurrences in the tree were hiding in a JSON description field, a script's usage comment, and the two entry files an agent loads first.
3. **Files.** A `files[]` entry passes when `path` or any `altPaths` entry exists. Required and absent -> FAIL; optional and absent -> note. Under `--skeleton`, an absent entry with `adapt: "fill-from-repo"` is a note: authored at adoption, absent from the skeleton by design.
   - **Content of a `copy` entry.** When the entry carries `sha256` and its primary `path` exists, the local file is hashed (SHA-256 over the text, CRLF normalized to LF) and compared. A file entry produces one result. A directory entry produces **one result for the entry** however many members moved, naming what is missing and what changed - so the arithmetic stays one point per manifest entry, and a repo's own extra files inside a shipped directory are never reported. A mismatch is a FAIL whose wording says *differs from the standard's copy*, distinct from *missing*, and it is waivable by `{ "kind": "content" }`. An entry with no `sha256` is not content-checked, so a manifest from before hashes shipped behaves exactly as it did. This is also what catches a required item quietly removed from a shipped directory (e.g. a lifecycle skill under `.claude/skills`): its member entry in `sha256` goes from present to `missing`, one FAIL naming it - there is no separate presence-only mechanism for directory members, because the hash map already names every member that must exist.
   - **A directory resolved through an `altPath`** is checked by **name**, not by bytes: a ported form (`.agents/skills` for `.claude/skills`, R22) is a different format by design, so every first path segment of the recorded members, extension stripped, must appear somewhere in the ported tree (depth-limited) - a port may be a folder per skill or a file per skill. Absences FAIL, naming them and R22. A file entry resolved through an altPath is noted, not compared. This closes an altPath satisfied by an unrelated directory that happens to sit at that path: a monorepo symlinked `.claude/skills` at its own 31-skill system and reported 100% adopted while carrying none of the standard's procedures.
   - **Declared keys of a `merge` entry.** When the entry carries `requiredKeys` and the file (or an `altPath`) exists, each key produces its own result, like a section. JSON is parsed (an unparseable file is one FAIL, not a crash); YAML is read by a deliberately small block-mapping scanner - indentation-stacked `key:` lines, with sequence items and flow mappings out of scope. Keys declared on a file that is neither JSON nor YAML FAIL against the manifest entry, not the repo. Values are never inspected. The same code path serves `stack.manifest.json` entries, which is where Layer 2's supply-chain keys land.
4. **Sections.** A `sections[]` entry passes when its `file` contains a heading matching `new RegExp("^#{1,6}\\s+.*" + escapeRe(heading), "mi")` - any heading level, any prefix before the heading text, case-insensitive. A missing `file` with `required` is a FAIL ("cannot be checked").
5. **Guards.** Each `guards[]` entry runs via `execSync(g.run)` with output captured. Skips: `id === "self-verify"` (never recurse into itself); `kind === "diff"` -> note (runs in CI on the PR diff, not here); a `scripts/<name>.mjs` path extracted from `run` that does not exist -> note (not installed - skipped); under `--skeleton` all guards are skipped with a single note. A non-zero guard FAILs with its output indented.
6. **Profiles.** `--profile core` checks core entries only across files/sections/guards and notes how many scale-only entries were skipped; `--profile scale` checks everything. With no flag, the repo's manifest copy's top-level `profile` field (written at align time, ADR-011) is the default - a note names it - and absent that, `scale`. `solo`/`team` are accepted as deprecated aliases.
7. **Stray transition skills.** `align-to-standards`, `onboard-repo`, `modernize`, `greenfield-start` found under `.claude/skills/` each produce a WARN (a hand-copy mistake, delete it - ADR-009), never drift.
8. **Surviving placeholders.** Outside `--skeleton`, each of `AGENTS.md`, `README.md`, `SECURITY.md`, `docs/PRINCIPLES.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/personas.md`, `docs/backlog.md` that exists is scanned for three shapes the templates ship - `{{TOKEN}}`; an angle-bracket marker whose content starts with a letter in **any script** and holds letters, digits, spaces, `'`, `.`, `_`, `+` or `-`; and a table row whose every cell is an ellipsis (the shape the shipped `AGENTS.md` and `ARCHITECTURE.md` use for "your rows go here") - and produces one WARN each. Excluded from the angle-bracket form, because they are markup rather than something to fill: content with `:`, `/` or `=` (markdown autolinks, HTML attributes, closing tags), and a single-word token naming an HTML element (`<picture>`, `<code>`, `<kbd>`). A row of **empty** cells is deliberately not matched by the ellipsis form, because an empty table is a legitimate state and a warning it cannot clear is one everybody learns to skip. Never drift: drift 0 with empty shells is a hollow win, but substance stays the judgment tier's call. Reading any script is load-bearing - an ASCII-only pattern let a translated, unfilled shell (`<角色名>`) reach drift 0 looking complete.

   **Fenced blocks and inline code spans are stripped before the scan**, and the convention that makes this precise is normative for the templates: *angle brackets in prose mean replace me; angle brackets inside code formatting are notation.* Without the strip the warning is unclearable - generic notation like `specs/<capability>` is what a correctly filled repo keeps, and the shipped `AGENTS.md` carries it in its own altitude ladder, so the one file the check exists for could never satisfy it. The accepted cost is that a genuine marker written inside backticks goes unseen; the shipped templates therefore keep fill markers in prose.
9. **Decisions.** A non-empty `decisions[]` produces one note (judgment tier, confirmed recorded at review) - never checked mechanically.
10. **References.** A non-empty `references[]` produces one note naming the count (method docs read in the standards repo at latest - the living standard, ADR-023/025) - never a file check; a `files[]` entry with `adapt: "reference"` is likewise noted and skipped, never existence-checked.

11. **Recorded exceptions (R17).** `exceptions[]` waives a required miss: `file` (the entry), `section` (`<file>#<heading>`), `content` (a copy-class path, or one member inside a shipped directory), `key` (`<file>#<key.path>`). Consulted only when a check has already failed, so an exception cannot mask a passing check and a redundant one is detectable. The hatch is bounded, and each violation is a FAIL rather than a silently ignored line: an unknown `kind` (there is deliberately no `guard` kind), an entry with no `reason`, or a `kind: "file"` whose match is a guard's own script - which would convert "required file missing" into "check silently skipped", the one shape that removes a blocking check while reporting drift 0. `kind: "content"` on a guard script is allowed: the guard still runs and must pass. A `content` match MAY end in `/**` to scope a subtree, for a repo that rewrote a whole shipped directory; only that kind, because a subtree waiver on presence would sweep every guard's required-file check. An exception that matched nothing produces a WARN.
12. **Existence is case-exact.** Every check resolves a path through cached directory listings rather than `existsSync`, which is case-insensitive on macOS and Windows - `readme.md` satisfied `README.md` on one contributor's machine and failed on Linux CI from the same commit.

Output: header `self-verify - compliance with manifest <version>` (or `the BUILT-IN SKELETON (no standard.manifest.json here)`), one `PASS | FAIL | WARN | ....` row per result (`<tag>  <name padded to 10>` then a space, then `<msg>` - the separator is unconditional because a name exactly filling the column used to run into its own message, `reference9 method docs`), then the verdict.

Drift arithmetic: one point per unmet required check. That is one point per manifest entry except for `.standards-version`, which scores two - once as the version pin, once as the required file - because a repo without it has both failed to record which version it follows and failed to carry the file that says so. A copy-class directory scores one for the entry however many members are missing or changed.

Adoption arithmetic: `applicable` counts every non-warning result that is either a real check or an excepted one; `adopted = applicable - drift - excepted`. **An excepted entry stays in the denominator and is not adopted**, so excepting can only lower the percentage. It used to leave the denominator entirely, which made the percentage rise as the standard was discarded: 13 `file` exceptions reported `100% adopted (32/32)` on a tree whose intact form counted 49. Counting an exception as adopted would encode the same claim the other way - a decision not to carry something is not carrying it. The exception count is printed in the summary line always, including zero. Absent a manifest, the verdict names the built-in skeleton as the yardstick, because the same output format with a much smaller denominator otherwise reads as a manifest measurement (three real unaligned repos reported drift 4-5 where the manifest gives 13-15).

### Exit codes and verdicts

| Condition | Verdict | Stream | Exit |
|---|---|---|---|
| drift 0 | `self-verify: OK - drift 0 - <pct>% adopted (<a>/<n>), <e> excepted - compliant with the standard` | stdout | 0 |
| drift > 0 | `self-verify: drift <n> - <pct>% adopted (<a>/<n>), <e> excepted - <n> required entr(y/ies) unmet` | stderr | 1 |
| drift > 0, `--warn` | same drift line | stderr | 0 |
| `--version X` and pin != X | counted as a version FAIL, drifts as above | stderr | 1 |

## Requirements

- The verifier MUST report every result before exiting - never stop at the first failure.
- The verifier MUST live at `scripts/self-verify.mjs` in a consuming repo and run from the repo root.
- `--warn` MUST only change the exit code, never the reported drift.
- The verifier MUST compare a `copy` entry's content against the hash the manifest records, and MUST distinguish that failure from absence in its wording.
- The verifier MUST state, in the verdict line, when the yardstick was the built-in skeleton rather than a manifest.

## Invariants

- The exit code MUST be 0 if and only if drift is 0 or `--warn` is set.
- `--skeleton` MUST NOT execute any guard and MUST NOT require the version pin.
- The verifier MUST NOT recurse into itself via the manifest's own `self-verify` guard entry.
- Warnings and notes MUST NOT add to drift.
- Adding an exception MUST NOT raise the reported adoption percentage, and MUST NOT remove a check from the denominator.
- A guard's own script MUST NOT be waivable by any mechanism that stops the guard from running.
- Path existence MUST be decided case-exactly, so the same repository state produces the same verdict on every filesystem.
- A `sha256`-less entry MUST behave exactly as it did before content checking existed, so an older manifest copy still verifies.

## Acceptance criteria

- **Green repo.** GIVEN a repo meeting every required manifest entry with a matching pin WHEN run with no flags THEN drift is 0 and exit is 0.
- **Pin mismatch.** GIVEN `.standards-version` is `0.7.1` WHEN run with `--version 0.7.2` THEN a version FAIL is reported and exit is 1.
- **Manifest/pin split.** GIVEN manifest `version: 0.8.0` and pin `0.7.2` WHEN run THEN a FAIL says the manifest must match the pin.
- **Warn mode.** GIVEN drift 3 WHEN run with `--warn` THEN the drift line still prints and exit is 0.
- **Skeleton.** GIVEN the pristine shipped tree WHEN run with `--skeleton` THEN the pin is a note, fill-from-repo files are notes, no guard executes, no placeholder scan runs, and exit is 0.
- **Placeholder still in the entry file.** GIVEN an adopted repo whose `AGENTS.md` still opens `# AGENTS.md - <repo> agent and contributor guide` WHEN self-verify runs without `--skeleton` THEN a WARN names the file, and drift is unchanged - lower case must be caught exactly like `<Repo>`.
- **Autolink is not a placeholder.** GIVEN a scanned file containing `<https://example.com>` and no template token WHEN self-verify runs THEN no placeholder WARN is raised for it.
- **Notation in a code span is not a placeholder.** GIVEN a fully filled `README.md` containing `` `specs/<capability>/spec.md` `` and no marker in prose WHEN self-verify runs THEN no placeholder WARN is raised for it - the warning must be clearable by a repo that filled everything.
- **Notation in a fenced block is not a placeholder.** GIVEN a filled file whose fenced altitude ladder contains `specs/<capability>` WHEN self-verify runs THEN no placeholder WARN is raised for it.
- **A prose placeholder still warns.** GIVEN a file containing `<team name>` outside any code formatting WHEN self-verify runs THEN it raises the placeholder WARN - a strip that silenced the check would satisfy the two cases above and fail this one.
- **HTML markup is not a placeholder.** GIVEN a filled `README.md` using `<picture>`, `<source>`, `<details>`, `<code>` and `<kbd>` WHEN self-verify runs THEN no placeholder WARN is raised - the shape is identical to `<repo>`, and warning on a file the standard never wrote gives an adopter nothing to do.
- **A placeholder in any script warns.** GIVEN a file containing `<角色名>` or `<нужно заполнить>` outside code formatting WHEN self-verify runs THEN it raises the placeholder WARN - a translated, unfilled shell must not read as complete.
- **Notation alongside a real marker still warns.** GIVEN a file carrying both `` `specs/<capability>/` `` and a prose `<team name>` WHEN self-verify runs THEN the WARN is raised.
- **An unfilled table row warns; an empty one does not.** GIVEN a filled file whose table still carries `| ... | ... |` WHEN self-verify runs THEN the WARN is raised; GIVEN the same file with real rows and one all-empty row THEN it is not.
- **Core profile.** GIVEN a manifest with scale-only entries WHEN run with `--profile core` THEN those entries are skipped and their count appears as a note.
- **Persisted profile.** GIVEN the manifest copy carries `"profile": "core"` WHEN run with no flag THEN core is the applied profile (a note says so); a CLI `--profile` flag overrides it.
- **Recursion guard.** GIVEN the manifest lists guard `id: "self-verify"` WHEN guards run THEN that entry is skipped.
- **Stray skill.** GIVEN `.claude/skills/align-to-standards/` exists WHEN run THEN a WARN names it and drift is unchanged.
- **References are not files.** GIVEN the manifest carries `references[]` and none of the referenced paths exist in the repo WHEN run THEN drift is unchanged (one note, zero file checks).
- **Manifest data grows without the engine.** GIVEN a new `references[]` (or `files[]` / `sections[]`) entry is added to the manifest and no engine source changes WHEN run THEN the note's count follows the manifest and every other result is unchanged - manifest content is data, and only a change to how an entry is *interpreted* is an engine change.
- **Failing guard.** GIVEN a static guard exits non-zero WHEN run THEN its captured output prints indented under the FAIL and exit is 1.
- **Changed copy file.** GIVEN `.nvmrc` is present but its content is not the standard's WHEN run THEN drift rises by one and the message says *differs from the standard's copy*.
- **Incomplete shipped directory.** GIVEN 19 of the 20 skills are present WHEN run THEN drift rises by one and the missing member is named.
- **Sham update.** GIVEN the recorded version and the manifest move to a newer version and no file changes WHEN run THEN the content check fails - a bump with nothing behind it is not compliance.
- **Ported directory.** GIVEN `.claude/skills` is absent and `.agents/skills` holds an unrelated skill system WHEN run THEN drift rises by one naming what the port lacks; GIVEN the port carries every shipped name THEN one note, no drift, bytes never compared.
- **Declared key missing.** GIVEN a merge-class JSON or YAML file exists without a key its entry declares WHEN run THEN drift rises by one per missing key, naming the key path.
- **Stack keys.** GIVEN `stack.manifest.json` declares `requiredKeys` on a YAML file WHEN run THEN those keys are checked in the same code path and the same drift number.
- **Guard script exception.** GIVEN `exceptions` carries `{ "kind": "file", "match": "scripts/spec-structure.mjs" }` WHEN run THEN it is refused as a FAIL and the deleted guard still counts.
- **No guard kind.** GIVEN `exceptions` carries `{ "kind": "guard" }` WHEN run THEN it is a FAIL naming the valid kinds, never a silent no-op.
- **Reasonless exception.** GIVEN an exception with no `reason` WHEN run THEN it is a FAIL and the underlying miss still counts.
- **Exception arithmetic.** GIVEN a required entry is absent and excepted WHEN run THEN drift is unchanged from a clean run, the exception count is 1, and the percentage is not higher than the clean run's.
- **Zero exceptions.** GIVEN no exceptions WHEN run THEN the summary still states `0 excepted`.
- **Stale exception.** GIVEN an exception whose entry is met anyway WHEN run THEN a WARN says so and drift is unchanged.
- **No manifest.** GIVEN no `standard.manifest.json` WHEN run THEN a WARN and the verdict line both name the built-in skeleton as the yardstick.
- **Case-only difference.** GIVEN `AGENTS.md` exists as `Agents.md` WHEN run on a case-insensitive filesystem THEN it is reported missing, exactly as on Linux.

### Stack manifest merge

When `stack.manifest.json` exists beside `standard.manifest.json` (a repo that
adopted a registered stack - ADR-016), self-verify notes it (`stack` row naming
the technology only - the linkage is the registry pointer; nothing version-shaped
is read or reported, ADR-022) and concatenates its `files`,
`sections`, `guards` **and `exceptions`** entries into the core manifest's before
checking - one drift number across both layers, and one exception mechanism: a
deviation recorded in the stack manifest (which is what a stack's own adaptation
guide tells an adopter to do) is honoured exactly like one recorded in the core
manifest, bounded by the same rules (11). An unparseable stack manifest is a
FAIL, like the core one. Absent, nothing changes.

- GIVEN `stack.manifest.json` declares a required file the repo lacks WHEN self-verify runs THEN the miss counts in the same drift number as core entries.
- GIVEN `stack.manifest.json` declares an `exceptions` entry waiving one of its own required misses WHEN self-verify runs THEN the miss is excepted, not counted as drift, exactly as a core-manifest exception would be.
- GIVEN no `stack.manifest.json` WHEN self-verify runs THEN output is identical to the pre-stack behavior.

## Open questions

None known.
