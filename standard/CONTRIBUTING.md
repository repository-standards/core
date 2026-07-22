# Contributing

The canonical guide for how to work in this repo - layout, commands,
architecture, and conventions - is [`AGENTS.md`](./AGENTS.md). Read it first. It
applies to humans and coding agents alike.

## Where to look (this file does not restate the rules)

- **Conventions** - branches, Conventional Commits, no AI/tool attribution, ASCII
  hyphen: the Conventions section of `AGENTS.md`.
- **Before a PR** - run the repo's local checks and self-review with the
  `pre-pr-review` skill; fill in the PR template, including decision-record impact.
- **Hard stops** - remote-database writes, contradicting an Accepted ADR, secrets
  in the repo: the Red flags section of `AGENTS.md`, enforced by the
  `.claude/settings.json` guards.
