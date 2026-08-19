# Brownfield phase

The `align-to-standards` phase for an **existing** repo without a pin. You are handed a
real repo in poor shape - little or stale documentation, no specs, decisions living only
in the code - and you bring it to the standard's **maintainable** state: behavior in
specs, decisions in records, drift caught by guards.

The intake (step 0 in `SKILL.md`) has already run: intent, technology + Layer 2
consent, appetite, and plan-only vs execute are known, and its repo scan seeds Gate 0's
description draft. Each step below names the gate it fills in the
[adoption checkmap](../../docs/method/adoption.md); brownfield walks the gates
**0 -> 2 -> 1 -> 3 -> 4 -> 5 -> 6** - the assessment first, the personas reconstructed
from its evidence.

Order: **assess first** (analysis only - the passes below), then the **stack offer**
(right after the assessment, never at the end), then the align steps in
`SKILL.md` (they put the skeleton - `AGENTS.md`, `docs/`, `specs/`, decision records,
guards - in place), then the derive steps below **fill** that skeleton from the code,
draining the backlog the assessment produced.

## Assess first (analysis, not change) -> Gate 2

Before touching anything, run the assessment: read the repo, detect what is there and
what is missing, and seed the backlog. Do **not** modify code during it. This is the
longest silent stretch in the whole skill, so it is where the router's progress rule
matters most - a line naming the pass you are on before each one, never eight passes of
silence (`SKILL.md`, "Say where you are during the run"). The full pass
detail lives in the standards checkout at
[`docs/method/repo-assessment.md`](../../docs/method/repo-assessment.md); the eight passes:

1. **Skeleton & docs** - `AGENTS.md`, `PRODUCT`, `ARCHITECTURE`, `specs/`, decision
   records, a backlog: present or missing? Also check for a **foreign spec-workflow
   installation** - `.specify/`, `openspec/`, or another tool's own `plan.md`/`tasks.md`
   scaffolding not produced by this standard's `spec-*` skills. Flag it; see "Replace a
   foreign spec tool" below.
2. **Decisions in code** - walk the
   [decision checklist](../../docs/method/checklist.md): which forks are decided /
   undecided / decided **inconsistently**?
3. **Capabilities & specs** - domains in the code; any specs; a `capability-map.json`?
4. **Quality gates** - tests (tiers? which paths?), typecheck strictness, lint/format.
5. **CI/CD** - pipeline present **and its PR gate demonstrably firing** (a workflow file
   is not a gate - the pass detail says what proves it), least-privilege permissions,
   pinned actions, reproducible build.
6. **Security & supply chain** - secret scanning, committed secrets, dependency audit,
   lockfile, release cooldown.
7. **Dependencies & stack** - detect the stack; outdated / risky / unmaintained deps;
   does it match a known stack layer?
8. **Drift & health** - code<->doc contradictions, dead code, `TODO`/debt density,
   churn hotspots.

Output: a short health report (maturity per pass: absent / partial / solid, top risks,
findings grouped by the **owner role** that must act - see `docs/method/repo-assessment.md`)
and a **seeded backlog** - every gap becomes an item with a definition of done, ordered
by risk x leverage.

**The report is a file, not a message** (R27, ADR-048): write it to
`docs/adoption-assessment.md` as this pass's closing action, the same way Step 0 writes its
intake record. A health report delivered only in conversation cannot be read by the next run,
by a human opening the repo cold, or by `adoption-gates` - and the run that skipped writing it
looks identical afterwards to the run that never assessed anything.

**Then stop and ask.** The report and the count are what make "plan-only or execute" a real
question, and Step 0 asked it before either existed. Put the two numbers in front of the user -
the drift and the `N tasks to full alignment` - and get the go/no-go **here**, before the first
wave changes a file. Assessment-only is already a legal stop, so this costs one turn and is
the difference between a person consenting to the work and a person being told about it
afterwards. **Red-flag stops** halt and ask the human now, not later: a secret
committed to the repo; anything that would write to a remote database (deliver a
migration instead); a change that would contradict an existing Accepted ADR.

**Assessment-only?** If the intake's intent was "tell me where I stand and give me the
plan", this is the legal stop: deliver the health report and the counted plan, then end
the run - no skeleton, no derive steps.

