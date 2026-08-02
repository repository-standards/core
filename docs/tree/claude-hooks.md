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

Each guard splits the command on `;`, `&&`, `||` and `|` and evaluates the segments
**separately**. Otherwise a harmless local call glued in front of a destructive remote one
vouches for the whole string.

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
- **Host matching is case-sensitive, deliberately.** `psql` uses lowercase `-h`; uppercase
  `-H` is `curl`'s header flag. Matching case-insensitively made every command combining
  the two look like a remote write and blocked local work.
