# Contributing

The canonical guide for how to work in this repo - layout, commands,
architecture, and conventions - is [`AGENTS.md`](./AGENTS.md). Read it first. It
applies to humans and coding agents alike.

## Quick rules

- **Branch:** short-lived, off an up-to-date `main`. **Base every PR on `main`, not
  on another feature branch.** A PR whose base is a feature branch strands its commits
  when the base is rebase-merged (only the base's own commits reach `main`) - if you must
  stack, merge the parent PR first (which retargets the child to `main`) before the child.
- **Commits:** Conventional Commits, ticket key after the colon
  (`type(scope): TICKET-123 summary`). No AI/tool attribution trailers. ASCII
  hyphen only (no em/en dash). See the Conventions section in `AGENTS.md`.
- **Before a PR:** run the repo's local checks and self-review your diff (the
  `pre-pr-review` skill). Fill in the PR template, including ADR impact.
- **Changelog:** do not edit `CHANGELOG.md` or `VERSION` in a PR - add a
  [`changes/`](./changes/) fragment instead (see the
  [changelog process](./docs/changelog-process.md)). The maintainer assembles
  fragments and cuts every release.
- **Source, not `dist/`:** edit the concern folders (the source), never `dist/`
  files that are copies. Run `node tools/reflect.mjs --write` to sync the copy
  class into `dist/`, and `node tools/reflect.mjs` (check) must be green before a
  PR - it fails on drift, orphaned `dist/` files, or a source-only file leaking
  into `dist/`. Intentional `dist/`-only divergences are declared in that map.
- **Accepted ADRs are binding.** If your change contradicts one, propose a
  superseding ADR in the same change - do not silently diverge.
- **Database:** reads OK, writes to any remote (dev/prod) never - hand a `.sql`
  file to a developer instead. Enforced by `.claude/settings.json` guards.
- **Secrets never live in the repo.** Secret manager + env vars only; gitleaks
  gates on this.