## Offer the stack layer (right after the assessment)

The assessment's pass 7 already detected the stack and the intake already gathered the
Layer 2 consent - so the offer runs **now, not at the end**. Run the router's
technology step (`SKILL.md`) against the stack's `stack.manifest.json`: registry ->
compatibility check -> classify -> payoff-ordered waves. Best practices land as picks
to adopt, **never a re-scaffold**, and the stack waves queue into the same backlog as
the Layer 1 work. This is Layer 2 running beside the gates, not a gate itself.

## Replace a foreign spec tool, do not bridge it

A repo can adopt this standard partially - but the spec workflow is not a good place to
do that. This standard's own spec engine (`spec-specify` -> `spec-clarify` -> `spec-plan`
-> `spec-tasks` -> `spec-implement`) is itself an extracted, standard-owned answer to the
same job Spec Kit, OpenSpec or BMAD do (`docs/faq.md`, "How is this different from Spec
Kit, OpenSpec, BMAD, or Backstage?"). Running one of those *and* this standard's spec
engine side by side is not a smaller adoption - it is two systems both trying to own
`specs/`, both producing `plan.md`/`tasks.md`, agreeing with each other by accident.

Where pass 1 flagged an existing installation: queue its removal in the seeded backlog
like any other gap, then replace it in the same wave the spec engine capability lands -
absorb any specs it already produced into `spec-specify`'s output rather than discarding
the content, then remove the foreign tool's own directories and skills. Never leave both
installed at once, and never wire this standard's guards to read the other tool's files
as a bridge - the FAQ answer only holds while there is one spec workflow in the repo.

## The one rule: no big-bang

You do **not** document the whole repo in one pass. You produce a **backlog** of the
documentation, decision and spec work, ordered by risk and leverage, and drain it in
small PRs. A single run of this phase delivers the capability map, the highest-risk
specs and decisions drafted, and the backlog for the rest - in **one reviewable PR**,
not a thousand-line dump nobody can review. Onboarding is *done* when the risky
capabilities are buildable-spec'd, the foundational decisions are recorded, and the
guards are green - not when every file has a paragraph.

## Steps

1. **Reconstruct the personas -> Gate 1.** Right after the assessment, before any spec is
   seeded.

   **The code gives you roles, not personas.** Auth roles, UI surfaces and API consumers
   tell you there is an `admin`, a `member` and something calling the public API. They
   cannot tell you who that person is, what they are trying to get done, what they are
   afraid of losing, or which of them wins when two of them want opposite things - and
   that last one is what every later spec argument turns on.

   So use the code for the **candidate list** and then **interview the user**, the same
   way the greenfield phase does - this phase is not exempt just because a codebase
   exists:
   - Play back what the code shows: "I can see three kinds of caller - the back-office
     login, a public booking surface, and an API key used by one integration. Is that the
     real shape, or is something missing because it never got built?"
   - Then ask what the code cannot answer, one persona at a time: who is this actually, in
     a sentence? What are they trying to get done? What goes wrong for them today? What
     must they never lose? What do they explicitly *not* need - so nobody gold-plates for
     them?
   - **Show one filled example so they know what a good answer looks like** - the worked
     example in `docs/personas.md` is there for this - and say plainly that it is from a
     different product. Almost nobody's roster maps onto someone else's, and offering the
     example as a menu produces a roster that reads well and describes nobody. The example
     is calibration: this much detail, this concrete, in the user's own words. If they
     start agreeing with the example rather than describing their own users, stop and
     re-ask - a borrowed persona passes the gate and then quietly decides specs for years.
   - Ask which one **wins ties**, and say why it matters: that is the persona a spec cites
     when two demands conflict, so it is a product decision, not a formality.
   - Roles the code shows but nobody uses, and users the business has but the code never
     modelled, both surface here. Both are findings worth reporting.

   **A roster of one is a legitimate answer, not a skipped step.** A single-purpose
   library, a CLI, or a component with one real consumer (the developer importing it) does
   not need a multi-persona interview manufactured for it - same principle as the decision
   catalog's "does not apply" (`docs/method/checklist.md`): write the one real persona
   (e.g. "solo consumer-developer, primary by default"), say in one line why there is only
   one, and move on. What is not acceptable is silently skipping the gate because the
   interview felt disproportionate - that is how ADR-006 gets quietly bypassed.

   Write `docs/personas.md` with the **primary** marked, and record the target-personas
   **BDR**. **No spec is written before this exists** (ADR-006): every spec seeded below
   names the persona(s) it serves.

   If the user cannot answer yet - the person who knows is on holiday, the business has
   never written it down - say so and continue: seed the roster with the roles the code
   proves, mark it explicitly as inferred and unconfirmed, and put the interview in the
   backlog. An unconfirmed roster is a known gap; a missing one stops every spec.

2. **Map the code into capabilities -> Gate 4 (opens here).** Read entry points,
   modules, routes, jobs, domain folders, tests. Group them into candidate
   **capabilities/domains** by *behavior*, not by folder or route (ADR-002: not per
   page, not per ticket). A concept that spans many screens (e.g. `packages`,
   `pricing`) is **one** capability. Write the result to `specs/capability-map.json`
   (capability -> code globs). This is `spec-impact` run in reverse: code first,
   capability out.

   **A library, CLI or framework's existing package/crate boundary is often already the
   capability map**, not a rival shape to reconcile against - a workspace that already
   publishes `parser`, `matcher` and `printer` as independent packages has, in effect,
   already done this step. Confirm the boundary is behavior-shaped (not a layering
   artifact like `utils` or `common`) rather than re-deriving one from scratch, and write
   `capability-map.json` from it.

   **A single-package micro-library has no package boundary to inherit from - look one
   level down.** A header-only or single-module library (one build target, no internal
   workspace) can still have real internal capability structure: separate concerns
   living in separate files or namespaces under the one package (a core data model, a
   query/patch API, several independent serialization formats). Map those, not the
   package as a whole - a `capability-map.json` with one entry covering the entire
   source tree gives the coupling guard nothing to bound and reads as theater on the
   next PR.

   **Play the list back before writing the file.** This map is what the coupling guard
   binds to on every future pull request, so a boundary drawn wrong is friction the repo
   lives with for years - and the person who inherited this codebase knows things the code
   does not show. Show the candidates and ask the three questions that actually correct a
   map: which two of these are really one thing, what is missing, and which name would your
   team not recognise? Write `specs/capability-map.json` after their answer, not before it.

3. **Rank by risk x opacity -> feeds Gates 4 and 5.** Order the capabilities: money,
   security, external contracts, and data integrity first; then most-churned (git
   history) and least-understood. This ordering **is** the backlog priority. You will
   not spec them all now.

4. **Surface the decisions the code already made -> retroactive records -> Gate 3.**
   The code embodies decisions: this datastore, this framework, this auth model, this
   money handling, no DI container. Enumerate only the **contestable, re-litigable**
   ones (the ADR test - a decision someone will argue about again), and draft them as
   **retroactive ADRs** (`Status: Accepted`, note "recorded retroactively").

   **If intake produced existing material, file it first and read it here.** Anything
   the user handed over - a Confluence page, an `rfcs/` folder, a decision buried in a
   ticket - goes into `docs/discovery/<topic>/` with its provenance before this step
   runs, and is then read as **a claim about the code, never as the record itself**.
   Three outcomes, and the third is the valuable one:
   - it **agrees** with the code -> the retroactive ADR is faster and better: it can
     carry the real context and the options that were actually weighed, which code
     alone never yields. Cite the source in the record.
   - it is **silent** -> reconstruct from the code as usual.
   - it **disagrees** with the code -> the code wins, because the code is what runs.
     Record what the code does, and note the divergence in the ADR's context with a
     pointer to the dossier entry. Then surface it to the user: a written decision the
     system stopped honouring is exactly the drift this standard exists to make
     visible, and it is often the most valuable thing the whole assessment finds. Do
     not quietly pick one and move on.

   **If the repo already runs its own live decision process, point at it - do not
   re-litigate it.** The outcomes above are for material that has stopped moving. A
   process that is still operating is a different thing: an RFC repo whose acceptance is
   wired into the merge gate, a design-docs directory with a required approval step, a
   working group that votes. That is not legacy material to file under
   `docs/discovery/` and it is not something to reconstruct from the code - the project
   argued it properly, in public, and the reasoning there is better than anything this
   pass would produce.

   So the repo keeps its process, and this standard takes a **pointer record**: an ADR/BDR
   in `docs/decision-records/` whose Decision paragraph states what was decided in the
   present tense, with the upstream document linked as the authority for the context and
   the options. Nothing is copied or paraphrased - a paraphrase drifts from the record it
   summarises, and then the repo has two answers. Say this out loud before writing any of
   them, because it is the difference between adoption and duplication:
   - **Which decisions get a pointer record at all?** The ones a spec or a rule in this
     repo will cite. A project with hundreds of accepted RFCs does not get hundreds of
     records; the load-bearing ones do, and the rest stay one link away.
   - **The existing process stays the way new decisions get made.** This pass adds a
     record stream, it does not replace a governance process that already works - proposing
     that is a conversation with the maintainers, not an alignment step.
   - **Where the existing records already live in-repo in a compatible shape**, record
     the mapping once (in `AGENTS.md`'s altitude ladder, and as a manifest `exception` with
     its reason if a required entry is met a different way) instead of moving the files.
     Every link the project has published points at the current paths.
   - **What the existing process never covered** is what the retroactive pass above is for.
     That set is usually where the real gaps are, and it is much smaller and much easier to
     argue about than a wholesale re-record.

   **Some decisions leave no fingerprint in the code, and the biggest one often does not.**
   The reconstruction above works by reading what the code already chose. A founding or
   identity decision - why this project exists at all, why it was forked, why it is licensed
   the way it is, what it deliberately refuses to become - is invisible to that method: the
   code looks the same either way, and the reasoning may live entirely outside the tree, on
   a website, in a foundation's announcement, or in the maintainers' heads. Two symptoms
   that you are looking at one: the decision predates the first commit, or the "options
   considered" are alternative *projects* rather than alternative implementations.
   - Write it as a record anyway. `docs/discovery/` cannot hold it - a dossier is never
     normative (ADR-024) - and a decision this size governing nothing in the repo is the
     largest possible instance of what R3 exists to stop.
   - The source is the difference: the record is written from **stated** rationale, not
     from evidence in the tree, so it cites where each part came from (the announcement,
     the licence file, the maintainer's own words in this conversation) and says plainly
     that it was reconstructed from outside the repo.
   - **Confirm it with a human before it is Accepted.** Everything else in this pass can be
     checked against the code by the next reader; this one cannot, which makes it the one
     record an agent must not quietly assert. Unconfirmed, it is drafted as `Proposed` with
     the open question named.

   A rule
   with one obviously-right answer is a convention, not an ADR. A baked-in *business*
   rule that is really a business decision is a **BDR**. Do **not** write one ADR per
   dependency.

5. **Seed specs from the code - extract verbatim, then synthesize -> Gate 4.** For each
   capability you spec this pass, work in two steps. First a **read-only extraction**:
   pull the real contracts - schemas, endpoints, error codes, rules - out of the code
   **verbatim, each with a `file:line` anchor**; the anchors make the spec auditable
   and re-verifiable against the code later. Then **synthesize** the capability spec
   from that extract. Write it **buildable** - do not drop to `behavioral` to save
   effort (writing the contracts is exactly what surfaces the bugs, and peripheral
   capabilities benefit most; ADR-003). Never invent behavior the code does not show; a
   spec<->code discrepancy or an unclear branch goes in the spec's **Open questions**
   (and becomes a tracked issue), not a guess. A capability you are **not** specing this
   pass is a backlog item - not a behavioral placeholder written to look done.

6. **Record the drift you find -> Gate 5 (items).** Where the code disagrees with any
   pre-existing README, comment or doc, capture it (this is `spec-reconcile`'s job,
   applied to legacy docs). Each contradiction is a backlog item, resolved by making
   the record match real behavior - or by a fix, if the behavior itself is the bug.

   Also **elicit the unwritten rules (ADR-012):** ask the team for tribal knowledge -
   gotchas, "always do X before Y", rules in personal configs or agent memories - and
   land each at its taxonomy home. A brownfield repo is not onboarded while its most
   important rules live outside it.

7. **Build the backlog -> Gate 5.** Everything from the assessment and steps 3-6 that
   you did not finish now becomes ordered work items in `docs/backlog.md` (see that
   file for the format). Group into epics ("Spec the domain", "Record foundational
   decisions", "Wire the guards"). Each item: what, why, which capability, the persona
   it serves, the **owner role** that must act (product / architect / dev / agent - the
   backlog format), and a definition of done. Close with the **count** ("N tasks to
   full alignment"). This backlog is the deliverable that makes onboarding
   *continuable* by anyone.

   **Hand the number over with its antidote, in the same breath.** A list of two dozen
   documents is the point at which a user quietly decides this was a mistake - not because
   the work is unreasonable, but because it arrives all at once and looks like homework.
   Say the four things that make it tractable, out loud:
   - **One at a time, in the order given.** The list is already sorted by risk x leverage;
     the top item is the only one that matters today.
   - **Every item says how it gets done, not just what is missing.** "Record the datastore
     decision" leaves someone in front of an empty file; "record the datastore decision -
     say what you remember and the agent drafts the record from that plus what the code
     already shows, then you correct it" is a task someone can start. Name the skill or the
     step that carries each item, in the row.
   - **You are not writing these alone, and not by hand.** Each item runs through the same
     loop as everything else: the agent drafts from the code and whatever landed in
     `docs/discovery/`, asks only what it genuinely cannot infer, you correct, and the
     guards check the result. Authoring from scratch is never the job; correcting a draft
     is. Nothing here expects the user to learn the templates.
   - **The material is often already there.** Whatever intake collected into
     `docs/discovery/`, plus the code itself, is the first draft of most of these - a
     retroactive decision record usually starts as something the repo already told us.
   - **There is no deadline and no penalty for stopping.** The repo is better after each
     item than before it; the count going down is the whole progress bar. Coming back in
     three weeks costs nothing, because align resumes from measurement, not memory - and
     coming back in six months to ask "where do we stand now?" is a supported request, not
     an admission of having fallen behind.

   If the list is long enough to look daunting, say so first and offer to walk just the
   top item now - a user who finishes one leaves believing the rest is possible.

8. **Wire the guards forward -> Gate 6.** Ensure the coupling map
   (`specs/capability-map.json`) and the guards (`spec-guard`, `spec-structure`,
   secret-scan) are active, so new drift is caught from now on. This is what keeps the
   repo maintainable *after* you leave, and what makes the backlog shrink instead of
   grow.

9. **Then drain the backlog incrementally.** Take items in priority order, each a small
   PR through the normal flow: `spec-impact` -> `spec-update` -> `spec-plan`/`spec-tasks`/`spec-implement` ->
   `spec-reconcile`. The backlog feeds itself: spec deltas and code<->spec
   drift found along the way append new items. Re-run the assessment periodically to
   measure that the backlog is shrinking, not growing.

## Output of one run

- The assessment's health report (findings grouped by owner role) and seeded backlog.
- `docs/personas.md` reconstructed and confirmed (primary marked) + the
  target-personas BDR.
- `specs/capability-map.json` seeded from the code.
- The top risk-ranked capabilities specced buildable (behavioral only with a recorded
  one-line justification).
- The genuinely re-litigable decisions drafted as retroactive ADR/BDR - as pointer records
  where a live decision process already owns them, and, where the repo has one, the founding
  decision written from stated rationale and marked for human confirmation.
- `docs/backlog.md` holding everything else, prioritized - in one PR.

## Not this

- **Not a big-bang** "document everything" dump - it is unreviewable and it stalls.
- **Not a fix-during-assessment** - the assessment only analyzes; the exception is a
  red-flag stop, which asks the human.
- **Not one ADR per dependency** - only decisions that pass the re-litigation test;
  the rest are conventions.
- **Not per-page / per-ticket specs** (ADR-002) - derive capabilities from behavior.
- **Not inventing capabilities from tickets or wishes** - derive them from the code
  that exists (a request is not a capability).
- **Not guessing behavior** to make a spec look complete - an unknown is a backlog
  item, not a fabricated `MUST`.


## Questions this phase must ask

Declared in `standard/.claude/elicitation/points.json`; the shape and the provenance states are in
`standard/.claude/elicitation/README.md`. Each block below is a real `AskUserQuestion` call, not a
reminder to consider asking - the rule existed as prose first and a full adoption ignored it.

### `[adopt.records]` Decision records

Fires **before writing anything into the decision-records directory** - which includes editing a record that was already there, not only creating one.

Ask this as two questions in one `AskUserQuestion` call, both under the header `[adopt.records]`. Where the repository has no records yet, ask only the second.

The first, when records already exist:

> This repository already has decision records. Take them as they stand, rewrite them into the standard's shape, or leave them and only add new ones alongside?

Options, in order: **rewrite them into the standard's shape** (recommended) / **take them as they stand** / **leave them, add new ones alongside** / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point)

Rewriting somebody's records is allowed and often right - a record in the wrong format is still a decision worth keeping, and reshaping it beats leaving it in a second parallel structure. It is doing it unasked that is the failure: thirty-three owner-authored records each gained a section nobody requested, and the run read as tidying.

The second, about records the standard expects and this repository does not have:

> The standard expects decision records this repository has not written. Write them now one at a time, leave stubs, or have them drafted for you to check later?

Options, in order: **write them now** / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point) / **leave a stub, do not guess** (`absent`)

A decision record's whole value is that a person decided it.

Records to `docs/adoption-provenance.md`: the `adopt.records` row takes the state, who answered, the date, and `docs/decision-records/` as where the answer landed.

### `[adopt.personas]` Who the product is for

Fires **before writing personas**.

Call `AskUserQuestion` with the header `[adopt.personas]` and the question:

> Who are the users of this product? Define them yourself, have them suggested from the code for you to correct, or skip personas for now?

Options, in order: **define them** / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point) / **leave a stub, do not guess** (`absent`)

Personas are a claim about people outside the repository, and nothing in the code can settle them. A suggested roster is never closed.

Records to `docs/adoption-provenance.md`: the `adopt.personas` row takes the state, who answered, the date, and `docs/personas.md` as where the answer landed.

### `[adopt.tracker]` Where tracked work lives

Fires **when the repository already tracks work somewhere other than `backlog.md`** - its own tracker directory, an issue tracker, a board.

Call `AskUserQuestion` with the header `[adopt.tracker]` and the question:

> The standard's `backlog.md` is the source of truth for tracked work, and this repository already tracks work elsewhere. Fold that into the backlog, keep both with the backlog as the source, or keep the external tracker and let the backlog bridge to it?

Options, in order: **fold it into the backlog** (recommended) / **keep both, backlog is the source** / **external tracker, backlog bridges** / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point)

Two live trackers is the failure this asks about, and it is the one the repository is most likely to walk into by inertia - both stay, both rot differently, and the question of which one is true gets answered per person. Folding leads because the product's own claim is that the work lives in the repository next to the code that does it.

Records to `docs/adoption-provenance.md`: the `adopt.tracker` row takes the state, who answered, the date, and `backlog.md` as where the answer landed.

### `[adopt.backlog]` Seeding the backlog

Fires **before writing backlog rows, and again before assigning an owner to any of them**.

Call `AskUserQuestion` with the header `[adopt.backlog]` and the question:

> Should the adoption seed a backlog, and if so how is the work attributed - each row naming the role it needs, assigned to you by name, or with nothing said about who does it?

Options, in order: **seed it, each row naming the role it needs** (recommended) / **seed it, assigned to me** / **seed it, no owner named** / **suggest it, I will check later** (`provisional`, plus a backlog row naming this point) / **leave a stub, do not guess** (`absent`)

The role leads because it is the part that is always true and always useful: a row that says *product decision* or *architect* tells whoever picks it up what kind of work it is, without claiming anyone agreed to do it. Assigning a named person is an act with consequences outside the repository - and in a repo with one or two people it is theatre, because the name is the same on every row. Saying nothing at all is the one to avoid: an unowned row is work nobody can even categorise, and the alignment gate asks for an owner precisely so that a backlog cannot fill up with orphans.

Records to `docs/adoption-provenance.md`: the `adopt.backlog` row takes the state, who answered, the date, and `backlog.md` as where the answer landed.
