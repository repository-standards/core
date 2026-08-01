# Changelog

All notable changes to the standards. Semver: MAJOR = removals/breaking policy
changes, MINOR = new standards/modules, PATCH = fixes/clarifications.

## Unreleased

The simplification wave - the standard put on one page, in one tree, with one
engine copy - plus everything since 0.7.2: the lifecycle, the guided loop, the
align engine, Layer 2 and the product spine.

### Adopters get the derived-facts check, and R4 says why (2026-08-01)

- **`scripts/facts-check.mjs` ships** - the check that caught this repo's own stale
  skill count is no longer repo-own tooling. A repo declares what it restates in
  `docs/facts.json` (shape in `docs/facts.example.json`), `self-verify` runs it as a
  manifest guard, and a stale restatement becomes drift with a number. A repo that
  declares nothing passes quietly - the guard runs everywhere, so it must stay silent
  where there is nothing to check.
- **R4 gains the hook it was missing** - "documents are living, the current version is
  the truth" said nothing about the same fact living in five files. It does now: a fact
  has one home, and a restatement either links to it or is **declared** and verified.
  A rule that says this without a check is the kind of sentence everybody agrees with
  and nobody obeys.
- **One implementation, dogfooded** - this repo deleted its private copy and runs the
  shipped script on itself, the same way it runs the shipped `spec-guard.mjs`. Two
  copies of a drift-checker would have been an unusually pointed source of drift.
- **`docs/facts.json` joins the author-it-yourself set** - like the version pin and the
  capability map, shipping an example would seed a repo with another repo's facts. The
  tree-guard spec now says why that set exists rather than just listing it.

### The upstream scan runs, and the postmortem gets its template (2026-08-01)

- **Upstream reviewed: github/spec-kit v0.13.2 -> v0.15.1** - the extracted engine's
  first scan since the extraction. Most of what moved upstream is CLI, presets,
  extensions and packaging, which this standard does not consume. One change to the
  command templates was worth taking and was taken; the rest were read and rejected
  with a reason, which is the point of recording the range rather than the verdict.
- **The clarify loop now asks a question, not a label** - cherry-picked from upstream
  commit `39f2ac3`: lead with a full interrogative that someone can answer as written,
  never a topic label or a requirement id ("Retention policy" and "FR-023" are
  subjects), and follow it with one plain sentence on what changes depending on the
  answer. The hunk carries a `CHERRY-PICKED` marker naming its upstream commit, beside
  the existing `PATCHED` ones - provenance stays readable in place.
- **Read and not taken** - the duplicate step numbering fix does not apply (the
  extracted specify prompt has none), the constitution-command fixes touch a command
  this standard does not ship, and the port of the setup scripts to Python is
  deliberately not followed: the shipped scripts are bash with graceful fallbacks.
- **Postmortems get the template every other folder already had** - the runbooks README
  has been prescribing blameless postmortems in a fixed order, with actions that become
  backlog items in the same PR, while shipping nothing to write them into. The template
  carries the two sections people skip and later need: the actions that were rejected
  and why, and what is deliberately not being changed.

### A repo can find out the standard moved (2026-08-01)

- **`standards-update-watch.yml` ships as a template** - weekly, it compares
  `.standards-version` against the standard's newest release and opens **one issue per
  target version**, with the line to say to take the update. ADR-025 said staying
  current is a notification and never a lock; until now there was no channel, so
  "always align to latest" depended on somebody remembering to look.
- **It never edits the pin** - an alignment that happens while nobody is looking is not
  an alignment. The issue proposes; a human runs `update-to-version`, which applies the
  delta and preserves the repo's recorded deviations.
- **Installed before the first release, it says so and passes** - no releases yet is a
  normal state for an adopter who wired the watch early, not a red run. A weekly cron
  also must not mint a weekly issue, so an open issue for the same target version ends
  the job.
- **Renovate gets the same job where a repo already runs it** - a documented custom
  manager treats the pin as a dependency, and the doc says plainly what that PR is: a
  proposal and half the work. Merging a bare pin bump leaves the repo red by design,
  because the manifest copy arrives with the update.
- **Still waiting on the first tag** - the channel cannot be proven end to end until a
  release exists, and releases are the maintainer's call. The backlog row says exactly
  that rather than claiming the item is finished.

### Every doc opens with your case, not with the concept (2026-08-01)

- **"You have this case - say this"** - the pattern `working-with-specs.md` and
  `discovery.md` set is now the opening of all nine method docs and of the shipped
  folder READMEs: backlog, decision-records, ideas, runbooks, journeys, analytics and
  research. Each one starts with the situations people are actually in, the exact line
  to say, and where the result lands.
- **Written for the reader who did not come here to learn the method** - somebody with
  a repo they did not write, an idea they do not want to lose, a service on fire, or a
  question about whether something is a decision or just a convention. The concept
  sections stayed where they were; they are no longer the front door.
- **Corner cases are part of the answer, not an appendix** - update versus new spec,
  business versus technical record, an idea that is really a decision waiting, a rename
  that is a migration, an assessment that quietly skipped half a repo. These are the
  forks where a busy reader guesses wrong, so each opener names its own.
- **The method index leads with situations too** - a table keyed by what you are
  holding rather than by document name, so the entry point matches how somebody
  arrives.

### A fact restated in prose now has to agree with its source (2026-08-01)

- **The coupling idea, one level down** - `specs/capability-map.json` made "these move
  together" a declared edge for code and specs. Prose was left out, and prose is where
  a number rots quietly: this repo shipped "twenty rules" while `SPEC.md` had 21, and
  said "11 lifecycle skills" while the tree held 12. Both were found by a person, late.
