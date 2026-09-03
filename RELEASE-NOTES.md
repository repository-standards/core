# What's new

Curated, plain-language highlights per release - for a stakeholder who wants to know
what changed, not the complete developer record (that's `CHANGELOG.md`).

## 1.0.4 - 2026-09-03

**The evidence question asks one thing.** At intake the adoption asks whether an anonymised
excerpt of the session may go upstream as a pull request after you have read it. That
answer leads the list; none is recommended. Nothing else rides on that answer: the anonymous adoption count still goes out
on its own at the close, as it always has.

**Questions wear plain headers.** The bracketed point id that used to lead every question
(`[adopt.evidence]`) is carried where nobody sees it; the header now says Evidence, Intent,
Layout. Older transcripts and adopted repositories still verify.

## 1.0.3 - 2026-09-03

**A file the adoption guessed says so on its first line.** When an adoption suggests a
persona roster or a decision record for you to check later, or leaves a stub, the file will
open with `[NEEDS REVIEW]` or `[STUB]`, naming who confirms it and the backlog row that
tracks it - one row per file, so the work can be handed to a person. The marker leaves when
someone verifies the content. Decided in ADR-057; the tooling that writes, counts and shows
the markers follows in the next releases.

## 1.0.2 - 2026-09-02

**Releases tag themselves.** Since 1.0.0 a release was supposed to carry a tag, and both
tags so far were made by hand after the fact. Merging to `main` now creates the tag from
`VERSION`, with the release's changelog headings as its message, so "which tree does 1.0.2
name" has an answer nobody has to remember to give it.

**The site shows the version it can prove.** The number in the header is read from the
newest tag when the page loads, not written into the page at build time. It was written in
five places on the landing alone, which is how a page once shipped showing two different
versions at once; now there is nothing to keep in step, and a release stops rewriting the
whole documentation site to change one number.

## 1.0.0 - 2026-08-19

**The standard is stable.** The contract an adopting repository relies on - the numbered
rules, the manifest, the `.standards-version` bookmark with `self-verify` as its proof, and
the shipped guards - is now something a breaking change to costs a MAJOR version, not a
routine release. The standard stays living and latest stays the only target; what changes
is the promise attached to the number.

**The version history now says what the maturity actually was.** Earlier releases had
shipped under 1.0.x and 1.1.x numbers before the line had earned them. Rather than cut a
second, different 1.0.0 on top of that, the history was renumbered so the whole pre-stable
line reads as 0.8.x and 0.9.x - and this release is the only 1.0.0 there has ever been.
The rewrite is documented in the changelog header and in the genesis-history record, not
hidden.

**Releases are tagged from here.** Until today a version was a heading in the changelog;
now it is also a tag you can fetch, so "which tree does 1.0.0 name" has an exact answer.
Adopting repositories still track latest, never a tag.

**The week before the cut was adopters finding real holes.** A repository moving to the
newest version from inside its own adoption caught the guard suite assuming no repository
had ever adopted, a database-restore command that the write guard could not see, and a
consent question with no honest answer for "keep it, but anonymised" - all fixed in 0.9.25,
the tree this release stabilises. Asking the owner questions became a mechanism too:
adoption and specification interviews now go through a real question tool, with consent
asked where answers get kept.

Full developer changelog in `CHANGELOG.md`.

## 0.9.1 - 2026-08-10

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

**Under the hood**: five entries since 0.9.0, all from real usage rather than planned work.
Full developer changelog in `CHANGELOG.md`.

## 0.9.0 - 2026-08-10

**Tested at real scale, not just real codebases.** 0.8.13 proved the standard works on
live projects; this release ran it against a 13,591-file codebase with nineteen years of
history, and against a monorepo of thirteen independently-published packages, each with
its own changelog, changing on one branch. Both shapes are supported now, not worked
around.

**The standard can finally show its own adoption, not just claim one.** Every
`align-to-standards` run can now send one anonymous, disclosed signal when it finishes -
stack, standard version, how clean the result was, nothing that identifies which repo
sent it - and the landing page shows the running count. Nothing is asked, only stated,
and one environment variable turns it off for anyone who wants zero participation.

**Under the hood**: 125 entries across the week since 0.8.13, including a fix so a new
adopter's very first pull request no longer fails its own secret scan on a file the
standard shipped. Full developer changelog in `CHANGELOG.md`.

## 0.8.13 - 2026-08-03

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
