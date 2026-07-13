# repository-standards - backlog

> The standard's **own** backlog, dogfooding [`docs/backlog.template.md`](docs/backlog.template.md).
> A working doc (root, source-only, not shipped to `dist/`) - the same role
> `PRODUCT.md` and `materialy-i-decyzje.md` play. Ordered by risk x leverage; an item
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
| PERS-1 | Personas as a validation gate | "for whom?" had no home; a capability could be buildable and useless | `personas.template.md` + `dist/docs/personas.md`; ADR-006 (Accepted); wired into taxonomy, ways-of-working (PO stage), `specs/README` (spec names its persona), backlog template (persona column), decision catalog (target personas = BDR); reflected to `dist/` | done |
| GF-1 | `greenfield-start` guided flow | new projects needed a for-whom -> what -> how conversation, not a blank scaffold | `greenfield-start` skill: elicit product + personas, choose the stack (Layer 2 default), record foundational ADRs, break into modules, write persona-anchored specs + business requirements, seed the backlog, self-verify; reflected to `dist/` | done |
| PERS-2 | Mechanical persona check in the spec guard | a spec with no persona should fail like one with no error table | `spec-structure.mjs` fails a capability spec that names no persona (Serves field / roster mention), roster parsed from `personas.md`, skips when absent; template gains a `Serves` field; reflected to `dist/` | done (this PR) |

## Epic: Ideas / discovery incubator (pre-decision)

Before an intent is even backlog-ready there is a space the standard does not yet bless: a
**speculative idea that may never ship**, explored end-to-end - including its provisional
technical and business shape - without minting any record. Today the taxonomy sends "research
that fed a decision" to a working doc, but frames discovery as *input to a decision already in
motion*. It has no first-class home for an idea still being weighed, and no rule against
prematurely dressing an idea as an ADR/BDR/spec.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| IDEA-1 | First-class ideas/discovery space + graduation rule | Real trigger: in my-brand a whole go-to-market direction (how selling works, a template-marketplace, a membership module) got written up as `Proposed` ADR/BDR - but there was **no decision**, only a maybe. `Proposed` in MADR means "a decision awaiting ratification", not "an idea we might pursue"; using it for speculation pollutes the decision log and implies a fork was taken when none was. The whole idea (incl. its provisional technical shape) belongs in one discovery/idea artifact; ADR/BDR/specs are minted **only when the idea is approved for realization** and enters the ways-of-working flow. | Design the division: name + folder (e.g. `docs/discovery/` or `docs/ideas/`), a lifecycle/status (`idea` -> `exploring` -> `approved` / `parked` / `dropped`), how an idea holds provisional technical/business shape without records, the **graduation** step (approved idea -> backlog intent -> spec/ADR/BDR), and a guard/convention that no record/spec is created for an un-approved idea. Endorse it positively in `taxonomy.md` (done, note) + `ways-of-working.md` (a pre-intent stage) + `decision-records/README` ("not a record until approved"). Reflect to `dist/`. | todo |

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

## Epic: Reflection engine & self-consistency

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| ENG-1 | `source -> dist` build script | `dist/` is a hand-maintained snapshot that drifts (path rewrites, source-only ADRs done by hand each time); the repo's own README flags this | **done (this PR):** `tools/reflect.mjs` encodes the source->dist map in four classes (copy / divergent / authored-only / source-only); `--check` reports drift as a number + catches orphans and source-only leaks, `--write` syncs the copy class. Caught + fixed real drift on landing (spec-guard header, adr `_template` missing Confirmation). Open increment: mechanize the `divergent` transforms (template->real, link rewrites) so they are byte-checkable too. | done |
| ENG-2 | Manifest + align-engine | `align-to-standards` is prose; a data-driven manifest makes reconcile measurable and repeatable | **done (this PR):** `standard.manifest.json` describes what an aligned repo must have (files/sections/guards/decisions + adapt rules); `self-verify.mjs` reads it and reports **drift as a number**; align/update skills read it. Open increment: a runner that computes the update plan from the manifest delta automatically (today the agent does it). | done |
| ENG-3 | ADR: "align-engine is a manifest" | the ENG-2 shape is a re-litigable decision worth recording | ADR drafted with rejected alternatives; **Accepted** | done |

## Epic: Consistency - in-repo instructions are the source of truth

