# repository-standards - backlog

> The standard's **own** backlog, dogfooding [`standard/docs/backlog.md`](standard/docs/backlog.md).
> A working doc in the repo-own zone - the same role `PRODUCT.md` plays. Ordered by
> risk x leverage; an item leaves only when its **definition of done** is met. Feeds:
> this repo's roadmap ([`PRODUCT.md`](PRODUCT.md)), spec deltas, and code<->spec drift.
>
> One table for everything currently live in this repo - build work, standing doubts and
> unapproved features - distinguished by `type`, so the dashboard's Backlog tab shows all of
> it. Decision records (ADR/BDR) stay separate: a record is a fork already taken; these rows
> are not. See
> [ADR-046](docs/decision-records/ADR-046-backlog-is-the-one-index-open-questions-and-ideas-get-a-type.md).

**`type`**: `task` (default, and every row below that omits history is one) / `bug` /
`open-question` / `idea`.

**Status, per type:**

- `task` / `bug`: `todo` / `doing` / `blocked` / `done`. A `done` row leaves this file at the
  release cut - relocated, not deleted: its finding goes to a record, a spec or a dossier,
  what shipped goes to the changelog, and the row itself moves to `docs/backlog-archive.md`
  carrying a pointer to where its content went
  ([ADR-051](docs/decision-records/ADR-051-closing-a-backlog-row-is-a-relocation-not-a-deletion.md),
  enforced by `standard/scripts/backlog-archive-check.mjs`).
