# AGENTS.md - <repo> agent and contributor guide

Primary entry point for coding agents (Cursor natively, Claude Code via a thin
`CLAUDE.md` router, Codex and others directly) and humans. Read this first. It is
the single source of truth for conventions - other files point here, they do not
restate.

## Documentation hierarchy (altitude - highest wins)

```
PRINCIPLES.md -> ADR / BDR (accepted decisions)
  -> specs/<capability> (behavior) + ARCHITECTURE.md (structure)
    -> conventions (incl. agent rules and skills)
      -> code
```

Behavioral source of truth = the [capability specs](specs/) (what the
system does now). Decisions = [ADR / BDR](docs/decision-records/) (why).
Structure = ARCHITECTURE.md. There is no TDR stream.

## Project

One-liner. What/why: [PRODUCT.md](docs/PRODUCT.md). How: [ARCHITECTURE.md](docs/ARCHITECTURE.md).

This repo follows repository-standards. `.standards-version` records the state it
last aligned to - a bookmark, never a version it stays at; the target is always
the latest. If a `stack.manifest.json` is present (or one
`stack.<technology>.manifest.json` per stack, where more than one coexists), it
also carries a technology layer (Layer 2): `self-verify` counts one drift number
across every layer, and the rationale behind every stack entry lives in that
stack repo's DECISIONS.

