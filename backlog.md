# repository-standards - backlog

> The standard's **own** backlog, dogfooding [`standard/docs/backlog.md`](standard/docs/backlog.md).
> A working doc in the repo-own zone - the same role `PRODUCT.md` plays. Ordered by
> risk x leverage; an item leaves only when its **definition of done** is met. Feeds:
> this repo's roadmap ([`PRODUCT.md`](PRODUCT.md)), spec deltas, and code<->spec drift.

Statuses: `todo` / `doing` / `blocked` / `done`. Drop `done` rows when a release is cut.

**Column exemption, stated rather than silent.** The shipped format
([`standard/docs/backlog.md`](standard/docs/backlog.md)) also carries `cap`, `persona` and
`owner`, and the shipped `add-to-backlog` skill refuses a row without them. This repo runs
the shorter shape on purpose: it has one contributor, so `owner` is always the same person,
and its work is the standard itself rather than a product with capabilities - `cap` would be
`-` on every row and `persona` would be `Standard-bearer Staszek` on nearly all of them.
Three columns that never vary are noise, not traceability. This is the same class of
exemption as the one [`AGENTS.md`](AGENTS.md) records for the version pin: written down,
because an undeclared divergence from your own shipped format is indistinguishable from
having forgotten it.

## Epic: Layer 2 - Node/TS stack

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| TMPL-1 | Starter debt (moved) | starter maintenance now lives in repository-standards-node - its CI, its backlog | tracked there; row kept one release for the pointer | done (moved 2026-07-22) |
| STACKS-2 | Second stack repo proves the registry model | one technology in stacks.json proves nothing about the seam; a second (Python, evidence-gated) must land as one new repo + one registry line with the core untouched | new repo repository-standards-python + registry entry; core diff = 1 line; still gated on a real evidence repo | todo |

## Epic: Discoverability - AI agents recommend it

When someone asks their AI agent how to organize or run a repo, the agent should
surface this standard. Being good is not enough; it has to be *found* by the tools
people now ask first.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| DISCO-1 | Deploy tail: site, npm, listings | the name is settled and both domains are owned; the funnel exists but is not public | deploy `site/` under repository-standards.com; publish the npm package with the positioning one-liner; submit the listings (awesome-lists, the AGENTS.md ecosystem, registries). Measured by: a fresh agent, asked the target questions, names it | todo |
| DISCO-3 | Publish the posts (owner) | LLMs learn from and cite public writing; the queries "how to keep docs/specs/decisions in-repo, agents-first" should resolve here | all three posts sit publish-ready in the owner's private space, CTAs wired to the repo; the remaining step is the owner's publish click on their channels - the only physically external action in the epic | doing |

## Epic: Gate health - the guards stay honest

