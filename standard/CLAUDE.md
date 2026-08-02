# CLAUDE.md

Read [`AGENTS.md`](./AGENTS.md) first - it is the single entry point and source of
truth for conventions, structure, and the spec-first workflow.

This repo follows repository-standards. `.standards-version` records the state it last
aligned to - a bookmark the next update measures from, never a version it is held at; the
target is always the latest.

## Before you start working: check whether a skill owns this

This repo ships the lifecycle procedures as skills in [`.claude/skills/`](./.claude/skills/).
They are not optional tooling and they are not only for when someone types their name.
**Before acting on a request, check whether one of them covers it, and use it if so** -
describing a feature, changing behaviour, breaking work down, building it, closing it,
capturing something out of scope, reviewing a branch, ingesting meeting notes, moving to a
newer standard version. Each skill's description says which situation it is for.

The reason is not ceremony. Working around them produces the same code with none of the
record - no spec anyone can rebuild from, no decision written where the next person looks,
no backlog entry for the thing you noticed and skipped. The coupling guard will stop the
pull request anyway when a capability's code moves without its spec, so the choice is
between doing it as you go or doing it under review pressure at the end.

**After finishing a piece of work, check again** - the closing steps are the ones most
easily skipped: reconcile the spec against what you actually built, file what you noticed
and did not do, review your own diff before pushing.
