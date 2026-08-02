Drives every hook with real commands and checks that each one refuses what it should and
allows what it should.

```
bash scripts/verifyAgentGuards.sh
```

Run it after any change under `.claude/hooks/`.

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

## Decisions behind it

- **Guards are scripts, not one-liners in JSON.** The empirical reason is above.
- **Both directions are checked.** A guard tested only for what it blocks can be "fixed" by
  making it block everything, which is how guards get disabled.
