The agent's permission baseline: which commands run without asking, which are refused
outright, and which hooks fire before a tool executes.

## What it is for

An agent that asks about everything gets waved through by reflex, and an agent that asks
about nothing eventually does the thing you would have stopped. This file is where that line
is drawn deliberately instead of by whoever is clicking.

## What goes in here

Three lists and the hook wiring. **Allow** for the ordinary, **ask** for things worth a
pause, **deny** for what must never happen regardless of who is asking - and the
`PreToolUse` hooks that catch the cases a pattern cannot express.

## What does not go in here

**A rule the guards should enforce.** A permission pattern matches a command string; it does
not understand intent, working directory, or which host is being written to. Anything that
needs judgment of that kind belongs in a hook, which can read the whole command and split it
on `;`, `&&`, `||` and `|`.

**Secrets or paths outside the repository.** This file is committed.

## The two failure modes worth knowing

**Blanket `ask` on something routine** trains the reflex that defeats every later prompt. If
a command is safe inside this repository, allow it and put the real protection in `deny`.

**One Bash call, one command.** The matcher evaluates the whole string at once, so two
individually-allowed commands joined by `&&` still prompt. That is the most common cause of
unnecessary prompts, and the fix is separate calls rather than a broader pattern.

## Decisions behind it

- **`merge`, not `copy`.** Your repository has its own tools and its own risks; the standard
  contributes a baseline rather than replacing what you decided.
- **Deny beats narrow allow.** Trying to enumerate every safe path is unbounded; naming the
  handful of things that must never happen anywhere is not.