- **`tools/facts-check.mjs` + `tools/facts.json`** - a fact has one home (a file to
  read, a glob to count, a pattern in a designated source) and every restatement is
  declared. Three are wired to start: how many skills ship, the GitHub path a client
  degits, and the version the standard advertises across `SPEC.md` and the landing page.
- **A surface that stops matching its own claim fails** - a reworded sentence whose
  pattern finds nothing is a failure, not a pass. Silence there would look exactly like
  agreement, which is how a check rots into decoration.
- **It found the 12th skill on its first run** - `discovery-digest` had been shipping
  for a while and no surface counted it. Fixed in the same change, including the open
  question whose *filename* carried the stale number (`eleven-skills.md` is now
  `shipped-skills.md`, and its doubt about the eight-to-ten ceiling got sharper, not
  weaker). Covered by `tools/facts-check-test.mjs`, 6 cases.
- **Adopters do not get it yet** - it is repo-own tooling until the shipping question is
  answered properly: a home in the tree, a manifest entry, and a normative hook that is
  recorded rather than implied. That sits on the backlog with the evidence it already
  earned here.

### The schema pair stops being a promise (2026-08-01)

- **`scripts/schema-pair.mjs` ships, and `self-verify` runs it** - R24 said the DDL and
  its typed twin are 1:1 and nothing proved it, which is the shape of rule that decays
  quietly: a pair held by review drifts one column at a time. The check is a manifest
  guard now, so a broken pair is drift with a number, and a repo with no
  `database/schema/` reports that and passes.
- **The pair is a declared edge, not a convention** - each file names its counterpart in
  a `pair: <path>` comment and the check resolves it both ways. A schema file naming
  nothing, naming a file that does not exist, or naming a twin that does not name it
  back are three distinct failures with three distinct messages.
- **What it proves, said plainly** - every name the DDL defines (table, column, enum
  type, enum label) appears in the twin, compared case- and separator-insensitively so
  a camelCase twin of a snake_case column matches. Type agreement is not checked:
  reading a Zod or Pydantic module structurally means knowing the language, so that is
  a stack-repo concern. Nor is a twin field with no column behind it drift - the
  database is the source of what exists, and a typed module carries input shapes and
  derived fields too.
- **Its own test found a hole in it** - `tools/schema-pair-test.mjs` drives the guard
  over fixtures, 9 cases, most asserting it fails. One case exposed a false negative
  that review would not have: the `pair:` line names a path, a path carries words, and
  `bookings.sql` was vouching for a table called `bookings`. The declarations are
  stripped before the twin is read.

### The database schema becomes something the repo holds (2026-08-01)

- **A new rule, R24** - a repo that owns a database carries that schema as executable
  DDL under `database/schema/`, complete enough to rebuild the database from a
  checkout alone. The standard already assumed the file existed: the shipped guard
  denies remote writes and tells the agent to leave a reviewed `.sql` there for a
  human to apply. Nothing had ever required it, so the schema lived in the running
  database and in a chain of migrations - a fold nobody performs by reading, with no
  floor under it when the database is gone.
- **And it exists twice, on purpose** - the same schema is also a typed, documented
  definition in the stack's idiom (Zod in TypeScript, Pydantic in Python), and every
  path that reads or writes the database goes through it instead of restating row
  shapes inline. The two are a declared **1:1** pair: every table, column, constraint
  and enum in one is in the other, each side names its counterpart, and a change to
  either lands in the same PR as the change to the other. Either side may be generated
  where the stack has a generator that does not quietly drop what DDL can express.
- **Why twice rather than one generated source** - the alternatives were considered
  and rejected in writing (ADR-027): migrations are the delta and not a readable
  state; an ORM model binds the most durable asset in the repo to a library's
  lifetime and to what that library can express; a `pg_dump` artifact is machine
  output whose diff nobody reviews. It is a fine check against the authored DDL,
  which is where it belongs.
- **Held by review for now, and that is on the backlog** - no manifest entry can
  prove a per-repo, conditional path, so `self-verify` does not see R24 yet. The
  mechanical pair check is a gate-health item rather than an assumption, because a
  pair held by review drifts one column at a time.

### The agent guards stop being walkable, and the coupling gate stops firing on data (2026-08-01)

- **Two bypasses in the shipped `PreToolUse` guards, both reproducible** - the
  remote-database guard decided "is this remote?" by grepping the whole command
  string, so `psql -h localhost -c 'select 1' && psql -h prod-db... -c 'DROP TABLE
  users'` vouched for itself; and its localhost match was unanchored, so
  `localhost.evil.example.com` - a resolvable name that is not loopback - read as
  local. Since the tree is copied into consuming repos, every repo that adopted the
  baseline inherited both.
- **A force-push guard that was never there** - the deny list blocks the literal
  spellings, and a permission pattern does not see
  `git commit -m "..." ; git push --force origin main`.
- **The guards are scripts now, not one-liners inside JSON** - 900 characters of
  shell in a JSON string is why both bugs survived review: nobody reads a line in
  that shape, and neither bug is visible without reformatting it. Each guard splits
  the command on `;`, `&&`, `||` and `|` and judges the segments separately, anchors
  the end of the hostname, and strips no quotes at all - which removed a third
  failure mode a consuming repo hit, where two unrelated apostrophes paired up and
  swallowed the `--force` between them.
