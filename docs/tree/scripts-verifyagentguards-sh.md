Drives every hook with real commands and checks that each one refuses what it should and
allows what it should.

```
bash scripts/verifyAgentGuards.sh
```

Run it after any change under `.claude/hooks/`. CI runs it too, on every push and pull
request - it used to exist and be called by nothing, which is a self-test in name only.

## Why this exists at all

**A guard prints only when it refuses.** So a broken guard is silent: it stops protecting
and nothing says so. There is no failing test, no error, no warning - just a repository that
now allows something it used to block, indistinguishable from one where the guard is
working and nothing dangerous has been attempted.

This is not hypothetical. An earlier version of these guards, pasted into a settings file as
one long line, carried three separate bypasses that nobody had noticed, because nobody reads
a nine-hundred-character line.

## What it covers

Real command strings, not synthetic ones: chained commands, quoted variants, local calls
glued in front of remote destructive ones, and host names crafted to look like loopback.
Both directions are asserted - a guard that refuses everything passes no test here.

It also covers the ways a command gets written when nobody is trying to be clever - a pipe,
a backslash line-wrap, a heredoc, an absolute path, `-hHOST`, `PGHOST` in the environment -
because that is the gap a hand-written case list has by construction. Every one of those
shapes was a live bypass while this file reported that all guards behave as specified.

## Decisions behind it

- **Guards are scripts, not one-liners in JSON.** The empirical reason is above.
- **Both directions are checked.** A guard tested only for what it blocks can be "fixed" by
  making it block everything, which is how guards get disabled.
- **A denial has to be well-formed deny JSON.** Any non-empty stdout used to count as one,
  so a guard emitting JSON that Claude Code ignores - and therefore lets the command run -
  scored as a pass.
- **A nonzero exit or unexpected stderr is a failure of its own, not a verdict.** A guard
  with a syntax error produces stderr and empty stdout, which read as `allow` against every
  allow assertion in the file. Silence is what this suite exists to detect; it cannot also
  be one of its answers.
- **The scoring is checked against guards that are deliberately wrong.** This file went
  green while the guard it checks had a live bypass, so "the harness is stricter now" is a
  claim that needed a test of its own.