The point: **rules for working in a repo must live IN the repo, not in an individual's
personal AI memory or global config.** Only then do all contributors - every agent, every
dev - work from the same guidance and build the same repo, without divergence. Consistency
is the whole value; a rule that lives only in one person's memory silently splits the repo.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| CONS-1 | In-repo instructions over personal memory | if the "how to work here" (AI settings, agent rules, repo-specific gotchas) lives in someone's personal memory/`~/.claude`, other contributors and agents never see it - the repo splits into inconsistent variants | an **ADR**: repo-local instructions (`AGENTS.md`, conventions, `CONTRIBUTING`, the specific spot each rule belongs) are the single source of truth; personal memory/global config may point to them but must not *hold* repo rules. Reject "it's in my memory" as a place for a repo rule. | todo |
| CONS-2 | Repo-specific rules land in the right place, checkably | a rule in the wrong file (or scattered) is as good as missing; e.g. "pass the full tenant id when editing its template in scope" belongs in `CONTRIBUTING`/`AGENTS`, not a chat | a convention + (where possible) a check: repo rules have a home in the taxonomy (which rule kind goes where); flag rules that exist only outside the repo. Each repo customizes the content, but the *location discipline* is the standard's | todo |
| CONS-3 | Onboarding/align surfaces "move your personal rules into the repo" | brownfield repos often have tribal/agent rules in people's heads or personal configs | `onboard-repo` / `align-to-standards` prompt: elicit the unwritten rules and personal-config instructions, and land them in-repo in the right place (CONS-2) so the repo becomes self-describing | todo |

## Epic: Buildable spec depth - field lessons

Observations from retrofitting a full capability set (~20+ specs) to the `buildable`
tier from existing code. Refinements to the spec-depth standard, not new inventions;
the next agent should check each against the current standard before acting.

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| SD-1 | Lead the tier decision with the rebuild-and-verify test | the "money / security / data-integrity / external-contract" enumeration is a proxy; the one discriminator that actually resolved every tier call in practice is a single question - "could an agent rebuild and verify this capability from the spec alone, without the code?" | spec-depth section leads with that question; the enumeration becomes worked examples under it; reflected to `dist/` | todo |
| SD-2 | Make the verbatim error table and an "Open questions" section required, not optional | applying `buildable` at scale, the two sections that caught real bugs were (a) the exhaustive per-endpoint error table - status + errorCode + message - which forces reading every branch, and (b) an Open-questions section that surfaced spec<->code discrepancies which became tracked issues | `capability-spec.template.md` marks both as required; template also requires >=1 Given/When/Then per invariant; reflected to `dist/` | todo |
| SD-3 | Default to buildable; do not pre-declare behavioral to save effort | pre-marking peripheral capabilities `behavioral` and rewriting them `buildable` later wasted a pass - writing the contracts is exactly what surfaces the bugs, so the thin capabilities benefit most; `behavioral` stays an escape hatch that must be justified in-spec and is expected to be rare | standard states the expectation (buildable is the default even for peripheral capabilities; behavioral requires an in-spec justification and should be rare); reflected to `dist/` | todo |
| SD-4 | Document the extract-verbatim -> synthesize retrofit workflow | for brownfield, the reliable method was a read-only pass extracting verbatim contracts with `file:line` references, then authoring the spec from that; the `file:line` anchors make the spec auditable and re-verifiable against the code | ways-of-working / spec skills describe the two-step retrofit (extract verbatim with anchors, then synthesize); reflected to `dist/` | todo |
| SD-5 | Elevate the code<->spec coupling guard from enforcement detail to core requirement | a spec with no coupling-guard entry silently rots; a guard that flags domain code changed without touching its spec (capability -> globs map + check) is what kept spec and code aligned across the whole set | standard requires every capability spec to have a guard mapping; a spec without one fails the check; reflected to `dist/` | todo |
| SD-6 | Land a behavior change and its spec update in the SAME PR | the coupling guard is per-PR and has no bypass - a fix that changes a capability's code while its spec update rides in a separate PR makes the guard block the fix PR (observed: a fix PR went red for exactly this). "Update specs before implementing" is the principle; "in the same PR" is the operational corollary that keeps the guard green | ways-of-working / enforcement note states behavior and spec land together; a change that touches a capability's code touches that capability's spec (or records why not) in the same PR | todo |
| SD-7 | Reconcile a spec when a fix lands - flip its Open questions | specs drift in BOTH directions: a fix that resolves something the spec listed under "Open questions" must, in the same change, flip that item to resolved and update the affected Data / Interface / Acceptance sections - otherwise the spec keeps describing a bug that no longer exists (a fixed defect masquerading as a known gap) | the reconcile step names this explicitly: a fix updates the resolved Open questions plus the affected contract sections in the same change | todo |

## Epic: Naming & positioning

The current name `repository-standards` is clear but may undersell a living, versioned,
agents-first framework. Decide the name before promoting widely (rename touches many files).