- **They only speak when they deny, so they now have a test** -
  `scripts/verifyAgentGuards.sh` drives all three with 32 real commands, every known
  bypass among them as a regression case: a write to a remote host denied, a SELECT
  against the same host allowed, a write against localhost allowed, a plain push
  allowed, seven spellings of force-push denied. A broken guard is otherwise silent -
  it stops guarding and nothing says so. Writing the cases found two more holes: git
  accepts any unambiguous abbreviation of a long option, so `git push --force-with-l`
  is a real force-push that the first version of the guard let through - it now denies
  on the `--force` prefix, which every accepted abbreviation carries. And the database
  guard matched the host flag case-insensitively, so curl's `-H` read as psql's `-h`
  and a local write whose argument came from a curl call was denied as remote.
- **The coupling gate stopped demanding a spec update for data** - the capability map
  pointed `standard.manifest.json` at the verify engine, so registering those guard
  files - pure manifest data - failed CI with nothing legitimate to write, the exact
  erosion the gate-health epic was opened for. A map entry may now be
  `{ "glob": "<glob>", "couples": "shape" }`: the file's **key shape** is the
  contract, so an added entry or an edited value passes, while a key path that
  appears or disappears still demands the spec. Anything the guard cannot compare -
  no earlier version, unparseable JSON on either side - couples, so the quiet
  direction stays the guarded one.
- **The coupling guard sees files that are not added yet** - locally it read tracked
  changes only, so a new file in a capability's domain coupled in CI but not on the
  machine where it was written. The same hole as the entry below, in a second gate.
- **And it has its own test** - `tools/spec-guard-test.mjs` runs the shipped guard
  against real diffs in a throwaway git repo, 11 cases, most of them asserting that
  it still fires. A false positive is loud, a false negative is silent: a shape
  comparison that stops noticing a schema change looks exactly like a green run.

### The local link gate stops under-checking (2026-08-01)

- **Untracked markdown is in scope** - `link-check` read only `git ls-files`, so a
  brand-new document was invisible to it until `git add`. The gate passed, reported a
  file count that excluded the very files being written, and the dead link surfaced in
  CI, where everything is committed. It now scans untracked, non-ignored markdown too
  and names the untracked count in its verdict; the tree-guard spec describes the wider
  scope. Found by walking the repo's stale branches: the fix had been written and never
  merged, and the same hole bit the folder-authoring work that preceded this release.

### Working with AI gets an evidence layer (2026-08-01)

- **A new method folder: `docs/method/working-with-ai/`** - the method manual said
  who owns what in the PO -> Dev -> AI loop but nothing about the AI stage itself,
  which is where the loud claims and the thin evidence live. Seven notes, each one
  opening with the complaint people actually make and closing with the rule we run:
  comments that earn their tokens, context as the budget, felt speed vs measured
  speed, a check the agent can run, review as the place the cost lands, instructions
  that survive, and blast radius before autonomy.
- **A claim without a source does not go in** - every note declares a confidence
  (`strong` / `mixed` / `thin`), lists its sources with what each one actually shows,
  and carries a `Last checked` stamp, because a note about model behavior is a claim
  about a moving target. Vendor docs count as evidence of intent, surveys as evidence
  of perception, and only studies or large code datasets as evidence of outcomes - the
  notes say which they are leaning on.
- **The first entry settles a live argument** - "AI writes ten lines of comments for
  two lines of code" is true and measurable, *and* the counter-argument (comments
  carry context to the next, more atomic run) is half right: models read comments as
  semantics strongly enough that misleading ones hurt more than misleading variable
  names. The resolution is a lifetime test - expiring context belongs in the plan,
  durable non-obvious *why* belongs in the code, structure belongs in the spec - plus
  the observation that "I will remove them later" is the failure mode this standard
  exists to remove.
- **Wired in, not parked** - the folder is a manifest reference (adopted like the rest
  of the method manual), a docs-site page, and a link from `ways-of-working.md` where
  the AI stage is named.
- **Citations you can check without the link** - "16 developers, 246 tasks" is exactly the
  kind of claim a reader wants to verify, and a bare URL does not let them. Every note now
  cites by key into a bibliography
  ([sources.md](docs/method/working-with-ai/sources.md)) carrying the durable part: authors
  or publisher, date, stable identifier (`arXiv:2507.09089`, a thread id, an issue number),
  the sample the finding rests on, and an accessed date. The key's **prefix is the evidence
  class** - `Study`, `Data`, `Survey`, `Vendor`, `Incident`, `Field` - so a reader sees what
  kind of support a sentence has without leaving the sentence.
- **Every load-bearing figure re-read at the source, and two were wrong** - the pass turned
  up that trust in AI accuracy in the Stack Overflow survey is **32.7%**, not the 29% the
  press repeated (that is the *somewhat trust* band alone), and that the duplication growth
  cited from GitClear needed replacing with the measured series (cloned lines 8.3% -> 12.3%,
  moved code 25% -> under 10%, and 3.8% in the follow-up dataset). Entries now declare
  `primary` or `secondary`: reformatting an unverified number into a precise-looking citation
  makes it more misleading, not less. Names are used only where the source carries a byline;
  pseudonymous posts are cited by thread id, never by handle.
- **Notes declare how fast they rot** - a `Decays:` class (slow / medium / fast) and a line
  naming **what would change this**, which doubles as the re-check instruction. Economics and
  architecture age slowly; model behavior and tool defaults age fast; the README carries the
  three-level re-check - follow the falsifier, walk the source entries, then check the claim
  against our own repositories. A claim confirmed on our own code graduates into a case study.
