Scans for committed secrets on every push to the mainline, using the rules in
`.gitleaks.toml`.

## What it is for

Secrets get committed by accident: a fixture with a real token, a config committed before it
was templated, a paste into the wrong file. This is the last cheap moment to catch it,
because once it reaches a remote the only honest response is rotation.

## What it cannot do

**Un-leak anything.** A secret that reached a remote is compromised whatever the next commit
removes. The scan tells you to rotate; it does not save you from rotating.

**See what CI prints.** A token pasted into a log is outside its reach.

That is why the `PreToolUse` hook refusing to write secrets into CI configuration exists
separately. The scan is the net; the hook is the fence, and the fence is the one that
prevents rather than reports.

## What does not go in here

**Path exclusions to make it pass.** Excluding `test/` is the fastest way to green and the
usual way a real key survives, because fixtures are where they normally are. If a finding is
a false positive, allowlist it in `.gitleaks.toml` with a reason.

## Decisions behind it

- **R19 - the shipped scan SHOULD gate CI.** Not MUST: a repository with a scanner already
  gains noise rather than safety from a second. What is required is that something checks.
- **On push to the mainline, not only on pull requests.** A secret can arrive by a direct
  push, and that is exactly the path where nobody is reviewing.
