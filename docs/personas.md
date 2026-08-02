# Personas - who repository-standards is built for

> The standard's own roster, dogfooding [`standard/docs/personas.md`](../standard/docs/personas.md)
> and ADR-006: every epic, skill, and doc in this repo must name which of these it
> serves. Source-only (a consuming repo writes its own product's roster).

## The roster

| Persona | Primary? | One-line |
|---|---|---|
| `Standard-bearer Staszek` | yes | solutions architect / tech lead who adopts the standard across repos and runs the transitions |
| `Spec-first PO Paula` | no | owns behavior and priorities; builds via stories and specs, never via code |
| `Buildable-truth Dev Darek` | no | turns intent into buildable specs and code; hates re-litigating settled decisions |
| `Coding agent` | no | the AI that reads the repo as context and executes the loop; consumer, not customer |
| `Owner Olek` | no | owns the company / project / teams; cannot audit code himself - buys **assurance**: a public, checkable standard proving his people ship quality |

## `Standard-bearer Staszek` (primary)

- **Who / context.** Senior dev / architect responsible for more than one repo (own
  products + client work). Lives in the terminal with a coding agent; time split across
  projects, so every repo must be self-describing when he returns to it.
- **Jobs to be done.** "When I inherit or revisit a messy repo, I want to point an agent
  at a reference and have it walk the repo there, so quality does not depend on my
  memory." "When the standard improves, I want each repo to update by delta and prove
  compliance, so upkeep is a command, not a project."
- **Goals.** Drift as a number, per repo; one way of working everywhere; transitions that
  are guided, resumable, and safe on brownfields.
- **Pains / frictions.** Big-bang alignments that stall; standards that are prose, not
  checks; tooling that assumes greenfield; paid trackers on hobby projects.
- **Decisions they influence.** ADR-005 (manifest), ADR-008/009 (zones, skill classes),
  ADR-010 (lifecycle + tracker), the project's naming.
- **Success signals.** A repo he has not touched in months passes `self-verify` after one
  `update-to-version` run; a new client repo reaches drift 0 in planned waves.
- **Anti-goals.** An IDE lock-in, a SaaS dependency, or a ceremony layer (Scrum-for-AI).

## `Spec-first PO Paula`

- **Who / context.** Product owner without a compiler; thinks in users, behavior, and
  priorities. Works through chat/specs; the repo is readable to her only if the standard
  makes it so.
- **Jobs to be done.** "When I write a story, I want to be asked exactly the questions
  that make it buildable - and be allowed to defer the technical ones explicitly - so
  refinement happens once, not in review ping-pong." "When I read a decision, I want it
  explained plainly with examples, so I can gate it honestly."
- **Goals.** See at a glance what is in-refinement vs ready-to-develop; trust that
  acceptance criteria survive into tests.
- **Pains / frictions.** Specs that go to build half-baked; jargon walls; her deferrals
  getting lost; tools that require her to run commands she does not know exist.
- **Decisions they influence.** ADR-006 (personas gate), the clarify gate (ADR-010),
  the plain-language explainers, backlog/status conventions.
- **Success signals.** Zero specs reaching a developer with open clarifications; Paula
  answers or defers every clarify question without leaving the flow.
- **Anti-goals.** Writing YAML, choosing libraries, or learning git internals.

## `Buildable-truth Dev Darek`

- **Who / context.** Senior developer pairing with agents daily. Wants contracts, not
  vibes; changes code fastest when the spec, records, and guards say what is settled.
- **Jobs to be done.** "When I pick up a ready-to-develop spec, I want every contract
  verbatim, so the agent and I can build and verify without archaeology." "When a change
  ripples, I want the guard to tell me which specs/ADRs it touches, so nothing rots."
- **Goals.** Same-PR spec+code coupling that stays green; decisions recorded once,
  re-litigated never.
- **Pains / frictions.** Descriptive specs that cannot be rebuilt from; scaffolding
  debris from shipped features; docs that lie about the current system.
- **Decisions they influence.** ADR-002/003 (specs by capability, buildable), the spec-first
  loop and its gates, the coupling guard, stack picks in the registered stack repos (`stacks.json`).
- **Success signals.** A capability rebuilt from its spec alone passes its tests; the
  coupling guard blocks a drifting PR before review does.
- **Anti-goals.** Process for its own sake; being the human linter.

## `Owner Olek`

- **Who / context.** Founder / company owner / head of a business unit - the person the
  repos ultimately belong to. Not hands-on technical (or long past it); hires the
  Staszeks and Paulas of this roster. Reads dashboards and outcomes, not diffs.
- **Jobs to be done.** "When I fund a team, I want their repos held to a standard that
  people better than me have already vetted, so I do not have to personally verify work
  I cannot read." "When a key developer leaves or an auditor asks questions, I want the
  repo to explain itself, so the company's knowledge is an asset I own, not a memory
  that walked out."
- **Goals.** Maintainable, transferable repositories; quality he can *point at* (a green
  self-verify, a pinned standard version) instead of quality he must take on faith;
  onboarding a new dev or agency without a month of tribal handover.
- **Pains / frictions.** Vendor lock-in to one contractor's private conventions; "trust
  me, it's clean" as the only quality signal; discovering at the worst moment that the
  docs lied; paying enterprise prices for process a five-person company cannot carry.
- **Decisions they influence.** ADR-011 (the scale profile is his shape of the product;
  core keeps his solo projects cheap), naming and discovery (his trust story only works if the
  standard will be publicly credible and community-reviewed - it is neither yet, and that
  gap is the work, not the claim), the going-public bar (nothing in the repo the community
  should not see).
- **Success signals.** He can ask any repo "are you compliant, and to which version?"
  and get a number; an external audit or handover starts from the repo itself; his
  teams' PRs cite the standard instead of debating taste.
- **Anti-goals.** Reading specs or records himself; choosing technologies; any dashboard
  that needs him to understand git.

*Position note:* the role is **Owner** - deliberately not "project manager" (a PM runs
delivery from inside; Olek sits above it and buys assurance) and not "sponsor" (too
corporate for a persona who may simply own the whole company). If a team has a PM
persona, it is a variant of `Spec-first PO Paula`, not of Olek.

## `Coding agent`

- **Who / context.** Claude Code / Cursor / any agent reading `AGENTS.md` first. No
  memory between sessions - the repo IS its context.
- **Jobs to be done.** "When I enter a repo, I want one entry point and honest indexes,
  so I load the right context without crawling." "When the user talks features, I want
  rules that tell me to start the loop unprompted, so process does not depend on the
  user knowing skill names."
- **Goals.** Deterministic navigation (taxonomy, indexes); mechanical gates it can obey
  (clarify gate, coupling guard, self-verify).
- **Pains / frictions.** Stale docs, dead scaffolding, rules living in someone's head or
  personal config (ADR-012 exists against exactly this).
- **Decisions they influence.** AGENTS.md-as-entry, honest folder indexes, living docs (R4), the enforcement
  stack.
- **Success signals.** An agent fresh in the repo executes the loop correctly with no
  human prompting beyond the feature description.
- **Anti-goals.** Being trusted to "remember" anything not written down.