- **An eighth note, and the field-report layer that earned it** - practitioner threads were
  read directly rather than through secondary write-ups, and the strongest signal was one
  the desk research had missed: consultants describing their inbound shifting from building
  systems to repairing AI-built ones. That is
  [the-cleanup-comes-later.md](docs/method/working-with-ai/the-cleanup-comes-later.md) -
  marked `mixed` on purpose, because loud testimony from a self-selected sample is not a
  measurement. The same pass sharpened four existing notes: comment density is *inverted* in
  agent-written code (heavy on trivial CRUD, near-absent where the maths is dense), a large
  green test suite can carry a tenth of its own value, an engineer publicly refusing to
  review code its authors cannot explain named the collapsed generation-to-review cost ratio
  before this repo did, and a long-running setup on a 300k-line codebase reached the
  skills-plus-hooks split by exhaustion rather than by reading the docs.
- **The README now says what each kind of source may prove** - a table separating controlled
  studies and code datasets (what happens) from surveys (what is perceived), vendor docs
  (what is intended), field reports (what people hit) and documented incidents (that it
  happened at least once, in public).
- **The pre-PR check list stops lying** - `AGENTS.md` claimed to carry "the same set CI
  runs" while omitting the spec-coupling guard, so a green local run could still meet a
  red CI. Both `spec-guard` invocations are now on the list, with a line saying that a
  check present in `checks.yml` and absent here is a bug in the list. Two specs the
  wiring touched moved with it: the web-surface spec stops hand-writing the page-map
  length (it was already stale, and the count is derived at check time anyway), and the
  verify-engine spec gains the criterion that manifest **data** growing is not an engine
  change - only a change in how an entry is interpreted is. The false positive behind that
  last one is captured in the backlog under a new gate-health epic: the coupling map cannot
  currently tell a file's schema from its data, so every future data-only manifest edit will
  fail the same way, and the cheapest escape is a cosmetic spec edit - which is how a good
  gate rots into ritual.

### The mainline gets a shape (2026-07-31)