A gate that fires when nothing is wrong teaches people to satisfy it cosmetically, and
then it is decoration. Items here keep the guards deserving of the trust they demand.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| GUARD-1 | The coupling map separates a file's schema from its data | `specs/capability-map.json` maps `standard.manifest.json` to `verify-engine`, so **any** manifest edit demands a spec update - including a pure data addition, which the verify-engine spec itself says is not an engine change. Hit once already: adding one `references[]` entry failed CI with nothing to legitimately write. The next author's cheapest escape is a cosmetic spec edit, which is how a good gate rots into ritual | spec-guard distinguishes an interpretation change (spec must move) from a data addition (it must not) - by splitting the map entry, by inspecting which keys changed, or by giving the manifest its own capability; a data-only manifest PR passes with no spec edit, and a schema change still fails without one; the chosen form recorded where the guard's spec lives | done (2026-08-01) - `couples: "shape"` map entries, documented in [`enforcement.md`](standard/specs/enforcement.md), covered by `tools/spec-guard-test.mjs` |
| GUARD-2 | The schema pair is checked, not promised | R24 says the DDL under `database/schema/` and its typed twin are 1:1, and nothing verifies it. A pair held by review drifts one column at a time - exactly the failure the rule exists to prevent - and the standard would be asking adopters for a discipline it does not itself mechanize | a shipped check reads both sides and reports the difference as drift: tables, columns, constraints and enums present in one and not the other, with the counterpart declaration as the edge it follows; per-stack generation stays in the stack repos, the pair check does not | done (2026-08-01) - `scripts/schema-pair.mjs`, a manifest guard so a broken pair is drift; covers the declared edge and DDL name coverage, with type agreement left to the stack repos (recorded in ADR-027) |
| GUARD-3 | A restated fact has to agree with its source | the coupling map made "these move together" a declared edge for code and specs; prose was left out, and prose is where a number rots quietly. Proven twice in this repo: llms.txt said twenty rules while SPEC.md had 21, and AGENTS.md said 11 lifecycle skills while the tree held 12 - both found by a person, late | a fact has one home (a file, a count, a derivation) and every restatement is declared and verified; a reworded surface whose pattern stops matching fails rather than going quiet | done (2026-08-01) - the check landed repo-own and then shipped (GUARD-4): `standard/scripts/facts-check.mjs` + `docs/facts.json`, covered by `tools/facts-check-test.mjs`; the skill-count drift it found is fixed in the same change |
| GUARD-4 | Adopters get the derived-facts check too | the mechanism is repo-own for now, and the drift it catches is not specific to this repo - a version, a package name, a port or a URL restated across README, docs and CI rots the same way anywhere. Shipping it means a home in the tree, a manifest entry, and either an extension of R4 or a rule of its own | `scripts/facts-check.mjs` ships with a per-repo `facts.json`, `self-verify` counts a stale restatement as drift, and the normative hook is recorded rather than implied | done (2026-08-01) - shipped as `scripts/facts-check.mjs` + `docs/facts.json` (shape in `docs/facts.example.json`), a manifest guard, hooked into R4; this repo now runs the shipped copy on itself |

## Epic: Work cycles - the repo answers "when will this land"

Designed in [ADR-028](docs/decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md);
the name is held open in [`work-periods`](docs/open-questions/work-periods.md). **All four
shipped on 2026-08-02.** The capability spec was written before the code, as the record said
it would be - though by hand rather than through `/spec-specify`, which is worth saying
plainly: the experiment of running the loop on its own features was only half done, and the
half that was skipped is the half that would have tested the loop.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| CYCLE-1 | The cycle artifact and the one-place invariant | the pair only works if an intent is in the pool or in exactly one cycle - a backlog that also lists in-flight work is a backlog nobody believes, and prose cannot hold that property | `docs/cycles/<team>/<slug>.md` shape shipped (owner, goal, agreed end date, status, item rows); a guard fails when one id appears twice across pool + all cycles; covered by a test that fires on a duplicate; scale-only in the manifest | done (2026-08-02) - `scripts/cycle-guard.mjs` + `docs/cycles/` shipped scale-only, capability spec at `specs/work-cycles/`, 18 test cases including that the shipped template's example rows never count |
| CYCLE-2 | `/cycle-open` and `/cycle-close` | opening and closing by hand means the invariant is held by discipline, which is how it stops being held | `/cycle-open` creates the file and moves selected rows out of the pool; `/cycle-close` verifies each item's DoD, returns unfinished rows to the pool, and writes one aggregate outcome (planned, finished, returned, commits in the window, days elapsed); refuses to close a cycle whose items were never checked | done (2026-08-02) - both shipped, propose-then-confirm rather than ask-cold, close reports per item what it verified and what it could not judge |
| CYCLE-3 | `/timeline-update` - projection with its own confidence | "when will this land" is the question the repo cannot answer today, and a projection without a stated confidence is what makes people stop trusting plans | reads every cycle, derives throughput from closed ones, projects open cycles and the pool into `docs/cycles/TIMELINE.md`; states the evidence it used; **gives no date** below a defensible number of closed cycles and says so; names any cycle past its date and still open | done (2026-08-02) - refuses below three closed cycles, reports spread not just mean, counts unplanned work toward throughput, regenerates whole |
| CYCLE-4 | The backlog points at what left it | the pool stops being the index of all work the moment rows start leaving it | `docs/backlog.md` carries one line per active cycle - team, goal, date, link, item count - so the pool remains the single entry point without duplicating a row | done (2026-08-02) - an "In flight" section the guard is tested against, so a cycle row is never mistaken for an intent |

