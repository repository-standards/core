<!-- Single source of truth for conventions. Merge this block into the repo's
     AGENTS.md. Do NOT restate it in CLAUDE.md or .cursor/rules - point to it from
> This file is canonical; `AGENTS.md` carries only a digest. Edit here first.
     there. Restating a rule in two files is drift waiting to happen. -->

## Conventions

### Working language

Language is a **configuration**, not a constraint - an AI reads whatever you choose, so
decide per artifact and state it in `AGENTS.md`. Default: **English** (widest collaboration,
best ecosystem fit), but any team may pick its own - a German team writing German docs and
English commits is a first-class setup, not a workaround.

| Artifact | Recommended | Note |
|---|---|---|
| Code identifiers (names, public APIs) | English | interop with libraries and tooling |
| Code comments | repo's choice | |
| Docs, specs, decision records | repo's choice | one language per artifact type |
| Commit messages, PR text | English | recommended |
| User-facing copy | the persona's language | driven by the audience, not the team |

Pick once, record it in `AGENTS.md`, and keep it consistent within an artifact type.

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

### Where rules live (ADR-012)

**In-repo instructions are the source of truth.** Every rule about working in this
repo lives in the repo, at its taxonomy home: conventions here / `AGENTS.md`, process
in `ways-of-working`, contribution mechanics in `CONTRIBUTING`, behavior in specs,
decisions in records. Personal memory, `~/.claude`-style global configs, and chat may
*point* at repo rules - they must never *hold* them. A rule that exists only outside
the repo is treated as **missing**; finding one is a defect, fixed by landing the rule
at its home. "It's in my memory" is not a location.