- **Branch and history is normative now (ADR-026, new R23)** - the standard had
  nothing to say about how work actually reaches `main`, so the rule this repo
  learned the hard way (three PRs' commits stranded on a rewritten base) lived
  only in its own `CONTRIBUTING.md` and never shipped to anyone. R23 fixes that:
  a branch is updated by **rebasing onto its base** and the base is never merged
  back into it; every PR is based on the mainline, never on another open PR's
  branch; a PR lands as **one readable unit**; and a branch may be rewritten only
  while it is the author's alone.
- **Rebase-merge is the paved road, squash is the sanctioned alternative** - not
  a ban on merge commits. A merge commit at integration time is a legitimate
  shape; the braid produced by back-merges is what breaks history. Rebase-merge
  publishes every commit, so it comes with the bar that makes it honest: each
  commit complete, buildable, reviewed on its own. A repo that will not hold that
  bar squashes and records it in its branching ADR - both comply, drifting
  between them does not. The rejected options (merge commits by default,
  squash-everything, semi-linear where GitHub cannot offer it) are in the record
  together with the costs we accept (new SHAs, no signature survival, commits CI
  never tested in that exact form), so the argument is not re-run every PR.
- **It reaches adopters where they read** - the mechanics land in
  `docs/conventions.md` (merged into every repo's `AGENTS.md` at adoption), the
  shipped PR template gains the rebased-on-`main` check, force-pushing a branch
  others build on joins the red flags, and the decision checklist grows the
  integration-method row. Held open as an [open
  question](docs/open-questions/rebase-merge.md): squash asks less of a small
  team and delivers most of the benefit, and the option that wins on merits
  (semi-linear) is missing from GitHub, not from the reasoning.

### The standard declares itself living - latest is the only target (2026-07-30)

- **Latest-first (ADR-025)** - no version ranges or requirements anywhere,
  ever; every align and update targets the latest standard. The pin
  (`.standards-version`) is a bookmark of the last aligned state - what makes
  updates deltas and self-verify meaningful - never a constraint. References
  resolve at `main` deliberately: the canonical phrase on every live surface
  becomes "adopted by reference from the living standard - always latest"
  (ADR-004/023 keep their original text with revision notes). Staying current
  is a notification proposing a pin bump (a watch workflow and a Renovate rule
  on the pin file - recorded in the backlog until the first tag makes them
  provable).

### Discovery has a home, specs draft early, the front door leads with usage (2026-07-30)

- **Discovery dossiers (ADR-024)** - `docs/discovery/<topic>/` holds
  provenance-stamped extracts of meetings and mails (raw transcripts stay
  out); a dossier is **never normative** - where it differs from a spec or
  record, the spec has already won, so nothing gets re-litigated. The
  `Last reconciled:` stamp in the dossier README makes "explain it once"
  mechanical: agents ask only about entries newer than the stamp. Entries
  live as `new -> folded-into-spec | superseded-by-record | open`.
- **Typed open markers** - a spec can draft on day one of discovery
  (`in-refinement`, the draft state) holding each gap as a marker naming what
  is missing and who brings it: a question, a missing ADR/BDR, a missing
  input (UX design), a missing asset (credentials). The clarify gate now
  blocks the whole `[NEEDS ...` family, so the open markers ARE the gap
  list and the gate output reads as "what is left, and whose it is".
- **`discovery-digest`** - a new lifecycle skill, the dossier's curator:
  ingests notes/mails, writes the essence with provenance, flags
  contradictions between entries, reports when a topic is ripe for
  `/spec-specify`. It never writes specs; the spec skills never curate the
  dossier. `spec-specify`/`spec-clarify`/`spec-plan` read the dossier first
  and move the stamp when they consume it.
- **Docs lead with usage** - the README opens with the real asks you say to
  your agent (one sentence each); two new method docs are written as worked
  examples, not theory: `working-with-specs.md` (real situations -> the exact
  prompt -> what happens, corner cases included) and `discovery.md` (one
  feature walked from kickoff meeting to ready-to-develop). The landing's
  hero becomes a live agent session - the ask typed, the align played out to
  a plan; the prior landing stays at `site/previous.html` while the final
  template is chosen.

### The wizard, the feedback loop, the honest gates (2026-07-29)

- **Intake-first adoption (ADR-020)** - `align-to-standards` opens with step 0:
  measure the repo's state, then one question round - intent, technology (with
  the Layer 2 consent gathered up front), appetite, plan-only vs execute.
  Assessment-only becomes a legal, named outcome. Both phases walk one gate
  spine (`adoption.md`); brownfield reconstructs personas from the assessment's
  evidence and gets the stack offer right after the assessment, not at the end;
  greenfield gains an explicit starter-composition rule (degit into the root
  first, Layer 1 lays over it, collisions per adapt class). A pinned repo that
  wants a stack later has its own route. Every assessment finding and backlog
  item names the **owner role** that must act (product/business, architect,
  dev, agent).
- **Adoption feeds the standard (ADR-021)** - align and update runs close with
  a consent-gated upstream offer: a registry miss becomes a **stack request**
  issue, friction becomes an **adoption friction** report, a doc fix becomes a
  PR. New `.github/ISSUE_TEMPLATE/` forms (stack-request, adoption-friction,
  bug) give the signal one shape; CONTRIBUTING gains "Feedback from adopters";
  `llms.txt` tells agents the channel exists.
- **Lifecycle procedures are normative and agent-portable (ADR-019, new R22)** -
  the spec loop, backlog capture, pre-PR review and version updates MUST ship
  agent-executable; `.claude/skills/` + `scripts/spec/` is the reference form; a
  non-Claude repo ports them strictly to its own mechanism (the manifest accepts
  `.agents/skills`). The manifest entries now cite the rule that actually
  demands them.
- **Stacks linked, not version-locked (ADR-022, revises ADR-016)** - the stack
  manifest's `standards` version range is gone; the registry back-pointer is the
  linkage. Nothing version-shaped is checked or warned about; a core
  manifest-contract break is an explicit, recorded migration stacks chase on
  their own clock.
- **Everything consumed pinned exact, enforced (ADR-017 discharged)** - both
  this repo's workflows and the shipped templates pin actions by full SHA, run
  on fixed runner images and name exact node versions; `tree-check` gains a pin
  lint so a floating tag cannot return.
- **The manifest covers the whole tree** - the shipped-but-unlisted class is
  gone: `spec-guard.yml`, `docs/personas.md`, SECURITY, the PR template, the
  process docs, journeys/research/runbooks all have entries (with adapt classes
  and profiles); `tree-check` verifies the reverse direction (every shipped file
  is an entry or an explicit exemption). The intake asks core-vs-scale, align writes
  the answer into the manifest copy's **profile** field, and `self-verify` uses it
  as the default - a solo repo is no longer red out of the box; the shipped `spec-guard.yml`
  blocks on coupling only at scale and runs the full `--audit` on every PR.
- **Derived facts stop being hand-written** - rule counts and ranges left every
  surface (say "the numbered rules"; the number lives in SPEC.md); `tree-check`
  fails a surface that hardcodes one; `site-check` derives the docsite page
  count from the PAGE MAP and asserts the landing advertises `VERSION`. The
  persona gate cannot silently evaporate (specs without a roster now fail the
  structure guard; the roster is a required manifest entry) and committed
  plan/tasks scaffolding is warned about (R13).
- **Method docs live beside the tree (ADR-023, extends ADR-004)** - the
  adoption checkmap, repo assessment, taxonomy, decision checklist, ways of
  working and changelog process moved to `docs/method/`; the shipped tree is
  now literally the client repo at day zero. Clients adopt the method **by
  reference at the pinned version**: the manifest carries a `references`
  section, `self-verify` notes it and never file-checks it (the old
  reference-entries-with-required-file contradiction is gone), and
  `tree-check` fails a dead reference.
- **The generator serves any repo** - page titles, sidebar footer links and the
  generated README come from `site.config.json` / repo-agnostic text instead of
  hardcoded core chrome ("one form, many sites" made true).
- **Repo hygiene** - own CODE_OF_CONDUCT, own SECURITY.md (the shipped one is
  the template), own PR template; `update-to-version` states where the two
  manifests come from and updates the stack layer too; `docs/self-verify.md`
  says plainly which rules the drift number covers and which stay
  review-verified; FAQ and PRODUCT catch up with the extracted engine and
  satellite stacks; the garbled shipped texts (checklist, enforcement,
  conventions) read clean; the ADR/BDR templates no longer hardcode the
  author's name.

### The spec, the tree, the engine (2026-07-22)

- `standard/SPEC.md` - new: the whole normative core on one page - numbered
  MUST/SHOULD rules (RFC 2119), versioned with the standard. Where any other
  document appears to add a requirement, the spec wins. The manifest is its
  machine-readable projection: every entry cites the rule it enforces (`rule: "R#"`).
- **One authored tree (ADR-014)** - `standard/` is now the single committed,
  consumable form at real-repo paths; the old source/dist pair and `tools/reflect.mjs`
  are gone (the reflect build and its four mapping classes were introduced and
  retired within this unreleased span). `tools/tree-check.mjs` guards the tree
  instead: no repo-own leaks, every manifest promise present, and the pristine tree
  passes its own `self-verify --skeleton` (new flag). Adoption is one line:
  `npx degit bodurkalukasz/repository-standards/standard`.
- **Spec engine extracted (ADR-015, supersedes ADR-013)** - the five load-bearing
  Spec Kit prompts are now the standard's own skills (`spec-specify`, `spec-clarify`,
  `spec-plan`, `spec-tasks`, `spec-implement`; provenance: github/spec-kit v0.13.2,
  MIT, `scripts/spec/LICENSE`), their runtime at `scripts/spec/`. Deleted: the
  vendored area, `.specify/`, the ten `speckit-*` skills, the dead
  `create-new-feature.sh` and ~600 lines of extension-hook boilerplate.
