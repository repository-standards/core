# What's new

Curated, plain-language highlights per release - for a stakeholder who wants to know
what changed, not the complete developer record (that's `CHANGELOG.md`).

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