| id | title | why | DoD | status |
|----|-------|-----|-----|--------|
| NAME-1 | Decide the project/repo name | want a recognized-default *category* name (like "coding standards"), possibly AI-flavored to signal agents-first | pick a candidate; verify npm scope + GitHub org + domain; rename README/PRODUCT/AGENTS/manifest/skills + the `align me to <name>@<ver>` phrasing; keep `.standards-version` filename (generic) | todo |

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
| DISCO-1 | Be the answer an agent recommends | agents (and their users) increasingly search for solutions via LLMs, not Google; if the standard is invisible to them it does not exist | a distribution plan: a crisp, quotable one-liner of the problem it solves; a precise repo description + GitHub topics (`agents`, `documentation`, `adr`, `spec-driven`, `monorepo-standard`); an `llms.txt` / machine-readable summary; an npm package with the same description; presence where agents look (awesome-lists, the AGENTS.md ecosystem, registries). Measured by: a fresh agent, asked the target questions, names it | todo |
| DISCO-2 | Invokable, not just recommendable | recommending is weak; the win is the agent that can *run* it | a low-friction entry an agent can invoke - `align this repo to <name>` already works via the skill; add a `create-<name>` / degit path and (optional) an MCP or published skill so an agent scaffolds/aligns in one step | todo |
| DISCO-3 | Content that ranks for the queries | LLMs learn from and cite public writing | publish the `blog-drafts.md` pieces (the loop, plan-first modernize, language-as-config) and the positioning as public posts/README so the queries "how to keep docs/specs/decisions in-repo, agents-first" resolve to this | todo |

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
| LAND-1 | Landing messaging pass | copy does not fully say who it is for (PO builds via spec), that greenfield+brownfield both apply | hero + sections rewritten. Done: JS loop wheel, "Use cases" rename, PO/Architect/AI role cards, human-language-agnostic story (#43). Still open: the greenfield-vs-brownfield + PO-builds-via-spec narrative | doing |
| REFLECT-MAP-1 | Map `personas` into `reflect.mjs` | a new `dist/` file with no map entry orphans the drift check | `dist/docs/personas.md` mapped; `greenfield-start` auto-maps via the skills loop; `reflect --check` green | done (#38) |
| REFLECT-MAP-2 | Map `docs/adoption.md` into `reflect.mjs` | adoption.md (#39) is a new copy-class `dist/` file not yet in the map | `docs/adoption.md` added to the copy map; `reflect --check` green (drift 0) again | done (this PR) |
| MERGE-HYGIENE | Base PRs on `main`, merge in order | stacking PRs on feature branches stranded ENG-1/2, adoption, modernize, thesis (they "merged" into dead bases; rebase-merge dropped the children) - recovered as #38/#39/#40 | `CONTRIBUTING` states base-on-main and how to stack safely (merge parent first) | done (this PR) |

## Status & what's next

The core standard is essentially complete and stands on its own tooling. Landed: versioned
self-update + **manifest** + **drift as a number** (ENG-2), source->dist **reflect** build
(ENG-1), two-changelog assembler (REL-1), **personas** as a validation gate + `greenfield-start`,
the **adoption checkmap** + model guidance, **modernize** (plan-then-refactor, ADR-007),
**Layer 2** (`stacks/node-ts`, evidence-based), the 4 cross-discipline standards, the
**working-language** policy, and the landing (JS loop wheel).

Cleared this pass: REFLECT-MAP-2, PERS-2, MERGE-HYGIENE, STD-SEC (all done).

**Open, in priority order** (each is polish/breadth or a decision - not foundation):

1. **NAME-1** - pick the name (owner leans `repository`/`project-standards`, AI variant an
   option), then a rename PR. The one blocked-on-you decision.
2. **LAND-1 (tail)** - finish the landing messaging (greenfield vs brownfield; PO-builds-via-spec).
3. **L2 follow-up** - cross-check `roomlink`/`console`; add a stack `gitleaks` template
   (the e2e / testing template is done - Vitest tiers + Playwright + test-stack + Lighthouse).
4. **Release** - many features have accumulated; when you want, cut a version + write
   `RELEASE-NOTES.md` from the `changes/` fragments (`tools/changelog.mjs`). Maintainer-only.

## Done (drop at next release)

| id | title | landed |
|----|-------|--------|
| ENG-1/2 | Align-engine manifest + drift + reflect build | #38 |
| REL-1 | Two-changelog assembler | #29 |
| PERS-1/GF-1 | Personas validation gate + greenfield-start | #32 |
| ENG-adopt | Adoption checkmap + 4 standards + modernize | #39 |
| L2-1 | Layer 2 `stacks/node-ts` | #30 |
| CONV-lang | Working-language policy | #36 |
| KB-A | Decision catalog (`decision-records/catalog.md`) | PR #16 |
| KB-B | Repo-assessment playbook (`docs/repo-assessment.md`) | PR #18 |
| KB-C | Ways-of-working, PO -> dev -> AI (`docs/ways-of-working.md`) | PR #20 |
| BL-1 | `add-to-backlog` skill | PR #21 |
| BL-2 | `backlog-from-specs` skill | PR #21 |
| - | Backlog layer + `onboard-repo` | PR #15 |
| - | Taxonomy map, `PRODUCT.md`, ADR-004 | PR #14 |
