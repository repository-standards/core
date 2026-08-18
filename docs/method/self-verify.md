# Proving it, and staying current

A repo that follows repository-standards records the state it last aligned to in **`.standards-version`**.
Self-verify is how it proves it actually meets that version - the **"verify"** step that
runs after adopting the standard (`align-to-standards`), after updating it
(`update-to-version`), and in CI on every PR. Same pass/fail each time.

Verification has two tiers: a **mechanical** tier that a machine asserts, and a
**judgment** tier a human confirms at review. Do not pretend the judgment tier is
mechanical - but do not let the mechanical tier depend on a human either.

One thing the mechanical tier cannot do is judge substance, so it warns instead: a scanned
file still carrying `{{TOKENS}}`, `<markers>` or a table row of ellipsis cells is reported and
never counted as drift. Filled shells, not copied ones, are the point - but converting that
judgment into an integer is how a number starts being gamed.

**What `drift 0` claims, and what it does not.** It claims the repo is *shaped* like the
standard. It does not claim the method has been used on it, and the verdict now says so
rather than leaving the reader to infer it. A raw greenfield tree plus three declarative
files - `.standards-version`, a `profile` key, an empty `specs/capability-map.json` - used to
reach `OK - drift 0 - 100% adopted, compliant with the standard` with not one capability spec
written. The number was right; the sentence was not. So when no capability spec exists, the
drift-0 line carries the caveat in the same breath as the number. It is **reported, never
scored**: the greenfield walk scaffolds the repo in step 1 and writes the first spec in
step 6, and step 1 promises "empty but valid: self-verify passes". Scoring the gap would put
drift 0 out of reach of an honest brand-new repo for the whole length of the interview, and a
failure nobody can clear is one everybody learns to route around.

## Mechanical tier - the hard gate

Run the shipped checker; it exits non-zero on any failure, so CI can gate on it:

```
# gate: exit 1 on any failure
node scripts/self-verify.mjs

# report only, non-gating - for local runs
node scripts/self-verify.mjs --warn

# also assert the recorded state equals a given target
node scripts/self-verify.mjs --version 0.9.11
```

It is **manifest-driven** (ADR-005). It reads `standard.manifest.json`, the standard
describing itself as of the recorded state, and checks the repo against every
entry, reporting **drift** as a number (how many required entries are unmet; `drift 0` =
compliant).

**Without a manifest it measures something much smaller, and says so.** The built-in
fallback skeleton - a handful of checks, for repos that predate ADR-005 - used to be
announced in one dim line, so an unaligned repo could print `drift 4` where the shipped
manifest would have said `drift 14`, in the same format, and nothing distinguished them.
The warning and the verdict line both now name the yardstick: a run with no manifest is not
a measurement of the standard, it is a measurement of five checks.

It checks:

- **Version pin** - `.standards-version` exists and is well-formed (`x.y.z`); with
  `--version <target>` it must equal that target (used right after an update to confirm
  the bump landed); and it must equal the manifest's `version` (a repo that recorded X carries
  manifest X).
- **Files** - every `required` manifest file (or one of its `altPaths`) exists.
- **Content, where the content is the standard's own** - every `copy` entry carries a
  `sha256` in the manifest (one hash for a file, one per member for a directory), and the
  local file must hash to it. Existence alone was close to no check for these: a repo could
  carry 19 of the 20 skills, the previous version's `SPEC.md`, or a shipped guard with its
  policy block deleted, and still report `drift 0`. The comparison needs no network and no
  copy of the shipped tree, because the hashes travel in the manifest **this repo carries** -
  the one from the version it aligned to, so they describe exactly that version. CRLF is
  normalized to LF first, so a Windows checkout is not permanent drift.
  - A `copy` file this repo **deliberately** changed is what `exceptions` are for: record
    `{ "kind": "content", "match": "<path>", "reason": "..." }` and the difference stops
    being drift (see below). The message says *differs from the standard's copy*, never
    *missing*, so the two failures are never confused.
  - A directory adopted through an `altPath` - `.agents/skills` standing in for
    `.claude/skills` (R22) - is a different **format** by design, so bytes cannot be the
    test. The **names** are checked instead: everything the standard ships must be there
    under its own name. A directory that merely exists at the alternate path is not a port,
    which is how one monorepo reported 100% adopted while carrying none of the 20
    procedures. Whether each ported skill is faithful stays judgment tier.