- `open-question`: `open` (nothing decided yet) or `decided` (a decision stands - and stays
  open to a better one; that is the type's permanent condition, not a completion state). How
  strong the standing answer is lives in the row's `why`, not in a third status value.
- `idea`: `idea` -> `exploring` -> `approved` | `parked` | `dropped`, then `graduated` once an
  approved idea has a backlog intent, a spec and records of its own.

Full deliberation for an `open-question` or `idea` row - options weighed, related records, who
it serves - stays in its own file under [`docs/open-questions/`](docs/open-questions/) or
[`docs/ideas/`](docs/ideas/); the row here is the index entry, not the whole argument.

**Column exemption, stated rather than silent.** The shipped format
([`standard/docs/backlog.md`](standard/docs/backlog.md)) also carries `cap`, `persona` and
`owner`, and the shipped `add-to-backlog` skill refuses a row without them. This repo runs
the shorter shape on purpose: it has one contributor, so `owner` is always the same person,
and its work is the standard itself rather than a product with capabilities - `cap` would be
`-` on every row and `persona` would be `Standard-bearer Staszek` on nearly all of them.
Three columns that never vary are noise, not traceability. This is the same class of
exemption as the one [`AGENTS.md`](AGENTS.md) records for the alignment record: written down,
because an undeclared divergence from your own shipped format is indistinguishable from
having forgotten it. The reverse also holds: `type` is an **addition** beyond the shipped
column set, not part of R15's mandated shape - `standard/scripts/generate-dashboard` reads it
as optional and defaults any row without one to `task`, so an adopter's unmodified
`backlog.md` renders exactly as it does today.

## Epic: Layer 2 - Node/TS stack

| id | type | title | why | DoD | status |
|----|------|-------|-----|-----|--------|
| MAP-1 | task | Decide whether an adopted repo gets its own generated file map | `docs/file-map.md` renders every shipped path with its purpose and the rule behind it, and it is **zone 1 only** - an adopter's repo has the same folders, the same orientation problem and its own manifest carrying its own exceptions, and gets nothing. The asymmetry was not decided, it is where the tool happened to be written | a decision either way. Shipping it means the generator lands in `scripts/`, a manifest entry, and **a freshness check** - a map that silently describes last month's repo is worse than none, so `self-verify` would have to count staleness as drift, which grows the guard list for every adopter. Not shipping it means the standard tells adopters their repo should explain itself while handing them no way to do it, which is the weaker position of the two | todo |
| STACK-LIFE-1 | open-question | Whether a stack ships procedures or only data | Layer 1 ships 19 lifecycle skills; Layer 2 ships four data files and none. Adoption is covered (thinly - `stack.md` is 41 lines), but a technology's **recurring** work has no home at all: adding a dependency under R21's pin-plus-cooldown rule, a framework major, a new test tier, a migration. `stack.manifest.json` is the core manifest's schema, so a stack **can** already ship `.claude/skills` entries - the mechanism is latent and undocumented, which is how the second stack ends up doing it differently. Full deliberation, including the four unanswered sub-questions, in [`stack-lifecycle-skills`](docs/open-questions/stack-lifecycle-skills.md) | a decision recorded either way, covering: ship-vs-stay against ADR-009, how two skill families stay discriminable in one namespace, who owns the R22 port, and which side wins when `AGENTS.md` merges. **Gated on STACK-ALIGN-1**: the Layer 2 path has never executed on any repo, so the recurring work has not been observed yet and inventing skills for it now would be armchair design | open (gated on STACK-ALIGN-1) |
| STACKS-2 | task | Second stack repo proves the registry model | one technology in stacks.json proves nothing about the seam; a second (Python, evidence-gated) must land as one new repo + one registry line with the core untouched | new repo repository-standards-python + registry entry; core diff = 1 line; still gated on a real evidence repo | todo |

## Epic: Discoverability - AI agents recommend it

When someone asks their AI agent how to organize or run a repo, the agent should
surface this standard. Being good is not enough; it has to be *found* by the tools
people now ask first.

| id | type | title | why | DoD | status |
|----|------|-------|-----|-----|--------|
| DISCO-1 | task | Deploy tail: listings | the name is settled and both domains are owned; **the site is live** - confirmed 2026-08-09 at repositorystandards.com, auto-deployed by `pages.yml` on every push to `main` - but it is not submitted anywhere a search engine or agent would find it unprompted | submit the listings (awesome-lists, the AGENTS.md ecosystem, registries). npm dropped from this row - [`npm-as-a-channel`](docs/open-questions/npm-as-a-channel.md) decided no package for now, so there is nothing to publish there. Measured by: a fresh agent, asked the target questions with no prior context, names it | doing (site confirmed live 2026-08-09; listings submission still todo) |
| DISCO-3 | task | Publish the posts (owner) | LLMs learn from and cite public writing; the queries "how to keep docs/specs/decisions in-repo, agents-first" should resolve here | three posts publish-ready in the owner's private space, CTAs wired to the repo, then the owner's publish click on their channels - the only physically external action in the epic. **Unverified 2026-08-09**: no `posts/` folder currently exists under the owner's private tracking space, so it is unclear whether drafts exist, were lost in an unrelated cleanup the same day, or this row assumed content that was never written. Needs the owner to confirm before this can move | todo (downgraded from `doing` 2026-08-09, pending owner confirmation) |
| DISCO-4 | task | Instructional videos for using the standard | proposed by Andrii S. and endorsed by the owner. Everything this project ships is read: a spec page, a method doc, a skill description. Nothing shows the loop *moving* - and the loop is the product. A reader deciding whether to adopt has to assemble the motion in their head from static pages, which is the highest-friction step in the funnel and the one `DISCO-1`'s listings and `DISCO-3`'s posts both dead-end into | a short series, each video one real run against a real repo rather than slides: adoption end to end (the `FIELD-1` run is already a working script - drift 14 to drift 0 on somebody else's repo), the feature loop (specify -> clarify -> plan -> implement -> reconcile), and what a guard actually does when it fires. Recorded, not staged - a rehearsed take of a real session, so the failures that show up stay in. Linked from the README and the site | todo |

## Epic: Gate health - the guards stay honest

A gate that fires when nothing is wrong teaches people to satisfy it cosmetically, and
then it is decoration. Items here keep the guards deserving of the trust they demand.

| id | type | title | why | DoD | status |
|----|------|-------|-----|-----|--------|

## Epic: The decision log says less and still says it

The log is load-bearing, not archive: [ADR-033](docs/decision-records/ADR-033-the-spec-loop-reads-the-decision-log-before-it-writes.md)
has the spec loop read it before it writes, and `discovery-digest` greps every record's
`## Revisit when`. Both assume records get read. Measured 2026-08-14: 51 records, 5,414
lines, median 97 and 25 of them over 100, against a shipped template of 66. Two distinct
problems - some of the content is not a decision at all, and the content that is a decision
is buried in prose no human would have written.

| id | type | title | why | DoD | status |
|----|------|-------|-----|-----|--------|
| ADR-SCOPE-1 | task | Audit which records hold a decision and which hold a rule | a record exists to fix a fork that was taken; a rule belongs in the spec and a practice belongs in method guidance. 25 of the 51 records name a numbered rule, and where the rule text lives in `standard/` too, the record restates it - two homes for one statement, which is exactly the drift `spec-guard` exists to stop everywhere else. The reader pays for it twice: the log is longer than the decisions in it, and a rule found in a record may be the stale copy | a verdict per record - stands as a decision / its normative content moves to the spec or to method guidance and the record keeps only the fork / it was never a decision. Numbers are gapless and never reused ([ADR-001](docs/decision-records/ADR-001-decision-record-policy.md)), so the third verdict needs a named state and a line in the README table, not a deleted file; `Superseded` already covers a decision replaced by another and does not fit content that was never one. The moves land as spec or guidance edits in the same PR as the record edit, so neither half is homeless in between | todo |
| ADR-VOICE-1 | task | Cut each surviving record to what it decided, in a human voice | they were drafted with an agent and read like it: context restated that the linked spec already carries, options argued past the point of decision, consequences enumerated for completeness rather than because anyone will act on them. The longest is 310 lines. Length is not a style complaint here - a record nobody finishes is a record the loop reads and the human does not, and `discovery-digest` is then checking new material against text that has stopped being reviewed | every surviving record reads in about a minute: the fork, the call, what it costs, what would reopen it - each stated once, no reconstruction of the discussion. Concrete over general throughout; a number where there is a number. **The template and `adr-write` get the same cut in the same PR** - both ship to adopters, so trimming 51 files while the generator that wrote them stays unchanged exports the problem and regrows it here by the next record | todo (follows ADR-SCOPE-1 - no point rewriting a record whose content is about to move) |

## Epic: The profile split earns the weight the docs put on it

The pitch that a small project carries much less rests on one flag. What the flag actually
moves is a small set of manifest entries - the count is declared in
[`docs/facts.json`](docs/facts.json) and named in the picker - and until 2026-08-07 the
picker described a different set.

| id | type | title | why | DoD | status |
|----|------|-------|-----|-----|--------|
| PROF-3 | task | Decide whether more of the tree belongs to `scale` | the measurement is the finding: a tenth of the entries and two rule clauses separate the profiles, so "a small team carries much less" rests on very little. PROF-2 made the docs say that plainly rather than move entries, because nothing observed so far says which way they should move - and moving one changes what every adopter at that profile owes. The standing doubt this would settle is tracked as `PROFILES-1` below; this row is the evidence-gathering work that could answer it | an adoption by a repo with **two to five people**, recorded in `docs/validation/runs/`, answering which scale entries felt like ceremony and which core entries felt like coordination work the repo did not need; then a decision either way - entries move profile with the delta measured, or the split is confirmed as it stands and [`docs/open-questions/profiles.md`](docs/open-questions/profiles.md) records why that size is right. Not closable from this desk: every field run inferred its profile from committer counts and the smallest team any of them records is 38 authors, so the range this decides hardest has never been observed | todo (gated on a 2-5 person adoption, which no run in the suite is) |

## Epic: Work sprints - the repo answers "when will this land"

Designed in [ADR-028](docs/decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md);
the name was resolved in [ADR-041](docs/decision-records/ADR-041-the-bounded-period-of-work-is-called-a-sprint.md)
(`sprint`, per team - tracked as the standing doubt [`WORK-PERIODS-1`](#epic-open-questions)
below, since a resolved open question stays open to a better answer rather than closing like a
finished task). **All four shipped on 2026-08-02.** The capability spec was written before the
code, as the record said it would be - though by hand rather than through `/spec-specify`,
which is worth saying plainly: the experiment of running the loop on its own features was only
half done, and the half that was skipped is the half that would have tested the loop.

| id | type | title | why | DoD | status |
|----|------|-------|-----|-----|--------|
| ARCHIVE-VIEW-1 | task | Decide where a relocated backlog row resurfaces in the view | [ADR-051](docs/decision-records/ADR-051-closing-a-backlog-row-is-a-relocation-not-a-deletion.md) requires closed rows to stay **reachable** and named the "show finished" chip as the surface. The chip was removed in 0.9.13 - it made the count under the pool mean two different things depending on a button nobody remembers pressing - so the requirement stands with nothing carrying it. Nothing is broken yet only because `docs/backlog-archive.md` does not exist; the first release cut that writes one lands work the view cannot reach | a decision recorded in ADR-051's own section, then built: which surface reads `docs/backlog-archive.md` - the Timeline, a Reports section, the pool's search, or a control of its own - and what a reader sees who arrives asking "what happened to ADR-SCOPE-1". Must land before the first archive is cut, which is the next release that closes a row | todo |
| CYCLE-6 | task | The dashboard gets a capability spec | it shipped under `$unclaimed` in the coupling map, which is the declared form of "code with no spec yet" and not a resting place: the next person changing what a report counts has nothing that says what it must answer, and the reports are the part where a wrong number is worse than no number | a buildable spec under `specs/` covering the projection contract (no writes, deterministic), what each report answers and from which file, the freshness contract, and the publication gate; the coupling map entry moves out of `$unclaimed` | todo |

## Epic: The wizard co-authors, it does not hand out templates

The spec loop has six skills for one artifact. Decisions, the product frame and personas
have templates and nothing that writes them *with* the user - so the flow asks a product
person to fill an ADR the way a developer would. A technical decision, a business decision
and a product frame are three different conversations, and one generic authoring voice
serves none of them.

| id | type | title | why | DoD | status |
|----|------|-------|-----|-----|--------|

## Epic: Evidence - does any of this survive contact with a real repo

| id | type | title | why | DoD | status |
|----|------|-------|-----|-----|--------|
| FIELD-1 | task | Run the standard against three real repositories | the align router is the product's core and the only major component with no gate of any kind - every mechanical guard has a test, the router has none. Until it has been run against a repo nobody wrote for it, "walks a messy repo back to health" is a design claim | three public repos aligned as a user would ask, not as an author would drive: one small on a registered stack, one mid-size on an **unregistered** stack (the honest-miss path, `stack-decisions.md`, the consent-gated issue), one large and multi-year (waves, a counted backlog, drift as a number). Five command shapes exercised - align, plan-only, greenfield, registry miss, verify - with real ADRs and BDRs written along the way. Findings land as backlog items or fixes; the run itself is written up as the adoption evidence EXHIBIT-1 asks for | todo (2 of 3) - **the first real adoption landed 2026-08-06** (`hagopj13/node-express-boilerplate`, a third-party Express/Mongoose API boilerplate, drift 14 to drift 0 on a local branch: three capability specs authored from the code, a persona roster reconstructed from `roles.js` and the route table, three retroactive ADRs, nine backlog items, recorded in `docs/validation/ai-prompting/runs/2026-08-06-b-field1.json`) and **the large multi-year repo followed the same day**: `matomo-org/matomo`, 13,591 tracked files, 31,287 commits since 2007-07-24, 479 all-time author names, 98 plugin directories (16 of them git submodules), taken from **drift 17 to drift 0** on a local branch - a 14-capability map derived from behaviour rather than from the plugin layout, two capability specs written buildable with `file:line` anchors, five retroactive ADRs and one deliberately-`Proposed` BDR, and a **36-item counted backlog**. The suite's second **L3** target, 16 observations in `docs/validation/ai-prompting/runs/2026-08-06-s-field3.json`, twelve new cases. **What the scale run proves, and it is not what was expected:** waves are a first-class concept in the router already (the appetite question at intake, the re-entry section, "wave one closes red, by design"), the backlog it produces is counted and prioritised, and every guard finished in under 250 ms on 13,591 files - cost is not the problem at this size. **What it disproves:** the drift number. It reached 0 in one sitting on a nineteen-year platform where 12 of 14 capabilities have no spec and 36 items remain, because drift counts manifest entries and the manifest has 59 of them whatever the repository's size. Worse, `self-verify` measures the working tree and never the index, so on a repo whose own `.gitignore` excludes `/docs/` the 14 artifacts written there - the persona roster, every decision record, PRODUCT, ARCHITECTURE - reported PASS and were absent from the 51-file commit. **What is still missing:** the mid-size repo on an **unregistered** stack (the honest-miss path, `stack-decisions.md`, the consent-gated issue), and the operator-independence half - both adoptions were driven by this project's own agent with no user to interview, so every intake question that needs a human (the persona tie-breaker, the appetite, the workflow blast radius) was answered by inference and marked as such. Three of five command shapes exercised |

## Epic: Deferred by the one-tree restructure

The collapse to a single authored `standard/` tree deliberately left several threads for
later - all demand-driven, none blocking a release.

| id | type | title | why | DoD | status |
|----|------|-------|-----|-----|--------|
| OPS-1 | task | Operate-cluster depth | the standard covers deciding and building deeply; the operate side (runbooks, postmortems) is named but thin | templates for runbooks and postmortems, added when the first adopter asks for them - evidence over speculation, same bar as Layer 2 | doing - the postmortem template landed 2026-08-01 because the runbooks README already prescribed the shape and shipped nothing for it; genuine operate depth beyond the two templates still waits for an adopter to ask |
| UPSTREAM-1 | task | Upstream cherry-pick check at release | the spec engine skills were extracted from github/spec-kit v0.13.2; upstream keeps moving and improvements should not be lost | at each release, scan upstream prompt changes since v0.13.2 and cherry-pick what improves the extracted skills; record the reviewed range in the release notes | doing - first scan run 2026-08-01, range v0.13.2..v0.15.1 reviewed and recorded in the changelog; repeat at each release |
| LATEST-1 | task | Ship the update-notification channel | ADR-025: staying current is a notification proposing a pin bump, never a lock - the channel does not exist yet. The structural doubt in the design - a release-based channel watching a main-based standard - is tracked as [`STAYING-CURRENT-1`](#epic-open-questions) | a shipped watch workflow template (weekly: compare .standards-version to this repo's newest tag, open an issue/PR on a miss) + a Renovate customManager rule for .standards-version documented in the core and shipped in the node stack's renovate.json; waits on the first tag to be provable end to end | doing - core half landed 2026-08-01 (`standards-update-watch.yml` + the Renovate custom manager in `self-verify.md`); the node stack's `renovate.json` and an end-to-end run still wait on the first tag |
| EXHIBIT-1 | task | An adoption you can point at | the README claims field-run mechanics and PRODUCT.md defines KPIs, but a serious adopter finds the claim, not the evidence | one public example repo aligned to the standard (drift 0, pinned, CI green) linked from the README, or an anonymized before/after case study of a real brownfield wave; PRODUCT.md notes how each KPI is observed, even manually | todo - **partly answered 2026-08-06.** The thing this item asks for - an adoption a sceptic can point at - now exists for two repos: `hagopj13/node-express-boilerplate` and, at scale, `matomo-org/matomo` (13,591 files, 19 years), both third-party, both taken to drift 0 and recorded as **L3** targets (see FIELD-1). That is a real before/after on somebody else's code, which is what was missing. It is still short of what closes this: the adoption lives on a local branch rather than a public repo a reader can open, nothing was contributed upstream (neither hagopj13 nor Matomo asked for it), and two repos are not the three FIELD-1 wants. The matomo run also complicates the exhibit: it is the more persuasive before/after, and its own headline finding is that drift 0 does not mean what a sceptic would read it to mean at that size, so pointing at it means publishing the caveat with it. The remaining work is publication - somewhere a link can point at - plus the remaining adoption |
| STACK-ALIGN-1 | task | The node satellite aligns to Layer 1 | ADR-016 names repository-standards/node the standard's first genuinely aligned adopter; ADR-022 dissolved the range blocker - what remains is running the alignment | repository-standards/node carries .standards-version, the manifest copy and AGENTS.md, and self-verify counts one drift across both its layers; the standard is living so nothing here waits on a tag (ADR-025) - what remains is running the alignment | todo |
| STACK-SITE-1 | task | This repo's CI never builds a stack's site | the generator is the core's and every registered stack runs it against the stack's own page map, so a core-only assumption baked into the generator only surfaces at deploy time, in a repository that cannot fix it. `ownSpecPages()` hardcoded a parent page the node map does not have; four spec pages shipped a dead Back link and the deploy went red the moment node gained a `specs/` tree | a fixture site in this repo shaped like a stack - own `site.config.json`, own short page map, a `specs/` tree, no `docs/` pages the core takes for granted - built by `tools/docsite.mjs` and passed through `tools/site-check.mjs` in `checks.yml`. The open design question is what the minimal stack fixture is: too thin and it stops resembling a stack, too full and it becomes a second copy of the node repo to keep in step | todo |

## Epic: Open questions

Standing doubts, not build tasks. Each row states the decision in force (or that there is
none) in `why`, and the doubt a challenger would have to answer in `DoD`. One file per topic
under [`docs/open-questions/`](docs/open-questions/) carries the full argument, including an
**Options weighed** section where real deliberation happened - read it before arguing from
scratch. Status is `open` or `decided`; a `decided` row is never finished in the task sense,
it stays open to a better answer, permanently - that openness is the type's point, not a gap
in it. Stack-pick doubts (Better Auth, CSS Modules vs Tailwind) moved with Layer 2 to
[repository-standards/node](https://github.com/repository-standards/node)'s DECISIONS - the
stack owns its own doubts now. (`STACK-LIFE-1` above is also an open question; it stays in the
Layer 2 epic because it already had a native backlog home before this list existed.)

| id | type | title | why | DoD | status |
|----|------|-------|-----|-----|--------|
| CONFORMANCE-1 | open-question | Conformance: threshold or degree | not decided - the spec says MUST, the tooling reports a number | the number needs a denominator: what would make "compliant" answerable as a threshold rather than read as a degree. [`conformance-is-a-degree`](docs/open-questions/conformance-is-a-degree.md) | open |
| ONE-TREE-1 | open-question | One authored tree | Decided: ADR-014 - single `standard/` tree, no source/dist split | the doubt: template shells and read-as-is docs mix in one tree. [`one-tree`](docs/open-questions/one-tree.md) | decided |
| RULE-COUNT-1 | open-question | How many rules | Decided: SPEC.md, the numbered rules on one page | the doubt: the count is past the top of the winners' range and only grew; some rules bundle several MUSTs. [`twenty-rules`](docs/open-questions/twenty-rules.md) | decided |
| STACKS-SATELLITE-1 | open-question | Stacks as satellite repos | Decided: ADR-016 - one repo per technology + registry | the doubt: two repos to run; registry is a solo-merge gate. [`stacks-satellite`](docs/open-questions/stacks-satellite.md) | decided |
| GENESIS-1 | open-question | Genesis history for the org move | Decided: clean-slate, curated commit sequence, honest dates | the doubt: narrative order vs the record of what really happened. [`genesis-history`](docs/open-questions/genesis-history.md) | decided |
| ENGINE-CHERRYPICK-1 | open-question | Engine cherry-pick | Decided: ADR-015 - prompts are ours; upstream read at release | the doubt: five prompts could quietly fall behind upstream - the mitigation is `UPSTREAM-1`'s per-release scan, not a structural fix. [`engine-cherry-pick`](docs/open-questions/engine-cherry-pick.md) | decided |
| SKILL-COUNT-1 | open-question | Shipped skills | Decided: discriminability is the constraint, not the count - 22 ship today (per `AUTHOR-1`) | the doubt: four sibling authoring skills could drift apart. [`shipped-skills`](docs/open-questions/shipped-skills.md) | decided |
| NPM-CHANNEL-1 | open-question | npm as a channel | Decided: no package, for now (2026-08-09) - see `DISCO-1` | the doubt: neither of the two things that would settle it either way has happened, and there is still no tag. [`npm-as-a-channel`](docs/open-questions/npm-as-a-channel.md) | decided |
| STAYING-CURRENT-1 | open-question | Staying current | not decided - the shipped watch (`LATEST-1`) compares against releases | the standard lives on `main` and there are no releases, so the channel is silent by construction. Settled by one adopter running behind for a while and someone noticing what they missed - `FIELD-1` territory. [`staying-current`](docs/open-questions/staying-current.md) | open |
| OWN-SPECS-1 | open-question | The repo specs its own tooling | Decided: the repo's own tooling gets buildable capability specs - five in `specs/` today, and `CYCLE-6` above is a sixth | the doubt: specs for small scripts risk documentation theatre. [`own-specs`](docs/open-questions/own-specs.md) | decided |
| FOLDER-READMES-1 | open-question | Folder self-description | Decided: the manifest says *what it is* (map generated from it); a folder README says only *what goes in here* | the doubt: nothing checks that a README stays in its lane; an adopted repo gets no map. [`folder-readmes`](docs/open-questions/folder-readmes.md) | decided |
| CHECKLIST-NAME-1 | open-question | `checklist.md` as the name | Decided: `docs/method/checklist.md` | the doubt: "checklist" undersells the paved-road defaults. [`checklist-name`](docs/open-questions/checklist-name.md) | decided |
| TRACKER-HISTORY-1 | open-question | Work history in the tracker | Decided: ADR-010 - repo holds intents, tracker holds history | the doubt: kills in-repo who-did-what; regulated shops may object. [`tracker-history`](docs/open-questions/tracker-history.md) | decided |
| DEFAULT-TRACKER-1 | open-question | GitHub Issues as default tracker | Decided: ADR-010 - free wins; Jira/Linear adapters | the doubt: weakest PO experience of the three. [`default-tracker`](docs/open-questions/default-tracker.md) | decided |
| STATUS-FRONTMATTER-1 | open-question | Spec Status in front matter | Decided: the clarify gate flips it mechanically | the doubt: status exists in two places once a tracker mirrors it. [`status-frontmatter`](docs/open-questions/status-frontmatter.md) | decided |
| IDEAS-SLUGS-1 | open-question | Ideas are slugs | Decided: `docs/ideas/<slug>.md`, never numbers | the doubt: slugs are wordier and renames break links. [`ideas-slugs`](docs/open-questions/ideas-slugs.md) | decided |
| PROFILES-1 | open-question | Core and scale profiles | Decided: ADR-011 + ADR-040 - one repo, two profiles, triggered by reach | the doubt: the split may be too weak to carry the weight - 9 entries and two rule clauses; an `audit` third profile still looms. `PROF-3` above tracks the adoption that could answer it; this row is the standing doubt itself. [`profiles`](docs/open-questions/profiles.md) | decided |
| PERSONAS-GATE-1 | open-question | Personas as a hard gate | Decided: gate is core, roster is scale | the doubt: ceremony for solo tools and no-product repos. [`personas-gate`](docs/open-questions/personas-gate.md) | decided |
| DOCS-FUNNEL-1 | open-question | One source, two surfaces | Decided: docs site renders the same md agents read | the doubt: in-place READMEs may not sequence into a learning path. [`docs-funnel`](docs/open-questions/docs-funnel.md) | decided |
| CASE-ANON-1 | open-question | Case-study anonymization | Decided: describe the situation, never the company | the doubt: the identifiability line is unwritten judgment. [`case-anonymization`](docs/open-questions/case-anonymization.md) | decided |
| REBASE-MERGE-1 | open-question | Rebase-merge as the paved road | Decided: ADR-026 - linear `main`, rebase-merge, squash as the alternative | the doubt: squash asks less and delivers most of it; the option that wins on merits is missing from GitHub. [`rebase-merge`](docs/open-questions/rebase-merge.md) | decided |
| WORK-PERIODS-1 | open-question | What to call a bounded period of work | Decided: ADR-041 - `sprint`, per team, several in parallel; `cycle` was tried first (ADR-028) and lost to use | the doubt: the borrowed word arrives carrying points and velocity, which the record has to deny in one place. This entry has already been overturned once, which is its own argument for staying open rather than closing. [`work-periods`](docs/open-questions/work-periods.md) | decided |
| AUTHORING-SKILLS-1 | open-question | Skills that co-author a document | Decided: one per document type - `adr-write`, `bdr-write`, `product-write`, `personas-write` (per `AUTHOR-1`) | the doubt: four sibling files can drift apart; the count objection fell away once the ceiling was measured rather than assumed. [`authoring-skills`](docs/open-questions/authoring-skills.md) | decided |
| STACK-OFFER-1 | open-question | Who decides Layer 2 during an adoption | Decided: the router detects the technology, looks it up in `stacks.json` and asks - consent is gathered at intake and the stack is never applied on its own (R20 makes the layers independent) | the doubt is evidence before design: no run has recorded a registered stack being detected, offered cold, accepted and applied. The corpus's most-used entry line names the stack itself, the shipped stack-named line has never been run, and the two runs where a repo matched the registry without naming it ended with the agent or a declared profile answering instead of the user. Settled by one `FIELD-1` adoption on a matching repo where the user says yes. [`stack-offer-on-adoption`](docs/open-questions/stack-offer-on-adoption.md) | decided |
| LAYER-AXIS-1 | open-question | Whether a layer has to be a technology | Decided: yes - R20 defines Layer 2 as per-technology best practices, ADR-016 gives each a satellite repo, and a stack manifest identifies itself by `technology` | the doubt: the axis was fixed when Node/TS was the only second layer anyone wanted, and other practices - UX and product design, QA, security, data, operations - are just as reusable and just as opinionated. Three of them are already mislocated rather than hypothetical: no numbered rule prescribes a test discipline, so the only place this project states one is the node stack's test tiers; Layer 1 took the half of UX that renders as markdown (personas, journeys, research) while leaving the half with tooling and gates outside; and Layer 1 also ships one vendor's harness - `standard/.claude/`, its guards and every shipped skill - inside the layer that calls itself stack-agnostic. The harness is the case that breaks the shape rather than stretching it: its third part is a per-person context budget living outside every repository, so it can be neither a manifest entry nor drift. Answering "no" moves R20, the registry key, path precedence between layers (today an explicit non-decision that double counts a shared path), detection - practice layers can only be chosen, never inferred from a checkout - the delisting bar, and the single drift number. [`layers-beyond-technology`](docs/open-questions/layers-beyond-technology.md) | decided |

## Epic: Ideas

Features that might be worth building and are not decided. No records, no specs, no backlog
intent of their own until approved - see [`docs/ideas/`](docs/ideas/) for the full shape
(who it serves, provisional sketch, unknowns). An approved idea graduates into the normal
flow (a backlog intent of its own, a spec, records) and this row's status flips to
`graduated`.

| id | type | title | why | DoD | status |
|----|------|-------|-----|-----|--------|
| CAPABILITY-STACKS-1 | idea | Capability stacks - a layer that crosses technologies | driving a browser is not a Node concern, but it lives in the Node stack because that is where it was needed first. A third kind of repository (`repository-standards/web-e2e`), adopted **alongside** a technology stack rather than instead of one | approval, then graduation into a backlog intent + spec + records. Open questions first: who owns a file two stacks both want, whether it survives its own generalisation from one example, whether one example is enough to generalise from at all. [`capability-stacks`](docs/ideas/capability-stacks.md) | idea |
| HERMES-PATTERNS-1 | idea | Two patterns worth adopting from Hermes Agent's real source | a source-level comparison against NousResearch/hermes-agent found most of what it does already built here, more rigorously - but its usage-triggered, dedup-latched skill suggestion and its agent-scoped, archive-only curator are not yet answered here | approval, then graduation - Pattern A likely folds into `STACK-LIFE-1`'s evidence gate rather than shipping standalone; Pattern B is a rule to record (ADR-051 clause or its own ADR), not a system to build. Open questions first: whether Pattern A duplicates or completes `STACK-LIFE-1`, where Pattern B's rule would live. [`hermes-inspired-patterns`](docs/ideas/hermes-inspired-patterns.md) | idea |

## Status & what's next

The restructure landed: one authored tree at `standard/`, the spec engine extracted as
the standard's own skills, the starter boot-verified, the discovery front door in
place; starter maintenance moved to repository-standards/node. What remains is gated
or external, in priority order: **DISCO-1**'s listings submission (the site itself is
live), **DISCO-3** (the owner needs to confirm the posts exist before this can move),
**EXHIBIT-1** (an adoption a sceptic can inspect - the single most load-bearing gap for
anyone evaluating this, and deliberately **not** satisfied by the fixture we wrote
ourselves), **STACK-ALIGN-1** (the node satellite aligns; waits on the first tag),
**STACKS-2** (waits for an evidence repo), and the deferred pair **OPS-1** /
**UPSTREAM-1** (adopter-driven operate depth; the upstream scan rides with each
release). The open questions and the idea below stand independent of this list - none
block a release; each waits on a challenger, not on being worked. A PR cuts its
own release, PATCH by default (R18, R25).
