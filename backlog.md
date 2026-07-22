# repository-standards - backlog

> The standard's **own** backlog, dogfooding [`standard/docs/backlog.template.md`](standard/docs/backlog.template.md).
> A working doc (root, source-only, not shipped to `dist/`) - the same role
> `PRODUCT.md` plays. Ordered by risk x leverage; an item
> leaves only when its **definition of done** is met. Feeds: this repo's roadmap
> ([`PRODUCT.md`](PRODUCT.md)), spec deltas, and code<->spec / source<->dist drift.

Statuses: `todo` / `doing` / `blocked` / `done`. Drop `done` rows when a release is cut.

## Epic: Versioned self-update (keystone)

The product's spine: a repo pins to a standard version, updates to newer ones by delta,
and proves compliance. Deeper mechanization (a data-driven manifest) is ENG-2 below.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| SU-1 | Versioned update + self-verify | "update me to vX" and a machine-checkable "does it comply?" are the keystone the whole product turns on | `update-to-version` skill (delta not re-scaffold, preserves client deviations), `self-verify.mjs` (version pin + skeleton + structure guard, CI-gated) + `docs/self-verify.md`, `.standards-version` pin, wired into `align-to-standards` + `AGENTS` + the CI workflow; reflected to `dist/` | done (this PR) |

## Epic: Product-discovery layer (personas + greenfield)

The product-side mirror of buildable specs: behavior validated against a **user**, not just
the code. Personas gate ideas, specs, and the backlog.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| PERS-1 | Personas as a validation gate | "for whom?" had no home; a capability could be buildable and useless | `personas.template.md` + `dist/docs/personas.md`; ADR-006 (Accepted); wired into taxonomy, ways-of-working (PO stage), `specs/README` (spec names its persona), backlog template (persona column), decision checklist (target personas = BDR); reflected to `dist/` | done |
| GF-1 | `greenfield-start` guided flow | new projects needed a for-whom -> what -> how conversation, not a blank scaffold | `greenfield-start` skill: elicit product + personas, choose the stack (Layer 2 default), record foundational ADRs, break into modules, write persona-anchored specs + business requirements, seed the backlog, self-verify; reflected to `dist/` | done |
| PERS-2 | Mechanical persona check in the spec guard | a spec with no persona should fail like one with no error table | `spec-structure.mjs` fails a capability spec that names no persona (Serves field / roster mention), roster parsed from `personas.md`, skips when absent; template gains a `Serves` field; reflected to `dist/` | done (this PR) |
| EXPLAIN-1 | Plain-language explain mode for the PO | the PO gates the loop but cannot gate what they do not understand; they must be able to ask "explain this ADR / spec simply, with examples" and get a persona-anchored answer (2026-07-21 notes pass) | an explain affordance in the PO stage (skill step or docs guidance): on demand, a plain-language summary of any record/spec + concrete examples anchored to the personas; reflected to `dist/` | done (this PR - ways-of-working PO stage + AGENTS 'explain simply' rule, persona-anchored) |
| PERS-3 | This repo's own personas roster | the standard demanded personas of consumers while having none itself (2026-07-21 re-review, owner ask) | `docs/personas.md`: Standard-bearer (primary), Spec-first PO, Buildable-truth Dev, Coding agent, **Owner** (buyer of assurance - not a PM; added 2026-07-22) - JTBD/pains/signals per template; epics/skills can now name whom they serve | done (this PR) |

## Epic: Product spine - the whole delivery lifecycle in one repo (PDLC)