- **Declared keys, where the file is adapted on purpose** - a `merge` entry may name
  `requiredKeys`: dotted paths that must be present in the merged result (JSON objects and
  YAML block mappings). A merge keeps what your repo already has *and* what the standard
  brings, so its bytes cannot be compared - but when the entry exists **for** a block inside
  the file, "the file exists" asserts nothing. This is how the stack layer holds its
  supply-chain policy: a `pnpm-workspace.yaml` that lost `minimumReleaseAge`, `saveExact`
  and `enablePrePostScripts` used to pass on the filename alone. Presence only - the value
  is yours to choose.
- **Sections** - every required section heading is present in its file (e.g. `AGENTS.md`
  must state `Altitude`). A section follows its file: where the file entry declares
  `altPaths` and the repo used one, the heading is read there. Reading only the primary
  name let a repo pass the `CHANGELOG.md` entry through `docs/CHANGELOG.md` and then fail
  its `Unreleased` section with "CHANGELOG.md missing" - a drift with no legitimate way to
  close it.
- **Names, case included** - the check reads directory listings rather than asking the
  filesystem whether a path exists, because `existsSync` is case-insensitive on macOS and
  Windows. `readme.md` used to satisfy `README.md` on a contributor's Mac and fail on Linux
  CI for the same commit, which made the answer a property of the machine that asked.
- **Static guards** - each manifest guard with `kind: static` passes (e.g.
  `scripts/spec-structure.mjs`, `scripts/schema-pair.mjs`); `self-verify` skips itself
  to avoid recursion. A guard whose subject is absent - no `database/schema/`, say -
  reports that and passes; R24 binds repos that own a database.
- **A guard that could not run is not a guard that failed.** A missing tool is a fact about
  the machine; drift is a fact about the repo, and
  [`prerequisites.md`](prerequisites.md) already says the number scores the second.
  They used to be the same integer: on a machine with no `pnpm`, the Layer 2 guard
  `pnpm check:all` exited with a bare `command not found` and printed
  `drift 1 - 99% adopted (78/79)` - byte for byte what three real lint errors print on a
  compliant repo. So a guard whose prerequisites are absent is **NOT RUN**: reported as
  `SKIP`, counted as neither drift nor adoption, and named in the verdict line, because the
  one thing a skipped blocking check must never be is quiet. Prerequisites come from two
  places: whatever the guard entry declares -
  `"requires": [{ "kind": "command", "match": "pnpm" }, { "kind": "path", "match": "node_modules" }]` -
  and, for guards that declare nothing, any bare command word in `run` that is no shell
  builtin and resolves nowhere on `PATH`. The `path` kind is what keeps the check free of
  side effects: with a package manager present and its dependency tree absent, *running* the
  guard is what pulls hundreds of megabytes off the network, and looking first is the only
  way not to. Inference errs toward running the guard in every direction it can be wrong:
  quoted text is blanked before splitting, so a word inside an error message is never
  mistaken for a tool, and `a || b` is read as a fallback rather than two requirements.
  **This loosened the gate** - a guard failing on a missing tool used to exit 1 and now does
  not - so `OK` is dropped from the verdict whenever a check did not run. The exit code
  answers "does this repo comply", and a check that never started has no opinion on that;
  the count and the missing word are what keep it from reading as a clean bill of health.

The code<->spec **coupling** guard (`scripts/spec-guard.mjs`, `kind: diff`) runs in CI on
the PR diff rather than in this static check - but it is part of the same gate.

**Layer 2 - the stack manifest.** If a `stack.manifest.json` sits beside the core
manifest, the repo also carries a technology layer: `self-verify` merges the stack's
entries in and counts **one drift number across both layers**. The stack file links the
repo to its stack by the registry pointer - never by a core version (ADR-022 in the
standard repo); the picks' rationale lives in the stack repo's DECISIONS.

A repo whose stacks **coexist permanently** - a framework beside a native engine, neither
migrating to the other - carries one file per stack, `stack.<technology>.manifest.json`,
alongside or instead of the single-stack name. Every one is read, in filename order, and
they all land in the same drift number. Two stacks declaring the same path is not an error
and is not this repo's to resolve, so it is reported rather than silently collapsed: the
path is checked once per declaration, and the run says which two files claimed it.

**Which rules the number covers.** The drift number is exactly the manifest: file
presence, the recorded content of `copy` entries, the declared keys of `merge` entries,
required sections, static guards, plus the structure guard's checks (spec
layout, personas named, no committed scaffolding warned). Rules about *conduct* - the
same-PR spec coupling outside CI, plan/tasks removal at close, buildable substance,
supersede-not-edit, cooldown discipline - are review-verified: honestly outside the
number, listed in the judgment tier below. A repo can be drift 0 and still sloppy at
review; the number is the floor, not the ceiling.

