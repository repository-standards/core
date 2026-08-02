The first file your coding agent reads, and the single source of truth for how this repo
works. Cursor reads it natively, Claude Code reaches it through a thin `CLAUDE.md` router,
Codex and the rest read it directly.

Everything else points here. Nothing else restates it. That rule is the file's entire
value: the moment two files describe the same convention, one of them is wrong and nobody
knows which.

## What it is for

**So an agent arrives competent instead of curious.** Without it, every session begins with
the same archaeology - what are the commands, what is the branching model, what must never
be touched - and the answers are inferred from whatever files happened to be open.

It also carries the one instruction that makes the rest of the standard work: **before
acting on a request, check whether a skill owns it.** A user should never have to say
"remember to use the skills".

## What goes in here

Six things, and they ship as empty slots because nobody else can fill them:

- **The repo map** - what lives where, one line each
- **Commands** - install, dev, build, test, the checks
- **Conventions** - merged from `docs/conventions.md`, the canonical block
- **Red flags** - the numbered list of things that must stop an agent and fetch a human
- **The working language** - which artefacts are written in which language
- **Hard bans** - what must never happen in this repo

Red flags are where repos differ most, and vagueness there is expensive. Concrete:

```markdown
1. Writing to a remote database (DML/DDL/migrations) - deliver a .sql instead.
2. Contradicting an Accepted ADR - propose a superseding ADR first.
3. Adding a dependency without a decision record.
4. Force-pushing a branch someone else has pulled.
```

## What does not go in here

**A copy of anything.** If a rule lives in `docs/conventions.md`, this file carries the
merged canonical block and `CLAUDE.md` points here. Restating it in a third place is drift
with a delay.

**Product knowledge.** What the system does is the specs; why it is like that is the
decision records. This file says how work is *done*.

**Anything an agent cannot act on.** Aspiration reads as instruction and gets followed.

## The thing people get wrong

`CLAUDE.md` and `.cursor/rules` are **routers**, not homes. They point at this file. A rule
written directly into one of them applies to one agent, silently, and the next person using
a different tool gets a repo that behaves differently for no visible reason.

## How you actually use it

It is written during alignment, from your repo's own reality rather than from a template,
and then it is edited like any other living document:

```
> we never write raw SQL against staging - add it to the red flags
```

## Decisions behind it

- **One entry point, and the rest are routers.** This is R1, quoted below, rather than a
  decision record: it is a rule of the standard, not a choice each repo re-makes. The
  alternative is what most repos have - three per-tool instruction files, three subtly
  different sets of rules, and behaviour that depends on which tool you happened to open.
- **The empty slots ship empty.** Filling them with plausible defaults was tried and is
  worse than leaving them blank: a plausible default reads as decided, so nobody revisits
  it, and the repo ends up with commands that were never true.
