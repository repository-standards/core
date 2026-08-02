A router, not a home. Claude Code loads this file first, and its job is to send the agent to
`AGENTS.md` and to state the one rule that has to arrive before anything else: check whether
a skill owns this request before acting on it.

If your agent is Cursor, Codex or something else, this file is not the one it loads - but
the pattern is. Whatever your tool reads first carries the same two sentences.

## What goes in here

Almost nothing, and that is the design:

- read `AGENTS.md` first, it is the source of truth
- check the skills before acting, and check them again when the work is done
- the note that `.standards-version` records a bookmark rather than a version you are held at

## What does not go in here

**Any rule.** Conventions, red flags, commands, the branching model - all of it lives in
`AGENTS.md`. A rule written here applies to Claude Code and to nothing else, so the repo
starts behaving differently depending on which tool somebody opened, with no visible cause.

This is the most common way a repo's instructions rot, and it does not look like rot while
it happens. It looks like being helpful to the tool you happen to use.

## Why the skills reminder is here and not only in AGENTS.md

Because it is the one instruction that must land before the agent forms a plan. Everything
else can be read when it becomes relevant; "is there a procedure for this" stops being
answerable once the agent has already started doing it its own way.

The reminder is deliberately repeated at the end, too: the closing steps are the ones most
easily skipped - reconciling the spec against what you built, filing what you noticed and
did not do, reviewing your own diff before pushing.

## Decisions behind it

- **Routers point, they never hold.** The alternative is a per-tool instruction file with
  real content in it, which is what most repositories have and why their rules quietly
  disagree.
- **The skills rule is stated twice, on purpose.** Repetition is normally a defect in this
  standard. Here it is load-bearing, because the two moments it addresses - before starting,
  after finishing - are far enough apart that one statement covers only the first.