**What the adopted percentage does not measure (ADR-038).** It is a *structural* reading. A
`copy` entry is compared against its recorded hash and a `merge` entry against its declared
keys, but a **`fill-from-repo`** entry - `AGENTS.md`, `docs/personas.md`, `docs/PRODUCT.md`,
`docs/ARCHITECTURE.md`, `SECURITY.md`, `CONTRIBUTING.md` and the rest the adopter authors -
carries neither, and cannot: the content is yours, so there is nothing to compare it against.
Those entries score on presence. Measured on a sparse repo, six files reading `# Title` and
`TODO.` moved it from `21% adopted` to `37% adopted` with its real substance unchanged.

So the percentage answers "how much of the standard's structure is in place", never "how good
is what was written". A file that reads as unfilled - nothing beyond its headings, or nothing
but a `TODO`/`TBD`/`WIP` marker - raises a **warning, never drift**, and the verdict line then
states that the percentage counts entries present rather than substance written. The warning
deliberately detects only *visibly nothing written*: a terse but real `SECURITY.md` naming an
address and a response time is complete, and a length threshold that failed it would teach
adopters to pad. Whether what is written is any good is the judgment tier's call, below.

**Drift as a number.** Each unmet required check scores one, so `drift N` is a measurable
distance from the standard, and an update's job is to drive it back to `0`. Mostly that is one
point per manifest entry, with one deliberate exception: a missing `.standards-version` scores
**two**, once as the recorded state and once as the required file. That is not double counting
by accident - a repo with no record has both failed to record which version it follows and
failed to carry the file that says so, and it is the single most consequential thing that can
be absent. A `copy` directory whose members moved also scores **one for the entry**, however
many members it was, and the failure names them.

**Comparing two repos' numbers is not sound, and this page used to say it was.** The
denominator is each repo's own manifest: its aligned version, its profile (`core` checks
fewer entries than `scale`), whether it carries a stack manifest, and how many entries it has
excepted. Two repos can print the same percentage against different entry lists, and a repo
at `--profile core` can out-score a `scale` repo that carries more of the standard. The number
is comparable **against itself over time** - the same repo, before and after an update - and
that is the comparison retention actually needs. For a fleet, read the drift *count* and the
exception count together with the version each repo is aligned to; do not sort on the
percentage as if it were one scale. Reading a number as "exactly N missing files" is not sound
either: a point can be a missing file, a changed file, an absent key or a failing guard.

## The escape hatch, and its bounds

R17 says adoption adapts rather than blind-copies, so a repo may decide **not** to carry
something the standard requires. That decision is recorded in the manifest's `exceptions`,
which is the only thing that turns a required miss into a compliant one:

```json
"exceptions": [
  { "kind": "file",    "match": ".github/workflows/spec-guard.yml", "reason": "this repo gates on GitLab CI; the same guards run in .gitlab-ci.yml" },
  { "kind": "section", "match": "AGENTS.md#Altitude",               "reason": "..." },
  { "kind": "content", "match": ".nvmrc",                           "reason": "this repo runs Node 22; the guards pass on it" },
  { "kind": "key",     "match": ".claude/settings.json#hooks.PreToolUse", "reason": "..." }
]
```

- **`file`** waives the entry, **`section`** a required heading, **`content`** a `copy` file
  this repo deliberately changed, **`key`** one declared key. A `content` match may be a
  single member inside a shipped directory (`.claude/skills/adr-write/SKILL.md`).
- **Every exception carries a `reason`.** One without it is drift: a recorded deviation with
  nothing recorded is not one, and the reason is what the next update reads before it
  overwrites anything.
- **A guard cannot be excepted.** There is no `guard` kind, and a guard's own script file
  cannot be excepted by `kind: "file"`. A guard whose script is absent is *skipped* - optional
  guards legitimately are not installed - so excepting the script is exactly how a blocking
  check disappears while the run still says drift 0. Thirteen `file` exceptions once took a
  tree with no `AGENTS.md`, no personas, no capability map and every guard script deleted to
  `100% adopted (32/32)`. Recording that you **changed** a guard is fine and uses
  `kind: "content"`: the guard still has to run and pass.