## Epic: The wizard co-authors, it does not hand out templates

The spec loop has six skills for one artifact. Decisions, the product frame and personas
have templates and nothing that writes them *with* the user - so the flow asks a product
person to fill an ADR the way a developer would. A technical decision, a business decision
and a product frame are three different conversations, and one generic authoring voice
serves none of them.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| AUTHOR-1 | Decide the shape before writing any skill | one routing skill or one per type - a call against this project's own ceiling, and not one to make while implementing | an open-question entry weighing the options, and a decision recorded either way | done (2026-08-02) - **one skill per document type**. The owner challenged the ceiling rather than the options, which was the right question: it had no source, its own supporting citation named a collection shipping 17, and the context cost measures at ~1,190 tokens for 15 skills. The constraint is discriminability, and on that axis four sharp descriptions beat two that each cover two situations. [`shipped-skills`](docs/open-questions/shipped-skills.md) revised |
| AUTHOR-2 | `adr-write` and `bdr-write` ask like each record deserves | an ADR wants forces, options actually weighed, consequences, how compliance is confirmed, what would reopen it. A BDR wants who it serves, what changes for them, what it costs, what we are deliberately not doing, how we would know we were wrong. Handing both the same eight prompts produces a BDR that reads like an ADR with the wrong nouns | the skill routes by the overrule test, runs the elicitation belonging to that type, drafts from `docs/discovery/` and the code where either has material, and asks only what neither can answer. A user who says "we picked Postgres over Mongo yesterday, mainly for the reporting joins" gets a complete record back to correct, not a form | done (2026-08-02) - `adr-write` and `bdr-write`, each carrying only its own elicitation and both opening with the overrule test so a misrouted request gets handed over rather than answered wrongly |
| AUTHOR-3 | `product-write` and `personas-write` are a conversation, not a form | `PRODUCT.md` and `docs/personas.md` are the two artifacts most often filled by someone non-technical, and both are asked cold today. They are also one conversation - who is this for, what problem, what does success look like - so splitting them across two blank templates asks the same person the same thing twice | one flow producing both, proposing a candidate roster from the product frame rather than asking for it, offering the worked example as calibration while saying plainly it belongs to a different product, and accepting `provisional` as a complete answer with a backlog item attached | done (2026-08-02) - `product-write` and `personas-write`. **The "one flow" clause was superseded by AUTHOR-1**, which chose one skill per document type after the ceiling that motivated merging them stopped holding; the two hand off to each other explicitly instead, so the single conversation still happens without one description having to cover both situations |
| AUTHOR-4 | Say where the engine came from, where the question arises | the answer lived only in a record nobody opens while reading a skill, and the owner asked the question twice - which means the repo did not answer it | one page a person can read: what was taken as code and under what licence, what was borrowed as an idea, and what is only compared against | done (2026-08-02) - [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md); the descriptions had already stopped carrying the licence line when they were rewritten as triggers |

## Epic: Evidence - does any of this survive contact with a real repo

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| FIELD-1 | Run the standard against three real repositories | the align router is the product's core and the only major component with no gate of any kind - every mechanical guard has a test, the router has none. Until it has been run against a repo nobody wrote for it, "walks a messy repo back to health" is a design claim | three public repos aligned as a user would ask, not as an author would drive: one small on a registered stack, one mid-size on an **unregistered** stack (the honest-miss path, `stack-decisions.md`, the consent-gated issue), one large and multi-year (waves, a counted backlog, drift as a number). Five command shapes exercised - align, plan-only, greenfield, registry miss, verify - with real ADRs and BDRs written along the way. Findings land as backlog items or fixes; the run itself is written up as the adoption evidence EXHIBIT-1 asks for | todo - **timed deliberately: run it shortly before the first tag** (owner, 2026-08-02). Earlier and it measures a tree still moving; later and the tag ships untested |

