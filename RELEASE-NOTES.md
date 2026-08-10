# What's new

Curated, plain-language highlights per release - for a stakeholder who wants to know
what changed, not the complete developer record (that's `CHANGELOG.md`).

## 1.1.0 - 2026-08-10

**Tested at real scale, not just real codebases.** 1.0.13 proved the standard works on
live projects; this release ran it against a 13,591-file codebase with nineteen years of
history, and against a monorepo of thirteen independently-published packages, each with
its own changelog, changing on one branch. Both shapes are supported now, not worked
around.

**The standard can finally show its own adoption, not just claim one.** Every
`align-to-standards` run can now send one anonymous, disclosed signal when it finishes -
stack, standard version, how clean the result was, nothing that identifies which repo
sent it - and the landing page shows the running count. Nothing is asked, only stated,
and one environment variable turns it off for anyone who wants zero participation.

**Under the hood**: 125 entries across the week since 1.0.13, including a fix so a new
adopter's very first pull request no longer fails its own secret scan on a file the
standard shipped. Full developer changelog in `CHANGELOG.md`.

## 1.0.13 - 2026-08-03

**The standard now recognizes a repo that isn't going anywhere, before wasting your
time on it.** Point it at an old, abandoned, or deliberately-frozen project and it
reads the repo's own README first - if the project says it's deprecated, archived, or
not accepting changes, the standard says so back to you instead of running through a
full interview about team size and release cadence for a repo nobody is coming back
to. And if a repo's own rules say no AI agents may contribute, the standard stops and
tells you that plainly, rather than opening a pull request the repo forbids.

**Better fit for real, complicated codebases.** A repo that's really a workspace of
many independently-published packages, or one that runs more than one technology at
once (say, a small command-line tool written in a different language alongside the
main app), used to get treated like a single, simple application. The standard now
recognizes both shapes and offers what actually fits instead of a one-size template.

**Under the hood**: ten concrete fixes found by testing the standard against real
public repositories and by walking a feature through its full lifecycle - built,
changed by new information, reopened by real data, extended - end to end. Full
developer changelog in `CHANGELOG.md`.
