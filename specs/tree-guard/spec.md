# Tree guard

**Spec tier:** buildable
**Serves:** `Standard-bearer Staszek` - the tree he adopts from must be complete and free of this repo's internals; `Coding agent` runs both tools as gates.
**Status:** live
**Success metric:** Retention - a client updating to a new version gets a tree that is complete and verifies green.

## Purpose

Guard the single authored shipped tree (`standard/`, ADR-014): nothing repo-own leaks in, everything the manifest promises is present, every shipped file is a manifest entry, workflow pins stay exact, derived facts stay derived, and the tree passes its own verifier. Plus: no relative markdown link anywhere in the repo is dead.

## Scope

[`tools/tree-check.mjs`](../../tools/tree-check.mjs) (tree integrity) and [`tools/link-check.mjs`](../../tools/link-check.mjs) (link integrity). Repo-own tooling - never shipped.

## Out of scope

Verifying an adopted repo ([verify-engine](../verify-engine/spec.md)); checking the rendered web surfaces ([web-surface](../web-surface/spec.md)).

## Core concepts

- **The tree** - `standard/`; files sit at their real client paths, there is no second source.
- **Leak** - repo-own material (this repo's ADRs, transition skills, retired engine layouts) inside the tree.
- **Manifest promise** - a `standard/standard.manifest.json` entry a client expects at its path.
- **Client-only file** - a manifest path the client authors from nothing; absent from the tree by design.

## Interface contracts

`node tools/tree-check.mjs` - run from the repo root, no flags, no dependencies. Seven checks, all always run:

1. **Leaks.** Walk every file under `standard/`. A path matching any of these patterns fails:
   - `/\/ADR-\d{3}-/` - a numbered ADR (this repo's decisions live in `docs/decision-records/`, clients get them by reference - ADR-004)
   - `/\.specify\//` - the retired `.specify` engine layout (ADR-015)
   - `/spec-kit\//` - a vendored spec-kit area (ADR-015)
   - `/skills\/(align-to-standards|onboard-repo|modernize|greenfield-start|speckit-)/` - a transition or speckit skill, never shipped (ADR-009/ADR-015)
2. **Manifest promises.** For every `manifest.files[]` entry whose `path` is not in `CLIENT_ONLY = { ".standards-version", "specs/capability-map.json" }`, at least one of `[path, ...altPaths]` must exist under `standard/`. Every `manifest.sections[]` entry's `file` must also exist there.
2b. **References resolve.** Every `manifest.references[]` path must exist at this repo's root (the method docs clients adopt by reference, ADR-023) - a dead reference FAILs.
2c. **Tree -> manifest coverage.** The reverse direction: every file under `standard/` must be covered by a manifest entry - an exact `path`/`altPaths` match or a prefix match under a directory entry - or listed in the explicit `EXEMPT` set (empty today; an exemption needs a recorded reason). A shipped-but-unlisted file FAILs: self-verify cannot see it and `update-to-version`'s delta cannot carry it.
3. **Skeleton self-verify.** `node scripts/self-verify.mjs --skeleton` executed with cwd `standard/` must exit 0; on failure its captured output is indented under the FAIL line.
4. **Version surfaces.** `VERSION` is read; `standard/SPEC.md` must contain `Version <V>` and `README.md` must contain `@<V>`. The two checks are independent - one mismatch never masks the other.
4b. **Derived facts stay derived.** The surfaces in `FACT_SURFACES` (`README.md`, `llms.txt`, `AGENTS.md`, `docs/ecosystem.md`, `site/index.html`, `standard/README.md`) must not hand-write a rule range (`R1-R<n>`) or a rule count (`<number|word> [numbered] rules`); a match FAILs, quoting the offending text. Facts derivable from `SPEC.md` are stated as "the numbered rules" or derived, never restated by hand.
5. **Workflow pins are exact (R21/ADR-017).** Every workflow under `.github/workflows/` and `standard/.github/workflows/`: each `uses:` names a full 40-hex commit SHA (local `./` actions exempt; comment-only lines - first non-space char `#` - are skipped), no `runs-on` label containing `-latest`, no bare-major `node-version`, and `standard/.nvmrc` (when present) is an exact `x.y.z`.

Output: one `  FAIL  <message>` line per problem, `  ok    <message>` per clean check, then the verdict: `tree-check: OK - one tree, shippable` or `tree-check: FAIL - <n> problem(s)`.

`node tools/link-check.mjs` - checks every file from `git ls-files '*.md'` (paths deleted mid-change are skipped). Each markdown link target matched by `\]\(([^)#\s]+?)(?:#[^)]*)?\)` must exist when resolved against the linking file's directory. Skip rules:

- any line containing `{{` (template placeholder lines describe the client repo, not this one),
- targets starting with `https?:`, `mailto:`, or `#` (absolute, mail, pure anchor),
- anything inside backticks - inline code is neutralized before matching (prose about a link is never a checked link).

Failure format: `  FAIL  <file>:<line> -> <target>` (1-based line), then `link-check: FAIL - <n> dead relative link(s)`; clean run prints `link-check: OK - all relative links resolve (<n> md files)`.

### Exit codes

| Tool | Exit | Condition |
|---|---|---|
| tree-check | 0 | all four checks clean |
| tree-check | 1 | any leak, unmet manifest promise, skeleton self-verify failure, or version-surface mismatch (count in the verdict) |
| link-check | 0 | every relative link resolves |
| link-check | 1 | one or more dead relative links (count in the verdict) |

## Requirements

- Both tools MUST be dependency-free (Node built-ins only) and runnable from the repo root.
- tree-check MUST run all seven checks and report every failure, never stop at the first.
- link-check MUST strip a `#fragment` from the target before resolving the path.

## Invariants

- A file matching a leak pattern MUST NOT exist under `standard/`.
- A manifest `files[]` path outside `CLIENT_ONLY` MUST exist in the tree at `path` or at an `altPaths` entry.
- The pristine tree MUST pass its own `self-verify --skeleton`.

## Acceptance criteria

- **Leak.** GIVEN `standard/docs/decision-records/ADR-001-x.md` exists WHEN tree-check runs THEN a FAIL names the file and the reason, and exit code is 1.
- **Client-only pass.** GIVEN the manifest promises `.standards-version` and the tree does not contain it WHEN tree-check runs THEN the promises check still passes.
- **Missing promise.** GIVEN a manifest file exists at neither `path` nor any `altPaths` under `standard/` WHEN tree-check runs THEN a FAIL names `standard/<path>` and the entry's `purpose`, exit 1.
- **Broken skeleton.** GIVEN `self-verify --skeleton` exits non-zero inside `standard/` WHEN tree-check runs THEN its output appears indented under a FAIL and tree-check exits 1.
- **Dead link.** GIVEN `docs/a.md` line 7 links a relative target `missing.md` and `docs/missing.md` does not exist WHEN link-check runs THEN it prints `docs/a.md:7 -> missing.md` and exits 1. (The literal pattern is not reproduced here - it would fail this very check.)
- **Placeholder skip.** GIVEN a line contains `{{project}}` and a dead relative link WHEN link-check runs THEN the line is skipped and does not fail.
- **Anchor skip.** GIVEN a link target `#section` or `mailto:x@y.z` WHEN link-check runs THEN it is ignored.

- **Version mismatch.** GIVEN `VERSION` is `9.9.9` and SPEC.md says `Version 0.7.2` WHEN tree-check runs THEN both the SPEC and README mismatches are reported and exit is 1.
- **Unmanifested file.** GIVEN `standard/docs/stray.md` exists and no manifest entry or `EXEMPT` row covers it WHEN tree-check runs THEN a FAIL names it and exit is 1.
- **Floating pin.** GIVEN a workflow line `uses: actions/checkout@v4` (not a 40-hex SHA) WHEN tree-check runs THEN a FAIL quotes it; a commented-out `# uses: ...@v4` line is skipped.
- **Hand-written count.** GIVEN a `FACT_SURFACES` file contains a hand-written rule range WHEN tree-check runs THEN a FAIL quotes the match and exit is 1.
- **Inline-code skip.** GIVEN a line quotes a dead target inside backticks WHEN link-check runs THEN the line does not fail.

## Open questions

None known.
