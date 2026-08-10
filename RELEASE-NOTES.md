# What's new

Curated, plain-language highlights per release - for a stakeholder who wants to know
what changed, not the complete developer record (that's `CHANGELOG.md`).

## 1.1.1 - 2026-08-10

**The dashboard is now something you can actually read, not just skim.** Specifications get
their own tab with the full document, its state and success metric, and a link to the source;
discovery dossiers show their contradictions and open threads. Previously every document was
flattened to a one-line summary with a single link out - now the dashboard is a real substitute
for opening the repository.

**Two more outside adoptions ran, and both changed the standard.** A Next.js monorepo run
found that the corpus was scoring descriptions of what an agent did as if they were its own
words - fixed, and the corpus now says which is which per turn. A second, anonymised run
found something sharper: an adopter can write ten manifest exceptions, stop at 83% adopted,
and never learn that removing the conflicting toolchain instead would have reached 100% -
an exception silences a finding but never asks whether the thing being excepted should just
be deleted.

**A green drift-0 run could previously skip the two reports a human actually reads.**
Self-verify already caught a skipped intake round; the same hole existed for the mid-run
health check and the final adoption count, so an adoption could finish clean without ever
producing the numbers its owner needed to decide anything. Both are required now, checked
for shape and arithmetic, not just presence.

**Adoption records now carry one name.** `record-run` assembled real sessions into the
corpus without saying what to call the commit or the pull request, so every contribution
invented its own - now there is one prescribed shape, and it states the outcome and the
consent level rather than only ever reporting success.

**Under the hood**: five entries since 1.1.0, all from real usage rather than planned work.
Full developer changelog in `CHANGELOG.md`.

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
