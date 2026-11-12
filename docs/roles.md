# Roles - who repository-standards is built for

> The standard's own roster, dogfooding [`standard/docs/roles.md`](../standard/docs/roles.md)
> and ADR-064: every epic, skill, and doc in this repo must name which of these it
> serves. Source-only (a consuming repo writes its own product's roster).

> A role is an actor with permissions, not a character: no names, no biographies. Each role
> opens with what it may do and what it fears or must see before it acts. Modes are listed
> only where the standard has to behave differently for the same role.

## The roster

| Role | Primary? | Permissions | One-line |
|---|---|---|---|
| `Adopting lead` | yes | runs adoption and updates in the repos they own; decides the profile, exceptions and waves | tech lead / architect who adopts the standard across repos and runs the transitions |
| `Product owner` | no | owns specs' behaviour and priorities; answers or defers clarify questions; never touches code | builds via stories and specs, never via code |
| `Developer` | no | changes code and specs together; runs the guards; cannot waive a guard's verdict | turns intent into buildable specs and code; hates re-litigating settled decisions |
| `Coding agent` | no | reads the whole repo, writes within what the guards and elicitation points allow; no memory between sessions | the AI that executes the loop; consumer, not customer |
| `Owner` | no | reads outcomes (self-verify, dashboard, version); funds teams; does not read code or records | buys **assurance**: a public, checkable standard proving the team ships quality |

## `Adopting lead` (primary)

- **Permissions.** Runs `align-to-standards` and `update-to-latest` in repos they own; picks
  the profile, records exceptions with reasons, orders the waves. Cannot make a guard pass by
  configuration - an exception is a recorded deviation, not a waiver.
- **Distrust & friction.** Afraid of a big-bang alignment that stalls half-done and never
  gets picked back up. Distrusts a standard written as prose - it drifts silently and
  nobody notices until an audit. Tooling that assumes greenfield breaks the moment it meets
  the messy repo they actually have. A paid tracker bolted onto a hobby project feels like
  scope creep nobody signed up for.
- **Jobs.** "When I inherit or revisit a messy repo, I want to point an agent at a reference
  and have it walk the repo there, so quality does not depend on my memory." "When the
  standard improves, I want each repo to update by delta and prove compliance, so upkeep is
  a command, not a project."
- **Success signals.** A repo untouched for months passes `self-verify` after one
  `update-to-latest` run; a new client repo reaches drift 0 in planned waves.
- **Anti-goals.** An IDE lock-in, a SaaS dependency, or a ceremony layer (Scrum-for-AI).
- **Modes.**
  - **`greenfield`** - a new repo with nothing to preserve. The standard must scaffold the
    roster, product frame and first specs before any code, in one guided pass.
  - **`brownfield`** - an existing repo with conventions and history. The standard must
    measure first, reconstruct from the code as candidates marked `[NEEDS REVIEW]`, and never
    overwrite a convention it has not asked about.

## `Product owner`

- **Permissions.** Owns behaviour and priority in specs and the backlog; answers or defers
  every clarify question; approves a spec to `ready-to-develop` through the gate. Does not
  write code, YAML or git commands.
- **Distrust & friction.** Afraid a spec goes to build half-baked and comes back as review
  ping-pong instead of a clean handoff. Jargon walls feel like being locked out of the
  product they own. Worried a deferral gets silently dropped instead of routed to the
  technical pass. Distrusts any tool that expects a command they have never heard of.
- **Jobs.** "When I write a story, I want to be asked exactly the questions that make it
  buildable - and be allowed to defer the technical ones explicitly - so refinement happens
  once, not in review ping-pong." "When I read a decision, I want it explained plainly with
  examples, so I can gate it honestly."
- **Success signals.** Zero specs reaching a developer with open clarifications; every
  clarify question answered or deferred without leaving the flow.
- **Anti-goals.** Writing YAML, choosing libraries, or learning git internals.

## `Developer`

- **Permissions.** Changes code and its spec in the same pull request; runs every guard
  locally; proposes ADRs. Cannot waive a guard's verdict or mark a spec ready by typing it.
- **Distrust & friction.** Distrusts a descriptive spec nobody could rebuild the system
  from - it is narration, not a contract. Scaffolding debris left behind by a shipped
  feature reads as nobody finished the job. Worst fear: docs that lie about the current
  system, because they get trusted exactly once.
- **Jobs.** "When I pick up a ready-to-develop spec, I want every contract verbatim, so the
  agent and I can build and verify without archaeology." "When a change ripples, I want the
  guard to tell me which specs and ADRs it touches, so nothing rots."
- **Success signals.** A capability rebuilt from its spec alone passes its tests; the
  coupling guard blocks a drifting PR before review does.
- **Anti-goals.** Process for its own sake; being the human linter.

## `Owner`

- **Permissions.** Reads outcomes: the self-verify number, the pinned standard version, the
  dashboard. Funds and staffs the teams. Does not read specs, records or diffs.
- **Distrust & friction.** Fears lock-in to one contractor's private conventions that
  cannot be audited from outside. Distrusts "trust me, it's clean" as a quality signal,
  because there is no way to check it. Worst case: discovering the docs lied at the exact
  moment - a handover, an audit - they needed to be true. Wary of paying for
  enterprise-grade process on a five-person company that cannot carry the overhead.
- **Jobs.** "When I fund a team, I want their repos held to a standard that people better
  than me have already vetted, so I do not have to verify work I cannot read." "When a key
  developer leaves or an auditor asks questions, I want the repo to explain itself, so the
  company's knowledge is an asset I own, not a memory that walked out."
- **Success signals.** Any repo answers "are you compliant, and to which version?" with a
  number; an external audit or handover starts from the repo itself; PRs cite the standard
  instead of debating taste.
- **Anti-goals.** Reading specs or records; choosing technologies; any dashboard that needs
  git to understand.

*Position note:* the role is **Owner** - deliberately not "project manager" (a PM runs
delivery from inside; the Owner sits above it and buys assurance) and not "sponsor" (too
corporate for someone who may simply own the whole company). A team's PM is the
`Product owner` role, not this one.

## `Coding agent`

- **Permissions.** Reads the whole repo; writes where the guards and elicitation points
  allow, and asks where they require an answer from a person. Has no memory between
  sessions - the repo is its context.
- **Distrust & friction.** Cannot act correctly on stale docs or dead scaffolding - it has
  no way to tell they are stale. Its single point of failure: a rule that lives only in
  someone's head or personal config, invisible to a fresh session (ADR-012 exists against
  exactly this).
- **Jobs.** "When I enter a repo, I want one entry point and honest indexes, so I load the
  right context without crawling." "When the user talks features, I want rules that tell me
  to start the loop unprompted, so process does not depend on the user knowing skill names."
- **Success signals.** An agent fresh in the repo executes the loop correctly with no human
  prompting beyond the feature description.
- **Anti-goals.** Being trusted to "remember" anything not written down.