Beyond personas, a product's truth shatters across departments: marketing's deck, UX's
Figma, data's dashboards, sales' pitch - each its own copy, each drifting (research: owner's private notes, 2026-07). Rule: every artifact kind
gets an in-repo home or an explicit federation rule (pointer + owner + sync trigger).
The five gaps sit exactly *between* departments - which is why the repo spine is the
only fix.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| PDLC-1 | Positioning & messaging home | landing, README, and the sales pitch each say something different - the market hears noise | `docs/positioning.md` (statement, 3 pillars, the one-liner); every surface *quotes* it, never re-phrases; changing it = BDR; landing/README checked against it at LAND-1 | done (this PR - positioning.md written + usage rule + per-persona pillar map; checklist row added) |
| PDLC-2 | North Star + KPI tree; success metric per capability | "success" is undefined or defined per department; specs have acceptance criteria but no business outcome | PRODUCT gains North Star + KPI tree; capability-spec template gains a `Success metric` field tied to a KPI; reflected to `dist/` | done (this PR - North Star: repos that STAY aligned; Adoption/Retention/Guidance/Reach tree; Success metric field in the template) |
| PDLC-3 | Analytics tracking plan, spec-coupled | events named ad-hoc in code make every dashboard a lie; the most code-adjacent drift there is | `docs/analytics.md` event taxonomy (name, trigger, properties, owner KPI); same-PR rule: adding/renaming an event updates the plan; guardable like spec coupling | done (this PR - `docs/analytics.template.md` shipped: rules (listed-first, same-PR, naming, every-event-serves-a-KPI) + plan + retired-events tables; taxonomy row) |
| PDLC-4 | Research repository | interviews die in silo tools; insights never reach personas or ideas | `docs/research/` - one insight doc per study (anonymized per case-study rules), each linking the persona/idea/spec it feeds; index per the folder-README convention | done (this PR - shipped space: README rules ('an insight that changes nothing is not done', personas cite evidence, raw recordings stay out) + _template with required 'What it changes') |
| PDLC-5 | Journey maps per persona | the journey poster is made once and never true again | `docs/journeys/<persona>.md`: stages -> the capabilities serving them; updated when capabilities change (coupling note in specs README) | done (this PR - shipped space: README (stages->capabilities coupling, pains feed the backlog) + stage-table _template; taxonomy row) |
| PDLC-6 | GTM, pricing, enablement, legal (scale profile) | launch chaos repeats; pricing lives in a spreadsheet; sales decks fork from reality | pricing/packaging decisions as BDRs + current state in PRODUCT; reusable launch checklist; enablement & legal via federation rules (quote positioning + release notes); all `scale`-profile | done (this PR - six checklist rows in the BDR section: positioning, North Star/KPIs, tracking plan, GTM, enablement (federation, not a copy), legal - scale-marked) |

## Epic: Ideas / discovery incubator (pre-decision)

Before an intent is even backlog-ready there is a space the standard does not yet bless: a
**speculative idea that may never ship**, explored end-to-end - including its provisional
technical and business shape - without minting any record. Today the taxonomy sends "research
that fed a decision" to a working doc, but frames discovery as *input to a decision already in
motion*. It has no first-class home for an idea still being weighed, and no rule against
prematurely dressing an idea as an ADR/BDR/spec.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| IDEA-1 | First-class ideas/discovery space + graduation rule | Real trigger: in my-brand a whole go-to-market direction (how selling works, a template-marketplace, a membership module) got written up as `Proposed` ADR/BDR - but there was **no decision**, only a maybe. `Proposed` in MADR means "a decision awaiting ratification", not "an idea we might pursue"; using it for speculation pollutes the decision log and implies a fork was taken when none was. The whole idea (incl. its provisional technical shape) belongs in one discovery/idea artifact; ADR/BDR/specs are minted **only when the idea is approved for realization** and enters the ways-of-working flow. | Design the division: name + folder (e.g. `docs/discovery/` or `docs/ideas/`), a lifecycle/status (`idea` -> `exploring` -> `approved` / `parked` / `dropped`), how an idea holds provisional technical/business shape without records, the **graduation** step (approved idea -> backlog intent -> spec/ADR/BDR), and a guard/convention that no record/spec is created for an un-approved idea. Endorse it positively in `taxonomy.md` (done, note) + `ways-of-working.md` (a pre-intent stage) + `decision-records/README` ("not a record until approved"). Reflect to `dist/`. | done (this PR - ADR-010; `docs/ideas/` + _template + statuses + graduation; taxonomy/ways-of-working/records-README wired; manifest entry) |

## Epic: Artifact lifecycle & tracker sync (design WITH IDEA-1)

The other half of the lifecycle IDEA-1 opens. IDEA-1 designs *before the decision*; the
2026-07-21 notes pass surfaced *after the execution*: Spec Kit's plan/tasks are scaffolding,
not knowledge - once a feature ships they are debris the repo should shed. And some work is
required for development without being spec content at all ("open an IT ticket for a token").
Designing these apart from IDEA-1 yields two inconsistent lifecycles - it is one arc:
**idea -> approved -> spec/records (permanent, living) -> plan/tasks (ephemeral) -> closed +
cleanup**.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| LIFE-1 | One lifecycle ADR: permanent vs ephemeral artifacts + cleanup | plan/tasks left in the repo after execution are noise agents keep reading; a feature needs states (in-progress -> closed) and a closing step; "does history stay in the repo?" must be answered once, not per feature | one ADR (designed together with IDEA-1) drawing the line: specs/records/docs are permanent and living; plan/tasks are ephemeral and leave at close. A `cleanup` step/skill that verifies against the code (not by interrogating the user) that the work landed, then removes the scaffolding. Reflect to `dist/` | done (this PR - ADR-010 + spec `Status` field + ways-of-working close step; mechanical cleanup skill rides with SKILL-1) |
| LIFE-2 | Work history & organizational tasks live in the tracker, not the repo | tracking who-does-what-now in git means committing backlog churn nonstop; enabling tasks ("get a token from IT") are needed for development but are not spec content and are worthless once done | the same ADR names the posture: a work tracker holds live work state and enabling tasks - **GitHub Issues as the free default**, Jira (e.g. via a bridge) as an adapter; the spec never mentions enabling tasks; the repo backlog holds *intents*, the tracker holds *execution state* | done (this PR - ADR-010: GH Issues default (free, unlimited), Jira adapter (free <=10 users, a field-proven bridge as reference), Linear adapter (free: 250 active issues); one-way bridge, front-matter write-back) |

## Epic: Guided compliance loop (hold-the-hand)

Being a checklist is not the product; the product is the process that **holds your hand**.
A PO or dev will not self-impose specify/clarify, and a brownfield repo cannot reach
compliance in one PR. Sourced from the 2026-07-21 notes pass; prior art to study before
designing: three production PRs (needs_decision_records; the enforced specify loop) - notes
kept privately, mechanisms distilled into `specs/enforcement.md` + `spec-kit-setup.md`.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| GUIDE-1 | Align as a resumable, prioritized process | `align-to-standards` today is a pass, not a process you re-enter; ENG-2 left "compute the update plan from the manifest delta" open; a multi-year brownfield needs waves ordered by payoff | re-entrant align/onboard: reads the manifest + `self-verify`, shows what is already done, proposes the next wave **ordered by payoff** (biggest win first - missing ADRs, folder structure, product descriptions); can be re-run indefinitely until drift is 0 | done (this PR - 'Re-entrant: a process, not a pass' section in `align-to-standards`; resume-from-measurement, payoff-ordered waves, hand-hold, repeat to drift 0) |
| GUIDE-2 | Enforced clarify->specify loop at story and change level | left alone, a PO writes a story and stops; the loop must drive: clarify questions the PO answers **or explicitly defers** ("leaving this to the technical side" - recorded, not lost), tech review adds and re-checks both directions, repeat until complete; same loop when someone changes code | ways-of-working + spec skills encode the loop with **recorded deferrals** as a first-class answer; the loop re-runs until no open questions remain; field prior art reviewed first | done (this PR - prior art read (notes kept privately); enforcement stack in specs/enforcement.md + spec-kit-setup.md (hook/gate/constitution/context/bridge); AGENTS 'the loop runs itself'; recorded deferrals in ways-of-working + clarify gate = ready-to-develop) |

## Epic: Modernization (bring an old repo current)

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| MOD-1 | `modernize` skill + plan-then-refactor | a common entry point is a repo that has fallen behind; bumping before understanding loses behavior and records nothing | `modernize` skill (audit -> target -> record decisions -> sequenced migration backlog -> maintenance strategy), the "recommendation/future" step; ADR-007 (knowledge first, refactor last, Accepted); a Modernize phase in `docs/adoption.md`; reflected to `dist/` | done |

## Epic: Release & change tracking

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| REL-1 | Two-changelog system | one `CHANGELOG.md` edited per PR conflicts every time (just happened on #15 vs #16); and technical noise pollutes the stakeholder view | **done:** per-PR `changes/` fragments (audience + type + optional headline); `tools/changelog.mjs` assembles the complete technical `CHANGELOG.md` and a curated release-notes **draft** (`--check` validates fragments in CI); the maintainer cuts releases and writes the notes. Layer-2 repos may swap in `changesets`. | done |

## Epic: Layer 2 - Node/TS stack

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| L2-1 | `stacks/node-ts` | the promotable product needs the runnable Node/TS setup, evidence-based from stayget/roomlink/console | **done (this PR):** `stacks/node-ts` distilled from **stayget** (primary) + **propertycloud** - pnpm+Turbo, Biome (+Prettier for SCSS), strict TS, Fastify native-DI service template with Zod env, Next App Router config, hardened least-privilege CI, 7-day supply-chain cooldown. Every pick has pros/cons + 2026 community rec + provenance in [`DECISIONS.md`](stacks/node-ts/DECISIONS.md). **e2e/testing increment done:** DECISIONS.md #9 expanded to tiers + directory layout + maintenance; runnable Vitest (unit/integration projects) + Playwright + Docker test-stack + advisory Lighthouse CI templates + `e2e.yml`. Open increment: `roomlink`/`console` cross-check; a stack `gitleaks` template. | done |
| STARTER-1 | Runnable greenfield starter - "ai, put up a repo" -> a booting app | the standard without a running start is advice; the owner's bar: scaffold a Next.js + Fastify app with auth, proxy, CSS Modules, tests - "puf, it runs" (CI/CD optional, deployment out of scope) | `stacks/node-ts/starter/` composed and **boot-verified on the owner's machine 2026-07-22**: `pnpm install` clean (cooldown intact), `pnpm dev` boots web+api, Fastify payload served through the Next proxy, sign-up -> dashboard -> `/api/me` proven by curl AND a 5/5 Playwright UI journey, default-deny confirmed at both gates (307/401 anon), 6/6 unit, build green. Real bugs caught by booting: auth-segment rewrite exclusion (load-bearing), 127.0.0.1 dev origins, tsconfig declaration | done (this PR) |
| TMPL-1 | Fix the service template's runtime imports + Biome preset | boot-verifying the starter exposed two stack-root template defects: `templates/service` imports `./config.js` while shipping only `config.ts` (Node never remaps specifiers - the template cannot run as shipped) and `--experimental-strip-types` is redundant on Node 24; the copied `biome.json` emits a 2.5 deprecation (`rules.recommended` -> `preset`) | templates/service uses `.ts` specifiers + `allowImportingTsExtensions` (as the starter now proves out); drop the redundant flag; modernize biome.json; re-verify the starter still boots after the template fix | todo |
| STACKS-2 | Second technology proves the core/stack split | the standard reads Node-flavored today; ADR-008 (rev) demands a universal core + `stacks/<technology>/` overlays - only a second stack proves nothing leaks | a minimal `stacks/python-uv/` (or the era's default): DECISIONS with evidence, the same tiered-testing shape; core skeleton untouched by the addition. **Evidence scan (2026-07-22): no Python production repo exists locally** (automation/platform/personal-automations = JS or docs; the one real second-stack candidate is a .NET client middleware repo - usable only anonymized, owner's call). Stays gated on evidence: name a repo to distill from, or the first Python adoption becomes the evidence | todo |

## Epic: Reflection engine & self-consistency

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| ENG-1 | `source -> dist` build script | `dist/` is a hand-maintained snapshot that drifts (path rewrites, source-only ADRs done by hand each time); the repo's own README flags this | **done (this PR):** `tools/reflect.mjs` encodes the source->dist map in four classes (copy / divergent / authored-only / source-only); `--check` reports drift as a number + catches orphans and source-only leaks, `--write` syncs the copy class. Caught + fixed real drift on landing (spec-guard header, adr `_template` missing Confirmation). Open increment: mechanize the `divergent` transforms (template->real, link rewrites) so they are byte-checkable too. | done |
| ENG-2 | Manifest + align-engine | `align-to-standards` is prose; a data-driven manifest makes reconcile measurable and repeatable | **done (this PR):** `standard.manifest.json` describes what an aligned repo must have (files/sections/guards/decisions + adapt rules); `self-verify.mjs` reads it and reports **drift as a number**; align/update skills read it. Open increment: a runner that computes the update plan from the manifest delta automatically (today the agent does it). | done |
| ENG-3 | ADR: "align-engine is a manifest" | the ENG-2 shape is a re-litigable decision worth recording | ADR drafted with rejected alternatives; **Accepted** | done |
| ENG-4 | Spec Kit posture: vendored pinned engine (ADR-013) | upstream moves fast (55+ releases H1 2026, breaking v0.10.0) and the owner asked whether to rename/fork/track - the dependency was an unrecorded decision | ADR-013 **Accepted** (owner-amended: vendor, don't reference): agent-side Spec Kit assets vendored at a pinned version, patched (capability paths, gate hooks, statuses), synced only at release time, MIT attribution; our `spec-*` skills stay our own name; exit clause | done (this PR) |
| ENG-5 | Vendor the patched engine | ADR-013 decided the posture; the copy itself needs a real upstream fetch + testing | fetch spec-kit agent-side assets, patch (paths/gate/our-templates), ship, verify end-to-end | **built and verified 2026-07-22** (v0.13.2, 21 files, 4 marked patches, scratch-repo tests all green: specs/payments/ no prefix, gate blocks/passes, spec instantiated from OUR template, byte-diff clean) - **parked in the owner's private space awaiting the layout decision**: classic `.specify/` + `.claude/commands/` vs everything-as-skills `.claude/skills/speckit-*` (owner leans skills; upstream v0.13.2 itself now installs skills). One `cp` restores it once decided | todo (awaiting owner layout call) |

## Epic: Consistency - in-repo instructions are the source of truth

The point: **rules for working in a repo must live IN the repo, not in an individual's
personal AI memory or global config.** Only then do all contributors - every agent, every
dev - work from the same guidance and build the same repo, without divergence. Consistency
is the whole value; a rule that lives only in one person's memory silently splits the repo.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| CONS-1 | In-repo instructions over personal memory | if the "how to work here" (AI settings, agent rules, repo-specific gotchas) lives in someone's personal memory/`~/.claude`, other contributors and agents never see it - the repo splits into inconsistent variants | an **ADR**: repo-local instructions (`AGENTS.md`, conventions, `CONTRIBUTING`, the specific spot each rule belongs) are the single source of truth; personal memory/global config may point to them but must not *hold* repo rules. Reject "it's in my memory" as a place for a repo rule. | done (this PR - ADR-012, Accepted) |
| CONS-2 | Repo-specific rules land in the right place, checkably | a rule in the wrong file (or scattered) is as good as missing; e.g. "pass the full tenant id when editing its template in scope" belongs in `CONTRIBUTING`/`AGENTS`, not a chat | a convention + (where possible) a check: repo rules have a home in the taxonomy (which rule kind goes where); flag rules that exist only outside the repo. Each repo customizes the content, but the *location discipline* is the standard's | done (this PR - conventions "Where rules live": kind -> home map, outside-only rule = missing; source + dist) |
| CONS-3 | Onboarding/align surfaces "move your personal rules into the repo" | brownfield repos often have tribal/agent rules in people's heads or personal configs | `onboard-repo` / `align-to-standards` prompt: elicit the unwritten rules and personal-config instructions, and land them in-repo in the right place (CONS-2) so the repo becomes self-describing | done (this PR - explicit elicitation step in both skills) |

## Epic: Buildable spec depth - field lessons

Observations from retrofitting a full capability set (~20+ specs) to the `buildable`
tier from existing code. Refinements to the spec-depth standard, not new inventions;
the next agent should check each against the current standard before acting.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| SD-1 | Lead the tier decision with the rebuild-and-verify test | the "money / security / data-integrity / external-contract" enumeration is a proxy; the one discriminator that actually resolved every tier call in practice is a single question - "could an agent rebuild and verify this capability from the spec alone, without the code?" | spec-depth section leads with that question; the enumeration becomes worked examples under it; reflected to `dist/` | done (verified this PR - specs/README Tiers already leads with the discriminator; 'the question, not the list, is the test'; dist matches) |
| SD-2 | Make the verbatim error table and an "Open questions" section required, not optional | applying `buildable` at scale, the two sections that caught real bugs were (a) the exhaustive per-endpoint error table - status + errorCode + message - which forces reading every branch, and (b) an Open-questions section that surfaced spec<->code discrepancies which became tracked issues | `capability-spec.template.md` marks both as required; template also requires >=1 Given/When/Then per invariant; reflected to `dist/` | done (verified this PR - error table REQUIRED, Open questions REQUIRED with 'None known.' rule, >=1 GWT per invariant present; dist matches) |
| SD-3 | Default to buildable; do not pre-declare behavioral to save effort | pre-marking peripheral capabilities `behavioral` and rewriting them `buildable` later wasted a pass - writing the contracts is exactly what surfaces the bugs, so the thin capabilities benefit most; `behavioral` stays an escape hatch that must be justified in-spec and is expected to be rare | standard states the expectation (buildable is the default even for peripheral capabilities; behavioral requires an in-spec justification and should be rare); reflected to `dist/` | done (verified this PR - specs/README Tiers states both; dist matches) |
| SD-4 | Document the extract-verbatim -> synthesize retrofit workflow | for brownfield, the reliable method was a read-only pass extracting verbatim contracts with `file:line` references, then authoring the spec from that; the `file:line` anchors make the spec auditable and re-verifiable against the code | ways-of-working / spec skills describe the two-step retrofit (extract verbatim with anchors, then synthesize); reflected to `dist/` | done (verified this PR - onboard-repo step 3: extract verbatim with file:line anchors, then synthesize; template's Open questions carries the discrepancy rule) |
| SD-5 | Elevate the code<->spec coupling guard from enforcement detail to core requirement | a spec with no coupling-guard entry silently rots; a guard that flags domain code changed without touching its spec (capability -> globs map + check) is what kept spec and code aligned across the whole set | standard requires every capability spec to have a guard mapping; a spec without one fails the check; reflected to `dist/` | done (verified this PR - source-of-truth rule 4 + `spec-guard.mjs --audit` + manifest `everyCapabilityNeedsMapEntry`) |
| SD-6 | Land a behavior change and its spec update in the SAME PR | the coupling guard is per-PR and has no bypass - a fix that changes a capability's code while its spec update rides in a separate PR makes the guard block the fix PR (observed: a fix PR went red for exactly this). "Update specs before implementing" is the principle; "in the same PR" is the operational corollary that keeps the guard green | ways-of-working / enforcement note states behavior and spec land together; a change that touches a capability's code touches that capability's spec (or records why not) in the same PR | done (this PR - source-of-truth rule 5 states the same-PR corollary explicitly, source + dist) |
| SD-7 | Reconcile a spec when a fix lands - flip its Open questions | specs drift in BOTH directions: a fix that resolves something the spec listed under "Open questions" must, in the same change, flip that item to resolved and update the affected Data / Interface / Acceptance sections - otherwise the spec keeps describing a bug that no longer exists (a fixed defect masquerading as a known gap) | the reconcile step names this explicitly: a fix updates the resolved Open questions plus the affected contract sections in the same change | done (this PR - spec-reconcile step 4: flip resolved Open questions + update affected sections in the same change) |

## Epic: Naming & positioning

The current name `repository-standards` is clear but may undersell a living, versioned,
agents-first framework. Decide the name before promoting widely (rename touches many files).

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| NAME-1 | Decide the project/repo name | want a recognized-default *category* name (like "coding standards"), possibly AI-flavored to signal agents-first | pick a candidate; verify npm scope + GitHub org + domain; rename README/PRODUCT/AGENTS/manifest/skills + the `align me to <name>@<ver>` phrasing; keep `.standards-version` filename (generic) | done (2026-07-22, owner: **`repository-standards` stays** - no rename anywhere; the owner already holds repository-standards.com + repositorystandards.com, so DISCO deploy/npm/listings are unblocked) |

Candidates to choose from (head noun stays **standards** - plural like "coding standards";
internally still "**the standard**", singular + versioned):

Current lean (owner): the top level reads as **repository** / **project**, not
"engineering" - keep it broad and place-anchored. `project-standards` is a live candidate.
An AI-flavoured variant is wanted to signal agents-first.

- **By place / scope (leading):** `repository-standards` (current), `project-standards`.
- **AI-flavoured** (signals agents-first): `ai-repository-standards`, `ai-project-standards`,
  `ai-engineering-standards`, `agentic-engineering-standards`, `ai-native-engineering-standards`.
- **By discipline (demoted per owner):** `engineering-standards`, `development-standards`.
- Rejected: `documents-standards` (too narrow); evocative brand names (Plumbline/Cairn/etc -
  do not read as a default standard).
- Head noun stays **standards** (plural, like "coding standards"); internally still "**the
  standard**" (singular, versioned). Ownability via npm scope / GitHub org (`@handle/…`),
  not by mangling the name. Tagline is fixed regardless of name: *the reference your repo
  trues up to - align -> verify -> drift as a number*.

## Epic: Discoverability - AI agents recommend it

The promotion goal for the agent era: when someone asks their AI agent how to **organize or
run a repo** - its documentation, decisions/principles, spec-driven development, backlog -
the agent should **surface this standard** as the answer. Being good is not enough; it has
to be *found* by the tools people now ask first.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| DISCO-1 | Be the answer an agent recommends | agents (and their users) increasingly search for solutions via LLMs, not Google; if the standard is invisible to them it does not exist | a distribution plan: a crisp, quotable one-liner of the problem it solves; a precise repo description + GitHub topics (`agents`, `documentation`, `adr`, `spec-driven`, `monorepo-standard`); an `llms.txt` / machine-readable summary; an npm package with the same description; presence where agents look (awesome-lists, the AGENTS.md ecosystem, registries). Measured by: a fresh agent, asked the target questions, names it | doing (this PR: one-liner canonical in `docs/positioning.md`; repo description + 9 topics set via gh; root `llms.txt` with recommend/invoke guidance. Still open: npm package, awesome-lists/registry submissions - external, after NAME-1) |
| DISCO-2 | Invokable, not just recommendable | recommending is weak; the win is the agent that can *run* it | a low-friction entry an agent can invoke - `align this repo to <name>` already works via the skill; add a `create-<name>` / degit path and (optional) an MCP or published skill so an agent scaffolds/aligns in one step | done (this PR - README Start gains the `npx degit .../dist` path + llms.txt invocation guidance; MCP/published-skill stays optional-later) |
| DISCO-3 | Content that ranks for the queries | LLMs learn from and cite public writing | publish the blog pieces drafted privately (the loop, plan-first modernize, language-as-config) and the positioning as public posts/README so the queries "how to keep docs/specs/decisions in-repo, agents-first" resolve to this | doing (2026-07-22: all three posts written publish-ready in the owner's private space (posts/01-03), CTA wired to the repo; the remaining step is the owner's publish click on their channels - the only physically external action in the epic) |
| DISCO-4 | Docs site - the funnel after the landing | the landing explains fast; then a human needs nextjs.org/docs-style documentation: what it is -> quickstart -> concepts -> guides -> reference -> FAQ, in reading order; agents already have the md files - humans deserve the rendered view of the SAME sources (owner, 2026-07-22) | a docs site **rendered from the repo's own md** (folder READMEs, taxonomy, adoption, checklist, FAQ - single source, two surfaces: files for agents, HTML for humans), deployed with the landing under the product domain; IA modeled on nextjs.org/docs; blocked on NAME-1 (domain) | done (this PR - `tools/docsite.mjs` dependency-free renderer + `apps/docs-site/` 13 pages, dark-first in the landing's palette (owner ask); the deploy under the product domain waits for NAME-1) |
| FAQ-1 | Seed the FAQ | recurring adopter questions (which model, weak model OK?, messy repo, paid tracker, solo ceremony, deviations, vs Spec Kit/Backstage, how do I know it worked) deserve short canonical answers | `docs/faq.md` - eight Q&As, each linking the long version; model guidance in `adoption.md` extended: strongest model at max thinking preferred; weaker models finish the job via lossless re-runs (align is re-entrant) | done (this PR) |

## Epic: Cross-discipline standards & polish

Established standards worth folding in the same way personas were (catalog + ways-of-working
+ optional ADR, reflected to `dist/`). Scrum/SAFe are deliberately **out of scope** - the
framework is spec-driven + trunk-based, not ceremony-based.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| STD-C4 | Architecture diagrams via the **C4 model** | `ARCHITECTURE.md` has no diagram convention | C4 convention in ARCHITECTURE; reflected to `dist/` | done (#39) |
| STD-A11Y | Accessibility baseline: **WCAG 2.2 AA** | UX has no gate; Biome a11y already enforces part | WCAG 2.2 AA in the Quality catalog; reflected to `dist/` | done (#39) |
| STD-PO | PO/PM quality: **INVEST + Definition of Ready + Impact/Story Mapping** | spec/backlog quality and greenfield discovery lacked named methods | INVEST + DoR in the backlog template; Impact + Story Mapping in `greenfield-start`; reflected to `dist/` | done (#39) |
| STD-SEC | Security references: **OWASP ASVS + SLSA + Twelve-Factor** | we do the practices without naming the frameworks | ASVS + SLSA referenced in the Security baseline (#39); Twelve-Factor named in `stacks/node-ts/DECISIONS.md` (this PR) | done |
| STD-UX | UX & design-system standards: **NN/g heuristics + JTBD + usability cadence + DTCG tokens** | UI quality had one gate (WCAG); the review lens, research cadence, and token/handoff standard were unnamed (owner ask 2026-07-21; research: DTCG v2025.10 stable, ~84% adoption) | two catalog forks: "UX review lens & research cadence" (NN/g + ~5-user tests + JTBD in personas) and "Design tokens & design-system handoff" (DTCG three-tier); reflected to `dist/` | done (this PR) |
| LAND-1 | Landing messaging pass | copy does not fully say who it is for (PO builds via spec), that greenfield+brownfield both apply | hero + sections rewritten. Done: JS loop wheel, "Use cases" rename, PO/Architect/AI role cards, human-language-agnostic story (#43); this PR: the positioning one-liner verbatim under the hero, #paths as an explicit Greenfield/Brownfield two-paths section (waves, drift 0, 'first-class citizen'), the PO-builds-via-spec card (clarify gate, deferrable technical questions), nav labels reconciled | done (this PR) |
| REFLECT-MAP-1 | Map `personas` into `reflect.mjs` | a new `dist/` file with no map entry orphans the drift check | `dist/docs/personas.md` mapped; `greenfield-start` auto-maps via the skills loop; `reflect --check` green | done (#38) |
| REFLECT-MAP-2 | Map `docs/adoption.md` into `reflect.mjs` | adoption.md (#39) is a new copy-class `dist/` file not yet in the map | `docs/adoption.md` added to the copy map; `reflect --check` green (drift 0) again | done (this PR) |
| MERGE-HYGIENE | Base PRs on `main`, merge in order | stacking PRs on feature branches stranded ENG-1/2, adoption, modernize, thesis (they "merged" into dead bases; rebase-merge dropped the children) - recovered as #38/#39/#40 | `CONTRIBUTING` states base-on-main and how to stack safely (merge parent first) | done (this PR) |
| LIVING-1 | State the living-documents principle | the standard practiced it but never said it: docs/specs/records are updated **in place**, the current version is the truth, history stays in the doc only when it matters (2026-07-21 notes pass) | `taxonomy.md` section "Living documents - updated in place" (in-place edits; significant reversals noted in-doc; records live by supersede, not rewrite); reflected to `dist/` | done (this PR) |
| DOCIDX-1 | Index convention for multiplying docs | once a repo grows, agents crawl hundreds of docs hunting context; a per-directory README index is the map | `taxonomy.md` section "When documents multiply - index them" (one line per doc; `AGENTS.md` points at indexes; same-PR coupling for index updates); reflected to `dist/` | done (this PR) |

## Epic: Repo structure & dogfood (self-exemplarity)

From the 2026-07-21 re-review: the repo must model its own standard - an entering agent
reads one map and knows what is this repo's own life, what is the standard's source, and
what is the shipped skeleton (ADR-008); and the shipped skills split into lifecycle vs
transition (ADR-009).

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| DOG-1 | Root `AGENTS.md` for this repo | the standard's own repo violated its first rule - no agent entry point at its root | root `AGENTS.md`: the three zones, the name-collision warning, skill classes, working-here rules | done (this PR) |
| DOG-2 | Rehome root strays | landing + wheel experiments + working notes sat loose in the root, against the repo's own taxonomy | `apps/landing-page/` (index.html + experiments/ + README index); personal/blog/idea notes and ALL working research moved OUT of the repo entirely (owner's private space) - the public repo carries only decided, community-facing content | done (this PR) |
| DOG-3 | `PRODUCT.md` catches up (living doc) | its roadmap listed four long-done items as Open - the vision doc itself rotted | Shipped/Open refreshed from the backlog; "Who it serves" states the three-legged utility (PO / Dev / project) + AI-context-first | done (this PR) |
| DOG-4 | ADR index actually indexes | `decision-records/adr/README.md` said "(none yet)" beside seven records; ADR-006/007 were missing from reflect's source-only guard | source index lists 001-009; `reflect.mjs`: adr README reclassified copy -> divergent (dist keeps the empty template), ADR-006..009 added to source-only | done (this PR) |
| STRUCT-1 | Regroup zone-2 source under one directory | `github/`/`claude/`/`agents/` collide with dot-dir conventions; ADR-008 picked the grouped layout | done (this PR - owner overrode the rides-alone DoD: everything in one PR): zone-2 source (specs, skills, agents, claude, github, gitleaks, decision-records, manifest, shipped docs) moved under `standard/`; repo-own docs stay at `docs/`; `dist/` name kept (owner - it IS the built output); reflect map + docsite map + all repo-own links rewritten; reflect drift 0, docsite regenerates, self-verify unchanged | done (this PR) |
| SKILL-1 | self-verify flags stray transition skills | ADR-009 (revised): transition skills never ship - reflect already guards dist; the remaining hole is a consuming repo where someone hand-copied one | `self-verify` warns when a known transition skill sits in an aligned repo's `.claude/skills/`; nothing to clean up by design | done (this PR - WARN per hit citing ADR-009, never counted as drift; positive-tested on fake skill dirs; dist's 9 lifecycle skills stay silent) |
| PROF-1 | Core vs scale profiles, mechanically (ADR-011) | one standard must fit a solo project and an enterprise without forking or footnote-rot; the owner wants ONE repo | `profile: core|scale` on every manifest entry; `self-verify --profile solo|team` counts drift per subset; `docs/adoption.md` profile picker (done in prose, this PR); light/full views rendered from the manifest, never hand-written | done (this PR - profile on all 21 files/sections/guards entries (changes + spec-guard = scale, rest core); --profile solo skips scale entries with a note, default byte-identical to before; missing profile counts as core so old manifests keep working) |
| DOCIDX-2 | Every folder explains itself (what / contents / why+how) | a folder without its why forces every reader to reverse-engineer intent; the owner wants recommendations and reasoning per element, without one giant unmaintainable file (2026-07-22 ask) | taxonomy: three-section README convention (README = folder describer, GitHub-rendered in place; `catalog.md` reserved for curated lists); instances added where missing: `skills/`, `docs/`, `tools/` (others already had one); long-form why moves to guides/case studies | done (this PR) |
| NAMES-1 | catalog -> checklist rename | "catalog" means the index of what exists (library sense) - but the file listed decisions to MAKE; the record indexes (adr/bdr READMEs) are the real catalogs (owner, 2026-07-22) | `decision-records/checklist.md` (+dist, manifest path, ~20 files of references); ADR index gains a "Decides" gist column so agents read one table instead of every record | done (this PR) |
| CASE-1 | Case-study collection - anonymized field evidence | rules read as arbitrary without the case that earned them; real examples are gold but client/repo names must never appear | `docs/case-studies/`: genre rules (anonymize hard; only cases that earn a rule; added in the same PR as the rule) + five seed cases (skipped clarify, Proposed-as-maybe, enabling work, stacked PRs, number collision), each linking where the rule lives now | done (this PR) |
| FOUND-1 | Manifesto - the founder's why | the goal ("everything in one repo, coherent, close to code, AI-readable, verifiable") lived only in conversations; contributors and adopters need the idea stated once, bindingly | `docs/manifesto.md`: the itch, the idea (proximity is the mechanism, coherence is the outcome), what it must feel like per role, 7 non-negotiables, the bet; linked from PRODUCT | done (this PR) |
| OQ-1 | Open-questions ledger - provisional calls seek challengers | many calls were made on judgment at the simplicity-vs-universality boundary (README-per-folder, tracker default, profiles split, dist name, CSS Modules, ...); contributors should see the owner's own doubts with reasoning, not re-discover them (owner ask 2026-07-22) | `docs/open-questions.md` (14 entries incl. its own shape) + taxonomy row (new knowledge kind: open question) + CONTRIBUTING points challengers there as the most valuable contribution | done (this PR) |

## Status & what's next

The core standard is essentially complete and stands on its own tooling. Landed: versioned
self-update + **manifest** + **drift as a number** (ENG-2), source->dist **reflect** build
(ENG-1), two-changelog assembler (REL-1), **personas** as a validation gate + `greenfield-start`,
the **adoption checkmap** + model guidance, **modernize** (plan-then-refactor, ADR-007),
**Layer 2** (`stacks/node-ts`, evidence-based), the 4 cross-discipline standards, the
**working-language** policy, and the landing (JS loop wheel).

Cleared this pass (wave 2, 2026-07-21): IDEA-1, LIFE-1/2, GUIDE-1/2, EXPLAIN-1, PERS-3,
STD-UX, LIVING-1, DOCIDX-1, DOG-1..4 - plus ADR-008/009/010 written (Proposed) and the
research pass (owner's private research space; only decided outputs live in-repo).

**Open, in priority order** (wave 3, 2026-07-22, cleared nearly everything - what
remains is gated, not backlogged laziness):

1. **ENG-5** - vendor the patched Spec Kit engine (ADR-013); fetch + patch + end-to-end
   test in a scratch repo.
2. **DISCO deploy tail** - NAME-1 is decided (`repository-standards` stays; both
   domains already owned): deploy the docs site + landing, publish npm, submit the
   listings (DISCO-1 tail + DISCO-3 via owner's channels).
3. **STARTER-1** - boot-verified greenfield starter, own PR by its own DoD
   (`pnpm i && pnpm dev` boots web+api through the proxy with auth; `test:all` green).
4. **STACKS-2** - the second stack (Python) - needs evidence repos first; authoring it
   from guesswork would break Layer 2's evidence-based bar.
5. **DISCO-3 + DISCO-1 tail** - publish the blog pieces (owner's channels) + npm/
   awesome-lists after NAME-1.
6. **Release** - fragments have piled up deliberately; when you want, cut the version +
   write `RELEASE-NOTES.md` (`tools/changelog.mjs`). Maintainer-only, 0.7.x line.

## Done (drop at next release)

| id | title | landed |
|----|-------|--------|
| ENG-1/2 | Align-engine manifest + drift + reflect build | #38 |
| REL-1 | Two-changelog assembler | #29 |
| PERS-1/GF-1 | Personas validation gate + greenfield-start | #32 |
| ENG-adopt | Adoption checkmap + 4 standards + modernize | #39 |
| L2-1 | Layer 2 `stacks/node-ts` | #30 |
| CONV-lang | Working-language policy | #36 |
| KB-A | Decision checklist (`decision-records/checklist.md`) | PR #16 |
| KB-B | Repo-assessment playbook (`docs/repo-assessment.md`) | PR #18 |
| KB-C | Ways-of-working, PO -> dev -> AI (`docs/ways-of-working.md`) | PR #20 |
| BL-1 | `add-to-backlog` skill | PR #21 |
| BL-2 | `backlog-from-specs` skill | PR #21 |
| - | Backlog layer + `onboard-repo` | PR #15 |
| - | Taxonomy map, `PRODUCT.md`, ADR-004 | PR #14 |
