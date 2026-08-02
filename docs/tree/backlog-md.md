The single ordered list of work the repo knows it still owes itself. Features, yes, but
also the documentation, spec and decision debt that brownfield onboarding surfaced and
nobody would otherwise write down.

Markdown, in the repo, agent-first. An agent can read it, append to it and re-order it
without an API token, and it survives whatever tracker you are using this year.

## What it is for

**So that noticing something and not fixing it is a recorded act.** That is the whole
value. Mid-work you find a missing retry, a spec that lies, a dependency nobody chose. You
are not fixing it in this pull request, and the alternatives are: remember it (you will
not), fix it now (the pull request doubles), or say it out loud and move on.

## What goes in here

One row per intent, each carrying who it is for and what done looks like:

```markdown
| Id | Intent | For whom | Done when | Source |
|---|---|---|---|---|
| INV-4 | Export retries on timeout | Ops lead Ola | a timed-out export resumes without a manual replay | noticed in #212 |
```

An intent names its persona, because work that serves nobody is how a backlog becomes a
graveyard. And it names **what done looks like**, because an item without that never leaves
- there is no moment at which anyone can say it is finished.

At the `scale` profile the file also carries an **In flight** section: which intents left
the pool and into which cycle. An intent is in the pool **or** in exactly one cycle, never
both, and `cycle-guard` fails the build when that stops being true. That table is why the
pool stays the single place to start reading.

## What does not go in here

**A second copy of your tracker.** If you run Jira, this is not a mirror of it. This is the
work the *repository* knows about, in the repository, and the two can point at each other.

**Ideas.** "Should this exist at all" is `docs/ideas/`. A backlog intent is something
already agreed to be worth doing.

**Anything without a done condition.** "Improve performance" is a feeling. "The export
finishes under 30s for a 10k-row account" is an intent.

**A custom backlog engine.** The format is compatible with the Backlog.md tool if you want
a board or a CLI on top. Building your own is a project that competes with the product.

## How you actually use it

The most common case, and the one that decides whether the backlog is real or theatre:

```
> the booking export has no retry and dies on a timeout
  - park it, we are not fixing it here
```

You keep going. The agent files it with its source, the role that has to act, and what done
means.

## Decisions behind it

- **The backlog lives in the repo.** A tracker was the alternative and it fails one
  specific way: the debt that brownfield onboarding surfaces is about *the code*, and it
  needs to be readable by the agent working in the code, at the moment it is working there.
- **Every intent names a persona and a done condition.** Both were optional once. Optional
  meant absent, and absent meant a list that only grows.
- **[ADR-028](../decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md) -
  the pool and the cycles are one system.** Letting an intent sit in both was the state
  before the guard existed, and it makes "what are we doing" unanswerable from the file.