The rules it is measured against are the numbered rules in [`SPEC.md`](SPEC.md) -
where this file cites R11 or R24, that is what it means.
[`standard.manifest.json`](standard.manifest.json) is their machine-readable
projection and [`self-verify.md` (by reference)](https://github.com/repository-standards/core/blob/main/docs/method/self-verify.md) is how they are checked.

## First 30 minutes (a freshly adopted repo)

Until these are done the repo is not aligned - and the shipped workflows are **live the
moment they land**, not dormant templates: `spec-guard.yml` runs on every pull request,
`gitleaks.yml` on every push to the mainline, `standards-update-watch.yml` on a weekly
cron. So the first pull request after adoption goes red until this list is finished. That
is the intended pressure, but it should not arrive as a surprise on someone's unrelated
change - do the list first, or delete the workflow files until you are ready for them:

1. Write `.standards-version` with the version this tree came from.
2. Fill this file: the repo map, Commands, the working language, and the hard bans
   at the bottom. They ship as empty slots on purpose - nobody else can fill them.
3. Fill [`docs/personas.md`](docs/personas.md). The persona gate has nothing to hold
   without it, and every capability spec must name someone from that roster.
4. Author `specs/capability-map.json` from
   [`specs/capability-map.example.json`](specs/capability-map.example.json). Absent, the
   coupling guard exits zero and quietly checks nothing.
5. Decide the profile - `core` for a solo repo, `scale` for a team - and write it as the
   manifest copy's top-level `profile`.
6. Run `node scripts/self-verify.mjs` until it reports drift 0.
7. Keep the workflows under `.github/` - by this point they pass instead of blocking.

An agent aligning a repo from a checkout of the standards repo runs its transition
skill instead, which does all of the above; that skill never ships here, so a repo
that already has this tree follows the list.

## Repo map

| Path | Purpose |
|------|---------|
| ... | ... |
| `docs/backlog.md` | Ordered, agent-first backlog - the work the repo still owes itself (features + spec/decision/doc debt). |

## Commands

Common commands (install, dev, build, test, checks).

Before any of it, the toolchain the shipped guards need must be present -
[`prerequisites.md` (by reference)](https://github.com/repository-standards/core/blob/main/docs/method/prerequisites.md). Node and `jq` are not optional: without
`jq` the `PreToolUse` guards deny every Bash command rather than pass it unchecked.

## Conventions

<!-- Merged from docs/conventions.md. Keep it here, do not duplicate into CLAUDE.md
     or .cursor/rules. -->

- Conventional Commits, ticket after the colon; no AI/tool attribution; ASCII
  hyphen only; small focused PRs.
- **Branch and history (R23):** branch off `main` and base every PR on `main`;
  update by rebase, never merge `main` into your branch; land by rebase-merge
  with commits that each stand alone. Never rewrite a branch someone else builds
  on.
- **Database schema (R24):** the executable DDL under `database/schema/` rebuilds
  this database from a checkout; the typed definition (Zod, Pydantic, ...) is what
  every read and write path goes through. They are 1:1, each names the other in a
  `pair: <path>` comment, and `scripts/schema-pair.mjs` checks it. Never apply a
  schema change to a remote database - prepare the reviewed `.sql`.
- **Comments:** explain *why*, never *what*. Match the comment density of the file you
  are editing. If a comment restates the line below it, delete it. Context that only
  matters across a work session belongs in the plan or the spec, not in the source.
- **Working language:** <declare per artifact - default English>. E.g. code and
  commits in English, docs and specs in <team language>, user-facing copy in the
  persona's language. Honor this everywhere; it is a config, not a constraint.
  <!-- Deliberately not in backticks: the fill check strips code spans, because generic
       notation lives there. A marker someone must replace belongs in prose. -->

- **The convention that keeps the fill check honest:** angle brackets in **prose** mean
  *replace me*; angle brackets inside `code formatting` are notation and stay. Writing a
  real placeholder inside backticks hides it from `self-verify`.

## Red flags - STOP and ask the human

A numbered, repo-specific list of things that must halt an agent. Make each concrete:

1. Writing to a remote database (DML/DDL/migrations) - deliver a `.sql` instead.
2. Contradicting an Accepted ADR **or BDR** - propose a superseding record first. Both
   streams bind; the product-side one is the one a feature request actually collides with.
3. Adding a new dependency without an ADR.
4. A breaking schema / contract change.
5. Hardcoded secrets.
6. Shipping without the decision record the change implies.
7. Force-pushing a branch someone else has pulled or based work on.
8. <repo-specific>...

## Workflows

- **Add a feature / migration / decision record** - the spec-driven flow. Raw
  discovery (meeting extracts, mails) lands via `discovery-digest` in
  `docs/discovery/<topic>/` and feeds the loop - never re-asking what a spec
  already settled (ADR-024). New or
  changed behavior enters through `/spec-specify` + `/spec-clarify` (one capability);
  `/spec-impact` finds the ripple; `/spec-update` edits every affected spec;
  `/spec-plan` -> `/spec-tasks` -> `/spec-implement` build it; `/spec-reconcile`
  closes spec == code == tests and checks the specs still agree with each other.
  Work items come from and return to [`docs/backlog.md`](docs/backlog.md). Roles and
  hand-offs (PO -> dev -> AI): the standard's
  [ways of working](https://github.com/repository-standards/core/blob/main/docs/method/ways-of-working.md),
  adopted by reference from the living standard - always latest. Not sure where
  something goes at all - a decision, a rule, raw material, a work item?
  [`taxonomy.md` (by reference)](https://github.com/repository-standards/core/blob/main/docs/method/taxonomy.md)
  is the routing map; the decision catalog itself is
  [`checklist.md` (by reference)](https://github.com/repository-standards/core/blob/main/docs/method/checklist.md).
- **Bring this repo up to the standard (brownfield)** - alignment + onboarding: derive
  capabilities from the code, seed specs + the decisions the code implies, and put the
  rest in the backlog (run from a checkout of repository-standards:
  `skills/align-to-standards`). Incremental, never a big-bang dump.
- **Stay current with the standard** - this repo is pinned to a version in
  `.standards-version`. `update-to-version` applies the delta to a newer version (not a
  re-scaffold), then `self-verify` proves it complies: `node scripts/self-verify.mjs`
  (see [`self-verify.md` (by reference)](https://github.com/repository-standards/core/blob/main/docs/method/self-verify.md)). The self-verify gate runs in CI.

## The loop runs itself (unprompted)

Do not wait to be asked. The standard's loop is **AI-led** (ADR-010; the clarify gate).

**The first rule of working here: check whether a skill owns the request before you act on
it, and check again when the work is done.** The skills in [`.claude/skills/`](.claude/skills/)
are how this repo does things, not a menu of shortcuts for people who remember the names.
Each one's description says which situation it is for. Three layers make this hold, and only
the last is certain - so do not rely on it:

1. **A skill fires on its own** when what you were asked matches its description. This is
   the normal path and it needs nothing from the user.
2. **This file and `CLAUDE.md` tell you to look.** That covers what the descriptions miss.
3. **The guards catch the outcome regardless.** The coupling guard blocks a pull request
   where a capability's code moved without its spec, whether or not any skill ran. Reaching
   that point means doing the work twice, under review pressure, at the worst moment.

A user should never have to say "remember to use the skills". If that becomes necessary,
the skill's description is wrong and fixing it is the bug - not instructing the user to
carry a password.

**Writing that description is the mechanism, not paperwork about it.** It is the only text a
request is matched against, so it names the *situation a user would actually type*, never the
artifact the skill produces. Two skills whose descriptions could both plausibly match one
sentence will each lose that sentence half the time: sharpen both, or merge them.

- **The user describes a feature, story, or behavior change** -> start the loop yourself:
  ask the clarify questions, record answers in the spec's `## Clarifications`. A deferral
  ("leaving this to the technical side") is an answer - record it, route it to the
  technical pass, never drop it. Loop until zero open markers of the `[NEEDS ...` family - a missing decision, input or asset blocks planning exactly like an open question.
- **The user changes code** -> run `spec-impact` on your own; if the change touches a
  capability's behavior, update its spec in the same PR (the coupling guard will block
  otherwise).
- **The user drops meeting notes, a transcript, or a mail** -> run `discovery-digest`:
  extract the essence (with provenance) into the topic's dossier under
  `docs/discovery/`, flag contradictions, and say whether the topic is ripe for
  `/spec-specify`. If a spec already exists, route only entries newer than the
  dossier's `Last reconciled:` stamp through `/spec-clarify` - a dossier is never
  normative and nothing the spec settled gets re-asked (ADR-024).
- **Never take a spec to plan / tasks / the tracker** unless it passes the clarify gate
  (`Status: ready-to-develop`). If the user asks you to skip ahead, show what is open
  instead.
- **Ask once, up front**: will the user author the technical detail, or should you
  propose it? Either way you propose and guide - hand-holding is the product.
- **Work surfaces that is not this change** -> run `add-to-backlog` rather than doing it now
  or losing it: one row with its source, the role that must act, and what done looks like.
- **A decision gets made in conversation** -> run `adr-write` (technical) or `bdr-write`
  (product) *while it is still fresh*. Who would overrule it decides which: an architect
  means ADR, a product owner means BDR. A decision that stays in the thread is the failure
  mode this whole standard exists to stop - do not wait to be asked.
- **The repo cannot say who it is for, or what it is building** -> `personas-write` and
  `product-write`. A spec written against "the user" settles nothing, because "the user"
  wants everything.
- **A team is picking work up, or putting it down** *(scale)* -> `sprint-open` moves the
  chosen intents out of the pool and into a sprint with a goal and an agreed date;
  `sprint-close` checks each against its definition of done, returns what did not finish, and
  records the one measurement that cannot be recovered later. An intent lives in the pool or
  in exactly one sprint, and `sprint-guard` fails when that stops being true.
- **The branch is ready for a pull request** -> run `pre-pr-review` yourself, before pushing.
  Local checks, then read the diff as if someone else wrote it, then fix what it finds. A
  review that happens after the push is a review of something already published.
- **The user asks to move to a newer standard version** -> run `update-to-version`. It reads
  the delta between the pin and the target and applies only that; it is a dependency bump, not
  a re-scaffold, and it ends at drift 0 or it is not finished.
- **On request, explain simply**: any ADR/BDR/spec, in plain language with examples
  anchored to `docs/personas.md` - the PO must never have to gate what they cannot read.

None of these skills waits to be invoked by name. A user who has to know the slash command
has been handed a manual, which is the opposite of the point.

## Volunteer, don't wait to be asked

Matching a request against the skill descriptions is not enough when the request itself
is ambiguous. If a message mentions - in passing, not as the main ask - something that
sounds like a bug, a decision, or scope creep, and no skill description clearly claims it,
say so and name the candidate: "that sounds like a bug - want me to `add-to-backlog` it, or
are you fixing it now?" Do not silently do the extra work, and do not silently file nothing.
A wrong guess costs one line to correct; silence costs the record.

## Say where you are, every minute or two

Long work is silent by default: a run of tool calls, a subagent working in the background,
and nothing in the chat until it is finished. From the outside that is indistinguishable
from a hung session, and the only move left to the human is to interrupt the work that was
going fine.

So while work is running, post **one or two sentences every 60-120 seconds**: what you are
doing now, and what you are waiting on. Not a recap, not the plan again, not a menu of
options.

State it mechanically or it cannot be followed - there is no clock to read, and nothing
gets written in the middle of a tool call. The rule that can actually be obeyed is **do not
chain a long run of silent tool calls**: a line before each batch, not one per file opened.

- **Waiting is an update.** Say what you are waiting on and for how long. "Still running,
  about 8 minutes" is a complete answer.
- **Never invent progress, and never report a result that has not come back.** This outranks
  the rule itself: do not present a subagent's findings before the subagent has returned
  them, and do not guess what it will find. Silence is bad; fabricated progress is worse.
- **It does not replace the answer, and it is not a ceremony.** Work that takes thirty
  seconds has nothing to report - do not pad it.

## What you must not do

The hard bans for this repo.
