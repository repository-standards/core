The canonical conventions block: the day-to-day rules that are too small to be decisions and
too real to leave unwritten. Commit format, branch and history, the working language, how
comments earn their place, what a guard has to do.

It ships as a **separate file that gets merged into `AGENTS.md` at adoption**, and then
`AGENTS.md` is the living home. This file is the delivery mechanism, not a second copy.

## What it is for

The rules where reversing the decision costs a search-and-replace rather than a rewrite.
Those are not decision records. Recording them as ADRs buries the real decisions under
formatting preferences; leaving them unwritten means they are re-argued in every pull
request by whoever cares most that day.

## What goes in here

```markdown
- Conventional Commits, ticket after the colon; no AI/tool attribution;
  ASCII hyphen only; small focused PRs.
- **Branch and history (R23):** branch off main and base every PR on main;
  update by rebase, never merge main into your branch.
- **Comments:** explain why, never what. Match the density of the file you
  are editing. If a comment restates the line below it, delete it.
```

Two that are worth calling out because they are easy to read past.

**The working language is a configuration, not a constraint.** An agent reads whatever you
choose, so decide per artefact and write it down: code and commits in English, docs in the
team's language, user-facing copy in the persona's. What breaks a repo is not the choice, it
is leaving it unstated so that every file guesses.

**A fact has one home (R4).** A count, a version, a path, a command lives in one file and
everywhere else links to it. Where a restatement genuinely must exist, declare it in
`docs/facts.json` and a guard fails when the two stop agreeing. Undeclared restatements rot:
"twenty rules" outlived the twenty-first by weeks.

## What does not go in here

**Anything contestable.** If a future engineer could reasonably argue for the opposite and
the argument would matter, it is a decision record, not a convention.

**Anything the guards already enforce mechanically**, unless a person needs to know it
before the guard fires. A convention that only restates a check is one more thing to keep
true.

**Restatements in a third file.** Once this is merged into `AGENTS.md`, that is where it
lives. Do not copy it into `CLAUDE.md` or `.cursor/rules`; point at `AGENTS.md` from there.

## Decisions behind it

- **[ADR-012](../decision-records/ADR-012-in-repo-instructions-are-the-source-of-truth.md) -
  in-repo instructions are the source of truth.** Personal memory, global agent configs and
  chat may *point* at repo rules; they must never *hold* them. A rule that exists only
  outside the repo is treated as missing, and finding one is a defect fixed by landing the
  rule at its home. "It is in my memory" is not a location.
- **Conventions ship as a file and end up merged.** Shipping them only as a section of
  `AGENTS.md` was the alternative, and it makes updating the standard's conventions a
  three-way merge inside a file the adopter has heavily edited.
