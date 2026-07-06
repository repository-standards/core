<!-- Single source of truth for conventions. Merge this block into the repo's
     AGENTS.md. Do NOT restate it in CLAUDE.md or .cursor/rules - point to it from
     there. Restating a rule in two files is drift waiting to happen. -->

## Conventions

### Commits and PRs

- Conventional Commits: `type(scope): TICKET-123 imperative summary`. The ticket
  key goes after the colon, never `(TICKET-123)` at the end.
- No AI/tool attribution in commits or PR text - no `Co-Authored-By: Claude ...`,
  `Generated with ...`, `Made-with: Cursor`, emoji trailers. They read as if a
  person wrote them.
- One commit = one logical change. Small, focused PRs.

### Writing

- ASCII hyphen `-` only, everywhere (prose, docs, UI copy, commits, PRs). Never
  the em dash `—` or en dash `–`.