- **Skills consolidated** - one family, eleven shipped: `backlog-from-specs` merged
  into `add-to-backlog` (two automatic triggers), the `spec-analyze`/`spec-converge`
  stubs folded into `spec-reconcile`'s new cross-spec consistency step; transition
  flows collapsed into one router (`skills/align-to-standards/` with greenfield and
  brownfield phase files; `modernize` now lives as adoption's plan-then-refactor
  pass, ADR-007 unchanged); `disable-model-invocation` now matches what `AGENTS.md`
  orders (impact/reconcile/backlog self-fire, update stays gated).
- **The repo gates itself** - first own CI (`.github/workflows/checks.yml`):
  tree-check, link-check (every relative md link must resolve), docsite build +
  site-check. The web surface moved to `site/` (landing committed, `site/docs/`
  generated and gitignored); `apps/` and the wheel experiments are gone.
- `changes/` retired for this repo - fragments folded here; the maintainer edits
  `## Unreleased` directly. Team repos keep the fragments mechanism as a
  scale-profile prescription (`standard/docs/changelog-process.md`, the assembler
  now ships as `scripts/changelog.mjs`).

### Lifecycle and the guided loop (wave 2)

- **Artifact lifecycle (ADR-010, Accepted)** - one arc for every artifact: ideas live
  in `docs/ideas/` (status-driven, no records until approved, graduation on
  approval); specs/records/docs are permanent and living; plan/tasks are ephemeral
  and removed at close; enabling work (tokens, access) goes front-matter -> tracker
  as blocking stories, never spec prose. Tracker posture: GitHub Issues default,
  Jira and Linear as adapters behind a one-way bridge with key write-back.
- **Statuses + the clarify gate** - a capability spec carries
  `Status: in-refinement -> ready-to-develop -> in-development -> live`;
  `ready-to-develop` is earned mechanically (a `## Clarifications` section, zero
  open markers). The loop runs itself: agents start the clarify loop unprompted,
  record deferrals as answers, and refuse to plan past a failing gate.
- **Guided align** - `align-to-standards` is re-entrant: resume from measurement,
  payoff-ordered waves, repeat to drift 0.
- **Ideas/discovery** - speculative ideas are a first-class pre-decision kind:
  explored end-to-end in one doc, no ADR/BDR/spec until approved; `Proposed` means a
  decision awaiting ratification, never a maybe.
- **Living documents + folder READMEs** - docs change by editing the same file in
  place (the current version is the truth, git is the history); every folder
  explains itself with a three-section README.
- **Structure dogfood (ADR-008, revised by ADR-014)** - root `AGENTS.md` maps the
  zones; strays rehomed; working notes live outside the repo by rule.
- **Personas as a validation gate (ADR-006)** + the standard's own roster; the
  structure guard fails a spec that serves nobody; UX forks catalogued (NN/g review
  lens, JTBD, W3C DTCG tokens). Plain-language explain mode for the PO.

### The align engine

- `standard.manifest.json` (ADR-005, Accepted) - the standard describes itself as
  data: files, sections, guards and decisions an aligned repo must have, each with
  an `adapt` rule and a profile (`core`/`scale`, ADR-011 - one standard, two
  verified profiles).
- `scripts/self-verify.mjs` - manifest-driven compliance: reports **drift as a
  number**, asserts the `.standards-version` pin, `--profile` filters, warns on
  hand-copied transition skills (ADR-009), and `--skeleton` verifies the shipped
  tree itself.
- `update-to-version` applies the manifest-to-manifest delta and carries
  `exceptions` forward; in-repo instructions are the source of truth (ADR-012) -
  personal memory may point at rules, never hold them.

### Adoption, brownfield, and cross-discipline standards

- `docs/adoption.md` - the adoption checkmap: ordered gates from unaligned to
  aligned + self-verifying, each producing an artifact; ends in a counted backlog
  and a green self-verify; includes model guidance and the plan-then-refactor
  modernize pass (ADR-007).
- Brownfield: `onboard-repo`'s derive flow (capabilities, decisions the code
  implies, the rest as backlog) and the eight-pass repo assessment now live inside
  the align router's brownfield phase.
- Backlog layer: the ordered, agent-first backlog template (INVEST + DoR); capture
  via `add-to-backlog` incl. automatic items from spec deltas and drift findings.
- Cross-discipline standards folded in: C4 (architecture diagrams), WCAG 2.2 AA
  (accessibility floor), Impact + Story Mapping (greenfield discovery), OWASP ASVS +
  SLSA (security baseline references), working-language policy (natural language is
  a per-artifact config; default English).

