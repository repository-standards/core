# FAQ - the questions every adopter asks

Short answers first, links to the long version. This file is the middle of the funnel:
the landing page hooks, the FAQ unblocks, the docs teach.

**Which model should drive the transition?**
The strongest you have, at the highest thinking setting - fewer iterations, fewer
errors. The judgment gates (decisions, spec-depth calls) are where model quality shows.
Details: [adoption - which model](method/adoption.md).

**I only have a weaker model. Can it do this?**
Yes. The process is **re-runnable and lossless**: align resumes from measurement
(`self-verify`), what is done stays done, and every pass improves the repo. A weaker
model needs more passes and more of your attention at the judgment gates - but it
finishes the job. The falling drift number is your progress bar.

**My repo is years old and messy. Is it too late?**
No - brownfield is a first-class path: `assess -> align -> onboard`, in prioritized
waves, re-entered as many times as needed. A multi-year repo is not aligned in one PR
*by design*. Start: [adoption](method/adoption.md).

**Do I need Jira or a paid tracker?**
**No, and since 2026-08-02 you may not need a tracker at all.** Three postures, and the third
is new:

- **A tracker, bridged.** GitHub Issues by default (free, unlimited); Jira and Linear plug in
  as adapters behind the same one-way bridge. The repo holds intents, the tracker holds
  execution history (ADR-010).
- **In-repo, complete.** The pool, work sprints per team running in parallel, the person
  currently holding each item, blocking references, and a timeline that projects from measured
  throughput rather than estimates - all in markdown, all guarded
  ([ADR-028](decision-records/ADR-028-work-cycles-live-in-the-repo-and-bind-only-at-scale.md),
  [ADR-029](decision-records/ADR-029-measurement-forecasts-sizes-only-cold-start.md),
  [ADR-030](decision-records/ADR-030-the-current-holder-is-cycle-state-not-history.md)). A team
  that picks this needs no board and no wiki.
- **Both**, which is common: the repo for what is true, the tracker for what management already
  reads.

What in-repo deliberately does **not** give you: the history of who held an item before, per
person throughput, burndown charts, or time tracking. Those are a tracker's job and the
records say so rather than implying we forgot them. If you need them, use one - that is what
the adapters are for.

**I'm a solo developer. Isn't this enterprise ceremony?**
Adopt the **core profile**: what keeps knowledge alive (specs, records, backlog,
self-verify) without what carries it to people who are not in the room - contribution
mechanics, UX research, work sprints. Be clear about the size of that discount:
it is 9 manifest entries, not a different standard, and CI is **not** one of them - the
spec-guard workflow is required at every profile (R16). The flip is not a headcount: it is a
flag plus the measured delta, and it fires when work is handed off asynchronously, when
somebody contributes or reads status from outside the conversation, when there is a release
audience that is not you, or when you are designing for users you are not (ADR-011,
ADR-040): [adoption - profiles](method/adoption.md).

**What if I disagree with one of the standard's picks?**
Deviate deliberately: record a local superseding decision (ADR-004) and note the
exception in the manifest so updates never silently overwrite it. The paved road is a
default, not a cage.

**How is this different from Spec Kit, OpenSpec, BMAD, or Backstage?**
They are spec-driven development frameworks, and they are large and well maintained - as of
2026-08-02, Spec Kit had 125k stars, OpenSpec 63k and BMAD 51k, all pushed to within days.
If what you want is a spec workflow, those are the answer and this is not competing for that.

The difference is the unit. **They standardise how a change gets specified. This standardises
the repository** - and specifically four things none of them does: it records **technical and
business decisions**, it walks an **undocumented repo into line with a standard** rather than
into a workflow, that standard **keeps moving and your repo trues up to it** instead of
adopting a workflow once, and compliance comes out as **a number your CI asserts**.

**Is the brownfield walk unique? No - and it is still one of the best reasons to use this.**
OpenSpec's stated philosophy is *"built for brownfield not just greenfield"*, so "we work on
existing repos" is not on its own an answer to "why you". What differs is where the walk
*ends*: here an existing repo is brought into line with a **living standard it keeps trueing
up to**, with the decisions behind the code recorded as ADRs and BDRs, the capabilities
specced, the remainder queued as a backlog, and how far you still are from compliant reported
as a number. Elsewhere it ends with a spec workflow adopted.

So the honest form is that the destination is the differentiator, not the fact of walking.

The spec flow began as Spec Kit (MIT, provenance kept) and is now the standard's own extracted
engine - upstream improvements are cherry-picked at release (ADR-015).

**What about ProductSpec?**
The closest neighbour, and worth a straight answer rather than a dismissal.
[ProductSpec](https://github.com/gokulrajaram/ProductSpec) is *"an open standard for software
intent in the AI agent era"*: a schema-validated document format with a parser, a CLI, a
GitHub Action, an MCP server and agent skills, and it reaches further than a spec format
alone - decision traces, reconciliation, repo health.

The difference is what the unit is. **ProductSpec standardises the intent document and
validates it against a schema.** This standardises the *repository* - what a repo must
contain, how an existing one is walked into shape, and what compliance means as a number -
with prose specs held true by guards rather than by a schema. If you want a portable,
machine-checkable format for intent that travels between tools, ProductSpec is the more
direct answer and this is the wrong project to bend into that shape. If your problem is that
a whole repository has no decisions recorded, no adopted conventions and no way to tell how
far it has drifted, that is this one.

They are not mutually exclusive, and nothing here is borrowed from it - it is named because a
reader deserves to find it from us rather than discover we omitted it.

**How do I know it worked?**
`node scripts/self-verify.mjs` - compliance is a number, asserted in CI, against the
manifest for the state recorded in `.standards-version`. When the standard moves,
`update-to-latest` applies the delta and self-verify proves it again.

**What does drift 0 actually certify?**
Structure, not judgment. It checks that the recorded alignment state is well-formed and
consistent with the manifest, that every required file and required heading is present, and
that the shipped static guards exit zero. It does **not** check that your specs are good, that the decisions you should have
recorded were recorded, or that a port of the skills to a non-Claude agent is faithful -
those sit in the judgment tier, confirmed at review
([`self-verify.md`](method/self-verify.md) draws the line explicitly). Drift 0 is
the floor. A repo can be drift 0 and still sloppy; it cannot be drift 0 and structurally
missing the things the standard is built on.

**Who is using this?**
No public adopter yet - and that is the honest answer rather than a modest one. The mechanics
were run on the author's own private repos; there is no named repo you can inspect, no
measured before/after, and the project's own [backlog](../backlog.md) carries "an adoption you
can point at" as open work. The standard is on its first stable release line, tagged since
1.0.0 - everything before that resolved to the default branch. What you can check today is
the machinery: every guard in this repo is
dependency-free, runs in CI on every pull request, and you can run all of it yourself in a
clone before deciding anything. Adopt the mechanism because it holds when you test it, not
because of a logo.
