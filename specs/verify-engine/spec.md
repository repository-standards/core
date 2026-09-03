# Verify engine

**Spec tier:** buildable
**Serves:** `Standard-bearer Staszek` - drift as a number, per repo; `Owner Olek` - a green run is the assurance he buys; `Coding agent` obeys it as a mechanical gate.
**Status:** live
**Success metric:** Retention - repos that update and return to drift 0 within a release sprint.

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

### Session 2026-09-03

Retrofitted addendum, same reason as above: `checkWorkflowBranches()` (the WARN for a shipped
workflow whose `branches:` trigger cannot fire on this repo's actual default branch) already
shipped and already had a validation case (`GATE-42`), but was never listed among the numbered
checks below - the gap surfaced while fixing `ADOPT-DEFAULTS-1`'s dashboard-workflow default
(removing `dashboard.yml`'s push trigger touched this function's own comment, and the comment
was the only place any of this was written down). Recorded as step 2b below rather than folded
into an existing step, because it runs over every shipped workflow file, not one entry class.

### Session 2026-09-03 (NEEDS-REVIEW-2)

Not a retrofit: [ADR-057](../../docs/decision-records/ADR-057-a-drafted-artifact-says-so-at-the-top.md),
revised by [ADR-058](../../docs/decision-records/ADR-058-one-marker-says-a-human-has-not-looked-yet.md),
is this addition's clarify record. A `suggest` or `stub` answer now opens its artifact with a
`[NEEDS REVIEW]` marker; this engine's part is counting how many are still in the tree and
reporting that next to the adoption percentage, without moving the percentage itself
(ADR-038 - structure is what the number measures). The scan reuses the three file sets step 8
already walks (fill-from-repo entries plus the fixed floor, decision records, capability
specs) rather than building a fourth list, because those are the only places the marker is
ever written. Recorded as step 8c below. Validating that a marker's named backlog row exists
is [elicitation](../elicitation/spec.md)'s check, not this one - this engine counts, it does
not cross-reference the backlog.

## Scope

The shipped verifier: manifest loading, version pin, file/content/key/section/guard/removed-path checks, profiles, skeleton mode, the bounds on recorded exceptions, drift accounting, exit codes.

## Out of scope

Guarding this repo's own shipped tree ([tree-guard](../tree-guard/spec.md)); authoring the manifest's content.

The manifest's `provenanceCommit` ([ADR-052](../../docs/decision-records/ADR-052-alignment-tracks-a-provenance-commit-not-a-version-string.md)) is written and read by `update-to-latest` to compute a delta; this engine never reads it. Deciding compliance from a commit SHA would need the standards repo's history, and the check is offline by design.

## Core concepts

- **Manifest** - `standard.manifest.json` in cwd, the single source of truth (ADR-005): `version`, `files[]`, `sections[]`, `guards[]`, `decisions[]`, `references[]` (method docs adopted by reference, ADR-023), `exceptions[]`. Entry sets grow by version - a new optional home (e.g. `docs/discovery`, ADR-024) or a new reference arrives as manifest data, never as an engine change.
- **Recorded content** - a `copy` entry's `sha256`: a hex string for a file, a `{ member: hash }` map for a directory, generated in the producing repo and never hand-written. It is what makes existence-checking a `copy` entry meaningful, and it works offline because the hashes travel inside the manifest copy the repo already carries. Hashes are over the file's text with CRLF normalized to LF. A directory member that goes missing is reported the same way as one that changed - a required item quietly removed from a shipped directory (a lifecycle skill, say) is a content FAIL naming it, not a silent pass on the parent directory's own PASS.
- **Declared keys** - a `merge` entry's `requiredKeys`: dotted paths that must be present in the merged result (JSON objects, YAML block mappings). A merge is adapted on purpose, so its bytes are not comparable; the keys are what must survive it. Presence only - a value is the repo's to choose.
- **Drift** - the count of FAIL results; one unmet required entry = one point. Notes and warnings never count. A recorded exception is not drift; it is counted separately and stays in the adoption denominator.
- **Not run** - a check whose prerequisites were absent, so it never started. Neither drift nor adoption: it measured nothing, and folding it into either makes a number about the repo carry an answer about the machine. Reported as `SKIP`, counted in the verdict line by id.
- **Declared prerequisite** - a `guards[]` entry's `requires`: `{ "kind": "command"|"path", "match": "...", "hint"?: "..." }`. `command` resolves on `PATH`; `path` resolves in the repo. The second kind is what keeps a compliance check side-effect free - a package manager present with its dependency tree absent installs it when the guard runs, so the guard must not run.
- **Profile** - `core` or `scale` per entry (ADR-011); an entry with no profile counts as core, so pre-ADR-011 manifests check in full under either profile.

## Data contracts

The engine persists nothing and writes no file: it reads, reports and exits. Everything it
reads sits at the root of the repo being verified.

| Input | Required | Format | Shape |
|---|---|---|---|
| `standard.manifest.json` | no (a note plus the fallback skeleton when absent) | JSON | the align-engine manifest (ADR-005). Its entry classes are in Core concepts above and each field's meaning in Interface contracts below; the manifest's own `$about` is the authored description of the schema. |
| `stack.manifest.json`, and `stack.<technology>.manifest.json` for a repo whose stacks coexist | no | JSON | the same schema at Layer 2 (ADR-016/022/037), plus `technology` - the stack's name, used in the report. Matched by `/^stack(?:\.[A-Za-z0-9][A-Za-z0-9._-]*)?\.manifest\.json$/` at the repo root and read in filename order. Only `files`, `sections`, `guards` and `exceptions` are merged into the core manifest's arrays; every other field is the stack's own. |
| `.standards-version` | yes, outside `--skeleton` | text, one line | `x.y.z` - the version the repo last aligned to, a bookmark rather than a pin (ADR-025). Matched with `/^\d+\.\d+\.\d+/`, so a trailing note on the line is tolerated. |
| every path a manifest entry names | per entry | any | read as text when the entry records a hash or declares keys; otherwise only its existence, and its case, are read. |

Two values are content rather than structure, and both travel inside the manifest the repo
already carries - which is what lets the check run offline, against the version the repo
aligned to, with no second source of truth:

- **`sha256`** - SHA-256 over the file's text with CRLF normalized to LF, hex, lower case.
  A string for a file entry; a `{ "<member path>": "<hash>" }` map for a directory entry,
  where the member path is relative to the entry's `path`.
- **`requiredKeys`** - dotted key paths (`on.pull_request`, `permissions.deny`), presence
  only. A value is the repo's to choose, and is never compared.

## Interface contracts

`node scripts/self-verify.mjs [--version <x.y.z>] [--warn] [--profile core|scale (solo/team as deprecated aliases)] [--skeleton]` - no dependencies (Node built-ins only). Checks, in order:

1. **Manifest load.** Parse `standard.manifest.json` if present; a present-but-unparseable manifest is a FAIL. No manifest at all -> a note plus the built-in fallback skeleton: `AGENTS.md`, `specs/`, `docs/decision-records/` must exist; a backlog at `docs/backlog.md` or `backlog.md`; `node scripts/spec-structure.mjs --block` runs if installed (a note if not).
   - **Stack manifests**, when the core manifest loaded: every root file matching the stack-manifest pattern is read in filename order, each producing a note naming the file and its `technology`, and each merged into the same four arrays - so a repo running two stacks permanently registers both and still reports one drift number ([ADR-037](../../docs/decision-records/ADR-037-a-repo-may-register-more-than-one-stack.md)). An unparseable one is a FAIL naming the file, never a silent skip. Two stacks declaring the same `files[].path` produce a WARN naming both files: the entry is checked once per declaration and counts twice, and collapsing them would mean picking a winner between two upstream repos this one does not own.
2. **Recorded state.** `.standards-version` must exist and match `/^\d+\.\d+\.\d+/`; with `--version <target>` it must equal the target; when the manifest carries `version`, the two must agree. `--skeleton` skips the check with a note (the file is written at adoption). The check is mechanical and unchanged; the **wording** is not - "pin" was swept out of every live surface on 2026-08-02 because it named the model [ADR-025](../../docs/decision-records/ADR-025-the-standard-is-living-latest-is-the-target.md) removed. This file is a live surface, and the last four occurrences in the tree were hiding in a JSON description field, a script's usage comment, and the two entry files an agent loads first. That usage comment illustrated the flag with the version the standard happened to be on (`--version 1.0.1`), which is a restatement wearing an example's clothes: nothing read it, nothing checked it, and a release had to remember to move it. It reads `--version x.y.z` now, as this line always has ([ADR-056](../../docs/decision-records/ADR-056-the-release-tag-is-made-by-ci-and-the-version-is-stated-once.md)).
2b. **Workflow branch triggers.** Before the files loop, every shipped `.github/workflows/*.yml`
   or `.yml` entry present on disk (via `path` or an `altPath`) is scanned for `branches: [...]`
   lines. When the repo's default branch is readable (`git symbolic-ref --short refs/remotes/origin/HEAD`)
   and a matched trigger names branches that do not include it, a WARN names the file, the
   branch(es) it triggers on and the repo's actual default branch. Never drift: the file is
   merge-class and the branch name is exactly the local adaptation an adopter is expected to
   make - the manifest's `requiredKeys` can only assert that `on.push` or `on.pull_request`
   exists, never what it names, so a `master`-default repo taking a shipped `branches: [main]`
   workflow verbatim used to reach drift 0 with a trigger that can never fire, and nothing
   anywhere said so. Silent when the default branch cannot be read (no remote, no git at all) -
   guessing from the checked-out branch would fire on every feature branch instead of measuring
   the repo. A shipped workflow that carries no `branches:` line at all (`dashboard.yml`, which
   ships `workflow_dispatch` only) has nothing here to warn about.

3. **Files.** A `files[]` entry passes when `path` or any `altPaths` entry exists. Required and absent -> FAIL; optional and absent -> note. Under `--skeleton`, an absent entry with `adapt: "fill-from-repo"` is a note: authored at adoption, absent from the skeleton by design.
   - **Content of a `copy` entry.** When the entry carries `sha256` and its primary `path` exists, the local file is hashed (SHA-256 over the text, CRLF normalized to LF) and compared. A file entry produces one result. A directory entry produces **one result for the entry** however many members moved, naming what is missing and what changed - so the arithmetic stays one point per manifest entry, and a repo's own extra files inside a shipped directory are never reported. A mismatch is a FAIL whose wording says *differs from the standard's copy*, distinct from *missing*, and it is waivable by `{ "kind": "content" }`. An entry with no `sha256` is not content-checked, so a manifest from before hashes shipped behaves exactly as it did. This is also what catches a required item quietly removed from a shipped directory (e.g. a lifecycle skill under `.claude/skills`): its member entry in `sha256` goes from present to `missing`, one FAIL naming it - there is no separate presence-only mechanism for directory members, because the hash map already names every member that must exist.
   - **A directory resolved through an `altPath`** is checked by **name**, not by bytes: a ported form (`.agents/skills` for `.claude/skills`, R22) is a different format by design, so every first path segment of the recorded members, extension stripped, must appear somewhere in the ported tree (depth-limited) - a port may be a folder per skill or a file per skill. Absences FAIL, naming them and R22. This closes an altPath satisfied by an unrelated directory that happens to sit at that path: a monorepo symlinked `.claude/skills` at its own 31-skill system and reported 100% adopted while carrying none of the standard's procedures.
   - **A file resolved through an `altPath`** is compared by hash, exactly as it would be at its own path - PASS naming the standing-in path, or a FAIL waivable by `{ "kind": "content" }` against the entry's `path`. A directory may be a port because a ported form is a different format by design; a file may not, because an altPath names a different *location* for the standard's file rather than permission for a different file. This was the same coincidence one entry-shape over: the entry resolved, nothing was compared, and the run said so in a dim note that reads like a pass.
   - **Declared keys of a `merge` entry.** When the entry carries `requiredKeys` and the file (or an `altPath`) exists, each key produces its own result, like a section. JSON is parsed (an unparseable file is one FAIL, not a crash); YAML is read by a deliberately small block-mapping scanner - indentation-stacked `key:` lines, with sequence items and flow mappings out of scope. Keys declared on a file that is neither JSON nor YAML FAIL against the manifest entry, not the repo. Values are never inspected. The same code path serves `stack.manifest.json` entries, which is where Layer 2's supply-chain keys land.
4. **Sections.** A `sections[]` entry names a `file` and resolves it the same way the files check does: `file` first, then the `altPaths` declared on the `files[]` entry of that same path. The heading passes when the resolved file contains one matching `new RegExp("^#{1,6}\\s+.*" + escapeRe(heading), "mi")` - any heading level, any prefix before the heading text, case-insensitive. Absent from every declared path and `required` is a FAIL ("cannot be checked"). The pass and fail messages name the resolved path, so a reader opens the file that was actually read; the exception key stays `<file>#<heading>` on the canonical name, so a recorded deviation matches wherever the file lives. Reading only the primary name made a repo carrying its changelog at the entry's own declared alternate pass the file entry and fail its section as missing - an unearned drift with no way to close it except abandoning the alternate the entry exists to permit.
4b. **Removed paths (ADR-052).** Each `removedPaths[]` entry names a `path` the standard has taken away, the `since` release that took it, and a `note` saying what replaced it or what to migrate first. The entry passes when the path does not exist and FAILs when it does, quoting `since` and the note so the message says what to do rather than only what is wrong. It is an **unconditional existence check**: it reads nothing but the manifest the repo already carries - no provenance commit, no history, no second tree - so a repo that never had the path passes it for free, and a repo that skipped the release carrying the removal fails until the path is gone. Resolution is case-exact and by name, so a directory is decided exactly as a file is. Waivable by `{ "kind": "file" }` against the path, like any other required-entry miss, for a repo that deliberately keeps it. This is the half of an update that used to be instruction only: `update-to-latest` told a repo to delete a removed path and nothing afterwards checked that it happened, so a skipped or half-applied update kept the stale file forever at drift 0.
5. **Guards.** Each `guards[]` entry runs via `execSync(g.run)` with output captured. Skips: `id === "self-verify"` (never recurse into itself); `kind === "diff"` -> note (runs in CI on the PR diff, not here); under `--skeleton` all guards are skipped with a single note. A non-zero guard FAILs with its output indented.
   - **A guard that could not run at all is NOT RUN, not drift.** Two ways it is decided, both before `execSync`: a `scripts/<name>.mjs` path extracted from `run` that does not exist (optional guards legitimately are not installed), and an absent prerequisite - each `requires` entry that does not resolve, plus every bare word in `run` that is no shell builtin and resolves nowhere on `PATH`. The result is `SKIP`: not a pass, not a failure, outside both numbers, and named in the verdict line so a blocking check cannot go missing quietly. It used to be a dim note for the script case and a plain FAIL for the tool case, which is the defect: `pnpm check:all` with no `pnpm` on `PATH` printed `drift 1 - 99% adopted (78/79)`, byte for byte what three real lint errors print on a compliant repo, so one number answered two questions. Inference errs toward running the guard, in every direction it can be wrong, because the wrong answer is a check that quietly stops running: single- and double-quoted text is blanked before the string is split on `;`, `&&`, `|`, `&`, so a word inside an error message is never probed; words carrying a `/` are left to the script rule; leading `VAR=value` assignments are stripped; the `node` executing the file is never probed, since a runtime invoked by absolute path from outside `PATH` would otherwise silence every guard at once; and `a || b` is read as a **fallback** rather than two requirements - a group is reported only when *every* alternative is a plain name that resolves nowhere, so one unclassifiable alternative (a builtin, a redirect, a quoted remnant) satisfies it. A `requires` entry with an unknown kind or an empty match is a FAIL, for the same reason a malformed exception is: a prerequisite nobody can evaluate stops a blocking guard while the run still reads green.
6. **Profiles.** `--profile core` checks core entries only across files/sections/guards and notes how many scale-only entries were skipped; `--profile scale` checks everything. With no flag, the repo's manifest copy's top-level `profile` field (written at align time, ADR-011) is the default - a note names it - and absent that, `scale`. `solo`/`team` are accepted as deprecated aliases.
7. **Stray transition skills.** `align-to-standards`, `onboard-repo`, `modernize`, `greenfield-start` found under `.claude/skills/` each produce a WARN (a hand-copy mistake, delete it - ADR-009), never drift.
8. **Surviving placeholders.** Outside `--skeleton`, the scanned set is **the manifest's `fill-from-repo` file entries, union a fixed floor** of `AGENTS.md`, `README.md`, `SECURITY.md`, `docs/PRINCIPLES.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/personas.md`, `docs/backlog.md`. It was previously that floor alone, which is a second source of truth beside the manifest: `CONTRIBUTING.md` is a fill-from-repo entry, was not on it, and so was scanned by nothing. The floor is kept rather than replaced because a repo with no manifest has nothing to derive from, and deriving alone would stop scanning the roster and the product pages on exactly the repos least likely to have filled them in. Each such file is scanned for three shapes the templates ship - `{{TOKEN}}`; an angle-bracket marker whose content starts with a letter in **any script** and holds letters, digits, spaces, `'`, `.`, `_`, `+` or `-`; and a table row whose every cell is an ellipsis (the shape the shipped `AGENTS.md` and `ARCHITECTURE.md` use for "your rows go here") - and produces one WARN each. Excluded from the angle-bracket form, because they are markup rather than something to fill: content with `:`, `/` or `=` (markdown autolinks, HTML attributes, closing tags), and a single-word token naming an HTML element (`<picture>`, `<code>`, `<kbd>`). A row of **empty** cells is deliberately not matched by the ellipsis form, because an empty table is a legitimate state and a warning it cannot clear is one everybody learns to skip. Never drift: drift 0 with empty shells is a hollow win, but substance stays the judgment tier's call. Reading any script is load-bearing - an ASCII-only pattern let a translated, unfilled shell (`<角色名>`) reach drift 0 looking complete.

   **Every decision record is scanned as well**, and with a deliberately narrower rule: the two shapes that are never anything else - `{{TOKEN}}` and the all-ellipsis table row - and **not** the angle-bracket form. A record is found under `docs/decision-records/` at any depth by filename (`(ADR|BDR)-<digits>-<rest>.md`), not by directory, because the layout is the repo's choice - the shipped `adr/` + `bdr/` split or one flat folder, the same two shapes `decision-records-check.mjs` detects - and that pattern also decides what is *not* scanned: `_template.md` and each stream's `README.md` never match it, and a template is supposed to carry placeholders. The token this exists to reach is the record templates' own `| **Author** | {{AUTHOR}} |` row: no generator fills it, so an unsubstituted author reached drift 0 on every record ever written. The angle form is excluded because the "angle brackets in prose mean replace me" convention below governs shells this standard wrote, and a record is the repo's own writing: records quote paths and agent utterances in prose, and the full pattern fires on 2 of this project's own 33 records (`<standard>@<version>` and `<technology>`, both inside quoted example dialogue, neither an unfilled anything). The accepted cost is an unfilled `<short title of the decision>` in a record heading going unwarned here - that one is visible in the filename and the index row, while the author row is the one that survives unnoticed.

   **All four of markdown's code forms are stripped before the scan** - fenced blocks, indented blocks, and inline spans of any backtick-run length, including a span that wraps a line break - and the convention that makes this precise is normative for the templates: *angle brackets in prose mean replace me; angle brackets inside code formatting are notation.* **HTML comments are stripped on the same reasoning**: a comment is guidance addressed to whoever fills the file, never content the file claims, and several shipped templates put their drafting note in one and write `<date>` or `<ID>` inside it to show the shape wanted. Read as prose, that note is an unfilled placeholder on a document its owner has finished, clearable only by deleting the standard's own instructions - which is what the first adopter to meet it did. The angle form alone is affected: `{{TOKEN}}` is read from the raw body, so a mustache marker inside a comment still warns, and the asymmetry is the point - the angle form doubles as notation and the mustache form never does. Without the strip the warning is unclearable - generic notation like `specs/<capability>` is what a correctly filled repo keeps, and the shipped `AGENTS.md` carries it in its own altitude ladder, so the one file the check exists for could never satisfy it. Three boundaries are load-bearing, each of them the difference between a warning that is unclearable and one that is silent:
   - A span may cross a newline but **never a blank line**, so an unmatched backtick cannot swallow the rest of the file.
   - A span's delimiter is a **run** of backticks closed by an equal run, because the `` `x` `` form (how markdown shows a backtick) otherwise leaves an odd delimiter behind and shifts every later span by one position.
   - An indented run is code **only when the line introducing it is not a list item**: four spaces under a bullet is a continuation paragraph, and a real marker written there must still warn.

   The accepted cost is that a genuine marker written inside backticks goes unseen; the shipped templates therefore keep fill markers in prose.

   **Two forms are matched against the raw file instead**, because relying on the convention alone silently passed three of the eight files listed above: the shipped `SECURITY.md` wrote its contact marker inside backticks and `docs/personas.md` wrote its roster marker the same way, so a fake security contact and an empty persona roster both reached drift 0. The two are (a) the mustache marker, narrowed to `{{UPPER_SNAKE}}` so that a CI expression a filled README legitimately quotes is not one, and (b) a shipped template's own **banner** - a blockquote opening `**Template`, which instructs the reader to rewrite the file and delete the note. The banner form exists because `docs/PRINCIPLES.md` carries no marker of any other kind, so nothing fired on it at all, while its own text says that shipping it unread adopts commitments nobody agreed to. Deleting the note, as it instructs, clears the warning.

   **What drift 0 does not say** is measured in the same pass. Outside `--skeleton`, `specs/` is walked (depth 3) for capability specs - `specs/<capability>/<file>.md`, the same shape `spec-structure.mjs` holds them to, excluding templates, READMEs and the spec engine's ephemeral `plan.md` / `tasks.md` / `checklists/` artifacts (ADR-010). When there are none, one WARN says so and the drift-0 verdict line carries the caveat in the same breath as the number. Never drift, and that is the design, not a softening: a raw greenfield tree plus `.standards-version`, a `profile` key and an empty `specs/capability-map.json` reaches `drift 0 - 100% adopted - compliant with the standard` with nothing specified, so the number was right and the sentence was not. The greenfield walk scaffolds in step 1 and specifies in step 6, and step 1 promises the scaffold passes; scoring the gap would put drift 0 out of reach of an honest new repo for the length of the interview, and a failure nobody can clear is one everybody learns to route around.
8b. **Visibly unfilled authored files (ADR-038).** A `fill-from-repo` entry carries neither a `sha256` nor `requiredKeys` and cannot carry either - the adopter writes the content, so there is nothing to compare it against - which means it scores on presence. Measured: six files whose whole body is `# Title` and `TODO.` moved a sparse repo from `21% adopted (5/24)` to `37% adopted (11/30)` with drift and real substance unchanged. So each scanned file carrying no template placeholder is checked for two further shapes, both WARN and **never drift**: a body with no content beyond its headings, and a body whose entire content is a marker meaning nobody has written this yet (`TODO`, `TBD`, `FIXME`, `XXX`, `N/A`, `WIP`, `coming soon`, `to be written` and their spellings). Headings, HTML comments, list markers, code spans and fenced blocks are removed before the comparison.

   The boundary is **"visibly nothing written", never "not enough written"**, and that is normative rather than an implementation detail: a required-sections check converts substance into ceremony the moment an adopter adds the heading and writes `TODO` beneath it, and a length threshold fails a genuine two-sentence `SECURITY.md` while passing a padded one. Both shapes above are cleared by writing one real sentence. When any such warning is raised, the **verdict line MUST state that the percentage counts entries present, not substance written** - the adopted percentage is a structural reading, and whether what is written is any good stays the judgment tier's call.

8c. **What still waits on a human (ADR-057, revised by ADR-058).** Outside `--skeleton`, the
   union of step 8's fill-from-repo files, every decision record found under
   `docs/decision-records/`, and every capability spec found under `specs/` is scanned for a
   line matching `/^>\s*\[NEEDS REVIEW\]/m`. Each match adds one to a count reported in the
   verdict line, next to the adoption percentage, without changing drift, adoption or the
   percentage itself - a marked file is present and counts as adopted exactly as an unmarked
   one does (ADR-038). Never drift, never a WARN per file: the count is a companion number,
   not a check with a pass or fail state.

9. **Decisions.** A non-empty `decisions[]` produces one note (judgment tier, confirmed recorded at review) - never checked mechanically. The note carries **no count**: R7 "names no subset and asserts no count", so a summary line printing the catalog's length reads as a quota the standard explicitly refuses to set, in a report whose other numbers are drift and adoption. An entry declaring `required` is a FAIL naming R7 - `required` decides drift-vs-note for `files[]` and `sections[]`, nothing reads it here, so on a decision it could only ever assert the subset the rule denies.
10. **References.** A non-empty `references[]` produces one note naming the count (method docs read in the standards repo at latest - the living standard, ADR-023/025) - never a file check; a `files[]` entry with `adapt: "reference"` is likewise noted and skipped, never existence-checked.

11. **Recorded exceptions (R17).** `exceptions[]` waives a required miss: `file` (the entry), `section` (`<file>#<heading>`), `content` (a copy-class path, or one member inside a shipped directory), `key` (`<file>#<key.path>`). Consulted only when a check has already failed, so an exception cannot mask a passing check and a redundant one is detectable. The hatch is bounded, and each violation is a FAIL rather than a silently ignored line: an unknown `kind` (there is deliberately no `guard` kind), an entry with no `reason`, or a `kind: "file"` whose match is a guard's own script - which would convert "required file missing" into "check silently skipped", the one shape that removes a blocking check while reporting drift 0. `kind: "content"` on a guard script is allowed: the guard still runs and must pass. A `content` match MAY end in `/**` to scope a subtree, for a repo that rewrote a whole shipped directory; only that kind, because a subtree waiver on presence would sweep every guard's required-file check. An exception that matched nothing produces a WARN.
12. **A committed dependency tree.** Outside `--skeleton`, tracked paths under a `node_modules` directory segment produce one WARN naming the count, and naming the absence of a `.gitignore` when there is none. It is version-control hygiene the rest of the machine silently assumed: the coupling guard matches its globs against whatever git reports, so a `**/`-prefixed capability glob matches inside a tracked dependency tree and a dependency bump trips a blocking gate for a capability nobody touched. Never drift - drift counts unmet manifest entries and none declares this - so a repo in that state still certifies compliant; the WARN is what a later decision to charge for it would be built on. Exactness is by path segment, so a directory merely named `my_node_modules` is not one, and the lookup tolerates a repo with no git at all.
13. **Existence is case-exact.** Every check resolves a path through cached directory listings rather than `existsSync`, which is case-insensitive on macOS and Windows - `readme.md` satisfied `README.md` on one contributor's machine and failed on Linux CI from the same commit.

Output: header `self-verify - compliance with manifest <version>` (or `the BUILT-IN SKELETON (no standard.manifest.json here)`), one `PASS | FAIL | WARN | SKIP | ....` row per result (`<tag>  <name padded to 10>` then a space, then `<msg>` - the separator is unconditional because a name exactly filling the column used to run into its own message, `reference9 method docs`), then the verdict.

Drift arithmetic: one point per unmet required check. That is one point per manifest entry except for `.standards-version`, which scores two - once as the version pin, once as the required file - because a repo without it has both failed to record which version it follows and failed to carry the file that says so. A copy-class directory scores one for the entry however many members are missing or changed.

Adoption arithmetic: `applicable` counts every non-warning result that is either a real check or an excepted one; `adopted = applicable - drift - excepted`. **An excepted entry stays in the denominator and is not adopted**, so excepting can only lower the percentage. It used to leave the denominator entirely, which made the percentage rise as the standard was discarded: 13 `file` exceptions reported `100% adopted (32/32)` on a tree whose intact form counted 49. Counting an exception as adopted would encode the same claim the other way - a decision not to carry something is not carrying it. The exception count is printed in the summary line always, including zero. Absent a manifest, the verdict names the built-in skeleton as the yardstick, because the same output format with a much smaller denominator otherwise reads as a manifest measurement (three real unaligned repos reported drift 4-5 where the manifest gives 13-15).

### Exit codes and verdicts

| Condition | Verdict | Stream | Exit |
|---|---|---|---|
| drift 0 | `self-verify: OK - drift 0 - <pct>% adopted (<a>/<n>), <e> excepted - compliant with the standard` | stdout | 0 |
| drift > 0 | `self-verify: drift <n> - <pct>% adopted (<a>/<n>), <e> excepted - <n> required entr(y/ies) unmet` | stderr | 1 |
| drift > 0, `--warn` | same drift line | stderr | 0 |
| `--version X` and pin != X | counted as a version FAIL, drifts as above | stderr | 1 |

Two clauses append to the verdict when they apply, and neither changes the exit code, because
neither is a statement about whether the repo complies:

| Clause | When | On which line |
|---|---|---|
| ` - <n> CHECK(S) NOT RUN HERE (<ids>): a missing prerequisite, counted as neither drift nor adoption, so this verdict covers less than the manifest does` | any guard was not run | both |
| ` - AND THAT IS THE WHOLE CLAIM: no capability spec exists here yet, ...` | no capability spec exists | the drift-0 line, which is the one that otherwise overclaims |

The leading `OK - ` is dropped when any check did not run. Treating a missing tool as the
machine's problem rather than the repo's loosened the gate - it used to exit 1 and now does
not - so the word a reader skims is what has to stop saying the run was complete. The exit
code is unchanged, because it answers "does this repo comply", and a check that never started
has no opinion on that.

## Requirements

- The verifier MUST report every result before exiting - never stop at the first failure.
- The verifier MUST live at `scripts/self-verify.mjs` in a consuming repo and run from the repo root.
- `--warn` MUST only change the exit code, never the reported drift.
- The verifier MUST compare a `copy` entry's content against the hash the manifest records, and MUST distinguish that failure from absence in its wording.
- The verifier MUST state, in the verdict line, when the yardstick was the built-in skeleton rather than a manifest.
- The verifier MUST distinguish a guard that could not run from a guard that ran and failed, in the reported number and not only in the message.
- The verifier MUST NOT execute a guard whose declared prerequisites are absent, so that asking the compliance question has no side effects on the repo or the network.
- The verifier MUST state, in the drift-0 verdict line, when no capability spec exists - the one state in which a compliant shape and an unused method are the same output.
- The verifier MUST NOT print, and the manifest MUST NOT declare, any count or subset of decision areas as required (R7).
- The verifier MUST fail a repo that still carries a path the standard has removed, and MUST decide it without history, a second tree, or any input beyond the manifest the repo already carries.
- The verifier MUST warn, never fail, when a shipped workflow's `branches:` trigger cannot fire on the repo's actual default branch, and MUST say nothing when the default branch cannot be determined.
- The verifier MUST report the count of files still carrying a `[NEEDS REVIEW]` marker next to the adoption percentage, and MUST NOT let that count change drift, adoption or the percentage.

## Invariants

- The exit code MUST be 0 if and only if drift is 0 or `--warn` is set.
- `--skeleton` MUST NOT execute any guard and MUST NOT require the version pin.
- The verifier MUST NOT recurse into itself via the manifest's own `self-verify` guard entry.
- Warnings, notes and not-run checks MUST NOT add to drift, and MUST NOT enter the adoption denominator either - a check that measured nothing is evidence for neither number.
- A missing prerequisite MUST NOT change the reported drift, and a guard that ran and failed MUST still count - a change satisfying only the first would delete the check rather than classify it.
- Adding an exception MUST NOT raise the reported adoption percentage, and MUST NOT remove a check from the denominator.
- A guard's own script MUST NOT be waivable by any mechanism that stops the guard from running.
- Path existence MUST be decided case-exactly, so the same repository state produces the same verdict on every filesystem.
- A `sha256`-less entry MUST behave exactly as it did before content checking existed, so an older manifest copy still verifies.
- A `removedPaths` entry MUST be decided by existence alone, so a repo that never carried the path is never penalised for a removal that predates it.

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
- **A self-written stub warns.** GIVEN `CONTRIBUTING.md` whose whole body is `# Contributing` and `TODO.` WHEN self-verify runs THEN a WARN names it and drift is unchanged - the file carries no template placeholder, and it is a manifest entry the previous hardcoded list never covered.
- **A file with only a heading warns.** GIVEN `SECURITY.md` containing nothing but `# Security` WHEN self-verify runs THEN a WARN names it as having no content beyond its headings.
- **A terse but real file does not warn.** GIVEN `SECURITY.md` reading `Report vulnerabilities to security@example.com. We acknowledge within five working days.` WHEN self-verify runs THEN no substance WARN is raised for it - a check that warned here would be measuring length, and would teach adopters to pad.
- **The verdict states what the percentage counts.** GIVEN any file raising a substance WARN WHEN self-verify runs THEN the summary line says the percentage counts entries present, not substance written.
- **A placeholder in any script warns.** GIVEN a file containing `<角色名>` or `<нужно заполнить>` outside code formatting WHEN self-verify runs THEN it raises the placeholder WARN - a translated, unfilled shell must not read as complete.
- **Notation alongside a real marker still warns.** GIVEN a file carrying both `` `specs/<capability>/` `` and a prose `<team name>` WHEN self-verify runs THEN the WARN is raised.
- **A code span that wraps a line break is not a placeholder.** GIVEN a filled `README.md` whose prose reads ``man git-<commandname>`` and then, across a line break, ``git help`` / ``<commandname>`` inside one span WHEN self-verify runs THEN no placeholder WARN is raised for it; GIVEN the same file with a prose `<team name>` after that span THEN the WARN is raised.
- **Notation in an indented code block is not a placeholder.** GIVEN a filled file with a four-space-indented commit-message example containing `Signed-off-by: Author Name <email>` WHEN self-verify runs THEN no placeholder WARN is raised for it; GIVEN a four-space-indented `<team name>` written under a bullet instead THEN the WARN is raised, because that is a continuation paragraph and not code.
- **A double-backtick span does not expose the notation after it.** GIVEN a filled file whose list shows an Ex command as `` `x` `` and whose next lines carry `<Key>` inside single-backtick spans WHEN self-verify runs THEN no placeholder WARN is raised; GIVEN a prose `<team name>` after such a span THEN the WARN is raised.
- **An unmatched backtick cannot silence a later marker.** GIVEN a file with one stray backtick and, after a blank line, a prose `<team name>` WHEN self-verify runs THEN the WARN is raised.
- **An unfilled table row warns; an empty one does not.** GIVEN a filled file whose table still carries `| ... | ... |` WHEN self-verify runs THEN the WARN is raised; GIVEN the same file with real rows and one all-empty row THEN it is not.
- **An unfilled record author warns.** GIVEN `docs/decision-records/adr/ADR-001-use-postgres.md` carrying the template's `| **Author** | {{AUTHOR}} |` row WHEN self-verify runs THEN a WARN names that record; GIVEN the same record with a person in that row THEN no WARN is raised for it.
- **A record template is not a shell to fill.** GIVEN the shipped `docs/decision-records/adr/_template.md` and `bdr/_template.md` WHEN self-verify runs THEN no placeholder WARN is raised for either - they are the source of the placeholders, and a warning that cannot be cleared is one everybody learns to skip.
- **A record outside the stream subfolders is scanned too.** GIVEN `docs/decision-records/BDR-004-target-personas.md` sitting directly in the flat layout with an unfilled author WHEN self-verify runs THEN the WARN names it.
- **Prose notation in a record is not a placeholder.** GIVEN a filled record quoting an agent utterance containing `<standard>@<version>` and `<technology>` outside code formatting WHEN self-verify runs THEN no WARN is raised for it - both are lifted from this project's own records, and the angle form is what the record scan deliberately leaves out.
- **A template's own guidance comment is not an unfilled shell.** GIVEN a filled `docs/PRODUCT.md` still carrying the shipped HTML comment that writes `<date>` and `<ID>` to show the marker's shape WHEN self-verify runs THEN no placeholder WARN is raised for it; GIVEN the same file with a prose `<team name>` beside that comment THEN the WARN is raised; GIVEN a `{{SECURITY_CONTACT}}` written inside a comment THEN the WARN is raised, because the mustache form is read from the raw body.
- **A marker inside code formatting still warns when it is unambiguous.** GIVEN a file carrying `` `{{SECURITY_CONTACT}}` `` in a code span, or the same token inside a fenced block, WHEN self-verify runs THEN the WARN is raised - the strip protects the angle form, which doubles as notation, and nothing else.
- **A CI expression is not a marker.** GIVEN a filled `README.md` quoting `${{ github.ref }}` and `${{ secrets.NPM_TOKEN }}` in prose and in a fenced block WHEN self-verify runs THEN no WARN is raised for it.
- **A shipped template banner is an unfilled shell.** GIVEN a file still opening with a blockquote `**Template - …, then delete this note.**` WHEN self-verify runs THEN the WARN is raised; GIVEN the same file with the note deleted THEN it is not.
- **The shipped templates fire while unfilled and clear when filled.** GIVEN the shipped tree plus the record an adopter writes WHEN self-verify runs THEN `SECURITY.md`, `docs/personas.md` and `docs/PRINCIPLES.md` each raise the WARN; GIVEN filled versions of all three THEN none does.
- **A section at a declared alternate.** GIVEN `CHANGELOG.md` is absent and `docs/CHANGELOG.md` (the entry's own `altPaths`) carries `## Unreleased` WHEN run THEN drift is unchanged and the PASS names `docs/CHANGELOG.md`; GIVEN the alternate exists without that heading THEN drift rises by one and the FAIL names the alternate; GIVEN neither path exists THEN both the file and its section FAIL.
- **A removed path is gone.** GIVEN a manifest listing `.claude/skills/update-to-version` under `removedPaths` and no such directory in the repo WHEN run THEN the entry PASSes naming the release that removed it, and drift is unchanged - a repo that never carried the path must not pay for a removal that predates it.
- **A removed path is still there.** GIVEN the same manifest and that directory still on disk WHEN run THEN drift rises by one and the FAIL names the path, the release that removed it, and the entry's note.
- **A removed path is deliberately kept.** GIVEN the same manifest, the directory on disk, and `{ "kind": "file", "match": ".claude/skills/update-to-version", "reason": "..." }` in `exceptions` WHEN run THEN the entry is reported as excepted rather than as drift, and stays in the adoption denominator.
- **Core profile.** GIVEN a manifest with scale-only entries WHEN run with `--profile core` THEN those entries are skipped and their count appears as a note.
- **Persisted profile.** GIVEN the manifest copy carries `"profile": "core"` WHEN run with no flag THEN core is the applied profile (a note says so); a CLI `--profile` flag overrides it.
- **A manifest with no profile says so.** GIVEN a manifest copy carrying no `profile` field WHEN run with no flag THEN a WARN names the fallback to scale, and drift is unchanged.
- **A committed dependency tree is named.** GIVEN a git repo tracking files under `node_modules/`, at the root or nested inside a workspace package, WHEN self-verify runs THEN a WARN names the count and (when there is none) the missing `.gitignore`, and drift is unchanged; GIVEN a repo whose only match is a directory named `my_node_modules`, or no such paths at all, THEN nothing is said.
- **Recursion guard.** GIVEN the manifest lists guard `id: "self-verify"` WHEN guards run THEN that entry is skipped.
- **A marked file is counted, singular wording.** GIVEN one fill-from-repo file opening with a `[NEEDS REVIEW]` marker WHEN self-verify runs THEN the verdict reports one entry still carrying the marker, worded in the singular; GIVEN the same file with the marker removed THEN the count is zero and nothing is said.
- **Two marked files, plural wording.** GIVEN two files each opening with a marker WHEN self-verify runs THEN the verdict reports two entries, worded in the plural.
- **A marker in a decision record is counted.** GIVEN an ADR whose body opens with the marker WHEN self-verify runs THEN it adds to the count exactly as a marked fill-from-repo file does.
- **A marker in a capability spec is counted.** GIVEN a `specs/<capability>/spec.md` opening with the marker WHEN self-verify runs THEN it adds to the count.
- **The count never moves the percentage.** GIVEN the same file once unmarked and once carrying the marker WHEN self-verify runs on each THEN the adopted, applicable and percentage figures are identical between the two runs - a marked file is present and counts as adopted exactly as an unmarked one does (ADR-038).
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
- **Mismatched branch trigger.** GIVEN a shipped workflow file landed verbatim with `branches: [main]` and a repo whose default branch is `master` WHEN self-verify runs THEN a WARN names the file, `main` and `master`, and drift is unchanged; GIVEN the default branch cannot be read (no remote) THEN nothing is said; GIVEN a shipped workflow with no `branches:` line (`dashboard.yml`) THEN nothing is said about it.
- **Absent tool.** GIVEN a guard whose command resolves nowhere on `PATH` WHEN run THEN drift is unchanged, a `SKIP` row names the guard and the missing command, and the verdict line states how many checks did not run.
- **Failing tool.** GIVEN a guard whose command exists and exits non-zero WHEN run THEN drift rises by one, the guard's own output is printed, and nothing claims a check did not run - the absent-tool case must not be satisfiable by silencing guards generally.
- **Declared path prerequisite.** GIVEN a guard declaring `{ "kind": "path", "match": "node_modules" }` and no `node_modules` WHEN run THEN the guard's command is never executed, drift is unchanged, and the entry's `hint` appears in the message; GIVEN the path exists THEN the guard runs and its verdict counts.
- **Malformed prerequisite.** GIVEN a `requires` entry with an unknown kind WHEN run THEN it is a FAIL naming the valid kinds, never a guard that quietly stops running.
- **A message is not a command.** GIVEN a guard whose `run` is a shell-builtin probe, a quoted error message naming a non-existent tool, and then a real command WHEN run THEN the guard executes - inference that errs the other way removes checks.
- **A fallback is not two requirements.** GIVEN a guard whose `run` is `<a resolvable command> || <an absent one>` WHEN run THEN the guard executes and drift is unchanged.
- **`OK` means complete.** GIVEN drift 0 and one guard that did not run WHEN run THEN the verdict line does not begin `self-verify: OK`, and the exit code is still 0.
- **Nothing specified yet.** GIVEN a scaffolded repo meeting every manifest entry and carrying no capability spec WHEN run THEN drift is 0, exit is 0, and the verdict line carries the caveat that the claim is about shape only.
- **The caveat clears.** GIVEN the same repo with one `specs/<capability>/spec.md` WHEN run THEN the caveat is absent; GIVEN only `plan.md`, `tasks.md` and a `README.md` under `specs/<capability>/` THEN it is still present - the engine's own scaffolding is not specified behaviour.

### Stack manifest merge

When `stack.manifest.json` exists beside `standard.manifest.json` (a repo that
adopted a registered stack - ADR-016), self-verify notes it (`stack` row naming
the technology **and the version the stack manifest declares**, and warning when
it declares none - nothing records which state of the stack the repo aligned to
otherwise). The number is printed, never judged: the linkage is the registry
pointer and nothing local knows what the stack repo currently ships (ADR-022), so
staleness is a comparison a human makes and one this tool cannot. It then
concatenates its `files`,
`sections`, `guards` **and `exceptions`** entries into the core manifest's before
checking - one drift number across both layers, and one exception mechanism: a
deviation recorded in the stack manifest (which is what a stack's own adaptation
guide tells an adopter to do) is honoured exactly like one recorded in the core
manifest, bounded by the same rules (11). An unparseable stack manifest is a
FAIL, like the core one. Absent, nothing changes.

- GIVEN `stack.manifest.json` declares a required file the repo lacks WHEN self-verify runs THEN the miss counts in the same drift number as core entries.
- GIVEN `stack.manifest.json` declares an `exceptions` entry waiving one of its own required misses WHEN self-verify runs THEN the miss is excepted, not counted as drift, exactly as a core-manifest exception would be.
- GIVEN `stack.manifest.json` declares `version: 0.1.0` WHEN self-verify runs THEN the stack note names that version; GIVEN it declares none THEN a WARN says so. Neither is drift.
- GIVEN no `stack.manifest.json` WHEN self-verify runs THEN output is identical to the pre-stack behavior.

## Open questions

None known.