### Layer 2 - split into satellite stack repos (ADR-016)

- Layer 2 leaves the core: technology best practices live in one repo per
  technology (`repository-standards-<tech>`), discovered via the `stacks.json`
  registry - the only source of officialdom. First satellite:
  repository-standards-node (DECISIONS + the boot-verified starter + its own
  weekly boot CI + `stack.manifest.json` declaring `standards: ">=0.8 <1"`). The align
  router detects the target repo's technology and offers the matching practices;
  greenfield degits the stack's starter. One stack per technology by policy -
  variation is a profile or an adoption mode, never a sibling repo.

### Layer 2 - Node/TS (now in repository-standards-node)

- `stacks/node-ts` - the evidence-based paved road: pnpm + Turborepo, Node 24,
  Biome (+ Prettier for SCSS), strict TS, Fastify native-DI service template with
  Zod env, Next App Router config, hardened least-privilege Actions, 7-day
  supply-chain cooldown; every pick with pros/cons and provenance in DECISIONS.md.
- Tiered testing: unit + integration co-located (Vitest projects), e2e workspace
  (Playwright), advisory Lighthouse CI, ephemeral Docker test-stack - real
  dependencies, not mocks; maintenance rules stated (flake quarantine, coverage as
  a floor on paths that matter).
- App shell (DECISIONS #10): Better Auth + `openid-client` for enterprise SSO,
  Next proxy -> Fastify with default-deny at both gates, CSS Modules + SCSS + DTCG
  tokens; the boot-verified `starter/` - install, dev, sign-up -> dashboard proven
  by curl and a Playwright journey.

### Release machinery

- Two-changelog process for team repos: per-PR fragments assembled by
  `scripts/changelog.mjs` (`--check` validates frontmatter) into the technical
  changelog and a curated release-notes draft; the maintainer cuts every release.
  This repo itself edits `## Unreleased` directly (solo, core profile).

### Supply chain and one home for history (2026-07-29)

- **R21 + ADR-017: everything a repo consumes is pinned exact** - dependency
  manifests, overrides and lockfiles carry exact versions (no ranges), container
  images, CI runners and actions name an exact version or digest (never `latest`,
  never a floating tag); upgrades are explicit, reviewed diffs, behind the
  release-age cooldown. New "Exact versions, everywhere" principle in the shipped
  `PRINCIPLES.md`; per-stack mechanics stay in the stack repos.
- **R4 sharpened + ADR-018: history lives in the changelog, never inside living
  documents** - a spec or doc carries no `## Change log` section; git and the
  changelog process are the only history. The spec template says so; the
  changelog process gains "The only home of history"; the coupling-guard docs
  gain map hygiene (capability globs skip dependency manifests/lockfiles, and a
  guard hit on a behavior-free change means reconcile the spec or narrow the
  map, never append a history note).

## 0.7.2 - 2026-07-07

Spec methodology sharpened - combines the by-capability and spec-depth work.

- `specs/README`: specs are organized by **capability/domain, not by page or route**
  (UI-surface is a docs cross-reference). Plus **Spec depth: buildable, not
  descriptive** - specs carry the contracts (data, interface, algorithms, state,
  acceptance criteria), with a `buildable` / `behavioral` tier.
- `capability-spec.template.md`: the buildable sections (Data / Interface contracts,
  Algorithms, State machine, Config, Acceptance criteria) + a `Spec tier` line; the
  depth rationale lives in `specs/README`, not restated in the template.
- `decision-records/adr/ADR-002` (by capability) and `ADR-003` (buildable) - the two
  decisions with their rejected forms (ticket/page numbering; descriptive-only).

## 0.7.1 - 2026-07-07

Dogfood the decision-record system and settle its policy (ADR-001).

- `decision-records/adr/ADR-001-decision-record-policy.md` - the first real ADR:
  records use MADR; ADR = a broad *technical* decision (framework / library / tooling /
  infra / data), BDR = business (separate stream), sub-scope via `Tags`, no TDR and no
  bespoke sub-type acronyms.
- `decision-records/README.md` - added the "what counts as a record here" glossary,
  the authoritative definition ADR-001 drives.
- `decision-records/adr/_template.md` - added the MADR `Confirmation` field (the
  decision -> enforcement bridge).

Source-only; `dist/` syncs via the planned build step.

## 0.7.0 - 2026-07-07

Ship the spec-structure guard - the mechanical "no ticket-numbered spec paths" half
of the spec policy that `enforcement.md` described but never shipped. Live gap it
closes: a consumer's align produced `specs/cms/001-core/` - a Spec Kit
`/speckit-specify` leak - and nothing caught it.

- `spec-structure.mjs` (source `specs/`, dist `scripts/`) - dependency-free guard
  that fails on `specs/**/NNN-*`. Modes: full-tree audit, `--staged`, `--base --block`.
  Needs no capability-map, so it runs from day one.
- Wired into the `spec-guard` CI workflow as a second gate (structure + coupling).
- `commands.md`: explicit Spec Kit boundary - never `/speckit-specify`; capability
  specs only via `/spec-update`.
- `enforcement.md`: the structure lint is now shipped, not just described.

## 0.6.1 - 2026-07-07

Housekeeping: reconcile drift between the source and `dist/` (no policy change).

- Renamed the standards-layer references from `CODING_STANDARDS` to `conventions`
  everywhere (the docs-hub link was dead), matching the actual `conventions.md`.
- Finished removing the TDR stream (gone since 0.3.0): dropped the stale
  `ADR / BDR / TDR` title and the "TDRs are living" line from the decision-records
  README, plus the TDR mentions in the PRINCIPLES and PRODUCT templates. The
  "there is no TDR stream" notes stay.
- `enforcement.md`: dropped the phantom `bin/sync.sh` reference (removed in 0.6.0)
  and fixed `capability-map.yml` -> `capability-map.json`.
- `CONTRIBUTING.md`: reduced to a pointer into `AGENTS.md` instead of restating its
  rules (single source of truth).
- Known remaining: source and `dist/` still diverge in content (e.g. the
  decision-records "Records vs working docs" section) - the planned source->dist
  build step will resolve this systematically.

## 0.6.0 - 2026-07-06

Restructured as a framework: source organized by concern (loose at the repo root)
plus `dist/` as the assembled result.

- Promoted the former `core/` contents to the repo root as concern folders
  (`agents/`, `claude/`, `decision-records/`, `docs/`, `github/`, `gitleaks/`,
  `skills/`, `specs/`) - the maintained source.
- Added `dist/` - the standard assembled as a real repo skeleton (the final product
  to reflect); currently a committed snapshot, a build step will keep it in sync.
- Completed the spec-first workflow in the source: `/spec-*` skills, Spec Kit setup,
  constitution bridge, `align-to-standards` skill.
- Removed the old copy mechanism (`bin/sync.sh`, `manifest.json`) - superseded by
  agent comparison. README rewritten as the framework guide.

## 0.5.0 - 2026-07-06

- **Records vs working docs** - `core/decision-records/README.md` now draws the line
  between decision records and plain working docs (research / screening / workstream
  material), with a lifecycle rule for organizing working docs: phase-boxed
  exploration in a discovery folder, standing workstreams and living libraries in
  their own top-level `docs/<workstream>/` folder. Pointer added to the agent
  conventions block (`core/agents/conventions.md`).

## 0.4.0 - 2026-07-06

Spec-policy enforcement is now shipped, not just described (proven in a pilot).

- `core/specs/spec-guard.mjs` - the coupling guard, dependency-free (Node + git),
  reads `specs/capability-map.json`. Modes: `--staged` (pre-commit warn),
  `--base <ref> [--block]` (CI).
- `core/github/workflows/spec-guard.yml` - the CI job (blocks on PR).
- `core/specs/capability-map.example.json` - example `capability -> code globs` map.
- `bin/sync.sh` now copies the guard and its workflow into a target repo;
  `enforcement.md` points at the shipped files.

## 0.3.0 - 2026-07-06

Spec model reworked: **living capability specs** as the behavioral source of truth,
decision records slimmed, TDR removed.

- **`core/specs/`** (new) - capability specs = "what the system does now", organized
  by domain not ticket. README (model + git-native change delta + workflow),
  `capability-spec.template.md`, `commands.md` (`/spec-impact` `/spec-clarify`
  `/spec-update` `/spec-analyze` `/spec-reconcile` `/spec-converge` on the Spec-Kit
  engine), `enforcement.md` (pre-commit + CI spec-policy guard: structure lint +
  code/spec coupling guard via a `capability-map`, plus an optional AI reconcile).
- **Decision records** - reduced to ADR + BDR (the *why*, kept lean). **TDR stream
  removed** - "living technical design" is absorbed by capability specs (behavior)
  and `ARCHITECTURE.md` (structure). Altitude hierarchy updated to place specs.
- **Repo docs** - `ARCHITECTURE` reframed as structure/boundaries (not behavior),
  docs hub + AGENTS updated to point at specs as the behavioral source of truth.
- Removed `core/spec-kit/` (superseded by `core/specs/`).

## 0.2.0 - 2026-07-06

Methodology layers added - the standard now carries shape, not just guardrails.

- **Decision records** (`core/decision-records/`) - ADR + BDR + TDR system:
  templates, index stubs, lifecycle, altitude hierarchy, governance.
- **Repo docs** (`core/docs/`) - mandatory templates every repo fills: `PRODUCT`
  (vision + current state), `ARCHITECTURE` (technical), `AGENTS` (entry point),
  `PRINCIPLES`, docs hub.
- **Process** (`core/spec-kit/`) - spec-driven development is core: install +
  flow + a thin `constitution.template.md` governance bridge that defers to
  AGENTS.md / ADR / standards instead of duplicating them.
- README: documented the shape-vs-content distinction and the four core layers.

## 0.1.0 - 2026-07-06

Initial core seed, extracted from an internal engineering audit.

- `core/claude/settings.baseline.json` - agent permission baseline (deny/ask) +
  two PreToolUse guards: remote-DB write guard and GitHub secrets/variables guard.
- `core/gitleaks/.gitleaks.toml` + `core/github/workflows/gitleaks.yml` - secret
  scanning (pre-commit + CI, pinned gitleaks binary).
- `core/github/pull_request_template.md` - PR template with ADR-impact section.
- `core/agents/conventions.md` - single-source conventions block (Conventional
  Commits, ticket-after-colon, no AI attribution, ASCII hyphen only) to merge into
  a repo's AGENTS.md - not duplicated into tool files.
- `core/CONTRIBUTING.md` - thin contributor guide pointing at the repo's AGENTS.md.
- `core/skills/pre-pr-review/SKILL.md` - clean-context self-review before opening a PR.
- `bin/sync.sh` - apply core into a target repo (non-clobbering, drift-aware).
- `skills/align-to-standards/SKILL.md` - agent-native reconciliation of a repo to
  the current standard.
- `manifest.json` - sha256 per core file for drift detection.