- **An exception can never raise the adoption percentage.** An excepted entry stays in the
  denominator and does not count as adopted, so excepting costs coverage rather than buying
  it. It is never drift, and the count is always printed in the summary line - including
  zero. Waiving something is a decision the number should show, not hide.
- **A stale exception is reported.** If the entry is met anyway, the run warns: the repo
  chose otherwise back and the line is now describing nothing.
- **A `content` match may scope a subtree** by ending in `/**`
  (`.claude/skills/**`), for a repo that rewrote a whole directory of shipped procedures and
  should not have to write forty lines. Only `content`: a subtree waiver on presence would let
  `scripts/**` sweep away every guard's required-file check, which is the rule above. Each
  member it waives is counted, so a wide waiver costs wide coverage.

## Judgment tier - confirmed at review

A machine cannot (yet) decide these; they are checked when the PR is reviewed:

- **Decisions recorded** - the forks in the standard's
  [decision checklist](https://github.com/repository-standards/core/blob/main/docs/method/checklist.md)
  (adopted by reference from the living standard - always latest) that apply to this repo are recorded as
  ADR/BDR, or consciously deferred as a backlog item - not silently undecided.
- **Specs buildable where it counts** - each mapped capability has a
  `spec`; money / security / data / external-contract paths are
  buildable, not merely described.
- **No unrecorded drift** - no known spec<->code contradiction is left unresolved.
- **The CI gate actually fires** - the manifest requires `.github/workflows/spec-guard.yml`
  to declare `on.pull_request`, and that is a key in a file, not a run. The same workflow
  passes the check with a `paths:` filter that excludes everything, disabled at the
  platform, or with a `runs-on` label no runner answers. What proves the gate is a recent
  run on a pull request; `self-verify` reads the checkout and cannot see one.
- **The authored files say something** - every `fill-from-repo` entry is content you wrote, so
  the mechanical tier can only see that it exists and flag the ones that visibly do not (ADR-038).
  Whether `docs/PRODUCT.md` describes this product, whether `docs/ARCHITECTURE.md` matches the
  code, whether `SECURITY.md` names a contact somebody actually reads - that is read here, at
  review, and it is the difference between an adopted repo and a decorated one.

## Staying current - the record is a bookmark, not a lock

That file records the state this repo last aligned to. The target of every update is
**latest** (ADR-025), so a repo does not need to be told which version it may use - it
needs to be told that a newer one exists. Two ways to get that signal, both
notifications, neither of them a gate:

**The shipped watch workflow.** Enable
`.github/workflows/standards-update-watch.yml`.
Weekly, it compares `.standards-version` against the standard's newest release and
opens **one issue per target version** - not one per week - saying what to say to take
the update. Before the standard publishes its first release the job says so and exits
green; a watch installed early is not an error. It never edits the recorded state: an alignment
that happens while nobody is looking is not an alignment.

**Renovate, if the repo already runs it.** A custom manager treats the recorded state like any
other dependency, so the proposal arrives in the same place as every other bump:

```json
{
  "customManagers": [
    {
      "customType": "regex",
      "managerFilePatterns": ["/^\\.standards-version$/"],
      "matchStrings": ["^(?<currentValue>\\d+\\.\\d+\\.\\d+)"],
      "depNameTemplate": "repository-standards/core",
      "datasourceTemplate": "github-releases",
      "versioningTemplate": "semver"
    }
  ]
}
```

(Older Renovate calls `managerFilePatterns` `fileMatch`.)

Know what that PR is: **a proposal, and only half the work.** Merging a version bump on its
own leaves the repo red on purpose - self-verify requires the manifest copy to match
the record, and the manifest arrives with the update. Take the PR as the reminder, run
`update-to-version`, and let the same PR carry the delta.

## When it fails

A red self-verify is a compliance failure, not a warning to defer:

- Missing `.standards-version` -> the repo was never aligned; run `align-to-standards`.
- Version mismatch after an update -> the bump did not land; finish `update-to-version`.
- A guard failure -> fix the structure/coupling before merging.
- A guard reported `SKIP` -> nothing is wrong with the repo and nothing was learned about it
  either. Install what the line names ([`prerequisites.md`](prerequisites.md)) and re-run;
  CI is where that must not be tolerated, because a runner missing a tool checks less than
  the same command checked yesterday.
- A judgment-tier gap -> record the decision, deepen the spec, or file the backlog item.

The mechanical gate belongs in CI so "compliant with the standard" is an assertion the
pipeline makes, not a claim a human remembers to check.
