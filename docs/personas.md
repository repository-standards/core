# Personas - who repository-standards is built for

> The standard's own roster, dogfooding [`standard/docs/personas.md`](../standard/docs/personas.md)
> and ADR-006: every epic, skill, and doc in this repo must name which of these it
> serves. Source-only (a consuming repo writes its own product's roster).

> Built distrust-first, not identity-first: each persona below opens with what they fear,
> distrust, or need to see before they act, and "Who / context" is the last line, not the
> first. Source and rationale in [`standard/docs/personas.md`](../standard/docs/personas.md).

## The roster

| Persona | Primary? | One-line |
|---|---|---|
| `Standard-bearer Staszek` | yes | solutions architect / tech lead who adopts the standard across repos and runs the transitions |
| `Spec-first PO Paula` | no | owns behavior and priorities; builds via stories and specs, never via code |
| `Buildable-truth Dev Darek` | no | turns intent into buildable specs and code; hates re-litigating settled decisions |
| `Coding agent` | no | the AI that reads the repo as context and executes the loop; consumer, not customer |
| `Owner Olek` | no | owns the company / project / teams; cannot audit code himself - buys **assurance**: a public, checkable standard proving his people ship quality |

## `Standard-bearer Staszek` (primary)

- **Distrust & friction.** Afraid of a big-bang alignment that stalls half-done and never
  gets picked back up. Distrusts a standard written as prose - it drifts silently and
  nobody notices until an audit. Tooling that assumes greenfield breaks the moment he
  points it at the messy repo he actually has. A paid tracker bolted onto a hobby project
  feels like scope creep he did not sign up for.
- **Jobs to be done.** "When I inherit or revisit a messy repo, I want to point an agent
  at a reference and have it walk the repo there, so quality does not depend on my
  memory." "When the standard improves, I want each repo to update by delta and prove
  compliance, so upkeep is a command, not a project."
- **Goals.** Drift as a number, per repo; one way of working everywhere; transitions that
  are guided, resumable, and safe on brownfields.
- **Decisions they influence.** ADR-005 (manifest), ADR-008/009 (zones, skill classes),
  ADR-010 (lifecycle + tracker), the project's naming.
- **Success signals.** A repo he has not touched in months passes `self-verify` after one
  `update-to-latest` run; a new client repo reaches drift 0 in planned waves.
- **Anti-goals.** An IDE lock-in, a SaaS dependency, or a ceremony layer (Scrum-for-AI).
- **Who / context.** Senior dev / architect responsible for more than one repo (own
  products + client work); lives in the terminal with a coding agent.

## `Spec-first PO Paula`

- **Distrust & friction.** Afraid a spec goes to build half-baked and comes back as review
  ping-pong instead of a clean handoff. Jargon walls make her feel locked out of her own
  product. Worried a deferral she made gets silently dropped instead of routed to the
  technical pass. Distrusts any tool that expects her to run a command she has never heard
  of.
- **Jobs to be done.** "When I write a story, I want to be asked exactly the questions
  that make it buildable - and be allowed to defer the technical ones explicitly - so
  refinement happens once, not in review ping-pong." "When I read a decision, I want it
  explained plainly with examples, so I can gate it honestly."
- **Goals.** See at a glance what is in-refinement vs ready-to-develop; trust that
  acceptance criteria survive into tests.
- **Decisions they influence.** ADR-006 (personas gate), the clarify gate (ADR-010),
  the plain-language explainers, backlog/status conventions.
- **Success signals.** Zero specs reaching a developer with open clarifications; Paula
  answers or defers every clarify question without leaving the flow.
- **Anti-goals.** Writing YAML, choosing libraries, or learning git internals.
- **Who / context.** Product owner without a compiler; thinks in users, behavior, and
  priorities, working through chat and specs.

## `Buildable-truth Dev Darek`

- **Distrust & friction.** Distrusts a descriptive spec he could not rebuild the system from
  - it is narration, not a contract. Scaffolding debris left behind by a shipped feature
  reads as nobody finished the job. Worst fear: docs that lie about the current system,
  because he will trust them exactly once before he stops trusting any of them.
- **Jobs to be done.** "When I pick up a ready-to-develop spec, I want every contract
  verbatim, so the agent and I can build and verify without archaeology." "When a change
  ripples, I want the guard to tell me which specs/ADRs it touches, so nothing rots."
- **Goals.** Same-PR spec+code coupling that stays green; decisions recorded once,
  re-litigated never.
- **Decisions they influence.** ADR-002/003 (specs by capability, buildable), the spec-first
  loop and its gates, the coupling guard, stack picks in the registered stack repos (`stacks.json`).
- **Success signals.** A capability rebuilt from its spec alone passes its tests; the
  coupling guard blocks a drifting PR before review does.
- **Anti-goals.** Process for its own sake; being the human linter.
- **Who / context.** Senior developer pairing with agents daily; wants contracts, not
  vibes.

## `Owner Olek`

- **Distrust & friction.** Fears vendor lock-in to one contractor's private conventions he
  cannot audit himself. Distrusts "trust me, it's clean" as a quality signal, because he
  has no way to check it. Worst case: discovering the docs lied at the exact moment - a
  handover, an audit - when he needed them to be true. Wary of paying for enterprise-grade
  process on a five-person company that cannot carry the overhead.
- **Jobs to be done.** "When I fund a team, I want their repos held to a standard that
  people better than me have already vetted, so I do not have to personally verify work
  I cannot read." "When a key developer leaves or an auditor asks questions, I want the
  repo to explain itself, so the company's knowledge is an asset I own, not a memory
  that walked out."
- **Goals.** Maintainable, transferable repositories; quality he can *point at* (a green
  self-verify, a pinned standard version) instead of quality he must take on faith;
  onboarding a new dev or agency without a month of tribal handover.
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
- **Who / context.** Founder / company owner / head of a business unit; not hands-on
  technical, reads dashboards and outcomes, not diffs.

*Position note:* the role is **Owner** - deliberately not "project manager" (a PM runs
delivery from inside; Olek sits above it and buys assurance) and not "sponsor" (too
corporate for a persona who may simply own the whole company). If a team has a PM
persona, it is a variant of `Spec-first PO Paula`, not of Olek.

## `Coding agent`

- **Distrust & friction.** Cannot act correctly on stale docs or dead scaffolding - it has
  no way to tell they are stale. Its single point of failure: a rule that lives only in
  someone's head or personal config, invisible to a fresh session (ADR-012 exists against
  exactly this).
- **Jobs to be done.** "When I enter a repo, I want one entry point and honest indexes,
  so I load the right context without crawling." "When the user talks features, I want
  rules that tell me to start the loop unprompted, so process does not depend on the
  user knowing skill names."
- **Goals.** Deterministic navigation (taxonomy, indexes); mechanical gates it can obey
  (clarify gate, coupling guard, self-verify).
- **Decisions they influence.** AGENTS.md-as-entry, honest folder indexes, living docs (R4), the enforcement
  stack.
- **Success signals.** An agent fresh in the repo executes the loop correctly with no
  human prompting beyond the feature description.
- **Anti-goals.** Being trusted to "remember" anything not written down.
- **Who / context.** Claude Code / Cursor / any agent reading `AGENTS.md` first; no
  memory between sessions, the repo IS its context.
