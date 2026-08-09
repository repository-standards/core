# Open questions - decided, provisionally

Every entry here is a call the owner made on judgment, at the simplicity-vs-
universality boundary - good enough to ship, honestly held, and **actively open
to a better answer**. This is not indecision: each has a decision in force
(linked). It is an invitation: argue a better option in an issue or PR
referencing the entry. A winning challenge lands as a superseding record or rule
change, and the resolved entry is deleted - the resolution lives in the record
that settled it.

How this differs from the neighbors: an **ADR** records a fork taken; an
**idea** is a feature that may never ship; an open question is a standing
"I chose X, convince me of Y". One file per topic; entries that carry real
deliberation history keep it in an **Options weighed** section - for the future
maintainer who would otherwise re-derive it. (This was one flat file until it
outgrew itself - as its own meta entry predicted it would.)

**The index moved.** Every topic above is a `type: open-question` row in
[`backlog.md`](../../backlog.md) now (per
[ADR-046](../decision-records/ADR-046-backlog-is-the-one-index-open-questions-and-ideas-get-a-type.md)),
so the dashboard's Backlog tab shows all of them alongside build work and ideas
without opening this file. Each `backlog.md` row states the decision in force (or
that there is none) and the doubt in one line, and links back to the topic's file
here for the full argument - this folder still carries the deliberation, `backlog.md`
carries the listing.

## This is the front door for new maintainers

A single author decided every entry above, which is the honest weakness of this project.
Winning a challenge here is the most valuable contribution it takes - more than a feature,
because a rule this project got wrong propagates into every repo that adopts it.

You do not need to have used the standard to argue one. Each entry states the decision in
force, the doubt in one line, and - where there was real deliberation - the options already
weighed, so you can start from where the thinking stopped rather than from scratch. Bring
evidence from how you actually work; "we ran the other way for two years and here is what
broke" ends an argument that abstract reasoning cannot.

**If your expertise is a technology rather than the method**, this is the wrong repo to
spend it in: Layer 1 is stack-agnostic by rule, so a TypeScript or Node opinion cannot land
here no matter how right it is. It lands in
[repository-standards/node](https://github.com/repository-standards/node),
which owns its own picks and its own doubts. Same for any future stack - one repo per
technology, and each carries the argument for what it chose.
