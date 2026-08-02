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
No. The default posture is **GitHub Issues** (free, unlimited). Jira (free up to 10
users) and Linear (free tier) plug in as adapters behind the same one-way bridge.
The repo holds intents; the tracker holds execution state (ADR-010).

**I'm a solo developer. Isn't this enterprise ceremony?**
Adopt the **core profile**: what keeps knowledge alive (specs, records, backlog,
self-verify) without what coordinates people (bridges, curated release notes, CI
gates). Flip to the scale profile when the second regular contributor arrives -
a flag plus the measured delta (ADR-011): [adoption - profiles](method/adoption.md).

**What if I disagree with one of the standard's picks?**
Deviate deliberately: record a local superseding decision (ADR-004) and note the
exception in the manifest so updates never silently overwrite it. The paved road is a
default, not a cage.

**How is this different from Spec Kit, OpenSpec, BMAD, or Backstage?**
Those give you a *workflow* or a *scaffold*. This gives your repo a **versioned
reference to true up to** - align, verify, drift as a number - plus a guided brownfield
transition. The spec flow began as Spec Kit (MIT, provenance kept) and is now the
standard's own extracted engine - upstream improvements are cherry-picked at release
(ADR-015).

**How do I know it worked?**
`node scripts/self-verify.mjs` - compliance is a number, asserted in CI, against the
version pinned in `.standards-version`. When the standard moves, `update-to-version`
applies the delta and self-verify proves it again.

**What does drift 0 actually certify?**
Structure, not judgment. It checks that the version pin is well-formed and matches, that
every required file and required heading is present, and that the shipped static guards exit
zero. It does **not** check that your specs are good, that the decisions you should have
recorded were recorded, or that a port of the skills to a non-Claude agent is faithful -
those sit in the judgment tier, confirmed at review
([`self-verify.md`](../standard/docs/self-verify.md) draws the line explicitly). Drift 0 is
the floor. A repo can be drift 0 and still sloppy; it cannot be drift 0 and structurally
missing the things the standard is built on.

**Who is using this?**
No public adopter yet - and that is the honest answer rather than a modest one. The mechanics
were run on the author's own private repos; there is no named repo you can inspect, no
measured before/after, and the project's own [backlog](../backlog.md) carries "an adoption you
can point at" as open work. There are no release tags yet either, so a fetch resolves to the
default branch. What you can check today is the machinery: every guard in this repo is
dependency-free, runs in CI on every pull request, and you can run all of it yourself in a
clone before deciding anything. Adopt the mechanism because it holds when you test it, not
because of a logo.