## Epic: Deferred by the one-tree restructure

The collapse to a single authored `standard/` tree deliberately left several threads for
later - all demand-driven, none blocking a release.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| OPS-1 | Operate-cluster depth | the standard covers deciding and building deeply; the operate side (runbooks, postmortems) is named but thin | templates for runbooks and postmortems, added when the first adopter asks for them - evidence over speculation, same bar as Layer 2 | doing - the postmortem template landed 2026-08-01 because the runbooks README already prescribed the shape and shipped nothing for it; genuine operate depth beyond the two templates still waits for an adopter to ask |
| UPSTREAM-1 | Upstream cherry-pick check at release | the spec engine skills were extracted from github/spec-kit v0.13.2; upstream keeps moving and improvements should not be lost | at each release, scan upstream prompt changes since v0.13.2 and cherry-pick what improves the extracted skills; record the reviewed range in the release notes | doing - first scan run 2026-08-01, range v0.13.2..v0.15.1 reviewed and recorded in the changelog; repeat at each release |
| LATEST-1 | Ship the update-notification channel | ADR-025: staying current is a notification proposing a pin bump, never a lock - the channel does not exist yet | a shipped watch workflow template (weekly: compare .standards-version to this repo's newest tag, open an issue/PR on a miss) + a Renovate customManager rule for .standards-version documented in the core and shipped in the node stack's renovate.json; waits on the first tag to be provable end to end | doing - core half landed 2026-08-01 (`standards-update-watch.yml` + the Renovate custom manager in `self-verify.md`); the node stack's `renovate.json` and an end-to-end run still wait on the first tag |
| HOWTO-1 | Every element gets a "you have this case - say this" guide | the standard is for busy people: docs must lead with real situations and the exact prompt, not theory - `working-with-specs.md` and `discovery.md` set the pattern (owner directive 2026-07-30) | each method doc and each shipped folder README (backlog, decision-records, ideas, runbooks, analytics, journeys) opens with concrete cases + the prompt that handles them, corner cases included (update vs new, PO vs dev); measured by a busy adopter finding their case without reading a concept doc | done (2026-08-01) - openers on all nine method docs and on the shipped backlog, decision-records, ideas, runbooks, journeys, analytics and research READMEs; `working-with-specs.md` and `discovery.md` already set the pattern |
| EXHIBIT-1 | An adoption you can point at | the README claims field-run mechanics and PRODUCT.md defines KPIs, but a serious adopter finds the claim, not the evidence | one public example repo aligned to the standard (drift 0, pinned, CI green) linked from the README, or an anonymized before/after case study of a real brownfield wave; PRODUCT.md notes how each KPI is observed, even manually | todo |
| STACK-ALIGN-1 | The node satellite aligns to Layer 1 | ADR-016 names repository-standards-node the standard's first genuinely aligned adopter once it pins; ADR-022 dissolved the range blocker - what remains is running the alignment | repository-standards-node carries .standards-version, the manifest copy and AGENTS.md, and self-verify counts one drift across both its layers; waits on the first core tag so the pin names something addressable | todo |

## Status & what's next

The restructure landed: one authored tree at `standard/`, the spec engine extracted as
the standard's own skills, the starter boot-verified, the discovery front door in
place; starter maintenance moved to repository-standards-node. What remains is gated
or external, in priority order: the **DISCO-1** deploy tail + **DISCO-3** (deploy, npm,
listings; the owner publishes the posts), **EXHIBIT-1** (an adoption a sceptic can
inspect - the single most load-bearing gap for anyone evaluating this),
**STACK-ALIGN-1** (the node satellite aligns; waits on the first tag),
**STACKS-2** (waits for an evidence repo), and the deferred pair **OPS-1** /
**UPSTREAM-1** (adopter-driven operate depth; the upstream scan rides with each
release). Releases stay maintainer-only: versions are cut from the CHANGELOG's
`## Unreleased` when the maintainer decides.
