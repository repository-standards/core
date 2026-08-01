<!-- Canonical conventions block. At adoption, merge it into the repo's AGENTS.md -
     that file is the single living home. Do NOT restate rules in CLAUDE.md or
     .cursor/rules - point at AGENTS.md from there. Restating a rule in two files
     is drift waiting to happen. -->

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

### Branch and history (R23)

`main` reads as a sequence of finished units of work - one per PR, each one
buildable, each one revertable. Four rules get you there:

- **Branch off `main`; base every PR on `main`** - never on another open PR's
  branch. A base that gets rewritten when it lands strands its children's commits.
  If work truly must build on unmerged work, land the parent first, or carry the
  whole sequence in one PR as ordered commits.
- **Update by rebase, never by back-merge.** `git rebase main` (or the platform's
  "update with rebase"); never `git merge main` into your branch. A back-merge
  drags unrelated work into your branch, so no commit in it is testable on its
  own, and it leaves `main` a braid nobody can read afterwards.
- **Keep rebasing until the branch reads well, then rebase-merge.** Every commit
  that lands is complete on its own: it builds, it is reviewed, it can be reverted
  alone. Squash the wip/fixup noise before review (`git rebase -i`), not after.
  This bar is the price of rebase-merge - a repo that will not hold it uses
  squash-merge and records that in its branching ADR. One honest commit beats five
  dishonest ones.
- **Rewrite only what is yours.** `--force-with-lease` on your own branch is
  routine. A branch someone else has pulled, or based work on, is frozen: fix it
  forward. This is the one hard stop in the list - rewriting shared history
  destroys other people's work.

Turn on the platform's linear-history protection so the rule is enforced, not
remembered, and set the merge button to the method this repo recorded. Why this
shape, what it costs, and when squash or a merge commit is the better pick:
[ADR-026](https://github.com/bodurkalukasz/repository-standards/blob/main/docs/decision-records/ADR-026-rebase-merge-onto-a-linear-main.md),
adopted by reference from the living standard - always latest.

### Database schema (R24)

If this repo owns a database, its schema lives here twice and the two copies are
one pair:

- **`database/schema/` holds executable DDL** - enough to rebuild the database
  from a checkout alone. That is the disaster-recovery copy and the thing a
  reviewer reads. Migrations are the delta, not the current state.
- **A typed, documented definition in this stack's idiom** (Zod, Pydantic, ...) is
  what every read and write path goes through. Do not restate row shapes inline.
- **They are 1:1, and it is checked.** Every table, column, constraint and enum in
  one is in the other, and a change to either lands in the same PR as the change to
  the other. Each file names its counterpart in a `pair: <path>` comment;
  `node scripts/schema-pair.mjs` resolves that edge both ways and fails when a name
  the DDL defines is missing from the twin (`self-verify` runs it). Either side may
  be generated where the generator does not quietly drop what DDL can express.
- **An agent never applies a schema change to a remote database.** Prepare the
  reviewed `.sql` file and hand it to a human (R19).

Why two copies rather than one generated source:
[ADR-027](https://github.com/bodurkalukasz/repository-standards/blob/main/docs/decision-records/ADR-027-the-database-schema-lives-in-the-repo-with-a-typed-twin.md),
adopted by reference from the living standard - always latest.

### Writing

- ASCII hyphen `-` only, everywhere (prose, docs, UI copy, commits, PRs). Never
  the em dash `—` or en dash `–`.

### Where rules live (ADR-012)

**In-repo instructions are the source of truth.** Every rule about working in this
repo lives in the repo, at its taxonomy home: conventions here / `AGENTS.md`,
contribution mechanics in `CONTRIBUTING`, behavior in specs, decisions in records
(the process itself is the standard's
[ways of working](https://github.com/bodurkalukasz/repository-standards/blob/main/docs/method/ways-of-working.md),
adopted by reference from the living standard - always latest). Personal memory, `~/.claude`-style global configs, and chat may
*point* at repo rules - they must never *hold* them. A rule that exists only outside
the repo is treated as **missing**; finding one is a defect, fixed by landing the rule
at its home. "It's in my memory" is not a location.
