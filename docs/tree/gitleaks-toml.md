The secret-scan configuration. `gitleaks.yml` runs the scan on every push to the mainline;
this file says what counts as a finding and what is a known false positive.

## What it is for

Secrets reach repositories by accident, not by decision - a test fixture with a real token,
a config committed before it was templated, a paste into the wrong file. The scan is the
last cheap moment to catch it, because after a push the only honest response is rotation.

## What goes in here

Rules for what your stack's secrets actually look like, and **allowlist entries with a
reason**. An allowlist entry without a comment saying why it is safe is indistinguishable
from one somebody added to make the build go green.

## What does not go in here

**A secret, obviously** - including in an allowlist pattern specific enough to reveal one.

**A blanket path exclusion.** Excluding `test/` is the fastest way to make the scan pass and
the most common way a real key survives, because test fixtures are where they usually are.

## The thing the scan cannot do

It finds what is committed. It cannot find what your CI pastes into a log, and it cannot
un-leak anything - a secret that reached a remote is compromised regardless of what the
next commit removes. That is why the `PreToolUse` guard refusing to write secrets into CI
configuration exists separately: the scan is the net, the guard is the fence.

## Decisions behind it

- **R19 - the scan SHOULD gate CI.** Not MUST, because some repositories have a scanner
  already and two are noise. What is required is that something checks.
- **Allowlist entries carry a reason.** Without the rule, the allowlist becomes the place
  findings go to be silenced.
