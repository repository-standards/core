Shell guards that run **before** a tool does, so the action that must not happen never
starts. A write against a remote database. A force-push onto a branch someone else has
pulled. A secret about to be committed.

These are not linters. A linter tells you afterwards; a hook refuses.

## What it is for

The class of mistake where "be careful" is not a control. An agent moving fast, a tired
human at midnight, and a command that is irreversible: the cost of the refusal is ten
seconds, the cost of the mistake is a restore from backup.

## Two properties, and the second is the one that gets forgotten

**They fail closed.** A hook that cannot load its library, or whose dependency is missing,
**denies**. It never waves the command through unchecked. A guard that fails open is worse
than no guard, because it is trusted.

**They are tested.** A guard prints only when it refuses, so a broken one is **silent**: it
stops protecting and nothing says so. That is why `scripts/verifyAgentGuards.sh` exists,
and why it runs after any change in here. This is not theoretical - an earlier version of
these guards, pasted as one long line into a settings file, carried three bypasses that
nobody spotted, because nobody reads a nine-hundred-character line.

## What goes in here

A check that is cheap, deterministic, and safer to enforce than to remember.

Each guard splits the command on `;`, `&&`, `||`, `|` and newlines, and asks **per segment**
whether that segment reaches something dangerous. Otherwise a harmless local call glued in
front of a destructive remote one vouches for the whole string.

What the segment must not decide is whether the command is destructive. The remote-database
guard once required the host and the write verb in the *same* segment, and a pipe, a
backslash line-wrap and a heredoc each put them in different ones - so `psql -h prod \` on
one line and `-c "DROP TABLE users"` on the next ran unchecked. Nothing about a wrapped line
is adversarial, which is what made it the worst kind of hole. **Where** a command reaches is
per segment; **what** it does is read across the whole string.

## What does not go in here

**Anything slow.** A guard runs before every matching command.

**Anything that needs the network to decide.** It will fail at the worst time, and see
"fail closed" above.

**Anything prone to a false refusal.** A guard that blocks legitimate work gets disabled,
and a disabled guard protects nothing. This is the real failure mode, not the missed catch.

## The one that surprises people

A guard reads the **text of the command**, so it will also refuse a command that merely
*contains* a destructive example - documentation with a sample `psql` line against a remote
host, for instance. That is a false alarm on the safe side. Write the file with a file tool
rather than a heredoc and it passes.

## Decisions behind it

- **Guards are scripts in `hooks/`, not one-liners in a settings file.** The empirical
  reason is above: the inline version hid three bypasses precisely because its format made
  it unreadable.
- **Fail closed, always.** Failing open on a missing dependency is the friendlier default
  and it converts a guard into a decoration exactly when the environment is broken, which
  is when mistakes cluster.
- **One dispatcher, `guards.sh`, and it finds its siblings by its own path.** The guards
  were meticulous about failing closed on a missing `jq` or an unreadable `lib.sh`, and then
  the outermost link failed open: `settings.json` named each guard through
  `$CLAUDE_PROJECT_DIR`, and with that variable unset the shell exits 127 with empty stdout,
  which Claude Code treats as a non-blocking error and runs the command anyway. The
  dispatcher also turns a guard that is missing, unreadable, or exiting nonzero because it
  is syntactically broken into a denial - the one failure mode a self-test cannot catch on a
  machine where the file was never installed. Its own absence is covered by the `||` in
  `settings.json`.
- **Unknown SQL is refused, not guessed at.** `psql -h prod -c "$(cat migration.sql)"`
  carries any statement at all and no text scan can see it. A guard that cannot read the
  command has not checked it, so it denies - the same rule as a missing `jq`.
- **Host matching is case-sensitive, deliberately.** `psql` uses lowercase `-h`; uppercase
  `-H` is `curl`'s header flag. Matching case-insensitively made every command combining
  the two look like a remote write and blocked local work.
