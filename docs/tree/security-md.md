Where somebody who found a vulnerability in your project sends it, and what happens after
they do.

It ships with placeholders because only you can fill them, and it is the one shipped file
where leaving a placeholder in has a real-world cost: a researcher who cannot find a contact
either drops it or publishes it.

## What it is for

**So that a report reaches you privately, and the reporter knows it will.** Without a
contact and a stated response window, the well-intentioned path is unclear and the fastest
path is a public issue.

## What goes in here

Three things, and none of them can be inferred from your code:

**Where to send it.** A private channel. GitHub's private vulnerability reporting is the
cheapest option and needs one setting; an email address works too, as long as somebody reads
it.

**What to expect.** How long until acknowledgement, and roughly how long until a fix or a
decision not to fix. A number you can keep beats a promise you cannot.

**What is in scope.** Which repositories, which deployments, and what you consider out of
bounds - so a reporter does not spend a weekend on something you already know about and do
not consider a vulnerability.

## What does not go in here

**Your security posture.** How auth works, what the threat model is, which controls you
chose - that is a decision record, and R7 requires the security baseline to be one.

**Anything a reporter does not need.** This file is read by one kind of person in one
situation. Everything that is not "how do I tell you, and what then" is noise at a moment
when clarity matters.

**A promise you will not keep.** "We respond within 24 hours" from a one-person project is
worse than "within a week", because the first one gets you a public disclosure on day two.

## The related thing that is not in this file

Secrets never live in the repository. That is enforced rather than requested: `.gitleaks.toml`
configures the scan, `gitleaks.yml` runs it on every push to the mainline, and a
`PreToolUse` hook refuses to write a secret into CI configuration in the first place.

This file is for reports from outside. That machinery is for mistakes from inside, and they
are different problems.

## Decisions behind it

- **A menu, answered in your own record.** The standard does not choose your auth model or
  your key rotation. It requires that you chose deliberately - the security baseline lists
  the axes that must each have an answer, and your ADR is where the answers live.
- **The file ships with placeholders rather than a plausible default.** A default contact
  address is worse than an empty one: it looks filled, so nobody fills it, and the report
  goes nowhere.
